import { useState, useEffect } from "react";
import { FiPlus, FiClock } from "react-icons/fi";
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
        } catch (err) {
            console.error("Failed to record purchase:", err);
            alert("Failed to record purchase.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loading /></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Purchase Form */}
            <div className="lg:col-span-1">
                <div className="bg-gray-50 border border-gray-100 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[#4c7085] text-white rounded-xl shadow-sm">
                            <FiPlus className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-medium text-gray-800">Record New Purchase</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-2 ml-1">Material</label>
                            <select
                                name="material"
                                value={formData.material}
                                onChange={handleInputChange}
                                className="input-style w-full"
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
                                <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-2 ml-1">Quantity</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    className="input-style w-full"
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-2 ml-1">Unit Price</label>
                                <input
                                    type="number"
                                    name="unit_price"
                                    value={formData.unit_price}
                                    onChange={handleInputChange}
                                    className="input-style w-full"
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-2 ml-1">Supplier</label>
                            <input
                                type="text"
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleInputChange}
                                className="input-style w-full"
                                placeholder="Supplier name"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-widest mb-2 ml-1">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className="input-style w-full"
                                rows="3"
                                placeholder="Additional details..."
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary w-full flex justify-center mt-2"
                        >
                            {submitting ? "Processing..." : "Save Purchase"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Purchase History */}
            <div className="lg:col-span-2">
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm h-full flex flex-col">
                    <div className="bg-gray-50/50 px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                        <FiClock className="text-[#4c7085] w-5 h-5" />
                        <h2 className="font-medium text-gray-800">Recent Purchases</h2>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/30 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Material</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-right">Qty</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-right">Unit Price</th>
                                    <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {purchases.length > 0 ? (
                                    purchases.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(p.purchase_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-medium text-gray-800">{p.material_name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 text-right">{p.quantity}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 text-right">{p.unit_price} QAR</td>
                                            <td className="px-6 py-4 font-medium text-[#4c7085] text-right">{p.total_price} QAR</td>
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
