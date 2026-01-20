import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPhone,
  FiMail,
  FiSearch,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiChevronDown,
  FiChevronUp
} from "react-icons/fi";
import { IoLogoWhatsapp } from "react-icons/io";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import { FaSignature } from "react-icons/fa";

const SERVICE_TYPE_DISPLAY = {
  localMove: "Local Move",
  internationalMove: "International Move",
  carExport: "Car Import and Export",
  storageServices: "Storage Services",
  logistics: "Logistics",
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
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get("/surveys/");
        const sorted = res.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        const processed = sorted.map(s => ({
          ...s,
          hasQuotation: s.has_quotation,
        }));
        setSurveys(processed);
        setFilteredSurveys(processed);
      } catch (e) {
        setError("Failed to load surveys.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSurveys(surveys);
      return;
    }
    const searchLower = searchQuery.toLowerCase().trim();
    const filtered = surveys.filter((s) => {
      const name = (s.full_name || s.enquiry?.fullName || "").toLowerCase();
      const phone = (s.phone_number || s.enquiry?.phoneNumber || "").toLowerCase();
      const email = (s.email || s.enquiry?.email || "").toLowerCase();
      const service = (SERVICE_TYPE_DISPLAY[s.service_type] || SERVICE_TYPE_DISPLAY[s.enquiry?.serviceType] || "").toLowerCase();
      const surveyId = (s.survey_id || "").toLowerCase();
      const quotationId = (s.quotation_id || "").toLowerCase();
      return (
        name.includes(searchLower) ||
        phone.includes(searchLower) ||
        email.includes(searchLower) ||
        service.includes(searchLower) ||
        surveyId.includes(searchLower) ||
        quotationId.includes(searchLower)
      );
    });
    setFilteredSurveys(filtered);
    setCurrentPage(1);
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

  const handleCreateQuotation = (surveyId) => {
    navigate(`/quotation-create/survey/${surveyId}`);
  };

  const handleDeleteQuotation = async (surveyId, quotationId) => {
    if (!window.confirm("Are you sure you want to delete this quotation?\nThis will also permanently delete the customer's digital signature if it exists.")) return;

    try {
      await apiClient.delete("/quotation-create/delete/", {
        data: { quotation_id: quotationId },
      });

      try {
        await apiClient.delete(`/quotation-create/${quotationId}/signature/`);
      } catch (sigErr) {
        if (sigErr.response?.status !== 404) {
          console.warn("Could not delete quotation signature:", sigErr);
        }
      }

      setSurveys((prev) =>
        prev.map((s) =>
          s.survey_id === surveyId
            ? { ...s, hasQuotation: false, quotation_id: null, quotation_signature_uploaded: false }
            : s
        )
      );
      setFilteredSurveys((prev) =>
        prev.map((s) =>
          s.survey_id === surveyId
            ? { ...s, hasQuotation: false, quotation_id: null, quotation_signature_uploaded: false }
            : s
        )
      );

      setMessage("Quotation and signature deleted successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete quotation");
      setTimeout(() => setError(""), 3000);
    }
  };

  const viewSignature = async (survey) => {
    if (!survey.quotation_id) return;
    try {
      const signatureRes = await apiClient.get(
        `/quotation-create/${survey.quotation_id}/signature/`
      );
      setCurrentSignature(signatureRes.data.signature_url);
      setIsSignatureModalOpen(true);
    } catch (err) {
      setError("Failed to load signature");
      setTimeout(() => setError(""), 3000);
    }
  };

  const openPhoneModal = (survey) => {
    setSelectedSurvey(survey);
    setIsPhoneModalOpen(true);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSurveys.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage);

  if (loading) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Quotation Management"
        subtitle="Manage quotations and customer signatures"
        extra={
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-50">
            <FaSignature className="text-[#4c7085]" />
            {filteredSurveys.filter(s => s.hasQuotation).length} Active Quotations
          </div>
        }
      />

      {/* Global Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">×</button>
          </motion.div>
        )}
        {message && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-medium">{message}</span>
            <button onClick={() => setMessage("")} className="text-green-400 hover:text-green-600">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
            <FiSearch className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search by name, phone, email, survey ID, quotation ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-style w-full !pl-12 h-[56px] rounded-2xl border-gray-100 shadow-sm"
          />
        </div>
      </div>

      {/* Table & Grid Layout */}
      {filteredSurveys.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaSignature className="text-gray-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">No surveys found</h3>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search query</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest whitespace-nowrap">Survey ID</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest whitespace-nowrap">Customer</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest whitespace-nowrap">Contact</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest whitespace-nowrap">Service</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest whitespace-nowrap">Quotation</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest whitespace-nowrap">Created</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentItems.map((s) => {
                    const name = s.full_name || s.enquiry?.fullName || "—";
                    const phone = s.phone_number || s.enquiry?.phoneNumber || "—";
                    const email = s.email || s.enquiry?.email || "—";
                    const service = SERVICE_TYPE_DISPLAY[s.service_type] || SERVICE_TYPE_DISPLAY[s.enquiry?.serviceType] || "—";

                    return (
                      <tr key={s.survey_id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium text-sm flex-shrink-0">
                              <FaSignature className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{s.survey_id}</p>
                              <p className="text-xs text-gray-500">Survey</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <p className="font-medium text-gray-800">{name}</p>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <FiPhone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {phone}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                              <FiMail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100 inline-block">
                            {service}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          {s.hasQuotation ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-medium flex items-center gap-1.5 text-green-600">
                                <FiCheckCircle className="flex-shrink-0" /> {s.quotation_id}
                              </span>
                              {s.quotation_signature_uploaded && (
                                <span className="text-[10px] text-blue-500 flex items-center gap-1.5 font-medium">
                                  <FaSignature className="flex-shrink-0" /> Signed
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-medium flex items-center gap-1.5 text-amber-500">
                              <FiClock className="flex-shrink-0" /> Not Created
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            <p>{s.quotation_created_at ? new Date(s.quotation_created_at).toLocaleDateString() : "—"}</p>
                            {s.quotation_created_at && (
                              <p className="text-xs opacity-60">{new Date(s.quotation_created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {s.hasQuotation ? (
                              <>
                                <Link to={`/quotation-view/${s.quotation_id}`} className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all flex-shrink-0" title="View">
                                  <FiEye className="w-4.5 h-4.5" />
                                </Link>
                                <Link to={`/quotation-edit/${s.survey_id}`} className="w-9 h-9 flex items-center justify-center text-gray-400 bg-slate-50 hover:bg-gray-800 hover:text-white rounded-xl transition-all flex-shrink-0" title="Edit">
                                  <FiEdit3 className="w-4.5 h-4.5" />
                                </Link>
                                {s.quotation_signature_uploaded && (
                                  <button onClick={() => viewSignature(s)} className="w-9 h-9 flex items-center justify-center text-green-500 bg-green-50 hover:bg-green-500 hover:text-white rounded-xl transition-all flex-shrink-0" title="Signature">
                                    <FaSignature className="w-4.5 h-4.5" />
                                  </button>
                                )}
                                <button onClick={() => handleDeleteQuotation(s.survey_id, s.quotation_id)} className="w-9 h-9 flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all flex-shrink-0" title="Delete">
                                  <FiTrash2 className="w-4.5 h-4.5" />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => handleCreateQuotation(s.survey_id)} className="px-4 py-2 text-xs font-medium text-white bg-[#4c7085] hover:bg-[#6b8ca3] rounded-xl transition-all shadow-sm">
                                Create Quotation
                              </button>
                            )}
                            <button onClick={() => openPhoneModal(s)} className="w-9 h-9 flex items-center justify-center text-green-500 bg-green-50 hover:bg-green-500 hover:text-white rounded-xl transition-all" title="Contact">
                              <IoLogoWhatsapp className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Grid */}
          <div className="lg:hidden space-y-4">
            {currentItems.map((s) => {
              const isOpen = expandedSurveys.has(s.survey_id);
              const name = s.full_name || s.enquiry?.fullName || "—";
              const phone = s.phone_number || s.enquiry?.phoneNumber || "—";
              const email = s.email || s.enquiry?.email || "—";
              const service = SERVICE_TYPE_DISPLAY[s.service_type] || SERVICE_TYPE_DISPLAY[s.enquiry?.serviceType] || "—";

              return (
                <div key={s.survey_id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all shadow-sm">
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleSurveyExpand(s.survey_id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium">
                        <FaSignature className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm">{name}</h4>
                        <p className="text-[10px] text-gray-500 font-medium">{s.survey_id}</p>
                      </div>
                    </div>
                    {isOpen ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-gray-50/50">
                        <div className="p-4 space-y-4 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Service</p>
                              <p className="text-xs font-medium text-blue-600 mt-0.5">{service}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Status</p>
                              <p className={`text-xs font-medium mt-0.5 ${s.hasQuotation ? 'text-green-600' : 'text-amber-500'}`}>
                                {s.hasQuotation ? `Quotation: ${s.quotation_id}` : "Not Created"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Contact Info</p>
                            <p className="text-xs text-gray-700 mt-1 flex items-center gap-2"><FiPhone className="text-gray-300" /> {phone}</p>
                            <p className="text-xs text-gray-700 mt-1 flex items-center gap-2"><FiMail className="text-gray-300" /> {email}</p>
                          </div>
                          <div className="flex gap-2 pt-2">
                            {s.hasQuotation ? (
                              <>
                                <Link to={`/quotation-view/${s.quotation_id}`} className="flex-1 bg-[#4c7085] text-white py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 shadow-sm">
                                  <FiEye /> View
                                </Link>
                                <Link to={`/quotation-edit/${s.survey_id}`} className="flex-1 bg-white border border-gray-200 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 shadow-sm">
                                  <FiEdit3 /> Edit
                                </Link>
                                <button onClick={() => openPhoneModal(s)} className="w-[52px] bg-green-500 text-white rounded-xl flex items-center justify-center shadow-sm">
                                  <IoLogoWhatsapp className="w-5 h-5" />
                                </button>
                              </>
                            ) : (
                              <button onClick={() => handleCreateQuotation(s.survey_id)} className="flex-1 bg-[#4c7085] text-white py-2.5 rounded-xl text-xs font-medium shadow-sm">
                                Create Quotation
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-6">
            <p className="text-sm text-gray-500 hidden sm:block">
              Showing <span className="font-medium text-gray-800">{indexOfFirstItem + 1}</span> to <span className="font-medium text-gray-800">{Math.min(indexOfLastItem, filteredSurveys.length)}</span> of <span className="font-medium text-gray-800">{filteredSurveys.length}</span> surveys
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center px-4 text-sm font-medium text-[#4c7085] bg-[#4c7085]/10 rounded-xl">
                {currentPage} / {totalPages || 1}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {/* Contact Modal */}
        {isPhoneModalOpen && (
          <Modal isOpen={isPhoneModalOpen} onClose={() => setIsPhoneModalOpen(false)} title="Contact Client">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#4c7085] font-medium">
                  {selectedSurvey?.full_name?.charAt(0) || selectedSurvey?.enquiry?.fullName?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{selectedSurvey?.full_name || selectedSurvey?.enquiry?.fullName}</p>
                  <p className="text-sm text-gray-500 font-medium">{selectedSurvey?.phone_number || selectedSurvey?.enquiry?.phoneNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <a href={`tel:${selectedSurvey?.phone_number || selectedSurvey?.enquiry?.phoneNumber}`} className="bg-white border-2 border-gray-50 p-6 rounded-3xl flex flex-col items-center gap-3 hover:border-[#4c7085] transition-all group shadow-sm">
                  <div className="w-12 h-12 bg-[#4c7085]/10 rounded-full flex items-center justify-center text-[#4c7085] transition-transform"><FiPhone className="w-6 h-6" /></div>
                  <span className="font-medium text-gray-700">Call Now</span>
                </a>
                <a href={`https://wa.me/${(selectedSurvey?.phone_number || selectedSurvey?.enquiry?.phoneNumber)?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-gray-50 p-6 rounded-3xl flex flex-col items-center gap-3 hover:border-green-500 transition-all group shadow-sm">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500 transition-transform"><IoLogoWhatsapp className="w-7 h-7" /></div>
                  <span className="font-medium text-gray-700">WhatsApp</span>
                </a>
              </div>
            </div>
          </Modal>
        )}

        {/* Signature Modal */}
        {isSignatureModalOpen && currentSignature && (
          <Modal isOpen={isSignatureModalOpen} onClose={() => { setIsSignatureModalOpen(false); setCurrentSignature(null); }} title="Digital Signature">
            <div className="space-y-4">
              <img src={currentSignature} alt="Customer Signature" className="w-full rounded-2xl border border-gray-100" />
              <button onClick={() => { setIsSignatureModalOpen(false); setCurrentSignature(null); }} className="w-full btn-primary">
                Close
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}