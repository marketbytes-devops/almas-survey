import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEye, FaPrint } from "react-icons/fa";
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
  const [selectedServices, setSelectedServices] = useState([]);

  const safeParse = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const checkSignatureExists = async (quotationId) => {
    try {
      const signatureRes = await apiClient.get(`/quotation-create/${quotationId}/signature/`);
      setHasSignature(!!signatureRes.data.signature_url);
      setCurrentSignature(signatureRes.data.signature_url);
    } catch (err) {
      setHasSignature(false);
    }
  };

  const fetchServiceNames = async () => {
    if (!quotation) return;

    try {
      const includePromises = (quotation.included_services || []).map((id) =>
        apiClient.get(`/inclusion-exclusion/${id}/`).then((r) => r.data).catch(() => null)
      );
      const excludePromises = (quotation.excluded_services || []).map((id) =>
        apiClient.get(`/inclusion-exclusion/${id}/`).then((r) => r.data).catch(() => null)
      );

      const [includeResults, excludeResults] = await Promise.all([
        Promise.all(includePromises),
        Promise.all(excludePromises),
      ]);

      setIncludedServices(includeResults.filter((r) => r?.text).map((r) => r.text));
      setExcludedServices(excludeResults.filter((r) => r?.text).map((r) => r.text));
    } catch (err) {
      setIncludedServices([]);
      setExcludedServices([]);
    }
  };

  // Fetch live pricing ranges
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
      } catch (err) {
        setPricingRanges([]);
      }
    };
    fetchLivePricing();
  }, [destinationCity]);

  // Calculate base amount from volume + pricing (fallback only)
  useEffect(() => {
    if (!survey || !pricingRanges.length) return;
    const totalVolume =
      survey.articles?.reduce(
        (sum, a) => sum + parseFloat(a.volume || 0) * (a.quantity || 0),
        0
      ) || 0;

    if (totalVolume <= 0) {
      setBaseAmount(0);
      return;
    }

    const volume = parseFloat(totalVolume);
    const applicableRange = pricingRanges.find((r) => volume >= r.min && volume <= r.max);

    if (!applicableRange) {
      setBaseAmount(0);
      return;
    }

    const calculatedBaseAmount =
      applicableRange.rateType === "flat" ? applicableRange.rate : applicableRange.rate * volume;

    setBaseAmount(calculatedBaseAmount);
  }, [survey, pricingRanges]);

  // Fetch and calculate additional charges total (fallback only)
  useEffect(() => {
    const fetchAdditionalCharges = async () => {
      if (!survey) return;
      try {
        const chargesRes = await apiClient.get("/quotation-additional-charges/");
        const selectedServiceIds =
          survey.additional_services?.map((service) => service.id) || [];
        const filteredCharges = chargesRes.data.filter((charge) =>
          selectedServiceIds.includes(charge.service.id)
        );

        setAdditionalCharges(filteredCharges);

        const total = filteredCharges.reduce((sum, charge) => {
          const quantity = safeParse(charge.per_unit_quantity) || 1;
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
          await checkSignatureExists(quot.quotation_id);
        }
      } catch (err) {
        setError("Failed to load quotation.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchSelectedServices = async () => {
      if (!quotation?.selected_services || quotation.selected_services.length === 0) {
        setSelectedServices([]);
        return;
      }
      try {
        const promises = quotation.selected_services.map((id) =>
          apiClient.get(`/services/${id}/`).then((r) => r.data).catch(() => null)
        );
        const results = await Promise.all(promises);
        setSelectedServices(results.filter((s) => s?.name).map((s) => s.name));
      } catch (err) {
        setSelectedServices([]);
      }
    };
    fetchSelectedServices();
  }, [quotation]);

  const viewSignature = async () => {
    if (!quotation) return;
    try {
      const signatureRes = await apiClient.get(`/quotation-create/${quotation.quotation_id}/signature/`);
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

  // ── Use backend-computed values first (now reliable from serializer) ──
  const totalAmount = safeParse(quotation?.amount);
  const discount = safeParse(quotation?.discount);
  const advance = safeParse(quotation?.advance);
  const finalAmount = safeParse(quotation?.final_amount);
  const balance = safeParse(quotation?.balance);

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
            discount={discount}
            finalAmount={finalAmount}
            advance={advance}
            balance={balance}
            baseAmount={safeParse(baseAmount)}
            additionalChargesTotal={safeParse(additionalChargesTotal)}
            additionalCharges={additionalCharges}
            includedServices={includedServices}
            excludedServices={excludedServices}
          />
        </div>
      )}

      {isSignatureModalOpen && currentSignature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium">Digital Signature</h3>
              <button onClick={() => setIsSignatureModalOpen(false)} className="text-3xl">×</button>
            </div>
            <img src={currentSignature} alt="Signature" className="w-full rounded-lg border" />
            <button
              onClick={() => setIsSignatureModalOpen(false)}
              className="mt-6 w-full bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-100 min-h-screen rounded-lg">
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-8 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
            >
              <FaArrowLeft className="w-5 h-5" />
              <span className="font-medium text-sm">Back</span>
            </button>
            <h2 className="text-lg font-medium">Quotation Details</h2>
          </div>
        </div>

        <div className="p-4 space-y-10">
          <div className="bg-[#4c7085]/5 border border-[#4c7085]/30 rounded-xl p-6">
            <h3 className="text-lg font-medium text-[#4c7085] mb-4">Quotation Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#4c7085] mb-2">Quotation ID</label>
                <input
                  type="text"
                  value={quotation.quotation_id || "Not specified"}
                  readOnly
                  className="w-full rounded-lg border border-[#6b8ca3]/50 bg-white px-4 py-3 text-sm text-[#4c7085] font-medium cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4c7085] mb-2">Date</label>
                <input
                  type="text"
                  value={quotation.date || "Not specified"}
                  readOnly
                  className="w-full rounded-lg border border-[#6b8ca3]/50 bg-white px-4 py-3 text-sm text-[#4c7085] font-medium cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#4c7085] mb-2">Client Name</label>
              <input
                type="text"
                value={name}
                readOnly
                className="w-full rounded-lg border-2 border-[#4c7085] px-4 py-3 bg-gray-100 text-sm text-[#4c7085] font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4c7085] mb-2">Mobile</label>
              <input
                type="text"
                value={phone}
                readOnly
                className="w-full rounded-lg border-2 border-[#4c7085] px-4 py-3 bg-gray-100 text-sm text-[#4c7085] font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4c7085] mb-2">Email</label>
              <input
                type="text"
                value={email}
                readOnly
                className="w-full rounded-lg border-2 border-[#4c7085] px-4 py-3 bg-gray-100 text-sm text-[#4c7085] font-medium cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-6">
            {[
              { label: "Service Required", value: service },
              { label: "Moving From", value: get(survey.origin_address) },
              { label: "Moving To", value: movingTo },
              { label: "Date of Move", value: moveDate },
            ].map((item) => (
              <div key={item.label}>
                <label className="block text-sm font-medium text-[#4c7085] mb-2">{item.label}</label>
                <input
                  type="text"
                  value={item.value}
                  readOnly
                  className="w-full rounded-lg border-2 border-[#4c7085] px-4 py-3 bg-gray-100 text-sm text-[#4c7085] font-medium cursor-not-allowed"
                />
              </div>
            ))}
          </div>

          {additionalCharges.length > 0 && (
            <div className="bg-[#6b8ca3]/5 border-2 border-[#6b8ca3]/30 rounded-xl p-6">
              <h3 className="text-xl font-medium text-[#4c7085] mb-4">Additional Services</h3>
              <div className="space-y-4">
                {additionalCharges.map((charge) => {
                  const quantity = safeParse(charge.per_unit_quantity) || 1;
                  const subtotal = charge.price_per_unit * quantity;
                  return (
                    <div key={charge.id} className="bg-white border border-[#4c7085]/20 rounded-lg p-5">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <div className="font-medium text-gray-800">{charge.service.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {charge.price_per_unit} QAR × {quantity} unit(s)
                          </div>
                        </div>
                        <div className="text-right text-xl font-medium text-[#4c7085]">
                          {subtotal.toFixed(2)} QAR
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-[#4c7085]/10 to-[#6b8ca3]/10 border-2 border-[#4c7085]/30 rounded-xl p-4">
            <h3 className="text-2xl font-medium text-center text-[#4c7085] mb-8">Your Rate</h3>

            <div className="space-y-6 mb-8">
              {selectedServices.length > 0 ? (
                selectedServices.map((serviceName, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-6 shadow-md border border-[#4c7085]/20 flex items-center justify-between"
                  >
                    <div className="text-lg font-medium text-gray-800">{serviceName}</div>
                    <div className="w-8 h-8 rounded-full bg-[#4c7085] border-2 border-[#4c7085] flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 py-6">No additional services selected</p>
              )}
            </div>

            <div className="grid gap-6 bg-white p-4 rounded-2xl shadow-xl border border-[#4c7085]/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                  <label className="block text-sm font-medium text-[#4c7085]">Advance</label>
                  <p className="text-2xl font-medium text-[#4c7085] mt-2">
                    {advance.toFixed(2)} QAR
                  </p>
                </div>
                <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                  <label className="block text-sm font-medium text-[#4c7085]">Discount</label>
                  <p className="text-2xl font-medium text-[#4c7085] mt-2">
                    {discount.toFixed(2)} QAR
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                  <label className="block text-sm font-medium text-[#4c7085]">Total Amount</label>
                  <p className="text-2xl font-medium text-[#4c7085] mt-2">
                    {totalAmount.toFixed(2)} QAR
                  </p>
                </div>

                <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                  <label className="block text-sm font-medium text-[#4c7085]">Balance</label>
                  <p className="text-2xl font-medium text-indigo-700 mt-2">
                    {balance.toFixed(2)} QAR
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 border-2 border-[#4c7085]/30 rounded-xl overflow-hidden">
            <div className="bg-[#4c7085] text-white p-5 text-center font-medium text-lg">Service Includes</div>
            <div className="bg-red-700 text-white p-5 text-center font-medium text-lg">Service Excludes</div>

            <div className="p-4 bg-gray-100 max-h-96 overflow-y-auto space-y-4">
              {includedServices.length > 0 ? (
                includedServices.map((service, i) => (
                  <div key={`inc-${i}`} className="flex items-start space-x-4">
                    <span className="text-[#4c7085] mt-1 text-xl">✓</span>
                    <span className="text-base font-medium">{service}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No services included</p>
              )}
            </div>

            <div className="p-4 bg-red-50 max-h-96 overflow-y-auto space-y-4">
              {excludedServices.length > 0 ? (
                excludedServices.map((service, i) => (
                  <div key={`exc-${i}`} className="flex items-start space-x-4">
                    <span className="text-red-600 mt-1 text-xl">✕</span>
                    <span className="text-base font-medium">{service}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No services excluded</p>
              )}
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-xl border border-[#4c7085]/30">
            <h3 className="text-xl font-medium text-[#4c7085] mb-4">Digital Signature</h3>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              {hasSignature ? (
                <>
                  <div>
                    <p className="text-lg font-medium text-green-700">✓ Digitally Signed</p>
                    <p className="text-gray-700">Customer signature is attached</p>
                  </div>
                  <button
                    onClick={viewSignature}
                    className="px-8 py-2 bg-[#4c7085] hover:bg-[#6b8ca3] text-white rounded-lg flex items-center gap-2 text-sm font-medium"
                  >
                    <FaEye /> View Signature
                  </button>
                </>
              ) : (
                <div className="text-center w-full">
                  <p className="text-gray-700 mb-4">No signature uploaded yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handlePrint}
              className="w-full px-4 py-2 text-sm font-medium rounded-lg shadow-xl bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white flex items-center justify-center gap-3 hover:shadow-2xl transition"
            >
              <FaPrint className="text-lg" />
              Print Quotation (PDF Ready)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}