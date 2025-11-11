import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPhoneAlt, FaEnvelope, FaEye, FaEdit, FaSignature } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const SERVICE_TYPE_DISPLAY = {
  localMove: "Local Move",
  internationalMove: "International Move",
  carExport: "Car Import and Export",
  storageServices: "Storage Services",
  logistics: "Logistics",
};

const rowVariants = {
  hover: { backgroundColor: "#f3f4f6" },
  rest: { backgroundColor: "#ffffff" },
};

export default function QuotationList() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [filteredSurveys, setFilteredSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  
  // Signature modal state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get("/surveys/");
        const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const surveysWithQuot = await Promise.all(
          sorted.map(async (s) => {
            try {
              const checkRes = await apiClient.get(`/quotation-create/check/?survey_id=${s.survey_id}`);
              return {
                ...s,
                hasQuotation: checkRes.data.exists,
                quotation_id: checkRes.data.quotation_id,
              };
            } catch {
              return { ...s, hasQuotation: false };
            }
          })
        );
        setSurveys(surveysWithQuot);
        setFilteredSurveys(surveysWithQuot);
      } catch (e) {
        setError("Failed to load surveys.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreateQuotation = async (surveyId) => {
    try {
      const surveyRes = await apiClient.get(`/surveys/${surveyId}/`);
      const survey = surveyRes.data;

      const res = await apiClient.post("/quotation-create/create-draft/", {
        survey_id: survey.id,
      });

      setSurveys((prev) =>
        prev.map((s) =>
          s.survey_id === surveyId
            ? {
              ...s,
              hasQuotation: true,
              quotation_id: res.data.quotation_id,
            }
            : s
        )
      );
      setFilteredSurveys((prev) =>
        prev.map((s) =>
          s.survey_id === surveyId
            ? {
              ...s,
              hasQuotation: true,
              quotation_id: res.data.quotation_id,
            }
            : s
        )
      );

      navigate(`/quotation-edit/${surveyId}`);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to create draft quotation";
      setError(msg);
    }
  };

  const handleDeleteQuotation = async (surveyId, quotationId) => {
    if (!window.confirm("Are you sure you want to delete this quotation?")) return;

    try {
      await apiClient.delete("/quotation-create/delete/", {
        data: { quotation_id: quotationId },
      });

      setSurveys((prev) =>
        prev.map((s) =>
          s.survey_id === surveyId
            ? { ...s, hasQuotation: false, quotation_id: null }
            : s
        )
      );
      setFilteredSurveys((prev) =>
        prev.map((s) =>
          s.survey_id === surveyId
            ? { ...s, hasQuotation: false, quotation_id: null }
            : s
        )
      );
      setMessage("Quotation deleted successfully");
    } catch (err) {
      setError("Failed to delete quotation");
    }
  };

  // View signature
  const viewSignature = async (survey) => {
    try {
      // Fetch signature URL from backend
      const signatureRes = await apiClient.get(`/surveys/${survey.survey_id}/signature/`);
      setCurrentSignature(signatureRes.data.signature_url);
      setIsSignatureModalOpen(true);
    } catch (err) {
      setError("Failed to load signature");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loading />
    </div>
  );

  if (error && !message) return (
    <div className="text-center text-red-600 p-5">{error}</div>
  );

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

      {error && (
        <motion.div
          className="mb-4 p-4 bg-red-100 text-red-700 rounded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}
      {message && (
        <motion.div
          className="mb-4 p-4 bg-green-100 text-green-700 rounded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onAnimationComplete={() => setTimeout(() => setMessage(""), 3000)}
        >
          {message}
        </motion.div>
      )}

      {filteredSurveys.length === 0 ? (
        <div className="text-center text-[#2d4a5e] p-5 bg-white shadow-sm rounded-lg">
          No surveys available.
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">Service</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase">Quotation</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase">Signature</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSurveys.map((s, idx) => {
                  const name = s.full_name || s.enquiry?.fullName || "—";
                  const phone = s.phone_number || s.enquiry?.phoneNumber || "—";
                  const email = s.email || s.enquiry?.email || "—";
                  const service =
                    SERVICE_TYPE_DISPLAY[s.service_type] ||
                    SERVICE_TYPE_DISPLAY[s.enquiry?.serviceType] ||
                    "—";

                  return (
                    <motion.tr
                      key={s.survey_id}
                      variants={rowVariants}
                      initial="rest"
                      whileHover="hover"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <FaPhoneAlt className="w-3 h-3" /> {phone}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <FaEnvelope className="w-3 h-3" /> {email}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{service}</td>
                      <td className="px-4 py-3 text-center space-x-2">
                        {s.hasQuotation ? (
                          <>
                            <Link
                              to={`/quotation-view/${s.quotation_id}`}
                              className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                            >
                              <FaEye /> View
                            </Link>
                            <Link
                              to={`/quotation-edit/${s.survey_id}`}
                              className="inline-flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs"
                            >
                              <FaEdit /> Edit
                            </Link>
                          </>
                        ) : (
                          <Link
                            to={`/quotation-create/${s.survey_id}`}
                            className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                          >
                            Create
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.signature_uploaded ? (
                          <button
                            onClick={() => viewSignature(s)}
                            className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                          >
                            <FaSignature /> View Sign
                          </button>
                        ) : (
                          <span className="text-gray-500 text-xs">No Signature</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-4">
            {filteredSurveys.map((s, idx) => {
              const name = s.full_name || s.enquiry?.fullName || "—";
              const phone = s.phone_number || s.enquiry?.phoneNumber || "—";
              const email = s.email || s.enquiry?.email || "—";
              const service =
                SERVICE_TYPE_DISPLAY[s.service_type] ||
                SERVICE_TYPE_DISPLAY[s.enquiry?.serviceType] ||
                "—";

              return (
                <motion.div
                  key={s.survey_id}
                  className="p-5 bg-white rounded-lg shadow-sm"
                  variants={rowVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  <div className="space-y-2 text-sm">
                    <p><strong>S.No:</strong> {idx + 1}</p>
                    <p><strong>Customer:</strong> {name}</p>
                    <p className="flex items-center gap-1">
                      <strong>Phone:</strong> <FaPhoneAlt className="w-3 h-3" /> {phone}
                    </p>
                    <p className="flex items-center gap-1">
                      <strong>Email:</strong> <FaEnvelope className="w-3 h-3" /> {email}
                    </p>
                    <p><strong>Service:</strong> {service}</p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {!s.hasQuotation ? (
                        <button
                          onClick={() => handleCreateQuotation(s.survey_id)}
                          className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs cursor-pointer"
                        >
                          Create
                        </button>
                      ) : (
                        <>
                          <Link
                            to={`/quotation-view/${s.quotation_id}`}
                            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                          >
                            <FaEye /> View
                          </Link>
                          <Link
                            to={`/quotation-edit/${s.survey_id}`}
                            className="inline-flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs"
                          >
                            <FaEdit /> Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteQuotation(s.survey_id, s.quotation_id)}
                            className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>

                    <div className="pt-2">
                      {s.signature_uploaded ? (
                        <button
                          onClick={() => viewSignature(s)}
                          className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs w-full justify-center"
                        >
                          <FaSignature /> View Signature
                        </button>
                      ) : (
                        <span className="text-gray-500 text-xs block text-center">No Signature</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}