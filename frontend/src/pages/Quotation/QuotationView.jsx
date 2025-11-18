import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSignature, FaEye, FaPrint } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import QuotationLocalMove from "../../components/Templates/QuotationLocalMove"; // Your template

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
  const [showPrintPreview, setShowPrintPreview] = useState(false); // Print trigger

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
  if (error) return <div className="text-center text-red-600">{error}</div>;
  if (!quotation || !survey) return null;

  const name = get(survey.full_name, survey.enquiry?.fullName);
  const phone = get(survey.phone_number, survey.enquiry?.phoneNumber);
  const email = get(survey.email, survey.enquiry?.email);
  const service = SERVICE_TYPE_DISPLAY[survey.service_type] || "Not filled";

  const buildingFrom = [
    survey.origin_floor ? "Floor" : "",
    survey.origin_lift ? "Lift" : "",
  ].filter(Boolean).join(" + ") || "Not filled";

  const movingTo = survey.destination_addresses?.[0]?.address || "Not filled";
  const moveDate = survey.packing_date_from || "Not filled";

  const totalAmount = quotation.amount ? parseFloat(quotation.amount) : 0;
  const advance = quotation.advance ? parseFloat(quotation.advance) : 0;
  const balance = (totalAmount - advance).toFixed(2);

  // Print Button Handler
  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 500);
  };

  return (
    <>
      {/* Print Preview Modal (Hidden normally, shown only during print) */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-[9999] bg-white">
          <QuotationLocalMove
            quotation={quotation}
            survey={survey}
            name={name}
            phone={phone}
            email={email}
            service={service}
            buildingFrom={buildingFrom}
            movingTo={movingTo}
            moveDate={moveDate}
            totalAmount={totalAmount}
            advance={advance}
            balance={balance}
          />
        </div>
      )}

      {/* Signature Modal */}
      {isSignatureModalOpen && currentSignature && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Digital Signature</h3>
              <button onClick={() => { setIsSignatureModalOpen(false); setCurrentSignature(null); }} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              <img src={currentSignature} alt="Digital Signature" className="w-full h-auto max-h-64 object-contain" />
            </div>
            <div className="mt-4 text-center">
              <button onClick={() => { setIsSignatureModalOpen(false); setCurrentSignature(null); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Quotation Details</h2>
          <div className="flex gap-4">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition">
              <FaPrint /> Print Quotation
            </button>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <FaArrowLeft /> Back
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] p-4 text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <p><strong>Quotation ID:</strong> {quotation.quotation_id}</p>
              <p><strong>Serial No:</strong> {quotation.serial_no || "—"}</p>
              <p><strong>Date:</strong> {quotation.date || "—"}</p>
            </div>
          </div>

          {/* Client Information - 2 Columns */}
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-800 mb-4">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div><span className="font-medium text-gray-700">Name:</span> <span className="ml-2">{name}</span></div>
                <div><span className="font-medium text-gray-700">Mobile:</span> <span className="ml-2">{phone}</span></div>
              </div>
              <div className="space-y-4">
                <div><span className="font-medium text-gray-700">Email:</span> <span className="ml-2">{email}</span></div>
                <div><span className="font-medium text-gray-700">Service Required:</span> <span className="ml-2">{service}</span></div>
              </div>
            </div>
          </div>

          {/* Moving Details - 2 Columns */}
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-800 mb-4">Moving Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div><span className="font-medium text-gray-700">Moving From:</span> <span className="ml-2">{get(survey.origin_address)}</span></div>
                <div><span className="font-medium text-gray-700">Building / Floor:</span> <span className="ml-2">{buildingFrom}</span></div>
              </div>
              <div className="space-y-4">
                <div><span className="font-medium text-gray-700">Moving To:</span> <span className="ml-2">{movingTo}</span></div>
                <div><span className="font-medium text-gray-700">Move Date:</span> <span className="ml-2">{moveDate}</span></div>
              </div>
            </div>
          </div>

          {/* Quotation Amount */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <h3 className="text-xl font-bold text-center mb-4">Quotation Amount</h3>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#4c7085]">
                {totalAmount.toFixed(2)} <span className="text-3xl">QAR</span>
              </div>
            </div>
          </div>

          {/* Service Includes/Excludes */}
          <div className="p-6 border-b">
            <div className="rounded-xl overflow-hidden border-2 border-gray-300">
              <div className="grid grid-cols-2 text-white font-bold text-lg">
                <div className="bg-gradient-to-r from-gray-600 to-gray-700 py-4 text-center">SERVICE INCLUDES</div>
                <div className="bg-gradient-to-r from-red-600 to-red-700 py-4 text-center">SERVICE EXCLUDES</div>
              </div>
              <div className="grid grid-cols-2 bg-gray-50">
                <div className="p-6 space-y-3">
                  {SERVICE_INCLUDES.map(s => (
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
                <div className="p-6 space-y-3 bg-red-50 border-l-2 border-red-200">
                  {SERVICE_EXCLUDES.map(s => (
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
            </div>
          </div>

          {/* Digital Signature */}
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-800 mb-3">Digital Signature</h3>
            <div className="bg-gray-50 p-4 rounded-lg border">
              {hasSignature ? (
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FaSignature className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Digitally Signed</p>
                      <p className="text-sm text-green-600">This quotation has been digitally signed by the customer.</p>
                    </div>
                  </div>
                  <button onClick={viewSignature} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                    <FaEye /> View Signature
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaSignature className="text-gray-500 text-xl" />
                  </div>
                  <p className="text-gray-600">No digital signature uploaded.</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-6 bg-gray-50">
            <h3 className="font-semibold text-gray-800 mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-700">{totalAmount.toFixed(2)} QAR</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Advance</p>
                <p className="text-2xl font-bold text-gray-700">{advance.toFixed(2)} QAR</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Balance</p>
                <p className="text-2xl font-bold text-green-700">{balance} QAR</p>
              </div>
            </div>
          </div>

          <div className="text-center pb-6 mx-6">
            <button
              onClick={handlePrint}
              className="w-full text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <FaPrint /> Print Quotation (PDF Ready)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}