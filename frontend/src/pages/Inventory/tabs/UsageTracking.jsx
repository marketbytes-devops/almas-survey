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
            <div className="bg-red-50 border border-red-100 p-4 md:p-6 rounded-2xl md:rounded-3xl flex items-center gap-4">
                <div className="p-2.5 md:p-3 bg-red-600 text-white rounded-lg md:rounded-xl shadow-sm">
                    <FiTrendingDown className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                    <p className="text-sm md:text-base font-medium text-red-700">Material Usage Tracking</p>
                    <p className="text-gray-600 text-[10px] md:text-sm mt-0.5 md:mt-1">Review all materials consumed during confirmed bookings.</p>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white border border-gray-100 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Material</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap text-center">Qty Used</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Booking ID</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{new Date(log.date).toLocaleString()}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">{log.material_name}</td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                -{Math.abs(log.quantity)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-medium border border-blue-100">
                                                {log.reference_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 italic">{log.notes || "—"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-600">
                                        No usage records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {logs.length > 0 ? (
                    logs.map((log) => (
                        <div key={log.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Material</p>
                                    <h3 className="font-semibold text-gray-900">{log.material_name}</h3>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100 uppercase tracking-wider">
                                    -{Math.abs(log.quantity)} USED
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1">Booking ID</p>
                                    <span className="inline-block bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-blue-100">
                                        {log.reference_id}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1">Date</p>
                                    <p className="text-[11px] font-medium text-gray-600">{new Date(log.date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {log.notes && (
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1">Notes</p>
                                    <p className="text-xs text-gray-600 italic">"{log.notes}"</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500">
                        No usage records found.
                    </div>
                )}
            </div>

        </div>
    );
};

export default UsageTracking;
