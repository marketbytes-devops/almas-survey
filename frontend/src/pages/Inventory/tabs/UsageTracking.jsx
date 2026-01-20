import { useState, useEffect } from "react";
import { FiTrendingDown } from "react-icons/fi";
import apiClient from "../../../api/apiClient";
import Loading from "../../../components/Loading";

const UsageTracking = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await apiClient.get("/inventory-logs/");
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

    if (loading) return <div className="flex justify-center py-12"><Loading /></div>;

    return (
        <div className="space-y-6">
            <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center gap-4">
                <div className="p-3 bg-red-600 text-white rounded-xl shadow-sm">
                    <FiTrendingDown className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-base font-medium text-red-700">Material Usage Tracking</p>
                    <p className="text-gray-600 text-sm mt-1">Review all materials consumed during confirmed bookings.</p>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Material</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-center">Quantity Used</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Booking ID</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(log.date).toLocaleString()}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800">{log.material_name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                -{Math.abs(log.quantity)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-medium border border-blue-100">
                                                {log.reference_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 italic">{log.notes || "—"}</td>
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
        </div>
    );
};

export default UsageTracking;
