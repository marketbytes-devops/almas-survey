/* src/pages/Bookings/BookingList.jsx */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiEye, FiEdit3, FiTrash2, FiUsers } from "react-icons/fi";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";

const BookingList = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [hoveredBooking, setHoveredBooking] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

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
            b.move_type?.toLowerCase().includes(query) ||
            b.contact_number?.toLowerCase().includes(query) ||
            b.origin_location?.toLowerCase().includes(query)
        );
        setFilteredBookings(filtered);
    }, [searchQuery, bookings]);

    if (loading) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;

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
                        className="input-style pl-12 w-full"
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
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Booking ID</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Move Date</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Client</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Move Type</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Contact</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Location</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Supervisor</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center whitespace-nowrap">Staff</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((b) => (
                                        <tr key={b.id} className="hover:bg-gray-50/30 transition-colors group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="font-medium text-gray-800">{b.booking_id}</div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">{b.move_date || "—"}</div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="font-medium text-gray-800">{b.client_name}</div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100 inline-block">
                                                    {b.move_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">{b.contact_number}</div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">
                                                    {b.origin_location} {b.destination_location ? `→ ${b.destination_location}` : ""}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">{b.supervisor_name || "Unassigned"}</div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-center">
                                                <div
                                                    className="relative inline-block"
                                                    onMouseEnter={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setHoveredBooking({
                                                            staff: b.labours || [],
                                                            pos: {
                                                                top: rect.bottom + window.scrollY + 10,
                                                                left: rect.left + rect.width / 2 + window.scrollX
                                                            }
                                                        });
                                                    }}
                                                    onMouseLeave={() => setHoveredBooking(null)}
                                                >
                                                    <FiUsers
                                                        className={`w-5 h-5 mx-auto cursor-pointer transition-colors flex-shrink-0 ${b.labours && b.labours.length > 0
                                                            ? "text-[#4c7085]"
                                                            : "text-gray-300"
                                                            }`}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/booking-detail/${b.id}`)}
                                                        className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all flex-shrink-0"
                                                        title="View"
                                                    >
                                                        <FiEye className="w-4.5 h-4.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/booking-form/${b.id}`)}
                                                        className="w-9 h-9 flex items-center justify-center text-gray-600 bg-slate-50 hover:bg-gray-800 hover:text-white rounded-xl transition-all flex-shrink-0"
                                                        title="Edit"
                                                    >
                                                        <FiEdit3 className="w-4.5 h-4.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(b.id)}
                                                        className="w-9 h-9 flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all flex-shrink-0"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 className="w-4.5 h-4.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-10 text-center text-gray-600">
                                            No bookings found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Grid */}
                <div className="lg:hidden space-y-4">
                    {filteredBookings.length > 0 ? (
                        filteredBookings.map((b) => (
                            <div key={b.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="font-medium text-gray-800 text-base">{b.booking_id}</div>
                                        <div className="text-sm text-gray-600 mt-1">{b.move_date || "—"}</div>
                                    </div>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">
                                        {b.move_type}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-600 min-w-[80px]">Client:</span>
                                        <span className="text-gray-800 font-medium">{b.client_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-600 min-w-[80px]">Contact:</span>
                                        <span className="text-gray-800">{b.contact_number}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-600 min-w-[80px]">Location:</span>
                                        <span className="text-gray-800">
                                            {b.origin_location} {b.destination_location ? `→ ${b.destination_location}` : ""}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-600 min-w-[80px]">Supervisor:</span>
                                        <span className="text-gray-800">{b.supervisor_name || "Unassigned"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-600 min-w-[80px]">Staff:</span>
                                        <span className="text-gray-800">{b.labours?.length || 0} assigned</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-3 border-t border-gray-200">
                                    <button
                                        onClick={() => navigate(`/booking-detail/${b.id}`)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-sm font-medium"
                                    >
                                        <FiEye className="w-4 h-4" /> View
                                    </button>
                                    <button
                                        onClick={() => navigate(`/booking-form/${b.id}`)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm font-medium"
                                    >
                                        <FiEdit3 className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(b.id)}
                                        className="flex items-center justify-center px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-600">
                            No bookings found.
                        </div>
                    )}
                </div>
            </div>

            {/* Staff Hover Tooltip */}
            {hoveredBooking && createPortal(
                <div
                    className="fixed pointer-events-none z-[9999]"
                    style={{
                        top: hoveredBooking.pos.top,
                        left: hoveredBooking.pos.left,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="w-56 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-200">
                        <div className="bg-slate-800 px-4 py-3">
                            <p className="text-[10px] uppercase tracking-widest font-medium text-slate-400 mb-1">Assigned Resources</p>
                            <p className="text-sm font-medium text-white flex items-center gap-2">
                                <FiUsers className="text-[#6b8ca3] w-4 h-4" />
                                Staff / Manpower
                            </p>
                        </div>
                        <div className="p-4 max-h-48 overflow-y-auto">
                            {hoveredBooking.staff.length > 0 ? (
                                <ul className="space-y-2">
                                    {hoveredBooking.staff.map((l, idx) => (
                                        <li key={idx} className="flex items-center gap-2.5 text-sm text-gray-700">
                                            <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-600 border border-blue-100">
                                                {idx + 1}
                                            </div>
                                            <span className="truncate font-medium">
                                                {l.staff_member_name || "Unnamed Staff"}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-4 text-gray-600">
                                    <FiUsers className="w-6 h-6 mb-2 opacity-20" />
                                    <p className="text-xs italic">No staff assigned</p>
                                </div>
                            )}
                        </div>
                        {/* Arrow */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-b-white"></div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BookingList;