import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSave, FiPlus, FiTrash2 } from "react-icons/fi";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";

import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";

const BookingForm = () => {
    const { id, quotId } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const [booking, setBooking] = useState(null);
    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Options from settings
    const [labourOptions, setLabourOptions] = useState([]);
    const [truckOptions, setTruckOptions] = useState([]);
    const [materialOptions, setMaterialOptions] = useState([]);
    const [staffOptions, setStaffOptions] = useState([]);

    // Form state
    const [formData, setFormData] = useState({
        move_date: "",
        start_time: "",
        estimated_end_time: "",
        supervisor: "",
        notes: "",
        status: "confirmed"
    });

    const [assignedLabours, setAssignedLabours] = useState([]);
    const [assignedTrucks, setAssignedTrucks] = useState([]);
    const [assignedMaterials, setAssignedMaterials] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [labRes, truckRes, matRes, staffRes] = await Promise.all([
                    apiClient.get("/labours/"),
                    apiClient.get("/truck-types/"),
                    apiClient.get("/materials/"),
                    apiClient.get("/manpower/"),
                ]);
                setLabourOptions(labRes.data);
                setTruckOptions(truckRes.data);
                setMaterialOptions(matRes.data);
                setStaffOptions(staffRes.data);

                const initialMaterials = matRes.data.map(mat => ({
                    material: mat.id,
                    name: mat.name,
                    quantity: 0,
                    selected: false
                }));
                setAssignedMaterials(initialMaterials);

                if (id) {
                    const res = await apiClient.get(`/bookings/${id}/`);
                    const b = res.data;
                    setBooking(b);

                    setFormData({
                        move_date: b.move_date || "",
                        start_time: b.start_time ? b.start_time.slice(0, 5) : "",
                        estimated_end_time: b.estimated_end_time ? b.estimated_end_time.slice(0, 5) : "",
                        supervisor: String(b.supervisor || ""),
                        notes: b.notes || "",
                        status: b.status || "confirmed"
                    });

                    setAssignedLabours(Array.isArray(b.labours) ? b.labours.map(l => ({ ...l, isNew: false })) : []);

                    const loadedMaterials = initialMaterials.map(mat => {
                        const existing = b.materials?.find(m => m.material === mat.material);
                        return existing ? { ...mat, quantity: existing.quantity, selected: true } : mat;
                    });
                    setAssignedMaterials(loadedMaterials);

                    setAssignedTrucks(Array.isArray(b.trucks) ? b.trucks.map(t => ({ ...t, isNew: false })) : []);
                } else if (quotId) {
                    try {
                        const existingRes = await apiClient.get(`/bookings/by-quotation/${quotId}/`);
                        if (existingRes.data) {
                            navigate(`/booking-detail/${existingRes.data.id}`, { replace: true });
                            return;
                        }
                    } catch (err) {
                        // proceed
                    }

                    const quotRes = await apiClient.get(`/quotation-create/${quotId}/`);
                    const quotData = quotRes.data;
                    setQuotation(quotData);

                    if (quotData.survey_id) {
                        const surveyRes = await apiClient.get(`/surveys/${quotData.survey_id}/`);
                        const survey = surveyRes.data;
                        setFormData(prev => ({
                            ...prev,
                            move_date: survey.packing_date_from || "",
                            start_time: "",
                        }));
                    }
                }
            } catch (err) {
                setError("Failed to load data.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, quotId, navigate]);

    const getAvailableStaff = (currentIndex) => {
        const selectedIds = assignedLabours
            .filter((_, idx) => idx !== currentIndex)
            .map(lab => lab.staff_member)
            .filter(Boolean);

        return staffOptions.filter(staff => !selectedIds.includes(String(staff.id)));
    };

    const toggleMaterialSelection = (materialId) => {
        setAssignedMaterials(prev =>
            prev.map(mat =>
                mat.material === materialId
                    ? { ...mat, selected: !mat.selected }
                    : mat
            )
        );
    };

    const updateMaterialQuantity = (materialId, delta) => {
        setAssignedMaterials(prev =>
            prev.map(mat =>
                mat.material === materialId
                    ? {
                        ...mat,
                        quantity: Math.max(0, mat.quantity + delta),
                        selected: mat.quantity + delta > 0 ? true : mat.selected
                    }
                    : mat
            )
        );
    };

    const addItem = (type) => {
        if (type === 'labour') setAssignedLabours([...assignedLabours, { staff_member: "" }]);
        if (type === 'truck') setAssignedTrucks([...assignedTrucks, { truck_type: "", quantity: 1, isNew: true }]);
    };

    const removeItem = (type, index, itemId) => {
        if (itemId && !window.confirm("Delete this assignment?")) return;

        if (itemId) {
            let endpoint = type === 'labour' ? 'booking-labours' : type === 'truck' ? 'booking-trucks' : 'booking-materials';
            apiClient.delete(`/${endpoint}/${itemId}/`);
        }

        if (type === 'labour') setAssignedLabours(assignedLabours.filter((_, i) => i !== index));
        if (type === 'truck') setAssignedTrucks(assignedTrucks.filter((_, i) => i !== index));
    };

    const updateItem = (type, index, field, value) => {
        const list = type === 'labour' ? [...assignedLabours] : type === 'truck' ? [...assignedTrucks] : [...assignedMaterials];
        list[index][field] = value;
        if (type === 'labour') setAssignedLabours(list);
        if (type === 'truck') setAssignedTrucks(list);
        if (type === 'material') setAssignedMaterials(list);
    };

    const handleSave = async () => {
        const requiredPerm = id ? "edit" : "add";
        if (!hasPermission("booking", requiredPerm)) {
            alert(`Permission denied: You cannot ${id ? "edit" : "create"} bookings.`);
            return;
        }

        try {
            setLoading(true);

            const payload = {
                ...formData,
                quotation: id ? booking?.quotation : quotation?.id
            };

            let currentBookingId = id;
            if (id) {
                await apiClient.patch(`/bookings/${id}/`, payload);
                currentBookingId = id;
            } else {
                const res = await apiClient.post("/bookings/", payload);
                currentBookingId = res.data.id;
            }

            for (const labour of assignedLabours) {
                const labourPayload = {
                    booking: currentBookingId,
                    staff_member: labour.staff_member,
                };
                if (labour.id) {
                    await apiClient.patch(`/booking-labours/${labour.id}/`, labourPayload);
                } else {
                    await apiClient.post("/booking-labours/", labourPayload);
                }
            }

            for (const truck of assignedTrucks) {
                const truckPayload = {
                    booking: currentBookingId,
                    truck_type: truck.truck_type,
                    quantity: truck.quantity
                };
                if (truck.id) {
                    await apiClient.patch(`/booking-trucks/${truck.id}/`, truckPayload);
                } else {
                    await apiClient.post("/booking-trucks/", truckPayload);
                }
            }

            const selectedMaterials = assignedMaterials.filter(m => m.selected && m.quantity > 0);
            for (const material of selectedMaterials) {
                const materialPayload = {
                    booking: currentBookingId,
                    material: material.material,
                    quantity: material.quantity
                };
                await apiClient.post("/booking-materials/", materialPayload);
            }

            setSuccess("Booking saved successfully!");
            setTimeout(() => navigate("/booking-list"), 1500);
        } catch (err) {
            console.error("Save error:", err);
            setError("Failed to save booking: " + (err.response?.data?.detail || err.message));
            setTimeout(() => setError(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <PageHeader
                title={id ? "Edit Booking" : "Create New Booking"}
                subtitle={id ? `Booking ID: ${booking?.booking_id || "—"}` : "Fill in the details to create a new booking"}
                extra={
                    <div className="flex items-center gap-3">
                        {/* Check permission: 'edit' if ID exists, 'add' if new */}
                        {hasPermission("booking", id ? "edit" : "add") && (
                            <button
                                onClick={handleSave}
                                className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <FiSave className="w-4 h-4" />
                                <span>{id ? "Save Changes" : "Create Booking"}</span>
                            </button>
                        )}
                        <button
                            onClick={() => navigate(-1)}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <FiArrowLeft className="w-4 h-4" />
                            <span>Back</span>
                        </button>
                    </div>
                }
            />

            {/* Messages */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 text-center font-medium"
                    >
                        {success}
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-center font-medium"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-6">
                {/* Basic Information & Client Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-lg font-medium text-gray-800 mb-4">Basic Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Move Date</label>
                                <input
                                    type="date"
                                    className="input-style w-full"
                                    value={formData.move_date}
                                    onChange={(e) => setFormData({ ...formData, move_date: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Start Time</label>
                                    <input
                                        type="time"
                                        className="input-style w-full"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">End Time</label>
                                    <input
                                        type="time"
                                        className="input-style w-full"
                                        value={formData.estimated_end_time}
                                        onChange={(e) => setFormData({ ...formData, estimated_end_time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Supervisor</label>
                                <select
                                    className="input-style w-full"
                                    value={String(formData.supervisor || "")}
                                    onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                                >
                                    <option value="">Select Supervisor</option>
                                    {staffOptions.filter(s => s.category === "Supervisor").map(s => (
                                        <option key={s.id} value={String(s.id)}>{s.name} ({s.employer || "Almas Movers"})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Client & Move Details */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-lg font-medium text-gray-800 mb-4">Client & Move Details</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                                <div>
                                    <span className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-1">Client Name</span>
                                    <p className="text-sm font-medium text-gray-800">
                                        {booking?.client_name || quotation?.full_name || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <span className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-1">Move Type</span>
                                    <p className="text-sm font-medium text-indigo-600">
                                        {booking?.move_type || quotation?.service_type || "N/A"}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Internal Notes</label>
                                <textarea
                                    className="input-style w-full h-32 resize-none"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Add internal coordination notes here..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Labours / Manpower */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-medium text-gray-800">Labours / Manpower</h2>
                        <button
                            onClick={() => addItem('labour')}
                            className="btn-secondary flex items-center gap-2 text-sm"
                        >
                            <FiPlus className="w-4 h-4" />
                            <span>Add Labour</span>
                        </button>
                    </div>
                    <div className="space-y-3">
                        {assignedLabours.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Assigned Staff</label>
                                    <select
                                        className="input-style w-full"
                                        value={String(item.staff_member || "")}
                                        onChange={(e) => updateItem('labour', idx, 'staff_member', e.target.value)}
                                        disabled={getAvailableStaff(idx).length === 0 && !item.staff_member}
                                    >
                                        <option value="">Select Staff</option>
                                        {getAvailableStaff(idx).map(s => (
                                            <option key={s.id} value={String(s.id)}>
                                                {s.name} ({s.employer || "Almas Movers"})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => removeItem('labour', idx, item.id)}
                                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-6"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {assignedLabours.length === 0 && (
                            <p className="text-sm text-gray-600 text-center py-6 bg-gray-50 rounded-2xl">No labour assigned yet. Click "Add Labour" to assign staff.</p>
                        )}
                    </div>
                </div>

                {/* Trucks & Materials */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Trucks */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-medium text-gray-800">Trucks</h2>
                            <button
                                onClick={() => addItem('truck')}
                                className="p-2 bg-[#4c7085] text-white rounded-xl hover:bg-[#6b8ca3] transition-colors"
                            >
                                <FiPlus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {assignedTrucks.map((item, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Truck Type</label>
                                        <select
                                            className="input-style w-full"
                                            value={item.truck_type}
                                            onChange={(e) => updateItem('truck', idx, 'truck_type', e.target.value)}
                                        >
                                            <option value="">Select Truck</option>
                                            {truckOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-gray-600 uppercase tracking-widest">Quantity</label>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (item.quantity > 0) updateItem('truck', idx, 'quantity', Math.max(0, item.quantity - 1));
                                                }}
                                                className="w-9 h-9 flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-300 transition-colors"
                                            >
                                                <span className="text-lg font-medium">-</span>
                                            </button>

                                            <input
                                                type="number"
                                                className="w-16 text-center border border-gray-300 rounded-xl p-2 text-sm focus:ring-2 focus:ring-[#4c7085]/20 outline-none"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    updateItem('truck', idx, 'quantity', Math.max(0, val));
                                                }}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => updateItem('truck', idx, 'quantity', item.quantity + 1)}
                                                className="w-9 h-9 flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-300 transition-colors"
                                            >
                                                <span className="text-lg font-medium">+</span>
                                            </button>

                                            <button
                                                onClick={() => removeItem('truck', idx, item.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors ml-2"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {assignedTrucks.length === 0 && (
                                <p className="text-sm text-gray-600 text-center py-6 bg-gray-50 rounded-2xl">No trucks assigned</p>
                            )}
                        </div>
                    </div>

                    {/* Materials */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-lg font-medium text-gray-800 mb-6">Materials</h2>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {assignedMaterials.length > 0 ? (
                                assignedMaterials.map((item) => (
                                    <div key={item.material} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-200">
                                        <div className="flex items-center gap-3 flex-1">
                                            <input
                                                type="checkbox"
                                                checked={item.selected}
                                                onChange={() => toggleMaterialSelection(item.material)}
                                                className="h-5 w-5 text-[#4c7085] focus:ring-[#4c7085] border-gray-300 rounded accent-[#4c7085]"
                                            />
                                            <label className="text-sm font-medium text-gray-700">
                                                {item.name}
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateMaterialQuantity(item.material, -1)}
                                                disabled={item.quantity <= 0}
                                                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-300 disabled:opacity-50 transition-colors"
                                            >
                                                <span className="text-base font-medium">-</span>
                                            </button>

                                            <input
                                                type="number"
                                                className="w-14 text-center border border-gray-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-[#4c7085]/20 outline-none"
                                                value={item.quantity}
                                                min="0"
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    updateMaterialQuantity(item.material, val - item.quantity);
                                                }}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => updateMaterialQuantity(item.material, 1)}
                                                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-300 transition-colors"
                                            >
                                                <span className="text-base font-medium">+</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-600 text-center py-6 bg-gray-50 rounded-2xl">No materials available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingForm;