/* src/pages/Bookings/BookingList.jsx */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaEye, FaEdit, FaTrash, FaFilePdf, FaUserPlus, FaCalendarAlt, FaTimesCircle } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const BookingList = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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
            alert("Booking deleted successfully.");
        } catch (err) {
            console.error("Failed to delete booking:", err);
            alert("Failed to delete booking.");
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
        try {
            await apiClient.patch(`/bookings/${id}/`, { status: newStatus });
            setBookings((prev) => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
            alert(`Booking status updated to ${newStatus}.`);
        } catch (err) {
            console.error("Failed to update status:", err);
            alert("Failed to update status.");
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
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-6 rounded-t-lg flex justify-between items-center">
                <h1 className="text-xl font-medium">Book Move and Assign</h1>
            </div>

            <div className="bg-white shadow-md rounded-b-lg p-6 space-y-4">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search bookings..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4c7085]"
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
                                <th className="px-4 py-3">Survey Report</th>
                                <th className="px-4 py-3">Supervisor</th>
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
                                            <button
                                                onClick={() => navigate(`/survey/${b.survey_id}/survey-summary`)}
                                                className="flex items-center gap-1 text-red-600 hover:underline font-medium"
                                            >
                                                <FaFilePdf /> Report
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <span>{b.supervisor_name || "Unassigned"}</span>
                                                <button
                                                    onClick={() => navigate(`/booking-detail/${b.id}?edit=true`)}
                                                    className="p-1 text-[#4c7085] hover:bg-gray-100 rounded"
                                                    title="Assign Manpower"
                                                >
                                                    <FaUserPlus />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/booking-detail/${b.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/booking-detail/${b.id}?edit=true`)}
                                                    className="p-2 text-[#4c7085] hover:bg-indigo-50 rounded"
                                                    title="Reschedule / Edit"
                                                >
                                                    <FaCalendarAlt />
                                                </button>
                                                {b.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(b.id, 'cancelled')}
                                                        className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                                                        title="Cancel Booking"
                                                    >
                                                        <FaTimesCircle />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(b.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
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
        </div>
    );
};

export default BookingList;
