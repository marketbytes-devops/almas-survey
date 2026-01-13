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
import Input from "../../../components/Input";

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
    // length_meters: "",
    // width_meters: "",
    // height_meters: "",
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
        // length_meters: formData.length_meters ? parseFloat(formData.length_meters) : null,
        // width_meters: formData.width_meters ? parseFloat(formData.width_meters) : null,
        // height_meters: formData.height_meters ? parseFloat(formData.height_meters) : null,
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
      // length_meters: "",
      // width_meters: "",
      // height_meters: "",
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
      // length_meters: truck.length_meters || "",
      // width_meters: truck.width_meters || "",
      // height_meters: truck.height_meters || "",
      is_default: truck.is_default,
      is_active: truck.is_active,
      order: truck.order,
    });
    setShowModal(true);
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

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-xl mb-2">Loading truck types...</div>
        <div className="text-sm text-gray-500">Please wait</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-medium text-gray-800 flex items-center gap-3">
            <FaTruck className="text-[#4c7085]" />
            Truck Types
          </h2>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg transition shadow-lg flex items-center justify-center gap-2 font-medium text-sm"
          >
            <FaPlus size={16} className="sm:w-5 sm:h-5" />
            Add Truck
          </button>
        </div>

        {/* Truck Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trucks.map((truck) => (
            <div
              key={truck.id}
              className={`bg-white rounded-xl shadow-md border-2 p-5 sm:p-6 relative transition-all ${truck.is_active ? "border-gray-200" : "border-gray-300 opacity-75"
                }`}
            >
              {truck.is_default && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-4 py-1 rounded-full font-medium">
                  DEFAULT
                </span>
              )}

              <div className="flex items-center gap-3 mb-4">
                <FaTruck className="text-3xl sm:text-4xl text-[#4c7085]" />
                <h3 className="text-lg sm:text-xl font-medium text-gray-800">{truck.name}</h3>
              </div>

              <div className="space-y-2 text-sm">
                <p><strong>Capacity:</strong> {truck.capacity_cbm} CBM / {truck.capacity_kg} KG</p>
                <p><strong>Price/Trip:</strong> QAR {Number(truck.price_per_trip).toLocaleString()}</p>
                {/* {(truck.length_meters || truck.width_meters || truck.height_meters) && (
                  <p>
                    <strong>Size:</strong>{" "}
                    {truck.length_meters || "-"} × {truck.width_meters || "-"} × {truck.height_meters || "-"} m
                  </p>
                )} */}
              </div>

              <div className="flex flex-wrap gap-2 mt-6">
                <button
                  onClick={() => openEdit(truck)}
                  className="flex-1 py-2 bg-[#4c7085] text-white rounded-lg hover:bg-[#6b8ca3] transition text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => handleDelete(truck.id)}
                  className="font-medium text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <FaTrash />
                </button>
                <button
                  onClick={() => toggleActive(truck)}
                  className="px-4 py-2 font-medium text-sm"
                  title={truck.is_active ? "Deactivate" : "Activate"}
                >
                  {truck.is_active ? (
                    <FaToggleOn className="text-3xl text-green-600" />
                  ) : (
                    <FaToggleOff className="text-3xl text-gray-400" />
                  )}
                </button>
                {!truck.is_default && (
                  <button
                    onClick={() => setDefault(truck)}
                    className="px-4 py-2 font-medium text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                    title="Set as Default"
                  >
                    <FaCheck />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal - Add/Edit Truck */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 max-w-2xl w-full my-8">
              <h3 className="text-xl sm:text-2xl font-medium text-gray-800 mb-6">
                {editingTruck ? "Edit" : "Add"} Truck Type
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Truck Name *"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Capacity (CBM) *"
                    type="number"
                    step="0.1"
                    value={formData.capacity_cbm}
                    onChange={(e) => setFormData({ ...formData, capacity_cbm: e.target.value })}
                    required
                  />

                  <Input
                    label="Capacity (KG) *"
                    type="number"
                    value={formData.capacity_kg}
                    onChange={(e) => setFormData({ ...formData, capacity_kg: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Price per Trip (QAR) *"
                  type="number"
                  step="0.01"
                  value={formData.price_per_trip}
                  onChange={(e) => setFormData({ ...formData, price_per_trip: e.target.value })}
                  required
                />

                {/* <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Length (m)"
                    type="number"
                    step="0.01"
                    value={formData.length_meters}
                    onChange={(e) => setFormData({ ...formData, length_meters: e.target.value })}
                  />

                  <Input
                    label="Width (m)"
                    type="number"
                    step="0.01"
                    value={formData.width_meters}
                    onChange={(e) => setFormData({ ...formData, width_meters: e.target.value })}
                  />

                  <Input
                    label="Height (m)"
                    type="number"
                    step="0.01"
                    value={formData.height_meters}
                    onChange={(e) => setFormData({ ...formData, height_meters: e.target.value })}
                  />
                </div> */}

                <div className="flex flex-wrap gap-6 text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="w-5 h-5 text-[#4c7085] rounded focus:ring-[#4c7085]"
                    />
                    <span>Set as Default</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-[#4c7085] rounded focus:ring-[#4c7085]"
                    />
                    <span>Active</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full sm:w-auto px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg font-medium text-sm transition shadow-lg"
                  >
                    {editingTruck ? "Update Truck" : "Create Truck"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TruckTypeTab;