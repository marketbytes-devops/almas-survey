import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPhoneAlt, FaWhatsapp, FaEnvelope, FaCalendarAlt } from "react-icons/fa";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const rowVariants = {
  hover: { backgroundColor: "#f3f4f6" },
  rest: { backgroundColor: "#ffffff" },
};

const NewAssignedEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isContactStatusOpen, setIsContactStatusOpen] = useState(false);
  const [isContactStatusConfirmOpen, setIsContactStatusConfirmOpen] = useState(false);
  const [isScheduleSurveyOpen, setIsScheduleSurveyOpen] = useState(false);
  const [isScheduleSurveyConfirmOpen, setIsScheduleSurveyConfirmOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [contactStatusData, setContactStatusData] = useState(null);
  const [scheduleSurveyData, setScheduleSurveyData] = useState(null);
  
  // Loading states
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSchedulingSurvey, setIsSchedulingSurvey] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [schedulingSurveyId, setSchedulingSurveyId] = useState(null);

  const contactStatusForm = useForm();
  const scheduleSurveyForm = useForm();
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
    { value: "all", label: "All New Assigned Enquiries" },
    { value: "attended", label: "Attended" },
    { value: "notAttended", label: "Not Attended" },
    { value: "notScheduled", label: "Not Scheduled" },
  ];

  useEffect(() => {
    const fetchProfileAndPermissions = async () => {
      try {
        const response = await apiClient.get("/auth/profile/");
        const user = response.data;
        setUserEmail(user.email);
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
        if (!userEmail) return;
        const response = await apiClient.get("/contacts/enquiries/", {
          params: { 
            assigned_user_email: userEmail,
            has_survey: "false"
          },
        });
        const sortedEnquiries = response.data.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setEnquiries(sortedEnquiries);
        setFilteredEnquiries(sortedEnquiries);
      } catch (error) {
        setError("Failed to fetch assigned enquiries. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndPermissions();
    if (userEmail) {
      fetchEnquiries();
    }
  }, [userEmail]);

  const handleFilter = (data) => {
    let filtered = [...enquiries];

    switch (data.filterType) {
      case "attended":
        filtered = filtered.filter((enquiry) => enquiry.contact_status === "Attended");
        break;
      case "notAttended":
        filtered = filtered.filter((enquiry) => enquiry.contact_status === "Not Attended");
        break;
      case "notScheduled":
        filtered = filtered.filter((enquiry) => !enquiry.survey_date);
        break;
      case "all":
      default:
        break;
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

  const onContactStatusSubmit = async (data) => {
    if (!hasPermission("new_enquiries", "edit")) {
      setError("You do not have permission to update contact status.");
      return;
    }
    setContactStatusData(data);
    setIsContactStatusOpen(false);
    setIsContactStatusConfirmOpen(true);
  };

  const confirmContactStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      const response = await apiClient.patch(`/contacts/enquiries/${selectedEnquiry.id}/`, {
        contact_status: contactStatusData.status,
        contact_status_note: contactStatusData.contactStatusNote || null,
        reached_out_whatsapp: contactStatusData.reachedOutWhatsApp || false,
        reached_out_email: contactStatusData.reachedOutEmail || false,
      });
      const updatedEnquiries = enquiries.map((e) =>
        e.id === selectedEnquiry.id ? response.data : e
      );
      setEnquiries(updatedEnquiries);
      setFilteredEnquiries(updatedEnquiries);
      setMessage("Contact status updated successfully and email sent to admin and salesperson");
      setIsContactStatusConfirmOpen(false);
      contactStatusForm.reset();
    } catch (error) {
      setError(error.response?.data?.error || "Failed to update contact status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
      setUpdatingStatusId(null);
    }
  };

  const onScheduleSurveySubmit = async (data) => {
    if (!hasPermission("new_enquiries", "edit")) {
      setError("You do not have permission to schedule a survey.");
      return;
    }
    if (!data.surveyDate) {
      scheduleSurveyForm.setError("surveyDate", { type: "required", message: "Survey date and time are required" });
      return;
    }
    setScheduleSurveyData(data);
    setIsScheduleSurveyOpen(false);
    setIsScheduleSurveyConfirmOpen(true);
  };

  const confirmScheduleSurvey = async () => {
    setIsSchedulingSurvey(true);
    try {
      const response = await apiClient.post(`/contacts/enquiries/${selectedEnquiry.id}/schedule/`, {
        survey_date: scheduleSurveyData.surveyDate.toISOString(),
      });
      // Remove the scheduled enquiry from the list since it now has a survey_date
      const updatedEnquiries = enquiries.filter((e) => e.id !== selectedEnquiry.id);
      setEnquiries(updatedEnquiries);
      setFilteredEnquiries(updatedEnquiries);
      setMessage("Survey scheduled successfully and emails sent to customer, salesperson, and admin");
      setIsScheduleSurveyConfirmOpen(false);
      scheduleSurveyForm.reset();
    } catch (error) {
      setError(error.response?.data?.error || "Failed to schedule survey. Please try again.");
    } finally {
      setIsSchedulingSurvey(false);
      setSchedulingSurveyId(null);
    }
  };

  const openContactStatusModal = (enquiry) => {
    if (!hasPermission("new_enquiries", "edit")) {
      setError("You do not have permission to update contact status.");
      return;
    }
    setSelectedEnquiry(enquiry);
    setUpdatingStatusId(enquiry.id);
    contactStatusForm.reset({
      status: "",
      contactStatusNote: enquiry.contact_status_note || "",
      reached_out_whatsapp: enquiry.reached_out_whatsapp || false,
      reached_out_email: enquiry.reached_out_email || false,
    });
    setIsContactStatusOpen(true);
  };

  const openScheduleSurveyModal = (enquiry) => {
    if (!hasPermission("new_enquiries", "edit")) {
      setError("You do not have permission to schedule a survey.");
      return;
    }
    setSelectedEnquiry(enquiry);
    setSchedulingSurveyId(enquiry.id);
    scheduleSurveyForm.reset();
    setIsScheduleSurveyOpen(true);
  };

  const openPhoneModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsPhoneModalOpen(true);
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
      <div className="flex flex-col sm:flex-row justify-end items-center mb-4 gap-4">
        <FormProvider {...filterForm}>
          <form
            onSubmit={filterForm.handleSubmit(handleFilter)}
            className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto"
          >
            <div className="w-full sm:w-auto">
            <Input
              label="Filter By"
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
            />
            </div>
            <div className="w-full sm:w-auto">
            <Input
              label="To Date"
              name="toDate"
              type="date"
            />
            </div>
            <div className="w-full sm:w-auto">
            <button
              type="submit"
              className="mt-2 sm:mt-6 text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded w-full sm:w-auto"
            >
              Apply Filter
            </button>
            </div>
          </form>
        </FormProvider>
      </div>
      {filteredEnquiries.length === 0 ? (
        <div className="text-center text-[#2d4a5e] text-sm p-5 bg-white shadow-sm rounded-lg">
          No Assigned Enquiries Found
        </div>
      ) : (
        <>
          {/* Table for Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Sl No
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Date & Time
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
                    Service
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
                    Contact Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Survey Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnquiries.map((enquiry, index) => (
                  <motion.tr
                    key={enquiry.id}
                    className="hover:bg-gray-50"
                    variants={rowVariants}
                    initial="rest"
                    whileHover="hover"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(enquiry.created_at).toLocaleString()}
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
                          <FaPhoneAlt className="w-3 h-3" /> {enquiry.phoneNumber}
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
                      {serviceOptions.find((opt) => opt.value === enquiry.serviceType)?.label ||
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
                      {enquiry.contact_status || "Update the Status"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <FaCalendarAlt className="w-4 h-4 text-[#4c7085]" />
                        {enquiry.survey_date
                          ? new Date(enquiry.survey_date).toLocaleString()
                          : "Not Scheduled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openContactStatusModal(enquiry)}
                          className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-xs py-1 px-2 rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!hasPermission("new_enquiries", "edit") || (isUpdatingStatus && updatingStatusId === enquiry.id)}
                        >
                          {isUpdatingStatus && updatingStatusId === enquiry.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Updating
                            </>
                          ) : (
                            "Update Status"
                          )}
                        </button>
                        {!enquiry.survey_date && (
                          <button
                            onClick={() => openScheduleSurveyModal(enquiry)}
                            className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-xs py-1 px-2 rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!hasPermission("new_enquiries", "edit") || (isSchedulingSurvey && schedulingSurveyId === enquiry.id)}
                          >
                            {isSchedulingSurvey && schedulingSurveyId === enquiry.id ? (
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
                ))}
              </tbody>
            </table>
          </div>
          {/* Cards for Mobile */}
          <div className="md:hidden space-y-4">
            {filteredEnquiries.map((enquiry, index) => (
              <motion.div
                key={enquiry.id}
                className="rounded-lg p-5 bg-white shadow-sm"
                variants={rowVariants}
                initial="rest"
                whileHover="hover"
              >
                <div className="space-y-2 text-[#2d4a5e] text-sm">
                  <p><strong>Sl No:</strong> {index + 1}</p>
                  <p><strong>Date & Time:</strong> {new Date(enquiry.created_at).toLocaleString()}</p>
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
                    <strong>Service:</strong>{" "}
                    {serviceOptions.find((opt) => opt.value === enquiry.serviceType)?.label ||
                      enquiry.serviceType ||
                      ""}
                  </p>
                  <p><strong>Message:</strong> {enquiry.message || ""}</p>
                  <p><strong>Note:</strong> {enquiry.note || ""}</p>
                  <p><strong>Assigned To:</strong> {enquiry.assigned_user_email || "Unassigned"}</p>
                  <p className="flex items-center justify-start space-x-2">
                    <span className="whitespace-nowrap">
                      <strong>Contact Status:</strong> {enquiry.contact_status || "Update the Status"}
                    </span>
                    <button
                      onClick={() => openContactStatusModal(enquiry)}
                      className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-sm py-2 px-3 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!hasPermission("new_enquiries", "edit") || (isUpdatingStatus && updatingStatusId === enquiry.id)}
                    >
                      {isUpdatingStatus && updatingStatusId === enquiry.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Updating
                        </>
                      ) : (
                        "Update Status"
                      )}
                    </button>
                  </p>
                  <p className="flex items-center gap-2">
                    <strong>Survey Date:</strong>
                    <span className="flex items-center gap-2">
                      <FaCalendarAlt className="w-4 h-4 text-[#4c7085]" />
                      {enquiry.survey_date
                        ? new Date(enquiry.survey_date).toLocaleString()
                        : "Not Scheduled"}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2 pt-3">
                    {!enquiry.survey_date && (
                      <button
                        onClick={() => openScheduleSurveyModal(enquiry)}
                        className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-sm py-2 px-3 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!hasPermission("new_enquiries", "edit") || (isSchedulingSurvey && schedulingSurveyId === enquiry.id)}
                      >
                        {isSchedulingSurvey && schedulingSurveyId === enquiry.id ? (
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
            ))}
          </div>
        </>
      )}
      <AnimatePresence>
        <Modal
          isOpen={isContactStatusOpen}
          onClose={() => setIsContactStatusOpen(false)}
          title="Update Contact Status"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsContactStatusOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUpdatingStatus}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="contact-status-form"
                className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!hasPermission("new_enquiries", "edit") || isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </>
          }
        >
          <FormProvider {...contactStatusForm}>
            <form
              id="contact-status-form"
              onSubmit={contactStatusForm.handleSubmit(onContactStatusSubmit)}
              className="space-y-4"
            >
              <div className="mb-4">
                <label className="flex items-center text-[#2d4a5e] text-sm font-medium">
                  <input
                    type="radio"
                    {...contactStatusForm.register("status", {
                      required: "Please select a status",
                    })}
                    value="Attended"
                    className="mr-2 w-5 h-5"
                  />
                  Attended
                </label>
              </div>
              <div className="mb-4">
                <label className="flex items-center text-[#2d4a5e] text-sm font-medium">
                  <input
                    type="radio"
                    {...contactStatusForm.register("status")}
                    value="Not Attended"
                    className="mr-2 w-5 h-5"
                  />
                  Not Attended
                </label>
              </div>
              <Input label="Contact Status Note (Optional)" name="contactStatusNote" type="textarea" />
              {contactStatusForm.watch("status") === "Not Attended" && (
                <>
                  <div className="mb-4">
                    <label className="flex items-center text-[#2d4a5e] text-sm font-medium">
                      <input
                        type="checkbox"
                        {...contactStatusForm.register("reachedOutWhatsApp")}
                        className="mr-2 w-5 h-5"
                      />
                      Reached out via WhatsApp
                    </label>
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center text-[#2d4a5e] text-sm font-medium">
                      <input
                        type="checkbox"
                        {...contactStatusForm.register("reachedOutEmail")}
                        className="mr-2 w-5 h-5"
                      />
                      Reached out via Email
                    </label>
                  </div>
                </>
              )}
            </form>
          </FormProvider>
        </Modal>
        <Modal
          isOpen={isContactStatusConfirmOpen}
          onClose={() => setIsContactStatusConfirmOpen(false)}
          title="Confirm Contact Status Update"
          footer={
            <>
              <button
                onClick={() => setIsContactStatusConfirmOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUpdatingStatus}
              >
                Cancel
              </button>
              <button
                onClick={confirmContactStatus}
                className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!hasPermission("new_enquiries", "edit") || isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </>
          }
        >
          <p className="text-[#2d4a5e] text-sm">
            Are you sure you want to update the contact status to "{contactStatusData?.status}"
            {contactStatusData?.contactStatusNote ? ` with note: "${contactStatusData.contactStatusNote}"` : ""}?
            {contactStatusData?.status === "Not Attended" && (
              <>
                {contactStatusData.reachedOutWhatsApp && " Reached out via WhatsApp."}
                {contactStatusData.reachedOutEmail && " Reached out via Email."}
              </>
            )}
          </p>
        </Modal>
        <Modal
          isOpen={isScheduleSurveyOpen}
          onClose={() => setIsScheduleSurveyOpen(false)}
          title="Schedule Survey"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsScheduleSurveyOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSchedulingSurvey}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="schedule-survey-form"
                className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!hasPermission("new_enquiries", "edit") || isSchedulingSurvey}
              >
                {isSchedulingSurvey ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Scheduling
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </>
          }
        >
          <FormProvider {...scheduleSurveyForm}>
            <form
              id="schedule-survey-form"
              onSubmit={scheduleSurveyForm.handleSubmit(onScheduleSurveySubmit)}
              className="space-y-4 w-full"
            >
              <div className="mb-4 w-full">
                <label className="block text-[#2d4a5e] text-sm font-medium mb-1">
                  Survey Date and Time
                  <span className="text-red-500"> *</span>
                </label>
                <DatePicker
                    selected={scheduleSurveyForm.watch("surveyDate")}
                    onChange={(date) => scheduleSurveyForm.setValue("surveyDate", date, { shouldValidate: true })}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="yyyy-MM-dd HH:mm"
                    minDate={new Date(Date.now() + 15 * 60 * 1000)} 
                    className="w-full p-2 border border-gray-300 rounded text-[#2d4a5e] text-sm focus:outline-none focus:ring-2 focus:ring-[#4c7085]"
                    placeholderText="Select date and time"
                    wrapperClassName="w-full z-50"
                  />
                {scheduleSurveyForm.formState.errors.surveyDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {scheduleSurveyForm.formState.errors.surveyDate.message}
                  </p>
                )}
              </div>
            </form>
          </FormProvider>
        </Modal>
        <Modal
          isOpen={isScheduleSurveyConfirmOpen}
          onClose={() => setIsScheduleSurveyConfirmOpen(false)}
          title="Confirm Survey Schedule"
          footer={
            <>
              <button
                onClick={() => setIsScheduleSurveyConfirmOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSchedulingSurvey}
              >
                Cancel
              </button>
              <button
                onClick={confirmScheduleSurvey}
                className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!hasPermission("new_enquiries", "edit") || isSchedulingSurvey}
              >
                {isSchedulingSurvey ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Scheduling
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </>
          }
        >
          <p className="text-[#2d4a5e] text-sm">
            Are you sure you want to schedule the survey for{" "}
            {scheduleSurveyData?.surveyDate
              ? new Date(scheduleSurveyData.surveyDate).toLocaleString()
              : ""}
            ?
          </p>
        </Modal>
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
                <p className="text-[#2d4a5e] text-sm">No phone number available</p>
              )}
            </div>
          </div>
        </Modal>
      </AnimatePresence>
    </div>
  );
};

export default NewAssignedEnquiries;