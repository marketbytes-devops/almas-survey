import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import apiClient from "../../../api/apiClient";
import Input from "../../../components/Input";
import RichTextEditor from "../../../components/RichTextEditor";

const API_BASE = apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

const PaymentTermsTab = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    advance_percentage: "50.00",
    advance_due_on: "survey",
    balance_due_on: "delivery",
    is_default: false,
    is_active: true,
    order: 0,
  });

  const dueOptions = [
    { value: "survey", label: "Upon Survey Confirmation" },
    { value: "packing", label: "Before Packing" },
    { value: "delivery", label: "On Delivery" },
    { value: "after_delivery", label: "After Delivery (Net 7/15/30)" },
  ];

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API_BASE}/payment-terms/`);
      setTerms(res.data);
    } catch (err) {
      alert("Failed to load payment terms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        advance_percentage: parseFloat(formData.advance_percentage),
      };

      if (editingTerm) {
        await apiClient.patch(`${API_BASE}/payment-terms/${editingTerm.id}/`, payload);
      } else {
        await apiClient.post(`${API_BASE}/payment-terms/`, payload);
      }

      setShowModal(false);
      resetForm();
      fetchTerms();
      alert(editingTerm ? "Updated!" : "Created!");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  const resetForm = () => {
    setEditingTerm(null);
    setFormData({
      name: "",
      description: "",
      // advance_percentage: "50.00",
      // advance_due_on: "survey",
      // balance_due_on: "delivery",
      is_default: false,
      is_active: true,
      order: 0,
    });
  };

  const openEdit = (term) => {
    setEditingTerm(term);
    setFormData({
      name: term.name,
      description: term.description || "",
      advance_percentage: term.advance_percentage,
      advance_due_on: term.advance_due_on,
      balance_due_on: term.balance_due_on,
      is_default: term.is_default,
      is_active: term.is_active,
      order: term.order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this payment term permanently?")) return;

    try {
      await apiClient.delete(`${API_BASE}/payment-terms/${id}/`);
      fetchTerms();
      alert("Term deleted");
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const toggleActive = async (term) => {
    try {
      await apiClient.post(`${API_BASE}/payment-terms/${term.id}/toggle_active/`);
      fetchTerms();
    } catch (err) {
      alert("Failed to toggle active status");
    }
  };

  const setAsDefault = async (term) => {
    try {
      await apiClient.post(`${API_BASE}/payment-terms/${term.id}/set_default/`);
      fetchTerms();
    } catch (err) {
      alert("Failed to set as default");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-xl mb-2">Loading payment terms...</div>
        <div className="text-sm text-gray-500">Please wait</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-medium text-gray-800">Payment Terms</h2>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg transition shadow-lg flex items-center justify-center gap-2 font-medium text-sm"
          >
            <FaPlus size={16} className="sm:w-5 sm:h-5" />
            Add Payment Term
          </button>
        </div>

        {/* Terms Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {terms.map((term) => (
            <div
              key={term.id}
              className={`bg-white rounded-xl shadow-md border-2 p-5 sm:p-6 relative transition-all ${term.is_active ? "border-gray-200" : "border-gray-300 opacity-75"
                }`}
            >
              {term.is_default && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-4 py-1 rounded-full font-medium">
                  DEFAULT
                </span>
              )}

              <h3 className="text-lg sm:text-xl font-medium text-gray-800 mt-4 sm:mt-0">{term.name}</h3>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                {term.description || "No description"}
              </p>

              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Status:</strong> {term.is_active ? "Active" : "Inactive"}</p>
                {/* <p><strong>Advance:</strong> {term.advance_percentage}%</p>
                <p><strong>Advance Due:</strong> {term.advance_due_display || term.advance_due_on}</p>
                <p><strong>Balance Due:</strong> {term.balance_due_display || term.balance_due_on}</p> */}
              </div>

              <div className="flex flex-wrap gap-2 mt-6">
                <button
                  onClick={() => openEdit(term)}
                  className="flex-1 py-2 bg-[#4c7085] text-white rounded-lg hover:bg-[#6b8ca3] transition text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => handleDelete(term.id)}
                  className="text-sm font-medium px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  <FaTrash />
                </button>
                <button
                  onClick={() => toggleActive(term)}
                  className="px-4 py-2 text-sm font-medium"
                  title={term.is_active ? "Deactivate" : "Activate"}
                >
                  {term.is_active ? (
                    <FaToggleOn className="text-3xl text-green-600" />
                  ) : (
                    <FaToggleOff className="text-3xl text-gray-400" />
                  )}
                </button>
                {!term.is_default && (
                  <button
                    onClick={() => setAsDefault(term)}
                    className="px-4 py-2 text-sm font-medium bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                    title="Set as Default"
                  >
                    <FaCheck />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal - Add/Edit Term */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 max-w-2xl w-full my-8">
              <h3 className="text-xl sm:text-2xl font-medium text-gray-800 mb-6">
                {editingTerm ? "Edit" : "Add"} Payment Term
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Name *"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description (supports HTML formatting)
                  </label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter payment terms description. Use formatting buttons for line breaks, bold, etc."
                    rows={8}
                  />
                </div>

                {/* <Input
                  label="Advance Percentage *"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.advance_percentage}
                  onChange={(e) => setFormData({ ...formData, advance_percentage: e.target.value })}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Advance Due On"
                    type="select"
                    value={formData.advance_due_on}
                    onChange={(e) => setFormData({ ...formData, advance_due_on: e.target.value })}
                    options={dueOptions}
                  />

                  <Input
                    label="Balance Due On"
                    type="select"
                    value={formData.balance_due_on}
                    onChange={(e) => setFormData({ ...formData, balance_due_on: e.target.value })}
                    options={dueOptions}
                  />
                </div> */}

                <div className="flex flex-wrap gap-6 text-sm">
                  {/* <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="w-5 h-5 text-[#4c7085] rounded focus:ring-[#4c7085]"
                    />
                    <span>Set as Default</span>
                  </label> */}
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
                    className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg text-sm font-medium transition shadow-lg"
                  >
                    {editingTerm ? "Update Term" : "Create Term"}
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

export default PaymentTermsTab;