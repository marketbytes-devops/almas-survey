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
      const response = await apiClient.get("/contacts/enquiries/", {
        params: { has_survey: "true" },
      });
      setEnquiries(response.data);
      setFilteredEnquiries(response.data);
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
        fullName: survey.full_name || survey.enquiry?.fullName,
        phoneNumber: survey.mobile_number || survey.enquiry?.phoneNumber,
        email: survey.email || survey.enquiry?.email,
        serviceType: survey.service_type_name || survey.enquiry?.serviceType,
        surveyDate: survey.survey_date ? new Date(survey.survey_date) : null,
        customer_id: survey.enquiry?.id,
        enquiry_id: survey.enquiry,
      },
      articles: survey.articles || [],
      vehicles: survey.vehicles || [],
      pets: survey.pets || [],
      serviceData: {
        general_owner_packed: survey.general_owner_packed,
        general_owner_packed_notes: survey.general_owner_packed_notes,
        general_restriction: survey.general_restriction,
        general_restriction_notes: survey.general_restriction_notes,
        general_handyman: survey.general_handyman,
        general_handyman_notes: survey.general_handyman_notes,
        general_insurance: survey.general_insurance,
        general_insurance_notes: survey.general_insurance_notes,
        origin_floor: survey.origin_floor,
        origin_floor_notes: survey.origin_floor_notes,
        origin_lift: survey.origin_lift,
        origin_lift_notes: survey.origin_lift_notes,
        origin_parking: survey.origin_parking,
        origin_parking_notes: survey.origin_parking_notes,
        origin_storage: survey.origin_storage,
        origin_storage_notes: survey.origin_storage_notes,
        destination_floor: survey.destination_floor,
        destination_floor_notes: survey.destination_floor_notes,
        destination_lift: survey.destination_lift,
        destination_lift_notes: survey.destination_lift_notes,
        destination_parking: survey.destination_parking,
        destination_parking_notes: survey.destination_parking_notes,
        },
      },
    });
  };

  const handlePrintSurvey = async (surveyId) => {
    if (printing) return;
    setPrinting(surveyId);
    try {
      const response = await apiClient.get(`/surveys/?survey_id=${surveyId}`);
      if (response.data.length > 0) {
        const survey = response.data[0];
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          const htmlContent = ReactDOMServer.renderToString(
            <SurveyPrint survey={survey} />
          );
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Survey Report - ${survey.survey_id}</title>
                <style>
                  ${document.querySelector('style').innerHTML} // Copy existing styles
                </style>
              </head>
              <body>${htmlContent}</body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.onafterprint = () => printWindow.close();
        } else {
          setError("Popup blocked. Please allow popups to print the survey.");
          setTimeout(() => setError(null), 3000);
        }
      } else {
        setError("Survey not found.");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Failed to fetch survey data for printing. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setTimeout(() => setPrinting(null), 2000);
    }
  };

  const handleViewSurvey = (surveyId) => {
    navigate(`/survey/${surveyId}/view`);
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

  if (loading) {
    return <div className="text-center py-4"><Loading/></div>;
  }

  if (surveys.length === 0) {
    return <div className="text-center py-4 text-red-500">No surveys found.</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
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

      <h2 className="text-lg font-semibold mb-6">Surveys List</h2>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <h3 className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">All Surveys</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {surveys.map((survey) => {
                const totalCosts = calculateTotalCost(survey.articles);
                return (
                  <React.Fragment key={survey.survey_id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{survey.survey_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{survey.full_name || survey.enquiry?.fullName || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{survey.service_type_name || survey.enquiry?.serviceType || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{survey.status || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {totalCosts.length > 0
                          ? totalCosts.map((cost) => (
                              <div key={cost.currency}>
                                {cost.total} {cost.currency}
                              </div>
                            ))
                          : "No cost data"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <Button
                          onClick={() => handleViewSurvey(survey.survey_id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded mr-2"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => handleEditSurvey(survey)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 text-xs rounded mr-2"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handlePrintSurvey(survey.survey_id)}
                          className={`bg-green-600 text-white px-3 py-1 text-xs rounded mr-2 ${
                            printing === survey.survey_id ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
                          }`}
                          disabled={printing === survey.survey_id}
                        >
                          {printing === survey.survey_id ? "Printing..." : "Print"}
                        </Button>
                        <Button
                          onClick={() => handleDeleteSurvey(survey.survey_id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                    {expandedSections.has(survey.survey_id) && (
                      <tr>
                        <td colSpan="6" className="p-0">
                          <div className="bg-gray-50 p-4">
                            <h4 className="text-sm font-semibold mb-2">Survey Details</h4>
                            <p><strong>Email:</strong> {survey.email || survey.enquiry?.email || "N/A"}</p>
                            <p><strong>Phone:</strong> {survey.mobile_number || survey.enquiry?.phoneNumber || "N/A"}</p>
                            <p><strong>Survey Date:</strong> {survey.survey_date || survey.enquiry?.survey_date || "N/A"}</p>
                            <p><strong>Goods Type:</strong> {survey.goods_type || "N/A"}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-4">
        <Button
          onClick={() => navigate("/scheduled-surveys")}
          className="px-6 py-3 w-full sm:w-auto bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Back to Surveys
        </Button>
      </div>
    </div>
  );
};

export default SurveySummary;