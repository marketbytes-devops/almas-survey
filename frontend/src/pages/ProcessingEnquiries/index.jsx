import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPhoneAlt, FaWhatsapp, FaEnvelope } from "react-icons/fa";
import Modal from "../../components/Modal";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const rowVariants = {
  hover: { backgroundColor: "#f3f4f6" },
  rest: { backgroundColor: "#ffffff" },
};

const ProcessingEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  const serviceOptions = [
    { value: "localMove", label: "Local Move" },
    { value: "internationalMove", label: "International Move" },
    { value: "carExport", label: "Car Import and Export" },
    { value: "storageServices", label: "Storage Services" },
    { value: "logistics", label: "Logistics" },
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
      }
    };

    const fetchEnquiries = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/contacts/enquiries/", {
          params: {
            assigned_user_email: "not_null",
            contact_status: "Under Processing",
          },
        });
        // Sort by created_at in descending order
        const sortedEnquiries = response.data.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setEnquiries(sortedEnquiries);
      } catch (error) {
        setError("Failed to fetch processing enquiries. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndPermissions();
    fetchEnquiries();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const openPhoneModal = (enquiry) => {
    if (!hasPermission("processing_enquiries", "view")) {
      setError("You do not have permission to view this enquiry.");
      return;
    }
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
      {enquiries.length === 0 ? (
        <div className="text-center text-[#2d4a5e] text-sm sm:text-base p-5 bg-white shadow-sm rounded-lg">
          No Processing Enquiries Found
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enquiries.map((enquiry, index) => (
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
                      {enquiry.assigned_user_email || "-"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Cards for Mobile */}
          <div className="md:hidden space-y-4">
            {enquiries.map((enquiry, index) => (
              <motion.div
                key={enquiry.id}
                className="rounded-lg p-5 bg-white shadow-sm"
                variants={rowVariants}
                initial="rest"
                whileHover="hover"
              >
                <div className="space-y-2 text-[#2d4a5e] text-sm sm:text-base">
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
                  <p><strong>Assigned To:</strong> {enquiry.assigned_user_email || ""}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </>
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
      </AnimatePresence>
    </div>
  );
};

export default ProcessingEnquiries;