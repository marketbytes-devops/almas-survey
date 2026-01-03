import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import SignatureModal from "../../components/SignatureModal/SignatureModal";
import { FaArrowLeft } from "react-icons/fa";

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

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  if (error) return <div className="text-center text-red-600 p-5">{error}</div>;

  return (
    <div className="bg-gray-100 min-h-screen rounded-lg">
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
        customerName={form.client}
      />
      <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-8 flex justify-between items-center rounded-t-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/quotation-list")}
            className="flex items-center gap-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
          >
            <FaArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Back to List</span>
          </button>
          <h2 className="text-lg font-medium">Create Quotation</h2>
        </div>
      </div>

      <div className="p-4 space-y-10">
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

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4c7085] mb-2">Quotation Date</label>
            <input
              type="date"
              value={form.date}
              readOnly
              className="w-full rounded-lg border-2 border-[#4c7085] px-4 py-3 bg-gray-100 text-sm text-[#4c7085] font-medium cursor-not-allowed"
            />
          </div>
        </div>

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

        {additionalCharges.length > 0 && (
          <div className="bg-[#6b8ca3]/5 border-2 border-[#6b8ca3]/30 rounded-xl p-6">
            <h3 className="text-xl font-medium text-[#4c7085] mb-4">Additional Services</h3>
            <div className="space-y-4">
              {additionalCharges.map((charge) => {
                const currencyName = charge.currency_name || "QAR";
                const quantity = charge.surveyQuantity || 1;
                const subtotal = (charge.price_per_unit / (charge.per_unit_quantity || 1)) * quantity;

                return (
                  <div key={charge.id} className="bg-white border border-[#4c7085]/20 rounded-lg p-5">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="font-medium text-gray-800">{charge.service.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {charge.price_per_unit} {currencyName} × {quantity} unit(s)
                        </div>
                      </div>
                      <div className="text-right text-xl font-medium text-[#4c7085]">
                        {subtotal.toFixed(2)} {currencyName}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "bg-[#4c7085] border-[#4c7085]" : "bg-white border-gray-400"
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
            {/* 2-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                <label className="block text-sm font-medium text-[#4c7085]">
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
                  className="w-full mt-2 px-4 py-2 border border-[#4c7085] text-sm text-[#4c7085] rounded-lg focus:outline-none"
                />
              </div>
              <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                <label className="block text-sm font-medium text-[#4c7085]">
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
                  className="w-full mt-2 px-4 py-2 border border-[#4c7085] text-sm text-[#4c7085] rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                <label className="block text-sm font-medium text-[#4c7085]">
                  Total Amount
                </label>
                <p className="text-2xl font-medium text-[#4c7085] mt-2">
                  {form.amount || "0.00"} QAR
                </p>
              </div>

              <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                <label className="block text-sm font-medium text-[#4c7085]">
                  Balance
                </label>
                <p className="text-2xl font-medium text-indigo-700 mt-2">
                  {form.balance || "0.00"} QAR
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

        <div className="bg-gray-100 p-4 rounded-xl border border-[#4c7085]/30">
          <h3 className="text-xl font-medium text-[#4c7085] mb-4">Digital Signature</h3>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <p className="text-gray-700">
              {hasLocalSignature ? "✓ Signature added" : "Add customer signature"}
            </p>
            <button
              onClick={openSignatureModal}
              disabled={isSignatureUploading || hasLocalSignature}
              className={`px-8 py-2 rounded-lg text-sm font-medium text-white transition ${isSignatureUploading || hasLocalSignature
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#4c7085] hover:bg-[#6b8ca3]"
                }`}
            >
              {isSignatureUploading ? "Uploading..." : hasLocalSignature ? "Signature Added" : "Add Signature"}
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleCreate}
            disabled={!form.finalAmount || priceError}
            className={`w-full px-4 py-2 text-sm font-medium rounded-lg shadow-xl transition ${!form.finalAmount || priceError
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:shadow-2xl"
              }`}
          >
            Save Quotation
          </button>
        </div>
      </div>
    </div>
  );
}