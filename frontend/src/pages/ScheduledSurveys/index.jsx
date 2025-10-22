import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPhoneAlt, FaWhatsapp, FaEnvelope } from "react-icons/fa";
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
  const [isRescheduleSurveyConfirmOpen, setIsRescheduleSurveyConfirmOpen] = useState(false);
  const [isCancelSurveyOpen, setIsCancelSurveyOpen] = useState(false);
  const [isCancelSurveyConfirmOpen, setIsCancelSurveyConfirmOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [rescheduleSurveyData, setRescheduleSurveyData] = useState(null);
  const [cancelSurveyData, setCancelSurveyData] = useState(null);
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

  const filterOptions = [
    { value: "all", label: "All Scheduled Surveys" },
    { value: "canceled", label: "Canceled Surveys" },
  ];

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
        setEnquiries(response.data);
        setFilteredEnquiries(response.data);
      } catch (error) {
        setError("Failed to fetch scheduled surveys. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndPermissions();
    fetchEnquiries();
  }, []);

  const handleFilter = (data) => {
    let filtered = [...enquiries];
    if (data.filterType === "canceled") {
      filtered = filtered.filter((enquiry) => !enquiry.survey_date);
    } else {
      filtered = filtered.filter((enquiry) => enquiry.survey_date);
    }
    if (data.fromDate || data.toDate) {
      const from = data.fromDate ? new Date(data.fromDate) : null;
      const to = data.toDate ? new Date(data.toDate) : null;
      if (to) {
        to.setHours(23, 59, 59, 999);
      }
      filtered = filtered.filter((enquiry) => {
        const createdAt = new Date(enquiry.created_at);
        const afterFrom = from ? createdAt >= from : true;
        const beforeTo = to ? createdAt <= to : true;
        return afterFrom && beforeTo;
      });
    }
    setFilteredEnquiries(filtered);
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

  const startSurvey = async (enquiry) => {
    try {
      let surveyData;
      try {
        const response = await apiClient.get(`/surveys/?enquiry_id=${enquiry.id}`);
        if (response.data.length > 0) {
          surveyData = response.data[0];
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          throw error;
        }
      }
      localStorage.setItem("selectedSurveyId", enquiry.id);
      localStorage.setItem("currentSurveyData", JSON.stringify(surveyData || {}));
      navigate(`/survey/${enquiry.id}/survey-details`, {
        state: {
          customerData: {
            fullName: enquiry.fullName,
            phoneNumber: enquiry.phoneNumber,
            email: enquiry.email,
            surveyDate: enquiry.survey_date ? new Date(enquiry.survey_date) : null,
            surveyStartTime: enquiry.survey_date ? new Date(enquiry.survey_date) : null,
            serviceType: enquiry.serviceType,
            surveyId: enquiry.survey_id || "",
          },
        },
      });
    } catch (error) {
      console.error("Failed to start survey:", error);
      setError("Failed to start survey. Please try again.");
    }
  };

  const onRescheduleSurveySubmit = async (data) => {
    if (!hasPermission("scheduled_surveys", "edit")) {
      setError("You do not have permission to reschedule a survey.");
      return;
    }
    if (!data.surveyDate) {
      rescheduleSurveyForm.setError("surveyDate", { type: "required", message: "Survey date and time are required" });
      return;
    }
    setRescheduleSurveyData(data);
    setIsRescheduleSurveyOpen(false);
    setIsRescheduleSurveyConfirmOpen(true);
  };

  const confirmRescheduleSurvey = async () => {
    try {
      console.log("Sending reschedule request with data:", {
        survey_date: rescheduleSurveyData.surveyDate.toISOString(),
        enquiry_id: selectedEnquiry.id,
      });
      const response = await apiClient.post(`/contacts/enquiries/${selectedEnquiry.id}/schedule/`, {
        survey_date: rescheduleSurveyData.surveyDate.toISOString(),
      });
      console.log("Reschedule response:", response.data);
      const updatedEnquiries = enquiries.map((e) =>
        e.id === selectedEnquiry.id ? response.data : e
      );
      setEnquiries(updatedEnquiries);
      setFilteredEnquiries(updatedEnquiries);
      setMessage("Survey rescheduled successfully");
      setIsRescheduleSurveyConfirmOpen(false);
      rescheduleSurveyForm.reset();
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to reschedule survey. Please try again.";
      console.error("Reschedule error:", errorMessage, error);
      setError(errorMessage);
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
    try {
      console.log("Sending cancel survey request with data:", {
        reason: cancelSurveyData.reason,
        enquiry_id: selectedEnquiry.id,
      });
      const response = await apiClient.post(`/contacts/enquiries/${selectedEnquiry.id}/cancel-survey/`, {
        reason: cancelSurveyData.reason,
      });
      console.log("Cancel survey response:", response.data);
      const updatedEnquiries = enquiries.map((e) =>
        e.id === selectedEnquiry.id ? response.data : e
      );
      setEnquiries(updatedEnquiries);
      setFilteredEnquiries(updatedEnquiries);
      setMessage("Survey cancelled successfully");
      setIsCancelSurveyConfirmOpen(false);
      cancelSurveyForm.reset();
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to cancel survey. Please try again.";
      console.error("Cancel survey error:", errorMessage, error);
      setError(errorMessage);
    }
  };

  const isSurveyFinished = (enquiry) => {
    return enquiry.survey !== null;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  }

  const formatTime = (dateTimeString) => {
  if (!dateTimeString) return "Not set";
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

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
      <div className="flex flex-col sm:flex-row justify-end items-center mb-4 gap-4">
        <FormProvider {...filterForm}>
          <form
            onSubmit={filterForm.handleSubmit(handleFilter)}
            className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto"
          >
            <Input
              label="Filter By"
              name="filterType"
              type="select"
              options={filterOptions}
              rules={{ required: "Filter type is required" }}
            />
            <Input
              label="From Date"
              name="fromDate"
              type="date"
            />
            <Input
              label="To Date"
              name="toDate"
              type="date"
            />
            <button
              type="submit"
              className="mt-6 text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded"
            >
              Apply Filter
            </button>
          </form>
        </FormProvider>
      </div>
      {filteredEnquiries.length === 0 ? (
        <div className="text-center text-[#2d4a5e] text-sm sm:text-base p-5 bg-white shadow-sm rounded-lg">
          No Scheduled Surveys Found
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEnquiries.map((enquiry, index) => (
            <motion.div
              key={enquiry.id}
              className="rounded-lg p-5 bg-white shadow-sm"
              variants={rowVariants}
              initial="rest"
              whileHover="hover"
            >
              <div className="space-y-2 text-[#2d4a5e] text-sm sm:text-base">
                <p><strong>Sl No:</strong> {index + 1}</p>
                <p>
                  <strong>Survey Scheduled Date:</strong>{" "}
                  {enquiry.survey_date
                    ? new Date(enquiry.survey_date).toLocaleDateString()
                    : "Not scheduled"}
                </p>
                <p>
                  <strong>Survey Time:</strong>{" "}
                  {enquiry.survey_date ? formatTime(enquiry.survey_date) : "Not set"}
                </p>
                <p><strong>Customer Name:</strong> {enquiry.fullName || ""}</p>
                <p className="flex items-center gap-2">
                  <strong>Phone:</strong>
                  {enquiry.phoneNumber ? (
                    <button
                      onClick={() => openPhoneModal(enquiry)}
                      className="flex items-center gap-2 text-[#4c7085]"
                    >
                      <FaPhoneAlt className="w-3 h-3" /> {enquiry.phoneNumber}
                    </button>
                  ) : (
                    ""
                  )}
                </p>
                <p className="flex items-center gap-2">
                  <strong>Email:</strong>
                  {enquiry.email ? (
                    <a
                      href={`mailto:${enquiry.email}`}
                      className="flex items-center gap-2 text-[#4c7085]"
                    >
                      <FaEnvelope className="w-3 h-3" /> {enquiry.email}
                    </a>
                  ) : (
                    ""
                  )}
                </p>
                <p>
                  <strong>Service Required:</strong>{" "}
                  {serviceOptions.find((opt) => opt.value === enquiry.serviceType)?.label ||
                    enquiry.serviceType ||
                    ""}
                </p>
                <p><strong>Message:</strong> {enquiry.message || ""}</p>
                <p><strong>Note:</strong> {enquiry.note || ""}</p>
                <p><strong>Assigned To:</strong> {enquiry.assigned_user_email || "Unassigned"}</p>
                <div className="flex flex-wrap gap-2 pt-3">
                  {enquiry.survey_date ? (
                    <>
                      <button
                        onClick={() => openRescheduleSurveyModal(enquiry)}
                        className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-sm py-2 px-3 rounded"
                        disabled={!hasPermission("scheduled_surveys", "edit")}
                      >
                        Re-Schedule Survey
                      </button>
                      <button
                        onClick={() => openCancelSurveyModal(enquiry)}
                        className="bg-red-500 text-white text-sm py-2 px-3 rounded"
                        disabled={!hasPermission("scheduled_surveys", "edit")}
                      >
                        Cancel Survey
                      </button>
                      <button
                        onClick={() => startSurvey(enquiry)}
                        className={`text-white text-sm py-2 px-3 rounded ${isSurveyFinished(enquiry) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                          }`}
                        disabled={isSurveyFinished(enquiry) || !hasPermission("scheduled_surveys", "edit")}
                      >
                        {isSurveyFinished(enquiry) ? "Survey Started" : "Start Survey"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openRescheduleSurveyModal(enquiry)}
                      className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-sm py-2 px-3 rounded"
                      disabled={!hasPermission("scheduled_surveys", "edit")}
                    >
                      Schedule Survey
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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
            <p className="text-[#2d4a5e] text-sm sm:text-base">
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
                <p className="text-[#2d4a5e] text-sm sm:text-base">No phone number available</p>
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
                className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded"
                disabled={!hasPermission("scheduled_surveys", "edit")}
              >
                Submit
              </button>
            </>
          }
        >
          <FormProvider {...rescheduleSurveyForm}>
            <form
              id="reschedule-survey-form"
              onSubmit={rescheduleSurveyForm.handleSubmit(onRescheduleSurveySubmit)}
              className="space-y-4 w-full"
            >
              <div className="mb-4 w-full">
                <label className="block text-[#2d4a5e] text-sm font-medium mb-1">
                  Survey Date and Time
                  <span className="text-red-500"> *</span>
                </label>
                <DatePicker
                  selected={rescheduleSurveyForm.watch("surveyDate")}
                  onChange={(date) => rescheduleSurveyForm.setValue("surveyDate", date, { shouldValidate: true })}
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
                className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded"
                disabled={!hasPermission("scheduled_surveys", "edit")}
              >
                Confirm
              </button>
            </>
          }
        >
          <p className="text-[#2d4a5e] text-sm sm:text-base">
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
                className="bg-red-500 text-white py-2 px-4 rounded"
                disabled={!hasPermission("scheduled_surveys", "edit")}
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
                className="bg-red-500 text-white py-2 px-4 rounded"
                disabled={!hasPermission("scheduled_surveys", "edit")}
              >
                Confirm
              </button>
            </>
          }
        >
          <p className="text-[#2d4a5e] text-sm sm:text-base">
            Are you sure you want to cancel the survey with reason: "{cancelSurveyData?.reason}"?
          </p>
        </Modal>
      </AnimatePresence>
    </div>
  );
};

export default ScheduledSurveys;