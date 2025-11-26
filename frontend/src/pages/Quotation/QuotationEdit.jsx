import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSignature, FaEye, FaPlus } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import SignatureModal from "../../components/SignatureModal/SignatureModal";

const SERVICE_TYPE_DISPLAY = {
  localMove: "Local Move",
  internationalMove: "International Move",
  carExport: "Car Import and Export",
  storageServices: "Storage Services",
  logistics: "Logistics",
};

export default function QuotationEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isSignatureViewModalOpen, setIsSignatureViewModalOpen] = useState(false);

  const [pricingRanges, setPricingRanges] = useState([]);
  const [priceError, setPriceError] = useState("");
  const [destinationCity, setDestinationCity] = useState("");

  // Additional Charges
  const [additionalChargesPricing, setAdditionalChargesPricing] = useState([]);
  const [additionalChargesBreakdown, setAdditionalChargesBreakdown] = useState([]);
  const [chargeQuantities, setChargeQuantities] = useState({});

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    serialNo: "",
    date: today,
    client: "",
    mobile: "",
    email: "",
    serviceRequired: "",
    movingFrom: "",
    movingTo: "",
    moveDate: today,
    jobType: "Local",
    baseAmount: "",
    additionalChargesTotal: 0,
    amount: "",
    advance: "",
    includedServices: {},
    excludedServices: {},
  });

  // Fetch survey + quotation + additional charges
  useEffect(() => {
    const loadData = async () => {
      try {
        const surveyRes = await apiClient.get(`/surveys/${id}/`);
        const s = surveyRes.data;
        setSurvey(s);
        setDestinationCity(s.destination_addresses?.[0]?.city || "");

        const checkRes = await apiClient.get(`/quotation-create/check/?survey_id=${id}`);
        if (!checkRes.data.exists) {
          setError("No quotation found.");
          setLoading(false);
          return;
        }

        const qRes = await apiClient.get(`/quotation-create/${checkRes.data.quotation_id}/`);
        const q = qRes.data;
        setQuotation(q);

        const chargesRes = await apiClient.get("/quotation-additional-charges/");
        setAdditionalChargesPricing(chargesRes.data);

        const selectedServices = s.additional_services || [];
        const breakdown = selectedServices
          .map((service) => {
            const pricing = chargesRes.data.find(p => p.service?.id === service.id);
            if (!pricing) return null;

            const pricePerUnit = parseFloat(pricing.price_per_unit) || 0;
            const quantity = pricing.rate_type === "FIX" ? 1 : (parseInt(pricing.per_unit_quantity) || 1);
            const total = pricing.rate_type === "FIX" ? pricePerUnit : pricePerUnit * quantity;

            return {
              id: pricing.id,
              service_name: service.name,
              price_per_unit: pricePerUnit,
              quantity: quantity,
              rate_type: pricing.rate_type,
              total: parseFloat(total.toFixed(2)),
              currency: pricing.currency_name || "QAR",
            };
          })
          .filter(Boolean);

        setAdditionalChargesBreakdown(breakdown);

        const qtyMap = {};
        breakdown.forEach(c => {
          qtyMap[c.id] = c.quantity;
        });
        setChargeQuantities(qtyMap);

        const get = (p, f) => p ?? f ?? "—";
        setForm({
          serialNo: q.serial_no || "",
          date: q.date || today,
          client: get(s.full_name, s.enquiry?.fullName),
          mobile: get(s.phone_number, s.enquiry?.phoneNumber),
          email: get(s.email, s.enquiry?.email),
          serviceRequired: SERVICE_TYPE_DISPLAY[s.service_type] || "—",
          movingFrom: get(s.origin_address),
          movingTo: s.destination_addresses?.[0]?.address || "—",
          moveDate: s.packing_date_from || today,
          jobType: s.service_type === "localMove" ? "Local" : "International",
          baseAmount: "",
          additionalChargesTotal: breakdown.reduce((sum, c) => sum + c.total, 0),
          amount: q.amount?.toString() || "",
          advance: q.advance?.toString() || "",
          includedServices: {},
          excludedServices: {},
        });

        try {
          const sigRes = await apiClient.get(`/surveys/${s.survey_id}/signature/`);
          setHasSignature(true);
          setCurrentSignature(sigRes.data.signature_url);
        } catch {
          setHasSignature(false);
        }
      } catch (err) {
        setError("Failed to load quotation.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, today]);

  // Fetch volume pricing
  useEffect(() => {
    const fetchLivePricing = async () => {
      if (!destinationCity) return;
      try {
        const params = new URLSearchParams();
        params.append("pricing_city", destinationCity);
        params.append("move_type", "1");
        const res = await apiClient.get(`/price/active/?${params}`);
        const liveRates = res.data.map((item) => ({
          min: parseFloat(item.min_volume),
          max: parseFloat(item.max_volume),
          rate: parseFloat(item.rate),
          rateType: item.rate_type,
        }));
        setPricingRanges(liveRates);
        setPriceError("");
      } catch (err) {
        setPriceError(`No pricing found for ${destinationCity}.`);
        setPricingRanges([]);
      }
    };
    fetchLivePricing();
  }, [destinationCity]);

  const totalVolume =
    survey?.articles
      ?.reduce((sum, a) => sum + parseFloat(a.volume || 0) * (a.quantity || 0), 0)
      ?.toFixed(2) || "0.00";

  // Calculate base amount
  useEffect(() => {
    if (!totalVolume || totalVolume <= 0 || pricingRanges.length === 0) {
      setForm(prev => ({ ...prev, baseAmount: "" }));
      return;
    }

    const volume = parseFloat(totalVolume);
    const range = pricingRanges.find(r => volume >= r.min && volume <= r.max);

    if (!range) {
      setPriceError(`No pricing range found for volume ${volume} CBM`);
      setForm(prev => ({ ...prev, baseAmount: "" }));
      return;
    }

    const baseAmount = range.rateType === "flat"
      ? range.rate
      : range.rate * volume;

    setForm(prev => ({ ...prev, baseAmount: baseAmount.toFixed(2) }));
    setPriceError("");
  }, [totalVolume, pricingRanges]);

  // Recalculate when quantity changes
  useEffect(() => {
    const recalculated = additionalChargesBreakdown.map(item => {
      const qty = chargeQuantities[item.id] !== undefined ? chargeQuantities[item.id] : item.quantity;
      const total = item.rate_type === "FIX"
        ? item.price_per_unit
        : item.price_per_unit * qty;

      return { ...item, quantity: qty, total: parseFloat(total.toFixed(2)) };
    });

    const totalAdditional = recalculated.reduce((sum, item) => sum + item.total, 0);
    setForm(prev => ({ ...prev, additionalChargesTotal: totalAdditional }));
  }, [chargeQuantities, additionalChargesBreakdown]);

  // Final amount
  useEffect(() => {
    const base = parseFloat(form.baseAmount) || 0;
    const additional = form.additionalChargesTotal || 0;
    const total = (base + additional).toFixed(2);
    setForm(prev => ({ ...prev, amount: total }));
  }, [form.baseAmount, form.additionalChargesTotal]);

  const handleQuantityChange = (chargeId, value) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setChargeQuantities(prev => ({ ...prev, [chargeId]: qty }));
  };

  const handleUpdate = async () => {
    if (!form.amount || !quotation?.quotation_id) return alert("Invalid data");

    const payload = {
      serial_no: form.serialNo,
      date: form.date,
      amount: parseFloat(form.amount),
      advance: form.advance ? parseFloat(form.advance) : 0,
      included_services: Object.keys(form.includedServices).filter(k => form.includedServices[k]),
      excluded_services: Object.keys(form.excludedServices).filter(k => form.excludedServices[k]),
      additional_charges: additionalChargesBreakdown.map(c => ({
        service_id: c.id,
        quantity: chargeQuantities[c.id] !== undefined ? chargeQuantities[c.id] : c.quantity,
        total: c.total,
      })),
    };

    try {
      await apiClient.patch(`/quotation-create/${quotation.quotation_id}/`, payload);
      setMessage("Quotation updated successfully!");
      setTimeout(() => navigate("/quotation-list"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed");
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  if (error && !message) return <div className="text-center text-red-600 p-5">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={(file) => {
          if (!survey || !file) return;
          const formData = new FormData();
          formData.append("signature", file);
          setIsSignatureUploading(true);
          apiClient.post(`/surveys/${survey.survey_id}/upload-signature/`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          }).then(() => {
            setMessage("Signature updated successfully!");
            setHasSignature(true);
          }).catch(() => setError("Signature upload failed")).finally(() => {
            setIsSignatureUploading(false);
            setIsSignatureModalOpen(false);
          });
        }}
        customerName={form.client}
      />

      {isSignatureViewModalOpen && currentSignature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Digital Signature</h3>
              <button onClick={() => setIsSignatureViewModalOpen(false)} className="text-3xl">×</button>
            </div>
            <img src={currentSignature} alt="Signature" className="w-full rounded-lg border" />
            <button onClick={() => setIsSignatureViewModalOpen(false)} className="mt-4 w-full bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-3 rounded-lg">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-8 flex justify-between items-center">
          <h2 className="text-xl font-medium">Edit Quotation</h2>
          <button onClick={() => navigate(-1)} className="text-4xl hover:opacity-80">×</button>
        </div>

        {message && <div className="m-6 p-4 bg-green-100 text-green-700 rounded-lg text-center font-medium">{message}</div>}
        {error && <div className="m-6 p-4 bg-red-100 text-red-700 rounded-lg text-center">{error}</div>}

        <div className="p-8 space-y-8">
          {/* Pricing Location */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Pricing Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">Destination City</label>
                <input type="text" value={destinationCity || "Not specified"} readOnly className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">Country</label>
                <input type="text" value="Qatar" readOnly className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium" />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Quotation No.</label>
              <input type="text" value={form.serialNo} onChange={(e) => setForm({ ...form, serialNo: e.target.value })} className="w-full rounded-lg border-2 border-gray-300 px-4 py-3" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border-2 border-gray-300 px-4 py-3" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {["Client Name", "Mobile", "Email"].map((label, i) => (
              <div key={i}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input type="text" value={[form.client, form.mobile, form.email][i]} readOnly className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50" />
              </div>
            ))}
          </div>

          {/* Additional Services - Editable */}
          {additionalChargesBreakdown.length > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-2xl font-bold">+</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-yellow-900">Additional Services</h3>
                  <p className="text-sm text-yellow-700">Edit quantities below</p>
                </div>
              </div>

              <div className="space-y-4">
                {additionalChargesBreakdown.map((charge) => (
                  <div key={charge.id} className="bg-white p-5 rounded-lg border-2 border-yellow-300 shadow">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800">{charge.service_name}</p>
                        <p className="text-sm text-gray-600">
                          {charge.price_per_unit.toFixed(2)} {charge.currency} per unit
                          {charge.rate_type === "FIX" && " (Fixed)"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {charge.rate_type !== "FIX" && (
                          <>
                            <label className="text-sm font-medium">Qty:</label>
                            <input
                              type="number"
                              min="0"
                              value={chargeQuantities[charge.id] !== undefined ? chargeQuantities[charge.id] : charge.quantity}
                              onChange={(e) => handleQuantityChange(charge.id, e.target.value)}
                              className="w-20 px-3 py-2 border-2 border-yellow-400 rounded text-center"
                            />
                          </>
                        )}
                        <p className="text-xl font-bold text-orange-700">
                          = {charge.total.toFixed(2)} {charge.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-5 bg-orange-100 rounded-lg border-2 border-orange-500">
                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold text-orange-900">Total Additional Charges</p>
                  <p className="text-3xl font-bold text-orange-800">
                    {form.additionalChargesTotal.toFixed(2)} QAR
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quotation Breakdown */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
            <h3 className="text-xl font-medium text-center mb-4">Quotation Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <div>
                  <span className="text-sm text-gray-600">Base Amount (Volume Pricing)</span>
                  <div className="text-xs text-gray-500">{totalVolume} CBM × {destinationCity}</div>
                </div>
                <span className="text-2xl font-bold text-blue-700">{form.baseAmount || "0.00"} QAR</span>
              </div>

              {form.additionalChargesTotal > 0 && (
                <div className="flex justify-between items-center pb-3 border-b">
                  <div>
                    <span className="text-sm text-gray-600">Additional Services</span>
                    <div className="text-xs text-gray-500">{additionalChargesBreakdown.length} service(s)</div>
                  </div>
                  <span className="text-2xl font-bold text-purple-700">+ {form.additionalChargesTotal.toFixed(2)} QAR</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <span className="text-2xl font-bold text-gray-800">Total Quotation Amount</span>
                <span className="text-4xl font-bold text-green-600">{form.amount || "0.00"} QAR</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block font-medium text-sm mb-1">Total Amount</label>
              <input type="text" readOnly value={form.amount ? `${form.amount} QAR` : ""} className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-blue-50 font-bold text-blue-700" />
            </div>
            <div>
              <label className="block font-medium text-sm mb-1">Advance</label>
              <input
                type="number"
                step="0.01"
                value={form.advance}
                onChange={(e) => setForm({ ...form, advance: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3"
              />
            </div>
            <div>
              <label className="block font-medium text-sm mb-1">Balance</label>
              <input
                type="text"
                readOnly
                value={form.amount && form.advance ? `${(parseFloat(form.amount) - parseFloat(form.advance)).toFixed(2)} QAR` : ""}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-green-50 font-bold text-green-700"
              />
            </div>
          </div>

          {/* Digital Signature */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-lg mb-3">Digital Signature</h3>
            <div className="bg-gray-50 p-6 rounded-lg border flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {hasSignature ? "Customer has digitally signed this quotation" : "Add customer signature"}
              </p>
              <div className="flex gap-3">
                {hasSignature && (
                  <button onClick={() => setIsSignatureViewModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                    <FaEye /> View
                  </button>
                )}
                <button
                  onClick={() => setIsSignatureModalOpen(true)}
                  disabled={isSignatureUploading}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isSignatureUploading ? "bg-gray-400 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
                >
                  <FaPlus /> {isSignatureUploading ? "Uploading..." : "Change"}
                </button>
              </div>
            </div>
          </div>

          {/* Update Button */}
          <div className="text-center pt-4">
            <button
              onClick={handleUpdate}
              disabled={!form.amount || priceError}
              className={`w-full max-w-md mx-auto py-4 px-8 text-lg font-bold rounded-lg shadow-lg transition transform ${
                !form.amount || priceError
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:from-[#3a586d] hover:to-[#54738a] hover:scale-105"
              }`}
            >
              UPDATE QUOTATION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}