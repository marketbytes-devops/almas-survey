import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSignature, FaEye, FaPrint } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import QuotationLocalMove from "../../components/Templates/QuotationLocalMove";

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

  const [quotation, setQuotation] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [baseAmount, setBaseAmount] = useState(0);
  const [additionalChargesTotal, setAdditionalChargesTotal] = useState(0);
  const [pricingRanges, setPricingRanges] = useState([]);
  const [destinationCity, setDestinationCity] = useState("");
  const [includedServices, setIncludedServices] = useState([]);
  const [excludedServices, setExcludedServices] = useState([]);

  const checkSignatureExists = async (surveyId) => {
    try {
      const signatureRes = await apiClient.get(`/surveys/${surveyId}/signature/`);
      setHasSignature(!!signatureRes.data.signature_url);
      setCurrentSignature(signatureRes.data.signature_url);
    } catch (err) {
      setHasSignature(false);
    }
  };

  const fetchServiceNames = async () => {
    if (!quotation) return;

    try {
      const includePromises = (quotation.included_services || []).map(id =>
        apiClient.get(`/inclusion-exclusion/${id}/`).then(r => r.data).catch(() => null)
      );
      const excludePromises = (quotation.excluded_services || []).map(id =>
        apiClient.get(`/inclusion-exclusion/${id}/`).then(r => r.data).catch(() => null)
      );

      const [includeResults, excludeResults] = await Promise.all([
        Promise.all(includePromises),
        Promise.all(excludePromises),
      ]);

      setIncludedServices(includeResults.filter(r => r?.text).map(r => r.text));
      setExcludedServices(excludeResults.filter(r => r?.text).map(r => r.text));
    } catch (err) {
      setIncludedServices([]);
      setExcludedServices([]);
    }
  };

  useEffect(() => {
    const fetchLivePricing = async () => {
      if (!destinationCity) return;
      try {
        const params = new URLSearchParams();
        params.append("pricing_city", destinationCity);
        params.append("move_type", "1");
        const res = await apiClient.get(`/price/active/?${params}`);
        const liveRates = res.data.map(item => ({
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
  }, [destinationCity]);

  useEffect(() => {
    if (!survey || !pricingRanges.length) return;
    const totalVolume = survey.articles?.reduce((sum, a) => sum + parseFloat(a.volume || 0) * (a.quantity || 0), 0) || 0;
    if (totalVolume <= 0) {
      setBaseAmount(0);
      return;
    }
    const volume = parseFloat(totalVolume);
    const applicableRange = pricingRanges.find(r => volume >= r.min && volume <= r.max);
    if (!applicableRange) {
      setBaseAmount(0);
      return;
    }
    const calculatedBaseAmount = applicableRange.rateType === "flat" ? applicableRange.rate : applicableRange.rate * volume;
    setBaseAmount(calculatedBaseAmount);
  }, [survey, pricingRanges]);

  useEffect(() => {
    const fetchAdditionalCharges = async () => {
      if (!survey) return;
      try {
        const chargesRes = await apiClient.get("/quotation-additional-charges/");
        const selectedServiceIds = survey.additional_services?.map(service => service.id) || [];
        const filteredCharges = chargesRes.data.filter(charge => selectedServiceIds.includes(charge.service.id));
        setAdditionalCharges(filteredCharges);
        const total = filteredCharges.reduce((sum, charge) => {
          const quantity = charge.per_unit_quantity || 1;
          return sum + charge.price_per_unit * quantity;
        }, 0);
        setAdditionalChargesTotal(total);
      } catch (err) {
        setAdditionalCharges([]);
        setAdditionalChargesTotal(0);
      }
    };
    fetchAdditionalCharges();
  }, [survey]);

  useEffect(() => {
    fetchServiceNames();
  }, [quotation]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const quotRes = await apiClient.get(`/quotation-create/${id}/`);
        const quot = quotRes.data;
        setQuotation(quot);
        if (quot.survey_id) {
          const surveyRes = await apiClient.get(`/surveys/${quot.survey_id}/`);
          const surveyData = surveyRes.data;
          setSurvey(surveyData);
          const destCity = surveyData.destination_addresses?.[0]?.city || "";
          setDestinationCity(destCity);
          await checkSignatureExists(quot.survey_id);
        }
      } catch (err) {
        setError("Failed to load quotation.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const viewSignature = async () => {
    if (!survey) return;
    try {
      const signatureRes = await apiClient.get(`/surveys/${survey.survey_id}/signature/`);
      setCurrentSignature(signatureRes.data.signature_url);
      setIsSignatureModalOpen(true);
    } catch (err) {
      setError("Failed to load signature");
    }
  };

  const get = (primary, fallback) => primary ?? fallback ?? "Not filled";

  const handlePrint = async () => {
    if (
      quotation &&
      (quotation.included_services?.length > 0 || quotation.excluded_services?.length > 0) &&
      includedServices.length === 0 &&
      excludedServices.length === 0
    ) {
      await fetchServiceNames();
    }

    setShowPrintPreview(true);

    setTimeout(() => {
      window.print();
      setTimeout(() => setShowPrintPreview(false), 1000);
    }, 1200);
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  if (error) return <div className="text-center text-red-600 p-5">{error}</div>;
  if (!quotation || !survey) return null;

  const name = get(survey.full_name, survey.enquiry?.fullName);
  const phone = get(survey.phone_number, survey.enquiry?.phoneNumber);
  const email = get(survey.email, survey.enquiry?.email);
  const service = SERVICE_TYPE_DISPLAY[survey.service_type] || "Not filled";
  const movingTo = survey.destination_addresses?.[0]?.address || "Not filled";
  const moveDate = survey.packing_date_from || "Not filled";

  const totalVolume = survey.articles?.reduce((sum, a) => sum + parseFloat(a.volume || 0) * (a.quantity || 0), 0)?.toFixed(2) || "0.00";
  const totalAmount = baseAmount + additionalChargesTotal;
  const advance = quotation.advance ? parseFloat(quotation.advance) : 0;
  const balance = (totalAmount - advance).toFixed(2);

  return (
    <>
      {showPrintPreview && (
        <div className="fixed inset-0 z-[9999] bg-white">
          <QuotationLocalMove
            quotation={quotation}
            survey={survey}
            name={name}
            phone={phone}
            email={email}
            service={service}
            movingTo={movingTo}
            moveDate={moveDate}
            totalAmount={totalAmount}
            advance={advance}
            balance={balance}
            baseAmount={baseAmount}
            additionalChargesTotal={additionalChargesTotal}
            additionalCharges={additionalCharges}
            includedServices={includedServices}
            excludedServices={excludedServices}
          />
        </div>
      )}

      {isSignatureModalOpen && currentSignature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-lg">Digital Signature</h3>
              <button onClick={() => { setIsSignatureModalOpen(false); setCurrentSignature(null); }} className="text-3xl">×</button>
            </div>
            <img src={currentSignature} alt="Signature" className="w-full rounded-lg border" />
            <button onClick={() => { setIsSignatureModalOpen(false); setCurrentSignature(null); }} className="mt-4 w-full bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-3 rounded-lg font-medium">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-50">
        <div className="max-w-full mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-6 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium"
                title="Go back"
              >
                <FaArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <h2 className="text-lg sm:text-xl font-medium">Quotation Details</h2>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="text-3xl sm:text-4xl hover:opacity-80"
              title="Close"
            >
              ×
            </button>
          </div>

          <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Quotation Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4c7085] mb-1">Quotation ID</label>
                  <input type="text" value={quotation.quotation_id || "Not specified"} readOnly className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4c7085] mb-1">Date</label>
                  <input type="text" value={quotation.date || "Not specified"} readOnly className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {["Client Name", "Mobile", "Email"].map((label, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input type="text" value={[name, phone, email][i]} readOnly className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50" />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {[
                { label: "Service Required", value: service },
                { label: "Moving From", value: get(survey.origin_address) },
                { label: "Moving To", value: movingTo },
                { label: "Date of Move", value: moveDate },
              ].map((item) => (
                <div key={item.label}>
                  <label className="block text-sm font-medium mb-1">{item.label}</label>
                  <input type="text" value={item.value} readOnly className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50" />
                </div>
              ))}
            </div>

            {additionalCharges.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-medium text-purple-900 mb-4">Additional Services</h3>
                <div className="space-y-3">
                  {additionalCharges.map(charge => {
                    const currencyName = charge.currency_name || "QAR";
                    const quantity = charge.per_unit_quantity || 1;
                    const subtotal = charge.price_per_unit * quantity;
                    return (
                      <div key={charge.id} className="bg-white border-2 border-purple-200 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                          <div>
                            <div className="font-medium text-gray-800">{charge.service.name}</div>
                            <div className="text-sm text-gray-600">{charge.price_per_unit} {currencyName} × {quantity} unit(s)</div>
                            <div className="text-xs text-gray-500 capitalize mt-1">
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

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-xl border-2 border-blue-200">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-gray-300 gap-2">
                  <div>
                    <span className="text-sm text-gray-600">Base Amount (Volume Pricing)</span>
                    <div className="text-xs text-gray-500">{totalVolume} CBM × {destinationCity}</div>
                  </div>
                  <span className="text-xl sm:text-2xl font-medium text-[#4c7085]">{baseAmount.toFixed(2)} QAR</span>
                </div>
                {additionalChargesTotal > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-gray-300 gap-2">
                    <div>
                      <span className="text-sm text-gray-600">Additional Services</span>
                      <div className="text-xs text-gray-500">{additionalCharges.length} service(s)</div>
                    </div>
                    <span className="text-xl sm:text-2xl font-medium text-purple-700">+ {additionalChargesTotal.toFixed(2)} QAR</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-2">
                  <span className="text-xl font-medium text-gray-900">Total Amount</span>
                  <span className="text-2xl sm:text-4xl font-medium text-green-600">{totalAmount.toFixed(2)} QAR</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 border-2 border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-700 text-white p-4 text-center font-medium">Service Includes</div>
              <div className="bg-red-700 text-white p-4 text-center font-medium">Service Excludes</div>

              <div className="p-4 sm:p-6 space-y-4 bg-gray-50 max-h-80 overflow-y-auto">
                {includedServices.length > 0 ? includedServices.map((service, i) => (
                  <div key={`inc-${i}`} className="flex items-start space-x-3">
                    <span className="text-blue-600 mt-0.5">✓</span>
                    <span className="text-sm font-medium relative top-1">{service}</span>
                  </div>
                )) : <p className="text-gray-500 text-sm">No services included</p>}
              </div>

              <div className="p-4 sm:p-6 space-y-4 bg-red-50 border-l-2 border-red-200 max-h-80 overflow-y-auto">
                {excludedServices.length > 0 ? excludedServices.map((service, i) => (
                  <div key={`exc-${i}`} className="flex items-start space-x-3">
                    <span className="text-red-600 mt-0.5">✕</span>
                    <span className="text-sm font-medium relative top-1">{service}</span>
                  </div>
                )) : <p className="text-gray-500 text-sm">No services excluded</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block font-medium text-sm mb-1">Total Amount</label>
                <input type="text" readOnly value={`${totalAmount.toFixed(2)} QAR`} className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-blue-50 font-medium text-[#4c7085]" />
              </div>
              <div>
                <label className="block font-medium text-sm mb-1">Advance</label>
                <input type="text" readOnly value={`${advance.toFixed(2)} QAR`} className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50" />
              </div>
              <div>
                <label className="block font-medium text-sm mb-1">Balance</label>
                <input type="text" readOnly value={`${balance} QAR`} className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-green-50 font-medium text-green-700" />
              </div>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-3">Digital Signature</h3>
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {hasSignature ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-green-700">✓ Digitally Signed</p>
                      <p className="text-sm text-gray-600">Customer signature is attached</p>
                    </div>
                    <button
                      onClick={viewSignature}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium"
                    >
                      <FaEye /> View Signature
                    </button>
                  </>
                ) : (
                  <div className="text-center w-full">
                    <p className="text-gray-600 mb-4">No signature uploaded yet</p>
                    <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                      <FaSignature className="text-gray-500 text-2xl" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handlePrint}
                className="w-full py-2 px-8 text-sm font-medium rounded-lg shadow-lg transition bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white flex items-center justify-center gap-3"
              >
                <FaPrint className="text-xl" />
                Print Quotation (PDF Ready)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}