/* src/pages/Inventory/tabs/PlasticBoxes.jsx */
import React, { useState, useEffect } from "react";
import { FaBoxOpen, FaExchangeAlt } from "react-icons/fa";
import apiClient from "../../../api/apiClient";
import Loading from "../../../components/Loading";

const PlasticBoxes = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const response = await apiClient.get("/materials/");
                // Filter for plastic boxes (common names: Plastic Box, Plastic Container, etc.)
                const boxes = response.data.filter(m =>
                    m.name.toLowerCase().includes("plastic") ||
                    m.name.toLowerCase().includes("box")
                );
                setMaterials(boxes);
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
            <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-xl flex items-center gap-4">
                <div className="p-4 bg-indigo-600 text-white rounded-lg">
                    <FaBoxOpen className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-indigo-700 font-medium">Plastic Boxes Inventory</p>
                    <p className="text-gray-600 text-sm">Special tracking for reusable plastic moving crates.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materials.length > 0 ? (
                    materials.map((m) => (
                        <div key={m.id} className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg text-gray-800">{m.name}</h3>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${parseFloat(m.stock_in_hand) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    }`}>
                                    {m.stock_in_hand} {m.unit || "Pcs"}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">{m.description || "No description provided."}</p>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm py-2 border-t border-gray-100 text-gray-600">
                                    <span>Stock in Hand</span>
                                    <span className="font-bold">{m.stock_in_hand}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-10 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        No plastic boxes found in materials list.
                        Please add them in "Additional Settings &gt; Materials" first.
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                <FaExchangeAlt className="text-blue-600 mt-1" />
                <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Plastic boxes are often reusable. Stock is deducted when assigned to a move and should be manually restored when returned from the client.
                </p>
            </div>
        </div>
    );
};

export default PlasticBoxes;
