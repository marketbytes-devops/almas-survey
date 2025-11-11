import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSignature, FaEye } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

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
  const [expanded, setExpanded] = useState(new Set());
  const [hasSignature, setHasSignature] = useState(false);
  
  // Signature modal state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);

  // Check if signature exists
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
          // Check signature existence
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

  const toggleSection = (section) => {
    setExpanded((prev) => {
      const newSet = new Set(prev);
      newSet.has(section) ? newSet.delete(section) : newSet.add(section);
      return newSet;
    });
  };

  // View signature
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
  const jobType = survey.service_type === "localMove" ? "Local" : "International";

  const buildingFrom = [
    survey.origin_floor ? "Floor" : "",
    survey.origin_lift ? "Lift" : "",
  ].filter(Boolean).join(" + ") || "Not filled";

  const movingTo = survey.destination_addresses?.[0]?.address || "Not filled";
  const moveDate = survey.packing_date_from || "Not filled";

  const rooms = (survey.articles || []).map(a => ({
    room: a.room_name || "—",
    item: a.item_name || "—",
    qty: a.quantity || 0,
    volume: a.volume ? parseFloat(a.volume).toFixed(2) : "0.00",
  }));

  const totalVolume = rooms
    .reduce((sum, r) => sum + parseFloat(r.volume) * r.qty, 0)
    .toFixed(2);

  const services = {
    wallInstallation: !!survey.general_handyman,
    curtainInstallation: !!survey.general_handyman,
    kitchenPacking: !!survey.general_owner_packed,
    clothesPacking: !!survey.general_owner_packed,
    clothesUnpacking: false,
    miscBoxPacking: !!survey.general_owner_packed,
    miscBoxUnpacking: false,
  };

  const balance =
    quotation.amount && quotation.advance
      ? (quotation.amount - quotation.advance).toFixed(2)
      : "—";

  const formatBoolean = (val) => (val ? "Yes" : "No");

  return (
    <div className="container mx-auto">
      {/* Signature View Modal */}
      {isSignatureModalOpen && currentSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Digital Signature</h3>
              <button
                onClick={() => {
                  setIsSignatureModalOpen(false);
                  setCurrentSignature(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              <img 
                src={currentSignature} 
                alt="Digital Signature" 
                className="w-full h-auto max-h-64 object-contain"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x150?text=Signature+Not+Found";
                }}
              />
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsSignatureModalOpen(false);
                  setCurrentSignature(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Quotation Details</h2>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft /> Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">

        {/* Quotation Header */}
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] p-4 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <p><strong>Quotation ID:</strong> {quotation.quotation_id}</p>
            <p><strong>Serial No:</strong> {quotation.serial_no || "—"}</p>
            <p><strong>Date:</strong> {quotation.date || "—"}</p>
          </div>
        </div>

        {/* Client Info */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-800 mb-3">Client Information</h3>
          <table className="w-full text-sm border border-gray-400">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-400 px-4 py-2 text-left">Field</th>
                <th className="border border-gray-400 px-4 py-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-400 px-4 py-2 font-medium">Name</td><td className="border border-gray-400 px-4 py-2">{name}</td></tr>
              <tr><td className="border border-gray-400 px-4 py-2 font-medium">Mobile</td><td className="border border-gray-400 px-4 py-2">{phone}</td></tr>
              <tr><td className="border border-gray-400 px-4 py-2 font-medium">Email</td><td className="border border-gray-400 px-4 py-2">{email}</td></tr>
              <tr><td className="border border-gray-400 px-4 py-2 font-medium">Service Required</td><td className="border border-gray-400 px-4 py-2">{service}</td></tr>
              <tr><td className="border border-gray-400 px-4 py-2 font-medium">Job Type</td><td className="border border-gray-400 px-4 py-2">{jobType}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Moving Details */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-800 mb-3">Moving Details</h3>
          <table className="w-full text-sm border border-gray-400">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-400 px-4 py-2 text-left">Field</th>
                <th className="border border-gray-400 px-4 py-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-400 px-4 py-2 font-medium">Moving From</td><td className="border border-gray-400 px-4 py-2">{get(survey.origin_address)}</td></tr>
              <tr><td className="border border-gray-400 px-4 py-2 font-medium">Building / Floor</td><td className="border border-gray-400 px-4 py-2">{buildingFrom}</td></tr>
              <tr><td className="border border-gray-400 px-4 py-2 font-medium">Moving To</td><td className="border border-gray-400 px-4 py-2">{movingTo}</td></tr>
              <tr><td className="border border-gray-400 px-4 py-2 font-medium">Move Date</td><td className="border border-gray-400 px-4 py-2">{moveDate}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Items & Volume */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800">Items & Volume</h3>
            <button
              onClick={() => toggleSection("items")}
              className="text-xs text-blue-600 hover:underline"
            >
              {expanded.has("items") ? "Hide" : "Show"} Table
            </button>
          </div>
          {expanded.has("items") && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-400">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-400 px-4 py-2 text-left">Room</th>
                    <th className="border border-gray-400 px-4 py-2 text-left">Item</th>
                    <th className="border border-gray-400 px-4 py-2 text-center">Qty</th>
                    <th className="border border-gray-400 px-4 py-2 text-center">Volume (cbm)</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-4 text-gray-500">No items</td></tr>
                  ) : (
                    rooms.map((r, i) => (
                      <tr key={i}>
                        <td className="border border-gray-400 px-4 py-2">{r.room}</td>
                        <td className="border border-gray-400 px-4 py-2">{r.item}</td>
                        <td className="border border-gray-400 px-4 py-2 text-center">{r.qty}</td>
                        <td className="border border-gray-400 px-4 py-2 text-center">{r.volume}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="text-right mt-2 font-bold text-[#4c7085]">
                Total Volume: {totalVolume} CBM
              </div>
            </div>
          )}
        </div>

        {/* Additional Services */}
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-800 mb-3">Additional Services</h3>
          <table className="w-full text-sm border border-gray-400">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-400 px-4 py-2 text-left">Service</th>
                <th className="border border-gray-400 px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(services).map(([key, val]) => (
                <tr key={key}>
                  <td className="border border-gray-400 px-4 py-2">
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-center">
                    {formatBoolean(val)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SERVICE INCLUDES & EXCLUDES */}
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
                        <span className="text-white text-xs flex justify-center items-center h-full">Check</span>
                      }
                    </div>
                    <span className={`text-sm font-medium ${quotation.included_services?.includes(s) ? "text-gray-800" : "text-gray-500"}`}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-6 space-y-3 bg-red-50 border-l-2 border-red-200">
                {SERVICE_EXCLUDES.map(s => (
                  <div key={s} className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded ${quotation.excluded_services?.includes(s) ? "bg-red-600" : "border-2 border-gray-400"}`}>
                      {quotation.excluded_services?.includes(s) && 
                        <span className="text-white text-xs flex justify-center items-center h-full">X</span>
                      }
                    </div>
                    <span className={`text-sm font-medium ${quotation.excluded_services?.includes(s) ? "text-gray-800" : "text-gray-500"}`}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Digital Signature Section */}
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
                <button
                  onClick={viewSignature}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                >
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

        {/* Amount & Payment */}
        <div className="p-6 bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-3">Payment Details</h3>
          <table className="w-full text-sm border border-gray-400">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-400 px-4 py-2 text-left">Field</th>
                <th className="border border-gray-400 px-4 py-2 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 px-4 py-2 font-medium">Total Amount</td>
                <td className="border border-gray-400 px-4 py-2">
                  {quotation.amount ? `${quotation.amount} ${quotation.currency_code || "QAR"}` : "—"}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-4 py-2 font-medium">Advance</td>
                <td className="border border-gray-400 px-4 py-2">
                  {quotation.advance ? `${quotation.advance} ${quotation.currency_code || "QAR"}` : "—"}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-4 py-2 font-medium">Balance</td>
                <td className="border border-gray-400 px-4 py-2 font-bold text-green-600">
                  {balance}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {quotation.notes && (
          <div className="p-6 border-t">
            <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
            <p className="p-3 bg-gray-50 rounded border">{quotation.notes}</p>
          </div>
        )}

        <div className="text-center pb-6 mx-6">
          <button
            onClick={() => navigate(-1)}
            className="w-full text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] hover:from-[#3a586d] hover:to-[#54738a] text-white px-4 py-2 rounded-xl shadow-lg transform transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}