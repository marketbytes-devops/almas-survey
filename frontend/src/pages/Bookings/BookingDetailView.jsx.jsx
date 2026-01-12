/* src/pages/Bookings/BookingDetailView.jsx */
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaWhatsapp, FaFilePdf, FaTrashAlt, FaEdit } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import BookingConfirmation from "../../components/Templates/BookingConfirmation";

const BookingDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const printRef = useRef();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(""); // Clear previous errors

            let bookingData = null;

            try {
                // Fetch booking
                const bookingRes = await apiClient.get(`/bookings/${id}/`);
                bookingData = bookingRes.data;
                setBooking(bookingData);
            } catch (bookingErr) {
                console.error("Failed to fetch booking:", bookingErr);
                setError("Failed to load booking details.");
            }

            // Fetch quotation if linked
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

    const handleShareWhatsApp = () => {
        const customerName = booking?.client_name || quotation?.full_name || "Customer";
        const bookingId = booking?.booking_id || "TBA";
        const moveDate = booking?.move_date || "TBA";
        const phone = booking?.contact_number || quotation?.phone_number || "";

        const message = `Hello ${customerName}, your move with Almas Movers is confirmed for ${moveDate}. Booking ID: ${bookingId}. We look forward to serving you!`;

        const whatsappUrl = `https://wa.me/${phone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
    };

    const handleSharePdfToSupervisor = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await apiClient.post(`/bookings/${id}/share-supervisor-whatsapp/`);
            const { whatsapp_url } = response.data;
            window.open(whatsapp_url, "_blank");
        } catch (err) {
            const errorMsg = err.response?.data?.error || "Failed to share PDF.";
            alert(`❌ ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBooking = async () => {
        if (!window.confirm("Are you sure you want to delete this booking? Material stock will be restored.")) return;
        try {
            await apiClient.delete(`/bookings/${id}/`);
            alert("Booking deleted successfully!");
            navigate("/booking-list");
        } catch (err) {
            setError("Failed to delete booking.");
        }
    };

    const handleEdit = () => {
        navigate(`/booking-form/${id}`);
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
    if (error) return <div className="text-center text-red-600 p-5">{error}</div>;
    if (!booking) return null;

    const inputClasses = "w-full rounded-lg border border-[#6b8ca3]/50 bg-white px-4 py-3 text-sm text-[#4c7085] font-medium cursor-not-allowed";
    const labelClasses = "block text-sm font-medium text-[#4c7085] mb-2";
    const sectionClasses = "bg-[#4c7085]/5 border border-[#4c7085]/30 rounded-xl p-6 shadow-sm";

    return (
        <div className="bg-gray-100 min-h-screen rounded-lg">
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-8 flex justify-between items-center rounded-t-lg">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                    >
                        <FaArrowLeft className="w-5 h-5" />
                        <span className="font-medium text-sm">Back</span>
                    </button>
                    <h1 className="text-xl font-medium">
                        Booking Details: {booking.booking_id || "Loading..."}
                    </h1>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={handleShareWhatsApp}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition flex items-center gap-2"
                    >
                        <FaWhatsapp /> Share
                    </button>
                    <button
                        onClick={handleSharePdfToSupervisor}
                        disabled={loading || !booking?.id}
                        className={`flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition ${
                            loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        <FaFilePdf /> Share PDF to Supervisor
                    </button>
                    <button
                        onClick={handleEdit}
                        className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg font-bold transition flex items-center gap-2"
                    >
                        <FaEdit /> Edit Booking
                    </button>
                    <button
                        onClick={handleDeleteBooking}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition flex items-center gap-2"
                    >
                        <FaTrashAlt /> Delete Booking
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className={sectionClasses}>
                        <h2 className="text-lg font-medium text-[#4c7085] mb-6 border-b border-[#4c7085]/20 pb-2">Basic Information</h2>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className={labelClasses}>Move Date</label>
                                <p className="text-[#4c7085] font-medium">{booking.move_date || "Not specified"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClasses}>Start Time</label>
                                    <p className="text-[#4c7085] font-medium">{booking.start_time?.slice(0,5) || "Not specified"}</p>
                                </div>
                                <div>
                                    <label className={labelClasses}>Estimated End Time</label>
                                    <p className="text-[#4c7085] font-medium">{booking.estimated_end_time?.slice(0,5) || "Not specified"}</p>
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Supervisor</label>
                                <p className="text-[#4c7085] font-medium">{booking.supervisor_name || "Not assigned"}</p>
                            </div>
                        </div>
                    </section>

                    <section className={sectionClasses}>
                        <h2 className="text-lg font-medium text-[#4c7085] mb-6 border-b border-[#4c7085]/20 pb-2">Client & Move Details</h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-white/50 p-4 rounded-lg border border-[#4c7085]/10">
                                <div>
                                    <span className="text-xs font-bold text-[#4c7085] uppercase tracking-wider">Client Name</span>
                                    <p className="text-sm font-medium mt-1">{booking.client_name || quotation?.full_name || "N/A"}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-[#4c7085] uppercase tracking-wider">Move Type</span>
                                    <p className="text-sm font-medium text-indigo-700 mt-1">{booking.move_type || quotation?.service_type || "N/A"}</p>
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Internal Notes</label>
                                <p className="text-[#4c7085] font-medium whitespace-pre-wrap bg-white p-3 rounded-lg border">
                                    {booking.notes || "No notes added"}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Assigned Resources - Read-only display */}
                <section className={sectionClasses}>
                    <h2 className="text-lg font-medium text-[#4c7085] mb-6 border-b border-[#4c7085]/20 pb-2">Assigned Resources</h2>
                    <div className="space-y-8">
                        {/* Assigned Staff (Manpower) */}
                        <div>
                            <h3 className="font-medium mb-3 text-[#4c7085]">Assigned Staff (Manpower)</h3>
                            {booking.assigned_staff?.length > 0 || booking.labours?.length > 0 ? (
                                <div className="space-y-3">
                                    {(booking.assigned_staff || booking.labours || []).map((staff, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <p className="font-medium">{staff.name || staff.staff_member_name || "Unnamed Staff"}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {staff.employer || "Almas"} • {staff.category || "General"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600">No staff assigned yet</p>
                            )}
                        </div>

                        {/* Trucks */}
                        <div>
                            <h3 className="font-medium mb-3 text-[#4c7085]">Assigned Trucks</h3>
                            {booking.trucks?.length > 0 ? (
                                <div className="space-y-3">
                                    {booking.trucks.map((truck, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <p className="font-medium">{truck.truck_type_name || truck.truck_type || "Unknown Truck"}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Quantity: {truck.quantity || 1}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600">No trucks assigned</p>
                            )}
                        </div>

                        {/* Materials */}
                        <div>
                            <h3 className="font-medium mb-3 text-[#4c7085]">Assigned Materials</h3>
                            {booking.materials?.length > 0 ? (
                                <div className="space-y-3">
                                    {booking.materials.map((material, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <p className="font-medium">{material.material_name || material.material || "Unknown Material"}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Quantity: {material.quantity || 1}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600">No materials assigned</p>
                            )}
                        </div>
                    </div>
                </section>
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