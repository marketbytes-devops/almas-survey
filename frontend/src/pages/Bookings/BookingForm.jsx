/* src/pages/Bookings/BookingForm.jsx */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSave, FaPlus, FaTrash } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const BookingForm = () => {
    const { id, quotId } = useParams();
    const navigate = useNavigate();

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
    // For materials: array of { materialId, name, quantity, selected }
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

                // Initialize materials list with all available materials
                const initialMaterials = matRes.data.map(mat => ({
                    material: mat.id,
                    name: mat.name,
                    quantity: 0,
                    selected: false // initially not selected
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

                    // Load existing materials (merge with full list)
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

    const handleSave = async () => {
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

            // Save labours (unchanged)
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

            // Save trucks (unchanged)
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

            // Save materials - only selected ones with quantity > 0
            const selectedMaterials = assignedMaterials.filter(m => m.selected && m.quantity > 0);
            for (const material of selectedMaterials) {
                const materialPayload = {
                    booking: currentBookingId,
                    material: material.material,
                    quantity: material.quantity
                };
                // Use POST for new, PATCH for existing (if you track IDs)
                await apiClient.post("/booking-materials/", materialPayload);
            }

            setSuccess("Booking saved successfully!");
            navigate("/booking-list");
        } catch (err) {
            console.error("Save error:", err);
            setError("Failed to save booking: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
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
                        selected: mat.quantity + delta > 0 ? true : mat.selected // auto-select when >0
                    }
                    : mat
            )
        );
    };

    const addItem = (type) => {
        if (type === 'labour') setAssignedLabours([...assignedLabours, { staff_member: "" }]);
        if (type === 'truck') setAssignedTrucks([...assignedTrucks, { truck_type: "", quantity: 1, isNew: true }]);
        // No add for materials - full list always shown
    };

    const removeItem = (type, index, itemId) => {
        if (itemId && !window.confirm("Delete this assignment?")) return;

        if (itemId) {
            let endpoint = type === 'labour' ? 'booking-labours' : type === 'truck' ? 'booking-trucks' : 'booking-materials';
            apiClient.delete(`/${endpoint}/${itemId}/`);
        }

        if (type === 'labour') setAssignedLabours(assignedLabours.filter((_, i) => i !== index));
        if (type === 'truck') setAssignedTrucks(assignedTrucks.filter((_, i) => i !== index));
        // No remove for materials - just set quantity to 0
    };

    const updateItem = (type, index, field, value) => {
        const list = type === 'labour' ? [...assignedLabours] : type === 'truck' ? [...assignedTrucks] : [...assignedMaterials];
        list[index][field] = value;
        if (type === 'labour') setAssignedLabours(list);
        if (type === 'truck') setAssignedTrucks(list);
        if (type === 'material') setAssignedMaterials(list);
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;

    const inputClasses = "w-full rounded-lg border border-[#6b8ca3]/50 bg-white px-4 py-3 text-sm text-[#4c7085] font-medium transition focus:ring-2 focus:ring-[#4c7085]/20 outline-none";
    const labelClasses = "block text-sm font-medium text-[#4c7085] mb-2";
    const sectionClasses = "bg-[#4c7085]/5 border border-[#4c7085]/30 rounded-xl p-6 shadow-sm";

    return (
        <div className="bg-gray-100 min-h-screen rounded-lg">
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-8 flex justify-between items-center rounded-t-lg">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                    >
                        <FaArrowLeft className="w-5 h-5" />
                        <span className="font-medium text-sm">Back</span>
                    </button>
                    <h1 className="text-xl font-medium">
                        {id ? `Edit Booking: ${booking?.booking_id || "Loading..."}` : "Create New Booking"}
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition shadow-lg font-bold"
                >
                    <FaSave /> {id ? "Save Changes" : "Create Booking"}
                </button>
            </div>

            <div className="p-4 space-y-10">
                {success && <div className="p-4 bg-green-100 text-green-700 rounded-lg border border-green-200 shadow-sm">{success}</div>}
                {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200 shadow-sm">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <section className={sectionClasses}>
                        <h2 className="text-lg font-medium text-[#4c7085] mb-6 border-b border-[#4c7085]/20 pb-2">Basic Information</h2>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className={labelClasses}>Move Date</label>
                                <input
                                    type="date"
                                    className={inputClasses}
                                    value={formData.move_date}
                                    onChange={(e) => setFormData({ ...formData, move_date: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClasses}>Start Time</label>
                                    <input
                                        type="time"
                                        className={inputClasses}
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClasses}>Estimated End Time</label>
                                    <input
                                        type="time"
                                        className={inputClasses}
                                        value={formData.estimated_end_time}
                                        onChange={(e) => setFormData({ ...formData, estimated_end_time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Supervisor</label>
                                <select
                                    className={inputClasses}
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
                    </section>

                    {/* Client & Move Details */}
                    <section className={sectionClasses}>
                        <h2 className="text-lg font-medium text-[#4c7085] mb-6 border-b border-[#4c7085]/20 pb-2">Client & Move Details</h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-white/50 p-4 rounded-lg border border-[#4c7085]/10 shadow-inner">
                                <div>
                                    <span className="text-xs font-bold text-[#4c7085] uppercase tracking-wider">Client Name</span>
                                    <p className="text-sm font-medium text-gray-700 mt-1">
                                        {booking?.client_name || quotation?.full_name || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-[#4c7085] uppercase tracking-wider">Move Type</span>
                                    <p className="text-sm font-medium text-indigo-700 mt-1">
                                        {booking?.move_type || quotation?.service_type || "N/A"}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>Internal Notes</label>
                                <textarea
                                    className={`${inputClasses} h-32 resize-none`}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Add internal coordination notes here..."
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Assignments Sections */}
                <div className="space-y-8">
                    {/* Labours - Unchanged */}
                    <section className={sectionClasses}>
                        <div className="flex justify-between items-center mb-6 border-b border-[#4c7085]/20 pb-2">
                            <h2 className="text-lg font-medium text-[#4c7085]">Labours / Manpower</h2>
                            <button
                                onClick={() => addItem('labour')}
                                className="flex items-center gap-2 px-4 py-2 bg-[#4c7085] text-white text-xs font-medium rounded-lg hover:bg-[#3d5a6a] transition shadow-md"
                            >
                                <FaPlus /> Add Labour Assignment
                            </button>
                        </div>
                        <div className="space-y-4">
                            {assignedLabours.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-6 bg-white p-4 rounded-xl border border-[#4c7085]/10 shadow-sm">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-[#4c7085] uppercase mb-1 block">Assigned Staff (Manpower)</label>
                                        <select
                                            className={inputClasses}
                                            value={String(item.staff_member || "")}
                                            onChange={(e) => updateItem('labour', idx, 'staff_member', e.target.value)}
                                        >
                                            <option value="">Select Staff</option>
                                            {staffOptions.map(s => (
                                                <option key={s.id} value={String(s.id)}>
                                                    {s.name} ({s.employer || "Almas Movers"})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => removeItem('labour', idx, item.id)}
                                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Trucks - Unchanged */}
                        <section className={sectionClasses}>
                            <div className="flex justify-between items-center mb-6 border-b border-[#4c7085]/20 pb-2">
                                <h2 className="text-lg font-medium text-[#4c7085]">Trucks</h2>
                                <button
                                    onClick={() => addItem('truck')}
                                    className="p-2 bg-[#4c7085] text-white rounded"
                                >
                                    <FaPlus />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {assignedTrucks.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#4c7085]/10 shadow-sm">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-[#4c7085] uppercase mb-1 block">Truck Type</label>
                                            <select
                                                className={inputClasses}
                                                value={item.truck_type}
                                                onChange={(e) => updateItem('truck', idx, 'truck_type', e.target.value)}
                                            >
                                                <option value="">Select Truck</option>
                                                {truckOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="w-36">
                                            <label className="text-[10px] font-bold text-[#4c7085] uppercase mb-1 block">Quantity</label>
                                            <div className="flex items-center border border-[#6b8ca3]/50 rounded-lg overflow-hidden bg-white">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (item.quantity > 0) updateItem('truck', idx, 'quantity', Math.max(0, item.quantity - 1));
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
                                                >
                                                    <span className="text-xl font-bold">-</span>
                                                </button>

                                                <input
                                                    type="number"
                                                    className="w-16 text-center border-0 p-2 text-sm focus:ring-0"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        updateItem('truck', idx, 'quantity', Math.max(0, val));
                                                    }}
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => updateItem('truck', idx, 'quantity', item.quantity + 1)}
                                                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700"
                                                >
                                                    <span className="text-xl font-bold">+</span>
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeItem('truck', idx, item.id)}
                                            className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition self-end mb-1"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Materials - New full list with select + quantity */}
                        <section className={sectionClasses}>
                            <div className="flex justify-between items-center mb-6 border-b border-[#4c7085]/20 pb-2">
                                <h2 className="text-lg font-medium text-[#4c7085]">Materials</h2>
                                {/* No + button */}
                            </div>
                            <div className="space-y-4">
                                {assignedMaterials.length > 0 ? (
                                    assignedMaterials.map((item) => (
                                        <div key={item.material} className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#4c7085]/10 shadow-sm">
                                            <div className="flex items-center gap-4 flex-1">
                                                {/* Checkbox / Select toggle */}
                                                <input
                                                    type="checkbox"
                                                    checked={item.selected}
                                                    onChange={() => toggleMaterialSelection(item.material)}
                                                    className="h-5 w-5 text-[#4c7085] focus:ring-[#4c7085] border-gray-300 rounded"
                                                />
                                                <label className="text-sm font-medium text-[#4c7085]">
                                                    {item.name}
                                                </label>
                                            </div>

                                            <div className="w-40 flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateMaterialQuantity(item.material, -1)}
                                                    disabled={item.quantity <= 0}
                                                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                                                >
                                                    <span className="text-xl font-bold">-</span>
                                                </button>

                                                <input
                                                    type="number"
                                                    className="w-16 text-center border border-[#6b8ca3]/50 rounded p-2 text-sm focus:ring-0"
                                                    value={item.quantity}
                                                    min="0"
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        updateMaterialQuantity(item.material, val - item.quantity); // delta
                                                    }}
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => updateMaterialQuantity(item.material, 1)}
                                                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                                                >
                                                    <span className="text-xl font-bold">+</span>
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    updateMaterialQuantity(item.material, -item.quantity); // reset to 0
                                                    toggleMaterialSelection(item.material, false); // unselect
                                                }}
                                                className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                title="Remove"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-600 text-center py-4">No materials available</p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingForm;