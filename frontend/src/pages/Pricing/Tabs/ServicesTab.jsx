// frontend/src/components/Pricing/Tabs/ServicesTab.jsx
import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaSave, FaEdit2, FaCheck } from "react-icons/fa";
import apiClient from "../../../api/apiClient";

const ServicesTab = () => {
  const [services, setServices] = useState([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API_BASE_URL = apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

  // Fetch all services
  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API_BASE_URL}/additional-services/`);
      setServices(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch services:", err);
      alert("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Add new service
  const handleAddService = async () => {
    if (!newServiceName.trim()) {
      alert("Service name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.post(`${API_BASE_URL}/additional-services/`, {
        name: newServiceName.trim(),
      });
      setServices([...services, res.data]);
      setNewServiceName("");
      alert("Service added successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.name?.[0] || "Failed to add service");
    } finally {
      setSaving(false);
    }
  };

  // Update service
  const startEdit = (service) => {
    setEditingId(service.id);
    setEditName(service.name);
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) {
      alert("Service name cannot be empty");
      return;
    }

    try {
      const res = await apiClient.patch(`${API_BASE_URL}/additional-services/${id}/`, {
        name: editName.trim(),
      });
      setServices(services.map(s => s.id === id ? res.data : s));
      setEditingId(null);
      setEditName("");
    } catch (err) {
      alert("Failed to update service");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  // Delete service
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;

    try {
      await apiClient.delete(`${API_BASE_URL}/additional-services/${id}/`);
      setServices(services.filter(s => s.id !== id));
      alert("Service deleted");
    } catch (err) {
      alert("Cannot delete: This service might be used in surveys/quotations");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4c7085]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Add New Service */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Service</h3>
        <div className="flex gap-4 max-w-2xl">
          <input
            type="text"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddService()}
            placeholder="Enter service name (e.g., Boom Truck, Curtain Installation)"
            className="flex-1 px-5 py-3 border border-gray-300 rounded-lg focus:border-[#4c7085] focus:ring-4 focus:ring-[#4c7085]/20 outline-none text-lg"
          />
          <button
            onClick={handleAddService}
            disabled={saving || !newServiceName.trim()}
            className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:from-[#3a586d] hover:to-[#54738a] transition disabled:opacity-60 font-medium"
          >
            <FaPlus size={20} />
            <span>{saving ? "Adding..." : "Add Service"}</span>
          </button>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800">All Additional Services ({services.length})</h3>
        </div>

        {services.length === 0 ? (
          <div className="p-20 text-center text-gray-500">
            <p className="text-xl">No services added yet.</p>
            <p>Add your first service above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-6 hover:bg-gray-50 transition flex items-center justify-between"
              >
                <div className="flex-1">
                  {editingId === service.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-4 py-2 border border-[#4c7085] rounded-lg text-lg font-medium focus:outline-none focus:ring-4 focus:ring-[#4c7085]/20"
                      autoFocus
                    />
                  ) : (
                    <span className="text-lg font-medium text-gray-800">
                      {service.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {editingId === service.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(service.id)}
                        className="p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                      >
                        <FaCheck size={18} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(service)}
                        className="p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      >
                        <FaEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      >
                        <FaTrash size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesTab;