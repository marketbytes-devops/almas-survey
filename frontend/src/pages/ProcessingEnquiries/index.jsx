import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPhone,
  FiMail,
  FiSearch,
  FiClock,
  FiChevronDown,
  FiChevronUp,
  FiClipboard
} from "react-icons/fi";
import { IoLogoWhatsapp } from "react-icons/io";
import Modal from "../../components/Modal";
import PageHeader from "../../components/PageHeader";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";

const ProcessingEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { hasPermission, isSuperadmin, isLoadingPermissions } = usePermissions();
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEnquiries, setExpandedEnquiries] = useState(new Set());

  const serviceOptions = [
    { value: "localMove", label: "Local Move" },
    { value: "internationalMove", label: "International Move" },
    { value: "carExport", label: "Car Import and Export" },
    { value: "storageServices", label: "Storage Services" },
    { value: "logistics", label: "Logistics" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {

        const enquiryResponse = await apiClient.get("/contacts/enquiries/", {
          params: {
            assigned_user_email: "not_null",
            contact_status: "Under Processing",
          },
        });

        const sortedEnquiries = enquiryResponse.data.sort((a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
        );
        setEnquiries(sortedEnquiries);
        setFilteredEnquiries(sortedEnquiries);
      } catch (err) {
        setError("Failed to fetch processing enquiries.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEnquiries(enquiries);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = enquiries.filter(e =>
        (e.fullName || "").toLowerCase().includes(lowerQuery) ||
        (e.phoneNumber || "").toLowerCase().includes(lowerQuery) ||
        (e.email || "").toLowerCase().includes(lowerQuery) ||
        (e.assigned_user_email || "").toLowerCase().includes(lowerQuery)
      );
      setFilteredEnquiries(filtered);
    }
  }, [searchQuery, enquiries]);

  const toggleEnquiryExpand = (id) => {
    setExpandedEnquiries(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openPhoneModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsPhoneModalOpen(true);
  };

  if (isLoadingPermissions || isLoading) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Processing Enquiries"
        subtitle="Track and manage enquiries currently under processing"
        extra={
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
            <FiClock className="animate-spin-slow" />
            In Progress
          </div>
        }
      />

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-between">
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 z-10 pointer-events-none">
          <FiSearch className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search by client name, email, phone or assigned staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-style w-full !pl-12 h-[56px] rounded-2xl border-gray-100 shadow-sm"
        />
      </div>

      {filteredEnquiries.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiClipboard className="text-gray-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">No processing enquiries</h3>
          <p className="text-gray-600 text-sm mt-1">Refine your search or check back later</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Client</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Service</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Assigned To</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Received Date</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEnquiries.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-5">
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
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">{item.phoneNumber}</p>
                        <p className="text-xs text-gray-600">{item.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">
                        {serviceOptions.find(o => o.value === item.serviceType)?.label || item.serviceType}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-sm text-gray-600 font-medium">{item.assigned_user_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-gray-600">{new Date(item.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => openPhoneModal(item)}
                        className="w-10 h-10 inline-flex items-center justify-center text-green-500 bg-green-50 hover:bg-green-500 hover:text-white rounded-xl transition-all shadow-sm"
                      >
                        <IoLogoWhatsapp className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredEnquiries.map((item) => {
              const isOpen = expandedEnquiries.has(item.id);
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all">
                  <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleEnquiryExpand(item.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium">{item.fullName?.charAt(0) || "C"}</div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm">{item.fullName}</h4>
                        <p className="text-[10px] text-gray-600 font-medium">{item.assigned_user_email}</p>
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
                              <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Date</p>
                              <p className="text-xs font-medium text-gray-600 mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Contact</p>
                            <p className="text-xs text-gray-700 mt-1 flex items-center gap-2"><FiPhone className="text-gray-300" /> {item.phoneNumber}</p>
                            <p className="text-xs text-gray-700 mt-1 flex items-center gap-2"><FiMail className="text-gray-300" /> {item.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openPhoneModal(item)}
                              className="w-full bg-green-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-medium text-sm shadow-sm transition-transform"
                            >
                              <IoLogoWhatsapp className="w-5 h-5" /> Chat on WhatsApp
                            </button>
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

      {/* WhatsApp Modal */}
      <AnimatePresence>
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

export default ProcessingEnquiries;