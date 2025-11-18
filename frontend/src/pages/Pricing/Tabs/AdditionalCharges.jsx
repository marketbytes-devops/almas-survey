// src/pages/Pricing/Tabs/AdditionalChargesTab.jsx
import React, { useState, useEffect } from "react";
import Input from "../../../components/Input/index";
import { FaPlus, FaTrash, FaEdit, FaSave } from "react-icons/fa";
import apiClient from "../../../api/apiClient";

const AdditionalChargesTab = ({ dropdownData }) => {
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [newService, setNewService] = useState("");
  const [newCurrency, setNewCurrency] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newPerUnit, setNewPerUnit] = useState("1");
  const [newRateType, setNewRateType] = useState("FIX");

  const API_BASE_URL = apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await apiClient.get(`${API_BASE_URL}/additional-services/`);
      setRows(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addNewRow = () => {
    if (!newService.trim()) {
      alert("Service name is required");
      return;
    }
    const newRow = {
      id: Date.now(),
      service_name: newService,
      currency: newCurrency,
      price_per_unit: newPrice,
      per_unit_quantity: newPerUnit,
      rate_type: newRateType,
      isNew: true,
    };
    setRows([...rows, newRow]);
    resetForm();
  };

  const resetForm = () => {
    setNewService("");
    setNewPrice("");
    setNewPerUnit("1");
    setNewRateType("FIX");
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setNewService(row.service_name);
    setNewCurrency(row.currency);
    setNewPrice(row.price_per_unit);
    setNewPerUnit(row.per_unit_quantity);
    setNewRateType(row.rate_type);
  };

  const saveEdit = () => {
    if (!newService.trim()) return;
    setRows(rows.map(r =>
      r.id === editingId
        ? { ...r, service_name: newService, currency: newCurrency, price_per_unit: newPrice, per_unit_quantity: newPerUnit, rate_type: newRateType }
        : r
    ));
    setEditingId(null);
    resetForm();
  };

  const deleteRow = (id) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const handleSaveAll = async () => {
    const payload = rows.map(r => ({
      service_name: r.service_name,
      currency: dropdownData.currencies.find(c => c.id == r.currency)?.name || "QAR",
      price_per_unit: parseFloat(r.price_per_unit) || 0,
      per_unit_quantity: parseInt(r.per_unit_quantity) || 1,
      rate_type: r.rate_type,
      id: r.id > 1000 ? undefined : r.id,
    }));

    try {
      setSaving(true);
      await apiClient.post(`${API_BASE_URL}/additional-services/`, payload);
      alert("All additional services saved!");
      fetchServices();
    } catch (err) {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Additional Services</h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <input type="text" placeholder="Service Name" value={newService} onChange={e => setNewService(e.target.value)} className="px-4 py-2 border rounded-lg focus:border-blue-500 outline-none" />
          <Input type="select" options={dropdownData.currencies.map(c => ({ value: c.id, label: c.name }))} value={newCurrency} onChange={e => setNewCurrency(e.target.value)} />
          <input type="number" placeholder="Price" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="px-4 py-2 border rounded-lg focus:border-blue-500 outline-none" />
          <input type="number" placeholder="Per Unit Qty" value={newPerUnit} onChange={e => setNewPerUnit(e.target.value)} className="px-4 py-2 border rounded-lg focus:border-blue-500 outline-none" />
          <select value={newRateType} onChange={e => setNewRateType(e.target.value)} className="px-4 py-2 border rounded-lg focus:border-blue-500 outline-none">
            <option value="FIX">FIX</option>
            <option value="VARIABLE">VARIABLE</option>
          </select>
          <button onClick={editingId ? saveEdit : addNewRow} className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-6 py-2 rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2">
            {editingId ? <FaSave /> : <FaPlus />}
            <span>{editingId ? "Update" : "Add"}</span>
          </button>
        </div>

        <div className="flex justify-end mb-4">
          <button onClick={handleSaveAll} disabled={saving || rows.length === 0} className="flex items-center gap-2 px-8 py-3 bg-gradient  from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 font-semibold shadow-lg">
            <FaSave /> {saving ? "Saving..." : "SAVE ALL SERVICES"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">ADDITIONAL SERVICES</th>
                <th className="px-4 py-3 text-left">CURRENCY TYPE</th>
                <th className="px-4 py-3 text-left">PRICE PER UNIT</th>
                <th className="px-4 py-3 text-left">RATE TYPE – PER UNIT</th>
                <th className="px-4 py-3 text-left">RATE TYPE</th>
                <th className="px-4 py-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{row.service_name}</td>
                  <td className="px-4 py-3">{dropdownData.currencies.find(c => c.id == row.currency)?.name || "QAR"}</td>
                  <td className="px-4 py-3">{row.price_per_unit}</td>
                  <td className="px-4 py-3">{row.per_unit_quantity}</td>
                  <td className="px-4 py-3">{row.rate_type}</td>
                  <td className="px-4 py-3 text-center flex gap-3 justify-center">
                    <button onClick={() => startEdit(row)} className="text-blue-600 hover:text-blue-800"><FaEdit /></button>
                    <button onClick={() => deleteRow(row.id)} className="text-red-600 hover:text-red-800"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="text-center py-10 text-gray-500">No additional services added yet.</div>}
        </div>
      </div>
    </div>
  );
};

export default AdditionalChargesTab;