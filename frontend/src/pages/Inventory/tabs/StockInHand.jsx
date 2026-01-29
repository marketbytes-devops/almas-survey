import { useState, useEffect } from "react";
import { FiBox, FiAlertTriangle } from "react-icons/fi";
import apiClient from "../../../api/apiClient";
import Loading from "../../../components/Loading";

const StockInHand = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const response = await apiClient.get("/materials/");
                setMaterials(response.data);
            } catch (err) {
                console.error("Failed to fetch materials:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMaterials();
    }, []);

    if (loading) return <div className="flex justify-center py-12"><Loading /></div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-[#4c7085]/5 border border-[#4c7085]/20 p-4 md:p-6 rounded-xl md:rounded-2xl flex items-center gap-4">
                    <div className="p-2.5 md:p-3 bg-[#4c7085] text-white rounded-lg md:rounded-xl shadow-sm">
                        <FiBox className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs font-medium text-[#4c7085] uppercase tracking-widest">Total Types</p>
                        <p className="text-xl md:text-2xl font-medium text-gray-800">{materials.length}</p>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 md:p-6 rounded-xl md:rounded-2xl flex items-center gap-4">
                    <div className="p-2.5 md:p-3 bg-yellow-500 text-white rounded-lg md:rounded-xl shadow-sm">
                        <FiAlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-xs font-medium text-yellow-700 uppercase tracking-widest">Low Stock</p>
                        <p className="text-xl md:text-2xl font-medium text-gray-800">
                            {materials.filter(m => parseFloat(m.stock_in_hand) < 10).length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block border border-gray-100 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Material Name</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap text-center">Stock Level</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Unit</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Last Price</th>
                                <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {materials.map((m) => {
                                const stock = parseFloat(m.stock_in_hand);
                                let statusColor = "bg-green-50 text-green-700 border-green-100";
                                let statusText = "In Stock";

                                if (stock <= 0) {
                                    statusColor = "bg-red-50 text-red-700 border-red-100";
                                    statusText = "Out of Stock";
                                } else if (stock < 10) {
                                    statusColor = "bg-yellow-50 text-yellow-700 border-yellow-100";
                                    statusText = "Low Stock";
                                }

                                return (
                                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">{m.name}</td>
                                        <td className="px-6 py-4 text-base font-medium text-gray-800 text-center">
                                            {m.stock_in_hand}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{m.unit || "—"}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{m.purchase_price ? `${m.purchase_price} QAR` : "—"}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor} whitespace-nowrap`}>
                                                {statusText}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {materials.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-600">
                                        No materials found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {materials.map((m) => {
                    const stock = parseFloat(m.stock_in_hand);
                    let statusColor = "bg-green-50 text-green-700 border-green-100";
                    let statusText = "In Stock";

                    if (stock <= 0) {
                        statusColor = "bg-red-50 text-red-700 border-red-100";
                        statusText = "Out of Stock";
                    } else if (stock < 10) {
                        statusColor = "bg-yellow-50 text-yellow-700 border-yellow-100";
                        statusText = "Low Stock";
                    }

                    return (
                        <div key={m.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{m.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1">Material ID: #{m.id}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColor}`}>
                                    {statusText}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1">Stock Level</p>
                                    <p className="text-lg font-bold text-gray-800">{m.stock_in_hand} <span className="text-xs font-normal text-gray-500">{m.unit || "units"}</span></p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1">Last Price</p>
                                    <p className="text-sm font-semibold text-[#4c7085]">{m.purchase_price ? `${m.purchase_price} QAR` : "—"}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {materials.length === 0 && (
                    <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-200 text-center text-gray-500">
                        No materials recorded.
                    </div>
                )}
            </div>

        </div>
    );
};

export default StockInHand;
