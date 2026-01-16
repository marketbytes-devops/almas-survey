import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Country, State, City } from "country-state-city";
import apiClient from "../../api/apiClient";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import ReactDOMServer from "react-dom/server";
import SurveyPrint from "../SurveyPrint";
import { FaEye, FaEdit, FaTrash, FaSignature } from "react-icons/fa";

const SurveySummary = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [printing, setPrinting] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [signatureModalUrl, setSignatureModalUrl] = useState(null);
  const [surveySignatures, setSurveySignatures] = useState({});

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
        setSurveys(surveysWithQuotationStatus);
      } catch (err) {
        setError("Failed to fetch surveys. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  useEffect(() => {
    if (surveys.length === 0) return;

    const fetchSignatureUrls = async () => {
      const newSignatures = { ...surveySignatures };
      let hasUpdate = false;

      for (const survey of surveys) {
        if (survey.signature_uploaded && !newSignatures[survey.survey_id]) {
          try {
            const res = await apiClient.get(
              `/surveys/${survey.survey_id}/signature/`
            );
            newSignatures[survey.survey_id] = res.data.signature_url;
            hasUpdate = true;
          } catch (err) {
            console.warn(
              `Failed to load signature for survey ${survey.survey_id}:`,
              err
            );
          }
        }
      }

      if (hasUpdate) {
        setSurveySignatures(newSignatures);
      }
    };

    fetchSignatureUrls();
  }, [surveys]);

  const getCountryName = (code) =>
    code ? Country.getCountryByCode(code)?.name || code : "Not filled";
  const getStateName = (country, state) =>
    country && state
      ? State.getStateByCodeAndCountry(state, country)?.name || state
      : "Not filled";
  const getCityName = (country, state, city) => city || "Not filled";

  const toggleSectionExpansion = (id) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this survey? This action cannot be undone."
      )
    )
      return;
    try {
      await apiClient.delete(`/surveys/${surveyId}/`);
      setSuccess("Survey deleted successfully!");
      setSurveys((prev) => prev.filter((s) => s.survey_id !== surveyId));
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to delete survey.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEditSurvey = (survey) => {
    navigate(`/survey/${survey.survey_id}/survey-details`, {
      state: {
        customerData: {
          surveyId: survey.survey_id,
          fullName:
            survey.full_name || survey.enquiry?.fullName || "Not filled",
          phoneNumber:
            survey.phone_number || survey.enquiry?.phoneNumber || "Not filled",
          email: survey.email || survey.enquiry?.email || "Not filled",
          serviceType: survey.service_type || survey.enquiry?.serviceType || "",
          serviceTypeDisplay:
            survey.service_type_display || survey.service_type_name || "N/A",
          surveyDate: survey.survey_date ? new Date(survey.survey_date) : null,
          surveyStartTime: survey.survey_start_time
            ? new Date(`1970-01-01T${survey.survey_start_time}`)
            : null,
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

  const openStatusModal = (survey) => setStatusModal(survey);

  const updateSurveyStatus = async () => {
    if (!statusModal || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const response = await apiClient.patch(
        `/surveys/${statusModal.survey_id}/`,
        {
          status: statusModal.newStatus,
        }
      );
      setSurveys((prev) =>
        prev.map((s) =>
          s.survey_id === statusModal.survey_id ? response.data : s
        )
      );
      setSuccess(`Status updated to ${formatStatus(statusModal.newStatus)}`);
      setTimeout(() => setSuccess(null), 3000);
      setStatusModal(null);
    } catch {
      setError("Failed to update status.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrintSurvey = async (survey) => {
    if (printing) return;
    setPrinting(survey.survey_id);
    try {
      const htmlContent = ReactDOMServer.renderToString(
        <SurveyPrint survey={survey} />
      );
      const printWindow = window.open(
        "",
        "_blank",
        "width=850,height=650,scrollbars=yes,resizable=yes"
      );
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
      setTimeout(() => setError(null), 5000);
    } finally {
      setTimeout(() => setPrinting(null), 1500);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB").split("/").reverse().join("/")
      : "Not filled";
  const formatTime = (t) => {
    if (!t) return "Not filled";
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${period}`;
  };
  const formatBoolean = (v) => (v ? "Yes" : "No");
  const formatVolume = (volume) => {
    if (!volume && volume !== 0) return "-";
    const num = parseFloat(volume);
    return num % 1 === 0
      ? num.toString()
      : num.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  };
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

  const handleCreateQuotation = (surveyId) => {
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
      setSuccess("Quotation deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to delete quotation");
      setTimeout(() => setError(null), 3000);
    }
  };

  const SurveyDetailsView = ({ survey }) => {
    const getPhone = () =>
      survey.phone_number || survey.enquiry?.phoneNumber || "Not filled";
    const getService = () =>
      survey.service_type_display || survey.service_type_name || "N/A";

    const totalVolume = survey.articles
      ? survey.articles.reduce((total, a) => {
        const vol = parseFloat(a.volume) || 0;
        const qty = parseInt(a.quantity) || 1;
        return total + vol * qty;
      }, 0)
      : 0;

    const DetailItem = ({ label, value, icon }) => (
      <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#4c7085]">{icon}</span>}
          <span className="text-gray-500 font-medium text-xs sm:text-sm">{label}</span>
        </div>
        <span className="text-gray-900 font-semibold text-xs sm:text-sm text-right ml-4">{value}</span>
      </div>
    );

    const SectionHeader = ({ title, icon, count }) => (
      <div className="flex items-center justify-between mb-4 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-[#4c7085] to-[#6b8ca3] shadow-sm"></div>
          <h4 className="font-medium text-gray-900 text-base sm:text-lg flex items-center gap-2">
            {icon}
            {title}
          </h4>
        </div>
        {count !== undefined && (
          <span className="px-3 py-1 bg-gray-100 text-[#4c7085] rounded-full text-xs font-medium border border-gray-200 shadow-sm">
            {count}
          </span>
        )}
      </div>
    );

    return (
      <div className="p-2 sm:p-6 bg-white rounded-lg shadow-xl border border-gray-100 w-full mx-auto">
        {/* Customer Details */}
        <div className="section mb-2 sm:mb-6">
          <SectionHeader title="Customer Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 px-1">
            <DetailItem label="Customer Type" value={survey.customer_type_name || "Not filled"} />
            <DetailItem label="Full Name" value={survey.full_name || survey.enquiry?.fullName || "Not filled"} />
            <DetailItem label="Mobile Number" value={getPhone()} />
            <DetailItem label="Email Address" value={survey.email || survey.enquiry?.email || "Not filled"} />
            <DetailItem label="Service Type" value={getService()} />
          </div>
        </div>

        {/* Survey Details */}
        <div className="section mb-2 sm:mb-6">
          <SectionHeader title="Survey Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 px-1">
            <DetailItem label="Status" value={
              <span className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${survey.status === "completed" ? "bg-[#4c7085] text-white" :
                survey.status === "cancelled" ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-600"
                }`}>
                {formatStatus(survey.status)}
              </span>
            } />
            <DetailItem label="Survey Date" value={formatDate(survey.survey_date)} />
            <DetailItem label="Start Time" value={formatTime(survey.survey_start_time)} />
            <DetailItem label="End Time" value={formatTime(survey.survey_end_time)} />
          </div>
        </div>

        {/* Origin Address */}
        <div className="section mb-2 sm:mb-6">
          <SectionHeader title="Origin Information" />
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-4">
            <p className="text-sm text-gray-800 font-medium leading-relaxed">{survey.origin_address || "No address provided"}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 px-1">
            <DetailItem label="City" value={getCityName(survey.origin_country, survey.origin_state, survey.origin_city)} />
            <DetailItem label="Country/State" value={`${getCountryName(survey.origin_country)} / ${getStateName(survey.origin_country, survey.origin_state)}`} />
            <DetailItem label="GPS Location" value={
              survey.origin_gps ? (
                <a href={survey.origin_gps} target="_blank" rel="noopener noreferrer" className="text-[#4c7085] hover:underline font-medium flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Maps Link
                </a>
              ) : <span className="text-gray-400 italic font-normal">Not captured</span>
            } />
          </div>
        </div>

        {/* Destination Addresses */}
        {survey.destination_addresses?.length > 0 && (
          <div className="section mb-2 sm:mb-6">
            <SectionHeader title="Destination Locations" count={survey.destination_addresses.length} />
            <div className="space-y-4">
              {survey.destination_addresses.map((a, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-[#4c7085] text-white flex items-center justify-center text-[10px] font-medium">
                      {i + 1}
                    </span>
                    <h5 className="font-medium text-gray-800 text-sm">Destination Point</h5>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">{a.address || "No address details"}</p>
                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                      <div><span className="text-gray-400 block mb-2">City</span><span className="font-semibold text-gray-800">{getCityName(a.country, a.state, a.city)}</span></div>
                      <div><span className="text-gray-400 block mb-2">Country</span><span className="font-semibold text-gray-800">{getCountryName(a.country)}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Articles */}
        {survey.articles?.length > 0 && (
          <div className="section mb-2 sm:mb-6">
            <SectionHeader title="Inventory Articles" count={survey.articles.length} />

            {/* Desktop View */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-medium">Room / Item</th>
                    <th className="px-4 py-3 text-center font-medium">Qty</th>
                    <th className="px-4 py-3 text-center font-medium">Volume</th>
                    <th className="px-4 py-3 text-center font-medium">Crate</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {survey.articles.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{a.item_name || "Item"}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-tighter font-medium">{a.room_name || a.room || "No Room"}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-700">{a.quantity || 1}</td>
                      <td className="px-4 py-3 text-center font-medium text-gray-600">
                        {a.volume ? `${formatVolume(a.volume)} ${a.volume_unit_name || "m³"}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-widest ${a.crate_required ? "bg-[#4c7085] text-white" : "bg-gray-100 text-gray-500"}`}>
                          {a.crate_required ? "YES" : "NO"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-widest ${a.move_status === "not_moving" ? "bg-gray-200 text-gray-700" : "bg-[#4c7085]/10 text-[#4c7085]"}`}>
                          {a.move_status === "not_moving" ? "NOT MOVING" : "MOVING"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#4c7085] text-white font-medium">
                    <td colSpan="2" className="px-4 py-4 text-right uppercase tracking-wider text-xs">Total Estimated Volume</td>
                    <td className="px-4 py-4 text-center text-lg">{formatVolume(totalVolume)} m³</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {survey.articles.map((a, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-gray-900 text-lg">{a.item_name || "Item"}</h5>
                      <span className="text-[10px] font-medium text-[#4c7085] uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md">
                        {a.room_name || a.room || "General"}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider ${a.move_status === "not_moving" ? "bg-gray-200 text-gray-700" : "bg-[#4c7085]/10 text-[#4c7085]"}`}>
                        {a.move_status === "not_moving" ? "NOT MOVING" : "MOVING"}
                      </span>
                      {a.crate_required && (
                        <span className="px-2 py-0.5 bg-[#4c7085] text-white rounded-full text-[9px] font-medium uppercase tracking-wider">CRATE REQ</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-medium tracking-tight block mb-1">Quantity</span>
                      <span className="text-lg font-black text-gray-800">{a.quantity || 1}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-medium tracking-tight block mb-1">Volume</span>
                      <span className="text-lg font-black text-gray-800">{a.volume ? formatVolume(a.volume) : "-"} <small className="text-xs font-normal text-gray-500 uppercase">{a.volume_unit_name || "m³"}</small></span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-gradient-to-br from-[#4c7085] to-[#6b8ca3] text-white rounded-2xl shadow-lg flex justify-between items-center overflow-hidden relative">
                <div className="absolute -right-6 -bottom-6 opacity-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="font-medium text-sm uppercase tracking-widest z-10">Total Volume</span>
                <span className="text-2xl font-medium z-10">{formatVolume(totalVolume)} <small className="text-sm font-normal opacity-80 uppercase">m³</small></span>
              </div>
            </div>
          </div>
        )}

        {/* Vehicles */}
        {survey.vehicles?.length > 0 && (
          <div className="section mb-2 sm:mb-6">
            <SectionHeader title="Vehicle Details" count={survey.vehicles.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {survey.vehicles.map((v, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[#4c7085]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 leading-tight">{v.vehicle_type_name || v.vehicle_type || "Vehicle"}</h5>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{v.make || "-"} / {v.model || "-"}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${v.insurance ? "bg-[#4c7085] text-white" : "bg-gray-100 text-gray-400"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${v.insurance ? "bg-white" : "bg-gray-300"}`}></div>
                      {v.insurance ? "INSURED" : "NO INSURANCE"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Services */}
        {survey.additional_services?.length > 0 && (
          <div className="section mb-2 sm:mb-6">
            <SectionHeader title="Additional Services" count={survey.additional_services.length} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {survey.additional_services.map((service, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[#4c7085]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h5 className="font-medium text-gray-900 text-lg leading-tight">{service.name || "Service"}</h5>
                    </div>
                    <span className="bg-[#4c7085] text-white px-3 py-1 rounded-full text-xs font-black">x{service.quantity || 1}</span>
                  </div>
                  {service.remarks && (
                    <div className="bg-gray-50 p-4 rounded-xl border-l-4 border-gray-300 text-sm text-gray-600 italic">
                      "{service.remarks}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  if (surveys.length === 0)
    return (
      <div className="text-center text-gray-600 py-10">
        No surveys available.
      </div>
    );

  return (
    <div className="mx-auto">
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#4c7085] border border-[#4c7085] text-white px-4 py-3 rounded mb-4 shadow-lg flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-black text-white px-4 py-3 rounded mb-4 flex items-center gap-2 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={() => navigate("/scheduled-surveys")}
          className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg w-full sm:w-auto"
        >
          Back to Scheduled
        </Button>
      </div>

      <div className="space-y-2 sm:space-y-6">
        {surveys.map((survey) => {
          const phone =
            survey.phone_number || survey.enquiry?.phoneNumber || "Not filled";
          const service =
            survey.service_type_display || survey.service_type_name || "N/A";
          const surveyDate = formatDate(survey.survey_date);
          const startTime = formatTime(survey.survey_start_time);
          const endTime = formatTime(survey.survey_end_time);

          return (
            <motion.div
              key={survey.survey_id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-gray-300 rounded-lg overflow-hidden shadow-md"
            >
              <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] p-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs sm:text-lg font-medium">
                      {survey.survey_id}
                    </h3>
                    <p className="text-xs sm:text-sm mt-2">
                      {survey.full_name || survey.enquiry?.fullName || "N/A"}
                    </p>
                    <p className="text-xs sm:text-sm mt-2">{phone}</p>
                    <div className="mt-3 block sm:flex items-center justify-center space-x-4 space-y-2 sm:space-y-0 text-xs">
                      <div>
                        <span className="font-medium">Survey Date:</span>{" "}
                        {surveyDate}
                      </div>
                      <div>
                        <span className="font-medium">Start:</span> {startTime}
                      </div>
                      <div>
                        <span className="font-medium">End:</span> {endTime}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{service}</p>
                    <p
                      className={`inline-block mt-1 px-3 py-1 rounded text-xs font-medium ${survey.status === "completed"
                        ? "bg-[#4c7085] text-white"
                        : survey.status === "cancelled"
                          ? "bg-white/20 text-white"
                          : "bg-white text-[#4c7085]"
                        }`}
                    >
                      {formatStatus(survey.status)}
                    </p>
                    {survey.quotation_created_at && (
                      <p className="text-xs mt-1 text-white/80">
                        Quotation: {formatDateTime(survey.quotation_created_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-end">
                <Button
                  onClick={() =>
                    openStatusModal({ ...survey, newStatus: survey.status })
                  }
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 text-xs sm:text-sm font-medium rounded w-full sm:w-auto transition-colors"
                >
                  Update Status
                </Button>

                {survey.hasQuotation ? (
                  <Button
                    onClick={() =>
                      navigate(`/quotation-view/${survey.quotation_id}`)
                    }
                    className="bg-white border border-[#4c7085] text-[#4c7085] hover:bg-[#4c7085] hover:text-white px-4 py-2 text-xs sm:text-sm font-medium rounded flex items-center justify-center gap-2 w-full sm:w-auto transition-all"
                  >
                    <FaEye /> View Quotation
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCreateQuotation(survey.survey_id)}
                    className="bg-[#4c7085] hover:bg-[#3a5464] text-white px-4 py-2 text-xs sm:text-sm font-medium rounded w-full sm:w-auto transition-colors"
                  >
                    Create Quotation
                  </Button>
                )}
                <Button
                  onClick={() => handleEditSurvey(survey)}
                  className="bg-gray-600 hover:bg-black text-white px-4 py-2 text-sm rounded w-full sm:w-auto transition-colors"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handlePrintSurvey(survey)}
                  disabled={printing === survey.survey_id}
                  className={`border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 text-xs sm:text-sm font-medium rounded flex items-center justify-center gap-2 w-full sm:w-auto transition-colors ${printing === survey.survey_id ? "opacity-50" : ""
                    }`}
                >
                  {printing === survey.survey_id ? "Printing..." : "Print"}
                </Button>
                <Button
                  onClick={() => handleDeleteSurvey(survey.survey_id)}
                  className="bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-100 px-4 py-2 text-xs sm:text-sm font-medium rounded w-full sm:w-auto transition-colors"
                >
                  Delete
                </Button>
                {survey.signature_uploaded &&
                  surveySignatures[survey.survey_id] ? (
                  <Button
                    onClick={() =>
                      setSignatureModalUrl(surveySignatures[survey.survey_id])
                    }
                    className="bg-[#4c7085]/10 text-[#4c7085] hover:bg-[#4c7085] hover:text-white px-4 py-2 text-xs sm:text-sm font-medium rounded flex items-center justify-center gap-2 w-full sm:w-auto transition-all"
                  >
                    <FaSignature /> Signature
                  </Button>
                ) : null}
              </div>

              <button
                onClick={() => toggleSectionExpansion(survey.survey_id)}
                className="w-full py-3 text-center bg-gray-200 hover:bg-[#6b8ca3] hover:text-white transition-colors text-xs sm:text-sm font-medium"
              >
                {expandedSections.has(survey.survey_id)
                  ? "Hide Details"
                  : "Show Details"}
              </button>

              <AnimatePresence>
                {expandedSections.has(survey.survey_id) && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <SurveyDetailsView survey={survey} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {statusModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 p-4"
            onClick={() => setStatusModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-medium mb-4">
                Update Survey Status - {statusModal.survey_id}
              </h3>
              <select
                value={statusModal.newStatus || ""}
                onChange={(e) =>
                  setStatusModal((prev) => ({
                    ...prev,
                    newStatus: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#4c7085]"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  onClick={() => setStatusModal(null)}
                  className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateSurveyStatus}
                  disabled={updatingStatus || !statusModal.newStatus}
                  className="px-5 py-2 bg-[#4c7085] hover:bg-[#6b8ca3] text-white rounded-lg disabled:opacity-50 w-full sm:w-auto"
                >
                  {updatingStatus ? "Updating..." : "Update Survey Status"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {signatureModalUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSignatureModalUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg max-w-3xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg">Digital Signature</h3>
                <button
                  onClick={() => setSignatureModalUrl(null)}
                  className="text-3xl hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <img
                src={signatureModalUrl}
                alt="Customer signature"
                className="w-full max-h-[70vh] object-contain border border-gray-300 rounded-lg shadow-lg"
              />
              <Button
                onClick={() => setSignatureModalUrl(null)}
                className="mt-6 w-full bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-3 rounded-lg"
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SurveySummary;
