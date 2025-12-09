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

const API_BASE = apiClient.defaults.baseURL || "http://127.0.0.1:8000/api";

const RemarksTab = () => {
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRemark, setEditingRemark] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
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
      title: "",
      description: "",
      category: "other",
      is_active: true,
      order: 0,
    });
  };

  const openEdit = (remark) => {
    setEditingRemark(remark);
    setFormData({
      title: remark.title,
      description: remark.description || "",
      category: remark.category,
      is_active: remark.is_active,
      order: remark.order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this remark permanently?")) return;
    await apiClient.delete(`${API_BASE}/survey-remarks/${id}/`);
    fetchRemarks();
  };

  const toggleActive = async (remark) => {
    await apiClient.post(`${API_BASE}/survey-remarks/${remark.id}/toggle_active/`);
    fetchRemarks();
  };

  if (loading) return <div className="p-10 text-center text-gray-600">Loading remarks...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          Survey Remarks
        </h2>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg font-medium"
        >
          Add Remark
        </button>
      </div>

      <div className="grid gap-5">
        {remarks.map((remark) => (
          <div
            key={remark.id}
            className={`bg-white rounded-xl shadow-md border p-6 hover:shadow-lg transition ${
              !remark.is_active ? "opacity-70" : ""
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FaCommentDots className="text-xl text-[#4c7085]" />
                  <h3 className="text-lg font-semibold">{remark.title}</h3>
                  <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                    {remark.category_display}
                  </span>
                </div>
                {remark.description && (
                  <p className="text-gray-600 text-sm mt-1 italic">{remark.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => openEdit(remark)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(remark.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Trash
                </button>
                <button onClick={() => toggleActive(remark)}>
                  {remark.is_active ? (
                    <FaToggleOn className="text-2xl text-green-600" />
                  ) : (
                    <FaToggleOff className="text-2xl text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {editingRemark ? "Edit" : "Add"} Remark
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-semibold mb-1">Title (shown in dropdown)</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:border-[#4c7085] outline-none"
                  placeholder="e.g. Long carry > 20 meters"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description (optional)</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:border-[#4c7085] outline-none"
                  placeholder="Extra details for surveyor..."
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg font-medium"
                >
                  {editingRemark ? "Update" : "Create"} Remark
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