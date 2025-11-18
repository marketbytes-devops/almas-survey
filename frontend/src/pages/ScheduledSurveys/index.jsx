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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedEnquiries, setExpandedEnquiries] = useState(new Set());
  const [cancelingSurveyId, setCancelingSurveyId] = useState(null);
  const navigate = useNavigate();
  const rescheduleSurveyForm = useForm();
  const cancelSurveyForm = useForm();
  const filterForm = useForm({
    defaultValues: {
      filterType: "all",
      fromDate: "",
      toDate: "",
    },
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
      if (newSet.has(enquiryId)) {
        newSet.delete(enquiryId);
      } else {
        newSet.add(enquiryId);
      }
      return newSet;
    });
  };

  const filterOptions = [
    { value: "all", label: "All Scheduled Surveys" },
    { value: "canceled", label: "Canceled Surveys" },
  ];

  const [searchQuery, setSearchQuery] = useState("");

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
        } else {
          setPermissions([]);
        }
      } catch (error) {
        console.error("Unable to fetch user profile:", error);
        setPermissions([]);
        setIsSuperadmin(false);
        setError("Failed to fetch user profile. Please try again.");
      }
    };

    const fetchEnquiries = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/contacts/enquiries/", {
          params: { has_survey: "true" },
        });

        const scheduledEnquiries = response.data
          .filter(enquiry => enquiry.survey_date !== null)
          .map(enquiry => ({
            ...enquiry,
            has_survey: true,
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
    fetchEnquiries();
  }, []);

  const applyFiltersAndSearch = (filterData, search = searchQuery) => {
    let filtered = enquiries.filter(e => e.survey_date !== null);

    setCurrentPage(1);

    if (filterData.fromDate || filterData.toDate) {
      const from = filterData.fromDate ? new Date(filterData.fromDate) : null;
      const to = filterData.toDate ? new Date(filterData.toDate) : null;
      if (to) to.setHours(23, 59, 59, 999);

      filtered = filtered.filter((enquiryry) => {
        const surveyDate = new Date(enquiry.survey_date);
        return (!from || surveyDate >= from) && (!to || surveyDate <= to);
      });
    }

    if (search && search.trim() !== "") {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter((enquiry) => {
        const fullName = (enquiry.fullName || "").toLowerCase();
        const phone = (enquiry.phoneNumber || "").toLowerCase();
        const email = (enquiry.email || "").toLowerCase();
        const serviceLabel =
          serviceOptions.find((opt) => opt.value === enquiry.serviceType)?.label?.toLowerCase() || "";
        const serviceValue = (enquiry.serviceType || "").toLowerCase();
        const message = (enquiry.message || "").toLowerCase();
        const note = (enquiry.note || "").toLowerCase();
        const assignedTo = (enquiry.assigned_user_email || "").toLowerCase();
        const surveyStatus = getSurveyStatus(enquiry).toLowerCase();
        const cancelReason = (enquiry.cancel_reason || "").toLowerCase();

        return (
          fullName.includes(searchLower) ||
          phone.includes(searchLower) ||
          email.includes(searchLower) ||
          serviceLabel.includes(searchLower) ||
          serviceValue.includes(searchLower) ||
          message.includes(searchLower) ||
          note.includes(searchLower) ||
          assignedTo.includes(searchLower) ||
          surveyStatus.includes(searchLower) ||
          cancelReason.includes(searchLower)
        );
      });
    }

    filtered.sort((a, b) => new Date(b.survey_date) - new Date(a.survey_date));

    setFilteredEnquiries(filtered);
  };

  const handleFilter = (data) => {
    applyFiltersAndSearch(data);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    const currentFilterData = filterForm.getValues();
    applyFiltersAndSearch(currentFilterData, value);
  };

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const openPhoneModal = (enquiry) => {
    if (!hasPermission("scheduled_surveys", "view")) {
      setError("You do not have permission to view this enquiry.");
      return;
    }
    setSelectedEnquiry(enquiry);
    setIsPhoneModalOpen(true);
  };

  const openRescheduleSurveyModal = (enquiry) => {
    if (!hasPermission("scheduled_surveys", "edit")) {
      setError("You do not have permission to reschedule a survey.");
      return;
    }
    setSelectedEnquiry(enquiry);
    rescheduleSurveyForm.reset();
    setIsRescheduleSurveyOpen(true);
  };

  const openCancelSurveyModal = (enquiry) => {
    if (!hasPermission("scheduled_surveys", "edit")) {
      setError("You do not have permission to cancel a survey.");
      return;
    }
    setSelectedEnquiry(enquiry);
    cancelSurveyForm.reset();
    setIsCancelSurveyOpen(true);
  };

  const isSurveyFinished = (enquiry) => {
    if (enquiry.survey_data) {
      const status = enquiry.survey_data.status;
      return status === "completed" || status === "in_progress";
    }
    return false;
  };

  const getSurveyStatus = (enquiry) => {
    if (enquiry.survey_data && enquiry.survey_data.status) {
      const statusMap = {
        pending: "Pending",
        in_progress: "In Progress",
        completed: "Completed",
        cancelled: "Cancelled",
      };
      return (
        statusMap[enquiry.survey_data.status] || enquiry.survey_data.status
      );
    }
    return "Not Started";
  };

  const startSurvey = async (enquiry) => {
    if (isSurveyFinished(enquiry)) {
      const status = enquiry.survey_data?.status || "unknown";
      setError(`Survey is already ${status}. Cannot start again.`);
      return;
    }

    setIsStartingSurvey(true);
    setStartingSurveyId(enquiry.id);
    try {
      let surveyData = null;
      let serviceTypeDisplay = enquiry.serviceType;

      try {
        const response = await apiClient.get(
          `/surveys/?enquiry_id=${enquiry.id}`
        );
        if (response.data.length > 0) {
          surveyData = response.data[0];

          if (
            surveyData.status === "completed" ||
            surveyData.status === "in_progress"
          ) {
            setError(
              `Survey is already ${surveyData.status}. Cannot start again.`
            );
            return;
          }

          serviceTypeDisplay =
            surveyData.service_type_display || enquiry.serviceType;
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          throw error;
        }
      }

      const serviceTypeLabel =
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
            serviceTypeDisplay: serviceTypeLabel,
            surveyId: surveyData?.survey_id || "",
          },
        },
      });
    } catch (error) {
      console.error("Failed to start survey:", error);
      setError("Failed to start survey. Please try again.");
    } finally {
      setIsStartingSurvey(false);
      setStartingSurveyId(null);
    }
  };

  const onRescheduleSurveySubmit = async (data) => {
    if (!hasPermission("scheduled_surveys", "edit")) {
      setError("You do not have permission to reschedule a survey.");
      return;
    }
    if (!data.surveyDate) {
      rescheduleSurveyForm.setError("surveyDate", {
        type: "required",
        message: "Survey date and time are required",
      });
      return;
    }
    setRescheduleSurveyData(data);
    setIsRescheduleSurveyOpen(false);
    setIsRescheduleSurveyConfirmOpen(true);
  };

  const confirmRescheduleSurvey = async () => {
    setIsReschedulingSurvey(true);
    setReschedulingSurveyId(selectedEnquiry.id);
    try {
      console.log("Sending reschedule request with data:", {
        survey_date: rescheduleSurveyData.surveyDate.toISOString(),
        enquiry_id: selectedEnquiry.id,
      });
      const response = await apiClient.post(
        `/contacts/enquiries/${selectedEnquiry.id}/schedule/`,
        {
          survey_date: rescheduleSurveyData.surveyDate.toISOString(),
        }
      );
      console.log("Reschedule response:", response.data);
      const updatedEnquiries = enquiries.map((e) =>
        e.id === selectedEnquiry.id ? response.data : e
      );
      const sortedEnquiries = updatedEnquiries.sort((a, b) => {
        const dateA = a.survey_date ? new Date(a.survey_date) : new Date(0);
        const dateB = b.survey_date ? new Date(b.survey_date) : new Date(0);
        return dateB - dateA;
      });
      setEnquiries(sortedEnquiries);
      setFilteredEnquiries(sortedEnquiries);
      setMessage("Survey rescheduled successfully");
      setIsRescheduleSurveyConfirmOpen(false);
      rescheduleSurveyForm.reset();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        "Failed to reschedule survey. Please try again.";
      console.error("Reschedule error:", errorMessage, error);
      setError(errorMessage);
    } finally {
      setIsReschedulingSurvey(false);
      setReschedulingSurveyId(null);
    }
  };

  const onCancelSurveySubmit = async (data) => {
    if (!hasPermission("scheduled_surveys", "edit")) {
      setError("You do not have permission to cancel a survey.");
      return;
    }
    setCancelSurveyData(data);
    setIsCancelSurveyOpen(false);
    setIsCancelSurveyConfirmOpen(true);
  };

  const confirmCancelSurvey = async () => {
    setIsCancelingSurvey(true);
    setCancelingSurveyId(selectedEnquiry.id);
    try {
      console.log("Sending cancel survey request with data:", {
        reason: cancelSurveyData.reason,
        enquiry_id: selectedEnquiry.id,
      });
      const response = await apiClient.post(
        `/contacts/enquiries/${selectedEnquiry.id}/cancel-survey/`,
        {
          reason: cancelSurveyData.reason,
        }
      );
      console.log("Cancel survey response:", response.data);
      const updatedEnquiries = enquiries.map((e) =>
        e.id === selectedEnquiry.id ? response.data : e
      );
      const sortedEnquiries = updatedEnquiries.sort((a, b) => {
        const dateA = a.survey_date ? new Date(a.survey_date) : new Date(0);
        const dateB = b.survey_date ? new Date(b.survey_date) : new Date(0);
        return dateB - dateA;
      });
      setEnquiries(sortedEnquiries);
      setFilteredEnquiries(sortedEnquiries);
      setMessage("Survey cancelled successfully");
      setIsCancelSurveyConfirmOpen(false);
      cancelSurveyForm.reset();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        "Failed to cancel survey. Please try again.";
      console.error("Cancel survey error:", errorMessage, error);
      setError(errorMessage);
    } finally {
      setIsCancelingSurvey(false);
      setCancelingSurveyId(null);
    }
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return "Not set";
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  }

  return (
    <div className="container mx-auto">
      {error && (
        <motion.div
          className="mb-4 p-4 bg-red-100 text-red-700 rounded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}
      {message && (
        <motion.div
          className="mb-4 p-4 bg-green-100 text-green-700 rounded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
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
              <Input
                label="Filter By *"
                name="filterType"
                type="select"
                options={filterOptions}
                rules={{ required: "Filter type is required" }}
              />
            </div>
            <div className="w-full sm:w-auto">
              <Input
                label="From Date"
                name="fromDate"
                type="date"
                placeholder="dd-mm-yyyy"
              />
            </div>
            <div className="w-full sm:w-auto">
              <Input
                label="To Date"
                name="toDate"
                type="date"
                placeholder="dd-mm-yyyy"
              />
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
            placeholder="Search by name, phone, email, service, message, note, or assigned user..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors"
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Sl No
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Survey Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Survey Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Customer Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Phone
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Service Required
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Message
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Note
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Assigned To
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Survey Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentEnquiries.map((enquiry, index) => {
                  const globalIndex =
                    filteredEnquiries.findIndex((e) => e.id === enquiry.id) + 1;
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
                        {enquiry.survey_date
                          ? formatTime(enquiry.survey_date)
                          : "Not set"}
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
                          className={`${enquiry.survey_data?.status === "completed"
                            ? "text-green-600"
                            : enquiry.survey_data?.status === "in_progress"
                              ? "text-blue-600"
                              : enquiry.survey_data?.status === "pending"
                                ? "text-yellow-600"
                                : enquiry.survey_data?.status === "cancelled"
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}
                        >
                          {getSurveyStatus(enquiry)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                        <div className="flex gap-2">
                          {enquiry.survey_date ? (
                            <>
                              <button
                                onClick={() =>
                                  openRescheduleSurveyModal(enquiry)
                                }
                                className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-xs py-1 px-2 rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={
                                  !hasPermission("scheduled_surveys", "edit") ||
                                  (isReschedulingSurvey &&
                                    reschedulingSurveyId === enquiry.id)
                                }
                              >
                                {isReschedulingSurvey &&
                                  reschedulingSurveyId === enquiry.id ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Rescheduling
                                  </>
                                ) : (
                                  "Re-Schedule"
                                )}
                              </button>
                              <button
                                onClick={() => openCancelSurveyModal(enquiry)}
                                className="bg-red-500 text-white text-xs py-1 px-2 rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={
                                  !hasPermission("scheduled_surveys", "edit") ||
                                  (isCancelingSurvey &&
                                    cancelingSurveyId === enquiry.id)
                                }
                              >
                                {isCancelingSurvey &&
                                  cancelingSurveyId === enquiry.id ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Canceling
                                  </>
                                ) : (
                                  "Cancel"
                                )}
                              </button>
                              <button
                                onClick={() => startSurvey(enquiry)}
                                className={`text-white text-xs py-1 px-2 rounded flex items-center gap-1 ${isSurveyFinished(enquiry)
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-green-500 hover:bg-green-600"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                disabled={
                                  isSurveyFinished(enquiry) ||
                                  !hasPermission("scheduled_surveys", "edit") ||
                                  (isStartingSurvey &&
                                    startingSurveyId === enquiry.id)
                                }
                              >
                                {isStartingSurvey &&
                                  startingSurveyId === enquiry.id ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Starting
                                  </>
                                ) : isSurveyFinished(enquiry) ? (
                                  enquiry.survey_data?.status ===
                                    "completed" ? (
                                    "Completed"
                                  ) : (
                                    "In Progress"
                                  )
                                ) : (
                                  "Start Survey"
                                )}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openRescheduleSurveyModal(enquiry)}
                              className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-xs py-1 px-2 rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={
                                !hasPermission("scheduled_surveys", "edit") ||
                                (isReschedulingSurvey &&
                                  reschedulingSurveyId === enquiry.id)
                              }
                            >
                              {isReschedulingSurvey &&
                                reschedulingSurveyId === enquiry.id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Scheduling
                                </>
                              ) : (
                                "Schedule Survey"
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredEnquiries.length > 0 && (
            <div className="hidden md:flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700 whitespace-nowrap">surveys per page</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>

              <div className="text-sm text-gray-700">
                Showing {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, filteredEnquiries.length)} of{" "}
                {filteredEnquiries.length} surveys
              </div>
            </div>
          )}
          <div className="md:hidden space-y-3">
            {currentEnquiries.map((enquiry, index) => {
              const isExpanded = expandedEnquiries.has(enquiry.id);
              const globalIndex =
                filteredEnquiries.findIndex((e) => e.id === enquiry.id) + 1;

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
                          <p>
                            <strong>Survey Time:</strong>{" "}
                            {enquiry.survey_date
                              ? formatTime(enquiry.survey_date)
                              : "Not set"}
                          </p>
                          <p className="flex items-center gap-2">
                            <strong>Phone:</strong>
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
                            <strong>Email:</strong>
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
                            <strong>Survey Status:</strong>{" "}
                            <span
                              className={`${enquiry.survey_data?.status === "completed"
                                ? "text-green-600"
                                : enquiry.survey_data?.status ===
                                  "in_progress"
                                  ? "text-blue-600"
                                  : enquiry.survey_data?.status === "pending"
                                    ? "text-yellow-600"
                                    : enquiry.survey_data?.status === "cancelled"
                                      ? "text-red-600"
                                      : "text-gray-600"
                                }`}
                            >
                              {getSurveyStatus(enquiry)}
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-2 pt-3">
                            {enquiry.survey_date ? (
                              <>
                                <button
                                  onClick={() =>
                                    openRescheduleSurveyModal(enquiry)
                                  }
                                  className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-xs py-2 px-3 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={
                                    !hasPermission(
                                      "scheduled_surveys",
                                      "edit"
                                    ) ||
                                    (isReschedulingSurvey &&
                                      reschedulingSurveyId === enquiry.id)
                                  }
                                >
                                  {isReschedulingSurvey &&
                                    reschedulingSurveyId === enquiry.id ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      Rescheduling
                                    </>
                                  ) : (
                                    "Re-Schedule"
                                  )}
                                </button>
                                <button
                                  onClick={() => openCancelSurveyModal(enquiry)}
                                  className="bg-red-500 text-white text-xs py-2 px-3 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={
                                    !hasPermission(
                                      "scheduled_surveys",
                                      "edit"
                                    ) ||
                                    (isCancelingSurvey &&
                                      cancelingSurveyId === enquiry.id)
                                  }
                                >
                                  {isCancelingSurvey &&
                                    cancelingSurveyId === enquiry.id ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      Canceling
                                    </>
                                  ) : (
                                    "Cancel"
                                  )}
                                </button>
                                <button
                                  onClick={() => startSurvey(enquiry)}
                                  className={`text-white text-xs py-2 px-3 rounded flex items-center gap-2 ${isSurveyFinished(enquiry)
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-500 hover:bg-green-600"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  disabled={
                                    isSurveyFinished(enquiry) ||
                                    !hasPermission(
                                      "scheduled_surveys",
                                      "edit"
                                    ) ||
                                    (isStartingSurvey &&
                                      startingSurveyId === enquiry.id)
                                  }
                                >
                                  {isStartingSurvey &&
                                    startingSurveyId === enquiry.id ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      Starting
                                    </>
                                  ) : isSurveyFinished(enquiry) ? (
                                    enquiry.survey_data?.status ===
                                      "completed" ? (
                                      "Completed"
                                    ) : (
                                      "In Progress"
                                    )
                                  ) : (
                                    "Start Survey"
                                  )}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  openRescheduleSurveyModal(enquiry)
                                }
                                className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-xs py-2 px-3 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={
                                  !hasPermission("scheduled_surveys", "edit") ||
                                  (isReschedulingSurvey &&
                                    reschedulingSurveyId === enquiry.id)
                                }
                              >
                                {isReschedulingSurvey &&
                                  reschedulingSurveyId === enquiry.id ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Scheduling
                                  </>
                                ) : (
                                  "Schedule Survey"
                                )}
                              </button>
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
          {filteredEnquiries.length > 0 && (
            <div className="md:hidden flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <AnimatePresence>
        <Modal
          isOpen={isPhoneModalOpen}
          onClose={() => setIsPhoneModalOpen(false)}
          title="Contact Options"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-[#2d4a5e] text-sm">
              Choose how to contact {selectedEnquiry?.fullName || ""}:
            </p>
            <div className="flex flex-col gap-3">
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
                    className="flex items-center gap-2 bg-green-500 text-white py-2 px-4 rounded"
                    target="_blank"
                    rel="noopener noreferrer"
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
          </div>
        </Modal>
        <Modal
          isOpen={isRescheduleSurveyOpen}
          onClose={() => setIsRescheduleSurveyOpen(false)}
          title="Re-Schedule Survey"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsRescheduleSurveyOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="reschedule-survey-form"
                className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  !hasPermission("scheduled_surveys", "edit") ||
                  isReschedulingSurvey
                }
              >
                {isReschedulingSurvey ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting
                  </>
                ) : (
                  "Submit"
                )}
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
              className="space-y-4 w-full"
            >
              <div className="mb-4 w-full">
                <label className="block text-[#2d4a5e] text-sm font-medium mb-1">
                  Survey Date and Time
                  <span className="text-red-500"> *</span>
                </label>
                <DatePicker
                  selected={rescheduleSurveyForm.watch("surveyDate")}
                  onChange={(date) =>
                    rescheduleSurveyForm.setValue("surveyDate", date, {
                      shouldValidate: true,
                    })
                  }
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd HH:mm"
                  minDate={new Date()}
                  className="w-full p-2 border border-gray-300 rounded text-[#2d4a5e] text-sm focus:outline-none focus:ring-2 focus:ring-[#4c7085]"
                  placeholderText="Select date and time"
                  wrapperClassName="w-full z-50"
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
          title="Confirm Survey Reschedule"
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
                className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  !hasPermission("scheduled_surveys", "edit") ||
                  isReschedulingSurvey
                }
              >
                {isReschedulingSurvey ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Confirming
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </>
          }
        >
          <p className="text-[#2d4a5e] text-sm">
            Are you sure you want to reschedule the survey for{" "}
            {rescheduleSurveyData?.surveyDate
              ? new Date(rescheduleSurveyData.surveyDate).toLocaleString()
              : ""}
            ?
          </p>
        </Modal>
        <Modal
          isOpen={isCancelSurveyOpen}
          onClose={() => setIsCancelSurveyOpen(false)}
          title="Cancel Survey"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsCancelSurveyOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="cancel-survey-form"
                className="bg-red-500 text-white py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  !hasPermission("scheduled_surveys", "edit") ||
                  isCancelingSurvey
                }
              >
                {isCancelingSurvey ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </>
          }
        >
          <FormProvider {...cancelSurveyForm}>
            <form
              id="cancel-survey-form"
              onSubmit={cancelSurveyForm.handleSubmit(onCancelSurveySubmit)}
              className="space-y-4"
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
          title="Confirm Survey Cancellation"
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
                className="bg-red-500 text-white py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  !hasPermission("scheduled_surveys", "edit") ||
                  isCancelingSurvey
                }
              >
                {isCancelingSurvey ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Confirming
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </>
          }
        >
          <p className="text-[#2d4a5e] text-sm">
            Are you sure you want to cancel the survey with reason: "
            {cancelSurveyData?.reason}"?
          </p>
        </Modal>
      </AnimatePresence>
    </div>
  );
};

export default ScheduledSurveys;
