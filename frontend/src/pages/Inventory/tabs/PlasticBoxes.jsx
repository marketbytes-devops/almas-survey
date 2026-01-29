import { useState, useEffect } from "react";
import { FiBox, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import apiClient from "../../../api/apiClient";
import Loading from "../../../components/Loading";

const PlasticBoxes = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const response = await apiClient.get("/materials/");
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

    if (loading) return <div className="flex justify-center py-12"><Loading /></div>;

    return (
        <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 p-4 md:p-6 rounded-2xl md:rounded-3xl flex items-center gap-4">
                <div className="p-2.5 md:p-3 bg-indigo-600 text-white rounded-lg md:rounded-xl shadow-sm">
                    <FiBox className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                    <p className="text-sm md:text-base font-medium text-indigo-700">Plastic Boxes Inventory</p>
                    <p className="text-gray-600 text-[10px] md:text-sm mt-0.5 md:mt-1">Special tracking for reusable plastic moving crates.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {materials.length > 0 ? (
                    materials.map((m) => (
                        <div key={m.id} className="bg-white border border-gray-200 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4 gap-2">
                                <h3 className="font-bold text-base md:text-lg text-gray-800 group-hover:text-[#4c7085] transition-colors line-clamp-1">{m.name}</h3>
                                <span className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium border whitespace-nowrap ${parseFloat(m.stock_in_hand) > 0
                                    ? "bg-green-50 text-green-700 border-green-100"
                                    : "bg-red-50 text-red-700 border-red-100"
                                    }`}>
                                    {m.stock_in_hand} {m.unit || "Pcs"}
                                </span>
                            </div>
                            <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6 bg-gray-50 p-2.5 md:p-3 rounded-lg md:rounded-xl border border-gray-100 line-clamp-2 md:line-clamp-none">
                                {m.description || "No description provided."}
                            </p>

                            <div className="space-y-3">
                                <div className="flex justify-between text-xs md:text-sm py-2 md:py-3 border-t border-gray-100 text-gray-600">
                                    <span className="font-medium text-gray-600">Stock in Hand</span>
                                    <span className="font-bold text-gray-800">{m.stock_in_hand}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-gray-600 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <div className="flex flex-col items-center">
                            <FiAlertCircle className="w-8 h-8 mb-3 opacity-50" />
                            <p>No plastic boxes found in materials list.</p>
                            <p className="text-sm mt-1">Please add them in "Additional Settings &gt; Materials" first.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <FiRefreshCw className="w-4 h-4" />
                </div>
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Plastic boxes are often reusable. Stock is deducted when assigned to a move and should be manually restored when returned from the client.
                </p>
            </div>
        </div>
    );
};

export default PlasticBoxes;
