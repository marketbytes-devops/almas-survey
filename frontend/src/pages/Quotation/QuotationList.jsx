import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaEye,
  FaEdit,
  FaSignature,
  FaTrash,
  FaSearch,
} from "react-icons/fa";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSurveys, setExpandedSurveys] = useState(new Set());

  // Signature modal state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get("/surveys/");
        const sorted = res.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        const surveysWithQuot = await Promise.all(
          sorted.map(async (s) => {
            try {
              const checkRes = await apiClient.get(
                `/quotation-create/check/?survey_id=${s.survey_id}`
              );
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

  // Apply search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSurveys(surveys);
      return;
    }

    const searchLower = searchQuery.toLowerCase().trim();
    const filtered = surveys.filter((s) => {
      const name = (s.full_name || s.enquiry?.fullName || "").toLowerCase();
      const phone = (
        s.phone_number ||
        s.enquiry?.phoneNumber ||
        ""
      ).toLowerCase();
      const email = (s.email || s.enquiry?.email || "").toLowerCase();
      const service = (
        SERVICE_TYPE_DISPLAY[s.service_type] ||
        SERVICE_TYPE_DISPLAY[s.enquiry?.serviceType] ||
        ""
      ).toLowerCase();
      const surveyId = (s.survey_id || "").toLowerCase();

      return (
        name.includes(searchLower) ||
        phone.includes(searchLower) ||
        email.includes(searchLower) ||
        service.includes(searchLower) ||
        surveyId.includes(searchLower)
      );
    });

    setFilteredSurveys(filtered);
  }, [searchQuery, surveys]);

  const toggleSurveyExpand = (surveyId) => {
    setExpandedSurveys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(surveyId)) {
        newSet.delete(surveyId);
      } else {
        newSet.add(surveyId);
      }
      return newSet;
    });
  };

  // 🔥 FIXED: Simplified - Just navigate, no draft creation needed
  const handleCreateQuotation = (surveyId) => {
    console.log("🎯 Creating quotation for survey:", surveyId);
    // Navigate to quotation create page with correct route structure
    navigate(`/quotation-create/survey/${surveyId}`);
  };

  const handleDeleteQuotation = async (surveyId, quotationId) => {
    if (!window.confirm("Are you sure you want to delete this quotation?"))
      return;

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
      const signatureRes = await apiClient.get(
        `/surveys/${survey.survey_id}/signature/`
      );
      setCurrentSignature(signatureRes.data.signature_url);
      setIsSignatureModalOpen(true);
    } catch (err) {
      setError("Failed to load signature");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );

  if (error && !message)
    return <div className="text-center text-red-600 p-5">{error}</div>;

  return (
    <div className="container mx-auto">
      {/* Signature View Modal */}
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

      {error && (
        <motion.div
          className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.div>
      )}
      {message && (
        <motion.div
          className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onAnimationComplete={() => setTimeout(() => setMessage(""), 3000)}
        >
          {message}
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, phone, email, service, or survey ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {filteredSurveys.length === 0 ? (
        <div className="text-center text-[#2d4a5e] text-sm p-5 bg-white shadow-sm rounded-lg">
          No Surveys Found
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white">
                <tr>
                  <th className="whitespace-nowrap px-6 py-4 text-left text-sm font-medium uppercase">
                    S.No
                  </th>
                  <th className="whitespace-nowrap px-6 py-4 text-left text-sm font-medium uppercase">
                    Survey ID
                  </th>
                  <th className="whitespace-nowrap px-6 py-4 text-left text-sm font-medium uppercase">
                    Customer
                  </th>
                  <th className="whitespace-nowrap px-6 py-4 text-left text-sm font-medium uppercase">
                    Phone
                  </th>
                  <th className="whitespace-nowrap px-6 py-4 text-left text-sm font-medium uppercase">
                    Email
                  </th>
                  <th className="whitespace-nowrap px-6 py-4 text-left text-sm font-medium uppercase">
                    Service
                  </th>
                  <th className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium uppercase">
                    Quotation
                  </th>
                  <th className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium uppercase">
                    Signature
                  </th>
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
                      className="hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-normal text-gray-800">
                        {idx + 1}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-normal text-gray-800">
                        {s.survey_id}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-normal text-gray-800">
                        {name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-normal text-gray-800">
                        <span className="flex items-center gap-2">
                          <FaPhoneAlt className="w-3 h-3" /> {phone}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-normal text-gray-800">
                        <span className="flex items-center gap-2">
                          <FaEnvelope className="w-3 h-3" /> {email}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-normal text-gray-800">
                        {service}
                      </td>
                      <td className="px-6 py-4">
                        {s.hasQuotation ? (
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              to={`/quotation-view/${s.quotation_id}`}
                              className="whitespace-nowrap inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                            >
                              <FaEye /> View
                            </Link>

                            <Link
                              to={`/quotation-edit/survey/${s.survey_id}`}
                              className="whitespace-nowrap inline-flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm"
                            >
                              <FaEdit /> Edit
                            </Link>

                            <button
                              onClick={() =>
                                handleDeleteQuotation(
                                  s.survey_id,
                                  s.quotation_id
                                )
                              }
                              className="whitespace-nowrap inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() =>
                                handleCreateQuotation(s.survey_id)
                              }
                              className="whitespace-nowrap inline-flex items-center bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] hover:from-[#3a586d] hover:to-[#54738a] text-white px-4 py-2 rounded text-sm font-medium transition shadow-md"
                            >
                              Create Quotation
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {s.signature_uploaded ? (
                          <button
                            onClick={() => viewSignature(s)}
                            className="whitespace-nowrap inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                          >
                            <FaSignature /> View
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            No Signature
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredSurveys.map((s, idx) => {
              const isExpanded = expandedSurveys.has(s.survey_id);
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
                  className="rounded-lg p-4 bg-white shadow-sm border border-gray-200"
                  variants={rowVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  {/* Collapsed View */}
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#2d4a5e]">
                        <strong>S.No:</strong> {idx + 1}
                      </p>
                      <p className="text-sm text-[#2d4a5e] mt-1">
                        <strong>Customer:</strong> {name}
                      </p>
                      <p className="text-sm text-[#2d4a5e] mt-1">
                        <strong>Survey ID:</strong> {s.survey_id}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSurveyExpand(s.survey_id)}
                      className="ml-4 w-8 h-8 flex items-center justify-center bg-[#4c7085] text-white rounded-full hover:bg-[#3a5a6d] transition-colors"
                    >
                      {isExpanded ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-[#2d4a5e] text-sm">
                          <p className="flex items-center gap-2">
                            <strong>Phone:</strong>
                            <span className="flex items-center gap-2 text-[#4c7085]">
                              <FaPhoneAlt className="w-3 h-3" /> {phone}
                            </span>
                          </p>
                          <p className="flex items-center gap-2">
                            <strong>Email:</strong>
                            <span className="flex items-center gap-2 text-[#4c7085]">
                              <FaEnvelope className="w-3 h-3" /> {email}
                            </span>
                          </p>
                          <p>
                            <strong>Service:</strong> {service}
                          </p>

                          {/* Quotation Actions */}
                          <div className="pt-2">
                            <p className="font-medium mb-2">Quotation:</p>
                            {s.hasQuotation ? (
                              <div className="flex flex-wrap gap-2">
                                <Link
                                  to={`/quotation-view/${s.quotation_id}`}
                                  className="whitespace-nowrap inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                                >
                                  <FaEye /> View
                                </Link>

                                <Link
                                  to={`/quotation-edit/survey/${s.survey_id}`}
                                  className="whitespace-nowrap inline-flex items-center gap-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm"
                                >
                                  <FaEdit /> Edit
                                </Link>

                                <button
                                  onClick={() =>
                                    handleDeleteQuotation(
                                      s.survey_id,
                                      s.quotation_id
                                    )
                                  }
                                  className="whitespace-nowrap inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
                                >
                                  <FaTrash /> Delete
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  handleCreateQuotation(s.survey_id)
                                }
                                className="whitespace-nowrap inline-flex items-center bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] hover:from-[#3a586d] hover:to-[#54738a] text-white px-4 py-2 rounded text-sm font-medium transition shadow-md"
                              >
                                Create Quotation
                              </button>
                            )}
                          </div>

                          {/* Signature */}
                          <div className="pt-2">
                            <p className="font-medium mb-2">Signature:</p>
                            {s.signature_uploaded ? (
                              <button
                                onClick={() => viewSignature(s)}
                                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                              >
                                <FaSignature /> View Signature
                              </button>
                            ) : (
                              <span className="text-gray-500 text-sm">
                                No Signature
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}