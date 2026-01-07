/* src/pages/Inventory/tabs/UsageTracking.jsx */
import React, { useState, useEffect } from "react";
import { FaArrowTrendDown } from "react-icons/fa6";
import apiClient from "../../../api/apiClient";
import Loading from "../../../components/Loading";

const UsageTracking = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await apiClient.get("/inventory-logs/");
                // Filter for usage logs
                const usageLogs = response.data.filter(l => l.transaction_type === "booking_use");
                setLogs(usageLogs);
            } catch (err) {
                console.error("Failed to fetch logs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return <Loading />;

    return (
        <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex items-center gap-4">
                <div className="p-4 bg-red-600 text-white rounded-lg">
                    <FaArrowTrendDown className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-red-700 font-medium">Material Usage Tracking</p>
                    <p className="text-gray-600 text-sm">Review all materials consumed during confirmed bookings.</p>
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                        <tr>
                            <th className="px-6 py-4">Date & Time</th>
                            <th className="px-6 py-4">Material</th>
                            <th className="px-6 py-4 text-center">Quantity Used</th>
                            <th className="px-6 py-4">Booking ID</th>
                            <th className="px-6 py-4">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.length > 0 ? (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">{new Date(log.date).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{log.material_name}</td>
                                    <td className="px-6 py-4 text-center font-bold text-red-600">
                                        {Math.abs(log.quantity)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                                            {log.reference_id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{log.notes}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                                    No usage records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsageTracking;
