import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPhoneAlt, FaWhatsapp, FaEnvelope, FaSearch } from "react-icons/fa";
import Modal from "../../components/Modal";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const rowVariants = {
  hover: { backgroundColor: "#f3f4f6" },
  rest: { backgroundColor: "#ffffff" },
};

const Input = ({ label, name, type = "text", options = [], rules = {}, ...props }) => {
  const { register, formState: { errors } } = useFormContext();
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
          className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${error ? "border-red-500" : ""}`}
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
          className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${error ? "border-red-500" : ""}`}
          rows={4}
          aria-label={label}
        />
      ) : (
        <input
          type={type}
          {...register(name, rules)}
          className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${error ? "border-red-500" : ""}`}
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [assignData, setAssignData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedEnquiries, setExpandedEnquiries] = useState(new Set());
  const [isAddingEnquiry, setIsAddingEnquiry] = useState(false);
  const [isAssigningEnquiry, setIsAssigningEnquiry] = useState(false);
  const [assigningEnquiryId, setAssigningEnquiryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const addForm = useForm();
  const editForm = useForm();
  const assignForm = useForm();
  const filterForm = useForm({
    defaultValues: { filterType: "all", fromDate: "", toDate: "" },
  });

  const RECAPTCHA_ACTION = "submit_enquiry";
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    const loadRecaptcha = () => {
      if (document.getElementById("recaptcha-script")) return;
      const script = document.createElement("script");
      script.id = "recaptcha-script";
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    const fetchData = async () => {
      try {
        const [profileRes, enquiriesRes, usersRes] = await Promise.all([
          apiClient.get("/auth/profile/"),
          apiClient.get("/contacts/enquiries/"),
          apiClient.get("/auth/users/"),
        ]);

        const user = profileRes.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");
        if (user.role?.id) {
          const roleRes = await apiClient.get(`/auth/roles/${user.role.id}/`);
          setPermissions(roleRes.data.permissions || []);
        }

        const sorted = enquiriesRes.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setEnquiries(sorted);
        setFilteredEnquiries(sorted);

        setEmailReceivers(
          usersRes.data.map((u) => ({ value: u.email, label: u.name || u.email }))
        );
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadRecaptcha();
    fetchData();
  }, []);

  const getRecaptchaToken = () => {
    return new Promise((resolve, reject) => {
      if (!window.grecaptcha) return reject(new Error("reCAPTCHA not loaded"));
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(RECAPTCHA_SITE_KEY, { action: RECAPTCHA_ACTION })
          .then(resolve)
          .catch(reject);
      });
    });
  };

  const applyCurrentFilters = (data) => {
    const { filterType, fromDate, toDate } = filterForm.getValues();
    let filtered = [...data];

    if (filterType === "assigned") filtered = filtered.filter((e) => e.assigned_user_email);
    else if (filterType === "non-assigned") filtered = filtered.filter((e) => !e.assigned_user_email);

    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;
      if (to) to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((e) => {
        const d = new Date(e.created_at);
        return (!from || d >= from) && (!to || d <= to);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((e) =>
        Object.values(e)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEnquiries = filteredEnquiries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);

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

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm?.[`can_${action}`] || false;
  };

  const extractErrorMessage = (error) => {
    if (error.response?.data) {
      if (typeof error.response.data === "string") return error.response.data;
      if (error.response.data.error) return error.response.data.error;
      if (error.response.data.detail) return error.response.data.detail;
      if (error.response.data.non_field_errors) return error.response.data.non_field_errors.join(", ");
      return JSON.stringify(error.response.data);
    }
    return "An unexpected error occurred";
  };

  const onAddSubmit = async (data) => {
    if (!hasPermission("enquiries", "add")) return setError("Permission denied");
    setIsAddingEnquiry(true);
    setError(null);
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
      const updated = [response.data, ...enquiries].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setEnquiries(updated);
      setFilteredEnquiries(applyCurrentFilters(updated));
      setCurrentPage(1);
      setMessage("Enquiry created successfully");
      setTimeout(() => setMessage(null), 3000);
      setIsAddOpen(false);
      addForm.reset();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsAddingEnquiry(false);
    }
  };

  const onEditSubmit = async (data) => {
    if (!hasPermission("enquiries", "edit")) return setError("Permission denied");
    try {
      const response = await apiClient.patch(`/contacts/enquiries/${selectedEnquiry?.id}/`, data);
      const updated = enquiries
        .map((e) => (e.id === selectedEnquiry?.id ? response.data : e))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setEnquiries(updated);
      setFilteredEnquiries(applyCurrentFilters(updated));
      setMessage("Enquiry updated successfully");
      setTimeout(() => setMessage(null), 3000);
      setIsEditOpen(false);
      editForm.reset();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const onAssignSubmit = async (data) => {
    if (!hasPermission("enquiries", "edit")) return setError("Permission denied");
    setAssignData(data);
    setIsAssignOpen(false);
    setIsAssignConfirmOpen(true);
  };

  const confirmAssign = async () => {
    setIsAssigningEnquiry(true);
    try {
      const response = await apiClient.patch(`/contacts/enquiries/${selectedEnquiry?.id}/`, {
        assigned_user_email: assignData.emailReceiver || null,
        note: assignData.note || null,
      });
      const updated = enquiries
        .map((e) => (e.id === selectedEnquiry?.id ? response.data : e))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setEnquiries(updated);
      setFilteredEnquiries(applyCurrentFilters(updated));
      setMessage("Enquiry assigned successfully");
      setTimeout(() => setMessage(null), 3000);
      setIsAssignConfirmOpen(false);
      assignForm.reset();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsAssigningEnquiry(false);
      setAssigningEnquiryId(null);
    }
  };

  const onDelete = async () => {
    if (!hasPermission("enquiries", "delete")) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/contacts/enquiries/${selectedEnquiry?.id}/`);
      const updated = enquiries.filter((e) => e.id !== selectedEnquiry.id);
      setEnquiries(updated);
      setFilteredEnquiries(applyCurrentFilters(updated));
      const newTotalPages = Math.ceil(updated.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) setCurrentPage(newTotalPages);
      setMessage("Enquiry deleted successfully");
      setTimeout(() => setMessage(null), 3000);
      setIsDeleteOpen(false);
      setSelectedEnquiry(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (enquiry) => {
    if (!hasPermission("enquiries", "edit")) return setError("Permission denied");
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
    if (!hasPermission("enquiries", "edit")) return setError("Permission denied");
    setSelectedEnquiry(enquiry);
    assignForm.reset({
      emailReceiver: enquiry.assigned_user_email || "",
      note: enquiry.note || "",
    });
    setIsAssignOpen(true);
  };

  const openDeleteModal = (enquiry) => {
    if (!hasPermission("enquiries", "delete")) return setError("Permission denied");
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

  const handleFilter = () => {
    setFilteredEnquiries(applyCurrentFilters(enquiries));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setFilteredEnquiries(applyCurrentFilters(enquiries));
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {error && (
        <motion.div className="mb-4 p-4 bg-red-100 text-red-700 rounded" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {error}
        </motion.div>
      )}
      {message && (
        <motion.div className="mb-4 p-4 bg-green-100 text-green-700 rounded" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {message}
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <button
          onClick={() => setIsAddOpen(true)}
          disabled={!hasPermission("enquiries", "add") || isAddingEnquiry}
          className="w-full sm:w-auto bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-6 rounded flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isAddingEnquiry ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Adding...
            </>
          ) : (
            "Add New Enquiry"
          )}
        </button>

        <FormProvider {...filterForm}>
          <form onSubmit={filterForm.handleSubmit(handleFilter)} className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Input label="Filter" name="filterType" type="select" options={filterOptions} />
            <Input label="From" name="fromDate" type="date" />
            <Input label="To" name="toDate" type="date" />
            <button type="submit" className="mt-6 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-5 rounded">
              Apply
            </button>
          </form>
        </FormProvider>
      </div>

      <div className="relative mb-6">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-2 border focus:outline-indigo-500 rounded"
        />
      </div>

      {filteredEnquiries.length === 0 ? (
        <div className="text-center py-10 bg-white rounded shadow">No Enquiries Found</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sl No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currentEnquiries.map((enquiry) => {
                  const idx = filteredEnquiries.findIndex((e) => e.id === enquiry.id) + 1;
                  return (
                    <motion.tr key={enquiry.id} variants={rowVariants} initial="rest" whileHover="hover">
                      <td className="px-4 py-3 text-sm">{idx}</td>
                      <td className="px-4 py-3 text-sm">{new Date(enquiry.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{enquiry.fullName || "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        {enquiry.phoneNumber ? (
                          <button onClick={() => openPhoneModal(enquiry)} className="text-[#4c7085] flex items-center gap-1">
                            <FaPhoneAlt className="w-4 h-4" /> {enquiry.phoneNumber}
                          </button>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {enquiry.email ? (
                          <a href={`mailto:${enquiry.email}`} className="text-[#4c7085] flex items-center gap-1">
                            <FaEnvelope className="w-4 h-4" /> {enquiry.email}
                          </a>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {serviceOptions.find((o) => o.value === enquiry.serviceType)?.label || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">{enquiry.message || "-"}</td>
                      <td className="px-4 py-3 text-sm">{enquiry.note || "-"}</td>
                      <td className="px-4 py-3 text-sm">{enquiry.assigned_user_email || "Unassigned"}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setAssigningEnquiryId(enquiry.id); openAssignModal(enquiry); }}
                            disabled={!hasPermission("enquiries", "edit") || (isAssigningEnquiry && assigningEnquiryId === enquiry.id)}
                            className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-3 py-1 rounded text-xs"
                          >
                            {isAssigningEnquiry && assigningEnquiryId === enquiry.id ? "..." : "Assign"}
                          </button>
                          <button onClick={() => openEditModal(enquiry)} disabled={!hasPermission("enquiries", "edit")} className="bg-gray-600 text-white px-3 py-1 rounded text-xs">Edit</button>
                          <button onClick={() => openDeleteModal(enquiry)} disabled={!hasPermission("enquiries", "delete")} className="bg-red-600 text-white px-3 py-1 rounded text-xs">Delete</button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {currentEnquiries.map((enquiry) => {
              const idx = filteredEnquiries.findIndex((e) => e.id === enquiry.id) + 1;
              const expanded = expandedEnquiries.has(enquiry.id);
              return (
                <motion.div key={enquiry.id} className="bg-white rounded-lg shadow p-4" variants={rowVariants} initial="rest" whileHover="hover">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium"><strong>{idx}</strong> - {enquiry.fullName || "No name"}</p>
                      <p className="text-xs text-gray-600">{new Date(enquiry.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => setExpandedEnquiries(prev => {
                      const n = new Set(prev);
                      n.has(enquiry.id) ? n.delete(enquiry.id) : n.add(enquiry.id);
                      return n;
                    })} className="text-[#4c7085]">
                      {expanded ? "Hide" : "Show"} Details
                    </button>
                  </div>
                  {expanded && (
                    <div className="mt-4 space-y-2 text-sm">
                      <p><strong>Phone:</strong> {enquiry.phoneNumber || "-"}</p>
                      <p><strong>Email:</strong> {enquiry.email || "-"}</p>
                      <p><strong>Service:</strong> {serviceOptions.find(o => o.value === enquiry.serviceType)?.label || "-"}</p>
                      <p><strong>Message:</strong> {enquiry.message || "-"}</p>
                      <p><strong>Note:</strong> {enquiry.note || "-"}</p>
                      <p><strong>Assigned:</strong> {enquiry.assigned_user_email || "Unassigned"}</p>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => openAssignModal(enquiry)} className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-3 py-1 rounded text-xs">Assign</button>
                        <button onClick={() => openEditModal(enquiry)} className="bg-gray-600 text-white px-3 py-1 rounded text-xs">Edit</button>
                        <button onClick={() => openDeleteModal(enquiry)} className="bg-red-600 text-white px-3 py-1 rounded text-xs">Delete</button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setCurrentPage(p => Math.max(p-1, 1))} disabled={currentPage === 1} className="px-4 py-2 border rounded disabled:opacity-50">Previous</button>
              <span className="px-4 py-2">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 border rounded disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {/* Add Modal */}
        <Modal isOpen={isAddOpen} onClose={closeAddModal} title="Add New Enquiry" footer={
          <>
            <button onClick={closeAddModal} className="bg-gray-500 text-white py-2 px-4 rounded">Cancel</button>
            <button type="submit" form="add-form" disabled={isAddingEnquiry} className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-6 rounded flex items-center gap-2">
              {isAddingEnquiry ? "Adding..." : "Add Enquiry"}
            </button>
          </>
        }>
          <FormProvider {...addForm}>
            <form id="add-form" onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <Input label="Customer Name *" name="fullName" rules={{ required: "Required" }} />
              <Input label="Phone Number *" name="phoneNumber" rules={{ required: "Required", pattern: { value: /^\+?[0-9]{7,15}$/, message: "Invalid phone" } }} />
              <Input label="Email *" name="email" type="email" rules={{ required: "Required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } }} />
              <Input label="Service Required *" name="serviceType" type="select" options={serviceOptions} rules={{ required: "Required" }} />
              <Input label="Message *" name="message" type="textarea" rules={{ required: "Required" }} />
            </form>
          </FormProvider>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={isEditOpen} onClose={closeEditModal} title="Edit Enquiry" footer={
          <>
            <button onClick={closeEditModal} className="bg-gray-500 text-white py-2 px-4 rounded">Cancel</button>
            <button type="submit" form="edit-form" className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-6 rounded">Update</button>
          </>
        }>
          <FormProvider {...editForm}>
            <form id="edit-form" onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <Input label="Customer Name" name="fullName" rules={{ required: true }} />
              <Input label="Phone Number" name="phoneNumber" rules={{ required: true }} />
              <Input label="Email" name="email" type="email" rules={{ required: true }} />
              <Input label="Service Required" name="serviceType" type="select" options={serviceOptions} rules={{ required: true }} />
              <Input label="Message" name="message" type="textarea" rules={{ required: true }} />
            </form>
          </FormProvider>
        </Modal>

        {/* Assign Modal */}
        <Modal isOpen={isAssignOpen} onClose={closeAssignModal} title="Assign Enquiry" footer={
          <>
            <button onClick={closeAssignModal} className="bg-gray-500 text-white py-2 px-4 rounded">Cancel</button>
            <button type="submit" form="assign-form" className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-6 rounded">Assign</button>
          </>
        }>
          <FormProvider {...assignForm}>
            <form id="assign-form" onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="space-y-4">
              <Input label="Assign To" name="emailReceiver" type="select" options={emailReceivers} />
              <Input label="Note (Optional)" name="note" type="textarea" />
            </form>
          </FormProvider>
        </Modal>

        {/* Confirm Assign */}
        <Modal isOpen={isAssignConfirmOpen} onClose={() => setIsAssignConfirmOpen(false)} title="Confirm Assignment" footer={
          <>
            <button onClick={() => setIsAssignConfirmOpen(false)} className="bg-gray-500 text-white py-2 px-4 rounded">Cancel</button>
            <button onClick={confirmAssign} disabled={isAssigningEnquiry} className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-6 rounded">
              {isAssigningEnquiry ? "Assigning..." : "Confirm"}
            </button>
          </>
        }>
          <p>Assign to {emailReceivers.find(o => o.value === assignData?.emailReceiver)?.label || "Unassigned"}?</p>
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Enquiry" footer={
          <>
            <button onClick={() => setIsDeleteOpen(false)} className="bg-gray-500 text-white py-2 px-4 rounded">Cancel</button>
            <button onClick={onDelete} disabled={isDeleting} className="bg-red-600 text-white py-2 px-6 rounded">
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </>
        }>
          <p>Are you sure you want to delete this enquiry?</p>
        </Modal>

        {/* Phone Modal */}
        <Modal isOpen={isPhoneModalOpen} onClose={() => setIsPhoneModalOpen(false)} title="Contact Options">
          <div className="space-y-4">
            {selectedEnquiry?.phoneNumber ? (
              <>
                <a href={`tel:${selectedEnquiry.phoneNumber}`} className="block text-center bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-3 rounded">
                  <FaPhoneAlt className="inline mr-2" /> Call
                </a>
                <a href={`https://wa.me/${selectedEnquiry.phoneNumber}`} target="_blank" rel="noopener noreferrer" className="block text-center bg-green-500 text-white py-3 rounded">
                  <FaWhatsapp className="inline mr-2" /> WhatsApp
                </a>
              </>
            ) : (
              <p>No phone number</p>
            )}
          </div>
        </Modal>
      </AnimatePresence>
    </div>
  );
};

export default Enquiries;