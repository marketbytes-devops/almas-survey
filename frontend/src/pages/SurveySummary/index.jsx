import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../api/apiClient";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import ReactDOMServer from 'react-dom/server';
import SurveyPrint from "../SurveyPrint";

const SurveySummary = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [quickEditSurvey, setQuickEditSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [printing, setPrinting] = useState(null);

  useEffect(() => {
    const fetchSurveys = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/surveys/");
        setSurveys(response.data);
      } catch (err) {
        setError("Failed to fetch surveys. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  const toggleSectionExpansion = (sectionId) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const closeQuickEdit = () => {
    setQuickEditSurvey(null);
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (!window.confirm("Are you sure you want to delete this survey? This action cannot be undone.")) {
      return;
    }
    setError(null);
    try {
      await apiClient.delete(`/surveys/${surveyId}/`);
      setSuccess("Survey deleted successfully!");
      setSurveys(surveys.filter((survey) => survey.survey_id !== surveyId));
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError("Failed to delete survey. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEditSurvey = (survey) => {
    navigate(`/survey/${survey.survey_id}/survey-details`, {
      state: {
        customerData: {
          surveyId: survey.survey_id,
          fullName: survey.full_name || "Not filled",
          phoneNumber: survey.mobile_number || survey.enquiry?.phoneNumber || "Not filled", // Fixed this line
          email: survey.email || survey.enquiry?.email || "Not filled",
          serviceType: survey.service_type || survey.enquiry?.serviceType || "",
          serviceTypeDisplay: survey.service_type_display || survey.service_type_name || "N/A",
          surveyDate: survey.survey_date ? new Date(survey.survey_date) : null,
          surveyStartTime: survey.survey_start_time
            ? new Date(`1970-01-01T${survey.survey_start_time}`)
            : null,
          customer_id: survey.enquiry?.id || null,
          enquiry_id: survey.enquiry || null,
        },
        articles: survey.articles || [],
        vehicles: survey.vehicles || [],
        pets: survey.pets || [],
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
        // ADD THESE MISSING FIELDS:
        moveDetails: {
          packingDateFrom: survey.packing_date_from ? new Date(survey.packing_date_from) : null,
          packingDateTo: survey.packing_date_to ? new Date(survey.packing_date_to) : null,
          loadingDate: survey.loading_date ? new Date(survey.loading_date) : null,
          eta: survey.eta ? new Date(survey.eta) : null,
          etd: survey.etd ? new Date(survey.etd) : null,
          estDeliveryDate: survey.est_delivery_date ? new Date(survey.est_delivery_date) : null,
        },
        storageDetails: {
          storageStartDate: survey.storage_start_date ? new Date(survey.storage_start_date) : null,
          storageFrequency: survey.storage_frequency || "",
          storageDuration: survey.storage_duration || "",
          storageMode: survey.storage_mode || "",
        },
        originAddress: {
          originAddress: survey.origin_address || "",
          originCity: survey.origin_city || "",
          originCountry: survey.origin_country || "",
          originState: survey.origin_state || "",
          originZip: survey.origin_zip || "",
          podPol: survey.pod_pol || "",
          sameAsCustomerAddress: survey.same_as_customer_address || false,
        },
        customerDetails: {
          customerType: survey.customer_type || "",
          salutation: survey.salutation || "",
          address: survey.address || "",
          company: survey.company || "",
          isMilitary: survey.is_military || false,
          goodsType: survey.goods_type || "",
          status: survey.status || "pending",
          workDescription: survey.work_description || "",
          includeVehicle: survey.include_vehicle || false,
          includePet: survey.include_pet || false,
          costTogetherVehicle: survey.cost_together_vehicle || false,
          costTogetherPet: survey.cost_together_pet || false,
        }
      },
    });
  };
  const handlePrintSurvey = async (survey) => {
    if (printing) return;

    setPrinting(survey.survey_id);
    setError(null);

    try {
      const printUrl = `/print-survey/${survey.survey_id}/${Date.now()}`;
      const printWindow = window.open(printUrl, '_blank', 'width=850,height=650,scrollbars=yes,resizable=yes');

      if (!printWindow) {
        throw new Error("Popup blocked! Please allow popups for printing.");
      }
      const htmlContent = ReactDOMServer.renderToString(
        <SurveyPrint survey={survey} />
      );
      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Survey Report - ${survey.survey_id}</title>
          <meta charset="UTF-8">
          <style>
            ${`
              @page { 
                size: A4 portrait; 
                margin: 0.75in; 
              }
              * { 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
              }
              body { 
                font-family: 'Arial', 'Helvetica', sans-serif; 
                font-size: 10pt; 
                color: #000; 
                margin: 0; 
                padding: 0; 
                line-height: 1.4; 
                background: white !important;
              }
              .print-header {
                text-align: center;
                border-bottom: 3px solid #4c7085;
                padding-bottom: 12px;
                margin-bottom: 20px;
              }
              .print-header h1 {
                font-size: 18pt;
                color: #4c7085;
                margin: 0 0 8px 0;
                font-weight: bold;
              }
              .print-header p {
                font-size: 11pt;
                margin: 0;
                font-weight: 500;
              }
              .section {
                margin-bottom: 25px;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .section h3 {
                font-size: 12pt;
                color: #4c7085;
                border-bottom: 2px solid #4c7085;
                padding-bottom: 6px;
                margin: 15px 0 10px 0;
                font-weight: bold;
              }
              .section h4 {
                font-size: 11pt;
                color: #333;
                margin: 12px 0 8px 0;
                font-weight: 600;
              }
              .section h5 {
                font-size: 10pt;
                color: #555;
                margin: 10px 0 6px 0;
                font-weight: 500;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                page-break-inside: auto;
              }
              th, td {
                border: 1px solid #000;
                padding: 6px 4px;
                text-align: left;
                font-size: 9pt;
                word-wrap: break-word;
                vertical-align: top;
              }
              th {
                background-color: #e8f0f2 !important;
                font-weight: bold;
                color: #000 !important;
              }
              .total-row {
                background-color: #f0f8ff !important;
                font-weight: bold;
              }
              .no-print { display: none !important; }
              @media print {
                body { -webkit-print-color-adjust: exact; }
                .no-print { display: none !important; }
              }
            `}
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 500);
              
              window.onafterprint = function() {
                setTimeout(function() {
                  window.close();
                }, 1000);
              };
              window.onbeforeunload = function() {
                return 'Print dialog is open. Please complete printing.';
              };
            }
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
    } catch (err) {
      console.error("🚨 Print Error:", err);
      setError(`Print failed: ${err.message}. Please allow popups and try again.`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setTimeout(() => setPrinting(null), 1500);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not filled";
    try {
      return new Date(dateString).toLocaleDateString('en-GB').split('/').reverse().join('/');
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Not filled";
    try {
      // Assuming timeString is in "HH:mm:ss" format
      const [hours, minutes] = timeString.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12; // Convert to 12-hour format
      return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
      return "Invalid time";
    }
  };

  const calculateTotalCost = (articles) => {
    const costByCurrency = (articles || []).reduce((acc, article) => {
      if (article.amount && article.currency_code) {
        acc[article.currency_code] = (acc[article.currency_code] || 0) + parseFloat(article.amount);
      }
      return acc;
    }, {});
    return Object.entries(costByCurrency).map(([currency, total]) => ({
      currency,
      total: total.toFixed(2),
    }));
  };

  const SurveyDetailsView = ({ survey }) => {
    const getCustomerData = (field) => {
      const fieldMap = {
        full_name: 'fullName',
        phone_number: 'phoneNumber', // Updated to match API field
        email: 'email'
      };
      const enquiryField = fieldMap[field] || field;
      return survey[field] || survey.enquiry?.[enquiryField] || "Not filled";
    };

        const getPhoneNumber = () => {
      return survey.phone_number || survey.enquiry?.phoneNumber || "Not filled";
    };

    // Helper function to get service type display
    const getServiceTypeDisplay = () => {
      return survey.service_type_display || survey.service_type_name || "N/A";
    };

    const formatBoolean = (value) => value ? "Yes" : "No";

    return (
      <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
        {/* CUSTOMER DETAILS */}
       <div className="section">
          <h4 className="font-semibold text-gray-800 mb-2">Customer Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-400">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-400 px-4 py-2 text-left">Field</th>
                  <th className="border border-gray-400 px-4 py-2 text-left">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Customer Type</td><td className="border border-gray-400 px-4 py-2">{survey.customer_type_name || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Salutation</td><td className="border border-gray-400 px-4 py-2">{survey.salutation || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Full Name</td><td className="border border-gray-400 px-4 py-2">{survey.full_name || survey.enquiry?.fullName || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Mobile Number</td><td className="border border-gray-400 px-4 py-2">{getPhoneNumber()}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Email</td><td className="border border-gray-400 px-4 py-2">{survey.email || survey.enquiry?.email || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Service Type</td><td className="border border-gray-400 px-4 py-2">{getServiceTypeDisplay()}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Address</td><td className="border border-gray-400 px-4 py-2">{survey.address || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Company</td><td className="border border-gray-400 px-4 py-2">{survey.company || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Is Military</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.is_military)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SURVEY DETAILS */}
        <div className="section">
          <h4 className="font-semibold text-gray-800 mb-2">Survey Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-400">
              <thead className="bg-gray-200">
                <tr><th className="border border-gray-400 px-4 py-2 text-left">Field</th><th className="border border-gray-400 px-4 py-2 text-left">Value</th></tr></thead>
              <tbody>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Service Type</td><td className="border border-gray-400 px-4 py-2">{survey.service_type_display || survey.service_type_name || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Goods Type</td><td className="border border-gray-400 px-4 py-2">{survey.goods_type || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Status</td><td className="border border-gray-400 px-4 py-2">{survey.status || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Survey Date</td><td className="border border-gray-400 px-4 py-2">{formatDate(survey.survey_date)}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Survey Start Time</td><td className="border border-gray-400 px-4 py-2">{formatTime(survey.survey_start_time)}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Survey End Time</td><td className="border border-gray-400 px-4 py-2">{formatTime(survey.survey_end_time)}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Work Description</td><td className="border border-gray-400 px-4 py-2">{survey.work_description || "Not filled"}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ORIGIN ADDRESS */}
        <div className="section">
          <h4 className="font-semibold text-gray-800 mb-2">Origin Address</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-400">
              <thead className="bg-gray-200">
                <tr><th className="border border-gray-400 px-4 py-2 text-left">Field</th><th className="border border-gray-400 px-4 py-2 text-left">Value</th></tr></thead>
              <tbody>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Same as Customer Address</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.same_as_customer_address)}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Address</td><td className="border border-gray-400 px-4 py-2">{survey.origin_address || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">City</td><td className="border border-gray-400 px-4 py-2">{survey.origin_city || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Country</td><td className="border border-gray-400 px-4 py-2">{survey.origin_country || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">State</td><td className="border border-gray-400 px-4 py-2">{survey.origin_state || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">ZIP</td><td className="border border-gray-400 px-4 py-2">{survey.origin_zip || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">POD/POL</td><td className="border border-gray-400 px-4 py-2">{survey.pod_pol || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Floor</td><td className="border border-gray-400 px-4 py-2">{survey.origin_floor ? `${formatBoolean(survey.origin_floor)} ${survey.origin_floor_notes || ''}` : "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Lift</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.origin_lift)} {survey.origin_lift_notes || ''}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Parking</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.origin_parking)} {survey.origin_parking_notes || ''}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Storage</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.origin_storage)} {survey.origin_storage_notes || ''}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* DESTINATION ADDRESSES */}
        <div className="section">
          <h4 className="font-semibold text-gray-800 mb-2">Destination Address{survey.destination_addresses?.length > 1 ? 'es' : ''}</h4>
          {survey.destination_addresses?.length > 0 ? (
            survey.destination_addresses.map((addr, index) => (
              <div key={index} className="mb-4">
                <h5 className="font-medium mb-2 text-gray-700">Address {index + 1}</h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-400">
                    <thead className="bg-gray-200">
                      <tr><th className="border border-gray-400 px-4 py-2 text-left">Field</th><th className="border border-gray-400 px-4 py-2 text-left">Value</th></tr></thead>
                    <tbody>
                      <tr><td className="border border-gray-400 px-4 py-2 font-medium">Address</td><td className="border border-gray-400 px-4 py-2">{addr.address || "Not filled"}</td></tr>
                      <tr><td className="border border-gray-400 px-4 py-2 font-medium">City</td><td className="border border-gray-400 px-4 py-2">{addr.city || "Not filled"}</td></tr>
                      <tr><td className="border border-gray-400 px-4 py-2 font-medium">Country</td><td className="border border-gray-400 px-4 py-2">{addr.country || "Not filled"}</td></tr>
                      <tr><td className="border border-gray-400 px-4 py-2 font-medium">State</td><td className="border border-gray-400 px-4 py-2">{addr.state || "Not filled"}</td></tr>
                      <tr><td className="border border-gray-400 px-4 py-2 font-medium">ZIP</td><td className="border border-gray-400 px-4 py-2">{addr.zip || "Not filled"}</td></tr>
                      <tr><td className="border border-gray-400 px-4 py-2 font-medium">POE</td><td className="border border-gray-400 px-4 py-2">{addr.poe || "Not filled"}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No destination addresses</p>
          )}
        </div>

        {/* MOVE DETAILS */}
        <div className="section">
          <h4 className="font-semibold text-gray-800 mb-2">Move Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-400">
              <thead className="bg-gray-200">
                <tr><th className="border border-gray-400 px-4 py-2 text-left">Field</th><th className="border border-gray-400 px-4 py-2 text-left">Value</th></tr></thead>
              <tbody>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Packing Date From</td><td className="border border-gray-400 px-4 py-2">{formatDate(survey.packing_date_from)}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Packing Date To</td><td className="border border-gray-400 px-4 py-2">{formatDate(survey.packing_date_to)}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Loading Date</td><td className="border border-gray-400 px-4 py-2">{formatDate(survey.loading_date)}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">ETA</td><td className="border border-gray-400 px-4 py-2">{formatDate(survey.eta)}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">ETD</td><td className="border border-gray-400 px-4 py-2">{formatDate(survey.etd)}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Est. Delivery Date</td><td className="border border-gray-400 px-4 py-2">{formatDate(survey.est_delivery_date)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* STORAGE DETAILS */}
        <div className="section">
          <h4 className="font-semibold text-gray-800 mb-2">Storage Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-400">
              <thead className="bg-gray-200">
                <tr><th className="border border-gray-400 px-4 py-2 text-left">Field</th><th className="border border-gray-400 px-4 py-2 text-left">Value</th></tr></thead>
              <tbody>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Start Date</td><td className="border border-gray-400 px-4 py-2">{formatDate(survey.storage_start_date)}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Frequency</td><td className="border border-gray-400 px-4 py-2">{survey.storage_frequency || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Duration</td><td className="border border-gray-400 px-4 py-2">{survey.storage_duration || "Not filled"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Storage Mode</td><td className="border border-gray-400 px-4 py-2">{survey.storage_mode || "Not filled"}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* VEHICLE DETAILS */}
        <div className="section">
          <h4 className="font-semibold text-gray-800 mb-2">Vehicle Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-400">
              <thead className="bg-gray-200">
                <tr><th className="border border-gray-400 px-4 py-2 text-left">Field</th><th className="border border-gray-400 px-4 py-2 text-left">Value</th></tr></thead>
              <tbody>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Include Vehicle</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.include_vehicle)}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Cost Together (Vehicle)</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.cost_together_vehicle)}</td></tr>
              </tbody>
            </table>
            {survey.vehicles?.length > 0 && (
              <div className="mt-3">
                <table className="w-full text-sm border border-gray-400">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border border-gray-400 px-4 py-2">Vehicle Type</th>
                      <th className="border border-gray-400 px-4 py-2">Make</th>
                      <th className="border border-gray-400 px-4 py-2">Model</th>
                      <th className="border border-gray-400 px-4 py-2">Insurance</th>
                      <th className="border border-gray-400 px-4 py-2">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {survey.vehicles.map((v, i) => (
                      <tr key={i}>
                        <td className="border border-gray-400 px-4 py-2">{v.vehicle_type_name || "N/A"}</td>
                        <td className="border border-gray-400 px-4 py-2">{v.make || "N/A"}</td>
                        <td className="border border-gray-400 px-4 py-2">{v.model || "N/A"}</td>
                        <td className="border border-gray-400 px-4 py-2">{formatBoolean(v.insurance)}</td>
                        <td className="border border-gray-400 px-4 py-2">{v.remark || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PET DETAILS */}
        <div className="section">
          <h4 className="font-semibold text-gray-800 mb-2">Pet Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-400">
              <thead className="bg-gray-200">
                <tr><th className="border border-gray-400 px-4 py-2 text-left">Field</th><th className="border border-gray-400 px-4 py-2 text-left">Value</th></tr></thead>
              <tbody>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Include Pet</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.include_pet)}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Cost Together (Pet)</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.cost_together_pet)}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Number of Pets</td><td className="border border-gray-400 px-4 py-2">{survey.pets?.length || 0}</td></tr>
              </tbody>
            </table>
            {survey.pets?.length > 0 && (
              <div className="mt-3">
                <table className="w-full text-sm border border-gray-400">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border border-gray-400 px-4 py-2">Pet Name</th>
                      <th className="border border-gray-400 px-4 py-2">Pet Type</th>
                      <th className="border border-gray-400 px-4 py-2">Breed</th>
                      <th className="border border-gray-400 px-4 py-2">Age</th>
                      <th className="border border-gray-400 px-4 py-2">Weight</th>
                      <th className="border border-gray-400 px-4 py-2">Special Care</th>
                      <th className="border border-gray-400 px-4 py-2">Vaccination</th>
                    </tr>
                  </thead>
                  <tbody>
                    {survey.pets.map((pet, i) => (
                      <tr key={i}>
                        <td className="border border-gray-400 px-4 py-2">{pet.pet_name || "N/A"}</td>
                        <td className="border border-gray-400 px-4 py-2">{pet.pet_type_name || "N/A"}</td>
                        <td className="border border-gray-400 px-4 py-2">{pet.breed || "N/A"}</td>
                        <td className="border border-gray-400 px-4 py-2">{pet.age || "N/A"}</td>
                        <td className="border border-gray-400 px-4 py-2">{pet.weight || "N/A"}</td>
                        <td className="border border-gray-400 px-4 py-2">{pet.special_care || "-"}</td>
                        <td className="border border-gray-400 px-4 py-2">{pet.vaccination_status || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ARTICLES */}
        {survey.articles?.length > 0 && (
          <div className="section">
            <h4 className="font-semibold text-gray-800 mb-2">Articles ({survey.articles.length})</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-400">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-400 px-3 py-2">Room</th>
                    <th className="border border-gray-400 px-3 py-2">Item</th>
                    <th className="border border-gray-400 px-3 py-2">Qty</th>
                    <th className="border border-gray-400 px-3 py-2">Volume</th>
                    <th className="border border-gray-400 px-3 py-2">Weight</th>
                    <th className="border border-gray-400 px-3 py-2">Handyman</th>
                    <th className="border border-gray-400 px-3 py-2">Packing</th>
                    <th className="border border-gray-400 px-3 py-2">Amount</th>
                    <th className="border border-gray-400 px-3 py-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {survey.articles.map((article, i) => (
                    <tr key={i}>
                      <td className="border border-gray-400 px-3 py-2">{article.room_name || "-"}</td>
                      <td className="border border-gray-400 px-3 py-2">{article.item_name || "-"}</td>
                      <td className="border border-gray-400 px-3 py-2">{article.quantity || "-"}</td>
                      <td className="border border-gray-400 px-3 py-2">{article.volume || "-"} {article.volume_unit_name || ""}</td>
                      <td className="border border-gray-400 px-3 py-2">{article.weight || "-"} {article.weight_unit_name || ""}</td>
                      <td className="border border-gray-400 px-3 py-2">{article.handyman_name || "-"}</td>
                      <td className="border border-gray-400 px-3 py-2">{article.packing_option_name || "-"}</td>
                      <td className="border border-gray-400 px-3 py-2">{article.amount || "-"} {article.currency_code || ""}</td>
                      <td className="border border-gray-400 px-3 py-2">{article.remarks || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SERVICE DETAILS */}
        <div className="section">
          <h4 className="font-semibold text-gray-800 mb-2">Service Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-400">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-400 px-4 py-2 text-left">Service</th>
                  <th className="border border-gray-400 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-400 px-4 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Owner Packed</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.general_owner_packed)}</td><td className="border border-gray-400 px-4 py-2">{survey.general_owner_packed_notes || "-"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Restriction</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.general_restriction)}</td><td className="border border-gray-400 px-4 py-2">{survey.general_restriction_notes || "-"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Handyman</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.general_handyman)}</td><td className="border border-gray-400 px-4 py-2">{survey.general_handyman_notes || "-"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Insurance</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.general_insurance)}</td><td className="border border-gray-400 px-4 py-2">{survey.general_insurance_notes || "-"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Origin Floor</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.origin_floor)}</td><td className="border border-gray-400 px-4 py-2">{survey.origin_floor_notes || "-"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Origin Lift</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.origin_lift)}</td><td className="border border-gray-400 px-4 py-2">{survey.origin_lift_notes || "-"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Origin Parking</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.origin_parking)}</td><td className="border border-gray-400 px-4 py-2">{survey.origin_parking_notes || "-"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Origin Storage</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.origin_storage)}</td><td className="border border-gray-400 px-4 py-2">{survey.origin_storage_notes || "-"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Destination Floor</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.destination_floor)}</td><td className="border border-gray-400 px-4 py-2">{survey.destination_floor_notes || "-"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Destination Lift</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.destination_lift)}</td><td className="border border-gray-400 px-4 py-2">{survey.destination_lift_notes || "-"}</td></tr>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Destination Parking</td><td className="border border-gray-400 px-4 py-2">{formatBoolean(survey.destination_parking)}</td><td className="border border-gray-400 px-4 py-2">{survey.destination_parking_notes || "-"}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TRANSPORT MODE */}
        <div className="section">
          <h4 className="font-semibold text-gray-800 mb-2">Transport Mode</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-400">
              <thead className="bg-gray-200">
                <tr><th className="border border-gray-400 px-4 py-2 text-left">Field</th><th className="border border-gray-400 px-4 py-2 text-left">Value</th></tr></thead>
              <tbody>
                <tr><td className="border border-gray-400 px-4 py-2 font-medium">Transport Mode</td><td className="border border-gray-400 px-4 py-2">{survey.transport_mode || "Not filled"}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-4"><Loading /></div>;
  }

  if (surveys.length === 0) {
    return <div className="text-left text-gray-700">No surveys are currently available.</div>;
  }

  return (
    <div className="p-4 w-full mx-auto bg-white rounded-lg shadow-md">
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
          >
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Surveys List ({surveys.length})</h2>
        <Button
          onClick={() => navigate("/scheduled-surveys")}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Back to Surveys
        </Button>
      </div>

      <div className="space-y-4">
        {surveys.map((survey) => {
          const totalCosts = calculateTotalCost(survey.articles);
          const getPhoneNumber = () => survey.phone_number || survey.enquiry?.phoneNumber || "Not filled";
          const getServiceType = () => survey.service_type_display || survey.service_type_name || "N/A";
          return (
            <motion.div
              key={survey.survey_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-400 rounded-lg overflow-hidden"
            >
              {/* Summary Card */}
              <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] p-4 text-white">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{survey.survey_id}</h3>
                    <p className="text-sm">{survey.full_name || survey.enquiry?.fullName || "N/A"}</p>
                    <p className="text-sm">{getPhoneNumber()}</p>
                    <p className="text-sm">{survey.email || survey.enquiry?.email || "N/A"}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-sm">{getServiceType()}</p>
                    <p className="text-xs">{survey.status}</p>
                    {totalCosts.length > 0 && (
                      <p className="text-sm font-medium">
                        Total: {totalCosts.map(c => `${c.total} ${c.currency}`).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-200 flex gap-2 justify-end flex-wrap">
                <Button
                  onClick={() => handleEditSurvey(survey)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 text-xs rounded"
                >
                  Full Edit
                </Button>
                <Button
                  onClick={() => handlePrintSurvey(survey)}
                  className={`bg-green-600 text-white px-3 py-1 text-xs rounded ${printing === survey.survey_id ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"}`}
                  disabled={printing === survey.survey_id}
                >
                  {printing === survey.survey_id ? (
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Printing...
                    </span>
                  ) : (
                    "🖨️ Print"
                  )}
                </Button>
                <Button
                  onClick={() => handleDeleteSurvey(survey.survey_id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded"
                >
                  Delete
                </Button>
              </div>
              {/* Expand Toggle */}
              <button
                onClick={() => toggleSectionExpansion(survey.survey_id)}
                className="w-full p-3 text-center bg-gray-100 hover:bg-[#6b8ca3] text-sm text-gray-600 hover:text-white transition-colors"
              >
                {expandedSections.has(survey.survey_id) ? "Hide Details" : "Show All Details"}
              </button>
              {/* Expandable Detailed View */}
              <AnimatePresence>
                {expandedSections.has(survey.survey_id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SurveyDetailsView survey={survey} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Edit Modal */}
      <AnimatePresence>
        {quickEditSurvey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 p-4"
            onClick={closeQuickEdit}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-400 p-4 flex justify-between items-center z-10">
                <h3 className="text-xl font-bold text-gray-900">
                  Quick Edit - {quickEditSurvey.survey_id}
                </h3>
                <button
                  onClick={closeQuickEdit}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="p-0">
                <SurveyDetailsView survey={quickEditSurvey} />
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-400 p-4 flex gap-2 justify-end">
                <Button
                  onClick={closeQuickEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    closeQuickEdit();
                    handleEditSurvey(quickEditSurvey);
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Full Edit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SurveySummary;