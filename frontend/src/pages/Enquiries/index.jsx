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

const Input = ({
  label,
  name,
  type = "text",
  options = [],
  rules = {},
  ...props
}) => {
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
    defaultValues: {
      filterType: "all",
      fromDate: "",
      toDate: "",
    },
  });

  const toggleEnquiryExpand = (id) => {
  setExpandedEnquiries((prev) => {
    const newSet = new Set(prev);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return newSet;
  });
};

  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const RECAPTCHA_ACTION = "submit_enquiry";

  useEffect(() => {
    const loadRecaptcha = () => {
      if (document.querySelector(`script[src*="recaptcha"]`)) return;

      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => console.log("reCAPTCHA v3 loaded");
      script.onerror = () => setError("Failed to load reCAPTCHA. Please check internet.");
      document.body.appendChild(script);
    };

    loadRecaptcha();
  }, [RECAPTCHA_SITE_KEY]);

  const getRecaptchaToken = async () => {
    return new Promise((resolve, reject) => {
      if (!window.grecaptcha) {
        console.error("reCAPTCHA not loaded yet");
        return reject(new Error("reCAPTCHA not loaded. Try again."));
      }

      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(RECAPTCHA_SITE_KEY, { action: RECAPTCHA_ACTION })
          .then((token) => {
            console.log("reCAPTCHA Token:", token.substring(0, 30) + "...");
            resolve(token);
          })
          .catch((err) => {
            console.error("reCAPTCHA execute failed:", err);
            reject(new Error("reCAPTCHA verification failed. Try again."));
          });
      });
    });
  };

  const applyCurrentFilters = (dataToFilter) => {
    const filterData = filterForm.getValues();
    let filtered = [...dataToFilter];

    if (filterData.filterType === "assigned") {
      filtered = filtered.filter((e) => e.assigned_user_email);
    } else if (filterData.filterType === "non-assigned") {
      filtered = filtered.filter((e) => !e.assigned_user_email);
    }

    if (filterData.fromDate || filterData.toDate) {
      const from = filterData.fromDate ? new Date(filterData.fromDate) : null;
      const to = filterData.toDate ? new Date(filterData.toDate) : null;
      if (to) to.setHours(23, 59, 59, 999);

      filtered = filtered.filter((e) => {
        const createdAt = new Date(e.created_at);
        return (!from || createdAt >= from) && (!to || createdAt <= to);
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((e) => {
        return [
          e.fullName,
          e.phoneNumber,
          e.email,
          e.serviceType,
          e.message,
          e.note,
          e.assigned_user_email,
        ].some((field) => field?.toLowerCase().includes(query));
      });
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

  useEffect(() => {
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

        const sorted = enquiriesRes.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setEnquiries(sorted);
        setFilteredEnquiries(sorted);

        setEmailReceivers(
          usersRes.data.map((u) => ({ value: u.email, label: u.name || u.email }))
        );
      } catch (err) {
        setError("Failed to load data. Please refresh.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilter = () => {
    const filtered = applyCurrentFilters(enquiries);
    setFilteredEnquiries(filtered);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    const filtered = applyCurrentFilters(enquiries);
    setFilteredEnquiries(filtered);
    setCurrentPage(1);
  };

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm?.[`can_${action}`];
  };

  const extractErrorMessage = (error) => {
    return error.response?.data?.error || error.response?.data?.detail || "An error occurred.";
  };

const onAddSubmit = async (data) => {
    if (!hasPermission("enquiries", "add")) {
      setError("Permission denied.");
      return;
    }

    setIsAddingEnquiry(true);
    setError(null);

    try {
      const recaptchaToken = await getRecaptchaToken();

      const response = await apiClient.post("/contacts/enquiries/", {
        ...data,
        recaptchaToken,
        submittedUrl: window.location.href,
      });

      const updated = [response.data, ...enquiries].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setEnquiries(updated);
      setFilteredEnquiries(applyCurrentFilters(updated));
      setCurrentPage(1);

      setMessage("Enquiry added successfully!");
      setTimeout(() => setMessage(null), 4000);
      setIsAddOpen(false);
      addForm.reset();
    } catch (err) {
      console.error("Add Enquiry Error:", err);
      setError(extractErrorMessage(err));
    } finally {
      setIsAddingEnquiry(false);
    }
  };

  const onEditSubmit = async (data) => {
    if (!hasPermission("enquiries", "edit")) {
      setError("You do not have permission to edit an enquiry.");
      return;
    }

    try {
      const response = await apiClient.patch(
        `/contacts/enquiries/${selectedEnquiry?.id}/`,
        {
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          email: data.email,
          serviceType: data.serviceType,
          message: data.message,
        }
      );

      const updatedEnquiries = enquiries
        .map((enquiry) =>
          enquiry.id === selectedEnquiry?.id ? response.data : enquiry
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setEnquiries(updatedEnquiries);

      // ✅ ONE LINE instead of 60!
      const filtered = applyCurrentFilters(updatedEnquiries);
      setFilteredEnquiries(filtered);

      setMessage("Enquiry updated successfully");
      setTimeout(() => setMessage(null), 3000);
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
    setIsAssigningEnquiry(true);
    try {
      const response = await apiClient.patch(
        `/contacts/enquiries/${selectedEnquiry?.id}/`,
        {
          assigned_user_email: assignData.emailReceiver || null,
          note: assignData.note || null,
        }
      );

      const updatedEnquiries = enquiries
        .map((enquiry) =>
          enquiry.id === selectedEnquiry?.id ? response.data : enquiry
        )
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setEnquiries(updatedEnquiries);

      // ✅ ONE LINE instead of 60!
      const filtered = applyCurrentFilters(updatedEnquiries);
      setFilteredEnquiries(filtered);

      setMessage(
        "Enquiry assigned successfully and email sent to assigned user"
      );
      setTimeout(() => setMessage(null), 3000);
      setIsAssignConfirmOpen(false);
      assignForm.reset();
    } catch (error) {
      setError(extractErrorMessage(error));
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

      const updatedEnquiries = enquiries.filter(
        (e) => e.id !== selectedEnquiry.id
      );
      setEnquiries(updatedEnquiries);

      // ✅ ONE LINE instead of 60!
      const filtered = applyCurrentFilters(updatedEnquiries);
      setFilteredEnquiries(filtered);

      // Adjust pagination if needed
      const totalPages = Math.ceil(filtered.length / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }

      setMessage("Enquiry deleted successfully");
      setTimeout(() => setMessage(null), 3000);
      setIsDeleteOpen(false);
      setSelectedEnquiry(null);
    } catch (error) {
      setError(extractErrorMessage(error) || "Failed to delete enquiry");
    } finally {
      setIsDeleting(false);
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
        <div className="w-full sm:w-auto">
          <button
            onClick={() => setIsAddOpen(true)}
            className="relative top-0 sm:top-3 w-full sm:w-auto text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasPermission("enquiries", "add") || isAddingEnquiry}
          >
            {isAddingEnquiry ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding
              </>
            ) : (
              "Add New Enquiry"
            )}
          </button>
        </div>
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
          No Enquiries Found
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
                      <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setAssigningEnquiryId(enquiry.id);
                              openAssignModal(enquiry);
                            }}
                            className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-xs py-1 px-2 rounded flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={
                              !hasPermission("enquiries", "edit") ||
                              (isAssigningEnquiry &&
                                assigningEnquiryId === enquiry.id)
                            }
                          >
                            {isAssigningEnquiry &&
                            assigningEnquiryId === enquiry.id ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Assigning
                              </>
                            ) : (
                              "Assign"
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(enquiry)}
                            className="bg-gray-500 text-white text-xs py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!hasPermission("enquiries", "edit")}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(enquiry)}
                            className="bg-red-500 text-white text-xs py-1 px-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!hasPermission("enquiries", "delete")}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination for Desktop */}
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
                <span className="text-sm text-gray-700 whitespace-nowrap">
                  enquiries per page
                </span>
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
                {filteredEnquiries.length} enquiries
              </div>
            </div>
          )}
          {/* Cards for Mobile */}
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
                  {/* Collapsed View */}
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#2d4a5e]">
                        <strong>SI No:</strong> {globalIndex}
                      </p>
                      <p className="text-sm text-[#2d4a5e] mt-1">
                        <strong>Customer:</strong> {enquiry.fullName || "-"}
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
                            <strong>Date & Time:</strong>{" "}
                            {new Date(enquiry.created_at).toLocaleString()}
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
                            <strong>Service:</strong>{" "}
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
                          <div className="flex flex-wrap gap-2 pt-3">
                            <button
                              onClick={() => {
                                setAssigningEnquiryId(enquiry.id);
                                openAssignModal(enquiry);
                              }}
                              className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-xs py-2 px-3 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={
                                !hasPermission("enquiries", "edit") ||
                                (isAssigningEnquiry &&
                                  assigningEnquiryId === enquiry.id)
                              }
                            >
                              {isAssigningEnquiry &&
                              assigningEnquiryId === enquiry.id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Assigning
                                </>
                              ) : (
                                "Assign"
                              )}
                            </button>
                            <button
                              onClick={() => openEditModal(enquiry)}
                              className="bg-gray-500 text-white text-xs py-2 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!hasPermission("enquiries", "edit")}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(enquiry)}
                              className="bg-red-500 text-white text-xs py-2 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!hasPermission("enquiries", "delete")}
                            >
                              Delete
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
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                className="bg-gray-500 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAddingEnquiry}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-enquiry-form"
                className="text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!hasPermission("enquiries", "add") || isAddingEnquiry}
              >
                {isAddingEnquiry ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding
                  </>
                ) : (
                  "Add Enquiry"
                )}
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
                Note: Serial Number and Date & Time are auto-generated by the
                system.
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
                    message:
                      "Enter a valid phone number (7-15 digits, optional +)",
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
                    message:
                      "Enter a valid phone number (7-15 digits, optional +)",
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
                className="bg-gray-500 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAssigningEnquiry}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="assign-enquiry-form"
                className="text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  !hasPermission("enquiries", "edit") || isAssigningEnquiry
                }
              >
                {isAssigningEnquiry ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Assigning
                  </>
                ) : (
                  "Assign"
                )}
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
                className="bg-gray-500 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAssigningEnquiry}
              >
                Cancel
              </button>
              <button
                onClick={confirmAssign}
                className="text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  !hasPermission("enquiries", "edit") || isAssigningEnquiry
                }
              >
                {isAssigningEnquiry ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Assigning
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </>
          }
        >
          <p className="text-[#2d4a5e] text-sm">
            Are you sure you want to assign this enquiry to{" "}
            {emailReceivers.find(
              (opt) => opt.value === assignData?.emailReceiver
            )?.label || "Unassigned"}
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
                disabled={isDeleting}
                className="bg-red-500 text-white py-2 px-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
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
