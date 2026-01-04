import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEye, FaPlus } from "react-icons/fa";
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

  const [dynamicIncludes, setDynamicIncludes] = useState([]);
  const [dynamicExcludes, setDynamicExcludes] = useState([]);

  const [allServices, setAllServices] = useState([]);
  const [serviceSelections, setServiceSelections] = useState({});

  const [additionalChargesBreakdown, setAdditionalChargesBreakdown] = useState([]);
  const [chargeQuantities, setChargeQuantities] = useState({});

  const today = new Date().toISOString().split("T")[0];

  const safeParse = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const [form, setForm] = useState({
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
    discount: "",
    finalAmount: "",
    advance: "",
    balance: "",
    includedServices: {},
    excludedServices: {},
  });

  useEffect(() => {
    const fetchIncludesExcludes = async () => {
      try {
        const [includeRes, excludeRes] = await Promise.all([
          apiClient.get("/inclusion-exclusion/?type=include"),
          apiClient.get("/inclusion-exclusion/?type=exclude"),
        ]);
        setDynamicIncludes(includeRes.data);
        setDynamicExcludes(excludeRes.data);
      } catch (err) {
        console.error("Failed to fetch includes/excludes:", err);
      }
    };
    fetchIncludesExcludes();
  }, []);

  useEffect(() => {
    const fetchAllServices = async () => {
      try {
        const res = await apiClient.get("/services/");
        const services = Array.isArray(res.data.results) ? res.data.results : res.data;
        setAllServices(services);
      } catch (err) {
        console.error("Failed to fetch services:", err);
      }
    };
    fetchAllServices();
  }, []);

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
        const selectedServices = s.additional_services || [];
        const breakdown = selectedServices
          .map((service) => {
            const pricing = chargesRes.data.find((p) => p.service?.id === service.id);
            if (!pricing) return null;

            const pricePerUnit = parseFloat(pricing.price_per_unit) || 0;
            const quantity = pricing.rate_type === "FIX" ? 1 : parseInt(pricing.per_unit_quantity) || 1;
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
        breakdown.forEach((c) => {
          qtyMap[c.id] = c.quantity;
        });
        setChargeQuantities(qtyMap);

        const get = (p, f) => p ?? f ?? "—";

        const includedServices = {};
        dynamicIncludes.forEach((service) => {
          includedServices[service.id] = q.included_services?.includes(service.id) || false;
        });
        const excludedServices = {};
        dynamicExcludes.forEach((service) => {
          excludedServices[service.id] = q.excluded_services?.includes(service.id) || false;
        });

        const serviceSelectionsInit = {};
        if (q.selected_services) {
          q.selected_services.forEach((serviceId) => {
            serviceSelectionsInit[serviceId] = true;
          });
        }
        setServiceSelections(serviceSelectionsInit);

        // Use backend values first (reliable after serializer fix)
        const totalAmount = safeParse(q.amount);
        const discount = safeParse(q.discount);
        const advance = safeParse(q.advance);
        const finalAmount = safeParse(q.final_amount);
        const balance = safeParse(q.balance);

        setForm({
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
          amount: totalAmount.toFixed(2),
          discount: discount.toString(),
          finalAmount: finalAmount.toFixed(2),
          advance: advance.toString(),
          balance: balance.toFixed(2),
          includedServices,
          excludedServices,
        });

        const sigRes = await apiClient.get(`/quotation-create/${q.quotation_id}/signature/`);
        setHasSignature(true);
        setCurrentSignature(sigRes.data.signature_url);
      } catch (err) {
        if (err.response?.status !== 404) setError("Failed to load quotation.");
        setHasSignature(false);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, today, dynamicIncludes, dynamicExcludes]);

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

  useEffect(() => {
    if (!totalVolume || totalVolume <= 0 || pricingRanges.length === 0) {
      setForm((prev) => ({ ...prev, baseAmount: "" }));
      return;
    }

    const volume = parseFloat(totalVolume);
    const range = pricingRanges.find((r) => volume >= r.min && volume <= r.max);

    if (!range) {
      setPriceError(`No pricing range found for volume ${volume} CBM`);
      setForm((prev) => ({ ...prev, baseAmount: "" }));
      return;
    }

    const baseAmount = range.rateType === "flat" ? range.rate : range.rate * volume;
    setForm((prev) => ({ ...prev, baseAmount: baseAmount.toFixed(2) }));
    setPriceError("");
  }, [totalVolume, pricingRanges]);

  useEffect(() => {
    const recalculated = additionalChargesBreakdown.map((item) => {
      const qty = chargeQuantities[item.id] !== undefined ? chargeQuantities[item.id] : item.quantity;
      const total = item.rate_type === "FIX" ? item.price_per_unit : item.price_per_unit * qty;
      return { ...item, quantity: qty, total: parseFloat(total.toFixed(2)) };
    });

    const totalAdditional = recalculated.reduce((sum, item) => sum + item.total, 0);
    setAdditionalChargesBreakdown(recalculated);
    setForm((prev) => ({ ...prev, additionalChargesTotal: totalAdditional }));
  }, [chargeQuantities]);

  // Use memoized computed values (safe, no loop)
  const computedValues = useMemo(() => {
    const base = safeParse(form.baseAmount);
    const additional = safeParse(form.additionalChargesTotal);
    const totalBeforeDiscount = base + additional;

    const discount = safeParse(form.discount);
    const final = Math.max(0, totalBeforeDiscount - discount);

    const advance = safeParse(form.advance);
    const balance = Math.max(0, final - advance);

    return {
      amount: totalBeforeDiscount.toFixed(2),
      finalAmount: final.toFixed(2),
      balance: balance.toFixed(2),
    };
  }, [form.baseAmount, form.additionalChargesTotal, form.discount, form.advance]);

  // Prefer backend values first (reliable), fallback to computed
  const displayAmount = safeParse(quotation?.amount) > 0 ? safeParse(quotation?.amount).toFixed(2) : computedValues.amount;
  const displayFinal = safeParse(quotation?.final_amount) > 0 ? safeParse(quotation?.final_amount).toFixed(2) : computedValues.finalAmount;
  const displayBalance = safeParse(quotation?.balance) > 0 ? safeParse(quotation?.balance).toFixed(2) : computedValues.balance;

  const handleQuantityChange = (chargeId, value) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setChargeQuantities((prev) => ({ ...prev, [chargeId]: qty }));
  };

  const handleUpdate = async () => {
    if (!displayAmount || !displayFinal || !quotation?.quotation_id) {
      alert("Please ensure all pricing fields are valid.");
      return;
    }

    const payload = {
      date: form.date,
      amount: safeParse(displayAmount), // Use the displayed (reliable) value
      discount: safeParse(form.discount),
      advance: safeParse(form.advance),
      included_services: Object.keys(form.includedServices).filter((k) => form.includedServices[k]),
      excluded_services: Object.keys(form.excludedServices).filter((k) => form.excludedServices[k]),
      additional_charges: additionalChargesBreakdown.map((c) => ({
        service_id: c.id,
        quantity: chargeQuantities[c.id] !== undefined ? chargeQuantities[c.id] : c.quantity,
        total: c.total,
      })),
      selected_services: Object.keys(serviceSelections)
        .filter((key) => serviceSelections[key])
        .map((key) => parseInt(key)),
    };

    console.log("PATCH Payload:", payload); // Debug

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
    <div className="bg-gray-100 min-h-screen rounded-lg">
      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={(file) => {
          if (!quotation?.quotation_id || !file) return;
          const formData = new FormData();
          formData.append("signature", file);
          setIsSignatureUploading(true);
          apiClient
            .post(`/quotation-create/${quotation.quotation_id}/upload-signature/`, formData)
            .then(() => {
              setMessage("Signature updated successfully!");
              setHasSignature(true);
              apiClient
                .get(`/quotation-create/${quotation.quotation_id}/signature/`)
                .then((res) => setCurrentSignature(res.data.signature_url));
            })
            .catch(() => setError("Signature upload failed"))
            .finally(() => {
              setIsSignatureUploading(false);
              setIsSignatureModalOpen(false);
            });
        }}
        customerName={form.client}
      />

      {/* Signature View Modal */}
      {isSignatureViewModalOpen && currentSignature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium">Digital Signature</h3>
              <button onClick={() => setIsSignatureViewModalOpen(false)} className="text-3xl">×</button>
            </div>
            <img src={currentSignature} alt="Signature" className="w-full rounded-lg border" />
            <button
              onClick={() => setIsSignatureViewModalOpen(false)}
              className="mt-6 w-full bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-8 flex justify-between items-center rounded-t-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/quotation-list")}
            className="flex items-center gap-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
          >
            <FaArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Back to List</span>
          </button>
          <h2 className="text-lg font-medium">Edit Quotation</h2>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="mx-4 mt-4 p-4 bg-green-100 text-green-700 rounded-lg text-center font-medium">
          {message}
        </div>
      )}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-100 text-red-700 rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      <div className="p-4 space-y-10">
        {/* Pricing Location */}
        <div className="bg-[#4c7085]/5 border border-[#4c7085]/30 rounded-xl p-6">
          <h3 className="text-lg font-medium text-[#4c7085] mb-4">Pricing Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#4c7085] mb-2">Destination City</label>
              <input
                type="text"
                value={destinationCity || "Not specified"}
                readOnly
                className="w-full rounded-lg border border-[#6b8ca3]/50 bg-white px-4 py-3 text-sm text-[#4c7085] font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4c7085] mb-2">Country</label>
              <input
                type="text"
                value="Qatar"
                readOnly
                className="w-full rounded-lg border border-[#6b8ca3]/50 bg-white px-4 py-3 text-sm text-[#4c7085] font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Quotation Date */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4c7085] mb-2">Quotation Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg border-2 border-[#4c7085] px-4 py-3 text-sm text-[#4c7085] focus:outline-none"
            />
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4c7085] mb-2">Client Name</label>
            <input
              type="text"
              value={form.client}
              readOnly
              className="w-full rounded-lg border-2 border-[#4c7085] px-4 py-3 bg-gray-100 text-sm text-[#4c7085] font-medium cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4c7085] mb-2">Mobile</label>
            <input
              type="text"
              value={form.mobile}
              readOnly
              className="w-full rounded-lg border-2 border-[#4c7085] px-4 py-3 bg-gray-100 text-sm text-[#4c7085] font-medium cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4c7085] mb-2">Email</label>
            <input
              type="text"
              value={form.email}
              readOnly
              className="w-full rounded-lg border-2 border-[#4c7085] px-4 py-3 bg-gray-100 text-sm text-[#4c7085] font-medium cursor-not-allowed"
            />
          </div>
        </div>

        {/* Additional Services */}
        {additionalChargesBreakdown.length > 0 && (
          <div className="bg-[#6b8ca3]/5 border-2 border-[#6b8ca3]/30 rounded-xl p-6">
            <h3 className="text-xl font-medium text-[#4c7085] mb-4">Additional Services</h3>
            <div className="space-y-4">
              {additionalChargesBreakdown.map((charge) => {
                const quantity =
                  chargeQuantities[charge.id] !== undefined
                    ? chargeQuantities[charge.id]
                    : charge.quantity;
                const subtotal =
                  charge.rate_type === "FIX"
                    ? charge.price_per_unit
                    : charge.price_per_unit * quantity;

                return (
                  <div
                    key={charge.id}
                    className="bg-white border border-[#4c7085]/20 rounded-lg p-5"
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="font-medium text-gray-800">{charge.service_name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {charge.price_per_unit} {charge.currency} × {quantity} unit(s)
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {charge.rate_type !== "FIX" && (
                          <>
                            <label className="text-sm font-medium text-[#4c7085]">Qty:</label>
                            <input
                              type="number"
                              min="0"
                              value={quantity}
                              onChange={(e) => handleQuantityChange(charge.id, e.target.value)}
                              className="w-20 px-3 py-1 border border-[#4c7085] rounded text-sm"
                            />
                          </>
                        )}
                        <div className="text-right text-xl font-medium text-[#4c7085]">
                          {subtotal.toFixed(2)} {charge.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Service Includes/Excludes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 border-2 border-[#4c7085]/30 rounded-xl overflow-hidden">
          <div className="bg-[#4c7085] text-white p-5 text-center font-medium text-lg">Service Includes</div>
          <div className="bg-red-700 text-white p-5 text-center font-medium text-lg">Service Excludes</div>

          <div className="p-4 bg-gray-100 max-h-96 overflow-y-auto space-y-4">
            {dynamicIncludes.map((service) => (
              <label key={service.id} className="flex items-center space-x-4 cursor-pointer">
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
                  className="w-4 h-4 text-[#4c7085] rounded focus:ring-[#4c7085]"
                />
                <span className="text-base font-medium">{service.text}</span>
              </label>
            ))}
          </div>

          <div className="p-4 bg-red-50 max-h-96 overflow-y-auto space-y-4">
            {dynamicExcludes.map((service) => (
              <label key={service.id} className="flex items-center space-x-4 cursor-pointer">
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
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <span className="text-base font-medium">{service.text}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Your Rate */}
        <div className="bg-gradient-to-r from-[#4c7085]/10 to-[#6b8ca3]/10 border-2 border-[#4c7085]/30 rounded-xl p-4">
          <h3 className="text-2xl font-medium text-center text-[#4c7085] mb-8">Your Rate</h3>

          <div className="space-y-6 mb-8">
            {allServices.map((service) => {
              const isSelected = serviceSelections[service.id] === true;
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-lg p-6 shadow-md border border-[#4c7085]/20 flex items-center justify-between"
                >
                  <div className="text-lg font-medium text-gray-800">{service.name}</div>
                  <button
                    type="button"
                    onClick={() =>
                      setServiceSelections((prev) => ({
                        ...prev,
                        [service.id]: !prev[service.id],
                      }))
                    }
                    className="focus:outline-none"
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? "bg-[#4c7085] border-[#4c7085]" : "bg-white border-gray-400"
                      }`}
                    >
                      {isSelected && <div className="w-4 h-4 bg-white rounded-full" />}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 bg-white p-4 rounded-2xl shadow-xl border border-[#4c7085]/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                <label className="block text-sm font-medium text-[#4c7085]">Advance</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.advance}
                  onChange={(e) => setForm({ ...form, advance: e.target.value })}
                  className="w-full mt-2 px-4 py-2 border border-[#4c7085] text-sm text-[#4c7085] rounded-lg focus:outline-none"
                />
              </div>
              <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                <label className="block text-sm font-medium text-[#4c7085]">Discount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  className="w-full mt-2 px-4 py-2 border border-[#4c7085] text-sm text-[#4c7085] rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                <label className="block text-sm font-medium text-[#4c7085]">Total Amount</label>
                <p className="text-2xl font-medium text-[#4c7085] mt-2">
                  {displayAmount} QAR
                </p>
              </div>
              <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                <label className="block text-sm font-medium text-[#4c7085]">Balance</label>
                <p className="text-2xl font-medium text-indigo-700 mt-2">
                  {displayBalance} QAR
                </p>
              </div>
            </div>
          </div>

          {priceError && (
            <div className="mt-6 bg-red-100 border-2 border-red-400 rounded-lg p-5 text-center text-red-700 font-medium">
              {priceError}
            </div>
          )}
        </div>

        {/* Digital Signature */}
        <div className="bg-gray-100 p-4 rounded-xl border border-[#4c7085]/30">
          <h3 className="text-xl font-medium text-[#4c7085] mb-4">Digital Signature</h3>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <p className="text-gray-700">
              {hasSignature ? "✓ Customer has digitally signed this quotation" : "Add customer signature"}
            </p>
            <div className="flex gap-4">
              {hasSignature && (
                <button
                  onClick={() => setIsSignatureViewModalOpen(true)}
                  className="px-6 py-2 bg-[#4c7085] hover:bg-[#6b8ca3] text-white rounded-lg flex items-center gap-2 text-sm font-medium"
                >
                  <FaEye /> View
                </button>
              )}
              <button
                onClick={() => setIsSignatureModalOpen(true)}
                disabled={isSignatureUploading}
                className={`px-8 py-2 rounded-lg text-sm font-medium text-white transition ${
                  isSignatureUploading ? "bg-gray-400 cursor-not-allowed" : "bg-[#4c7085] hover:bg-[#6b8ca3]"
                }`}
              >
                <FaPlus className="inline mr-2" />
                {isSignatureUploading ? "Uploading..." : "Change"}
              </button>
            </div>
          </div>
        </div>

        {/* Update Button */}
        <div className="flex justify-center">
          <button
            onClick={handleUpdate}
            disabled={!displayAmount || !displayFinal || priceError}
            className={`w-full px-4 py-2 text-sm font-medium rounded-lg shadow-xl transition ${
              !displayAmount || !displayFinal || priceError
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:shadow-2xl"
            }`}
          >
            Update Quotation
          </button>
        </div>
      </div>
    </div>
  );
}