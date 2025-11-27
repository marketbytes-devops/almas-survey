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

  // 🔥 CALCULATION STATES - DECLARE ALL HOOKS AT TOP LEVEL
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [baseAmount, setBaseAmount] = useState(0);
  const [additionalChargesTotal, setAdditionalChargesTotal] = useState(0);
  const [pricingRanges, setPricingRanges] = useState([]);
  const [destinationCity, setDestinationCity] = useState("");
  const [includedServices, setIncludedServices] = useState([]);
  const [excludedServices, setExcludedServices] = useState([]);
  console.log("🔍 QuotationView State:", {
    quotation: quotation,
    includedServices: includedServices,
    excludedServices: excludedServices,
    quotationIncluded: quotation?.included_services,
    quotationExcluded: quotation?.excluded_services,
  });

  const checkSignatureExists = async (surveyId) => {
    try {
      const signatureRes = await apiClient.get(
        `/surveys/${surveyId}/signature/`
      );
      setHasSignature(!!signatureRes.data.signature_url);
      setCurrentSignature(signatureRes.data.signature_url);
    } catch (err) {
      setHasSignature(false);
    }
  };

  // 🔥 FETCH PRICING DATA
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
        console.error("Failed to fetch pricing:", err);
        setPricingRanges([]);
      }
    };
    fetchLivePricing();
  }, [destinationCity]);

  // 🔥 CALCULATE BASE AMOUNT FROM VOLUME
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

  // 🔥 FETCH ADDITIONAL CHARGES FOR SURVEY-SELECTED SERVICES
  useEffect(() => {
    const fetchAdditionalCharges = async () => {
      if (!survey) return;

      try {
        // Get all pricing charges
        const chargesRes = await apiClient.get(
          "/quotation-additional-charges/"
        );

        // Get survey selected service IDs
        const selectedServiceIds =
          survey.additional_services?.map((service) => service.id) || [];

        // Filter charges for survey-selected services only
        const filteredCharges = chargesRes.data.filter((charge) =>
          selectedServiceIds.includes(charge.service.id)
        );

        setAdditionalCharges(filteredCharges);

        // Calculate total
        const total = filteredCharges.reduce((sum, charge) => {
          const quantity = charge.per_unit_quantity || 1;
          return sum + charge.price_per_unit * quantity;
        }, 0);
        setAdditionalChargesTotal(total);
      } catch (err) {
        console.error("Failed to load additional charges:", err);
        setAdditionalCharges([]);
        setAdditionalChargesTotal(0);
      }
    };

    fetchAdditionalCharges();
  }, [survey]);

  // 🔥 FETCH INCLUDE/EXCLUDE SERVICE NAMES
  useEffect(() => {
    const fetchServiceNames = async () => {
      if (!quotation) return;

      try {
        // Fetch include services
        const includePromises =
          quotation.included_services?.map((id) =>
            apiClient.get(`/inclusion-exclusion/${id}/`).catch(() => null)
          ) || [];

        // Fetch exclude services
        const excludePromises =
          quotation.excluded_services?.map((id) =>
            apiClient.get(`/inclusion-exclusion/${id}/`).catch(() => null)
          ) || [];

        const includeResults = await Promise.all(includePromises);
        const excludeResults = await Promise.all(excludePromises);

        setIncludedServices(
          includeResults.filter((r) => r?.data).map((r) => r.data.text)
        );
        setExcludedServices(
          excludeResults.filter((r) => r?.data).map((r) => r.data.text)
        );
      } catch (err) {
        console.error("Failed to fetch service names:", err);
        setIncludedServices([]);
        setExcludedServices([]);
      }
    };

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

          // Set destination city for pricing calculation
          const destCity = surveyData.destination_addresses?.[0]?.city || "";
          setDestinationCity(destCity);

          await checkSignatureExists(quot.survey_id);
        }
      } catch (err) {
        setError("Failed to load quotation.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const viewSignature = async () => {
    if (!survey) return;
    try {
      const signatureRes = await apiClient.get(
        `/surveys/${survey.survey_id}/signature/`
      );
      setCurrentSignature(signatureRes.data.signature_url);
      setIsSignatureModalOpen(true);
    } catch (err) {
      setError("Failed to load signature");
    }
  };

  const get = (primary, fallback) => primary ?? fallback ?? "Not filled";

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  if (error) return <div className="text-center text-red-600 p-5">{error}</div>;
  if (!quotation || !survey) return null;

  const name = get(survey.full_name, survey.enquiry?.fullName);
  const phone = get(survey.phone_number, survey.enquiry?.phoneNumber);
  const email = get(survey.email, survey.enquiry?.email);
  const service = SERVICE_TYPE_DISPLAY[survey.service_type] || "Not filled";

  const movingTo = survey.destination_addresses?.[0]?.address || "Not filled";
  const moveDate = survey.packing_date_from || "Not filled";

  // Calculate total volume for display
  const totalVolume =
    survey.articles
      ?.reduce(
        (sum, a) => sum + parseFloat(a.volume || 0) * (a.quantity || 0),
        0
      )
      ?.toFixed(2) || "0.00";

  // Use calculated amounts
  const totalAmount = baseAmount + additionalChargesTotal;
  const advance = quotation.advance ? parseFloat(quotation.advance) : 0;
  const balance = (totalAmount - advance).toFixed(2);

  const handlePrint = () => {
    setShowPrintPreview(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        setTimeout(() => setShowPrintPreview(false), 1000);
      }, 100);
    });
  };
  // Add this right before the return statement in QuotationView
  console.log("🖨️ Print Data Check:", {
    includedServices,
    excludedServices,
    hasIncluded: includedServices.length,
    hasExcluded: excludedServices.length,
  });

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
            includedServices={includedServices} // 🔥 ADD THIS LINE
            excludedServices={excludedServices} // 🔥 ADD THIS LINE
          />
        </div>
      )}

      {isSignatureModalOpen && currentSignature && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Digital Signature</h3>
              <button
                onClick={() => {
                  setIsSignatureModalOpen(false);
                  setCurrentSignature(null);
                }}
                className="text-3xl"
              >
                ×
              </button>
            </div>
            <img
              src={currentSignature}
              alt="Signature"
              className="w-full rounded-lg border"
            />
            <button
              onClick={() => {
                setIsSignatureModalOpen(false);
                setCurrentSignature(null);
              }}
              className="mt-4 w-full bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-3 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-8 flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-medium">
              Quotation Details
            </h2>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                <FaPrint /> Print
              </button>
              <button
                onClick={() => navigate(-1)}
                className="text-4xl hover:opacity-80"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Quotation Header */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Quotation Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Quotation ID
                  </label>
                  <input
                    type="text"
                    value={quotation.quotation_id || "Not specified"}
                    readOnly
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Serial No
                  </label>
                  <input
                    type="text"
                    value={quotation.serial_no || "Not specified"}
                    readOnly
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={quotation.date || "Not specified"}
                    readOnly
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {["Client Name", "Mobile", "Email"].map((label, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={[name, phone, email][i]}
                    readOnly
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50"
                  />
                </div>
              ))}
            </div>

            {/* Service Information */}
            {[
              { label: "Service Required", value: service },
              { label: "Moving From", value: get(survey.origin_address) },
              { label: "Moving To", value: movingTo },
              { label: "Date of Move", value: moveDate },
            ].map((item) => (
              <div key={item.label}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {item.label}
                </label>
                <input
                  type="text"
                  value={item.value}
                  readOnly
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50"
                />
              </div>
            ))}

            {/* 🔥 ADDITIONAL CHARGES DISPLAY */}
            {additionalCharges.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6">
                <h3 className="text-xl font-bold text-purple-900 mb-4">
                   Additional Services
                </h3>
                <div className="space-y-3">
                  {additionalCharges.map((charge) => {
                    const currencyName = charge.currency_name || "QAR";
                    const quantity = charge.per_unit_quantity || 1;
                    const subtotal = charge.price_per_unit * quantity;

                    return (
                      <div
                        key={charge.id}
                        className="bg-white border-2 border-purple-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-800">
                              {charge.service.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {charge.price_per_unit} {currencyName} ×{" "}
                              {quantity} unit(s)
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

            {/* 🔥 PRICING BREAKDOWN */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
              <h3 className="text-xl font-medium text-center mb-4">
                
                
                 Quotation Breakdown
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                  <div>
                    <span className="text-sm text-gray-600">
                      Base Amount (Volume Pricing)
                    </span>
                    <div className="text-xs text-gray-500">
                      {totalVolume} CBM × {destinationCity}
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-700">
                    {baseAmount.toFixed(2)} QAR
                  </span>
                </div>

                {additionalChargesTotal > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-gray-300">
                    <div>
                      <span className="text-sm text-gray-600">
                        Additional Services
                      </span>
                      <div className="text-xs text-gray-500">
                        {additionalCharges.length} service(s)
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-purple-700">
                      + {additionalChargesTotal.toFixed(2)} QAR
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-semibold text-gray-800">
                    Total Quotation Amount
                  </span>
                  <span className="text-4xl font-bold text-green-600">
                    {totalAmount.toFixed(2)} QAR
                  </span>
                </div>
              </div>
            </div>

            {/* Services Include/Exclude */}
            {/* Services Include/Exclude */}
            <div className="grid grid-cols-1 lg:grid-cols-2 border-2 border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 text-center text-lg font-medium">
                Service Includes
              </div>
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 text-center text-lg font-medium">
                Service Excludes
              </div>

              {/* INCLUDED SERVICES */}
              <div className="p-6 space-y-4 bg-gray-50">
                {includedServices.length > 0 ? (
                  includedServices.map((service, index) => (
                    <div
                      key={`include-${index}-${service}`}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs">Checkmark</span>
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {service}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No services included</p>
                )}
              </div>

              {/* EXCLUDED SERVICES */}
              <div className="p-6 space-y-4 bg-red-50 border-l-2 border-red-200">
                {excludedServices.length > 0 ? (
                  excludedServices.map((service, index) => (
                    <div
                      key={`exclude-${index}-${service}`}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-5 h-5 rounded bg-red-600 flex items-center justify-center">
                        <span className="text-white text-xs">X</span>
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {service}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No services excluded</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block font-medium">Total Amount</label>
                <input
                  type="text"
                  readOnly
                  value={`${totalAmount.toFixed(2)} QAR`}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50"
                />
              </div>
              <div>
                <label className="block font-medium">Advance</label>
                <input
                  type="text"
                  readOnly
                  value={`${advance.toFixed(2)} QAR`}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50"
                />
              </div>
              <div>
                <label className="block font-medium">Balance</label>
                <input
                  type="text"
                  readOnly
                  value={`${balance} QAR`}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-green-50 font-medium text-green-700"
                />
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-1">Digital Signature</h3>
              <div className="bg-gray-50 p-6 rounded-lg border text-center">
                {hasSignature ? (
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 md:gap-0">
                    <div className="text-center md:text-left">
                      <p className="font-medium text-green-700">
                        Digitally Signed
                      </p>
                      <p className="text-sm text-gray-600">
                        Customer signature is attached
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <button
                        onClick={viewSignature}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
                      >
                        <FaEye /> View
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <p className="text-gray-600 mb-4">
                      No signature uploaded yet
                    </p>
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <FaSignature className="text-gray-500 text-xl" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={handlePrint}
                className="w-full max-w-md mx-auto py-2 px-4 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-sm font-medium rounded-lg shadow-lg transition transform hover:from-[#3a586d] hover:to-[#54738a] hover:scale-105 flex items-center justify-center gap-2"
              >
                <FaPrint /> Print Quotation (PDF Ready)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
