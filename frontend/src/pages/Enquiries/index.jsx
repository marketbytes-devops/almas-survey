import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPhoneAlt, FaWhatsapp, FaEnvelope } from "react-icons/fa";
import Modal from "../../components/Modal";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const rowVariants = {
  hover: { backgroundColor: "#f3f4f6" },
  rest: { backgroundColor: "#ffffff" },
};

const Input = ({ label, name, type = "text", options = [], rules = {}, ...props }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className="flex flex-col">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {rules.required && <span className="text-red-500"> *</span>}
        </label>
      )}
      {type === "select" ? (
        <select
          {...register(name, rules)}
          className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${
            error ? "border-red-500" : ""
          }`}
          aria-label={label}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          {...register(name, rules)}
          className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${
            error ? "border-red-500" : ""
          }`}
          rows={4}
          aria-label={label}
        />
      ) : (
        <input
          type={type}
          {...register(name, rules)}
          className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${
            error ? "border-red-500" : ""
          }`}
          aria-label={label}
          {...props}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
};

const Enquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [emailReceivers, setEmailReceivers] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isAssignConfirmOpen, setIsAssignConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [assignData, setAssignData] = useState(null);

  const addForm = useForm();
  const editForm = useForm();
  const assignForm = useForm();
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
    { value: "all", label: "All Enquiries" },
    { value: "assigned", label: "Assigned Enquiries" },
    { value: "non-assigned", label: "Non-Assigned Enquiries" },
  ];

  const RECAPTCHA_ACTION = "submit_enquiry";

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
      }
    };

    const fetchEnquiries = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/contacts/enquiries/");
        setEnquiries(response.data);
        setFilteredEnquiries(response.data);
      } catch (error) {
        setError("Failed to fetch enquiries. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchEmailReceivers = async () => {
      try {
        const response = await apiClient.get("/auth/users/");
        setEmailReceivers(
          response.data.map((user) => ({
            value: user.email,
            label: user.name || user.email,
          }))
        );
      } catch (error) {
        setError("Failed to fetch users for assignment. Please try again.");
      }
    };

    const loadRecaptcha = () => {
      const existingScript = document.querySelector(
        `script[src*="recaptcha/api.js"]`
      );
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/api.js?render=${import.meta.env.VITE_RECAPTCHA_SITE_KEY}`;
        script.async = true;
        document.body.appendChild(script);
      }
    };

    loadRecaptcha();
    fetchProfileAndPermissions();
    fetchEnquiries();
    fetchEmailReceivers();
  }, []);

  const handleFilter = (data) => {
    let filtered = [...enquiries];

    if (data.filterType === "assigned") {
      filtered = filtered.filter((enquiry) => enquiry.assigned_user_email);
    } else if (data.filterType === "non-assigned") {
      filtered = filtered.filter((enquiry) => !enquiry.assigned_user_email);
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

  const getRecaptchaToken = () => {
    return new Promise((resolve, reject) => {
      if (!window.grecaptcha) {
        reject(new Error("reCAPTCHA script failed to load. Please try again."));
        return;
      }
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, {
            action: RECAPTCHA_ACTION,
          })
          .then(resolve)
          .catch(() =>
            reject(new Error("Failed to obtain reCAPTCHA token. Please try again."))
          );
      });
    });
  };

  const extractErrorMessage = (error) => {
    if (error.response?.data) {
      if (typeof error.response.data === "string") {
        return error.response.data;
      }
      if (error.response.data.error) {
        return error.response.data.error;
      }
      if (error.response.data.non_field_errors) {
        return error.response.data.non_field_errors.join(", ");
      }
      return JSON.stringify(error.response.data);
    }
    return "An unexpected error occurred. Please try again.";
  };

  const onAddSubmit = async (data) => {
    if (!hasPermission("enquiries", "add")) {
      setError("You do not have permission to add an enquiry.");
      return;
    }
    try {
      const recaptchaToken = await getRecaptchaToken();
      const response = await apiClient.post("/contacts/enquiries/", {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        serviceType: data.serviceType,
        message: data.message,
        recaptchaToken,
        submittedUrl: window.location.href,
      });
      const updatedEnquiries = [...enquiries, response.data];
      setEnquiries(updatedEnquiries);
      setFilteredEnquiries(updatedEnquiries);
      setMessage("Enquiry created successfully");
      setIsAddOpen(false);
      addForm.reset();
    } catch (error) {
      setError(extractErrorMessage(error));
    }
  };

  const onEditSubmit = async (data) => {
    if (!hasPermission("enquiries", "edit")) {
      setError("You do not have permission to edit an enquiry.");
      return;
    }
    try {
      const response = await apiClient.patch(`/contacts/enquiries/${selectedEnquiry?.id}/`, {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        serviceType: data.serviceType,
        message: data.message,
      });
      const updatedEnquiries = enquiries.map((enquiry) =>
        enquiry.id === selectedEnquiry?.id ? response.data : enquiry
      );
      setEnquiries(updatedEnquiries);
      setFilteredEnquiries(updatedEnquiries);
      setMessage("Enquiry updated successfully");
      setIsEditOpen(false);
      editForm.reset();
    } catch (error) {
      setError(extractErrorMessage(error));
    }
  };

  const onAssignSubmit = async (data) => {
    if (!hasPermission("enquiries", "edit")) {
      setError("You do not have permission to assign an enquiry.");
      return;
    }
    setAssignData(data);
    setIsAssignOpen(false);
    setIsAssignConfirmOpen(true);
  };

  const confirmAssign = async () => {
    try {
      const response = await apiClient.patch(`/contacts/enquiries/${selectedEnquiry?.id}/`, {
        assigned_user_email: assignData.emailReceiver || null,
        note: assignData.note || null,
      });
      const updatedEnquiries = enquiries.map((enquiry) =>
        enquiry.id === selectedEnquiry?.id ? response.data : enquiry
      );
      setEnquiries(updatedEnquiries);
      setFilteredEnquiries(updatedEnquiries);
      setMessage("Enquiry assigned successfully and email sent to assigned user");
      setIsAssignConfirmOpen(false);
      assignForm.reset();
    } catch (error) {
      setError(extractErrorMessage(error));
    }
  };

  const onDelete = async () => {
    if (!hasPermission("enquiries", "delete")) {
      setError("You do not have permission to delete an enquiry.");
      return;
    }
    try {
      await apiClient.delete(`/contacts/enquiries/${selectedEnquiry?.id}/delete/`);
      const updatedEnquiries = enquiries.filter((enquiry) => enquiry.id !== selectedEnquiry?.id);
      setEnquiries(updatedEnquiries);
      setFilteredEnquiries(updatedEnquiries);
      setMessage("Enquiry deleted successfully");
      setIsDeleteOpen(false);
    } catch (error) {
      setError(extractErrorMessage(error));
    }
  };

  const openEditModal = (enquiry) => {
    if (!hasPermission("enquiries", "edit")) {
      setError("You do not have permission to edit an enquiry.");
      return;
    }
    setSelectedEnquiry(enquiry);
    editForm.reset({
      fullName: enquiry.fullName,
      phoneNumber: enquiry.phoneNumber,
      email: enquiry.email,
      serviceType: enquiry.serviceType,
      message: enquiry.message,
    });
    setIsEditOpen(true);
  };

  const openAssignModal = (enquiry) => {
    if (!hasPermission("enquiries", "edit")) {
      setError("You do not have permission to assign an enquiry.");
      return;
    }
    setSelectedEnquiry(enquiry);
    assignForm.reset({
      emailReceiver: enquiry.assigned_user_email,
      note: enquiry.note,
    });
    setIsAssignOpen(true);
  };

  const openDeleteModal = (enquiry) => {
    if (!hasPermission("enquiries", "delete")) {
      setError("You do not have permission to delete an enquiry.");
      return;
    }
    setSelectedEnquiry(enquiry);
    setIsDeleteOpen(true);
  };

  const openPhoneModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsPhoneModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddOpen(false);
    addForm.reset();
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    editForm.reset();
  };

  const closeAssignModal = () => {
    setIsAssignOpen(false);
    assignForm.reset();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
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
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <button
          onClick={() => setIsAddOpen(true)}
          className="text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded"
          disabled={!hasPermission("enquiries", "add")}
        >
          Add New Enquiry
        </button>
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
        <div className="text-center text-[#2d4a5e] text-sm p-5 bg-white shadow-sm rounded-lg">
          No Enquiries Found
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
              <div className="space-y-2 text-[#2d4a5e] text-sm">
                <p>
                  <strong>Sl No:</strong> {index + 1}
                </p>
                <p>
                  <strong>Date & Time:</strong>{" "}
                  {new Date(enquiry.created_at).toLocaleString()}
                </p>
                <p>
                  <strong>Customer Name:</strong> {enquiry.fullName || ""}
                </p>
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
                <p>
                  <strong>Message:</strong> {enquiry.message || ""}
                </p>
                <p>
                  <strong>Note:</strong> {enquiry.note || ""}
                </p>
                <p>
                  <strong>Assigned To:</strong> {enquiry.assigned_user_email || "Unassigned"}
                </p>
                <div className="flex flex-wrap gap-2 pt-3">
                  <button
                    onClick={() => openAssignModal(enquiry)}
                    className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-sm py-2 px-3 rounded"
                    disabled={!hasPermission("enquiries", "edit")}
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => openEditModal(enquiry)}
                    className="bg-gray-500 text-white text-sm py-2 px-3 rounded"
                    disabled={!hasPermission("enquiries", "edit")}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(enquiry)}
                    className="bg-red-500 text-white text-sm py-2 px-3 rounded"
                    disabled={!hasPermission("enquiries", "delete")}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <AnimatePresence>
        <Modal
          isOpen={isAddOpen}
          onClose={closeAddModal}
          title="Add New Enquiry"
          footer={
            <>
              <button
                type="button"
                onClick={closeAddModal}
                className="bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-enquiry-form"
                className="text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded"
                disabled={!hasPermission("enquiries", "add")}
              >
                Add Enquiry
              </button>
            </>
          }
        >
          <FormProvider {...addForm}>
            <form
              id="add-enquiry-form"
              onSubmit={addForm.handleSubmit(onAddSubmit)}
              className="space-y-4"
            >
              <p className="text-sm text-gray-600">
                Note: Serial Number and Date & Time are auto-generated by the system.
              </p>
              <Input
                label="Customer Name"
                name="fullName"
                type="text"
                rules={{ required: "Customer Name is required" }}
              />
              <Input
                label="Phone Number"
                name="phoneNumber"
                type="text"
                rules={{
                  required: "Phone Number is required",
                  pattern: {
                    value: /^\+?[0-9]{7,15}$/,
                    message: "Enter a valid phone number (7-15 digits, optional +)",
                  },
                }}
              />
              <Input
                label="Email Id"
                name="email"
                type="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email",
                  },
                }}
              />
              <Input
                label="Service Required"
                name="serviceType"
                type="select"
                options={serviceOptions}
                rules={{ required: "Service Required is required" }}
              />
              <Input
                label="Message"
                name="message"
                type="textarea"
                rules={{ required: "Message is required" }}
              />
            </form>
          </FormProvider>
        </Modal>
        <Modal
          isOpen={isEditOpen}
          onClose={closeEditModal}
          title="Edit Enquiry"
          footer={
            <>
              <button
                type="button"
                onClick={closeEditModal}
                className="bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-enquiry-form"
                className="text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded"
                disabled={!hasPermission("enquiries", "edit")}
              >
                Update Enquiry
              </button>
            </>
          }
        >
          <FormProvider {...editForm}>
            <form
              id="edit-enquiry-form"
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <Input
                label="Customer Name"
                name="fullName"
                type="text"
                rules={{ required: "Customer Name is required" }}
              />
              <Input
                label="Phone Number"
                name="phoneNumber"
                type="text"
                rules={{
                  required: "Phone Number is required",
                  pattern: {
                    value: /^\+?[0-9]{7,15}$/,
                    message: "Enter a valid phone number (7-15 digits, optional +)",
                  },
                }}
              />
              <Input
                label="Email Id"
                name="email"
                type="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email",
                  },
                }}
              />
              <Input
                label="Service Required"
                name="serviceType"
                type="select"
                options={serviceOptions}
                rules={{ required: "Service Required is required" }}
              />
              <Input
                label="Message"
                name="message"
                type="textarea"
                rules={{ required: "Message is required" }}
              />
            </form>
          </FormProvider>
        </Modal>
        <Modal
          isOpen={isAssignOpen}
          onClose={closeAssignModal}
          title="Assign Enquiry"
          footer={
            <>
              <button
                type="button"
                onClick={closeAssignModal}
                className="bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="assign-enquiry-form"
                className="text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded"
                disabled={!hasPermission("enquiries", "edit")}
              >
                Assign
              </button>
            </>
          }
        >
          <FormProvider {...assignForm}>
            <form
              id="assign-enquiry-form"
              onSubmit={assignForm.handleSubmit(onAssignSubmit)}
              className="space-y-4"
            >
              <Input
                label="Assign To"
                name="emailReceiver"
                type="select"
                options={[...emailReceivers]}
                rules={{ required: false }}
              />
              <Input label="Note (Optional)" name="note" type="textarea" />
            </form>
          </FormProvider>
        </Modal>
        <Modal
          isOpen={isAssignConfirmOpen}
          onClose={() => setIsAssignConfirmOpen(false)}
          title="Confirm Assignment"
          footer={
            <>
              <button
                onClick={() => setIsAssignConfirmOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmAssign}
                className="text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded"
                disabled={!hasPermission("enquiries", "edit")}
              >
                Confirm
              </button>
            </>
          }
        >
          <p className="text-[#2d4a5e] text-sm">
            Are you sure you want to assign this enquiry to{" "}
            {emailReceivers.find((opt) => opt.value === assignData?.emailReceiver)?.label ||
              "Unassigned"}
            {assignData?.note ? ` with note: "${assignData.note}"` : ""}?
          </p>
        </Modal>
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title="Delete Enquiry"
          footer={
            <>
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="bg-red-500 text-white py-2 px-3 rounded"
                disabled={!hasPermission("enquiries", "delete")}
              >
                Delete
              </button>
            </>
          }
        >
          <p className="text-[#2d4a5e] text-sm">
            Are you sure you want to delete this enquiry?
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
                    className="flex items-center gap-2 text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded"
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
      </AnimatePresence>
    </div>
  );
};

export default Enquiries;