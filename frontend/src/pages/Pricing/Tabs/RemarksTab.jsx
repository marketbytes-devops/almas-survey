import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaCommentDots,
} from "react-icons/fa";
import apiClient from "../../../api/apiClient";
import Input from "../../../components/Input";

const API_BASE = apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

const RemarksTab = () => {
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRemark, setEditingRemark] = useState(null);

  const [formData, setFormData] = useState({
    description: "",
    is_active: true,
    order: 0,
  });

  const categories = [
    { value: "access", label: "Access Issues" },
    { value: "packing", label: "Packing Related" },
    { value: "items", label: "Special Items" },
    { value: "building", label: "Building / Elevator" },
    { value: "timing", label: "Timing / Scheduling" },
    { value: "other", label: "Other" },
  ];

  const fetchRemarks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API_BASE}/survey-remarks/`);
      setRemarks(res.data);
    } catch (err) {
      alert("Failed to load remarks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemarks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRemark) {
        await apiClient.patch(`${API_BASE}/survey-remarks/${editingRemark.id}/`, formData);
      } else {
        await apiClient.post(`${API_BASE}/survey-remarks/`, formData);
      }
      setShowModal(false);
      resetForm();
      fetchRemarks();
      alert("Remark saved!");
    } catch (err) {
      alert("Save failed");
    }
  };

  const resetForm = () => {
    setEditingRemark(null);
    setFormData({
      description: "",
      is_active: true,
      order: 0,
    });
  };

  const openEdit = (remark) => {
    setEditingRemark(remark);
    setFormData({
      description: remark.description || "",
      is_active: remark.is_active,
      order: remark.order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this remark permanently?")) return;
    try {
      await apiClient.delete(`${API_BASE}/survey-remarks/${id}/`);
      fetchRemarks();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const toggleActive = async (remark) => {
    try {
      await apiClient.post(`${API_BASE}/survey-remarks/${remark.id}/toggle_active/`);
      fetchRemarks();
    } catch (err) {
      alert("Failed");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-xl mb-2">Loading remarks...</div>
        <div className="text-sm text-gray-500">Please wait</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-medium text-gray-800 flex items-center gap-3">
            <FaCommentDots className="text-[#4c7085]" />
            Survey Remarks
          </h2>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg transition shadow-lg flex items-center justify-center gap-2 font-medium text-sm"
          >
            <FaPlus size={16} className="sm:w-5 sm:h-5" />
            Add Remark
          </button>
        </div>

        {/* Remarks List - Responsive */}
        <div className="space-y-4">
          {remarks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-base sm:text-lg mb-2">No remarks added yet.</p>
              <p className="text-sm">Create your first remark using the button above.</p>
            </div>
          ) : (
            remarks.map((remark) => (
              <div
                key={remark.id}
                className={`bg-white rounded-xl shadow-md border-2 p-5 sm:p-6 transition-all hover:shadow-lg ${!remark.is_active ? "opacity-75 border-gray-300" : "border-gray-200"
                  }`}
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-gray-700 text-sm sm:text-base whitespace-pre-wrap mt-2">
                      {remark.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <button
                      onClick={() => openEdit(remark)}
                      className="text-sm font-medium text-[#4c7085] hover:text-[#6b8ca3] transition"
                      title="Edit"
                    >
                      <FaEdit size={18} className="sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(remark.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-800 transition"
                      title="Delete"
                    >
                      <FaTrash size={18} className="sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => toggleActive(remark)}
                      className="transition text-sm font-medium"
                      title={remark.is_active ? "Deactivate" : "Activate"}
                    >
                      {remark.is_active ? (
                        <FaToggleOn className="text-2xl sm:text-3xl text-green-600" />
                      ) : (
                        <FaToggleOff className="text-2xl sm:text-3xl text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal - Add/Edit Remark */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 max-w-2xl w-full my-8">
            <h3 className="text-xl sm:text-2xl font-medium text-gray-800 mb-6">
              {editingRemark ? "Edit" : "Add"} Remark
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Description *"
                type="textarea"
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Long carry > 20 meters, elevator not available..."
                required
              />

              <div className="flex items-center gap-6 text-sm">
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
                  className="w-full sm:w-auto px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg text-sm font-medium transition shadow-lg"
                >
                  {editingRemark ? "Update Remark" : "Create Remark"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemarksTab;