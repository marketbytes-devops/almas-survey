/* src/pages/Bookings/BookingList.jsx */
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaEye, FaEdit, FaTrash, FaUsers } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const BookingList = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [hoveredBooking, setHoveredBooking] = useState(null);

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
            alert("Booking deleted successfully.");
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

    if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;

    return (
        <div className="container mx-auto p-4">
            <div className="bg-[#4c7085] text-white py-4 px-6 rounded-t-xl flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-medium tracking-tight">Booked Moves and Assign</h1>
            </div>

            <div className="bg-white shadow-md rounded-b-lg p-6 space-y-4">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search bookings..."
                        className="input-style pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-3">Booking ID</th>
                                <th className="px-4 py-3">Move Date</th>
                                <th className="px-4 py-3">Client</th>
                                <th className="px-4 py-3">Move Type</th>
                                <th className="px-4 py-3">Contact</th>
                                <th className="px-4 py-3">Location</th>
                                <th className="px-4 py-3">Supervisor</th>
                                <th className="px-4 py-3 text-center">Staff</th>
                                <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 font-medium text-gray-900">{b.booking_id}</td>
                                        <td className="px-4 py-4">{b.move_date || "—"}</td>
                                        <td className="px-4 py-4">{b.client_name}</td>
                                        <td className="px-4 py-4">{b.move_type}</td>
                                        <td className="px-4 py-4">{b.contact_number}</td>
                                        <td className="px-4 py-4">
                                            {b.origin_location} {b.destination_location ? `→ ${b.destination_location}` : ""}
                                        </td>
                                        <td className="px-4 py-4">
                                            {b.supervisor_name || "Unassigned"}
                                        </td>
                                        <td className="px-4 py-4 text-center">
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
                                                <FaUsers
                                                    size={22}
                                                    className={`mx-auto cursor-pointer transition-colors duration-200 ${b.labours && b.labours.length > 0
                                                        ? "text-[#4c7085]"
                                                        : "text-gray-300"
                                                        }`}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-4">
                                                {/* View - Eye icon */}
                                                <button
                                                    onClick={() => navigate(`/booking-detail/${b.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                                                    title="View Details"
                                                >
                                                    <FaEye size={18} />
                                                </button>

                                                {/* Edit - Pencil icon */}
                                                <button
                                                    onClick={() => navigate(`/booking-form/${b.id}`)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-full transition"
                                                    title="Edit Booking"
                                                >
                                                    <FaEdit size={18} />
                                                </button>

                                                {/* Delete - Trash icon */}
                                                <button
                                                    onClick={() => handleDelete(b.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                                                    title="Delete Booking"
                                                >
                                                    <FaTrash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-4 py-10 text-center text-gray-400">
                                        No bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {hoveredBooking && createPortal(
                <div
                    className="fixed pointer-events-none z-[9999]"
                    style={{
                        top: hoveredBooking.pos.top,
                        left: hoveredBooking.pos.left,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="w-56 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                        <div className="bg-slate-800 px-3 py-3">
                            <p className="text-[10px] uppercase tracking-widest font-medium text-slate-400 mb-1">Assigned Resources</p>
                            <p className="text-[14px] font-medium text-white flex items-center gap-2">
                                <FaUsers className="text-[#6b8ca3]" size={14} />
                                Staff / Manpower
                            </p>
                        </div>
                        <div className="p-3 max-h-48 overflow-y-auto">
                            {hoveredBooking.staff.length > 0 ? (
                                <ul className="space-y-2">
                                    {hoveredBooking.staff.map((l, idx) => (
                                        <li key={idx} className="flex items-center gap-2.5 text-[13px] text-gray-700">
                                            <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-[11px] font-bold text-blue-600 border border-blue-100">
                                                {idx + 1}
                                            </div>
                                            <span className="truncate font-medium">
                                                {l.staff_member_name || "Unnamed Staff"}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                                    <FaUsers size={24} className="mb-2 opacity-10" />
                                    <p className="text-[12px] italic">No staff assigned</p>
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