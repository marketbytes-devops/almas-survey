import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../api/apiClient"; // Same as SurveySummary
import Loading from "../../components/Loading";

export default function QuotationList() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuotableSurveys = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/surveys/");
        // Filter only completed surveys that are ready for quotation
        const completedSurveys = response.data.filter(
          (survey) => survey.status === "completed"
        );
        setSurveys(completedSurveys);
      } catch (err) {
        setError("Failed to load surveys. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotableSurveys();
  }, []);

  const getCustomerName = (survey) => {
    return survey.full_name || survey.enquiry?.fullName || "Unknown";
  };

  const getPhoneNumber = (survey) => {
    return survey.phone_number || survey.enquiry?.phoneNumber || "Not filled";
  };

  const getEmail = (survey) => {
    return survey.email || survey.enquiry?.email || "Not filled";
  };

  const getServiceType = (survey) => {
    return survey.service_type_display || survey.service_type_name || "Local Move";
  };

  const handleSignatureUpload = (surveyId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("signature", file);
    formData.append("survey_id", surveyId);

    // Replace with your actual endpoint
    apiClient
      .post(`/surveys/${surveyId}/upload-signature/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        alert(`Signature uploaded for ${surveyId}`);
      })
      .catch((err) => {
        alert("Upload failed. Try again.");
        console.error(err);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-medium text-gray-800 mb-6">
          Quotation Management
        </h1>

        {surveys.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <p className="text-gray-500 text-lg">
              No completed surveys available for quotation.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Complete a survey first to generate a quotation.
            </p>
          </div>
        ) : (
          <>
            {/* TABLE WRAPPER WITH HORIZONTAL SCROLL */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Service Required
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                        Create Quotation
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">
                        Upload Signature
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {surveys.map((survey, i) => (
                      <tr key={survey.survey_id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {i + 1}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getCustomerName(survey)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            {getPhoneNumber(survey)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            {getEmail(survey)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          {getServiceType(survey)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Link
                          to={`/quotation/${i + 1}`}
                         state={{ survey }}
                          className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition shadow-sm"
                          >
                         Create Quotation
                           </Link>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <label
                            htmlFor={`sig-${survey.survey_id}`}
                            className="cursor-pointer inline-flex items-center bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition shadow-sm"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Upload
                          </label>
                          <input
                            id={`sig-${survey.survey_id}`}
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleSignatureUpload(survey.survey_id, file);
                              }
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE TIP */}
            <p className="mt-4 text-xs text-gray-500 text-center">
              Tip: Scroll horizontally on mobile to see all columns
            </p>
          </>
        )}
      </div>
    </div>
  );
}