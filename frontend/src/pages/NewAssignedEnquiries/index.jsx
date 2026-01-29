import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPhone,
  FiMail,
  FiSearch,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiClipboard
} from "react-icons/fi";
import { IoLogoWhatsapp } from "react-icons/io";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";

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

const NewAssignedEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const { hasPermission, isSuperadmin, isLoadingPermissions } = usePermissions();
  const [isContactStatusOpen, setIsContactStatusOpen] = useState(false);
  const [isContactStatusConfirmOpen, setIsContactStatusConfirmOpen] = useState(false);
  const [isScheduleSurveyOpen, setIsScheduleSurveyOpen] = useState(false);
  const [isScheduleSurveyConfirmOpen, setIsScheduleSurveyConfirmOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [contactStatusData, setContactStatusData] = useState(null);
  const [scheduleSurveyData, setScheduleSurveyData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedEnquiries, setExpandedEnquiries] = useState(new Set());

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSchedulingSurvey, setIsSchedulingSurvey] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const contactStatusForm = useForm();
  const scheduleSurveyForm = useForm();
  const filterForm = useForm({
    defaultValues: {
      filterType: "all",
      fromDate: "",
      toDate: "",
    },
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEnquiries = filteredEnquiries.slice(indexOfFirstItem, indexOfLastItem);
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

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const params = {
          has_survey: "false",
        };

        const enquiryResponse = await apiClient.get("/contacts/enquiries/", { params });

        if (!isMounted) return;

        const rawEnquiries = enquiryResponse.data;
        const sortedEnquiries = rawEnquiries.sort((a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
        );

        setEnquiries(sortedEnquiries);
        setFilteredEnquiries(sortedEnquiries);
      } catch (err) {
        console.error("Error loading assigned enquiries:", err);
        setError("Failed to load assigned enquiries.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const applyFiltersAndSearch = (filterData, search = searchQuery) => {
    let filtered = [...enquiries];
    setCurrentPage(1);

    switch (filterData.filterType) {
      case "attended":
        filtered = filtered.filter((e) => e.contact_status === "Attended");
        break;
      case "notAttended":
        filtered = filtered.filter((e) => e.contact_status === "Not Attended");
        break;
      case "notScheduled":
        filtered = filtered.filter((e) => !e.survey_date);
        break;
      default:
        break;
    }

    if (filterData.fromDate || filterData.toDate) {
      const from = filterData.fromDate ? new Date(filterData.fromDate) : null;
      const to = filterData.toDate ? new Date(filterData.toDate) : null;
      if (to) to.setHours(23, 59, 59, 999);

      filtered = filtered.filter((enquiry) => {
        const createdAt = new Date(enquiry.created_at);
        return (!from || createdAt >= from) && (!to || createdAt <= to);
      });
    }

    if (search && search.trim() !== "") {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter((enquiry) => {
        const fullName = (enquiry.fullName || "").toLowerCase();
        const phone = (enquiry.phoneNumber || "").toLowerCase();
        const email = (enquiry.email || "").toLowerCase();
        const serviceLabel = serviceOptions.find((opt) => opt.value === enquiry.serviceType)?.label?.toLowerCase() || "";
        return (
          fullName.includes(searchLower) ||
          phone.includes(searchLower) ||
          email.includes(searchLower) ||
          serviceLabel.includes(searchLower)
        );
      });
    }

    setFilteredEnquiries(filtered);
  };

  const handleFilter = (data) => {
    applyFiltersAndSearch(data);
    setIsFilterVisible(false);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    applyFiltersAndSearch(filterForm.getValues(), value);
  };

  // Removed local hasPermission as it is now provided by usePermissions()

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
      const updatedEnquiries = enquiries.map((e) => e.id === selectedEnquiry.id ? response.data : e);
      setEnquiries(updatedEnquiries);
      setFilteredEnquiries(updatedEnquiries);
      setMessage("Contact status updated successfully");
      setIsContactStatusConfirmOpen(false);
      contactStatusForm.reset();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update contact status.");
    } finally {
      setIsUpdatingStatus(false);
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
      await apiClient.post(`/contacts/enquiries/${selectedEnquiry.id}/schedule/`, {
        survey_date: scheduleSurveyData.surveyDate.toISOString(),
      });
      const updatedEnquiries = enquiries.filter((e) => e.id !== selectedEnquiry.id);
      setEnquiries(updatedEnquiries);
      setFilteredEnquiries(updatedEnquiries);
      setMessage("Survey scheduled successfully");
      setIsScheduleSurveyConfirmOpen(false);
      scheduleSurveyForm.reset();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to schedule survey.");
    } finally {
      setIsSchedulingSurvey(false);
    }
  };

  const openContactStatusModal = (enquiry) => {
    if (!hasPermission("new_enquiries", "edit")) {
      setError("You do not have permission to update contact status.");
      return;
    }
    setSelectedEnquiry(enquiry);
    contactStatusForm.reset({
      status: enquiry.contact_status || "Not Attended",
      contactStatusNote: enquiry.contact_status_note || "",
      reachedOutWhatsApp: enquiry.reached_out_whatsapp || false,
      reachedOutEmail: enquiry.reached_out_email || false,
    });
    setIsContactStatusOpen(true);
  };

  const openScheduleSurveyModal = (enquiry) => {
    if (!hasPermission("new_enquiries", "edit")) {
      setError("You do not have permission to schedule a survey.");
      return;
    }
    setSelectedEnquiry(enquiry);
    scheduleSurveyForm.reset();
    setIsScheduleSurveyOpen(true);
  };

  const openPhoneModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsPhoneModalOpen(true);
  };

  if (isLoadingPermissions) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="New Assigned Enquiries"
        subtitle="Manage and schedule newly assigned enquiries"
        extra={
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-50">
            <FiClock className="text-amber-500 animate-pulse" />
            Needs Attention
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
        {message && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-medium">{message}</span>
            <button onClick={() => setMessage(null)} className="text-green-400 hover:text-green-600">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 z-10 pointer-events-none">
            <FiSearch className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search by name, phone, email, service..."
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
              <form onSubmit={filterForm.handleSubmit(handleFilter)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="Status" name="filterType" type="select" options={filterOptions} />
                <InputField label="From Date" name="fromDate" type="date" />
                <InputField label="To Date" name="toDate" type="date" />
                <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { filterForm.reset(); applyFiltersAndSearch(filterForm.getValues()); setIsFilterVisible(false); }} className="btn-secondary !bg-transparent !border-none !shadow-none hover:!text-gray-900">Reset</button>
                  <button type="submit" className="btn-primary">Apply Filters</button>
                </div>
              </form>
            </FormProvider>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredEnquiries.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiClipboard className="text-gray-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">No new enquiries found</h3>
          <p className="text-gray-600 text-sm mt-1">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Service</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Created</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentEnquiries.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium text-sm">
                          {item.fullName?.charAt(0) || "C"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{item.fullName}</p>
                          <p className="text-xs text-gray-600">#{item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <FiPhone className="w-3.5 h-3.5 text-gray-600" /> {item.phoneNumber}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-2">
                          <FiMail className="w-3.5 h-3.5 text-gray-600" /> {item.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">
                        {serviceOptions.find(o => o.value === item.serviceType)?.label || item.serviceType}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-medium flex items-center gap-1.5 ${item.contact_status === 'Attended' ? 'text-green-600' : 'text-amber-500'}`}>
                          {item.contact_status === 'Attended' ? <FiCheckCircle /> : <FiClock />}
                          {item.contact_status || "Update"}
                        </span>
                        {item.survey_date ? (
                          <span className="text-[10px] text-blue-500 flex items-center gap-1.5 font-medium">
                            <FiCalendar /> {new Date(item.survey_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-600 italic">Not Scheduled</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        <p>{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {hasPermission("new_enquiries", "edit") && (
                          <button
                            onClick={() => openContactStatusModal(item)}
                            className="px-3 py-1.5 text-[11px] font-medium text-[#4c7085] bg-slate-50 hover:bg-[#4c7085] hover:text-white rounded-xl transition-all"
                          >
                            Status
                          </button>
                        )}
                        {hasPermission("new_enquiries", "edit") && !item.survey_date && (
                          <button
                            onClick={() => openScheduleSurveyModal(item)}
                            className="px-3 py-1.5 text-[11px] font-medium text-white bg-[#4c7085] hover:bg-[#6b8ca3] rounded-xl transition-all shadow-sm"
                          >
                            Schedule
                          </button>
                        )}
                        <button onClick={() => openPhoneModal(item)} className="w-9 h-9 flex items-center justify-center text-green-500 bg-green-50 hover:bg-green-500 hover:text-white rounded-xl transition-all">
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
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium text-gray-800">{indexOfFirstItem + 1}</span> to <span className="font-medium text-gray-800">{Math.min(indexOfLastItem, filteredEnquiries.length)}</span> of <span className="font-medium text-gray-800">{filteredEnquiries.length}</span> enquiries
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center px-4 text-sm font-medium text-[#4c7085] bg-[#4c7085]/10 rounded-xl">
                  {currentPage} / {totalPages || 1}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-4 py-2 border border-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Mobile View */}
          <div className="lg:hidden space-y-4">
            {currentEnquiries.map((item) => {
              const isOpen = expandedEnquiries.has(item.id);
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all shadow-sm">
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleEnquiryExpand(item.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium">
                        {item.fullName?.charAt(0) || "C"}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm">{item.fullName}</h4>
                        <p className="text-[10px] text-gray-600">{new Date(item.created_at).toLocaleDateString()}</p>
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
                              <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Status</p>
                              <p className="text-xs font-medium text-amber-600 mt-0.5">{item.contact_status || "Pending"}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            {hasPermission("new_enquiries", "edit") && (
                              <button onClick={() => openContactStatusModal(item)} className="flex-1 bg-white border border-gray-200 py-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-2 shadow-sm">Status</button>
                            )}
                            {hasPermission("new_enquiries", "edit") && (
                              <button onClick={() => openScheduleSurveyModal(item)} className="flex-1 bg-[#4c7085] text-white py-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-2 shadow-sm">Schedule</button>
                            )}
                            <button onClick={() => openPhoneModal(item)} className="w-10 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-sm"><IoLogoWhatsapp className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Pagination for Mobile */}
            {filteredEnquiries.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-100 rounded-lg px-2 py-1 text-xs"
                  >
                    {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs border border-gray-100 rounded-lg disabled:opacity-30 hover:bg-gray-50"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-medium">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-xs border border-gray-100 rounded-lg disabled:opacity-30 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Modals */}
      <AnimatePresence>
        <Modal
          isOpen={isContactStatusOpen}
          onClose={() => setIsContactStatusOpen(false)}
          title="Update Contact Status"
          footer={
            <>
              <button type="button" onClick={() => setIsContactStatusOpen(false)} className="btn-secondary !bg-transparent !border-none" disabled={isUpdatingStatus}>Cancel</button>
              <button type="submit" form="contact-status-form" className="btn-primary" disabled={isUpdatingStatus}>
                {isUpdatingStatus ? "Updating..." : "Update"}
              </button>
            </>
          }
        >
          <FormProvider {...contactStatusForm}>
            <form id="contact-status-form" onSubmit={contactStatusForm.handleSubmit(onContactStatusSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${contactStatusForm.watch("status") === "Attended" ? "border-[#4c7085] bg-[#4c7085]/5" : "border-gray-100 hover:border-gray-200"}`}>
                  <input type="radio" {...contactStatusForm.register("status", { required: "Please select a status" })} value="Attended" className="hidden" />
                  <FiCheckCircle className={`w-6 h-6 mb-2 ${contactStatusForm.watch("status") === "Attended" ? "text-[#4c7085]" : "text-gray-300"}`} />
                  <span className="text-sm font-medium">Attended</span>
                </label>
                <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${contactStatusForm.watch("status") === "Not Attended" ? "border-amber-500 bg-amber-50/5" : "border-gray-100 hover:border-gray-200"}`}>
                  <input type="radio" {...contactStatusForm.register("status")} value="Not Attended" className="hidden" />
                  <FiClock className={`w-6 h-6 mb-2 ${contactStatusForm.watch("status") === "Not Attended" ? "text-amber-500" : "text-gray-300"}`} />
                  <span className="text-sm font-medium">Not Attended</span>
                </label>
              </div>
              <InputField label="Contact Status Note (Optional)" name="contactStatusNote" type="textarea" placeholder="Enter status update details..." />
              {contactStatusForm.watch("status") === "Not Attended" && (
                <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                  <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium mb-2">Communication Attempts</p>
                  <label className="flex items-center text-gray-700 text-sm font-medium gap-3 cursor-pointer">
                    <input type="checkbox" {...contactStatusForm.register("reachedOutWhatsApp")} className="w-5 h-5 accent-[#4c7085]" />
                    Reached out via WhatsApp
                  </label>
                  <label className="flex items-center text-gray-700 text-sm font-medium gap-3 cursor-pointer">
                    <input type="checkbox" {...contactStatusForm.register("reachedOutEmail")} className="w-5 h-5 accent-[#4c7085]" />
                    Reached out via Email
                  </label>
                </div>
              )}
            </form>
          </FormProvider>
        </Modal>

        <Modal
          isOpen={isContactStatusConfirmOpen}
          onClose={() => setIsContactStatusConfirmOpen(false)}
          title="Confirm Status Update"
          footer={
            <>
              <button onClick={() => setIsContactStatusConfirmOpen(false)} className="btn-secondary !bg-transparent !border-none" disabled={isUpdatingStatus}>Cancel</button>
              <button onClick={confirmContactStatus} className="btn-primary" disabled={isUpdatingStatus}>
                {isUpdatingStatus ? "Updating..." : "Confirm Update"}
              </button>
            </>
          }
        >
          <p className="text-[#2d4a5e] text-sm font-medium">Are you sure you want to update the contact status to "{contactStatusData?.status}"?</p>
        </Modal>

        <Modal
          isOpen={isScheduleSurveyOpen}
          onClose={() => setIsScheduleSurveyOpen(false)}
          title="Schedule Survey"
          footer={
            <>
              <button type="button" onClick={() => setIsScheduleSurveyOpen(false)} className="btn-secondary !bg-transparent !border-none" disabled={isSchedulingSurvey}>Cancel</button>
              <button type="submit" form="schedule-survey-form" className="btn-primary" disabled={isSchedulingSurvey}>
                {isSchedulingSurvey ? "Scheduling..." : "Assign Date"}
              </button>
            </>
          }
        >
          <FormProvider {...scheduleSurveyForm}>
            <form id="schedule-survey-form" onSubmit={scheduleSurveyForm.handleSubmit(onScheduleSurveySubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                    <FiCalendar className="text-[#4c7085]" />
                    Survey Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={scheduleSurveyForm.watch("surveyDate")}
                      onChange={(date) => {
                        const current = scheduleSurveyForm.getValues("surveyDate") || new Date();
                        if (date) {
                          const newDate = new Date(date);
                          newDate.setHours(current.getHours(), current.getMinutes());
                          scheduleSurveyForm.setValue("surveyDate", newDate, { shouldValidate: true });
                        }
                      }}
                      dateFormat="MMMM d, yyyy"
                      minDate={new Date()}
                      className="input-style w-full !pl-10 h-[52px] rounded-xl"
                      placeholderText="Select date"
                      wrapperClassName="w-full"
                      portalId="datepicker-portal"
                    />
                    <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                    <FiClock className="text-[#4c7085]" />
                    Survey Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={scheduleSurveyForm.watch("surveyDate") instanceof Date
                        ? scheduleSurveyForm.watch("surveyDate").toTimeString().slice(0, 5)
                        : ""}
                      onChange={(e) => {
                        const time = e.target.value;
                        const current = scheduleSurveyForm.getValues("surveyDate") || new Date();
                        if (time) {
                          const [h, m] = time.split(':');
                          const newDate = new Date(current);
                          newDate.setHours(parseInt(h), parseInt(m), 0, 0);
                          scheduleSurveyForm.setValue("surveyDate", newDate, { shouldValidate: true });
                        }
                      }}
                      className="input-style w-full !pl-10 h-[52px] rounded-xl"
                    />
                    <FiClock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              {scheduleSurveyForm.formState.errors.surveyDate && (
                <p className="text-red-500 text-xs font-medium ml-1">
                  {scheduleSurveyForm.formState.errors.surveyDate.message}
                </p>
              )}
            </form>
          </FormProvider>
        </Modal>

        <Modal
          isOpen={isScheduleSurveyConfirmOpen}
          onClose={() => setIsScheduleSurveyConfirmOpen(false)}
          title="Confirm Survey Schedule"
          footer={
            <>
              <button onClick={() => setIsScheduleSurveyConfirmOpen(false)} className="btn-secondary !bg-transparent !border-none" disabled={isSchedulingSurvey}>Cancel</button>
              <button onClick={confirmScheduleSurvey} className="btn-primary" disabled={isSchedulingSurvey}>
                {isSchedulingSurvey ? "Scheduling..." : "Confirm Schedule"}
              </button>
            </>
          }
        >
          <p className="text-[#2d4a5e] text-sm font-medium">
            Are you sure you want to schedule the survey for {scheduleSurveyData?.surveyDate ? new Date(scheduleSurveyData.surveyDate).toLocaleString() : ""}?
          </p>
        </Modal>

        <Modal
          isOpen={isPhoneModalOpen}
          onClose={() => setIsPhoneModalOpen(false)}
          title="Contact Options"
          footer={<button type="button" onClick={() => setIsPhoneModalOpen(false)} className="btn-secondary !bg-transparent !border-none">Close</button>}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#4c7085] font-medium text-lg">{selectedEnquiry?.fullName?.charAt(0)}</div>
              <div>
                <p className="font-medium text-gray-800">{selectedEnquiry?.fullName}</p>
                <p className="text-sm text-gray-600">{selectedEnquiry?.phoneNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <a href={`tel:${selectedEnquiry?.phoneNumber}`} className="bg-white border-2 border-gray-50 p-6 rounded-3xl flex flex-col items-center gap-3 hover:border-[#4c7085] transition-all group shadow-sm text-center">
                <div className="w-12 h-12 bg-[#4c7085]/10 rounded-full flex items-center justify-center text-[#4c7085] transition-transform"><FiPhone className="w-6 h-6" /></div>
                <span className="font-medium text-gray-700">Call Now</span>
              </a>
              <a href={`https://wa.me/${selectedEnquiry?.phoneNumber?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-gray-50 p-6 rounded-3xl flex flex-col items-center gap-3 hover:border-green-500 transition-all group shadow-sm text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500 transition-transform"><IoLogoWhatsapp className="w-7 h-7" /></div>
                <span className="font-medium text-gray-700">WhatsApp</span>
              </a>
            </div>
          </div>
        </Modal>
      </AnimatePresence>
    </div>
  );
};

export default NewAssignedEnquiries;