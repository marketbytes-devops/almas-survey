import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import SignatureModal from "../../components/SignatureModal/SignatureModal";
import { FaArrowLeft } from "react-icons/fa"; // 🔥 ADDED BACK ICON

const SERVICE_TYPE_DISPLAY = {
  localMove: "Local Move",
  internationalMove: "International Move",
  carExport: "Car Import and Export",
  storageServices: "Storage Services",
  logistics: "Logistics",
};

export default function QuotationCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [pricingRanges, setPricingRanges] = useState([]);
  const [dropdownData, setDropdownData] = useState({ currencies: [] });
  const [priceError, setPriceError] = useState("");
  const [destinationCity, setDestinationCity] = useState("");

  // Dynamic Includes & Excludes
  const [dynamicIncludes, setDynamicIncludes] = useState([]);
  const [dynamicExcludes, setDynamicExcludes] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // 🔥 UPDATED: Additional Charges - Only survey selected services with pricing
  const [additionalCharges, setAdditionalCharges] = useState([]);

  const [form, setForm] = useState({
    serialNo: "1001",
    date: today,
    client: "",
    mobile: "",
    email: "",
    serviceRequired: "",
    movingFrom: "",
    movingTo: "",
    moveDate: today,
    jobType: "Local",
    baseAmount: "", // Base amount from volume pricing
    additionalChargesTotal: 0, // Total from additional services
    amount: "", // Final total amount
    advance: "",
    includedServices: {},
    excludedServices: {},
  });

  // 🔥 ADDED: Track if form has been submitted to prevent auto-save on back
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch survey data
  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await apiClient.get(`/surveys/${id}/`);
        const s = res.data;
        setSurvey(s);

        const destCity = s.destination_addresses?.[0]?.city || "";
        setDestinationCity(destCity);

        const get = (primary, fallback) => primary ?? fallback ?? "—";
        setForm((prev) => ({
          ...prev,
          client: get(s.full_name, s.enquiry?.fullName),
          mobile: get(s.phone_number, s.enquiry?.phoneNumber),
          email: get(s.email, s.enquiry?.email),
          serviceRequired:
            SERVICE_TYPE_DISPLAY[s.service_type] ||
            SERVICE_TYPE_DISPLAY[s.enquiry?.serviceType] ||
            "—",
          movingFrom: get(s.origin_address),
          movingTo: s.destination_addresses?.[0]?.address || "—",
          moveDate: s.packing_date_from || today,
          jobType: s.service_type === "localMove" ? "Local" : "International",
        }));
      } catch (err) {
        setError("Failed to load survey data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [id, today]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const currenciesRes = await apiClient.get("/currencies/");
        setDropdownData({
          currencies: currenciesRes.data || [],
        });
      } catch (err) {
        console.error("Failed to load currencies:", err);
        setDropdownData({ currencies: [] });
      }
    };
    fetchDropdownData();
  }, []);

  // 🔥 UPDATED: Fetch Additional Charges for Survey-Selected Services Only
  useEffect(() => {
    const fetchAdditionalCharges = async () => {
      try {
        const chargesRes = await apiClient.get("/quotation-additional-charges/");
        console.log("✅ All pricing charges:", chargesRes.data);

        const surveyRes = await apiClient.get(`/surveys/${id}/`);
        const surveyData = surveyRes.data;
        const selectedServiceIds = surveyData.additional_services?.map((service) => service.id) || [];

        console.log("✅ Survey selected service IDs:", selectedServiceIds);
        console.log("✅ Survey selected services:", surveyData.additional_services);

        // Filter: Only include charges for services that were selected in the survey
        const filteredCharges = chargesRes.data.filter((charge) =>
          selectedServiceIds.includes(charge.service.id)
        );

        console.log("✅ Filtered additional charges for quotation:", filteredCharges);
        setAdditionalCharges(filteredCharges);
      } catch (err) {
        console.error("❌ Failed to load additional charges:", err);
      }
    };

    if (id) {
      fetchAdditionalCharges();
    }
  }, [id]);

  // Fetch pricing
  useEffect(() => {
    const fetchLivePricing = async () => {
      if (!destinationCity) {
        setPricingRanges([]);
        return;
      }
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
        console.error("Failed to fetch pricing:", err);
        setPriceError(`No pricing found for ${destinationCity}. Please contact administrator.`);
        setPricingRanges([]);
      }
    };
    fetchLivePricing();
  }, [destinationCity]);

  // Fetch Includes & Excludes
  useEffect(() => {
    const fetchIncludesExcludes = async () => {
      try {
        setLoadingServices(true);
        const [includeRes, excludeRes] = await Promise.all([
          apiClient.get("/inclusion-exclusion/?type=include"),
          apiClient.get("/inclusion-exclusion/?type=exclude"),
        ]);
        setDynamicIncludes(includeRes.data);
        setDynamicExcludes(excludeRes.data);
      } catch (err) {
        console.error("Failed to load includes/excludes:", err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchIncludesExcludes();
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      includedServices: dynamicIncludes.reduce(
        (acc, item) => ({
          ...acc,
          [item.id]: prev.includedServices[item.id] || false,
        }),
        {}
      ),
      excludedServices: dynamicExcludes.reduce(
        (acc, item) => ({
          ...acc,
          [item.id]: prev.excludedServices[item.id] || false,
        }),
        {}
      ),
    }));
  }, [dynamicIncludes, dynamicExcludes]);

  const totalVolume =
    survey?.articles
      ?.reduce(
        (sum, a) => sum + parseFloat(a.volume || 0) * (a.quantity || 0),
        0
      )
      ?.toFixed(2) || "0.00";

  // 🔥 Calculate Base Amount from Volume Pricing
  useEffect(() => {
    if (!totalVolume || totalVolume <= 0 || pricingRanges.length === 0) {
      setForm((prev) => ({ ...prev, baseAmount: "", amount: "" }));
      return;
    }

    const volume = parseFloat(totalVolume);
    const applicableRange = pricingRanges.find(
      (r) => volume >= r.min && volume <= r.max
    );

    if (!applicableRange) {
      setPriceError(`No pricing range found for volume ${volume} CBM in ${destinationCity}.`);
      setForm((prev) => ({ ...prev, baseAmount: "", amount: "" }));
      return;
    }

    const calculatedBaseAmount =
      applicableRange.rateType === "flat"
        ? applicableRange.rate
        : applicableRange.rate * volume;

    setForm((prev) => ({
      ...prev,
      baseAmount: calculatedBaseAmount.toFixed(2),
    }));
    setPriceError("");
  }, [totalVolume, pricingRanges, destinationCity]);

  // 🔥 UPDATED: Calculate Additional Charges Total - Only for Survey Selected Services
  useEffect(() => {
    let additionalTotal = 0;

    additionalCharges.forEach((charge) => {
      const quantity = charge.per_unit_quantity || 1;
      const price = charge.price_per_unit || 0;
      additionalTotal += price * quantity;
    });

    console.log("💰 Additional charges calculation:", {
      chargesCount: additionalCharges.length,
      total: additionalTotal,
      charges: additionalCharges.map((c) => ({
        service: c.service.name,
        price: c.price_per_unit,
        quantity: c.per_unit_quantity,
        subtotal: c.price_per_unit * (c.per_unit_quantity || 1),
      })),
    });

    setForm((prev) => ({
      ...prev,
      additionalChargesTotal: additionalTotal,
    }));
  }, [additionalCharges]);

  // 🔥 Calculate Final Total Amount (Base + Additional)
  useEffect(() => {
    const base = parseFloat(form.baseAmount) || 0;
    const additional = form.additionalChargesTotal || 0;
    const total = base + additional;

    setForm((prev) => ({
      ...prev,
      amount: total > 0 ? total.toFixed(2) : "",
    }));
  }, [form.baseAmount, form.additionalChargesTotal]);

  // 🔥 ADDED: Manual Back Button Handler - No Save
  const handleManualBack = () => {
    console.log("🚫 Manual back clicked - navigating without saving");
    navigate("/quotation-list");
  };

  const openSignatureModal = () => setIsSignatureModalOpen(true);

  const handleSignatureSave = async (file) => {
    if (!survey || !file) return;
    const formData = new FormData();
    formData.append("signature", file);
    setIsSignatureUploading(true);
    try {
      await apiClient.post(
        `/surveys/${survey.survey_id}/upload-signature/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setMessage("Digital signature uploaded successfully");
      setSurvey((prev) => ({ ...prev, signature_uploaded: true }));
    } catch (err) {
      setError("Signature upload failed.");
    } finally {
      setIsSignatureUploading(false);
      setIsSignatureModalOpen(false);
    }
  };

  // 🔥 UPDATED: Handle Create - Only save when this is called
  const handleCreate = async () => {
    if (!form.amount) return alert("Amount is not calculated.");
    if (priceError) return alert(priceError);

    const payload = {
      survey: parseInt(survey.id),
      serial_no: form.serialNo,
      date: form.date,
      amount: parseFloat(form.amount),
      advance: form.advance ? parseFloat(form.advance) : 0,
      included_services: Object.keys(form.includedServices).filter(
        (k) => form.includedServices[k]
      ),
      excluded_services: Object.keys(form.excludedServices).filter(
        (k) => form.excludedServices[k]
      ),
      additional_charges: additionalCharges.map((charge) => ({
        service_id: charge.service.id,
        service_name: charge.service.name,
        quantity: charge.per_unit_quantity || 1,
        price_per_unit: charge.price_per_unit,
        currency: charge.currency,
        total: charge.price_per_unit * (charge.per_unit_quantity || 1),
      })),
    };

    try {
      setIsSubmitted(true); // 🔥 MARK AS SUBMITTED
      await apiClient.post("/quotation-create/", payload);
      alert("Quotation created successfully!");
      navigate("/quotation-list");
    } catch (err) {
      setIsSubmitted(false); // 🔥 RESET IF FAILED
      alert("Error: " + (err.response?.data?.detail || "Failed to create quotation."));
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  if (error) return <div className="text-center text-red-600 p-5">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
        customerName={form.client}
      />

      <div className="mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        {/* 🔥 UPDATED: Header with Manual Back Button */}
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* 🔥 MANUAL BACK BUTTON */}
            <button
              onClick={handleManualBack}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
              title="Go back without saving"
            >
              <FaArrowLeft className="w-4 h-4" />
              Back to List
            </button>
            <h2 className="text-xl font-medium">Create Quotation</h2>
          </div>
          <button
            onClick={handleManualBack} // 🔥 ALSO USE MANUAL BACK FOR CLOSE
            className="text-4xl hover:opacity-80"
            title="Close without saving"
          >
            ×
          </button>
        </div>

        {message && (
          <div className="m-6 p-4 bg-green-100 text-green-700 rounded-lg text-center font-medium">
            {message}
          </div>
        )}

        <div className="p-8 space-y-8">
          {/* Pricing Location */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Pricing Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">Destination City</label>
                <input
                  type="text"
                  value={destinationCity || "Not specified"}
                  readOnly
                  className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">Country</label>
                <input
                  type="text"
                  value="Qatar"
                  readOnly
                  className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Basic Fields */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Quotation No.</label>
              <input
                type="text"
                value={form.serialNo}
                onChange={(e) => setForm({ ...form, serialNo: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {["Client Name", "Mobile", "Email"].map((label, i) => (
              <div key={i}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input
                  type="text"
                  value={[form.client, form.mobile, form.email][i]}
                  readOnly
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50"
                />
              </div>
            ))}
          </div>

          {/* 🔥 UPDATED: Additional Charges Display - Only Survey Selected Services */}
          {additionalCharges.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6">
              <h3 className="text-xl font-bold text-purple-900 mb-4">💼 Additional Services</h3>
              <p className="text-sm text-purple-700 mb-4">
                Automatically included from survey selection with pricing settings
              </p>

              <div className="space-y-3">
                {additionalCharges.map((charge) => {
                  const currencyName = charge.currency_name || "QAR";
                  const quantity = charge.per_unit_quantity || 1;
                  const subtotal = charge.price_per_unit * quantity;

                  return (
                    <div key={charge.id} className="bg-white border-2 border-purple-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-800">{charge.service.name}</div>
                          <div className="text-sm text-gray-600">
                            {charge.price_per_unit} {currencyName} × {quantity} unit(s)
                          </div>
                          <div className="text-xs text-gray-500 capitalize mt-1">
                            Rate: {charge.rate_type?.toLowerCase() || "fix"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-700">
                            = {subtotal.toFixed(2)} {currencyName}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Survey Additional Services Info */}
          {survey?.additional_services?.length > 0 && additionalCharges.length === 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6">
              <h3 className="text-lg font-bold text-yellow-900 mb-3">📋 Services Requested in Survey</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {survey.additional_services.map((service) => (
                  <div key={service.id} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-yellow-300">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-yellow-700 mt-3">
                Note: These services were selected in the survey but no pricing has been configured yet. 
                Please add pricing in the Additional Settings tab.
              </p>
            </div>
          )}

          {/* Pricing Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
            <h3 className="text-xl font-medium text-center mb-4">💰 Quotation Breakdown</h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                <div>
                  <span className="text-sm text-gray-600">Base Amount (Volume Pricing)</span>
                  <div className="text-xs text-gray-500">{totalVolume} CBM × {destinationCity}</div>
                </div>
                <span className="text-2xl font-bold text-blue-700">{form.baseAmount || "0.00"} QAR</span>
              </div>

              {form.additionalChargesTotal > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                  <div>
                    <span className="text-sm text-gray-600">Additional Services</span>
                    <div className="text-xs text-gray-500">
                      {additionalCharges.length} service(s) selected in survey
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-purple-700">+ {form.additionalChargesTotal.toFixed(2)} QAR</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-semibold text-gray-800">Total Quotation Amount</span>
                <span className="text-4xl font-bold text-green-600">{form.amount || "0.00"} QAR</span>
              </div>
            </div>

            {priceError && (
              <div className="mt-4 bg-red-100 border-2 border-red-400 rounded-lg p-4 text-center text-red-700 font-medium">
                {priceError}
              </div>
            )}
          </div>

          {/* Includes/Excludes */}
          <div className="grid grid-cols-2 border-2 border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-700 text-white p-4 text-center font-medium">Service Includes</div>
            <div className="bg-red-700 text-white p-4 text-center font-medium">Service Excludes</div>

            <div className="p-6 space-y-4 bg-gray-50 max-h-80 overflow-y-auto">
              {dynamicIncludes.map((service) => (
                <label key={service.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.includedServices[service.id] || false}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        includedServices: {
                          ...form.includedServices,
                          [service.id]: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="text-sm font-medium">• {service.text}</span>
                </label>
              ))}
            </div>

            <div className="p-6 space-y-4 bg-red-50 border-l-2 border-red-200 max-h-80 overflow-y-auto">
              {dynamicExcludes.map((service) => (
                <label key={service.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.excludedServices[service.id] || false}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        excludedServices: {
                          ...form.excludedServices,
                          [service.id]: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5 text-red-600"
                  />
                  <span className="text-sm font-medium">• {service.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block font-medium text-sm mb-1">Total Amount</label>
              <input
                type="text"
                readOnly
                value={form.amount ? `${form.amount} QAR` : ""}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-blue-50 font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="block font-medium text-sm mb-1">Advance</label>
              <input
                type="number"
                step="0.01"
                value={form.advance}
                onChange={(e) => setForm({ ...form, advance: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3"
                placeholder="0.00"
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
                {survey?.signature_uploaded ? "✓ Signature added" : "Add customer signature"}
              </p>
              <button
                onClick={openSignatureModal}
                disabled={isSignatureUploading || survey?.signature_uploaded}
                className={`px-6 py-3 rounded-lg font-medium ${
                  survey?.signature_uploaded || isSignatureUploading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {isSignatureUploading
                  ? "Uploading..."
                  : survey?.signature_uploaded
                  ? "Signature Added"
                  : "Add Signature"}
              </button>
            </div>
          </div>

          {/* 🔥 UPDATED: Action Buttons */}
          <div className="flex gap-4 pt-4">
            {/* Back Button - No Save */}

            {/* Create Button - With Save */}
            <button
              onClick={handleCreate}
              disabled={!form.amount || priceError}
              className={`flex-1 py-4 px-8 text-lg font-bold rounded-lg shadow-lg transition ${
                !form.amount || priceError
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:scale-105"
              }`}
            >
              CREATE QUOTATION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}