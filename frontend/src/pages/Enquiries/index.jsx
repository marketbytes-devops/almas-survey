import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPhone,
  FiMail,
  FiSearch,
  FiPlus,
  FiFilter,
  FiTrash2,
  FiEdit3,
  FiUserPlus,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiClock
} from "react-icons/fi";
import { IoLogoWhatsapp } from "react-icons/io";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import { useNavigate } from "react-router-dom";

// Shared Input Component with Premium Styling
const InputField = ({
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
        <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">
          {label}
          {rules.required && <span className="text-red-500"> *</span>}
        </label>
      )}
      {type === "select" ? (
        <select
          {...register(name, rules)}
          className={`input-style w-full ${error ? "border-red-500 shadow-sm shadow-red-50/50" : ""}`}
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
          className={`input-style w-full min-h-[120px] resize-none ${error ? "border-red-500 shadow-sm shadow-red-50/50" : ""}`}
        />
      ) : (
        <input
          type={type}
          {...register(name, rules)}
          className={`input-style w-full ${error ? "border-red-500 shadow-sm shadow-red-50/50" : ""}`}
          {...props}
        />
      )}
      {error && <p className="mt-1.5 ml-1 text-xs text-red-500 font-medium">{error.message}</p>}
    </div>
  );
};

const Enquiries = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [emailReceivers, setEmailReceivers] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedEnquiries, setExpandedEnquiries] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterVisible, setIsFilterVisible] = useState(false);

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

  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const RECAPTCHA_ACTION = "submit_enquiry";

  const serviceOptions = [
    { value: "localMove", label: "Local Move" },
    { value: "internationalMove", label: "International Move" },
    { value: "carExport", label: "Car Import and Export" },
    { value: "storageServices", label: "Storage Services" },
    { value: "logistics", label: "Logistics" },
  ];

  const filterOptions = [
    { value: "all", label: "All Enquiries" },
    { value: "assigned", label: "Assigned" },
    { value: "non-assigned", label: "Non-Assigned" },
  ];

  // Logic from original component
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
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm?.[`can_${action}`];
  };

  const applyFilters = (data, query = searchQuery) => {
    const filterData = filterForm.getValues();
    let filtered = [...data];

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
        const d = new Date(e.created_at);
        return (!from || d >= from) && (!to || d <= to);
      });
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter((e) =>
        [e.fullName, e.phoneNumber, e.email, e.serviceType, e.message, e.note, e.assigned_user_email]
          .some(f => f?.toLowerCase().includes(q))
      );
    }

    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setFilteredEnquiries(applyFilters(enquiries, val));
    setCurrentPage(1);
  };

  const onFilterSubmit = () => {
    setFilteredEnquiries(applyFilters(enquiries));
    setCurrentPage(1);
    setIsFilterVisible(false);
  };

  const getRecaptchaToken = async () => {
    return new Promise((resolve) => {
      if (!window.grecaptcha) resolve(null);
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: RECAPTCHA_ACTION }).then(resolve);
      });
    });
  };

  const onAddSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const token = await getRecaptchaToken();
      const res = await apiClient.post("/contacts/enquiries/", { ...data, recaptchaToken: token, submittedUrl: window.location.href });
      const updated = [res.data, ...enquiries];
      setEnquiries(updated);
      setFilteredEnquiries(applyFilters(updated));
      setIsAddOpen(false);
      addForm.reset();
      setMessage("Enquiry added successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add enquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.patch(`/contacts/enquiries/${selectedEnquiry.id}/`, data);
      const updated = enquiries.map(e => e.id === selectedEnquiry.id ? res.data : e);
      setEnquiries(updated);
      setFilteredEnquiries(applyFilters(updated));
      setIsEditOpen(false);
      setMessage("Enquiry updated successfully");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError("Failed to update enquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAssignSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.patch(`/contacts/enquiries/${selectedEnquiry.id}/`, {
        assigned_user_email: data.emailReceiver || null,
        note: data.note || null,
      });
      const updated = enquiries.map(e => e.id === selectedEnquiry.id ? res.data : e);
      setEnquiries(updated);
      setFilteredEnquiries(applyFilters(updated));
      setIsAssignOpen(false);
      setMessage("Enquiry assigned successfully");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError("Assignment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/contacts/enquiries/${selectedEnquiry.id}/delete/`);
      const updated = enquiries.filter(e => e.id !== selectedEnquiry.id);
      setEnquiries(updated);
      setFilteredEnquiries(applyFilters(updated));
      setIsDeleteOpen(false);
      setMessage("Deleted successfully");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError("Delete failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedEnquiries(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEnquiries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);

  if (isLoading) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Enquiry Management"
        subtitle="Track and manage customer move requests"
        extra={
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-primary"
          >
            <FiPlus className="w-5 h-5" />
            <span className="text-sm tracking-wide">Add Enquiry</span>
          </button>
        }
      />

      {/* Global Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
          </motion.div>
        )}
        {message && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-medium">{message}</span>
            <button onClick={() => setMessage(null)} className="text-green-400 hover:text-green-600">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 z-10 pointer-events-none">
            <FiSearch className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search name, phone, email, or service..."
            value={searchQuery}
            onChange={handleSearch}
            className="input-style w-full !pl-12 h-[56px] rounded-2xl border-gray-100 shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className={`flex items-center gap-2 px-5 h-[52px] rounded-2xl border font-medium transition-all ${isFilterVisible ? 'bg-[#4c7085] text-white border-[#4c7085]' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}
          >
            <FiFilter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isFilterVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <FormProvider {...filterForm}>
              <form onSubmit={filterForm.handleSubmit(onFilterSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="Status" name="filterType" type="select" options={filterOptions} />
                <InputField label="From Date" name="fromDate" type="date" />
                <InputField label="To Date" name="toDate" type="date" />
                <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { filterForm.reset(); onFilterSubmit(); }} className="btn-secondary !bg-transparent !border-none !shadow-none hover:!text-gray-900">Reset</button>
                  <button type="submit" className="btn-primary">Apply Filters</button>
                </div>
              </form>
            </FormProvider>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table & Grid Layout */}
      {filteredEnquiries.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiSearch className="text-gray-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">No enquiries found</h3>
          <p className="text-gray-600 text-sm mt-1">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Service</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Assigned To</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Created</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium text-sm">
                          {item.fullName?.charAt(0) || "C"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{item.fullName}</p>
                          <p className="text-xs text-gray-600">ID: #{item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <FiPhone className="w-3.5 h-3.5 text-gray-600" /> {item.phoneNumber}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-2">
                          <FiMail className="w-3.5 h-3.5 text-gray-600" /> {item.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">
                        {serviceOptions.find(o => o.value === item.serviceType)?.label || item.serviceType}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {item.assigned_user_email ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FiCheckCircle className="text-green-500" />
                          <span className="truncate max-w-[120px] font-medium">{item.assigned_user_email}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-amber-500 font-medium italic">
                          <FiClock /> Unassigned
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-gray-600">
                        <p>{new Date(item.created_at).toLocaleDateString()}</p>
                        <p className="text-xs opacity-60">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => { setSelectedEnquiry(item); setIsAssignOpen(true); }} className="w-9 h-9 flex items-center justify-center text-[#4c7085] bg-slate-50 hover:bg-[#4c7085] hover:text-white rounded-xl transition-all duration-200" title="Assign">
                          <FiUserPlus className="w-4.5 h-4.5" />
                        </button>
                        <button onClick={() => { setSelectedEnquiry(item); editForm.reset(item); setIsEditOpen(true); }} className="w-9 h-9 flex items-center justify-center text-gray-600 bg-slate-50 hover:bg-gray-800 hover:text-white rounded-xl transition-all duration-200" title="Edit">
                          <FiEdit3 className="w-4.5 h-4.5" />
                        </button>
                        <button onClick={() => { setSelectedEnquiry(item); setIsDeleteOpen(true); }} className="w-9 h-9 flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-200" title="Delete">
                          <FiTrash2 className="w-4.5 h-4.5" />
                        </button>
                        <button onClick={() => { setSelectedEnquiry(item); setIsPhoneModalOpen(true); }} className="w-9 h-9 flex items-center justify-center text-green-500 bg-green-50 hover:bg-green-500 hover:text-white rounded-xl transition-all duration-200" title="Contact">
                          <IoLogoWhatsapp className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Grid */}
          <div className="lg:hidden space-y-4">
            {currentItems.map((item) => {
              const isOpen = expandedEnquiries.has(item.id);
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all shadow-sm">
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(item.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium">
                        {item.fullName?.charAt(0) || "C"}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm">{item.fullName}</h4>
                        <p className="text-[10px] text-gray-600 font-medium">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {isOpen ? <FiChevronUp className="text-gray-600" /> : <FiChevronDown className="text-gray-600" />}
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-gray-50/50">
                        <div className="p-4 space-y-4 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Service</p>
                              <p className="text-xs font-medium text-blue-600 mt-0.5">{serviceOptions.find(o => o.value === item.serviceType)?.label || item.serviceType}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Assigned To</p>
                              <p className={`text-xs font-medium mt-0.5 ${item.assigned_user_email ? 'text-gray-700' : 'text-amber-500 italic'}`}>
                                {item.assigned_user_email || "Not Assigned"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Contact Info</p>
                            <p className="text-xs text-gray-700 mt-1 flex items-center gap-2"><FiPhone className="text-gray-300" /> {item.phoneNumber}</p>
                            <p className="text-xs text-gray-700 mt-1 flex items-center gap-2"><FiMail className="text-gray-300" /> {item.email}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Message</p>
                            <p className="text-xs text-gray-600 mt-1 italic font-medium">"{item.message}"</p>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => { setSelectedEnquiry(item); editForm.reset(item); setIsEditOpen(true); }} className="flex-1 bg-white border border-gray-200 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 shadow-sm"><FiEdit3 /> Edit</button>
                            <button onClick={() => { setSelectedEnquiry(item); setIsAssignOpen(true); }} className="flex-1 bg-[#4c7085] text-white py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 shadow-sm"><FiUserPlus /> Assign</button>
                            <button onClick={() => { setSelectedEnquiry(item); setIsPhoneModalOpen(true); }} className="w-[52px] bg-green-500 text-white rounded-xl flex items-center justify-center shadow-sm"><IoLogoWhatsapp className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-6">
            <p className="text-sm text-gray-600 hidden sm:block">
              Showing <span className="font-medium text-gray-800">{indexOfFirstItem + 1}</span> to <span className="font-medium text-gray-800">{Math.min(indexOfLastItem, filteredEnquiries.length)}</span> of <span className="font-medium text-gray-800">{filteredEnquiries.length}</span> enquiries
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center px-4 text-sm font-medium text-[#4c7085] bg-[#4c7085]/10 rounded-xl">
                {currentPage} / {totalPages || 1}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {/* Add Modal */}
        {isAddOpen && (
          <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="New Enquiry Request">
            <FormProvider {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Customer Full Name" name="fullName" placeholder="e.g. John Doe" rules={{ required: "Required" }} />
                  <InputField label="Phone Number" name="phoneNumber" placeholder="+91 ..." rules={{ required: "Required" }} />
                </div>
                <InputField label="Email Address" name="email" type="email" placeholder="john@example.com" rules={{ required: "Required" }} />
                <InputField label="Service Type" name="serviceType" type="select" options={serviceOptions} rules={{ required: "Required" }} />
                <InputField label="Message / Requirement" name="message" type="textarea" placeholder="Detail the move requirement..." rules={{ required: "Required" }} />
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                  <button type="button" onClick={() => setIsAddOpen(false)} className="btn-secondary !bg-transparent !border-none">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? "Submitting..." : "Submit Enquiry"}
                  </button>
                </div>
              </form>
            </FormProvider>
          </Modal>
        )}

        {/* Edit Modal */}
        {isEditOpen && (
          <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Client Details">
            <FormProvider {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Full Name" name="fullName" />
                  <InputField label="Phone" name="phoneNumber" />
                </div>
                <InputField label="Email" name="email" type="email" />
                <InputField label="Service" name="serviceType" type="select" options={serviceOptions} />
                <InputField label="Note" name="note" type="textarea" />
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary !bg-transparent !border-none">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? "Updating..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </FormProvider>
          </Modal>
        )}

        {/* Assign Modal */}
        {isAssignOpen && (
          <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Assign Team Lead">
            <FormProvider {...assignForm}>
              <form onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="space-y-6">
                <InputField
                  label="Select Salesperson"
                  name="emailReceiver"
                  type="select"
                  options={emailReceivers}
                  rules={{ required: "Please select a staff member" }}
                />
                <InputField label="Assignment Note" name="note" type="textarea" placeholder="Add instructions for the assigned person..." />
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                  <button type="button" onClick={() => setIsAssignOpen(false)} className="btn-secondary !bg-transparent !border-none">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? "Assigning..." : "Confirm Assignment"}
                  </button>
                </div>
              </form>
            </FormProvider>
          </Modal>
        )}

        {/* Delete Confirm */}
        {isDeleteOpen && (
          <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Deletion">
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="w-8 h-8" />
              </div>
              <p className="text-gray-800 font-medium">Delete this enquiry?</p>
              <p className="text-xs text-gray-600 mt-1 font-medium">This action cannot be undone and will remove all associated notes.</p>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-3 text-xs font-medium text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100">Cancel</button>
                <button onClick={onDelete} disabled={isSubmitting} className="flex-1 py-3 text-xs font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 shadow-sm shadow-red-100">
                  {isSubmitting ? "Deleting..." : "Delete Perpetually"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Contact Options */}
        {isPhoneModalOpen && (
          <Modal isOpen={isPhoneModalOpen} onClose={() => setIsPhoneModalOpen(false)} title="Contact Client">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#4c7085] font-medium">
                  {selectedEnquiry?.fullName?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{selectedEnquiry?.fullName}</p>
                  <p className="text-sm text-gray-600 font-medium">{selectedEnquiry?.phoneNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <a href={`tel:${selectedEnquiry?.phoneNumber}`} className="bg-white border-2 border-gray-50 p-6 rounded-3xl flex flex-col items-center gap-3 hover:border-[#4c7085] transition-all group shadow-sm">
                  <div className="w-12 h-12 bg-[#4c7085]/10 rounded-full flex items-center justify-center text-[#4c7085] transition-transform"><FiPhone className="w-6 h-6" /></div>
                  <span className="font-medium text-gray-700">Call Now</span>
                </a>
                <a href={`https://wa.me/${selectedEnquiry?.phoneNumber?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-gray-50 p-6 rounded-3xl flex flex-col items-center gap-3 hover:border-green-500 transition-all group shadow-sm">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500 transition-transform"><IoLogoWhatsapp className="w-7 h-7" /></div>
                  <span className="font-medium text-gray-700">WhatsApp</span>
                </a>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Enquiries;