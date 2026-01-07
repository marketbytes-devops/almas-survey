/* src/pages/Inventory/tabs/Purchase.jsx */
import React, { useState, useEffect } from "react";
import { FaPlus, FaHistory } from "react-icons/fa";
import apiClient from "../../../api/apiClient";
import Loading from "../../../components/Loading";

const Purchase = () => {
    const [materials, setMaterials] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        material: "",
        quantity: "",
        unit_price: "",
        supplier: "",
        notes: "",
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [matRes, purRes] = await Promise.all([
                    apiClient.get("/materials/"),
                    apiClient.get("/material-purchases/"),
                ]);
                setMaterials(matRes.data);
                setPurchases(purRes.data);
            } catch (err) {
                console.error("Failed to fetch purchase data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await apiClient.post("/material-purchases/", formData);
            alert("Purchase recorded successfully!");
            setPurchases([response.data, ...purchases]);
            setFormData({
                material: "",
                quantity: "",
                unit_price: "",
                supplier: "",
                notes: "",
            });
            // Reload materials to see updated stock in other tabs if needed, 
            // but usually we rely on parent or re-fetch when switching tabs.
        } catch (err) {
            console.error("Failed to record purchase:", err);
            alert("Failed to record purchase.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading />;

    const inputClasses = "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4c7085] border-gray-300";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Purchase Form */}
            <div className="lg:col-span-1">
                <div className="bg-[#4c7085]/5 border border-[#4c7085]/30 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[#4c7085] text-white rounded-lg">
                            <FaPlus className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-bold text-[#4c7085]">Record New Purchase</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={labelClasses}>Material</label>
                            <select
                                name="material"
                                value={formData.material}
                                onChange={handleInputChange}
                                className={inputClasses}
                                required
                            >
                                <option value="">Select Material</option>
                                {materials.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.unit || "unit"})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Quantity</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Unit Price</label>
                                <input
                                    type="number"
                                    name="unit_price"
                                    value={formData.unit_price}
                                    onChange={handleInputChange}
                                    className={inputClasses}
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Supplier</label>
                            <input
                                type="text"
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleInputChange}
                                className={inputClasses}
                                placeholder="Supplier name"
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className={inputClasses}
                                rows="3"
                                placeholder="Additional details..."
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-[#4c7085] hover:bg-[#6b8ca3] text-white py-3 rounded-lg font-bold shadow-lg transition disabled:opacity-50"
                        >
                            {submitting ? "Processing..." : "Save Purchase"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Purchase History */}
            <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-6 py-4 border-b flex items-center gap-3">
                        <FaHistory className="text-[#4c7085]" />
                        <h2 className="font-bold text-gray-700">Recent Purchases</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="bg-gray-100 text-xs text-uppercase text-gray-600">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Material</th>
                                    <th className="px-6 py-3 text-right">Qty</th>
                                    <th className="px-6 py-3 text-right">Unit Price</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {purchases.length > 0 ? (
                                    purchases.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">{new Date(p.purchase_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-medium text-gray-800">{p.material_name}</td>
                                            <td className="px-6 py-4 text-right">{p.quantity}</td>
                                            <td className="px-6 py-4 text-right">{p.unit_price} QAR</td>
                                            <td className="px-6 py-4 text-right font-bold">{p.total_price} QAR</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                                            No purchase records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Purchase;
