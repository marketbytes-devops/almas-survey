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

const SERVICE_INCLUDES = [
  "Packing Service",
  "Customer packed boxes collection",
  "Miscellaneous items packing",
  "Furniture dismantling and packing",
  "Loading",
  "Transportation",
  "Unloading , unpacking",
  "Furniture assembly",
  "Debris removal on same day",
];

const SERVICE_EXCLUDES = [
  "Insurance",
  "Storage",
  "Cleaning service, plumbing service , electrical works if any",
  "Chandelier removal / installation/ Plan soil removal, Wall installation",
];

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

  const checkSignatureExists = async (surveyId) => {
    try {
      const signatureRes = await apiClient.get(`/surveys/${surveyId}/signature/`);
      setHasSignature(!!signatureRes.data.signature_url);
      setCurrentSignature(signatureRes.data.signature_url);
    } catch (err) {
      setHasSignature(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const quotRes = await apiClient.get(`/quotation-create/${id}/`);
        const quot = quotRes.data;
        setQuotation(quot);

        if (quot.survey_id) {
          const surveyRes = await apiClient.get(`/surveys/${quot.survey_id}/`);
          setSurvey(surveyRes.data);
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
      const signatureRes = await apiClient.get(`/surveys/${survey.survey_id}/signature/`);
      setCurrentSignature(signatureRes.data.signature_url);
      setIsSignatureModalOpen(true);
    } catch (err) {
      setError("Failed to load signature");
    }
  };

  const get = (primary, fallback) => primary ?? fallback ?? "Not filled";

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  if (error) return <div className="text-center text-red-600 p-5">{error}</div>;
  if (!quotation || !survey) return null;

  const name = get(survey.full_name, survey.enquiry?.fullName);
  const phone = get(survey.phone_number, survey.enquiry?.phoneNumber);
  const email = get(survey.email, survey.enquiry?.email);
  const service = SERVICE_TYPE_DISPLAY[survey.service_type] || "Not filled";

  const movingTo = survey.destination_addresses?.[0]?.address || "Not filled";
  const moveDate = survey.packing_date_from || "Not filled";

  const totalAmount = quotation.amount ? parseFloat(quotation.amount) : 0;
  const advance = quotation.advance ? parseFloat(quotation.advance) : 0;
  const balance = (totalAmount - advance).toFixed(2);

  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 500);
  };

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
          />
        </div>
      )}

      {isSignatureModalOpen && currentSignature && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Digital Signature</h3>
              <button onClick={() => { setIsSignatureModalOpen(false); setCurrentSignature(null); }} className="text-3xl">×</button>
            </div>
            <img src={currentSignature} alt="Signature" className="w-full rounded-lg border" />
            <button
              onClick={() => { setIsSignatureModalOpen(false); setCurrentSignature(null); }}
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
            <h2 className="text-lg sm:text-xl font-medium">Quotation Details</h2>
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
              <h3 className="text-sm font-medium text-blue-800 mb-2">Quotation Information</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                <input 
                  type="text" 
                  value={item.value} 
                  readOnly 
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50" 
                />
              </div>
            ))}

            {/* Quotation Amount */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
              <h3 className="text-xl font-medium text-center mb-4">Quotation Amount</h3>
              <div className="text-center">
                <p className="text-5xl font-medium text-[#4c7085]">
                  {totalAmount.toFixed(2)} <span className="text-3xl">QAR</span>
                </p>
              </div>
            </div>

            {/* Services Include/Exclude */}
            <div className="grid grid-cols-1 lg:grid-cols-2 border-2 border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 text-center text-lg font-medium">
                Service Includes
              </div>
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 text-center text-lg font-medium">
                Service Excludes
              </div>
              <div className="p-6 space-y-4 bg-gray-50">
                {SERVICE_INCLUDES.map((s) => (
                  <div key={s} className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded ${quotation.included_services?.includes(s) ? "bg-blue-600" : "border-2 border-gray-400"}`}>
                      {quotation.included_services?.includes(s) && 
                        <span className="text-white text-xs flex justify-center items-center h-full">✓</span>
                      }
                    </div>
                    <span className={`text-sm font-medium ${quotation.included_services?.includes(s) ? "text-gray-800" : "text-gray-500"}`}>{s}</span>
                  </div>
                ))}
              </div>
              <div className="p-6 space-y-4 bg-red-50 border-l-2 border-red-200">
                {SERVICE_EXCLUDES.map((s) => (
                  <div key={s} className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded ${quotation.excluded_services?.includes(s) ? "bg-red-600" : "border-2 border-gray-400"}`}>
                      {quotation.excluded_services?.includes(s) && 
                        <span className="text-white text-xs flex justify-center items-center h-full">✗</span>
                      }
                    </div>
                    <span className={`text-sm font-medium ${quotation.excluded_services?.includes(s) ? "text-gray-800" : "text-gray-500"}`}>{s}</span>
                  </div>
                ))}
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
                      <p className="font-medium text-green-700">Digitally Signed</p>
                      <p className="text-sm text-gray-600">Customer signature is attached</p>
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
                    <p className="text-gray-600 mb-4">No signature uploaded yet</p>
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