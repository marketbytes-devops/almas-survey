import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPhone,
  FiMail,
  FiSearch,
  FiCalendar,
  FiClock,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiXCircle,
  FiPlay,
  FiRotateCw,
  FiFileText
} from "react-icons/fi";
import { IoLogoWhatsapp } from "react-icons/io";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router";
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

const ScheduledSurveys = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { hasPermission } = usePermissions();
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isRescheduleSurveyOpen, setIsRescheduleSurveyOpen] = useState(false);
  const [isRescheduleSurveyConfirmOpen, setIsRescheduleSurveyConfirmOpen] = useState(false);
  const [isCancelSurveyOpen, setIsCancelSurveyOpen] = useState(false);
  const [isCancelSurveyConfirmOpen, setIsCancelSurveyConfirmOpen] = useState(false);
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
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
  const currentEnquiries = filteredEnquiries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);

  const toggleEnquiryExpand = (enquiryId) => {
    setExpandedEnquiries((prev) => {
      const newSet = new Set(prev);
      newSet.has(enquiryId) ? newSet.delete(enquiryId) : newSet.add(enquiryId);
      return newSet;
    });
  };

  const getSurveyStatusDisplay = (enquiry) => {
    if (!enquiry.survey_status) return "Pending";
    const map = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return map[enquiry.survey_status] || enquiry.survey_status;
  };

  const getStatusStyles = (status) => {
    const styles = {
      pending: "text-amber-500 bg-amber-50 border-amber-100",
      in_progress: "text-blue-500 bg-blue-50 border-blue-100",
      completed: "text-green-500 bg-green-50 border-green-100",
      cancelled: "text-red-500 bg-red-50 border-red-100",
    };
    return styles[status] || "text-gray-600 bg-gray-50 border-gray-100";
  };

  const isSurveyFinished = (enquiry) => ["completed", "cancelled"].includes(enquiry.survey_status);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {

        const [enquiriesRes, surveysRes] = await Promise.all([
          apiClient.get("/contacts/enquiries/", { params: { has_survey: "true" } }),
          apiClient.get("/surveys/"),
        ]);


        const surveyMap = {};
        surveysRes.data.forEach((survey) => {
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

        const scheduledEnquiries = enquiriesRes.data
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
        setError("Failed to fetch scheduled surveys.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
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
      const q = search.toLowerCase().trim();
      filtered = filtered.filter((e) =>
        [e.fullName, e.phoneNumber, e.email, e.assigned_user_email, e.survey_status]
          .some(f => f?.toLowerCase().includes(q))
      );
    }

    setFilteredEnquiries(filtered.sort((a, b) => new Date(b.survey_date) - new Date(a.survey_date)));
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



  const openRescheduleSurveyModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    rescheduleSurveyForm.reset({
      surveyDate: enquiry.survey_date ? new Date(enquiry.survey_date) : new Date()
    });
    setIsRescheduleSurveyOpen(true);
  };

  const openCancelSurveyModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    cancelSurveyForm.reset();
    setIsCancelSurveyOpen(true);
  };

  const openPhoneModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsPhoneModalOpen(true);
  };

  const startSurvey = async (enquiry) => {
    if (!hasPermission("scheduled_surveys", "add")) return alert("Permission denied");
    if (isSurveyFinished(enquiry)) return;
    setIsStartingSurvey(true);
    setStartingSurveyId(enquiry.id);
    try {
      let surveyData = null;
      const existing = await apiClient.get(`/surveys/?enquiry_id=${enquiry.id}`);
      if (existing.data.length > 0) {
        surveyData = existing.data[0];
        if (["completed", "cancelled"].includes(surveyData.status)) {
          setError(`Survey is already ${surveyData.status}`);
          setIsStartingSurvey(false);
          setStartingSurveyId(null);
          return;
        }
        if (surveyData.status === "pending") {
          await apiClient.patch(`/surveys/${surveyData.survey_id}/`, { status: "in_progress" });
        }
      }

      const serviceLabel = serviceOptions.find((opt) => opt.value === enquiry.serviceType)?.label || enquiry.serviceType || "Not Specified";
      localStorage.setItem("selectedSurveyId", enquiry.id);
      localStorage.setItem("currentSurveyData", JSON.stringify(surveyData || {}));

      navigate(`/survey/${enquiry.id}/survey-details`, {
        state: {
          customerData: {
            fullName: enquiry.fullName,
            phoneNumber: enquiry.phoneNumber,
            email: enquiry.email,
            surveyDate: enquiry.survey_date ? new Date(enquiry.survey_date) : null,
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

  const onRescheduleSubmit = (data) => {
    if (!data.surveyDate) return rescheduleSurveyForm.setError("surveyDate", { message: "Required" });
    setRescheduleSurveyData(data);
    setIsRescheduleSurveyOpen(false);
    setIsRescheduleSurveyConfirmOpen(true);
  };

  const confirmReschedule = async () => {
    if (!hasPermission("scheduled_surveys", "edit")) return alert("Permission denied");
    setIsReschedulingSurvey(true);
    try {
      const res = await apiClient.post(`/contacts/enquiries/${selectedEnquiry.id}/schedule/`, {
        survey_date: rescheduleSurveyData.surveyDate.toISOString(),
      });
      const updated = enquiries.map((e) => (e.id === selectedEnquiry.id ? res.data : e));
      setEnquiries(updated);
      setFilteredEnquiries(updated);
      setMessage("Survey rescheduled successfully");
      setIsRescheduleSurveyConfirmOpen(false);
    } catch (err) {
      setError("Failed to reschedule");
    } finally {
      setIsReschedulingSurvey(false);
    }
  };

  const onCancelSubmit = (data) => {
    setCancelSurveyData(data);
    setIsCancelSurveyOpen(false);
    setIsCancelSurveyConfirmOpen(true);
  };

  const confirmCancel = async () => {
    if (!hasPermission("scheduled_surveys", "edit")) return alert("Permission denied");
    setIsCancelingSurvey(true);
    try {
      const res = await apiClient.post(`/contacts/enquiries/${selectedEnquiry.id}/cancel-survey/`, { reason: cancelSurveyData.reason });
      const updated = enquiries.map((e) => (e.id === selectedEnquiry.id ? res.data : e));
      setEnquiries(updated);
      setFilteredEnquiries(updated);
      setMessage("Survey cancelled successfully");
      setIsCancelSurveyConfirmOpen(false);
    } catch (err) {
      setError("Failed to cancel");
    } finally {
      setIsCancelingSurvey(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Scheduled Surveys"
        subtitle="Manage and execute pending survey requests"
        extra={
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-50">
            <FiCalendar className="animate-pulse" />
            Calendar View Active
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
            placeholder="Search by name, phone, email, or status..."
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
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <FormProvider {...filterForm}>
              <form onSubmit={filterForm.handleSubmit(handleFilter)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="From Date" name="fromDate" type="date" />
                <InputField label="To Date" name="toDate" type="date" />
                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
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
            <FiCalendar className="text-gray-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">No scheduled surveys found</h3>
          <p className="text-gray-600 text-sm mt-1">Refine your dates or search query</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="hidden lg:block bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Survey Info</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Service</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Assigned To</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentEnquiries.map((enquiry) => {
                  const status = enquiry.survey_status || "pending";
                  return (
                    <tr key={enquiry.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                            <FiCalendar className="w-4 h-4 text-[#4c7085]" />
                            {new Date(enquiry.survey_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-600 flex items-center gap-2">
                            <FiClock className="w-4 h-4 text-gray-600" />
                            {new Date(enquiry.survey_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium text-sm">
                            {enquiry.fullName?.charAt(0) || "C"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{enquiry.fullName}</p>
                            <p className="text-xs text-gray-600">{enquiry.phoneNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">
                          {serviceOptions.find(o => o.value === enquiry.serviceType)?.label || enquiry.serviceType}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-medium border ${getStatusStyles(status)}`}>
                          {getSurveyStatusDisplay(enquiry)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm text-gray-600 font-medium">{enquiry.assigned_user_email || "Unassigned"}</p>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {(!enquiry.survey_status || enquiry.survey_status === 'cancelled') && hasPermission("quotation", "add") && (
                            <button
                              onClick={() => navigate(`/quotation-create/enquiry/${enquiry.id}`)}
                              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-medium rounded-xl shadow-sm transition-all"
                            >
                              Create Quote
                            </button>
                          )}
                          {!isSurveyFinished(enquiry) && (hasPermission("scheduled_surveys", "add") || hasPermission("scheduled_surveys", "edit")) && (
                            <>
                              <button
                                onClick={() => startSurvey(enquiry)}
                                disabled={isStartingSurvey}
                                className={`px-4 py-2 rounded-xl text-xs font-medium text-white transition-all shadow-sm ${status === 'in_progress' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'}`}
                              >
                                {status === 'in_progress' ? (isStartingSurvey && startingSurveyId === enquiry.id ? 'Resuming...' : 'Continue') : (isStartingSurvey && startingSurveyId === enquiry.id ? 'Starting...' : 'Start')}
                              </button>
                              {hasPermission("scheduled_surveys", "edit") && (
                                <>
                                  <button
                                    onClick={() => openRescheduleSurveyModal(enquiry)}
                                    className="w-9 h-9 flex items-center justify-center text-[#4c7085] bg-slate-50 hover:bg-[#4c7085] hover:text-white rounded-xl transition-all"
                                    title="Reschedule"
                                  >
                                    <FiRotateCw className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => openCancelSurveyModal(enquiry)}
                                    className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                    title="Cancel"
                                  >
                                    <FiXCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          {isSurveyFinished(enquiry) && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 font-medium bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                              <FiCheckCircle className="text-gray-300" />
                              Task Finished
                            </div>
                          )}
                          <button onClick={() => openPhoneModal(enquiry)} className="w-9 h-9 flex items-center justify-center text-green-500 bg-green-50 hover:bg-green-500 hover:text-white rounded-xl transition-all">
                            <IoLogoWhatsapp className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Desktop */}
            <div className="flex items-center justify-between p-6 border-t border-gray-50">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium text-gray-800">{indexOfFirstItem + 1}</span> to <span className="font-medium text-gray-800">{Math.min(indexOfLastItem, filteredEnquiries.length)}</span> of <span className="font-medium text-gray-800">{filteredEnquiries.length}</span> surveys
              </p>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border border-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-30 transition-colors">Previous</button>
                <div className="flex items-center px-4 text-sm font-medium text-[#4c7085] bg-[#4c7085]/10 rounded-xl">{currentPage} / {totalPages || 1}</div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-4 py-2 border border-gray-100 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-30 transition-colors">Next</button>
              </div>
            </div>
          </div>

          <div className="lg:hidden space-y-4">
            {currentEnquiries.map((enquiry) => {
              const isOpen = expandedEnquiries.has(enquiry.id);
              const status = enquiry.survey_status || "pending";
              return (
                <div key={enquiry.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all">
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleEnquiryExpand(enquiry.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium">
                        {enquiry.fullName?.charAt(0) || "C"}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm">{enquiry.fullName}</h4>
                        <p className="text-[10px] text-gray-600 font-medium">{new Date(enquiry.survey_date).toLocaleDateString()}</p>
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
                              <p className="text-xs font-medium text-blue-600 mt-0.5">{serviceOptions.find(o => o.value === enquiry.serviceType)?.label || enquiry.serviceType}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Status</p>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-medium border mt-1 ${getStatusStyles(status)}`}>{getSurveyStatusDisplay(enquiry)}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {(!enquiry.survey_status || enquiry.survey_status === 'cancelled') && hasPermission("quotation", "add") && (
                              <button
                                onClick={() => navigate(`/quotation-create/enquiry/${enquiry.id}`)}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-xl text-[11px] font-medium shadow-sm"
                              >
                                Create Quote
                              </button>
                            )}
                            {!isSurveyFinished(enquiry) && (hasPermission("scheduled_surveys", "add") || hasPermission("scheduled_surveys", "edit")) && (
                              <>
                                <button onClick={() => startSurvey(enquiry)} className={`flex-1 ${status === 'in_progress' ? 'bg-blue-500' : 'bg-green-500'} text-white py-2.5 rounded-xl text-[11px] font-medium shadow-sm transition-transform active:scale-95`}>
                                  {status === 'in_progress' ? 'Continue Survey' : 'Start Survey'}
                                </button>
                                {hasPermission("scheduled_surveys", "edit") && (
                                  <>
                                    <button onClick={() => openRescheduleSurveyModal(enquiry)} className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-[#4c7085] shadow-sm"><FiRotateCw /></button>
                                    <button onClick={() => openCancelSurveyModal(enquiry)} className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-red-500 shadow-sm"><FiXCircle /></button>
                                  </>
                                )}
                              </>
                            )}
                            <button onClick={() => openPhoneModal(enquiry)} className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-sm"><IoLogoWhatsapp className="w-5 h-5" /></button>
                          </div>
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

      {/* Modals */}
      <AnimatePresence>
        <Modal
          isOpen={isRescheduleSurveyOpen}
          onClose={() => setIsRescheduleSurveyOpen(false)}
          title="Reschedule Survey"
          footer={
            <>
              <button onClick={() => setIsRescheduleSurveyOpen(false)} className="btn-secondary !bg-transparent !border-none">Cancel</button>
              <button type="submit" form="reschedule-form" className="btn-primary">Apply Update</button>
            </>
          }
        >
          <FormProvider {...rescheduleSurveyForm}>
            <form id="reschedule-form" onSubmit={rescheduleSurveyForm.handleSubmit(onRescheduleSubmit)} className="space-y-4">
              <div className="flex flex-col">
                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">New Date and Time <span className="text-red-500">*</span></label>
                <DatePicker
                  selected={rescheduleSurveyForm.watch("surveyDate")}
                  onChange={(date) => rescheduleSurveyForm.setValue("surveyDate", date, { shouldValidate: true })}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd HH:mm"
                  minDate={new Date()}
                  className="input-style w-full"
                  placeholderText="Select new date/time"
                  wrapperClassName="w-full"
                />
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
              <button onClick={() => setIsRescheduleSurveyConfirmOpen(false)} className="btn-secondary !bg-transparent !border-none">Cancel</button>
              <button onClick={confirmReschedule} className="btn-primary" disabled={isReschedulingSurvey}>{isReschedulingSurvey ? "Updating..." : "Confirm"}</button>
            </>
          }
        >
          <p className="text-sm font-medium text-gray-600">Are you sure you want to reschedule this survey to {rescheduleSurveyData?.surveyDate?.toLocaleString()}?</p>
        </Modal>

        <Modal
          isOpen={isCancelSurveyOpen}
          onClose={() => setIsCancelSurveyOpen(false)}
          title="Cancel Survey"
          footer={
            <>
              <button onClick={() => setIsCancelSurveyOpen(false)} className="btn-secondary !bg-transparent !border-none">Close</button>
              <button type="submit" form="cancel-form" className="btn-primary !bg-red-500 hover:!bg-red-600">Proceed Cancellation</button>
            </>
          }
        >
          <FormProvider {...cancelSurveyForm}>
            <form id="cancel-form" onSubmit={cancelSurveyForm.handleSubmit(onCancelSubmit)} className="space-y-4">
              <InputField label="Reason for Cancellation" name="reason" type="textarea" placeholder="Explain why the survey is being cancelled..." rules={{ required: "Reason is required" }} />
            </form>
          </FormProvider>
        </Modal>

        <Modal
          isOpen={isCancelSurveyConfirmOpen}
          onClose={() => setIsCancelSurveyConfirmOpen(false)}
          title="Confirm Cancellation"
          footer={
            <>
              <button onClick={() => setIsCancelSurveyConfirmOpen(false)} className="btn-secondary !bg-transparent !border-none">No, Go Back</button>
              <button onClick={confirmCancel} className="btn-primary !bg-red-500 hover:!bg-red-600" disabled={isCancelingSurvey}>{isCancelingSurvey ? "Processing..." : "Yes, Cancel"}</button>
            </>
          }
        >
          <p className="text-sm font-medium text-gray-600">This will perpetually mark the survey for {selectedEnquiry?.fullName} as cancelled. Continue?</p>
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
      </AnimatePresence>
    </div>
  );
};

export default ScheduledSurveys;