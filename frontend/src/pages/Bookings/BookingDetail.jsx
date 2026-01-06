/* src/pages/Bookings/BookingDetail.jsx */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowLeft, FaSave, FaEdit, FaPlus, FaTrash, FaShareAlt, FaTrashAlt } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const BookingDetail = () => {
    const { id, quotId } = useParams();
    const [searchParams] = useSearchParams();
    const isEditing = searchParams.get("edit") === "true";
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
    const [supervisorOptions, setSupervisorOptions] = useState([]);

    // Form state
    const [formData, setFormData] = useState({
        move_date: "",
        start_date: "",
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
                // Fetch options
                const [labRes, truckRes, matRes, supRes] = await Promise.all([
                    apiClient.get("/labours/"),
                    apiClient.get("/trucks/"),
                    apiClient.get("/materials/"),
                    apiClient.get("/manpower/"),
                ]);
                setLabourOptions(labRes.data);
                setTruckOptions(truckRes.data);
                setMaterialOptions(matRes.data);
                setSupervisorOptions(supRes.data);

                if (id) {
                    // Edit existing booking
                    const res = await apiClient.get(`/bookings/${id}/`);
                    const b = res.data;
                    setBooking(b);
                    setFormData({
                        move_date: b.move_date || "",
                        start_date: b.start_date || "",
                        estimated_end_time: b.estimated_end_time ? b.estimated_end_time.slice(0, 5) : "",
                        supervisor: b.supervisor || "",
                        notes: b.notes || "",
                        status: b.status || "confirmed"
                    });
                    setAssignedLabours(b.labours?.map(l => ({ ...l, isNew: false })) || []);
                    setAssignedTrucks(b.trucks?.map(t => ({ ...t, isNew: false })) || []);
                    setAssignedMaterials(b.materials?.map(m => ({ ...m, isNew: false })) || []);
                    setQuotation(b.quotation_info); // Assuming backend sends this or we fetch it
                } else if (quotId) {
                    // Create new booking from quotation
                    // Check if booking already exists for this quotation
                    try {
                        const existingRes = await apiClient.get(`/bookings/by-quotation/${quotId}/`);
                        if (existingRes.data) {
                            navigate(`/booking-detail/${existingRes.data.id}`, { replace: true });
                            return;
                        }
                    } catch (err) {
                        // Not found, proceed to create
                    }

                    const quotRes = await apiClient.get(`/quotation-create/${quotId}/`);
                    const quot = quotRes.data;
                    setQuotation(quot);

                    // Pre-fill from survey
                    const surveyRes = await apiClient.get(`/surveys/${quot.survey_id}/`);
                    const survey = surveyRes.data;
                    setFormData(prev => ({
                        ...prev,
                        move_date: survey.packing_date_from || "",
                        start_date: survey.packing_date_from || "",
                    }));
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

    const handleDeleteBooking = async () => {
        if (!window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) return;
        try {
            setLoading(true);
            await apiClient.delete(`/bookings/${id}/`);
            alert("Booking deleted successfully!");
            navigate("/booking-list");
        } catch (err) {
            console.error(err);
            setError("Failed to delete booking.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const payload = {
                ...formData,
                quotation: id ? booking.quotation : quotation.id
            };

            let currentBookingId = id;
            if (id) {
                await apiClient.patch(`/bookings/${id}/`, payload);
            } else {
                const res = await apiClient.post("/bookings/", payload);
                currentBookingId = res.data.id;
            }

            // Save assignments
            const saveAssignments = async (type, list, endpoint) => {
                for (const item of list) {
                    if (item.id && !item.isNew) {
                        await apiClient.patch(`/${endpoint}/${item.id}/`, item);
                    } else {
                        await apiClient.post(`/${endpoint}/`, { ...item, booking: currentBookingId });
                    }
                }
            };

            await Promise.all([
                saveAssignments('labour', assignedLabours, 'booking-labours'),
                saveAssignments('truck', assignedTrucks, 'booking-trucks'),
                saveAssignments('material', assignedMaterials, 'booking-materials'),
            ]);

            setSuccess("Booking saved successfully!");
            if (!id) navigate(`/booking-detail/${currentBookingId}`, { replace: true });
        } catch (err) {
            setError("Failed to save booking.");
        } finally {
            setLoading(false);
        }
    };

    const addItem = (type) => {
        if (type === 'labour') setAssignedLabours([...assignedLabours, { labour_type: "", quantity: 1, isNew: true }]);
        if (type === 'truck') setAssignedTrucks([...assignedTrucks, { truck_type: "", quantity: 1, isNew: true }]);
        if (type === 'material') setAssignedMaterials([...assignedMaterials, { material: "", quantity: 1, isNew: true }]);
    };

    const removeItem = (type, index, itemId) => {
        if (itemId && !window.confirm("Delete this from database?")) return;

        if (itemId) {
            let endpoint = type === 'labour' ? 'booking-labours' : type === 'truck' ? 'booking-trucks' : 'booking-materials';
            apiClient.delete(`/${endpoint}/${itemId}/`);
        }

        if (type === 'labour') setAssignedLabours(assignedLabours.filter((_, i) => i !== index));
        if (type === 'truck') setAssignedTrucks(assignedTrucks.filter((_, i) => i !== index));
        if (type === 'material') setAssignedMaterials(assignedMaterials.filter((_, i) => i !== index));
    };

    const updateItem = (type, index, field, value) => {
        const list = type === 'labour' ? [...assignedLabours] : type === 'truck' ? [...assignedTrucks] : [...assignedMaterials];
        list[index][field] = value;
        if (type === 'labour') setAssignedLabours(list);
        if (type === 'truck') setAssignedTrucks(list);
        if (type === 'material') setAssignedMaterials(list);
    };

    if (loading && !booking && !quotation) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;

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
                        {id ? `Edit Booking: ${booking?.booking_id}` : "Create New Booking"}
                    </h1>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition text-sm font-medium"
                    >
                        <FaSave /> Save Booking
                    </button>
                    {id && (
                        <button
                            onClick={handleDeleteBooking}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-white rounded-lg transition text-sm font-medium"
                        >
                            <FaTrashAlt /> Delete
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-10">
                {success && <div className="p-4 bg-green-100 text-green-700 rounded-lg border border-green-200 shadow-sm animate-fadeIn">{success}</div>}
                {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200 shadow-sm animate-fadeIn">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Booking Info */}
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
                                    <label className={labelClasses}>Start Date</label>
                                    <input
                                        type="date"
                                        className={inputClasses}
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
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
                                    value={formData.supervisor}
                                    onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                                >
                                    <option value="">Select Supervisor</option>
                                    {supervisorOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Quotation Info Summary */}
                    <section className={sectionClasses}>
                        <h2 className="text-lg font-medium text-[#4c7085] mb-6 border-b border-[#4c7085]/20 pb-2">Client & Move Details</h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-white/50 p-4 rounded-lg border border-[#4c7085]/10 shadow-inner">
                                <div>
                                    <span className="text-xs font-bold text-[#4c7085] uppercase tracking-wider">Quotation ID</span>
                                    <p className="text-sm font-medium text-gray-700 mt-1">{quotation?.quotation_id || "N/A"}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-[#4c7085] uppercase tracking-wider">Total Amount</span>
                                    <p className="text-sm font-medium text-indigo-700 mt-1">{quotation?.final_amount || "0"} QAR</p>
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
                    {/* Labours */}
                    <section className={sectionClasses}>
                        <div className="flex justify-between items-center mb-6 border-b border-[#4c7085]/20 pb-2">
                            <h2 className="text-lg font-medium text-[#4c7085]">Labours / Manpower</h2>
                            <button
                                onClick={() => addItem('labour')}
                                className="flex items-center gap-2 px-4 py-2 bg-[#4c7085] text-white text-xs font-medium rounded-lg hover:bg-[#3d5a6a] transition shadow-md"
                            >
                                <FaPlus /> Add Labour
                            </button>
                        </div>
                        <div className="space-y-4">
                            {assignedLabours.map((item, idx) => (
                                <div key={idx} className="flex items-end gap-6 bg-white p-4 rounded-xl border border-[#4c7085]/10 shadow-sm animate-fadeIn">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-[#4c7085] uppercase mb-1 block">Labour Type</label>
                                        <select
                                            className={inputClasses}
                                            value={item.labour_type}
                                            onChange={(e) => updateItem('labour', idx, 'labour_type', e.target.value)}
                                        >
                                            <option value="">Select Type</option>
                                            {labourOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-32">
                                        <label className="text-[10px] font-bold text-[#4c7085] uppercase mb-1 block">Quantity</label>
                                        <input
                                            type="number"
                                            className={inputClasses}
                                            value={item.quantity}
                                            onChange={(e) => updateItem('labour', idx, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeItem('labour', idx, item.id)}
                                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-100"
                                        title="Remove"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                            {assignedLabours.length === 0 && <p className="text-center text-[#4c7085]/60 py-8 italic bg-white/30 rounded-lg border-2 border-dashed border-[#4c7085]/10">No labours assigned yet. Use the button above to add manpower.</p>}
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Trucks */}
                        <section className={sectionClasses}>
                            <div className="flex justify-between items-center mb-6 border-b border-[#4c7085]/20 pb-2">
                                <h2 className="text-lg font-medium text-[#4c7085]">Trucks / Vehicles</h2>
                                <button
                                    onClick={() => addItem('truck')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#4c7085] text-white text-xs font-medium rounded-lg hover:bg-[#3d5a6a] transition shadow-md"
                                >
                                    <FaPlus /> Add
                                </button>
                            </div>
                            <div className="space-y-4">
                                {assignedTrucks.map((item, idx) => (
                                    <div key={idx} className="flex items-end gap-4 bg-white p-4 rounded-xl border border-[#4c7085]/10 shadow-sm animate-fadeIn">
                                        <div className="flex-1">
                                            <select
                                                className={inputClasses}
                                                value={item.truck_type}
                                                onChange={(e) => updateItem('truck', idx, 'truck_type', e.target.value)}
                                            >
                                                <option value="">Select Truck</option>
                                                {truckOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                className={inputClasses}
                                                value={item.quantity}
                                                onChange={(e) => updateItem('truck', idx, 'quantity', e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeItem('truck', idx, item.id)}
                                            className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                                {assignedTrucks.length === 0 && <p className="text-center text-[#4c7085]/60 py-8 italic bg-white/30 rounded-lg border-2 border-dashed border-[#4c7085]/10">No trucks assigned.</p>}
                            </div>
                        </section>

                        {/* Materials */}
                        <section className={sectionClasses}>
                            <div className="flex justify-between items-center mb-6 border-b border-[#4c7085]/20 pb-2">
                                <h2 className="text-lg font-medium text-[#4c7085]">Materials</h2>
                                <button
                                    onClick={() => addItem('material')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#4c7085] text-white text-xs font-medium rounded-lg hover:bg-[#3d5a6a] transition shadow-md"
                                >
                                    <FaPlus /> Add
                                </button>
                            </div>
                            <div className="space-y-4">
                                {assignedMaterials.map((item, idx) => (
                                    <div key={idx} className="flex items-end gap-4 bg-white p-4 rounded-xl border border-[#4c7085]/10 shadow-sm animate-fadeIn">
                                        <div className="flex-1">
                                            <select
                                                className={inputClasses}
                                                value={item.material}
                                                onChange={(e) => updateItem('material', idx, 'material', e.target.value)}
                                            >
                                                <option value="">Select Material</option>
                                                {materialOptions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                className={inputClasses}
                                                value={item.quantity}
                                                onChange={(e) => updateItem('material', idx, 'quantity', e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeItem('material', idx, item.id)}
                                            className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                                {assignedMaterials.length === 0 && <p className="text-center text-[#4c7085]/60 py-8 italic bg-white/30 rounded-lg border-2 border-dashed border-[#4c7085]/10">No materials added.</p>}
                            </div>
                        </section>
                    </div>
                </div>
                <div className="pb-10"></div>
            </div>
        </div>
    );
};

export default BookingDetail;
