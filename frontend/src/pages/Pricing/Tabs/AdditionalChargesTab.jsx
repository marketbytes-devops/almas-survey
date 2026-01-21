import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaEdit, FaSave, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../../api/apiClient";
import { usePermissions } from "../../../components/PermissionsContext/PermissionsContext";

const AdditionalChargesTab = ({ dropdownData }) => {
  const { hasPermission } = usePermissions();
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

        // Safe normalization
        const normalizedCharges = (chargesRes.data || []).map(row => ({
          ...row,
          service: row.service || { id: null, name: "— (Missing)" },
          price_per_unit: Number(row.price_per_unit),
          per_unit_quantity: Number(row.per_unit_quantity),
        }));
        setRows(normalizedCharges);
      } catch (err) {
        console.error("Error loading data:", err);
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
    if (editingId) {
      if (!hasPermission("local_move", "edit")) {
        alert("Permission denied");
        return;
      }
    } else {
      if (!hasPermission("local_move", "add")) {
        alert("Permission denied");
        return;
      }
    }

    if (!selectedServiceId) {
      alert("Please select a service");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    const serviceObj = masterServices.find((s) => s.id === parseInt(selectedServiceId));
    if (!serviceObj) return;

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
      alert("Failed to update service");
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setSelectedServiceId(row.service?.id || "");
    setCurrency(row.currency || "");
    setPrice(row.price_per_unit);
    setRateType(row.rate_type);
  };

  const deleteRow = async (id) => {
    if (!hasPermission("local_move", "delete")) {
      alert("Permission denied");
      return;
    }

    if (String(id).startsWith("temp_")) {
      setRows(rows.filter((r) => r.id !== id));
      return;
    }

    if (!window.confirm("Are you sure you want to delete this service?")) return;

    try {
      await apiClient.delete(`/quotation-additional-charges/${id}/`);
      setRows(rows.filter((r) => r.id !== id));
    } catch (err) {
      alert("Failed to delete service");
    }
  };

  const handleSaveAll = async () => {
    if (!hasPermission("local_move", "add") && !hasPermission("local_move", "edit")) {
      alert("Permission denied");
      return;
    }
    if (rows.length === 0) return;

    const unsavedRows = rows.filter((r) => String(r.id).startsWith("temp_"));
    if (unsavedRows.length === 0) return;

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
        service: row.service || { id: null, name: "— (Missing)" },
        price_per_unit: Number(row.price_per_unit),
        per_unit_quantity: Number(row.per_unit_quantity),
      }));
      setRows(normalized);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-sm font-medium">Loading additional services...</div>
      </div>
    );
  }

  const unsavedCount = rows.filter((r) => String(r.id).startsWith("temp_")).length;
  const Label = ({ children, required }) => (
    <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl text-center font-medium flex items-center justify-center gap-3 shadow-sm"
          >
            <FaCheckCircle className="text-xl" />
            <span>All services saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <h3 className="text-lg font-medium text-gray-800 mb-6 border-b border-gray-100 pb-4">Service Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <Label required>Service Name</Label>
            <div className="relative">
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="input-style w-full font-medium text-gray-700 appearance-none"
              >
                <option value="">Select Service</option>
                {masterServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-600">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>

          <div>
            <Label required>Currency</Label>
            <div className="relative">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input-style w-full font-medium text-gray-700 appearance-none"
              >
                <option value="">Currency</option>
                {(dropdownData.currencies || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-600">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>

          <div>
            <Label required>Price</Label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-style w-full font-medium text-gray-700"
            />
          </div>

          <div>
            <Label>Quantity</Label>
            <input
              type="text"
              value="1"
              readOnly
              className="input-style w-full bg-gray-50 text-gray-600 cursor-not-allowed font-medium text-center"
            />
          </div>

          <div>
            <Label>Rate Type</Label>
            <div className="relative">
              <select
                value={rateType}
                onChange={(e) => setRateType(e.target.value)}
                className="input-style w-full font-medium text-gray-700 appearance-none"
              >
                <option value="FIX">FIX</option>
                <option value="VARIABLE">VARIABLE</option>
                <option value="Hourly">Hourly</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-600">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-100">
          {(editingId ? hasPermission("local_move", "edit") : hasPermission("local_move", "add")) && (
            <button
              onClick={handleAddOrUpdate}
              className="btn-secondary w-full sm:w-auto"
            >
              {editingId ? <><FaSave className="w-4 h-4" /> <span className="pl-2">Update Service</span></> : <><FaPlus className="w-4 h-4" /> <span className="pl-2">Add Service</span></>}
            </button>
          )}

          <div className="flex-1"></div>

          {(hasPermission("local_move", "add") || hasPermission("local_move", "edit")) && (
            <button
              onClick={handleSaveAll}
              disabled={saving || unsavedCount === 0}
              className={`btn-primary w-full sm:w-auto ${saving || unsavedCount === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FaSave className="w-4 h-4" />
              {saving
                ? "Saving..."
                : unsavedCount > 0
                  ? `Save ${unsavedCount} Service${unsavedCount > 1 ? "s" : ""}`
                  : "All Saved"}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-800">Additional Charges List</h3>
        </div>

        {rows.length === 0 ? (
          <div className="p-16 text-center text-gray-600">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#4c7085]">
              <FaExclamationCircle className="text-2xl opacity-50" />
            </div>
            <p className="text-lg font-medium text-gray-600 mb-1">No additional charges found</p>
            <p className="text-xs text-gray-600">Add a new service charge using the form above.</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left min-w-max">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Service Name</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Currency</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Price</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Qty</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Rate Type</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => {
                    const currencyName = dropdownData.currencies?.find((c) => c.id === row.currency)?.name || "QAR";
                    const isSaved = !String(row.id).startsWith("temp_");

                    return (
                      <tr key={row.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium tracking-wider ${isSaved ? "bg-green-50 text-green-700 border border-green-100" : "bg-yellow-50 text-yellow-700 border border-yellow-100"}`}>
                            {isSaved ? "SAVED" : "UNSAVED"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                          {row.service?.name || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{currencyName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatPrice(row.price_per_unit)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.per_unit_quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium tracking-wider ${row.rate_type === "FIX" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-purple-50 text-purple-700 border border-purple-100"}`}>
                            {row.rate_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {hasPermission("local_move", "edit") && (
                              <button
                                onClick={() => startEdit(row)}
                                className="w-8 h-8 flex items-center justify-center text-[#4c7085] hover:bg-[#4c7085]/10 rounded-lg transition-colors"
                              >
                                <FaEdit />
                              </button>
                            )}
                            {hasPermission("local_move", "delete") && (
                              <button
                                onClick={() => deleteRow(row.id)}
                                className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden p-4 space-y-4">
              {rows.map((row) => {
                const currencyName = dropdownData.currencies?.find((c) => c.id === row.currency)?.name || "QAR";
                const isSaved = !String(row.id).startsWith("temp_");

                return (
                  <div key={row.id} className="bg-gray-50/50 rounded-xl border border-gray-100 p-5">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium tracking-wider ${isSaved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {isSaved ? "SAVED" : "UNSAVED"}
                      </span>
                      <div className="flex gap-2">
                        {hasPermission("local_move", "edit") && (
                          <button onClick={() => startEdit(row)} className="p-2 text-[#4c7085] bg-white rounded-lg shadow-sm border border-gray-100">
                            <FaEdit />
                          </button>
                        )}
                        {hasPermission("local_move", "delete") && (
                          <button onClick={() => deleteRow(row.id)} className="p-2 text-red-500 bg-white rounded-lg shadow-sm border border-gray-100">
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>

                    <h4 className="font-medium text-gray-800 mb-4 text-base">{row.service?.name}</h4>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Price</p>
                        <p className="font-medium text-gray-700">{formatPrice(row.price_per_unit)} {currencyName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Type</p>
                        <span className={`px-2 py-0.5 rounded textxs font-medium ${row.rate_type === "FIX" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                          {row.rate_type}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AdditionalChargesTab;