import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Country, State, City } from "country-state-city";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiPrinter,
  FiEdit,
  FiTrash2,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
  FiMapPin,
  FiTruck,
  FiBox,
  FiPlusCircle,
  FiPhone,
  FiMail,
  FiUser
} from "react-icons/fi";
import { FaSignature } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal"; // Assuming this exists based on other files
import ReactDOMServer from "react-dom/server";
import SurveyPrint from "../SurveyPrint";

// Reusable styling constants
const CARD_CLASS = "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md";
const INPUT_CLASS = "w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-[#4c7085] focus:ring-0 transition-all outline-none text-sm text-gray-700 placeholder-gray-400";
const LABEL_CLASS = "block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1";
const BUTTON_BASE = "px-4 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 flex items-center justify-center gap-2";

const SurveySummary = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [filteredSurveys, setFilteredSurveys] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [printing, setPrinting] = useState(null);

  // Modal States
  const [statusModal, setStatusModal] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [signatureModalUrl, setSignatureModalUrl] = useState(null);
  const [surveySignatures, setSurveySignatures] = useState({});
  const [selectedArticlePhoto, setSelectedArticlePhoto] = useState(null);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const formatStatus = (status) => {
    const map = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return map[status] || status || "Not filled";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-600 border-green-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'in_progress': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  useEffect(() => {
    const fetchSurveys = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/surveys/");
        const surveysWithQuotationStatus = response.data.map((survey) => ({
          ...survey,
          hasQuotation: survey.has_quotation,
          quotation_id: survey.quotation_id,
          quotation_created_at: survey.quotation_created_at,
        }));
        // Sort by date descending
        const sorted = surveysWithQuotationStatus.sort((a, b) => new Date(b.created_at || b.survey_date) - new Date(a.created_at || a.survey_date));
        setSurveys(sorted);
        setFilteredSurveys(sorted);
      } catch (err) {
        setError("Failed to fetch surveys. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  useEffect(() => {
    const fetchSignatureUrls = async () => {
      if (surveys.length === 0) return;

      const newSignatures = { ...surveySignatures };
      let hasUpdate = false;

      for (const survey of surveys) {
        if (survey.signature_uploaded && !newSignatures[survey.survey_id]) {
          try {
            const res = await apiClient.get(`/surveys/${survey.survey_id}/signature/`);
            newSignatures[survey.survey_id] = res.data.signature_url;
            hasUpdate = true;
          } catch (err) {
            console.warn(`Failed to load signature for survey ${survey.survey_id}:`, err);
          }
        }
      }

      if (hasUpdate) {
        setSurveySignatures(newSignatures);
      }
    };

    fetchSignatureUrls();
  }, [surveys]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSurveys(surveys);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = surveys.filter(s =>
        (s.survey_id && s.survey_id.toLowerCase().includes(q)) ||
        (s.full_name && s.full_name.toLowerCase().includes(q)) ||
        (s.enquiry?.fullName && s.enquiry.fullName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
      setFilteredSurveys(filtered);
    }
  }, [searchQuery, surveys]);

  const getCountryName = (code) => code ? Country.getCountryByCode(code)?.name || code : "Not filled";
  const getStateName = (country, state) => country && state ? State.getStateByCodeAndCountry(state, country)?.name || state : "Not filled";
  const getCityName = (country, state, city) => city || "Not filled";

  const toggleSectionExpansion = (id) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (!window.confirm("Are you sure you want to delete this survey? This action cannot be undone.")) return;
    try {
      await apiClient.delete(`/surveys/${surveyId}/`);
      setSuccess("Survey deleted successfully!");
      setSurveys((prev) => prev.filter((s) => s.survey_id !== surveyId));
    } catch {
      setError("Failed to delete survey.");
    }
  };

  const handleEditSurvey = (survey) => {
    navigate(`/survey/${survey.survey_id}/survey-details`, {
      state: {
        customerData: {
          surveyId: survey.survey_id,
          fullName: survey.full_name || survey.enquiry?.fullName || "Not filled",
          phoneNumber: survey.phone_number || survey.enquiry?.phoneNumber || "Not filled",
          email: survey.email || survey.enquiry?.email || "Not filled",
          serviceType: survey.service_type || survey.enquiry?.serviceType || "",
          serviceTypeDisplay: survey.service_type_display || survey.service_type_name || "N/A",
          surveyDate: survey.survey_date ? new Date(survey.survey_date) : null,
          surveyStartTime: survey.survey_start_time ? new Date(`1970-01-01T${survey.survey_start_time}`) : null,
          customer_id: survey.enquiry?.id || null,
          enquiry_id: survey.enquiry || null,
        },
        articles: survey.articles || [],
        vehicles: survey.vehicles || [],
        additionalServices: survey.additional_services || [],
        serviceData: {
          general_owner_packed: survey.general_owner_packed || false,
          general_owner_packed_notes: survey.general_owner_packed_notes || "",
          general_restriction: survey.general_restriction || false,
          general_restriction_notes: survey.general_restriction_notes || "",
          general_handyman: survey.general_handyman || false,
          general_handyman_notes: survey.general_handyman_notes || "",
          general_insurance: survey.general_insurance || false,
          general_insurance_notes: survey.general_insurance_notes || "",
          origin_floor: survey.origin_floor || false,
          origin_floor_notes: survey.origin_floor_notes || "",
          origin_lift: survey.origin_lift || false,
          origin_lift_notes: survey.origin_lift_notes || "",
          origin_parking: survey.origin_parking || false,
          origin_parking_notes: survey.origin_parking_notes || "",
          origin_storage: survey.origin_storage || false,
          origin_storage_notes: survey.origin_storage_notes || "",
          destination_floor: survey.destination_floor || false,
          destination_floor_notes: survey.destination_floor_notes || "",
          destination_lift: survey.destination_lift || false,
          destination_lift_notes: survey.destination_lift_notes || "",
          destination_parking: survey.destination_parking || false,
          destination_parking_notes: survey.destination_parking_notes || "",
        },
      },
    });
  };

  const updateSurveyStatus = async () => {
    if (!statusModal || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const response = await apiClient.patch(`/surveys/${statusModal.survey_id}/`, {
        status: statusModal.newStatus,
      });
      setSurveys((prev) => prev.map((s) => s.survey_id === statusModal.survey_id ? response.data : s));
      setSuccess(`Status updated to ${formatStatus(statusModal.newStatus)}`);
      setStatusModal(null);
    } catch {
      setError("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrintSurvey = async (survey) => {
    if (printing) return;
    setPrinting(survey.survey_id);
    try {
      const htmlContent = ReactDOMServer.renderToString(<SurveyPrint survey={survey} />);
      const printWindow = window.open("", "_blank", "width=850,height=650,scrollbars=yes,resizable=yes");
      if (!printWindow) throw new Error("Popup blocked");
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Survey Report - ${survey.survey_id}</title>
          <meta charset="UTF-8">
          <style>
            @page { size: A4 portrait; margin: 0.75in; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: Arial, sans-serif; font-size: 10pt; color: #000; margin: 0; padding: 0; background: white; }
            .print-header { text-align: center; padding-bottom: 12px; margin-bottom: 20px; }
            .print-header h1 { font-size: 18pt; color: #4c7085; margin: 0 0 8px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { border: 1px solid #000; padding: 6px 4px; font-size: 9pt; vertical-align: top; }
            th { background-color: #e8f0f2 !important; font-weight: bold; }
          </style>
        </head>
        <body>${htmlContent}
          <script>
            window.onload = () => { setTimeout(() => window.print(), 500); };
            window.onafterprint = () => setTimeout(() => window.close(), 1000);
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    } catch (err) {
      setError(`Print failed: ${err.message}`);
    } finally {
      setTimeout(() => setPrinting(null), 1500);
    }
  };

  const handleCreateQuotation = (surveyId) => {
    navigate(`/quotation-create/survey/${surveyId}`);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "Not filled";
  const formatTime = (t) => {
    if (!t) return "Not filled";
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${period}`;
  };
  const formatVolume = (volume) => {
    if (!volume && volume !== 0) return "-";
    const num = parseFloat(volume);
    return num % 1 === 0 ? num.toString() : num.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  };

  // Internal Component for expanding details
  const SurveyDetailsView = ({ survey }) => {
    const totalVolume = survey.articles ? survey.articles.reduce((total, a) => {
      const vol = parseFloat(a.volume) || 0;
      const qty = parseInt(a.quantity) || 1;
      return total + vol * qty;
    }, 0) : 0;

    return (
      <div className="bg-gray-50/50 border-t border-gray-100 p-6 space-y-8">

        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className={LABEL_CLASS}>Full Name</span>
            <p className="text-sm font-medium text-gray-800">{survey.full_name || survey.enquiry?.fullName || "Not filled"}</p>
          </div>
          <div className="space-y-1">
            <span className={LABEL_CLASS}>Mobile</span>
            <p className="text-sm font-medium text-gray-800">{survey.phone_number || survey.enquiry?.phoneNumber || "Not filled"}</p>
          </div>
          <div className="space-y-1">
            <span className={LABEL_CLASS}>Email</span>
            <p className="text-sm font-medium text-gray-800 break-all">{survey.email || survey.enquiry?.email || "Not filled"}</p>
          </div>
          <div className="space-y-1">
            <span className={LABEL_CLASS}>Customer Type</span>
            <p className="text-sm font-medium text-gray-800">{survey.customer_type_name || "Not filled"}</p>
          </div>
          <div className="space-y-1">
            <span className={LABEL_CLASS}>Survey Date</span>
            <p className="text-sm font-medium text-gray-800">{formatDate(survey.survey_date)}</p>
          </div>
          <div className="space-y-1">
            <span className={LABEL_CLASS}>Start Time</span>
            <p className="text-sm font-medium text-gray-800">{formatTime(survey.survey_start_time)}</p>
          </div>
          <div className="space-y-1">
            <span className={LABEL_CLASS}>End Time</span>
            <p className="text-sm font-medium text-gray-800">{formatTime(survey.survey_end_time)}</p>
          </div>
          <div className="space-y-1">
            <span className={LABEL_CLASS}>Service Type</span>
            <p className="text-sm font-medium text-gray-800">{survey.service_type_display || survey.service_type_name || "N/A"}</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="flex items-center gap-2 text-sm font-medium text-[#4c7085] mb-4">
              <FiMapPin className="w-4 h-4" /> Origin Address
            </h4>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-600 block mb-1">Address</span>
                <p className="text-sm text-gray-700">{survey.origin_address || "Not filled"}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-xs text-gray-600 block mb-1">City</span>
                  <p className="text-sm text-gray-700">{getCityName(survey.origin_country, survey.origin_state, survey.origin_city)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-600 block mb-1">State</span>
                  <p className="text-sm text-gray-700">{getStateName(survey.origin_country, survey.origin_state)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-600 block mb-1">Country</span>
                  <p className="text-sm text-gray-700">{getCountryName(survey.origin_country)}</p>
                </div>
              </div>
              {survey.origin_gps && (
                <a href={survey.origin_gps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs font-medium text-blue-500 hover:underline mt-2">
                  Open in Maps &rarr;
                </a>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {survey.destination_addresses?.map((a, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="flex items-center gap-2 text-sm font-medium text-[#4c7085] mb-4">
                  <FiMapPin className="w-4 h-4" /> Destination Address {i + 1}
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-600 block mb-1">Address</span>
                    <p className="text-sm text-gray-700">{a.address || "Not filled"}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-xs text-gray-600 block mb-1">City</span>
                      <p className="text-sm text-gray-700">{getCityName(a.country, a.state, a.city)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600 block mb-1">State</span>
                      <p className="text-sm text-gray-700">{getStateName(a.country, a.state)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600 block mb-1">Country</span>
                      <p className="text-sm text-gray-700">{getCountryName(a.country)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(!survey.destination_addresses || survey.destination_addresses.length === 0) && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center p-8 h-full min-h-[150px]">
                <p className="text-gray-600 text-sm">No destination address recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Articles */}
        {survey.articles?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-medium text-gray-800 flex items-center gap-2">
                <FiBox className="text-[#4c7085]" /> Articles
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">{survey.articles.length}</span>
              </h4>
              <p className="text-sm font-medium text-[#4c7085]">Total Vol: {formatVolume(totalVolume)} m³</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-normal">Room</th>
                    <th className="px-6 py-3 font-normal">Item</th>
                    <th className="px-6 py-3 font-normal">Qty</th>
                    <th className="px-6 py-3 font-normal">Volume</th>
                    <th className="px-6 py-3 font-normal">Crate</th>
                    <th className="px-6 py-3 font-normal">Status</th>
                    <th className="px-6 py-3 font-normal text-right">Photo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {survey.articles.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 text-gray-600">{a.room_name || a.room || "-"}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{a.item_name || "-"}</td>
                      <td className="px-6 py-3 text-gray-600 bg-gray-50/30">{a.quantity || "-"}</td>
                      <td className="px-6 py-3 text-gray-600">{a.volume ? `${formatVolume(a.volume)} ${a.volume_unit_name || "m³"}` : "-"}</td>
                      <td className="px-6 py-3">
                        {a.crate_required ? (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase font-semibold">Yes</span>
                        ) : (
                          <span className="text-[10px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 uppercase font-semibold">No</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {a.move_status === "not_moving" ? (
                          <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full border border-red-100">Not Moving</span>
                        ) : (
                          <span className="text-xs text-green-500 bg-green-50 px-2 py-1 rounded-full border border-green-100">Moving</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {a.photo ? (
                          <button
                            onClick={() => setSelectedArticlePhoto({ url: a.photo, item: a.item_name, room: a.room_name || a.room })}
                            className="text-[#4c7085] hover:text-[#3a586d] underline text-xs"
                          >
                            View
                          </button>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50/80 font-semibold text-[#4c7085]">
                  <tr>
                    <td colSpan="3" className="px-6 py-3 text-right uppercase tracking-wider text-[10px]">Total Inventory Volume</td>
                    <td className="px-6 py-3 text-base">{formatVolume(totalVolume)} m³</td>
                    <td colSpan="3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Vehicles */}
        {survey.vehicles?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h4 className="font-medium text-gray-800 flex items-center gap-2">
                <FiTruck className="text-[#4c7085]" /> Vehicles
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">{survey.vehicles.length}</span>
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-normal">Type</th>
                    <th className="px-6 py-3 font-normal">Make</th>
                    <th className="px-6 py-3 font-normal">Model</th>
                    <th className="px-6 py-3 font-normal">Insurance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {survey.vehicles.map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 text-gray-600">{v.vehicle_type_name || v.vehicle_type || "-"}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{v.make || "-"}</td>
                      <td className="px-6 py-3 text-gray-600">{v.model || "-"}</td>
                      <td className="px-6 py-3">
                        {v.insurance ? (
                          <span className="text-xs text-green-500 bg-green-50 px-2 py-1 rounded-full border border-green-100">Yes</span>
                        ) : (
                          <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Additional Services */}
        {survey.additional_services?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h4 className="font-medium text-gray-800 flex items-center gap-2">
                <FiPlusCircle className="text-[#4c7085]" /> Additional Services
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">{survey.additional_services.length}</span>
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-normal">Service</th>
                    <th className="px-6 py-3 font-normal">Qty</th>
                    <th className="px-6 py-3 font-normal">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {survey.additional_services.map((service, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-800">{service.name || "Unknown Service"}</td>
                      <td className="px-6 py-3 text-gray-600">{service.quantity || 1}</td>
                      <td className="px-6 py-3 text-gray-600 italic">{service.remarks || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loading /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <PageHeader
        title="Survey Summaries"
        subtitle="Overview of all completed and pending surveys"
        extra={
          <button
            onClick={() => navigate("/scheduled-surveys")}
            className={`${BUTTON_BASE} bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 shadow-sm`}
          >
            <FiCalendar className="w-4 h-4" /> Schedule
          </button>
        }
      />

      <AnimatePresence>
        {(error || success) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className={`p-4 rounded-xl border flex items-center justify-between mb-4 ${error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
              <span className="text-sm font-medium">{error || success}</span>
              <button onClick={() => { setError(null); setSuccess(null); }} className="text-current opacity-70 hover:opacity-100">×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search surveys by ID, client name, email..."
            className={`${INPUT_CLASS} pl-11`}
          />
        </div>
        <div className="text-sm text-gray-600 font-medium px-2">
          {filteredSurveys.length} Records
        </div>
      </div>

      {/* Data Display */}
      {filteredSurveys.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiSearch className="text-gray-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">No surveys found</h3>
          <p className="text-gray-600 text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table Header (Only Visible on LG) */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 rounded-xl border border-gray-100 text-xs font-medium text-gray-600 uppercase tracking-widest">
            <div className="col-span-3">Survey & Client</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-2">Service</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          {filteredSurveys.map((survey, index) => {
            const isExpanded = expandedSections.has(survey.survey_id);
            const statusClass = getStatusColor(survey.status);

            return (
              <motion.div
                layout
                key={`${survey.survey_id}-${index}`}
                className={CARD_CLASS}
              >
                <div className="p-5">
                  <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:items-center">

                    {/* Survey & Client */}
                    <div className="col-span-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{survey.survey_id}</span>
                        {survey.quotation_id && (
                          <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">Quote sent</span>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-800 text-base">{survey.full_name || survey.enquiry?.fullName || "Unknown Client"}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FiCalendar /> {formatDate(survey.survey_date)}
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiPhone className="text-gray-300" /> {survey.phone_number || survey.enquiry?.phoneNumber || "-"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiMail className="text-gray-300" />
                        <span className="truncate max-w-[150px]" title={survey.email}>{survey.email || "-"}</span>
                      </div>
                    </div>

                    {/* Service */}
                    <div className="col-span-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100/50">
                        <FiTruck className="w-3.5 h-3.5" />
                        {survey.service_type_display || survey.service_type_name || "Service"}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setStatusModal({ ...survey, newStatus: survey.status }); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-2 w-fit transition-all hover:brightness-95 ${statusClass}`}
                      >
                        {formatStatus(survey.status)}
                        <FiEdit className="w-3 h-3 opacity-50" />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 flex items-center justify-end flex-wrap gap-2">
                      {survey.hasQuotation ? (
                        <button onClick={() => navigate(`/quotation-view/${survey.quotation_id}`)} className={`${BUTTON_BASE} bg-purple-50 text-purple-600 hover:bg-purple-100`} title="View Quotation">
                          <FiFileText /> Quote
                        </button>
                      ) : (
                        <button onClick={() => handleCreateQuotation(survey.survey_id)} className={`${BUTTON_BASE} bg-indigo-50 text-indigo-600 hover:bg-indigo-100`} title="Create Quote">
                          <FiFileText /> Quote
                        </button>
                      )}

                      <button onClick={() => handleEditSurvey(survey)} className={`${BUTTON_BASE} bg-amber-50 text-amber-600 hover:bg-amber-100`} title="Edit Survey">
                        <FiEdit />
                      </button>

                      <button onClick={() => handlePrintSurvey(survey)} disabled={printing === survey.survey_id} className={`${BUTTON_BASE} bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50`} title="Print">
                        <FiPrinter />
                      </button>

                      {survey.signature_uploaded && surveySignatures[survey.survey_id] && (
                        <button onClick={() => setSignatureModalUrl(surveySignatures[survey.survey_id])} className={`${BUTTON_BASE} bg-teal-50 text-teal-600 hover:bg-teal-100`} title="Signature">
                          <FaSignature />
                        </button>
                      )}

                      <button onClick={() => handleDeleteSurvey(survey.survey_id)} className={`${BUTTON_BASE} bg-red-50 text-red-600 hover:bg-red-100`} title="Delete">
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  {/* Expand Toggle */}
                  <button
                    onClick={() => toggleSectionExpansion(survey.survey_id)}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-600 hover:text-[#4c7085] hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {isExpanded ? (
                      <>Hide Details <FiChevronUp /></>
                    ) : (
                      <>Show Full Details <FiChevronDown /></>
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <SurveyDetailsView survey={survey} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>

        {/* Status Update Modal */}
        <Modal
          isOpen={!!statusModal}
          onClose={() => setStatusModal(null)}
          title={`Update Status - ${statusModal?.survey_id}`}
          footer={
            <>
              <button
                onClick={() => setStatusModal(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateSurveyStatus}
                disabled={updatingStatus}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[#4c7085] text-white hover:bg-[#3a586d] transition-shadow shadow-sm disabled:opacity-50"
              >
                {updatingStatus ? "Updating" : "Confirm Update"}
              </button>
            </>
          }
        >
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">Change the current status of the survey.</p>
            <div className="space-y-2">
              {statusOptions.map((opt) => (
                <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${statusModal?.newStatus === opt.value ? 'bg-[#4c7085]/5 border-[#4c7085] shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    checked={statusModal?.newStatus === opt.value}
                    onChange={(e) => setStatusModal({ ...statusModal, newStatus: e.target.value })}
                    className="text-[#4c7085] focus:ring-[#4c7085]"
                  />
                  <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </Modal>

        {/* Signature Modal */}
        <Modal
          isOpen={!!signatureModalUrl}
          onClose={() => setSignatureModalUrl(null)}
          title="Digital Signature"
          footer={
            <button onClick={() => setSignatureModalUrl(null)} className="w-full px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
              Close Preview
            </button>
          }
        >
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 min-h-[200px]">
            <img src={signatureModalUrl} alt="Signature" className="max-w-full max-h-[50vh] object-contain mix-blend-multiply" />
          </div>
        </Modal>

        {/* Photo Preview Modal */}
        <Modal
          isOpen={!!selectedArticlePhoto}
          onClose={() => setSelectedArticlePhoto(null)}
          title={selectedArticlePhoto?.item || "Photo Preview"}
          footer={
            <button onClick={() => setSelectedArticlePhoto(null)} className="w-full px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
              Close
            </button>
          }
        >
          <div className="p-1">
            <p className="text-xs text-gray-600 mb-3 flex items-center gap-1"><FiMapPin /> {selectedArticlePhoto?.room}</p>
            <div className="flex items-center justify-center bg-black/5 rounded-xl overflow-hidden min-h-[300px]">
              <img src={selectedArticlePhoto?.url} alt="Item" className="max-w-full max-h-[60vh] object-contain" />
            </div>
          </div>
        </Modal>

      </AnimatePresence>
    </div>
  );
};

// Simple Button Component Replacement for the internal 'Button' usage if needed, 
// strictly we will use standard HTML buttons with Tailwind classes in the render for best control.
// The imported Button component is removed from usage in favor of direct standard elements to ensure styling match.

export default SurveySummary;