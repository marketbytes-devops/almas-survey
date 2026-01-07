/* src/pages/Inventory/tabs/StockInHand.jsx */
import React, { useState, useEffect } from "react";
import { FaBoxes, FaExclamationTriangle } from "react-icons/fa";
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

    if (loading) return <Loading />;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#4c7085]/5 border border-[#4c7085]/30 p-6 rounded-xl flex items-center gap-4">
                    <div className="p-4 bg-[#4c7085] text-white rounded-lg">
                        <FaBoxes className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-[#4c7085] font-medium">Total Material Types</p>
                        <p className="text-2xl font-bold">{materials.length}</p>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl flex items-center gap-4">
                    <div className="p-4 bg-yellow-500 text-white rounded-lg">
                        <FaExclamationTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-yellow-700 font-medium">Low Stock Items</p>
                        <p className="text-2xl font-bold">
                            {materials.filter(m => parseFloat(m.stock_in_hand) < 10).length}
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                        <tr>
                            <th className="px-6 py-4">Material Name</th>
                            <th className="px-6 py-4">Stock Level</th>
                            <th className="px-6 py-4">Unit</th>
                            <th className="px-6 py-4">Initial/Last Price</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {materials.map((m) => {
                            const stock = parseFloat(m.stock_in_hand);
                            let statusColor = "bg-green-100 text-green-700";
                            let statusText = "In Stock";

                            if (stock <= 0) {
                                statusColor = "bg-red-100 text-red-700";
                                statusText = "Out of Stock";
                            } else if (stock < 10) {
                                statusColor = "bg-yellow-100 text-yellow-700";
                                statusText = "Low Stock";
                            }

                            return (
                                <tr key={m.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{m.name}</td>
                                    <td className="px-6 py-4 text-base font-bold text-gray-800">
                                        {m.stock_in_hand}
                                    </td>
                                    <td className="px-6 py-4">{m.unit || "—"}</td>
                                    <td className="px-6 py-4">{m.purchase_price ? `${m.purchase_price} QAR` : "—"}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                            {statusText}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockInHand;
