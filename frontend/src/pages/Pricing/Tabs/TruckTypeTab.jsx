import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaToggleOn,
  FaToggleOff,
  FaTruck,
  FaSave,
  FaTimes
} from "react-icons/fa";
import apiClient from "../../../api/apiClient";

const API_BASE = apiClient.defaults.baseURL || "http://127.0.0.1:8000/api";

const TruckTypeTab = () => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    capacity_cbm: "",
    capacity_kg: "",
    price_per_trip: "",
    is_default: false,
    is_active: true,
    order: 0,
  });

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API_BASE}/truck-types/`);
      setTrucks(res.data);
    } catch (err) {
      console.error("Failed to load truck types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        capacity_cbm: parseFloat(formData.capacity_cbm) || 0,
        capacity_kg: parseInt(formData.capacity_kg) || 0,
        price_per_trip: parseFloat(formData.price_per_trip) || 0,
      };

      if (editingId) {
        await apiClient.patch(`${API_BASE}/truck-types/${editingId}/`, payload);
      } else {
        await apiClient.post(`${API_BASE}/truck-types/`, payload);
      }

      resetForm();
      fetchTrucks();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      capacity_cbm: "",
      capacity_kg: "",
      price_per_trip: "",
      is_default: false,
      is_active: true,
      order: 0,
    });
  };

  const startEdit = (truck) => {
    setEditingId(truck.id);
    setFormData({
      name: truck.name,
      capacity_cbm: truck.capacity_cbm,
      capacity_kg: truck.capacity_kg,
      price_per_trip: truck.price_per_trip,
      is_default: truck.is_default,
      is_active: truck.is_active,
      order: truck.order,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this truck type?")) return;
    try {
      await apiClient.delete(`${API_BASE}/truck-types/${id}/`);
      fetchTrucks();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const toggleActive = async (truck) => {
    try {
      await apiClient.post(`${API_BASE}/truck-types/${truck.id}/toggle_active/`);
      fetchTrucks();
    } catch (err) {
      alert("Failed to toggle active status");
    }
  };

  const setDefault = async (truck) => {
    try {
      await apiClient.post(`${API_BASE}/truck-types/${truck.id}/set_default/`);
      fetchTrucks();
    } catch (err) {
      alert("Failed to set as default");
    }
  };

  const Label = ({ children, required }) => (
    <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Form Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <h3 className="text-lg font-medium text-gray-800 mb-6 border-b border-gray-100 pb-4">Truck Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div>
            <Label required>Truck Name</Label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. 3 Ton Closed Body"
              className="input-style w-full font-medium text-gray-700"
              disabled={saving}
            />
          </div>

          <div>
            <Label required>Capacity (CBM)</Label>
            <input
              type="number"
              step="0.1"
              value={formData.capacity_cbm}
              onChange={(e) => setFormData({ ...formData, capacity_cbm: e.target.value })}
              placeholder="0.0"
              className="input-style w-full font-medium text-gray-700"
              disabled={saving}
            />
          </div>

          <div>
            <Label required>Capacity (KG)</Label>
            <input
              type="number"
              value={formData.capacity_kg}
              onChange={(e) => setFormData({ ...formData, capacity_kg: e.target.value })}
              placeholder="0"
              className="input-style w-full font-medium text-gray-700"
              disabled={saving}
            />
          </div>

          <div>
            <Label required>Price per Trip (QAR)</Label>
            <input
              type="number"
              step="0.01"
              value={formData.price_per_trip}
              onChange={(e) => setFormData({ ...formData, price_per_trip: e.target.value })}
              placeholder="0.00"
              className="input-style w-full font-medium text-gray-700"
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          {editingId && (
            <button
              onClick={resetForm}
              className="w-full sm:w-auto px-6 h-[46px] rounded-xl font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              <FaTimes /> Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.name}
            className="w-full sm:w-auto px-8 h-[46px] bg-[#4c7085] hover:bg-[#405d6f] text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                {editingId ? <FaSave /> : <FaPlus />}
                {editingId ? "Update Truck" : "Add Truck"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 sm:px-8 sm:py-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-800">Available Truck Types</h3>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-600">Loading...</div>
        ) : trucks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTruck className="text-gray-300 text-xl" />
            </div>
            <p className="text-gray-600 font-medium">No truck types configured</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest pl-8">Truck Name</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Capacity</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Price/Trip</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center">Active</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center">Default</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trucks.map((truck) => (
                    <tr key={truck.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#4c7085]/10 text-[#4c7085] flex items-center justify-center">
                            <FaTruck size={14} />
                          </div>
                          <span className="font-medium text-gray-800">{truck.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium text-sm">
                        {truck.capacity_cbm} CBM / {truck.capacity_kg} KG
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium text-sm">
                        QAR {Number(truck.price_per_trip).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => toggleActive(truck)} className="focus:outline-none">
                          {truck.is_active ? <FaToggleOn className="text-2xl text-green-500" /> : <FaToggleOff className="text-2xl text-gray-300" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!truck.is_default ? (
                          <button onClick={() => setDefault(truck)} className="text-gray-300 hover:text-yellow-500 transition-colors" title="Set Default">
                            <FaCheck />
                          </button>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium">Default</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right pr-8">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(truck)}
                            className="w-8 h-8 flex items-center justify-center text-[#4c7085] bg-gray-50 rounded-lg hover:bg-[#4c7085] hover:text-white transition-colors"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(truck.id)}
                            className="w-8 h-8 flex items-center justify-center text-red-600 bg-red-50 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {trucks.map((truck) => (
                <div key={truck.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#4c7085]/10 text-[#4c7085] flex items-center justify-center">
                        <FaTruck size={18} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{truck.name}</h4>
                        {truck.is_default && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold">DEFAULT</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleActive(truck)} className="focus:outline-none">
                        {truck.is_active ? <FaToggleOn className="text-2xl text-green-500" /> : <FaToggleOff className="text-2xl text-gray-300" />}
                      </button>
                      <button
                        onClick={() => startEdit(truck)}
                        className="w-8 h-8 flex items-center justify-center text-[#4c7085] bg-gray-50 rounded-lg"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(truck.id)}
                        className="w-8 h-8 flex items-center justify-center text-red-600 bg-red-50 rounded-lg"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl text-sm">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Capacity</p>
                      <p className="font-medium text-gray-700">{truck.capacity_cbm} CBM</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Weight</p>
                      <p className="font-medium text-gray-700">{truck.capacity_kg} KG</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Price</p>
                      <p className="font-medium text-gray-700">QAR {Number(truck.price_per_trip).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TruckTypeTab;