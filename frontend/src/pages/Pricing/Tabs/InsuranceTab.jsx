// src/pages/Pricing/Tabs/InsuranceTab.jsx

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

const API_BASE = apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

const InsuranceTab = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    calculation_type: "percentage",
    rate: "",
    minimum_premium: "0.00",
    maximum_coverage: "",
    is_default: false,
    is_mandatory: false,
    is_active: true,
    order: 0,
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API_BASE}/insurance-plans/`);
      setPlans(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load insurance plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await apiClient.patch(
          `${API_BASE}/insurance-plans/${editingPlan.id}/`,
          formData
        );
      } else {
        await apiClient.post(`${API_BASE}/insurance-plans/`, formData);
      }
      setShowModal(false);
      resetForm();
      fetchPlans();
      alert(editingPlan ? "Plan updated!" : "Plan created!");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      calculation_type: "percentage",
      rate: "",
      minimum_premium: "0.00",
      maximum_coverage: "",
      is_default: false,
      is_mandatory: false,
      is_active: true,
      order: 0,
    });
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      calculation_type: plan.calculation_type,
      rate: plan.rate,
      minimum_premium: plan.minimum_premium || "0.00",
      maximum_coverage: plan.maximum_coverage || "",
      is_default: plan.is_default,
      is_mandatory: plan.is_mandatory,
      is_active: plan.is_active,
      order: plan.order,
    });
    setShowModal(true);
  };

    const handleDelete = async (id) => {
    if (!window.confirm("Delete this insurance plan permanently?")) return;

    try {
        await apiClient.delete(`${API_BASE}/insurance-plans/${id}/`);
        fetchPlans();               // refresh list
        alert("Plan deleted");
    } catch (err) {
        console.error(err);
        alert("Delete failed – check console");
    }
    };
  const toggleActive = async (plan) => {
    try {
      await apiClient.post(
        `${API_BASE}/insurance-plans/${plan.id}/toggle_active/`
      );
      fetchPlans();
    } catch (err) {
      alert("Failed to toggle");
    }
  }; // ← THIS WAS MISSING!

  const setAsDefault = async (plan) => {
    try {
      await apiClient.post(
        `${API_BASE}//insurance-plans/${plan.id}/set_default/`
      );
      fetchPlans();
    } catch (err) {
      alert("Failed to set as default");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-600">Loading insurance plans...</div>
    );

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Insurance Plans</h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:shadow-lg transition font-medium"
        >
          Add New Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-xl shadow-md border p-6 relative transition ${
              plan.is_active ? "border-gray-200" : "border-gray-300 opacity-70"
            }`}
          >
            {plan.is_default && (
              <span className="absolute top-2 right-2 bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                DEFAULT
              </span>
            )}
            {plan.is_mandatory && (
              <span className="absolute top-10 right-2 bg-red-600 text-white text-xs px-3 py-1 rounded-full">
                MANDATORY
              </span>
            )}

            <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
              {plan.description || "No description"}
            </p>

            <div className="mt-4 space-y-1 text-sm">
              <p>
                <strong>Type:</strong> {plan.calculation_type_display}
              </p>
              <p>
                <strong>Rate:</strong>{" "}
                {plan.calculation_type === "free"
                  ? "FREE"
                  : `${plan.rate} ${
                      plan.calculation_type === "percentage" ? "%" : "QAR"
                    }`}
              </p>
              {plan.minimum_premium > 0 && (
                <p>
                  <strong>Min Premium:</strong> QAR {plan.minimum_premium}
                </p>
              )}
              {plan.maximum_coverage && (
                <p>
                  <strong>Max Coverage:</strong> QAR {plan.maximum_coverage}
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => openEdit(plan)}
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <FaTrash />
              </button>
              <button onClick={() => toggleActive(plan)}>
                {plan.is_active ? (
                  <FaToggleOn className="text-3xl text-green-600" />
                ) : (
                  <FaToggleOff className="text-3xl text-gray-400" />
                )}
              </button>
              {!plan.is_default && (
                <button
                  onClick={() => setAsDefault(plan)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  <FaCheck />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal – Add/Edit Plan */}
      {showModal && (
        <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {editingPlan ? "Edit" : "Add"} Insurance Plan
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Form fields same as before – unchanged */}
              <div>
                <label className="block font-semibold mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:border-[#4c7085] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Description (shown to customer)
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:border-[#4c7085] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Calculation Type
                  </label>
                  <select
                    value={formData.calculation_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        calculation_type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="free">Free (Included)</option>
                    <option value="percentage">Percentage of Total</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="per_item">Per High-Value Item</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Rate {formData.calculation_type === "percentage" ? "(%)" : "(QAR)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.rate}
                    onChange={(e) =>
                      setFormData({ ...formData, rate: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Minimum Premium (QAR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minimum_premium}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimum_premium: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Maximum Coverage (QAR) – optional
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.maximum_coverage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maximum_coverage: e.target.value || null,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Leave blank = unlimited"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
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
                    checked={formData.is_mandatory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_mandatory: e.target.checked,
                      })
                    }
                  />
                  <span>Mandatory</span>
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
                  className="px-6 py-3 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg font-medium"
                >
                  {editingPlan ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceTab;