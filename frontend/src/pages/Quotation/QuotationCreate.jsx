import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";
import { FiArrowLeft, FiCheckCircle, FiPlus, FiEdit2, FiTrash2, FiSave, FiX } from "react-icons/fi";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import SignatureModal from "../../components/SignatureModal/SignatureModal";
import PageHeader from "../../components/PageHeader";

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
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [hasLocalSignature, setHasLocalSignature] = useState(false);
  const [localSignatureFile, setLocalSignatureFile] = useState(null);
  const [signatureImageUrl, setSignatureImageUrl] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const [pricingRanges, setPricingRanges] = useState([]);
  const [priceError, setPriceError] = useState("");
  const [destinationCity, setDestinationCity] = useState("");

  const [dynamicIncludes, setDynamicIncludes] = useState([]);
  const [dynamicExcludes, setDynamicExcludes] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [additionalCharges, setAdditionalCharges] = useState([]);

  const [allServices, setAllServices] = useState([]);
  const [serviceSelections, setServiceSelections] = useState({});

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
    if (!permissionsLoading && !hasPermission("quotation", "add")) {
      navigate("/dashboard");
      return;
    }

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
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [id, today]);

  useEffect(() => {
    const fetchAdditionalCharges = async () => {
      try {
        const chargesRes = await apiClient.get("/quotation-additional-charges/");
        const surveyRes = await apiClient.get(`/surveys/${id}/`);
        const surveyData = surveyRes.data;

        const selectedServiceIds =
          surveyData.additional_services?.map((service) => service.service_id) || [];

        const filteredCharges = chargesRes.data
          .filter((charge) => selectedServiceIds.includes(charge.service.id))
          .map((charge) => {
            const surveyService = surveyData.additional_services?.find(
              (s) => s.service_id === charge.service.id
            );
            return {
              ...charge,
              surveyQuantity: surveyService?.quantity || 1,
              surveyRemarks: surveyService?.remarks || "",
            };
          });

        setAdditionalCharges(filteredCharges);
      } catch (err) {
        console.error("Failed to load additional charges:", err);
      }
    };

    if (id) {
      fetchAdditionalCharges();
    }
  }, [id]);

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
        setPriceError(`No pricing found for ${destinationCity}. Please contact administrator.`);
        setPricingRanges([]);
      }
    };
    fetchLivePricing();
  }, [destinationCity]);

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
    const defaultIncluded = dynamicIncludes
      .slice(0, 10)
      .reduce((acc, item) => {
        acc[item.id] = true;
        return acc;
      }, {});

    const defaultExcluded = dynamicExcludes
      .slice(0, 10)
      .reduce((acc, item) => {
        acc[item.id] = true;
        return acc;
      }, {});

    setForm((prev) => ({
      ...prev,
      includedServices: {
        ...defaultIncluded,
        ...prev.includedServices,
      },
      excludedServices: {
        ...defaultExcluded,
        ...prev.excludedServices,
      },
    }));
  }, [dynamicIncludes, dynamicExcludes]);

  useEffect(() => {
    const fetchAllServices = async () => {
      try {
        const res = await apiClient.get("/services/");
        const services = Array.isArray(res.data.results)
          ? res.data.results
          : res.data;
        setAllServices(services);
      } catch (err) {
        console.error("Failed to fetch services:", err);
      }
    };
    fetchAllServices();
  }, []);

  const totalVolume =
    survey?.articles
      ?.reduce((sum, a) => sum + parseFloat(a.volume || 0) * (a.quantity || 0), 0)
      ?.toFixed(2) || "0.00";

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
      applicableRange.rateType === "flat" ? applicableRange.rate : applicableRange.rate * volume;

    setForm((prev) => ({
      ...prev,
      baseAmount: calculatedBaseAmount.toFixed(2),
    }));
    setPriceError("");
  }, [totalVolume, pricingRanges, destinationCity]);

  useEffect(() => {
    let additionalTotal = 0;
    additionalCharges.forEach((charge) => {
      const quantity = charge.surveyQuantity || 1;
      const pricePerUnit = charge.price_per_unit || 0;
      const perUnitBase = charge.per_unit_quantity || 1;
      additionalTotal += (pricePerUnit / perUnitBase) * quantity;
    });

    setForm((prev) => ({
      ...prev,
      additionalChargesTotal: additionalTotal.toFixed(2),
    }));
  }, [additionalCharges]);

  useEffect(() => {
    const base = parseFloat(form.baseAmount) || 0;
    const additional = parseFloat(form.additionalChargesTotal) || 0;
    const totalBeforeDiscount = base + additional;

    const discount = parseFloat(form.discount) || 0;
    const final = Math.max(0, totalBeforeDiscount - discount);

    const advance = parseFloat(form.advance) || 0;
    const balance = Math.max(0, final - advance);

    setForm((prev) => ({
      ...prev,
      amount: totalBeforeDiscount > 0 ? totalBeforeDiscount.toFixed(2) : "",
      finalAmount: final > 0 ? final.toFixed(2) : "",
      balance: balance > 0 ? balance.toFixed(2) : "",
    }));
  }, [form.baseAmount, form.additionalChargesTotal, form.discount, form.advance]);

  const openSignatureModal = () => setIsSignatureModalOpen(true);

  const handleSignatureSave = async (file) => {
    if (!file) return;
    setLocalSignatureFile(file);
    setHasLocalSignature(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSignatureImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
    setIsSignatureModalOpen(false);
  };

  const handleCreate = async () => {
    if (!form.finalAmount) return alert("Final amount is not calculated.");
    if (priceError) return alert(priceError);

    const payload = {
      survey: parseInt(survey.id),
      date: form.date,
      amount: parseFloat(form.amount),
      discount: form.discount ? parseFloat(form.discount) : 0,
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
        quantity: charge.surveyQuantity || 1,
        price_per_unit: charge.price_per_unit,
        total: (charge.price_per_unit / (charge.per_unit_quantity || 1)) * (charge.surveyQuantity || 1),
      })),
      selected_services: Object.keys(serviceSelections)
        .filter((key) => serviceSelections[key])
        .map((key) => parseInt(key)),
      remarks: selectedRemarks,
    };

    try {
      const res = await apiClient.post("/quotation-create/", payload);
      const quotationId = res.data.quotation_id;

      if (localSignatureFile && quotationId) {
        const formData = new FormData();
        formData.append("signature", localSignatureFile);
        await apiClient.post(`/quotation-create/${quotationId}/upload-signature/`, formData);
      }

      alert("Quotation created successfully!");
      navigate("/quotation-list");
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Failed to create quotation."));
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
        // Automatically select the new remark
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
  if (error) return <div className="text-center text-red-600 p-5 font-medium">{error}</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
        customerName={form.client}
      />

      <PageHeader
        title="Create Quotation"
        subtitle={`Survey ID: ${survey?.survey_id || id}`}
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
              readOnly
              className="input-style w-full bg-gray-50 cursor-not-allowed"
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
          {additionalCharges.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center md:text-left">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Additional Services</h3>
              <div className="space-y-3">
                {additionalCharges.map((charge) => {
                  const currencyName = charge.currency_name || "QAR";
                  const quantity = charge.surveyQuantity || 1;
                  const subtotal = (charge.price_per_unit / (charge.per_unit_quantity || 1)) * quantity;

                  return (
                    <div key={charge.id} className="bg-gray-50 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-800">
                          {charge.service?.name || "Additional Service"} x {quantity}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {charge.price_per_unit} {currencyName} per unit
                        </div>
                      </div>
                      <div className="text-right text-lg font-medium text-[#4c7085] min-w-[100px]">
                        {subtotal.toFixed(2)} {currencyName}
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
                    onChange={(e) =>
                      setForm({ ...form, advance: e.target.value })
                    }
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
                    onChange={(e) =>
                      setForm({ ...form, discount: e.target.value })
                    }
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
                    {form.amount || "0.00"} QAR
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 text-center border border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2">
                    Balance
                  </label>
                  <p className="text-2xl font-medium text-indigo-600">
                    {form.balance || "0.00"} QAR
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
                {hasLocalSignature ? "✓ Signature added successfully" : "Add customer signature to complete quotation"}
              </p>
              <button
                onClick={openSignatureModal}
                disabled={isSignatureUploading || hasLocalSignature}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${isSignatureUploading || hasLocalSignature
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-[#4c7085] text-white hover:bg-[#6b8ca3]"
                  }`}
              >
                {isSignatureUploading ? "Uploading..." : hasLocalSignature ? "Signature Added" : "Add Signature"}
              </button>
            </div>
          </div>
        </>

        {/* Save Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleCreate}
            disabled={!form.finalAmount || priceError}
            className={`w-full md:w-auto px-8 py-3 text-sm font-medium rounded-xl transition-all ${!form.finalAmount || priceError
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-[#4c7085] text-white hover:bg-[#6b8ca3] shadow-sm"
              }`}
          >
            Save Quotation
          </button>
        </div>
      </div>
    </div>
  );
}
