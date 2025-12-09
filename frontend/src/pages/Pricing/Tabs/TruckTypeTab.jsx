import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaToggleOn,
  FaToggleOff,
  FaTruck,
} from "react-icons/fa";
import apiClient from "../../../api/apiClient";

const API_BASE = apiClient.defaults.baseURL || "http://127.0.0.1:8000/api";

const TruckTypeTab = () => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    capacity_cbm: "",
    capacity_kg: "",
    price_per_trip: "",
    length_meters: "",
    width_meters: "",
    height_meters: "",
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
      alert("Failed to load truck types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrucks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        capacity_cbm: parseFloat(formData.capacity_cbm) || 0,
        capacity_kg: parseInt(formData.capacity_kg) || 0,
        price_per_trip: parseFloat(formData.price_per_trip) || 0,
        length_meters: formData.length_meters ? parseFloat(formData.length_meters) : null,
        width_meters: formData.width_meters ? parseFloat(formData.width_meters) : null,
        height_meters: formData.height_meters ? parseFloat(formData.height_meters) : null,
      };

      if (editingTruck) {
        await apiClient.patch(`${API_BASE}/truck-types/${editingTruck.id}/`, payload);
      } else {
        await apiClient.post(`${API_BASE}/truck-types/`, payload);
      }

      setShowModal(false);
      resetForm();
      fetchTrucks();
      alert("Truck saved!");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  const resetForm = () => {
    setEditingTruck(null);
    setFormData({
      name: "",
      capacity_cbm: "",
      capacity_kg: "",
      price_per_trip: "",
      length_meters: "",
      width_meters: "",
      height_meters: "",
      is_default: false,
      is_active: true,
      order: 0,
    });
  };

  const openEdit = (truck) => {
    setEditingTruck(truck);
    setFormData({
      name: truck.name,
      capacity_cbm: truck.capacity_cbm,
      capacity_kg: truck.capacity_kg,
      price_per_trip: truck.price_per_trip,
      length_meters: truck.length_meters || "",
      width_meters: truck.width_meters || "",
      height_meters: truck.height_meters || "",
      is_default: truck.is_default,
      is_active: truck.is_active,
      order: truck.order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this truck type?")) return;
    await apiClient.delete(`${API_BASE}/truck-types/${id}/`);
    fetchTrucks();
  };

  const toggleActive = async (truck) => {
    await apiClient.post(`${API_BASE}/truck-types/${truck.id}/toggle_active/`);
    fetchTrucks();
  };

  const setDefault = async (truck) => {
    await apiClient.post(`${API_BASE}/truck-types/${truck.id}/set_default/`);
    fetchTrucks();
  };

  if (loading) return <div className="p-10 text-center">Loading truck types...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          Truck Types
        </h2>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg font-medium"
        >
          Add Truck
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trucks.map((truck) => (
          <div
            key={truck.id}
            className={`bg-white rounded-xl shadow-md border p-6 relative ${!truck.is_active ? "opacity-70" : ""}`}
          >
            {truck.is_default && (
              <span className="absolute top-2 right-2 bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                DEFAULT
              </span>
            )}

            <div className="flex items-center gap-3 mb-4">
              <FaTruck className="text-4xl text-[#4c7085]" />
              <h3 className="text-xl font-bold">{truck.name}</h3>
            </div>

            <div className="space-y-2 text-sm">
              <p><strong>Capacity:</strong> {truck.capacity_cbm} CBM / {truck.capacity_kg} KG</p>
              <p><strong>Price/Trip:</strong> QAR {truck.price_per_trip.toLocaleString()}</p>
              {truck.dimensions !== "Not specified" && (
                <p><strong>Size:</strong> {truck.dimensions}</p>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => openEdit(truck)} className="flex-1 py-2 bg-blue-600 text-white rounded text-sm">
                Edit
              </button>
              <button onClick={() => handleDelete(truck.id)} className="px-4 py-2 bg-red-600 text-white rounded">
                Trash
              </button>
              <button onClick={() => toggleActive(truck)}>
                {truck.is_active ? <FaToggleOn className="text-3xl text-green-600" /> : <FaToggleOff className="text-3xl text-gray-400" />}
              </button>
              {!truck.is_default && (
                <button onClick={() => setDefault(truck)} className="px-4 py-2 bg-yellow-600 text-white rounded">
                  Check
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {editingTruck ? "Edit" : "Add"} Truck Type
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-semibold">Truck Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold">Capacity (CBM)</label>
                  <input type="number" step="0.1" required value={formData.capacity_cbm} onChange={e => setFormData({...formData, capacity_cbm: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold">Capacity (KG)</label>
                  <input type="number" required value={formData.capacity_kg} onChange={e => setFormData({...formData, capacity_kg: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block font-semibold">Price per Trip (QAR)</label>
                <input type="number" step="0.01" required value={formData.price_per_trip} onChange={e => setFormData({...formData, price_per_trip: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600">Length (m)</label>
                  <input type="number" step="0.01" value={formData.length_meters} onChange={e => setFormData({...formData, length_meters: e.target.value})} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Width (m)</label>
                  <input type="number" step="0.01" value={formData.width_meters} onChange={e => setFormData({...formData, width_meters: e.target.value})} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Height (m)</label>
                  <input type="number" step="0.01" value={formData.height_meters} onChange={e => setFormData({...formData, height_meters: e.target.value})} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} />
                  <span>Set as Default</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                  <span>Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-8 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg">
                  {editingTruck ? "Update" : "Create"} Truck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TruckTypeTab;