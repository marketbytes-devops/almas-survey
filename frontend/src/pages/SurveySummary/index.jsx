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
  const [signatureModal, setSignatureModal] = useState(null);
  const [quotationStatus, setQuotationStatus] = useState({});

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const SERVICE_TYPE_DISPLAY = {
    localMove: "Local Move",
    internationalMove: "International Move",
    carExport: "Car Import and Export",
    storageServices: "Storage Services",
    logistics: "Logistics",
  };

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
        const surveysWithQuotationStatus = await Promise.all(
          response.data.map(async (survey) => {
            try {
              const checkRes = await apiClient.get(
                `/quotation-create/check/?survey_id=${survey.survey_id}`
              );
              let quotationCreatedAt = null;
              if (checkRes.data.exists && checkRes.data.quotation_id) {
                try {
                  const quotRes = await apiClient.get(
                    `/quotation-create/${checkRes.data.quotation_id}/`
                  );
                  quotationCreatedAt = quotRes.data.created_at;
                } catch (err) {
                  console.warn("Could not fetch quotation details for date");
                }
              }
              return {
                ...survey,
                hasQuotation: checkRes.data.exists,
                quotation_id: checkRes.data.quotation_id,
                quotation_created_at: quotationCreatedAt,
              };
            } catch {
              return {
                ...survey,
                hasQuotation: false,
                quotation_created_at: null,
              };
            }
          })
        );
        setSurveys(surveysWithQuotationStatus);
      } catch (err) {
        setError("Failed to fetch surveys. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, []);

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
  const formatVolume = (volume, unit) => {
    if (!volume && volume !== 0) return "-";
    const volumeStr = parseFloat(volume).toString();
    const unitStr = unit ? ` ${unit}` : "";
    return `${volumeStr}${unitStr}`;
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

  const viewSignature = async (survey) => {
    try {
      const signatureRes = await apiClient.get(
        `/surveys/${survey.survey_id}/signature/`
      );
      setSignatureModal(signatureRes.data.signature_url);
    } catch (err) {
      setError("Failed to load signature");
      setTimeout(() => setError(null), 3000);
    }
  };

  const SurveyDetailsView = ({ survey }) => {
    const getPhone = () =>
      survey.phone_number || survey.enquiry?.phoneNumber || "Not filled";
    const getService = () =>
      survey.service_type_display || survey.service_type_name || "N/A";

    return (
      <div className="p-6 space-y-6 bg-white rounded-lg shadow-md">
        <div className="section">
          <h4 className="font-semibold text-gray-800 mb-2">Customer Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-400">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-400 px-4 py-2 text-left">
                    Field
                  </th>
                  <th className="border border-gray-400 px-4 py-2 text-left">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-medium">
                    Customer Type
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {survey.customer_type_name || "Not filled"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-medium">
                    Full Name
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {survey.full_name ||
                      survey.enquiry?.fullName ||
                      "Not filled"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-medium">
                    Mobile
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {getPhone()}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-medium">
                    Email
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {survey.email || survey.enquiry?.email || "Not filled"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-medium">
                    Service Type
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {getService()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="section">
          <h4 className="font-semibold text-gray-800 mb-2">Survey Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-400">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-400 px-4 py-2 text-left">
                    Field
                  </th>
                  <th className="border border-gray-400 px-4 py-2 text-left">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-medium">
                    Status
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {formatStatus(survey.status)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-medium">
                    Survey Date
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {formatDate(survey.survey_date)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-medium">
                    Start Time
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {formatTime(survey.survey_start_time)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-medium">
                    End Time
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {formatTime(survey.survey_end_time)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="section">
          <h4 className="font-semibold text-gray-800 mb-2">Origin Address</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-400">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-400 px-4 py-2 text-left">
                    Field
                  </th>
                  <th className="border border-gray-400 px-4 py-2 text-left">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-medium">
                    Address
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {survey.origin_address || "Not filled"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-medium">
                    City
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {getCityName(
                      survey.origin_country,
                      survey.origin_state,
                      survey.origin_city
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-medium">
                    Country
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {getCountryName(survey.origin_country)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2 font-medium">
                    State
                  </td>
                  <td className="border border-gray-400 px-4 py-2">
                    {getStateName(survey.origin_country, survey.origin_state)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {survey.destination_addresses?.length > 0 && (
          <div className="section">
            <h4 className="font-semibold text-gray-800 mb-2">
              Destination Address(es)
            </h4>
            {survey.destination_addresses.map((a, i) => (
              <div key={i} className="mb-4">
                <h5 className="font-medium text-gray-700 mb-2">
                  Address {i + 1}
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-400">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="border border-gray-400 px-4 py-2 text-left">
                          Field
                        </th>
                        <th className="border border-gray-400 px-4 py-2 text-left">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 px-4 py-2 font-medium">
                          Address
                        </td>
                        <td className="border border-gray-400 px-4 py-2">
                          {a.address || "Not filled"}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-4 py-2 font-medium">
                          City
                        </td>
                        <td className="border border-gray-400 px-4 py-2">
                          {getCityName(a.country, a.state, a.city)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-4 py-2 font-medium">
                          Country
                        </td>
                        <td className="border border-gray-400 px-4 py-2">
                          {getCountryName(a.country)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-4 py-2 font-medium">
                          State
                        </td>
                        <td className="border border-gray-400 px-4 py-2">
                          {getStateName(a.country, a.state)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {survey.vehicles?.length > 0 && (
          <div className="section">
            <h4 className="font-semibold text-gray-800 mb-2">Vehicles</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-400">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-400 px-4 py-2">Type</th>
                    <th className="border border-gray-400 px-4 py-2">Make</th>
                    <th className="border border-gray-400 px-4 py-2">Model</th>
                    <th className="border border-gray-400 px-4 py-2">
                      Insurance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {survey.vehicles.map((v, i) => (
                    <tr key={i}>
                      <td className="border border-gray-400 px-4 py-2">
                        {v.vehicle_type_name || "N/A"}
                      </td>
                      <td className="border border-gray-400 px-4 py-2">
                        {v.make || "N/A"}
                      </td>
                      <td className="border border-gray-400 px-4 py-2">
                        {v.model || "N/A"}
                      </td>
                      <td className="border border-gray-400 px-4 py-2">
                        {formatBoolean(v.insurance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {survey.articles?.length > 0 && (
          <div className="section">
            <h4 className="font-semibold text-gray-800 mb-2">
              Articles ({survey.articles.length})
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-400">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-400 px-3 py-2">Room</th>
                    <th className="border border-gray-400 px-3 py-2">Item</th>
                    <th className="border border-gray-400 px-3 py-2">Qty</th>
                    <th className="border border-gray-400 px-3 py-2">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {survey.articles.map((a, i) => (
                    <tr
                      key={i}
                      className={
                        a.isFlagged
                          ? "bg-red-50 text-red-900 font-bold border-l-4 border-red-600"
                          : ""
                      }
                    >
                      <td className="border border-gray-400 px-3 py-2">
                        {a.room_name || "-"}
                      </td>
                      <td className="border border-gray-400 px-3 py-2">
                        {a.item_name || "-"}
                        {a.isFlagged && " ⚡ IMPORTANT"}
                      </td>
                      <td className="border border-gray-400 px-3 py-2">
                        {a.quantity || "-"}
                      </td>
                      <td className="border border-gray-400 px-3 py-2">
                        {formatVolume(a.volume, a.volume_unit_name)}
                      </td>
                    </tr>
                  ))}
                  {/* TOTAL VOLUME ROW */}
                  <tr className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white font-bold">
                    <td
                      colSpan="3"
                      className="border border-gray-400 px-3 py-3 text-right"
                    >
                      Total Volume:
                    </td>
                    <td className="border border-gray-400 px-3 py-3 text-center">
                      {survey.articles
                        .reduce((total, a) => {
                          const vol = parseFloat(a.volume) || 0;
                          const qty = parseInt(a.quantity) || 1;
                          return total + vol * qty;
                        }, 0)
                        .toFixed(4)}{" "}
                      m³
                    </td>
                  </tr>
                </tbody>
              </table>
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
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
          >
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-6">
        <Button
          onClick={() => navigate("/scheduled-surveys")}
          className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
        >
          Back to Scheduled
        </Button>
      </div>

      <div className="space-y-6">
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
              <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] p-5 text-white">
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
                      className={`inline-block mt-1 px-3 py-1 rounded text-xs font-medium ${
                        survey.status === "completed"
                          ? "bg-green-200 text-green-800"
                          : survey.status === "cancelled"
                          ? "bg-red-200 text-red-800"
                          : "bg-yellow-200 text-yellow-800"
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

              <div className="p-4 bg-gray-50 flex flex-wrap gap-3 justify-end">
                <Button
                  onClick={() =>
                    openStatusModal({ ...survey, newStatus: survey.status })
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs sm:text-sm font-medium rounded"
                >
                  Update Survey Status
                </Button>

                {survey.hasQuotation ? (
                  <>
                    <Button
                      onClick={() =>
                        navigate(`/quotation-view/${survey.quotation_id}`)
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs sm:text-sm font-medium rounded flex items-center gap-2"
                    >
                      <FaEye /> View Quotation
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => handleCreateQuotation(survey.survey_id)}
                    className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] hover:from-[#3a586d] hover:to-[#54738a] text-white px-4 py-2 text-xs sm:text-sm font-medium rounded"
                  >
                    Create Quotation
                  </Button>
                )}
                <Button
                  onClick={() => handleEditSurvey(survey)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 text-sm rounded"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handlePrintSurvey(survey)}
                  disabled={printing === survey.survey_id}
                  className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-xs sm:text-sm font-medium rounded flex items-center gap-2 ${
                    printing === survey.survey_id ? "opacity-50" : ""
                  }`}
                >
                  {printing === survey.survey_id ? <>Printing...</> : "Print"}
                </Button>
                <Button
                  onClick={() => handleDeleteSurvey(survey.survey_id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs sm:text-sm font-medium rounded"
                >
                  Delete
                </Button>
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
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setStatusModal(null)}
                  className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateSurveyStatus}
                  disabled={updatingStatus || !statusModal.newStatus}
                  className="px-5 py-2 bg-[#4c7085] hover:bg-[#6b8ca3] text-white rounded-lg disabled:opacity-50"
                >
                  {updatingStatus ? "Updating..." : "Update Survey Status"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {signatureModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSignatureModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Digital Signature</h3>
                <button
                  onClick={() => setSignatureModal(null)}
                  className="text-3xl"
                >
                  ×
                </button>
              </div>
              <img
                src={signatureModal}
                alt="Signature"
                className="w-full rounded-lg border"
              />
              <Button
                onClick={() => setSignatureModal(null)}
                className="mt-4 w-full bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-3 rounded-lg"
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
