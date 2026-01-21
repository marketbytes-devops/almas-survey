/* src/pages/Bookings/BookingList.jsx */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiEye, FiEdit3, FiTrash2, FiUsers, FiSend } from "react-icons/fi";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";

const formatMoveType = (type) => {
    if (!type || type === "N/A") return "—";
    // Replace camelCase with spaces and capitalize
    const formatted = type.replace(/([A-Z])/g, ' $1').trim();
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const BookingList = () => {
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [openStaffDropdown, setOpenStaffDropdown] = useState(null); // { id, pos, booking }
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const handleScrollOrResize = () => setOpenStaffDropdown(null);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (openStaffDropdown && !e.target.closest('.staff-dropdown-portal') && !e.target.closest('.staff-trigger-btn')) {
                setOpenStaffDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openStaffDropdown]);

    const handleSendStaff = async (bookingId, staffId) => {
        try {
            const response = await apiClient.post(`/bookings/${bookingId}/share-staff-whatsapp/`, { staff_id: staffId });
            if (response.data.whatsapp_url) {
                window.open(response.data.whatsapp_url, '_blank');
            }
        } catch (err) {
            console.error("Failed to send WhatsApp to staff:", err);
            alert(err.response?.data?.error || "Failed to send WhatsApp.");
        }
    };


    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await apiClient.get("/bookings/");
                setBookings(response.data);
                setFilteredBookings(response.data);
            } catch (err) {
                console.error("Failed to fetch bookings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const handleDelete = async (id) => {
        if (!hasPermission("booking", "delete")) {
            alert("Permission denied");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this booking? This will restore material stock.")) return;
        try {
            await apiClient.delete(`/bookings/${id}/`);
            setBookings((prev) => prev.filter((b) => b.id !== id));
            setFilteredBookings((prev) => prev.filter((b) => b.id !== id));
            setSuccessMessage("Booking deleted successfully.");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Failed to delete booking:", err);
            alert("Failed to delete booking.");
        }
    };

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const filtered = bookings.filter((b) =>
            b.booking_id?.toLowerCase().includes(query) ||
            b.client_name?.toLowerCase().includes(query) ||
            formatMoveType(b.move_type).toLowerCase().includes(query) ||
            b.contact_number?.toLowerCase().includes(query) ||
            b.origin_location?.toLowerCase().includes(query) ||
            (b.origin_location && b.destination_location && `${b.origin_location} to ${b.destination_location}`.toLowerCase().includes(query))
        );
        setFilteredBookings(filtered);
    }, [searchQuery, bookings]);

    if (loading) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;

    const toggleStaffDropdown = (e, booking) => {
        if (openStaffDropdown?.id === booking.id) {
            setOpenStaffDropdown(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setOpenStaffDropdown({
                id: booking.id,
                booking: booking,
                pos: {
                    top: rect.bottom + window.scrollY,
                    left: rect.left + rect.width / 2 + window.scrollX
                }
            });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <PageHeader
                title="Booked Moves and Assign"
                subtitle={`Total Bookings: ${filteredBookings.length}`}
            />

            {/* Success Message */}
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
            </AnimatePresence>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                {/* Search */}
                <div className="relative mb-6">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by booking ID, client, move type, contact, or location..."
                        className="input-style w-full !pl-12 h-[56px] rounded-2xl border-gray-100 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Booking ID</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Move Date</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Client</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Move Type</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Contact</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Location</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Supervisor</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center">Staff</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((b) => (
                                        <tr key={b.id} className="hover:bg-gray-50/30 transition-colors group">
                                            <td className="px-6 py-5 whitespace-nowrap font-medium text-gray-800">{b.booking_id}</td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700">{b.move_date || "—"}</td>
                                            <td className="px-6 py-5 whitespace-nowrap font-medium text-gray-800">{b.client_name}</td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100 uppercase">
                                                    {formatMoveType(b.move_type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700">{b.contact_number}</td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700">
                                                {b.origin_location} {b.destination_location ? `→ ${b.destination_location}` : ""}
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-700">{b.supervisor_name || "—"}</td>
                                            <td className="px-6 py-5 whitespace-nowrap text-center">
                                                <button
                                                    onClick={(e) => toggleStaffDropdown(e, b)}
                                                    className={`staff-trigger-btn w-10 h-10 flex items-center justify-center rounded-xl transition-all ${b.labours?.length > 0 ? "text-[#4c7085] bg-blue-50/50 hover:bg-blue-100/50" : "text-gray-300 bg-gray-50/50"
                                                        }`}
                                                >
                                                    <FiUsers className="w-5 h-5" />
                                                </button>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => navigate(`/booking-detail/${b.id}`)} className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all"><FiEye /></button>
                                                    {hasPermission("booking", "edit") && <button onClick={() => navigate(`/booking-form/${b.id}`)} className="w-9 h-9 flex items-center justify-center text-gray-600 bg-slate-50 hover:bg-gray-800 hover:text-white rounded-xl transition-all"><FiEdit3 /></button>}
                                                    {hasPermission("booking", "delete") && <button onClick={() => handleDelete(b.id)} className="w-9 h-9 flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all"><FiTrash2 /></button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="9" className="px-6 py-10 text-center text-gray-600">No bookings found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Grid */}
                <div className="lg:hidden space-y-4">
                    {filteredBookings.map((b) => (
                        <div key={b.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="font-medium text-gray-800 text-base">{b.booking_id}</div>
                                    <div className="text-sm text-gray-600 mt-1">{b.move_date || "—"}</div>
                                </div>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100 uppercase">{formatMoveType(b.move_type)}</span>
                            </div>
                            <div className="space-y-2 mb-4">
                                <p className="text-sm"><span className="text-gray-600 w-20 inline-block">Client:</span> <span className="text-gray-800 font-medium">{b.client_name}</span></p>
                                <p className="text-sm"><span className="text-gray-600 w-20 inline-block">Contact:</span> <span className="text-gray-800">{b.contact_number}</span></p>
                                <p className="text-sm"><span className="text-gray-600 w-20 inline-block">Location:</span> <span className="text-gray-800">{b.origin_location} {b.destination_location ? `→ ${b.destination_location}` : ""}</span></p>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-600 w-20">Staff:</span>
                                    <button onClick={(e) => toggleStaffDropdown(e, b)} className="staff-trigger-btn text-[#4c7085] font-semibold flex items-center gap-1">
                                        {b.labours?.length || 0} assigned <FiUsers className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-3 border-t border-gray-200">
                                <button onClick={() => navigate(`/booking-detail/${b.id}`)} className="flex-1 bg-blue-50 text-blue-600 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"><FiEye /> View</button>
                                {hasPermission("booking", "edit") && <button onClick={() => navigate(`/booking-form/${b.id}`)} className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"><FiEdit3 /> Edit</button>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Staff Dropdown Portal - Rendered Outside everything to avoid clipping */}
            {openStaffDropdown && createPortal(
                <div
                    className="fixed z-[9999] staff-dropdown-portal pointer-events-none"
                    style={{
                        top: openStaffDropdown.pos.top,
                        left: openStaffDropdown.pos.left,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="pointer-events-auto mt-3">
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                        >
                            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest font-medium text-slate-400">Assigned Resources</p>
                                    <p className="text-sm font-semibold text-white">Staff / Manpower</p>
                                </div>
                            </div>
                            <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                                {openStaffDropdown.booking.labours?.map((labour, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-100">{idx + 1}</div>
                                            <span className="truncate text-sm font-medium text-gray-700">{labour.staff_member_name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleSendStaff(openStaffDropdown.id, labour.staff_member)}
                                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-[#25D366] hover:text-white rounded-lg transition-all"
                                        >
                                            <FiSend className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {(!openStaffDropdown.booking.labours || openStaffDropdown.booking.labours.length === 0) && (
                                    <div className="text-center py-6 text-gray-400 italic text-xs">No staff assigned</div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BookingList;