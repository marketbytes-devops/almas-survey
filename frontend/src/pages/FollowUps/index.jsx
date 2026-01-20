import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPhone,
  FiMail,
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiAlertCircle
} from "react-icons/fi";
import { IoLogoWhatsapp } from "react-icons/io";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

// Shared Input Component
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
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-2 ml-1">
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

const FollowUps = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [expandedEnquiries, setExpandedEnquiries] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filterForm = useForm({
    defaultValues: {
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const profileRes = await apiClient.get("/auth/profile/");
        const user = profileRes.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");
        const roleId = user.role?.id;
        if (roleId) {
          const res = await apiClient.get(`/auth/roles/${roleId}/`);
          setPermissions(res.data.permissions || []);
        }

        const enquiriesRes = await apiClient.get("/contacts/enquiries/", {
          params: { has_survey: "false" },
        });
        const sorted = enquiriesRes.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setEnquiries(sorted);
        setFilteredEnquiries(sorted);
      } catch (err) {
        setError("Failed to fetch enquiries requiring follow-up.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const applyFiltersAndSearch = (filterData, search = searchQuery) => {
    let filtered = [...enquiries];
    setCurrentPage(1);

    if (filterData.fromDate || filterData.toDate) {
      const from = filterData.fromDate ? new Date(filterData.fromDate) : null;
      const to = filterData.toDate ? new Date(filterData.toDate) : null;
      if (to) to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((e) => {
        const d = new Date(e.created_at);
        return (!from || d >= from) && (!to || d <= to);
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter((e) =>
        [e.fullName, e.phoneNumber, e.email, e.serviceType, e.assigned_user_email]
          .some(f => f?.toLowerCase().includes(q))
      );
    }

    setFilteredEnquiries(filtered);
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    applyFiltersAndSearch(filterForm.getValues(), val);
  };

  const handleFilter = (data) => {
    applyFiltersAndSearch(data);
    setIsFilterVisible(false);
  };

  const hasPermission = (page, action) => isSuperadmin || permissions.some((p) => p.page === page && p[`can_${action}`]);

  const openPhoneModal = (enquiry) => {
    if (!hasPermission("follow_ups", "view")) return setError("No permission to view this enquiry");
    setSelectedEnquiry(enquiry);
    setIsPhoneModalOpen(true);
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
        title="Follow-Ups"
        subtitle="Manage leads that require further contact or scheduling"
        extra={
          <div className="flex items-center gap-2 text-sm font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 shadow-sm">
            <FiAlertCircle className="w-5 h-5 animate-pulse" />
            Scheduling Required
          </div>
        }
      />

      <AnimatePresence>
        {error && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
            <FiSearch className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search name, phone, email, or staff..."
            value={searchQuery}
            onChange={handleSearch}
            className="input-style w-full !pl-12 h-[56px] rounded-2xl border-gray-100 shadow-sm font-medium"
          />
        </div>
        <button
          onClick={() => setIsFilterVisible(!isFilterVisible)}
          className={`flex items-center gap-2 px-6 h-[56px] rounded-2xl border font-medium transition-all ${isFilterVisible ? 'bg-[#4c7085] text-white border-[#4c7085]' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}
        >
          <FiFilter className="w-5 h-5" />
          <span>Filters</span>
        </button>
      </div>

      <AnimatePresence>
        {isFilterVisible && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <FormProvider {...filterForm}>
              <form onSubmit={filterForm.handleSubmit(handleFilter)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Created From" name="fromDate" type="date" />
                <InputField label="Created To" name="toDate" type="date" />
                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { filterForm.reset(); applyFiltersAndSearch(filterForm.getValues()); setIsFilterVisible(false); }} className="btn-secondary !bg-transparent !border-none !shadow-none font-medium text-gray-400 hover:!text-gray-900">Reset</button>
                  <button type="submit" className="btn-primary">Apply Filters</button>
                </div>
              </form>
            </FormProvider>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredEnquiries.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-100">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiSearch className="w-10 h-10 text-slate-200" />
          </div>
          <h3 className="text-xl font-medium text-gray-800">No matching enquiries found</h3>
          <p className="text-gray-400 mt-2">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="hidden lg:block bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Enquiry Date</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Service</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Assigned To</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Contact Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-center">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentItems.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <FiClock className="text-gray-400 w-4 h-4" />
                        {new Date(enquiry.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium text-sm">
                          {enquiry.fullName?.charAt(0) || "C"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{enquiry.fullName || "N/A"}</p>
                          <p className="text-xs text-gray-500 font-medium">{enquiry.phoneNumber || enquiry.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">
                        {serviceOptions.find(o => o.value === enquiry.serviceType)?.label || enquiry.serviceType || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {enquiry.assigned_user_email || "Not Assigned"}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      <span className={enquiry.contact_status === "Attended" ? "text-green-500 bg-green-50 px-3 py-1 rounded-full border border-green-100" : "text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-100"}>
                        {enquiry.contact_status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <button onClick={() => openPhoneModal(enquiry)} className="w-10 h-10 flex items-center justify-center text-green-500 bg-green-50 hover:bg-green-500 hover:text-white rounded-xl transition-all shadow-sm">
                          <IoLogoWhatsapp className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Desktop */}
            <div className="flex items-center justify-between p-6 border-t border-gray-50">
              <p className="text-sm text-gray-400 font-medium tracking-tight">
                Showing <span className="font-medium text-gray-800">{indexOfFirstItem + 1}</span> to <span className="font-medium text-gray-800">{Math.min(indexOfLastItem, filteredEnquiries.length)}</span> of <span className="font-medium text-gray-800">{filteredEnquiries.length}</span> leads
              </p>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border border-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-30 transition-colors">Previous</button>
                <div className="flex items-center px-4 text-sm font-medium text-[#4c7085] bg-[#4c7085]/10 rounded-xl">{currentPage} / {totalPages || 1}</div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 border border-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-30 transition-colors">Next</button>
              </div>
            </div>
          </div>

          <div className="lg:hidden space-y-4">
            {currentItems.map((enquiry) => {
              const isOpen = expandedEnquiries.has(enquiry.id);
              return (
                <div key={enquiry.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all duration-300">
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(enquiry.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium">
                        {enquiry.fullName?.charAt(0) || "C"}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm tracking-tight">{enquiry.fullName || "N/A"}</h4>
                        <p className="text-[11px] text-gray-400 font-medium">{new Date(enquiry.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {isOpen ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-gray-50/50">
                        <div className="p-4 space-y-4 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Service</p>
                              <p className="text-[11px] font-medium text-blue-600 mt-1">{serviceOptions.find(o => o.value === enquiry.serviceType)?.label || enquiry.serviceType}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Status</p>
                              <p className={`text-[11px] font-medium mt-1 ${enquiry.contact_status === 'Attended' ? 'text-green-500' : 'text-amber-500'}`}>{enquiry.contact_status || 'Pending'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Assigned To</p>
                              <p className="text-xs font-medium text-gray-700 mt-1">{enquiry.assigned_user_email || "Unassigned"}</p>
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mb-1">Message</p>
                            <p className="text-xs text-gray-600 leading-relaxed font-normal">{enquiry.message || "No specific message provided"}</p>
                          </div>
                          <button onClick={() => openPhoneModal(enquiry)} className="w-full bg-green-500 text-white flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium shadow-sm transition-transform active:scale-95">
                            <IoLogoWhatsapp className="w-5 h-5" />
                            <span>Contact on WhatsApp</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact Modal */}
      <AnimatePresence>
        <Modal
          isOpen={isPhoneModalOpen}
          onClose={() => setIsPhoneModalOpen(false)}
          title="Contact Lead"
          footer={<button type="button" onClick={() => setIsPhoneModalOpen(false)} className="btn-secondary !bg-transparent !border-none font-medium">Close</button>}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-6 rounded-3xl flex flex-col items-center text-center gap-2">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-[#4c7085] font-medium text-xl border-2 border-[#4c7085]/10">
                {selectedEnquiry?.fullName?.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800">{selectedEnquiry?.fullName}</h3>
                <p className="text-sm text-gray-500 font-medium">{selectedEnquiry?.phoneNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <a href={`tel:${selectedEnquiry?.phoneNumber}`} className="bg-white border-2 border-gray-100 p-6 rounded-3xl flex flex-col items-center gap-3 hover:border-[#4c7085] transition-all group shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-[#4c7085] group-hover:bg-[#4c7085] group-hover:text-white transition-all"><FiPhone className="w-6 h-6" /></div>
                <span className="font-medium text-gray-700 tracking-tight">Call Mobile</span>
              </a>
              <a href={`https://wa.me/${selectedEnquiry?.phoneNumber?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-gray-100 p-6 rounded-3xl flex flex-col items-center gap-3 hover:border-green-500 transition-all group shadow-sm">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-all"><IoLogoWhatsapp className="w-7 h-7" /></div>
                <span className="font-medium text-gray-700 tracking-tight">WhatsApp</span>
              </a>
            </div>
          </div>
        </Modal>
      </AnimatePresence>
    </div>
  );
};

export default FollowUps;