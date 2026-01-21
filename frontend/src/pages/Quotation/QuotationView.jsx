import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";
import {
  FiArrowLeft,
  FiEye,
  FiPrinter,
  FiDownload,
  FiCheckCircle,
  FiMail,
} from "react-icons/fi";
import { IoLogoWhatsapp } from "react-icons/io";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import QuotationLocalMove from "../../components/Templates/QuotationLocalMove";
import PageHeader from "../../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";

const SERVICE_TYPE_DISPLAY = {
  localMove: "Local Move",
  internationalMove: "International Move",
  carExport: "Car Import and Export",
  storageServices: "Storage Services",
  logistics: "Logistics",
};

export default function QuotationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const [quotation, setQuotation] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);
  const [surveySignature, setSurveySignature] = useState(null);
  const [booking, setBooking] = useState(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [baseAmount, setBaseAmount] = useState(0);
  const [additionalChargesTotal, setAdditionalChargesTotal] = useState(0);
  const [pricingRanges, setPricingRanges] = useState([]);
  const [destinationCity, setDestinationCity] = useState("");
  const [includedServices, setIncludedServices] = useState([]);
  const [excludedServices, setExcludedServices] = useState([]);
  const [quoteNotes, setQuoteNotes] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [insurancePlans, setInsurancePlans] = useState([]);
  const [quotationRemarks, setQuotationRemarks] = useState([]);

  const printRef = useRef();

  const safeParse = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const get = (primary, fallback) => primary ?? fallback ?? "Not filled";

  const checkSignatureExists = async (quotationId) => {
    try {
      const signatureRes = await apiClient.get(
        `/quotation-create/${quotationId}/signature/`
      );
      setHasSignature(!!signatureRes.data.signature_url);
      setCurrentSignature(signatureRes.data.signature_url);
    } catch (err) {
      setHasSignature(false);
    }
  };

  const fetchSurveySignature = async (surveyId) => {
    try {
      const res = await apiClient.get(`/surveys/${surveyId}/signature/`);
      setSurveySignature(res.data.signature_url);
    } catch (err) {
      console.warn("Could not load survey signature");
    }
  };

  const fetchServiceNames = async () => {
    if (!quotation) return;

    try {
      const includePromises = (quotation.included_services || []).map((id) =>
        apiClient
          .get(`/inclusion-exclusion/${id}/`)
          .then((r) => r.data)
          .catch(() => null)
      );
      const excludePromises = (quotation.excluded_services || []).map((id) =>
        apiClient
          .get(`/inclusion-exclusion/${id}/`)
          .then((r) => r.data)
          .catch(() => null)
      );

      const [includeResults, excludeResults] = await Promise.all([
        Promise.all(includePromises),
        Promise.all(excludePromises),
      ]);

      setIncludedServices(
        includeResults.filter((r) => r?.text).map((r) => r.text)
      );
      setExcludedServices(
        excludeResults.filter((r) => r?.text).map((r) => r.text)
      );
    } catch (err) {
      setIncludedServices([]);
      setExcludedServices([]);
    }
  };

  useEffect(() => {
    const fetchLivePricing = async () => {
      const city = destinationCity || survey?.destination_addresses?.[0]?.city || survey?.origin_city || "";
      if (!city) return;

      const cleanCity = city.split(',')[0].trim();

      try {
        const [moveTypesRes, pricesRes] = await Promise.all([
          apiClient.get("/move-types/"),
          apiClient.get("/price/active/", {
            params: { pricing_city: cleanCity }
          })
        ]);

        const moveTypes = moveTypesRes.data.results || moveTypesRes.data;
        const currentService = survey?.service_type || "localMove";
        const serviceNameMap = { localMove: "Local Move", internationalMove: "International Move" };
        const targetName = serviceNameMap[currentService] || "Local Move";

        const moveTypeObj = moveTypes.find(m => m.name === targetName);
        const moveTypeId = moveTypeObj ? moveTypeObj.id : "1";

        const filteredPrices = pricesRes.data.filter(p => String(p.move_type) === String(moveTypeId));

        const liveRates = filteredPrices.map((item) => ({
          min: parseFloat(item.min_volume),
          max: parseFloat(item.max_volume),
          rate: parseFloat(item.rate),
          rateType: item.rate_type,
        }));
        setPricingRanges(liveRates);
      } catch (err) {
        setPricingRanges([]);
      }
    };
    fetchLivePricing();
  }, [destinationCity, survey?.service_type]);

  useEffect(() => {
    if (!survey || !pricingRanges.length) return;
    const totalVolume = survey.total_volume_cbm
      ? parseFloat(survey.total_volume_cbm)
      : (survey.articles?.reduce(
        (sum, a) => sum + parseFloat(a.volume || 0) * (a.quantity || 0),
        0
      ) || 0);

    if (totalVolume <= 0) {
      setBaseAmount(0);
      return;
    }

    const volume = parseFloat(totalVolume);
    const applicableRange = pricingRanges.find(
      (r) => volume >= r.min && volume <= r.max
    );

    if (!applicableRange) {
      setBaseAmount(0);
      return;
    }

    const calculatedBaseAmount =
      applicableRange.rateType === "flat"
        ? applicableRange.rate
        : applicableRange.rate * volume;

    setBaseAmount(calculatedBaseAmount);
  }, [survey, pricingRanges]);

  useEffect(() => {
    fetchServiceNames();
  }, [quotation]);

  useEffect(() => {
    if (!permissionsLoading && !hasPermission("quotation", "view")) {
      navigate("/dashboard");
      return;
    }

    const fetchData = async () => {
      try {
        const quotRes = await apiClient.get(`/quotation-create/${id}/`);
        const quot = quotRes.data;
        setQuotation(quot);
        setAdditionalCharges(quot.additional_charges || []);

        if (quot.survey_id) {
          const surveyRes = await apiClient.get(`/surveys/${quot.survey_id}/`);
          const surveyData = surveyRes.data;
          setSurvey(surveyData);
          const destCity = surveyData.destination_addresses?.[0]?.city || "";
          setDestinationCity(destCity);
          await checkSignatureExists(quot.quotation_id);
          if (surveyData.survey_id) {
            await fetchSurveySignature(surveyData.survey_id);
          }

          try {
            const bookingRes = await apiClient.get(
              `/bookings/by-quotation/${quot.quotation_id}/`
            );
            if (bookingRes.data) {
              setBooking(bookingRes.data);
            }
          } catch (err) {
            console.warn("No booking found for this quotation");
          }
        }
      } catch (err) {
        console.error("API fetch error:", err.response?.data || err.message);
        setError(
          "Failed to load quotation: " +
          (err.response?.data?.detail || err.message)
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchPrintData = async () => {
      try {
        const [notesRes, termsRes, insRes, remRes] = await Promise.all([
          apiClient.get("/quote-notes/"),
          apiClient.get("/payment-terms/"),
          apiClient.get("/insurance-plans/"),
          apiClient.get("/quotation-remarks/"),
        ]);
        setQuoteNotes(notesRes.data.filter((n) => n.is_active));
        setPaymentTerms(termsRes.data.filter((t) => t.is_active));
        setInsurancePlans(insRes.data.filter((i) => i.is_active));

        const allRemarks = remRes.data.results || remRes.data;
        if (quotation?.remarks) {
          setQuotationRemarks(allRemarks.filter(r => quotation.remarks.includes(r.id)));
        } else {
          setQuotationRemarks([]);
        }
      } catch (err) {
        console.error("Failed to load print data");
      }
    };
    fetchPrintData();
  }, [quotation]);

  const viewSignature = async () => {
    if (!quotation) return;
    try {
      const signatureRes = await apiClient.get(
        `/quotation-create/${quotation.quotation_id}/signature/`
      );
      setCurrentSignature(signatureRes.data.signature_url);
      setIsSignatureModalOpen(true);
    } catch (err) {
      setError("Failed to load signature");
    }
  };

  const triggerPrint = () => {
    if (printRef.current) {
      printRef.current.printNow();
    }
  };

  const triggerDownloadPdf = () => {
    if (printRef.current) {
      printRef.current.downloadPdf();
    }
  };

  const handleBookMove = () => {
    navigate(`/booking-form/quotation/${quotation.quotation_id}`);
  };

  const handleSendQuotation = async () => {
    if (!quotation) {
      alert("❌ Quotation data not loaded yet.");
      return;
    }

    if (!quotation.quotation_id) {
      alert(
        "❌ Quotation ID not found. Please refresh the page and try again."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await apiClient.post(
        `/quotation-create/${quotation.quotation_id}/send-whatsapp/`
      );

      const { whatsapp_url, customer_name } = response.data;

      window.open(whatsapp_url, "_blank");
      setLoading(false);

      alert(
        `✅ Success!\n\nWhatsApp opened for ${customer_name}.\nPDF link is included in the message.`
      );
    } catch (err) {
      console.error("Send quotation error:", err);

      let errorMsg = "Failed to send quotation via WhatsApp.";

      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.status === 404) {
        errorMsg = "Quotation not found. Please refresh and try again.";
      } else if (err.response?.status === 400) {
        errorMsg =
          err.response.data.error ||
          "Customer phone number is missing in survey.";
      }

      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailQuotation = async () => {
    if (!quotation?.quotation_id) {
      alert("❌ Quotation ID not found.");
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post(
        `/quotation-create/${quotation.quotation_id}/send-email/`
      );

      alert(`✅ Success!\n\n${response.data.message}`);
    } catch (err) {
      console.error("Email share error:", err);
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || "Failed to send email.";
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loading />
      </div>
    );
  if (error) return <div className="text-center text-red-600 p-5 font-medium">{error}</div>;
  if (!quotation || !survey) return null;

  const customerName =
    get(survey?.full_name, survey?.enquiry?.fullName) || "Customer";
  const phone = get(survey?.phone_number, survey?.enquiry?.phoneNumber);
  const email = get(survey?.email, survey?.enquiry?.email);
  const service = SERVICE_TYPE_DISPLAY[survey?.service_type] || "Not filled";
  const movingTo = survey?.destination_addresses?.[0]?.address || "Not filled";
  const moveDate = survey?.packing_date_from || "Not filled";

  const totalAmount = safeParse(quotation?.amount);
  const discount = safeParse(quotation?.discount);
  const advance = safeParse(quotation?.advance);
  const finalAmount = safeParse(quotation?.final_amount);
  const balance = safeParse(quotation?.balance);

  return (
    <>
      {/* Signature Modal */}
      <AnimatePresence>
        {isSignatureModalOpen && currentSignature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsSignatureModalOpen(false)}
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
                <button
                  onClick={() => setIsSignatureModalOpen(false)}
                  className="text-gray-600 hover:text-gray-600 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>
              <img
                src={currentSignature}
                alt="Signature"
                className="w-full rounded-2xl border border-gray-200"
              />
              <button
                onClick={() => setIsSignatureModalOpen(false)}
                className="mt-6 w-full bg-[#4c7085] hover:bg-[#6b8ca3] text-white py-3 rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          {/* Header Row 1: Title & Back Button */}
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-medium text-[#4c7085] tracking-tight leading-tight">Quotation Details</h1>
              <p className="text-sm text-gray-500 mt-1.5 font-medium">
                Quotation ID: <span className="text-gray-900">{quotation?.quotation_id || "—"}</span> • Survey ID: <span className="text-gray-900">{survey?.survey_id || "—"}</span>
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="w-full md:w-auto px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-50 shadow-sm transition-all active:scale-95"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>

          {/* Header Row 2: Actions Row */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
            <button
              onClick={handleSendQuotation}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#25D366] text-white rounded-xl flex items-center justify-center gap-2 text-sm font-medium hover:brightness-95 shadow-md shadow-green-100 transition-all active:scale-95"
            >
              <IoLogoWhatsapp className="w-5 h-5" />
              <span>Share via WhatsApp</span>
            </button>
            <button
              onClick={handleEmailQuotation}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#4c7085] text-white rounded-xl flex items-center justify-center gap-2 text-sm font-medium hover:brightness-110 shadow-md shadow-blue-100 transition-all active:scale-95"
            >
              <FiMail className="w-5 h-5" />
              <span>Share via Email</span>
            </button>
            <button
              onClick={triggerPrint}
              className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-50 shadow-sm transition-all active:scale-95"
            >
              <FiPrinter className="w-4 h-4 text-gray-500" />
              <span>Print</span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quotation Information */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center md:text-left">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Quotation Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">
                  Quotation ID
                </label>
                <input
                  type="text"
                  value={quotation?.quotation_id || "Not specified"}
                  readOnly
                  className="input-style w-full bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">
                  Date
                </label>
                <input
                  type="text"
                  value={quotation?.date || "Not specified"}
                  readOnly
                  className="input-style w-full bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center md:text-left">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  readOnly
                  className="input-style w-full bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">
                  Mobile
                </label>
                <input
                  type="text"
                  value={phone}
                  readOnly
                  className="input-style w-full bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">
                  Email
                </label>
                <input
                  type="text"
                  value={email}
                  readOnly
                  className="input-style w-full bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Move Details */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center md:text-left">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Move Details</h3>
            <div className="space-y-6">
              {[
                { label: "Service Required", value: service },
                { label: "Moving From", value: get(survey?.origin_address) },
                { label: "Moving To", value: movingTo },
                { label: "Date of Move", value: moveDate },
              ].map((item) => (
                <div key={item.label}>
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">
                    {item.label}
                  </label>
                  <input
                    type="text"
                    value={item.value}
                    readOnly
                    className="input-style w-full bg-gray-50 cursor-not-allowed"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Additional Services */}
          {additionalCharges.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center md:text-left">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Additional Services
              </h3>
              <div className="space-y-3">
                {additionalCharges.map((charge, index) => {
                  const quantity = charge.quantity || 1;
                  const perUnitBase = parseFloat(charge.per_unit_quantity) || 1;
                  const price = parseFloat(charge.price_per_unit || 0);
                  const subtotal = (price / perUnitBase) * quantity;

                  return (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-800">
                          {charge.service_name || charge.service?.name || "Additional Service"} x {quantity}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {price.toFixed(2)} QAR per {perUnitBase > 1 ? `${perUnitBase} units` : 'unit'}
                        </div>
                      </div>
                      <div className="text-right text-lg font-medium text-[#4c7085] min-w-[100px]">
                        {subtotal.toFixed(2)} QAR
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quotation Remarks */}
          {quotationRemarks.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center md:text-left">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Quotation Remarks</h3>
              <div className="space-y-3">
                {quotationRemarks.map((remark) => (
                  <div key={remark.id} className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl">
                    <FiCheckCircle className="text-[#4c7085] mt-1 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{remark.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Your Rate Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-xl font-medium text-center text-gray-800 mb-6">
              Your Rate
            </h3>
            <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-4 text-center border border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2">
                    Advance
                  </label>
                  <p className="text-2xl font-medium text-[#4c7085]">
                    {advance.toFixed(2)} QAR
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center border border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2">
                    Discount
                  </label>
                  <p className="text-2xl font-medium text-[#4c7085]">
                    {discount.toFixed(2)} QAR
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-4 text-center border border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2">
                    Total Amount
                  </label>
                  <p className="text-2xl font-medium text-[#4c7085]">
                    {totalAmount.toFixed(2)} QAR
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 text-center border border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2">
                    Balance
                  </label>
                  <p className="text-2xl font-medium text-indigo-600">
                    {balance.toFixed(2)} QAR
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Includes / Excludes */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-[#4c7085] text-white p-4 text-center font-medium">
                Service Includes
              </div>
              <div className="bg-red-600 text-white p-4 text-center font-medium">
                Service Excludes
              </div>

              <div className="p-6 bg-gray-50 max-h-96 overflow-y-auto space-y-3">
                {includedServices.length > 0 ? (
                  includedServices.map((service, i) => (
                    <div key={`inc-${i}`} className="flex items-start gap-3">
                      <span className="text-[#4c7085] mt-0.5 text-lg flex-shrink-0">✓</span>
                      <span className="text-sm font-medium text-gray-700">{service}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-sm">No services included</p>
                )}
              </div>

              <div className="p-6 bg-red-50 max-h-96 overflow-y-auto space-y-3">
                {excludedServices.length > 0 ? (
                  excludedServices.map((service, i) => (
                    <div key={`exc-${i}`} className="flex items-start gap-3">
                      <span className="text-red-600 mt-0.5 text-lg flex-shrink-0">✕</span>
                      <span className="text-sm font-medium text-gray-700">{service}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-sm">No services excluded</p>
                )}
              </div>
            </div>
          </div>

          {/* Digital Signature */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center md:text-left">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Digital Signature
            </h3>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {hasSignature ? (
                <>
                  <div>
                    <p className="text-base font-medium text-green-600 flex items-center gap-2">
                      <FiCheckCircle className="w-5 h-5" /> Digitally Signed
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Customer signature is attached
                    </p>
                  </div>
                  <button
                    onClick={viewSignature}
                    className="px-6 py-2.5 bg-[#4c7085] hover:bg-[#6b8ca3] text-white rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <FiEye className="w-4 h-4" /> View Signature
                  </button>
                </>
              ) : (
                <div className="text-center w-full">
                  <p className="text-sm text-gray-600">
                    No signature uploaded yet
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4">
            <button
              onClick={triggerPrint}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <FiPrinter className="w-4 h-4" />
              <span>Print Quotation</span>
            </button>

            <button
              onClick={triggerDownloadPdf}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <FiDownload className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleSendQuotation}
              className="btn-primary flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <IoLogoWhatsapp className="w-4 h-4" />
              <span>Send Quotation</span>
            </button>

            <button
              onClick={handleEmailQuotation}
              className="btn-primary flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <FiMail className="w-4 h-4" />
              <span>Share via Email</span>
            </button>

            <button
              onClick={handleBookMove}
              className="btn-primary flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <FiCheckCircle className="w-4 h-4" />
              <span>Booked Moves</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden instance for printing/PDF */}
      <div style={{ display: "none" }}>
        <QuotationLocalMove
          ref={printRef}
          quotation={quotation}
          survey={survey}
          name={customerName}
          phone={phone}
          email={email}
          service={service}
          movingTo={movingTo}
          moveDate={moveDate}
          totalAmount={totalAmount}
          advance={advance}
          balance={balance}
          discount={discount}
          finalAmount={finalAmount}
          baseAmount={baseAmount}
          additionalChargesTotal={additionalChargesTotal}
          additionalCharges={additionalCharges}
          includedServices={includedServices}
          excludedServices={excludedServices}
          notes={quoteNotes}
          insurancePlans={insurancePlans}
          generalTerms={quoteNotes}
          paymentTerms={paymentTerms}
          quoteNotes={quoteNotes}
          surveyRemarks={quotationRemarks}
          currentSignature={currentSignature}
          surveySignature={surveySignature}
          booking={booking}
        />
      </div>
    </>
  );
}