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

const API_BASE = apiClient.defaults.baseURL || "http://127.0.0.1:8000/api";

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
        await apiClient.patch(
          `${API_BASE}/payment-terms/${editingTerm.id}/`,
          payload
        );
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
      advance_percentage: "50.00",
      advance_due_on: "survey",
      balance_due_on: "delivery",
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
      fetchTerms(); // refresh list
      alert("Term deleted");
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };
  const toggleActive = async (term) => {
    await apiClient.post(`${API_BASE}/payment-terms/${term.id}/toggle_active/`);
    fetchTerms();
  };

  const setAsDefault = async (term) => {
    await apiClient.post(`${API_BASE}/payment-terms/${term.id}/set_default/`);
    fetchTerms();
  };

  if (loading)
    return <div className="p-10 text-center">Loading payment terms...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Payment Terms</h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg font-medium"
        >
          Add Payment Term
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {terms.map((term) => (
          <div
            key={term.id}
            className={`bg-white rounded-xl shadow-md border p-6 relative ${
              term.is_active ? "" : "opacity-70"
            }`}
          >
            {term.is_default && (
              <span className="absolute top-2 right-2 bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                DEFAULT
              </span>
            )}

            <h3 className="text-xl font-bold text-gray-800">{term.name}</h3>
            <p className="text-sm text-gray-600 mt-2">
              {term.description || "No description"}
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <p>
                <strong>Advance:</strong> {term.advance_percentage}%
              </p>
              <p>
                <strong>Advance Due:</strong> {term.advance_due_display}
              </p>
              <p>
                <strong>Balance Due:</strong> {term.balance_due_display}
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => openEdit(term)}
                className="flex-1 py-2 bg-blue-600 text-white rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(term.id)}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Trash
              </button>
              <button onClick={() => toggleActive(term)}>
                {term.is_active ? (
                  <FaToggleOn className="text-3xl text-green-600" />
                ) : (
                  <FaToggleOff className="text-3xl text-gray-400" />
                )}
              </button>
              {!term.is_default && (
                <button
                  onClick={() => setAsDefault(term)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded"
                >
                  Check
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {editingTerm ? "Edit" : "Add"} Payment Term
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-semibold">Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold">
                    Advance Percentage
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.advance_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        advance_percentage: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold">Advance Due On</label>
                  <select
                    value={formData.advance_due_on}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        advance_due_on: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {dueOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold">Balance Due On</label>
                  <select
                    value={formData.balance_due_on}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        balance_due_on: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {dueOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) =>
                      setFormData({ ...formData, is_default: e.target.checked })
                    }
                  />
                  <span>Set as Default</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg"
                >
                  {editingTerm ? "Update" : "Create"} Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentTermsTab;
