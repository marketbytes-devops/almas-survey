/* src/pages/Admin/ManpowerManagement.jsx */
import React, { useState, useEffect } from "react";
import { FaUserPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const ManpowerManagement = () => {
    const [staff, setStaff] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        employer: "",
        phone_number: "",
        is_active: true
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await apiClient.get("/manpower/");
                setStaff(res.data);
            } catch (err) {
                console.error("Failed to fetch manpower data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingStaff) {
                const res = await apiClient.put(`/manpower/${editingStaff.id}/`, formData);
                setStaff(staff.map(s => s.id === editingStaff.id ? res.data : s));
                alert("Record updated!");
            } else {
                const res = await apiClient.post("/manpower/", formData);
                setStaff([...staff, res.data]);
                alert("Record added!");
            }
            resetForm();
        } catch (err) {
            console.error("Save error:", err);
            alert("Failed to save record.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (s) => {
        setEditingStaff(s);
        setFormData({
            name: s.name,
            category: s.category,
            employer: s.employer || "",
            phone_number: s.phone_number || "",
            is_active: s.is_active
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await apiClient.delete(`/manpower/${id}/`);
            setStaff(staff.filter(s => s.id !== id));
            alert("Record deleted!");
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete record.");
        }
    };

    const resetForm = () => {
        setEditingStaff(null);
        setFormData({
            name: "",
            category: "",
            employer: "",
            phone_number: "",
            is_active: true
        });
    };

    if (loading) return <Loading />;

    const inputClasses = "w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4c7085] border-gray-300";
    const labelClasses = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="container mx-auto p-4">
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-6 rounded-t-lg shadow-lg flex justify-between items-center">
                <h1 className="text-xl font-bold">Manpower Management</h1>
            </div>

            <div className="bg-white shadow-md rounded-b-lg p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#4c7085]/5 border border-[#4c7085]/30 p-6 rounded-xl">
                            <h2 className="text-lg font-bold text-[#4c7085] mb-6 flex items-center gap-2">
                                <FaUserPlus /> {editingStaff ? "Edit Staff" : "Add New Staff"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className={labelClasses}>Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className={inputClasses}
                                        required
                                        placeholder="Enter name"
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className={inputClasses}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Supervisor">Supervisor</option>
                                        <option value="Packer">Packer</option>
                                        <option value="Driver">Driver</option>
                                        <option value="Helper">Helper</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>Employer / Agency</label>
                                    <select
                                        name="employer"
                                        value={formData.employer}
                                        onChange={handleInputChange}
                                        className={inputClasses}
                                    >
                                        <option value="">Select Employer</option>
                                        <option value="Almas Movers">Almas Movers</option>
                                        <option value="Outside Workers">Outside Workers</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>Phone Number</label>
                                    <input
                                        type="text"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleInputChange}
                                        className={inputClasses}
                                        placeholder="+974 XXXX XXXX"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-[#4c7085]"
                                    />
                                    <label className="text-sm font-medium text-gray-700">Is Active</label>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-[#4c7085] hover:bg-[#6b8ca3] text-white py-2 rounded-lg font-bold transition disabled:opacity-50"
                                    >
                                        {submitting ? "Saving..." : editingStaff ? "Update" : "Add Staff"}
                                    </button>
                                    {editingStaff && (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-bold transition"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="lg:col-span-2">
                        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Employer</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {staff.length > 0 ? (
                                        staff.map((s) => (
                                            <tr key={s.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{s.name}</div>
                                                    <div className="text-xs text-gray-400">{s.phone_number}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                                        {s.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">{s.employer || "—"}</td>
                                                <td className="px-6 py-4">
                                                    {s.is_active ? (
                                                        <span className="flex items-center gap-1 text-green-600"><FaCheckCircle /> Active</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-red-400"><FaTimesCircle /> Inactive</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(s)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(s.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
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
                                            <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                                                No staff records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManpowerManagement;
