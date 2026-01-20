/* src/pages/Bookings/BookingDetailView.jsx */
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFileText, FiTrash2, FiEdit3, FiSend } from "react-icons/fi";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import BookingConfirmation from "../../components/Templates/BookingConfirmation";
import PageHeader from "../../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";

import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";

const BookingDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const [booking, setBooking] = useState(null);
    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const printRef = useRef();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError("");

            let bookingData = null;

            try {
                const bookingRes = await apiClient.get(`/bookings/${id}/`);
                bookingData = bookingRes.data;
                setBooking(bookingData);
            } catch (bookingErr) {
                console.error("Failed to fetch booking:", bookingErr);
                setError("Failed to load booking details.");
            }

            if (bookingData && bookingData.quotation) {
                try {
                    const quotRes = await apiClient.get(`/quotation-create/${bookingData.quotation}/`);
                    setQuotation(quotRes.data);
                } catch (quotErr) {
                    console.warn("Quotation fetch failed (non-critical):", quotErr.response?.data || quotErr.message);
                    setQuotation(null);
                }
            }

            setLoading(false);
        };

        fetchData();
    }, [id]);

    const handleSharePdfToSupervisor = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await apiClient.post(`/bookings/${id}/share-supervisor-whatsapp/`);
            const { whatsapp_url } = response.data;
            window.open(whatsapp_url, "_blank");
            setSuccessMessage("PDF shared successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            const errorMsg = err.response?.data?.error || "Failed to share PDF.";
            setError(errorMsg);
            setTimeout(() => setError(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBooking = async () => {
        if (!hasPermission("booking", "delete")) {
            alert("Permission denied");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this booking? Material stock will be restored.")) return;
        try {
            await apiClient.delete(`/bookings/${id}/`);
            setSuccessMessage("Booking deleted successfully!");
            setTimeout(() => navigate("/booking-list"), 1500);
        } catch (err) {
            setError("Failed to delete booking.");
            setTimeout(() => setError(""), 3000);
        }
    };

    const handleEdit = () => {
        navigate(`/booking-form/${id}`);
    };

    if (loading) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;
    if (error && !booking) return <div className="text-center text-red-600 p-5 font-medium">{error}</div>;
    if (!booking) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <PageHeader
                title="Booking Details"
                subtitle={`Booking ID: ${booking.booking_id || "—"} • Move Date: ${booking.move_date || "Not specified"}`}
                extra={
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={handleSharePdfToSupervisor}
                            disabled={loading || !booking?.id}
                            className={`btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700 ${loading ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >
                            <FiSend className="w-4 h-4" />
                            <span>Share to Supervisor</span>
                        </button>
                        {hasPermission("booking", "edit") && (
                            <button
                                onClick={handleEdit}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <FiEdit3 className="w-4 h-4" />
                                <span>Edit</span>
                            </button>
                        )}
                        {hasPermission("booking", "delete") && (
                            <button
                                onClick={handleDeleteBooking}
                                className="btn-primary flex items-center gap-2 bg-red-600 hover:bg-red-700"
                            >
                                <FiTrash2 className="w-4 h-4" />
                                <span>Delete</span>
                            </button>
                        )}
                        <button
                            onClick={() => navigate(-1)}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <FiArrowLeft className="w-4 h-4" />
                            <span>Back</span>
                        </button>
                    </div>
                }
            />

            {/* Messages */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 text-center font-medium"
                    >
                        {successMessage}
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-center font-medium"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-6">
                {/* Basic Information & Client Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-lg font-medium text-gray-800 mb-4">Basic Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Move Date</label>
                                <p className="text-base font-medium text-gray-800">{booking.move_date || "Not specified"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Start Time</label>
                                    <p className="text-base font-medium text-gray-800">{booking.start_time?.slice(0, 5) || "Not specified"}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">End Time</label>
                                    <p className="text-base font-medium text-gray-800">{booking.estimated_end_time?.slice(0, 5) || "Not specified"}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Supervisor</label>
                                <p className="text-base font-medium text-gray-800">{booking.supervisor_name || "Not assigned"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Client & Move Details */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-lg font-medium text-gray-800 mb-4">Client & Move Details</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                                <div>
                                    <span className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-1">Client Name</span>
                                    <p className="text-sm font-medium text-gray-800">{booking.client_name || quotation?.full_name || "N/A"}</p>
                                </div>
                                <div>
                                    <span className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-1">Move Type</span>
                                    <p className="text-sm font-medium text-indigo-600">{booking.move_type || quotation?.service_type || "N/A"}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Internal Notes</label>
                                <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-2xl border border-gray-200 min-h-[100px]">
                                    {booking.notes || "No notes added"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assigned Resources */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-medium text-gray-800 mb-6">Assigned Resources</h2>
                    <div className="space-y-8">
                        {/* Assigned Staff */}
                        <div>
                            <h3 className="text-base font-medium text-gray-700 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#4c7085] rounded-full"></span>
                                Assigned Staff (Manpower)
                            </h3>
                            {booking.assigned_staff?.length > 0 || booking.labours?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {(booking.assigned_staff || booking.labours || []).map((staff, idx) => (
                                        <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                            <p className="font-medium text-gray-800">{staff.name || staff.staff_member_name || "Unnamed Staff"}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {staff.employer || "Almas"} • {staff.category || "General"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl text-center">No staff assigned yet</p>
                            )}
                        </div>

                        {/* Trucks */}
                        <div>
                            <h3 className="text-base font-medium text-gray-700 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#4c7085] rounded-full"></span>
                                Assigned Trucks
                            </h3>
                            {booking.trucks?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {booking.trucks.map((truck, idx) => (
                                        <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                            <p className="font-medium text-gray-800">{truck.truck_type_name || truck.truck_type || "Unknown Truck"}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Quantity: {truck.quantity || 1}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl text-center">No trucks assigned</p>
                            )}
                        </div>

                        {/* Materials */}
                        <div>
                            <h3 className="text-base font-medium text-gray-700 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#4c7085] rounded-full"></span>
                                Assigned Materials
                            </h3>
                            {booking.materials?.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {booking.materials.map((material, idx) => (
                                        <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                            <p className="font-medium text-gray-800">{material.material_name || material.material || "Unknown Material"}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Quantity: {material.quantity || 1}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl text-center">No materials assigned</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden PDF */}
            <div style={{ display: "none" }}>
                <BookingConfirmation
                    ref={printRef}
                    booking={booking}
                    clientName={booking?.client_name || quotation?.full_name || "Customer"}
                    moveType={booking?.move_type || quotation?.service_type || "Not specified"}
                    contactNumber={booking?.contact_number || quotation?.phone_number || "Not provided"}
                    origin={booking?.origin_location || quotation?.survey?.origin_address || "Not specified"}
                    destination={booking?.destination_location || quotation?.survey?.destination_addresses?.[0]?.city || "Not specified"}
                />
            </div>
        </div>
    );
};

export default BookingDetailView;