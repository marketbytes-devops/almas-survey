import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaEdit, FaSave, FaCheckCircle } from "react-icons/fa";
import apiClient from "../../../api/apiClient";

const AdditionalChargesTab = ({ dropdownData }) => {
  const [rows, setRows] = useState([]);
  const [masterServices, setMasterServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [currency, setCurrency] = useState("");
  const [price, setPrice] = useState("");
  const [perUnitQty, setPerUnitQty] = useState("1");
  const [rateType, setRateType] = useState("FIX");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [servicesRes, chargesRes] = await Promise.all([
          apiClient.get("/survey-additional-services/"),
          apiClient.get("/quotation-additional-charges/"),
        ]);

        console.log("✅ Loaded services:", servicesRes.data);
        console.log("✅ Loaded charges:", chargesRes.data);

        setMasterServices(servicesRes.data);
        setRows(chargesRes.data || []);
      } catch (err) {
        console.error("❌ Failed to load data:", err);
        console.error("Error details:", err.response?.data);
        alert("Could not load additional services. Check console for details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddOrUpdate = () => {
    if (!selectedServiceId) {
      alert("Please select a service");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    const serviceObj = masterServices.find(
      (s) => s.id === parseInt(selectedServiceId)
    );
    if (!serviceObj) {
      alert("Service not found");
      return;
    }

    const newRow = {
      id: editingId || `temp_${Date.now()}`,
      service: { id: serviceObj.id, name: serviceObj.name },
      service_id: serviceObj.id,
      currency: currency ? parseInt(currency) : null,
      price_per_unit: parseFloat(price),
      per_unit_quantity: parseInt(perUnitQty) || 1,
      rate_type: rateType,
    };

    if (editingId) {
      setRows(rows.map((r) => (r.id === editingId ? newRow : r)));
      setEditingId(null);
    } else {
      setRows([...rows, newRow]);
    }

    setSelectedServiceId("");
    setCurrency("");
    setPrice("");
    setPerUnitQty("1");
    setRateType("FIX");
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setSelectedServiceId(row.service.id);
    setCurrency(row.currency || "");
    setPrice(row.price_per_unit);
    setPerUnitQty(row.per_unit_quantity);
    setRateType(row.rate_type);
  };

  // 🔥 FIXED: Delete from database AND frontend
  const deleteRow = async (id) => {
    // Check if it's a temporary row (not saved yet)
    if (String(id).startsWith("temp_")) {
      setRows(rows.filter((r) => r.id !== id));
      return;
    }

    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this service?")) {
      return;
    }

    try {
      console.log(`🗑️ Deleting service with ID: ${id}`);
      
      // Delete from database
      await apiClient.delete(`/quotation-additional-charges/${id}/`);
      
      console.log("✅ Service deleted from database");
      
      // Remove from frontend state
      setRows(rows.filter((r) => r.id !== id));
      
      alert("Service deleted successfully!");
    } catch (err) {
      console.error("❌ Delete failed:", err);
      console.error("Error response:", err.response?.data);
      alert(
        "Failed to delete service:\n" +
        JSON.stringify(err.response?.data || err.message, null, 2)
      );
    }
  };

  const handleSaveAll = async () => {
    if (rows.length === 0) {
      alert("No services to save");
      return;
    }

    // Filter out already saved rows (those with real IDs)
    const unsavedRows = rows.filter(r => String(r.id).startsWith("temp_"));
    
    if (unsavedRows.length === 0) {
      alert("All services are already saved!");
      return;
    }

    const payload = unsavedRows.map((r) => ({
      service_id: r.service?.id || r.service_id,
      currency: r.currency || null,
      price_per_unit: parseFloat(r.price_per_unit),
      per_unit_quantity: parseInt(r.per_unit_quantity),
      rate_type: r.rate_type,
    }));

    console.log("💾 Saving payload:", payload);

    try {
      setSaving(true);
      setSaveSuccess(false);

      const response = await apiClient.post(
        "/quotation-additional-charges/",
        payload
      );

      console.log("✅ Save successful:", response.data);

      // Refresh from server to get real DB IDs
      const refreshRes = await apiClient.get("/quotation-additional-charges/");
      setRows(refreshRes.data);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      alert(`✅ ${unsavedRows.length} service(s) saved successfully!`);
    } catch (err) {
      console.error("❌ Save failed:", err);
      console.error("Error response:", err.response?.data);
      alert(
        "Save failed:\n" +
        JSON.stringify(err.response?.data || err.message, null, 2)
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-xl mb-2">Loading additional services...</div>
        <div className="text-sm text-gray-500">Please wait</div>
      </div>
    );
  }

  // Count unsaved rows
  const unsavedCount = rows.filter(r => String(r.id).startsWith("temp_")).length;

  return (
    <div className="space-y-8">
      {saveSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg flex items-center gap-3">
          <FaCheckCircle className="text-2xl" />
          <span className="font-medium">
            All services saved successfully! Data will persist after refresh.
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Additional Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
          >
            <option value="">Select Service</option>
            {masterServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
          >
            <option value="">Currency</option>
            {(dropdownData.currencies || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
          />
          <input
            type="number"
            placeholder="Per Unit Qty"
            value={perUnitQty}
            onChange={(e) => setPerUnitQty(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
          />
          <select
            value={rateType}
            onChange={(e) => setRateType(e.target.value)}
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
          >
            <option value="FIX">FIX</option>
            <option value="VARIABLE">VARIABLE</option>
          </select>
          <button
            onClick={handleAddOrUpdate}
            className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-6 py-2 rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2 font-semibold"
          >
            {editingId ? (
              <>
                <FaSave /> Update
              </>
            ) : (
              <>
                <FaPlus /> Add
              </>
            )}
          </button>
        </div>
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSaveAll}
            disabled={saving || unsavedCount === 0}
            className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold shadow-lg transition ${
              saving || unsavedCount === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            }`}
          >
            <FaSave />
            {saving 
              ? "Saving..." 
              : unsavedCount > 0 
              ? `SAVE ${unsavedCount} NEW SERVICE${unsavedCount > 1 ? 'S' : ''}`
              : "ALL SAVED"}
          </button>
        </div>
        <div className="overflow-x-auto border-2 border-gray-300 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">STATUS</th>
                <th className="px-4 py-3 text-left">SERVICE NAME</th>
                <th className="px-4 py-3 text-left">CURRENCY</th>
                <th className="px-4 py-3 text-left">PRICE PER UNIT</th>
                <th className="px-4 py-3 text-left">PER UNIT QTY</th>
                <th className="px-4 py-3 text-left">RATE TYPE</th>
                <th className="px-4 py-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const currencyName =
                  dropdownData.currencies?.find((c) => c.id === row.currency)
                    ?.name || "QAR";
                const isSaved = !String(row.id).startsWith("temp_");

                return (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {isSaved ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          SAVED
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                          UNSAVED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {row.service.name}
                    </td>
                    <td className="px-4 py-3">{currencyName}</td>
                    <td className="px-4 py-3">{row.price_per_unit}</td>
                    <td className="px-4 py-3">{row.per_unit_quantity}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          row.rate_type === "FIX"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {row.rate_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center flex gap-3 justify-center">
                      <button
                        onClick={() => startEdit(row)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No additional services added yet.</p>
              <p className="text-sm">Use the form above to add services.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdditionalChargesTab;