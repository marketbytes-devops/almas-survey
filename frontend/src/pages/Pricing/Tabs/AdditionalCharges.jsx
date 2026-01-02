import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaEdit, FaSave, FaCheckCircle } from "react-icons/fa";
import apiClient from "../../../api/apiClient";
import Input from "../../../components/Input";

const AdditionalChargesTab = ({ dropdownData }) => {
  const [rows, setRows] = useState([]);
  const [masterServices, setMasterServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [currency, setCurrency] = useState("");
  const [price, setPrice] = useState("");
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
        setMasterServices(servicesRes.data);

        // Safe normalization: ensure service object always exists
        const normalizedCharges = (chargesRes.data || []).map(row => ({
          ...row,
          service: row.service || { id: null, name: "— (Missing)" }, // ← Prevents null crash
          price_per_unit: Number(row.price_per_unit),
          per_unit_quantity: Number(row.per_unit_quantity),
        }));
        setRows(normalizedCharges);
      } catch (err) {
        alert("Could not load additional services. Check console for details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatPrice = (value) => {
    if (value == null) return "—";
    const num = Number(value);
    return isNaN(num) ? "—" : num.toFixed(2);
  };

  const handleAddOrUpdate = async () => {
    if (!selectedServiceId) {
      alert("Please select a service");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    const serviceObj = masterServices.find((s) => s.id === parseInt(selectedServiceId));
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
      per_unit_quantity: 1,
      rate_type: rateType,
    };

    try {
      if (editingId && !String(editingId).startsWith("temp_")) {
        const updatePayload = {
          service_id: serviceObj.id,
          currency: currency ? parseInt(currency) : null,
          price_per_unit: parseFloat(price),
          per_unit_quantity: 1,
          rate_type: rateType,
        };
        await apiClient.patch(`/quotation-additional-charges/${editingId}/`, updatePayload);
        setRows(rows.map((r) => (r.id === editingId ? newRow : r)));
      } else {
        if (editingId) {
          setRows(rows.map((r) => (r.id === editingId ? newRow : r)));
        } else {
          setRows([...rows, newRow]);
        }
      }

      setEditingId(null);
      setSelectedServiceId("");
      setCurrency("");
      setPrice("");
      setRateType("FIX");
    } catch (err) {
      alert("Failed to update service:\n" + JSON.stringify(err.response?.data || err.message, null, 2));
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setSelectedServiceId(row.service?.id || ""); // Safe access
    setCurrency(row.currency || "");
    setPrice(row.price_per_unit);
    setRateType(row.rate_type);
  };

  const deleteRow = async (id) => {
    if (String(id).startsWith("temp_")) {
      setRows(rows.filter((r) => r.id !== id));
      return;
    }

    if (!window.confirm("Are you sure you want to delete this service?")) return;

    try {
      await apiClient.delete(`/quotation-additional-charges/${id}/`);
      setRows(rows.filter((r) => r.id !== id));
      alert("Service deleted successfully!");
    } catch (err) {
      alert("Failed to delete service:\n" + JSON.stringify(err.response?.data || err.message, null, 2));
    }
  };

  const handleSaveAll = async () => {
    if (rows.length === 0) {
      alert("No services to save");
      return;
    }

    const unsavedRows = rows.filter((r) => String(r.id).startsWith("temp_"));
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

    try {
      setSaving(true);
      setSaveSuccess(false);
      await apiClient.post("/quotation-additional-charges/", payload);
      const refreshRes = await apiClient.get("/quotation-additional-charges/");
      const normalized = (refreshRes.data || []).map(row => ({
        ...row,
        service: row.service || { id: null, name: "— (Missing)" }, // ← Safe here too
        price_per_unit: Number(row.price_per_unit),
        per_unit_quantity: Number(row.per_unit_quantity),
      }));
      setRows(normalized);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      alert(`${unsavedRows.length} service(s) saved successfully!`);
    } catch (err) {
      alert("Save failed:\n" + JSON.stringify(err.response?.data || err.message, null, 2));
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

  const unsavedCount = rows.filter((r) => String(r.id).startsWith("temp_")).length;

  const serviceOptions = masterServices.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const currencyOptions = (dropdownData.currencies || []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const rateTypeOptions = [
    { value: "FIX", label: "FIX" },
    { value: "VARIABLE", label: "VARIABLE" },
    { value: "Hourly", label: "Hourly" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {saveSuccess && (
        <div className="mx-4 p-4 bg-green-100 text-green-700 rounded-lg text-center font-medium flex items-center justify-center gap-3">
          <FaCheckCircle className="text-xl sm:text-2xl" />
          <span>All services saved successfully!</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-2xl font-medium text-gray-800 mb-6">Additional Services Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <Input
            label="Service *"
            type="select"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            options={[{ value: "", label: "Select Service" }, ...serviceOptions]}
          />

          <Input
            label="Currency"
            type="select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={[{ value: "", label: "Select Currency" }, ...currencyOptions]}
          />

          <Input
            label="Price per Unit *"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <Input
            label="Per Unit Quantity"
            name="perUnitQuantityDisplay"
            type="number"
            placeholder="1"
            value="1"
            readOnly
            className="bg-gray-100 cursor-not-allowed"
          />

          <Input
            label="Rate Type"
            type="select"
            value={rateType}
            onChange={(e) => setRateType(e.target.value)}
            options={rateTypeOptions}
          />

          <div className="flex items-end">
            <button
              onClick={handleAddOrUpdate}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:scale-105 transition font-medium flex items-center justify-center gap-2 text-sm"
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
        </div>

        <div className="flex justify-center sm:justify-end mb-6">
          <button
            onClick={handleSaveAll}
            disabled={saving || unsavedCount === 0}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium shadow-lg transition flex items-center justify-center gap-3 text-sm ${saving || unsavedCount === 0
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              }`}
          >
            <FaSave />
            {saving
              ? "Saving..."
              : unsavedCount > 0
                ? `SAVE ${unsavedCount} NEW SERVICE${unsavedCount > 1 ? "S" : ""}`
                : "ALL SAVED"}
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border-2 border-gray-300">
          <table className="hidden md:table w-full">
            <thead className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium">STATUS</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium">SERVICE NAME</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium">CURRENCY</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium">PRICE</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium">QTY</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium">RATE TYPE</th>
                <th className="px-4 py-3 text-center text-xs sm:text-sm font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => {
                const currencyName = dropdownData.currencies?.find((c) => c.id === row.currency)?.name || "QAR";
                const isSaved = !String(row.id).startsWith("temp_");

                return (
                  <tr key={row.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${isSaved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {isSaved ? "SAVED" : "UNSAVED"}
                      </span>
                    </td>
                    {/* SAFE ACCESS: No more crash if service is null */}
                    <td className="px-4 py-3 font-medium text-gray-800 text-sm">
                      {row.service?.name || "— (Missing)"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{currencyName}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{formatPrice(row.price_per_unit)}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{row.per_unit_quantity}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${row.rate_type === "FIX" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                          }`}
                      >
                        {row.rate_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <button onClick={() => startEdit(row)} className="text-[#4c7085] hover:text-[#6b8ca3] transition" title="Edit">
                          <FaEdit size={18} />
                        </button>
                        <button onClick={() => deleteRow(row.id)} className="text-red-600 hover:text-red-800 transition" title="Delete">
                          <FaTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile View - Also Safe */}
          <div className="md:hidden space-y-4 p-4">
            {rows.map((row) => {
              const currencyName = dropdownData.currencies?.find((c) => c.id === row.currency)?.name || "QAR";
              const isSaved = !String(row.id).startsWith("temp_");

              return (
                <div key={row.id} className="bg-gray-50 rounded-lg border border-gray-300 p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${isSaved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {isSaved ? "SAVED" : "UNSAVED"}
                    </span>
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(row)} className="text-[#4c7085] hover:text-[#6b8ca3]">
                        <FaEdit size={20} />
                      </button>
                      <button onClick={() => deleteRow(row.id)} className="text-red-600 hover:text-red-800">
                        <FaTrash size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {/* SAFE ACCESS */}
                    <div className="font-medium text-gray-800">
                      {row.service?.name || "— (Missing)"}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-gray-700">
                      <div>
                        <span className="font-medium">Currency:</span> {currencyName}
                      </div>
                      <div>
                        <span className="font-medium">Price:</span> {formatPrice(row.price_per_unit)}
                      </div>
                      <div>
                        <span className="font-medium">Qty:</span> {row.per_unit_quantity}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${row.rate_type === "FIX" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                            }`}
                        >
                          {row.rate_type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {rows.length === 0 && (
            <div className="text-center py-16 text-gray-500">
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