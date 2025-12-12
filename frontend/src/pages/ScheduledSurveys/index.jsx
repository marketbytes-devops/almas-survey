import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPhoneAlt, FaWhatsapp, FaEnvelope, FaSearch } from "react-icons/fa";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router";

const rowVariants = {
  hover: { backgroundColor: "#f3f4f6" },
  rest: { backgroundColor: "#ffffff" },
};

const ScheduledSurveys = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isRescheduleSurveyOpen, setIsRescheduleSurveyOpen] = useState(false);
  const [isRescheduleSurveyConfirmOpen, setIsRescheduleSurveyConfirmOpen] =
    useState(false);
  const [isCancelSurveyOpen, setIsCancelSurveyOpen] = useState(false);
  const [isCancelSurveyConfirmOpen, setIsCancelSurveyConfirmOpen] =
    useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [rescheduleSurveyData, setRescheduleSurveyData] = useState(null);
  const [cancelSurveyData, setCancelSurveyData] = useState(null);
  const [isStartingSurvey, setIsStartingSurvey] = useState(false);
  const [startingSurveyId, setStartingSurveyId] = useState(null);
  const [isReschedulingSurvey, setIsReschedulingSurvey] = useState(false);
  const [reschedulingSurveyId, setReschedulingSurveyId] = useState(null);
  const [isCancelingSurvey, setIsCancelingSurvey] = useState(false);
  const [cancelingSurveyId, setCancelingSurveyId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedEnquiries, setExpandedEnquiries] = useState(new Set());
  const navigate = useNavigate();

  const rescheduleSurveyForm = useForm();
  const cancelSurveyForm = useForm();
  const filterForm = useForm({
    defaultValues: { filterType: "all", fromDate: "", toDate: "" },
  });

  const serviceOptions = [
    { value: "localMove", label: "Local Move" },
    { value: "internationalMove", label: "International Move" },
    { value: "carExport", label: "Car Import and Export" },
    { value: "storageServices", label: "Storage Services" },
    { value: "logistics", label: "Logistics" },
  ];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEnquiries = filteredEnquiries.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);

  const toggleEnquiryExpand = (enquiryId) => {
    setExpandedEnquiries((prev) => {
      const newSet = new Set(prev);
      newSet.has(enquiryId) ? newSet.delete(enquiryId) : newSet.add(enquiryId);
      return newSet;
    });
  };

  const [searchQuery, setSearchQuery] = useState("");

  const getSurveyStatus = (enquiry) => {
    if (!enquiry.survey_status) return "Pending";
    const map = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return map[enquiry.survey_status] || enquiry.survey_status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-600 bg-yellow-100",
      in_progress: "text-blue-600 bg-blue-100",
      completed: "text-green-600 bg-green-100",
      cancelled: "text-red-600 bg-red-100",
    };
    return colors[status] || "text-gray-600 bg-gray-100";
  };

  const getButtonConfig = (enquiry) => {
    const status = enquiry.survey_status || "pending";
    const configs = {
      pending: {
        text: "Start Survey",
        color: "bg-green-500 hover:bg-green-600",
        disabled: false,
        loadingText: "Starting...",
      },
      in_progress: {
        text: "Continue Survey",
        color: "bg-blue-500 hover:bg-blue-600",
        disabled: false,
        loadingText: "Resuming...",
      },
      completed: {
        text: "Completed",
        color: "bg-gray-400 cursor-not-allowed",
        disabled: true,
      },
      cancelled: {
        text: "Cancelled",
        color: "bg-gray-400 cursor-not-allowed",
        disabled: true,
      },
    };
    return configs[status] || configs.pending;
  };

  const isSurveyFinished = (enquiry) =>
    ["completed", "cancelled"].includes(enquiry.survey_status);

  useEffect(() => {
    const fetchProfileAndPermissions = async () => {
      try {
        const response = await apiClient.get("/auth/profile/");
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");
        const roleId = user.role?.id;
        if (roleId) {
          const res = await apiClient.get(`/auth/roles/${roleId}/`);
          setPermissions(res.data.permissions || []);
        }
      } catch (error) {
        setPermissions([]);
        setIsSuperadmin(false);
      }
    };

    const fetchEnquiriesAndSurveys = async () => {
      setIsLoading(true);
      try {
        const enquiriesResponse = await apiClient.get("/contacts/enquiries/", {
          params: { has_survey: "true" },
        });
        const surveysResponse = await apiClient.get("/surveys/");

        const surveyMap = {};
        surveysResponse.data.forEach((survey) => {
          if (survey.survey_id) {
            const match = survey.survey_id.match(/^SURVEY-(\d+)-/);
            if (match) {
              const enquiryId = parseInt(match[1], 10);
              surveyMap[enquiryId] = {
                survey_status: survey.status,
                survey_id: survey.survey_id,
                survey_data: survey,
              };
            }
          }
        });

        const scheduledEnquiries = enquiriesResponse.data
          .filter((enquiry) => enquiry.survey_date !== null)
          .map((enquiry) => ({
            ...enquiry,
            has_survey: true,
            survey_status: surveyMap[enquiry.id]?.survey_status || "pending",
            survey_id: surveyMap[enquiry.id]?.survey_id || null,
            survey_data: surveyMap[enquiry.id]?.survey_data || null,
          }))
          .sort((a, b) => new Date(b.survey_date) - new Date(a.survey_date));

        setEnquiries(scheduledEnquiries);
        setFilteredEnquiries(scheduledEnquiries);
      } catch (error) {
        setError("Failed to fetch scheduled surveys. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndPermissions();
    fetchEnquiriesAndSurveys();
  }, []);

  const applyFiltersAndSearch = (filterData, search = searchQuery) => {
    let filtered = enquiries.filter((e) => e.survey_date !== null);
    setCurrentPage(1);

    if (filterData.fromDate || filterData.toDate) {
      const from = filterData.fromDate ? new Date(filterData.fromDate) : null;
      const to = filterData.toDate ? new Date(filterData.toDate) : null;
      if (to) to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((enquiry) => {
        const surveyDate = new Date(enquiry.survey_date);
        return (!from || surveyDate >= from) && (!to || surveyDate <= to);
      });
    }

    if (search && search.trim() !== "") {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter((enquiry) => {
        const fields = [
          enquiry.fullName,
          enquiry.phoneNumber,
          enquiry.email,
          serviceOptions.find((opt) => opt.value === enquiry.serviceType)
            ?.label,
          enquiry.serviceType,
          enquiry.message,
          enquiry.note,
          enquiry.assigned_user_email,
          getSurveyStatus(enquiry),
          enquiry.cancel_reason,
          enquiry.contact_status,
        ];
        return fields.some((f) =>
          f?.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    filtered.sort((a, b) => new Date(b.survey_date) - new Date(a.survey_date));
    setFilteredEnquiries(filtered);
  };

  const handleFilter = (data) => applyFiltersAndSearch(data);
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    applyFiltersAndSearch(filterForm.getValues(), value);
  };

  const hasPermission = (page, action) =>
    isSuperadmin ||
    permissions.some((p) => p.page === page && p[`can_${action}`]);

  const openPhoneModal = (enquiry) => {
    if (!hasPermission("scheduled_surveys", "view"))
      return setError("No permission");
    setSelectedEnquiry(enquiry);
    setIsPhoneModalOpen(true);
  };

  const openRescheduleSurveyModal = (enquiry) => {
    if (!hasPermission("scheduled_surveys", "edit"))
      return setError("No permission");
    setSelectedEnquiry(enquiry);
    rescheduleSurveyForm.reset();
    setIsRescheduleSurveyOpen(true);
  };

  const openCancelSurveyModal = (enquiry) => {
    if (!hasPermission("scheduled_surveys", "edit"))
      return setError("No permission");
    setSelectedEnquiry(enquiry);
    cancelSurveyForm.reset();
    setIsCancelSurveyOpen(true);
  };

  const startSurvey = async (enquiry) => {
    if (isSurveyFinished(enquiry))
      return setError("Survey is already finished");
    setIsStartingSurvey(true);
    setStartingSurveyId(enquiry.id);
    try {
      let surveyData = null;
      let serviceTypeDisplay = enquiry.serviceType;

      const existing = await apiClient.get(
        `/surveys/?enquiry_id=${enquiry.id}`
      );
      if (existing.data.length > 0) {
        surveyData = existing.data[0];
        if (["completed", "cancelled"].includes(surveyData.status)) {
          setError(`Survey is already ${surveyData.status}`);
          return;
        }
        if (surveyData.status === "pending") {
          await apiClient.patch(`/surveys/${surveyData.survey_id}/`, {
            status: "in_progress",
          });
        }
        serviceTypeDisplay =
          surveyData.service_type_display || enquiry.serviceType;
      }

      const serviceLabel =
        serviceOptions.find((opt) => opt.value === serviceTypeDisplay)?.label ||
        serviceTypeDisplay ||
        "Not Specified";

      localStorage.setItem("selectedSurveyId", enquiry.id);
      localStorage.setItem(
        "currentSurveyData",
        JSON.stringify(surveyData || {})
      );

      navigate(`/survey/${enquiry.id}/survey-details`, {
        state: {
          customerData: {
            fullName: enquiry.fullName,
            phoneNumber: enquiry.phoneNumber,
            email: enquiry.email,
            surveyDate: enquiry.survey_date
              ? new Date(enquiry.survey_date)
              : null,
            surveyStartTime: enquiry.survey_date
              ? new Date(enquiry.survey_date)
              : null,
            serviceType: enquiry.serviceType,
            serviceTypeDisplay: serviceLabel,
            surveyId: surveyData?.survey_id || "",
          },
        },
      });
    } catch (error) {
      setError("Failed to start survey");
    } finally {
      setIsStartingSurvey(false);
      setStartingSurveyId(null);
    }
  };

  const onRescheduleSurveySubmit = async (data) => {
    if (!data.surveyDate)
      return rescheduleSurveyForm.setError("surveyDate", {
        message: "Required",
      });
    setRescheduleSurveyData(data);
    setIsRescheduleSurveyOpen(false);
    setIsRescheduleSurveyConfirmOpen(true);
  };

  const confirmRescheduleSurvey = async () => {
    setIsReschedulingSurvey(true);
    setReschedulingSurveyId(selectedEnquiry.id);
    try {
      const response = await apiClient.post(
        `/contacts/enquiries/${selectedEnquiry.id}/schedule/`,
        {
          survey_date: rescheduleSurveyData.surveyDate.toISOString(),
        }
      );
      const updated = enquiries
        .map((e) => (e.id === selectedEnquiry.id ? response.data : e))
        .sort((a, b) => new Date(b.survey_date) - new Date(a.survey_date));
      setEnquiries(updated);
      setFilteredEnquiries(updated);
      setMessage("Survey rescheduled successfully");
      setIsRescheduleSurveyConfirmOpen(false);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to reschedule");
    } finally {
      setIsReschedulingSurvey(false);
      setReschedulingSurveyId(null);
    }
  };

  const onCancelSurveySubmit = async (data) => {
    setCancelSurveyData(data);
    setIsCancelSurveyOpen(false);
    setIsCancelSurveyConfirmOpen(true);
  };

  const confirmCancelSurvey = async () => {
    setIsCancelingSurvey(true);
    setCancelingSurveyId(selectedEnquiry.id);
    try {
      const response = await apiClient.post(
        `/contacts/enquiries/${selectedEnquiry.id}/cancel-survey/`,
        {
          reason: cancelSurveyData.reason,
        }
      );
      const updated = enquiries
        .map((e) => (e.id === selectedEnquiry.id ? response.data : e))
        .sort((a, b) => new Date(b.survey_date) - new Date(a.survey_date));
      setEnquiries(updated);
      setFilteredEnquiries(updated);
      setMessage("Survey cancelled successfully");
      setIsCancelSurveyConfirmOpen(false);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to cancel");
    } finally {
      setIsCancelingSurvey(false);
      setCancelingSurveyId(null);
    }
  };

  const formatTime = (dateTimeString) =>
    dateTimeString
      ? new Date(dateTimeString).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Not set";

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );

  return (
    <div className="container mx-auto">
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
        >
          {message}
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row justify-end items-start lg:items-center gap-4 mb-6">
        <FormProvider {...filterForm}>
          <form
            onSubmit={filterForm.handleSubmit(handleFilter)}
            className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto"
          >
            <div className="w-full sm:w-auto">
              <Input label="From Date" name="fromDate" type="date" />
            </div>
            <div className="w-full sm:w-auto">
              <Input label="To Date" name="toDate" type="date" />
            </div>
            <button
              type="submit"
              className="mt-2 sm:mt-6 text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded w-full sm:w-auto"
            >
              Apply Filter
            </button>
          </form>
        </FormProvider>
      </div>

      <div className="mb-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-indigo-500"
          />
        </div>
      </div>

      {filteredEnquiries.length === 0 ? (
        <div className="text-center text-[#2d4a5e] text-sm p-5 bg-white shadow-sm rounded-lg">
          No Scheduled Surveys Found
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Sl No
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Survey Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Survey Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Service
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Message
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Note
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Assigned To
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Survey Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentEnquiries.map((enquiry, index) => {
                  const globalIndex =
                    filteredEnquiries.findIndex((e) => e.id === enquiry.id) + 1;
                  const btn = getButtonConfig(enquiry);
                  return (
                    <motion.tr
                      key={enquiry.id}
                      className="hover:bg-gray-50"
                      variants={rowVariants}
                      initial="rest"
                      whileHover="hover"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {globalIndex}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {enquiry.survey_date
                          ? new Date(enquiry.survey_date).toLocaleDateString()
                          : "Not scheduled"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatTime(enquiry.survey_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {enquiry.fullName || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {enquiry.phoneNumber ? (
                          <button
                            onClick={() => openPhoneModal(enquiry)}
                            className="flex items-center gap-2 text-[#4c7085]"
                          >
                            <FaPhoneAlt className="w-3 h-3" />{" "}
                            {enquiry.phoneNumber}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {enquiry.email ? (
                          <a
                            href={`mailto:${enquiry.email}`}
                            className="flex items-center gap-2 text-[#4c7085]"
                          >
                            <FaEnvelope className="w-3 h-3" /> {enquiry.email}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {serviceOptions.find(
                          (opt) => opt.value === enquiry.serviceType
                        )?.label ||
                          enquiry.serviceType ||
                          "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {enquiry.message || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {enquiry.note || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {enquiry.assigned_user_email || "Unassigned"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        <span
                          className={
                            enquiry.contact_status === "Attended"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {enquiry.contact_status || "Not Attended"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            enquiry.survey_status
                          )}`}
                        >
                          {getSurveyStatus(enquiry)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {/* NEW: Create Quote Button - Only if no survey OR cancelled */}
                          {(!enquiry.survey_status ||
                            enquiry.survey_status === "cancelled") && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/quotation-create/enquiry/${enquiry.id}`
                                )
                              }
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow transition"
                            >
                              Create Quote
                            </button>
                          )}

                          <button
                            onClick={() => openRescheduleSurveyModal(enquiry)}
                            className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-xs py-1 px-2 rounded flex items-center gap-1 disabled:opacity-50"
                            disabled={
                              !hasPermission("scheduled_surveys", "edit") ||
                              isReschedulingSurvey ||
                              isSurveyFinished(enquiry)
                            }
                          >
                            {isReschedulingSurvey &&
                            reschedulingSurveyId === enquiry.id ? (
                              <>Rescheduling</>
                            ) : (
                              "Re-Schedule"
                            )}
                          </button>
                          <button
                            onClick={() => openCancelSurveyModal(enquiry)}
                            className="bg-red-500 text-white text-xs py-1 px-2 rounded disabled:opacity-50"
                            disabled={
                              !hasPermission("scheduled_surveys", "edit") ||
                              isCancelingSurvey ||
                              isSurveyFinished(enquiry)
                            }
                          >
                            {isCancelingSurvey &&
                            cancelingSurveyId === enquiry.id ? (
                              <>Canceling</>
                            ) : (
                              "Cancel"
                            )}
                          </button>
                          <button
                            onClick={() => startSurvey(enquiry)}
                            className={`text-white text-xs py-1 px-2 rounded flex items-center gap-1 ${
                              btn.disabled
                                ? "bg-gray-400 cursor-not-allowed"
                                : btn.color
                            }`}
                            disabled={btn.disabled || isStartingSurvey}
                          >
                            {isStartingSurvey &&
                            startingSurveyId === enquiry.id ? (
                              <>{btn.loadingText}</>
                            ) : (
                              btn.text
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredEnquiries.length > 0 && (
            <div className="hidden md:flex justify-between items-center mt-6 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, filteredEnquiries.length)} of{" "}
                {filteredEnquiries.length}
              </div>
            </div>
          )}

          <div className="md:hidden space-y-3">
            {currentEnquiries.map((enquiry) => {
              const isExpanded = expandedEnquiries.has(enquiry.id);
              const globalIndex =
                filteredEnquiries.findIndex((e) => e.id === enquiry.id) + 1;
              const btn = getButtonConfig(enquiry);
              return (
                <motion.div
                  key={enquiry.id}
                  className="rounded-lg p-4 bg-white shadow-sm border border-gray-200"
                  variants={rowVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#2d4a5e]">
                        <strong>SI No:</strong> {globalIndex}
                      </p>
                      <p className="text-sm text-[#2d4a5e] mt-1">
                        <strong>Customer:</strong> {enquiry.fullName || "-"}
                      </p>
                      <p className="text-sm text-[#2d4a5e]">
                        <strong>Survey Date:</strong>{" "}
                        {enquiry.survey_date
                          ? new Date(enquiry.survey_date).toLocaleDateString()
                          : "Not scheduled"}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleEnquiryExpand(enquiry.id)}
                      className="ml-4 w-8 h-8 flex items-center justify-center bg-[#4c7085] text-white rounded-full"
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
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-[#2d4a5e] text-sm">
                          <p>
                            <strong>Survey Time:</strong>{" "}
                            {formatTime(enquiry.survey_date)}
                          </p>
                          <p className="flex items-center gap-2">
                            <strong>Phone:</strong>{" "}
                            {enquiry.phoneNumber ? (
                              <button
                                onClick={() => openPhoneModal(enquiry)}
                                className="flex items-center gap-2 text-[#4c7085]"
                              >
                                <FaPhoneAlt className="w-3 h-3" />{" "}
                                {enquiry.phoneNumber}
                              </button>
                            ) : (
                              "-"
                            )}
                          </p>
                          <p className="flex items-center gap-2">
                            <strong>Email:</strong>{" "}
                            {enquiry.email ? (
                              <a
                                href={`mailto:${enquiry.email}`}
                                className="flex items-center gap-2 text-[#4c7085]"
                              >
                                <FaEnvelope className="w-3 h-3" />{" "}
                                {enquiry.email}
                              </a>
                            ) : (
                              "-"
                            )}
                          </p>
                          <p>
                            <strong>Service Required:</strong>{" "}
                            {serviceOptions.find(
                              (opt) => opt.value === enquiry.serviceType
                            )?.label ||
                              enquiry.serviceType ||
                              "-"}
                          </p>
                          <p>
                            <strong>Message:</strong> {enquiry.message || "-"}
                          </p>
                          <p>
                            <strong>Note:</strong> {enquiry.note || "-"}
                          </p>
                          <p>
                            <strong>Assigned To:</strong>{" "}
                            {enquiry.assigned_user_email || "Unassigned"}
                          </p>
                          <p>
                            <strong>Contact Status:</strong>{" "}
                            <span
                              className={
                                enquiry.contact_status === "Attended"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {enquiry.contact_status || "Not Attended"}
                            </span>
                          </p>
                          <p>
                            <strong>Survey Status:</strong>{" "}
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                enquiry.survey_status
                              )}`}
                            >
                              {getSurveyStatus(enquiry)}
                            </span>
                          </p>

                          <div className="flex flex-wrap gap-2 pt-3">
                            {/* NEW: Create Quote Button - Mobile */}
                            {(!enquiry.survey_status ||
                              enquiry.survey_status === "cancelled") && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/quotation-create/enquiry/${enquiry.id}`
                                  )
                                }
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-medium py-2 px-4 rounded-lg shadow transition"
                              >
                                Create Quote
                              </button>
                            )}

                            <button
                              onClick={() => openRescheduleSurveyModal(enquiry)}
                              className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-xs py-2 px-3 rounded disabled:opacity-50"
                              disabled={
                                !hasPermission("scheduled_surveys", "edit") ||
                                isReschedulingSurvey ||
                                isSurveyFinished(enquiry)
                              }
                            >
                              {isReschedulingSurvey &&
                              reschedulingSurveyId === enquiry.id ? (
                                <>Rescheduling</>
                              ) : (
                                "Re-Schedule"
                              )}
                            </button>
                            <button
                              onClick={() => openCancelSurveyModal(enquiry)}
                              className="bg-red-500 text-white text-xs py-2 px-3 rounded disabled:opacity-50"
                              disabled={
                                !hasPermission("scheduled_surveys", "edit") ||
                                isCancelingSurvey ||
                                isSurveyFinished(enquiry)
                              }
                            >
                              {isCancelingSurvey &&
                              cancelingSurveyId === enquiry.id ? (
                                <>Canceling</>
                              ) : (
                                "Cancel"
                              )}
                            </button>
                            <button
                              onClick={() => startSurvey(enquiry)}
                              className={`text-white text-xs py-2 px-3 rounded ${
                                btn.disabled
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : btn.color
                              }`}
                              disabled={btn.disabled || isStartingSurvey}
                            >
                              {isStartingSurvey &&
                              startingSurveyId === enquiry.id ? (
                                <>{btn.loadingText}</>
                              ) : (
                                btn.text
                              )}
                            </button>
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

      <AnimatePresence>
        <Modal
          isOpen={isPhoneModalOpen}
          onClose={() => setIsPhoneModalOpen(false)}
          title="Contact Options"
          footer={
            <button
              onClick={() => setIsPhoneModalOpen(false)}
              className="bg-gray-500 text-white py-2 px-4 rounded"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4">
            <p className="text-[#2d4a5e] text-sm">
              Choose how to contact {selectedEnquiry?.fullName}:
            </p>
            {selectedEnquiry?.phoneNumber ? (
              <>
                <a
                  href={`tel:${selectedEnquiry.phoneNumber}`}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded"
                >
                  <FaPhoneAlt className="w-5 h-5" /> Call
                </a>
                <a
                  href={`https://wa.me/${selectedEnquiry.phoneNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 text-white py-2 px-4 rounded"
                >
                  <FaWhatsapp className="w-5 h-5" /> WhatsApp
                </a>
              </>
            ) : (
              <p className="text-[#2d4a5e] text-sm">
                No phone number available
              </p>
            )}
          </div>
        </Modal>

        <Modal
          isOpen={isRescheduleSurveyOpen}
          onClose={() => setIsRescheduleSurveyOpen(false)}
          title="Re-Schedule Survey"
          footer={
            <>
              <button
                onClick={() => setIsRescheduleSurveyOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="reschedule-survey-form"
                className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded"
              >
                Submit
              </button>
            </>
          }
        >
          <FormProvider {...rescheduleSurveyForm}>
            <form
              id="reschedule-survey-form"
              onSubmit={rescheduleSurveyForm.handleSubmit(
                onRescheduleSurveySubmit
              )}
              className="space-y-4"
            >
              <div>
                <label className="block text-[#2d4a5e] text-sm font-medium mb-1">
                  Survey Date and Time <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  selected={rescheduleSurveyForm.watch("surveyDate")}
                  onChange={(date) =>
                    rescheduleSurveyForm.setValue("surveyDate", date)
                  }
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd HH:mm"
                  minDate={new Date()}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholderText="Select date and time"
                />
                {rescheduleSurveyForm.formState.errors.surveyDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {rescheduleSurveyForm.formState.errors.surveyDate.message}
                  </p>
                )}
              </div>
            </form>
          </FormProvider>
        </Modal>

        <Modal
          isOpen={isRescheduleSurveyConfirmOpen}
          onClose={() => setIsRescheduleSurveyConfirmOpen(false)}
          title="Confirm Reschedule"
          footer={
            <>
              <button
                onClick={() => setIsRescheduleSurveyConfirmOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmRescheduleSurvey}
                className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded"
              >
                Confirm
              </button>
            </>
          }
        >
          <p className="text-[#2d4a5e] text-sm">
            Reschedule survey to{" "}
            {rescheduleSurveyData?.surveyDate?.toLocaleString()}?
          </p>
        </Modal>

        <Modal
          isOpen={isCancelSurveyOpen}
          onClose={() => setIsCancelSurveyOpen(false)}
          title="Cancel Survey"
          footer={
            <>
              <button
                onClick={() => setIsCancelSurveyOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="cancel-survey-form"
                className="bg-red-500 text-white py-2 px-4 rounded"
              >
                Submit
              </button>
            </>
          }
        >
          <FormProvider {...cancelSurveyForm}>
            <form
              id="cancel-survey-form"
              onSubmit={cancelSurveyForm.handleSubmit(onCancelSurveySubmit)}
            >
              <Input
                label="Reason for Cancellation"
                name="reason"
                type="textarea"
                rules={{ required: "Reason is required" }}
              />
            </form>
          </FormProvider>
        </Modal>

        <Modal
          isOpen={isCancelSurveyConfirmOpen}
          onClose={() => setIsCancelSurveyConfirmOpen(false)}
          title="Confirm Cancellation"
          footer={
            <>
              <button
                onClick={() => setIsCancelSurveyConfirmOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmCancelSurvey}
                className="bg-red-500 text-white py-2 px-4 rounded"
              >
                Confirm
              </button>
            </>
          }
        >
          <p className="text-[#2d4a5e] text-sm">
            Cancel survey with reason: "{cancelSurveyData?.reason}"?
          </p>
        </Modal>
      </AnimatePresence>
    </div>
  );
};

export default ScheduledSurveys;
