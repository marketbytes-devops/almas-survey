import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiEye, FiCheckCircle, FiPlus, FiEdit2, FiTrash2, FiSave, FiX } from "react-icons/fi";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import SignatureModal from "../../components/SignatureModal/SignatureModal";
import PageHeader from "../../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";

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

        const getFallback = (p, f) => (p && p !== "" && p !== "—") ? p : (f && f !== "" && f !== "—") ? f : "";

        setForm((prev) => ({
          ...prev,
          client: getFallback(s.full_name, s.enquiry?.fullName),
          mobile: getFallback(s.phone_number, s.enquiry?.phoneNumber),
          email: getFallback(s.email, s.enquiry?.email),
          serviceRequired: SERVICE_TYPE_DISPLAY[s.service_type] || "",
          movingFrom: s.origin_address || "",
          movingTo: s.destination_addresses?.[0]?.address || "",
          moveDate: s.packing_date_from || today,
          jobType: s.service_type === "localMove" ? "Local" : "International",
        }));

        const checkRes = await apiClient.get(`/quotation-create/exists/?survey_id=${encodeURIComponent(id)}`);
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
            const sId = service.service_id || service.id;
            const pricing = chargesRes.data.find((p) => p.service?.id === sId);
            if (!pricing) return null;

            const pricePerUnit = parseFloat(pricing.price_per_unit) || 0;
            const quantity = pricing.rate_type === "FIX" ? 1 : (parseInt(service.quantity) || parseInt(pricing.per_unit_quantity) || 1);
            const total = pricing.rate_type === "FIX" ? pricePerUnit : pricePerUnit * quantity;

            return {
              id: pricing.id,
              service_name: pricing.service?.name || service.name,
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

        const includedServices = {};
        if (dynamicIncludes.length > 0) {
          dynamicIncludes.forEach((service) => {
            includedServices[service.id] = q.included_services?.includes(service.id) || false;
          });
        }

        const excludedServices = {};
        if (dynamicExcludes.length > 0) {
          dynamicExcludes.forEach((service) => {
            excludedServices[service.id] = q.excluded_services?.includes(service.id) || false;
          });
        }

        const serviceSelectionsInit = {};
        if (q.selected_services) {
          q.selected_services.forEach((serviceId) => {
            serviceSelectionsInit[serviceId] = true;
          });
        }
        setServiceSelections(serviceSelectionsInit);

        setForm((prev) => ({
          ...prev,
          date: q.date || today,
          additionalChargesTotal: breakdown.reduce((sum, c) => sum + c.total, 0),
          amount: safeParse(q.amount).toString(),
          discount: safeParse(q.discount).toString(),
          finalAmount: safeParse(q.final_amount).toString(),
          advance: safeParse(q.advance).toString(),
          balance: safeParse(q.balance).toString(),
          includedServices: { ...prev.includedServices, ...includedServices },
          excludedServices: { ...prev.excludedServices, ...excludedServices },
        }));

        try {
          const sigRes = await apiClient.get(`/quotation-create/${q.quotation_id}/signature/`);
          if (sigRes.data.signature_url) {
            setHasSignature(true);
            setCurrentSignature(sigRes.data.signature_url);
          }
        } catch (sigErr) {
          setHasSignature(false);
          setCurrentSignature(null);
        }

        if (q.remarks && Array.isArray(q.remarks)) {
          setSelectedRemarks(q.remarks);
        }
      } catch (err) {
        if (err.response?.status !== 404) setError("Failed to load quotation.");
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

  const handleQuantityChange = (chargeId, value) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setChargeQuantities((prev) => ({ ...prev, [chargeId]: qty }));
  };

  const handleUpdate = async () => {
    if (!computedValues.amount || !computedValues.finalAmount || !quotation?.quotation_id) {
      alert("Please ensure all pricing fields are valid.");
      return;
    }

    const payload = {
      date: form.date,
      amount: safeParse(computedValues.amount),
      discount: safeParse(form.discount),
      advance: safeParse(form.advance),
      included_services: Object.keys(form.includedServices).filter((k) => form.includedServices[k]),
      excluded_services: Object.keys(form.excludedServices).filter((k) => form.excludedServices[k]),
      additional_charges: additionalChargesBreakdown.map((c) => ({
        service_id: c.id,
        service_name: c.service_name,
        quantity: chargeQuantities[c.id] !== undefined ? chargeQuantities[c.id] : c.quantity,
        total: c.total,
      })),
      selected_services: Object.keys(serviceSelections)
        .filter((key) => serviceSelections[key])
        .map((key) => parseInt(key)),
      remarks: selectedRemarks,
    };

    try {
      await apiClient.patch(`/quotation-create/${quotation.quotation_id}/`, payload);
      setMessage("Quotation updated successfully!");
      setTimeout(() => navigate("/quotation-list"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed");
    }
  };

  const [quotationRemarks, setQuotationRemarks] = useState([]);
  const [selectedRemarks, setSelectedRemarks] = useState([]);
  const [remarkFormData, setRemarkFormData] = useState({ description: "" });
  const [editingRemarkId, setEditingRemarkId] = useState(null);
  const [isRemarkSaving, setIsRemarkSaving] = useState(false);

  const fetchQuotationRemarks = async () => {
    try {
      const res = await apiClient.get("/quotation-remarks/");
      setQuotationRemarks(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch quotation remarks:", err);
    }
  };

  useEffect(() => {
    fetchQuotationRemarks();
  }, []);

  const handleRemarkToggle = (remarkId) => {
    setSelectedRemarks((prev) =>
      prev.includes(remarkId)
        ? prev.filter((id) => id !== remarkId)
        : [...prev, remarkId]
    );
  };

  const handleRemarkSubmit = async () => {
    if (!remarkFormData.description.trim()) return;
    setIsRemarkSaving(true);
    try {
      if (editingRemarkId) {
        await apiClient.patch(`/quotation-remarks/${editingRemarkId}/`, remarkFormData);
      } else {
        const res = await apiClient.post("/quotation-remarks/", remarkFormData);
        setSelectedRemarks(prev => [...prev, res.data.id]);
      }
      setRemarkFormData({ description: "" });
      setEditingRemarkId(null);
      fetchQuotationRemarks();
    } catch (err) {
      alert("Failed to save remark");
    } finally {
      setIsRemarkSaving(false);
    }
  };

  const handleRemarkDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this remark?")) return;
    try {
      await apiClient.delete(`/quotation-remarks/${id}/`);
      setSelectedRemarks(prev => prev.filter(rid => rid !== id));
      fetchQuotationRemarks();
    } catch (err) {
      alert("Failed to delete remark");
    }
  };

  const startEditRemark = (remark) => {
    setEditingRemarkId(remark.id);
    setRemarkFormData({ description: remark.description });
  };

  if (loading) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;
  if (error && !message) return <div className="text-center text-red-600 p-5 font-medium">{error}</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
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
      <AnimatePresence>
        {isSignatureViewModalOpen && currentSignature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsSignatureViewModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium text-gray-800">Digital Signature</h3>
                <button onClick={() => setIsSignatureViewModalOpen(false)} className="text-gray-600 hover:text-gray-600 text-3xl leading-none">&times;</button>
              </div>
              <img src={currentSignature} alt="Signature" className="w-full rounded-2xl border border-gray-200" />
              <button
                onClick={() => setIsSignatureViewModalOpen(false)}
                className="mt-6 w-full bg-[#4c7085] hover:bg-[#6b8ca3] text-white py-3 rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title="Edit Quotation"
        subtitle={`Survey ID: ${survey?.survey_id || id} • Quotation ID: ${quotation?.quotation_id || "—"}`}
        extra={
          <button
            onClick={() => navigate("/quotation-list")}
            className="btn-secondary flex items-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to List</span>
          </button>
        }
      />

      {/* Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 text-center font-medium"
          >
            {message}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-center font-medium"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>


      <div className="space-y-6">
        <>
          {/* Pricing Location */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center md:text-left">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Pricing Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Destination City</label>
                <input
                  type="text"
                  value={destinationCity || "Not specified"}
                  readOnly
                  className="input-style w-full bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Country</label>
                <input
                  type="text"
                  value="Qatar"
                  readOnly
                  className="input-style w-full bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Quotation Date */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center md:text-left">
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Quotation Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-style w-full"
            />
          </div>

          {/* Client Information */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center md:text-left">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Client Name</label>
                <input
                  type="text"
                  value={form.client}
                  readOnly
                  className="input-style w-full bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Mobile</label>
                <input
                  type="text"
                  value={form.mobile}
                  readOnly
                  className="input-style w-full bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Email</label>
                <input
                  type="text"
                  value={form.email}
                  readOnly
                  className="input-style w-full bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Additional Services */}
          {additionalChargesBreakdown.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center md:text-left">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Additional Services</h3>
              <div className="space-y-3">
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
                      className="bg-gray-50 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{charge.service_name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {charge.price_per_unit} {charge.currency} × {quantity} unit(s)
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {charge.rate_type !== "FIX" && (
                          <>
                            <label className="text-sm font-medium text-gray-600">Qty:</label>
                            <input
                              type="number"
                              min="0"
                              value={quantity}
                              onChange={(e) => handleQuantityChange(charge.id, e.target.value)}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4c7085]/20"
                            />
                          </>
                        )}
                        <div className="text-right text-lg font-medium text-[#4c7085] min-w-[100px]">
                          {subtotal.toFixed(2)} {charge.currency}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Service Includes/Excludes */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-[#4c7085] text-white p-4 text-center font-medium">Service Includes</div>
              <div className="bg-red-600 text-white p-4 text-center font-medium">Service Excludes</div>

              <div className="p-6 bg-gray-50 max-h-96 overflow-y-auto space-y-3">
                {dynamicIncludes.map((service) => (
                  <label key={service.id} className="flex items-center gap-3 cursor-pointer group">
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
                      className="w-5 h-5 text-[#4c7085] rounded focus:ring-[#4c7085] accent-[#4c7085]"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{service.text}</span>
                  </label>
                ))}
              </div>

              <div className="p-6 bg-red-50 max-h-96 overflow-y-auto space-y-3">
                {dynamicExcludes.map((service) => (
                  <label key={service.id} className="flex items-center gap-3 cursor-pointer group">
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
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500 accent-red-600"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{service.text}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6 text-center md:text-left">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Quotation Remarks</h3>

            {/* Remark Form */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <textarea
                  rows={2}
                  value={remarkFormData.description}
                  onChange={(e) => setRemarkFormData({ description: e.target.value })}
                  placeholder="Enter new remark..."
                  className="input-style w-full min-h-[60px] py-2 resize-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleRemarkSubmit}
                  disabled={isRemarkSaving || !remarkFormData.description.trim()}
                  className="btn-primary p-3 flex items-center justify-center disabled:opacity-50"
                >
                  {editingRemarkId ? <FiSave style={{ width: '20px', height: '20px' }} /> : <FiPlus style={{ width: '20px', height: '20px' }} />}
                </button>
                {editingRemarkId && (
                  <button
                    onClick={() => { setEditingRemarkId(null); setRemarkFormData({ description: "" }); }}
                    className="btn-secondary p-3 flex items-center justify-center"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            </div>

            {/* Remarks List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {quotationRemarks.map((remark) => (
                <div key={remark.id} className="flex items-start justify-between group bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={selectedRemarks.includes(remark.id)}
                      onChange={() => handleRemarkToggle(remark.id)}
                      className="w-5 h-5 text-[#4c7085] rounded focus:ring-[#4c7085] accent-[#4c7085] mt-0.5"
                    />
                    <span className="text-sm text-gray-800">{remark.description}</span>
                  </label>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditRemark(remark)}
                      className="text-gray-400 hover:text-[#4c7085] p-1"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleRemarkDelete(remark.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {quotationRemarks.length === 0 && (
                <p className="text-gray-500 text-sm italic">No remarks available. Add one above.</p>
              )}
            </div>
          </div>

          {/* Your Rate Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-xl font-medium text-center md:text-left text-gray-800 mb-6">Your Rate</h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6 text-center md:text-left">
              {/* Service Selections */}
              <h4 className="text-lg font-medium text-gray-800 mb-6">Services Include</h4>
              <div className="space-y-3 mb-6">
                {allServices.map((service) => {
                  const isSelected = serviceSelections[service.id] === true;
                  return (
                    <div
                      key={service.id}
                      className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-base font-medium text-gray-800">{service.name}</div>
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
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "bg-[#4c7085] border-[#4c7085]" : "bg-white border-gray-300"
                            }`}
                        >
                          {isSelected && <FiCheckCircle className="w-5 h-5 text-white" />}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing Details */}
            <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
              {/* Advance & Discount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">
                    Advance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.advance}
                    onChange={(e) => setForm({ ...form, advance: e.target.value })}
                    className="input-style w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">
                    Discount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    className="input-style w-full"
                  />
                </div>
              </div>

              {/* Total Amount & Balance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-4 text-center border border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2">
                    Total Amount
                  </label>
                  <p className="text-2xl font-medium text-[#4c7085]">
                    {computedValues.amount} QAR
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 text-center border border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2">
                    Balance
                  </label>
                  <p className="text-2xl font-medium text-indigo-600">
                    {computedValues.balance} QAR
                  </p>
                </div>
              </div>
            </div>

            {priceError && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-center text-red-600 font-medium text-sm">
                {priceError}
              </div>
            )}
          </div>

          {/* Digital Signature */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6 text-center md:text-left">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Digital Signature</h3>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <p className="text-sm text-gray-600 font-medium">
                {hasSignature ? "✓ Customer has digitally signed this quotation" : "Add customer signature to complete quotation"}
              </p>
              <div className="flex gap-3">
                {hasSignature && (
                  <button
                    onClick={() => setIsSignatureViewModalOpen(true)}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <FiEye className="w-4 h-4" /> View
                  </button>
                )}
                <button
                  onClick={() => setIsSignatureModalOpen(true)}
                  disabled={isSignatureUploading}
                  className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${isSignatureUploading
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-[#4c7085] text-white hover:bg-[#6b8ca3]"
                    }`}
                >
                  {isSignatureUploading ? "Uploading..." : "Change"}
                </button>
              </div>
            </div>
          </div>
        </>

        {/* Update Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleUpdate}
            disabled={!computedValues.amount || !computedValues.finalAmount || priceError}
            className={`w-full md:w-auto px-8 py-3 text-sm font-medium rounded-xl transition-all ${!computedValues.amount || !computedValues.finalAmount || priceError
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-[#4c7085] text-white hover:bg-[#6b8ca3] shadow-sm"
              }`}
          >
            Update Quotation
          </button>
        </div>
      </div>
    </div>
  );
}