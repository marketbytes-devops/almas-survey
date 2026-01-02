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
  const [message, setMessage] = useState("");
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

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
    baseAmount: "",
    additionalChargesTotal: 0,
    amount: "",           // Total before discount (read-only)
    discount: "",         // Editable
    finalAmount: "",      // Final after discount (read-only)
    advance: "",          // Editable
    balance: "",          // Balance = finalAmount - advance (read-only)
    includedServices: {},
    excludedServices: {},
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

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

  useEffect(() => {
    const fetchAdditionalCharges = async () => {
      try {
        const chargesRes = await apiClient.get("/quotation-additional-charges/");
        const surveyRes = await apiClient.get(`/surveys/${id}/`);
        const surveyData = surveyRes.data;
        const selectedServiceIds =
          surveyData.additional_services?.map((service) => service.id) || [];

        const filteredCharges = chargesRes.data
          .filter((charge) => selectedServiceIds.includes(charge.service.id))
          .map((charge) => {
            const surveyService = surveyData.additional_services?.find(
              (s) => s.id === charge.service.id
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
        console.error("Failed to fetch pricing:", err);
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
      const price = charge.price_per_unit || 0;
      additionalTotal += price * quantity;
    });

    setForm((prev) => ({
      ...prev,
      additionalChargesTotal: additionalTotal,
    }));
  }, [additionalCharges]);

  // Main calculation: Total → Discount → Final → Balance
  useEffect(() => {
    const base = parseFloat(form.baseAmount) || 0;
    const additional = form.additionalChargesTotal || 0;
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

  const handleManualBack = () => {
    navigate("/quotation-list");
  };

  const openSignatureModal = () => setIsSignatureModalOpen(true);

  const handleSignatureSave = async (file) => {
    if (!survey || !file) return;
    const formData = new FormData();
    formData.append("signature", file);
    setIsSignatureUploading(true);
    try {
      await apiClient.post(`/surveys/${survey.survey_id}/upload-signature/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Digital signature uploaded successfully");
      setSurvey((prev) => ({ ...prev, signature_uploaded: true }));
    } catch (err) {
      setError("Signature upload failed.");
    } finally {
      setIsSignatureUploading(false);
      setIsSignatureModalOpen(false);
    }
  };

  const handleCreate = async () => {
    if (!form.finalAmount) return alert("Final amount is not calculated.");
    if (priceError) return alert(priceError);

    const payload = {
      survey: parseInt(survey.id),
      serial_no: form.serialNo,
      date: form.date,
      amount: parseFloat(form.amount),
      discount: form.discount ? parseFloat(form.discount) : 0,
      final_amount: parseFloat(form.finalAmount),
      advance: form.advance ? parseFloat(form.advance) : 0,
      balance: form.balance ? parseFloat(form.balance) : 0,
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
        currency: charge.currency,
        total: charge.price_per_unit * (charge.surveyQuantity || 1),
      })),
      selected_services: Object.keys(serviceSelections)
        .filter((key) => serviceSelections[key])
        .map((key) => parseInt(key)),
    };

    try {
      setIsSubmitted(true);
      await apiClient.post("/quotation-create/", payload);
      alert("Quotation created successfully!");
      navigate("/quotation-list");
    } catch (err) {
      setIsSubmitted(false);
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
    <div className="bg-gray-50">
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
        customerName={form.client}
      />

      <div className="max-w-full mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-6 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualBack}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
              title="Go back without saving"
            >
              <FaArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to List</span>
            </button>
            <h2 className="text-lg sm:text-xl font-medium">Create Quotation</h2>
          </div>
          <button
            onClick={handleManualBack}
            className="text-3xl sm:text-4xl hover:opacity-80"
            title="Close without saving"
          >
            ×
          </button>
        </div>

        {message && (
          <div className="mx-4 sm:mx-6 mt-4 p-4 bg-green-100 text-green-700 rounded-lg text-center font-medium">
            {message}
          </div>
        )}

        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Pricing Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4c7085] mb-1">
                  Destination City
                </label>
                <input
                  type="text"
                  value={destinationCity || "Not specified"}
                  readOnly
                  className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4c7085] mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value="Qatar"
                  readOnly
                  className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Quotation No.</label>
              <input
                type="text"
                value={form.serialNo}
                readOnly
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                readOnly
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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

          {additionalCharges.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-medium text-purple-900 mb-4">
                Additional Services
              </h3>
              <p className="text-sm text-purple-700 mb-4">
                Automatically included from survey selection with pricing settings
              </p>

              <div className="space-y-3">
                {additionalCharges.map((charge) => {
                  const currencyName = charge.currency_name || "QAR";
                  const quantity = charge.surveyQuantity || 1;
                  const subtotal = charge.price_per_unit * quantity;

                  return (
                    <div
                      key={charge.id}
                      className="bg-white border-2 border-purple-200 rounded-lg p-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between gap-3">
                        <div>
                          <div className="font-medium text-gray-800">
                            {charge.service.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {charge.price_per_unit} {currencyName} × {quantity} unit(s)
                          </div>
                          {charge.surveyRemarks && (
                            <div className="text-xs text-gray-500 italic mt-1">
                              Note: {charge.surveyRemarks}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 capitalize mt-1">
                            Rate: {charge.rate_type?.toLowerCase() || "fix"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-medium text-purple-700">
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

          {survey?.additional_services?.length > 0 && additionalCharges.length === 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-medium text-yellow-900 mb-3">
                Services Requested in Survey
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {survey.additional_services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center gap-2 bg-white p-3 rounded-lg border border-yellow-300"
                  >
                    <span className="text-green-600 font-medium">✓</span>
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-yellow-700 mt-3">
                Note: These services were selected in the survey but no pricing has been configured yet. Please add pricing in the Additional Settings tab.
              </p>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-xl border-2 border-blue-200">
            <h3 className="text-lg sm:text-xl font-medium text-center mb-4">
              Your Rate
            </h3>

            <div className="space-y-4">
              <div className="space-y-5">
                {allServices.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No services available</p>
                ) : (
                  allServices.map((service) => {
                    const isSelected = serviceSelections[service.id] === true;

                    return (
                      <div
                        key={service.id}
                        className="bg-white rounded-lg p-5 shadow-md border border-gray-200 flex items-center justify-between"
                      >
                        <div className="text-lg font-medium text-gray-800">{service.name}</div>
                        <div className="flex items-center">
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
                              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "bg-blue-600 border-blue-600" : "bg-white border-gray-400"
                                }`}
                            >
                              {isSelected && <div className="w-3 h-3 bg-white rounded-full" />}
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {form.additionalChargesTotal > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-gray-300 gap-2">
                  <div>
                    <span className="text-sm text-gray-600">Additional Services</span>
                    <div className="text-xs text-gray-500">
                      {additionalCharges.length} service(s) selected in survey
                    </div>
                  </div>
                  <span className="text-xl sm:text-2xl font-medium text-purple-700">
                    + {form.additionalChargesTotal.toFixed(2)} QAR
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-2">
                <span className="text-2xl sm:text-4xl font-medium text-green-600">
                  {form.finalAmount || "0.00"} QAR
                </span>
              </div>
            </div>

            {priceError && (
              <div className="mt-4 bg-red-100 border-2 border-red-400 rounded-lg p-4 text-center text-red-700 font-medium text-sm">
                {priceError}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 items-center justify-center border-2 border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-700 text-white p-4 text-center font-medium">Service Includes</div>
            <div className="bg-red-700 text-white p-4 text-center font-medium">Service Excludes</div>

            <div className="p-4 sm:p-6 space-y-4 bg-gray-50 max-h-80 overflow-y-auto">
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
                    className="mt-1 w-5 h-5 text-blue-600"
                  />
                  <span className="text-sm font-medium relative top-0.5">{service.text}</span>
                </label>
              ))}
            </div>

            <div className="p-4 sm:p-6 space-y-4 bg-red-50 border-l-2 border-red-200 max-h-80 overflow-y-auto">
              {dynamicExcludes.map((service) => (
                <label key={service.id} className="flex items-start space-x-3 cursor-pointer">
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
                    className="mt-1 w-5 h-5 text-red-600"
                  />
                  <span className="text-sm font-medium relative top-1">{service.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Only 4 fields: Total Amount, Discount, Final Amount, Advance, Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mt-8 bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-blue-200">
            <div>
              <label className="block font-medium text-sm mb-1 text-gray-700">Total Amount</label>
              <input
                type="text"
                readOnly
                value={form.amount ? `${form.amount} QAR` : "0.00 QAR"}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-blue-50 font-medium text-[#4c7085]"
              />
            </div>

            <div>
              <label className="block font-medium text-sm mb-1 text-gray-700">Discount (QAR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-sm mb-1 text-gray-700">Final Amount</label>
              <input
                type="text"
                readOnly
                value={form.finalAmount ? `${form.finalAmount} QAR` : "0.00 QAR"}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-green-50 font-medium text-green-700"
              />
            </div>

            <div>
              <label className="block font-medium text-sm mb-1 text-gray-700">Advance</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.advance}
                onChange={(e) => setForm({ ...form, advance: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-sm mb-1 text-gray-700">Balance</label>
              <input
                type="text"
                readOnly
                value={form.balance ? `${form.balance} QAR` : "0.00 QAR"}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-indigo-50 font-bold text-indigo-700 text-lg"
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-3">Digital Signature</h3>
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-sm text-gray-600">
                {survey?.signature_uploaded ? "✓ Signature added" : "Add customer signature"}
              </p>
              <button
                onClick={openSignatureModal}
                disabled={isSignatureUploading || survey?.signature_uploaded}
                className={`px-6 py-3 rounded-lg font-medium ${survey?.signature_uploaded || isSignatureUploading
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

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleCreate}
              disabled={!form.finalAmount || priceError}
              className={`w-full py-2 px-8 text-sm font-medium rounded-lg shadow-lg transition ${!form.finalAmount || priceError
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:scale-105"
                }`}
            >
              Save Quotation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}