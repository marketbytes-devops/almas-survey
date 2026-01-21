/* src/pages/AdditionalSettings/Manpower.jsx */
import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiSearch, FiX, FiInfo, FiEdit2, FiCheckCircle, FiMinusCircle } from "react-icons/fi";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";
import apiClient from "../../api/apiClient";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Loading from "../../components/Loading";

const Manpower = () => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [manpower, setManpower] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const methods = useForm({
        defaultValues: {
            name: "",
            category: "",
            employer: "",
            phone_number: "",
            is_active: true
        },
    });

    const { handleSubmit, reset, setValue } = methods;

    useEffect(() => {
        if (!hasPermission("manpower", "view")) {
            navigate("/dashboard");
            return;
        }
        fetchManpower();
    }, [hasPermission, navigate]);

    const fetchManpower = async () => {
        try {
            const response = await apiClient.get("/manpower/");
            setManpower(response.data);
        } catch (err) {
            setError("Failed to fetch manpower data.");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        const action = editingItem ? "edit" : "add";
        if (!hasPermission("manpower", action)) {
            setError("Permission denied");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            if (editingItem) {
                const response = await apiClient.put(`/manpower/${editingItem.id}/`, data);
                setManpower(manpower.map((m) => (m.id === editingItem.id ? response.data : m)));
                setSuccess("Manpower updated successfully!");
            } else {
                const response = await apiClient.post("/manpower/", data);
                setManpower([response.data, ...manpower]);
                setSuccess("Manpower added successfully!");
            }
            closeModal();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Failed to save record. Please try again.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setValue("name", item.name);
        setValue("category", item.category);
        setValue("employer", item.employer || "");
        setValue("phone_number", item.phone_number || "");
        setValue("is_active", item.is_active);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!hasPermission("manpower", "delete")) {
            setError("Permission denied");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await apiClient.delete(`/manpower/${id}/`);
            setManpower(manpower.filter((m) => m.id !== id));
            setSuccess("Record deleted successfully!");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError("Failed to delete record.");
            setTimeout(() => setError(null), 3000);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        reset({
            name: "",
            category: "",
            employer: "",
            phone_number: "",
            is_active: true
        });
    };

    const filteredManpower = manpower.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <PageHeader
                title="Manpower Management"
                subtitle="Manage your staff, categories, and active status"
            />

            <div className="px-1 md:px-0 space-y-6">
                {/* Alerts */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center justify-between shadow-sm"
                        >
                            <div className="flex items-center">
                                <FiInfo className="mr-2" />
                                <span className="text-sm font-medium">{success}</span>
                            </div>
                            <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">
                                <FiX className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                    {error && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-between shadow-sm"
                        >
                            <div className="flex items-center">
                                <FiInfo className="mr-2" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                                <FiX className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search & Add Action */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <FiSearch className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search staff by name, category, or agency..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-style w-full !pl-12 h-[52px] rounded-2xl border-gray-100 shadow-sm"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {hasPermission("manpower", "add") && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full md:w-auto btn-primary whitespace-nowrap min-w-[180px]"
                        >
                            <FiPlus className="w-5 h-5" />
                            <span className="text-sm tracking-wide">Add New Staff</span>
                        </button>
                    )}
                </div>

                {/* Content Area */}
                {filteredManpower.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiInfo className="text-gray-300 w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800">No staff found</h3>
                        <p className="text-gray-600 text-sm mt-1">
                            {searchTerm ? "Try adjusting your search query" : "Get started by adding a new staff member"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {/* Desktop Headers */}
                        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 rounded-xl border border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-widest">
                            <div className="col-span-3">Full Name</div>
                            <div className="col-span-2 text-center">Category</div>
                            <div className="col-span-3 text-center">Employer / Agency</div>
                            <div className="col-span-2 text-center">Status</div>
                            <div className="col-span-2 text-right">Action</div>
                        </div>

                        {/* List Items */}
                        <div className="space-y-3">
                            {filteredManpower.map((item) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    key={item.id}
                                    className="group bg-white p-5 lg:px-6 lg:py-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                        {/* Name & Phone */}
                                        <div className="lg:col-span-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] text-sm font-medium shrink-0">
                                                    {item.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-800">{item.name}</span>
                                                    <span className="text-[11px] text-gray-500 font-light">{item.phone_number || "No phone number"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Category */}
                                        <div className="lg:col-span-2 flex lg:justify-center items-center">
                                            <span className="text-xs font-medium text-gray-400 lg:hidden mr-2">Category:</span>
                                            <span className="px-3 py-1 bg-gray-100 rounded-full text-[11px] font-medium text-gray-600">
                                                {item.category}
                                            </span>
                                        </div>

                                        {/* Employer */}
                                        <div className="lg:col-span-3 flex lg:justify-center items-center">
                                            <span className="text-xs font-medium text-gray-400 lg:hidden mr-2">Employer:</span>
                                            <span className="text-sm font-normal text-gray-600">
                                                {item.employer || "—"}
                                            </span>
                                        </div>

                                        {/* Status */}
                                        <div className="lg:col-span-2 flex lg:justify-center items-center">
                                            <span className="text-xs font-medium text-gray-400 lg:hidden mr-2">Status:</span>
                                            {item.is_active ? (
                                                <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                                                    <FiCheckCircle className="w-3.5 h-3.5" />
                                                    <span>Active</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-light">
                                                    <FiMinusCircle className="w-3.5 h-3.5" />
                                                    <span>Inactive</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="lg:col-span-2 flex justify-end gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
                                            {hasPermission("manpower", "edit") && (
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[#4c7085] hover:bg-[#4c7085]/5 rounded-xl transition-all"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 className="w-4.5 h-4.5" />
                                                </button>
                                            )}
                                            {hasPermission("manpower", "delete") && (
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 className="w-4.5 h-4.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Add / Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingItem ? "Edit Staff Member" : "Add New Staff"}
            >
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Input
                            label="Full Name"
                            name="name"
                            rules={{ required: "Staff name is required" }}
                            placeholder="Enter full name"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                                type="select"
                                label="Category"
                                name="category"
                                rules={{ required: "Category is required" }}
                                options={[
                                    { value: "Supervisor", label: "Supervisor" },
                                    { value: "Packer", label: "Packer" },
                                    { value: "Driver", label: "Driver" },
                                    { value: "Helper", label: "Helper" },
                                    { value: "Other", label: "Other" },
                                ]}
                            />

                            <Input
                                type="select"
                                label="Employer / Agency"
                                name="employer"
                                options={[
                                    { value: "Almas Movers", label: "Almas Movers" },
                                    { value: "Outside Workers", label: "Outside Workers" },
                                ]}
                            />
                        </div>

                        <Input
                            label="Phone Number"
                            name="phone_number"
                            placeholder="+974 XXXX XXXX"
                        />

                        <Input
                            type="checkbox"
                            label="Active Status (Mark if staff is currently available)"
                            name="is_active"
                        />

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="btn-secondary !bg-transparent !border-none !px-4"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn-primary !font-normal min-w-[140px]"
                            >
                                {isSubmitting ? (
                                    <Loading size="sm" color="white" />
                                ) : editingItem ? (
                                    "Update Staff"
                                ) : (
                                    "Save Staff"
                                )}
                            </button>
                        </div>
                    </form>
                </FormProvider>
            </Modal>
        </div>
    );
};

export default Manpower;
