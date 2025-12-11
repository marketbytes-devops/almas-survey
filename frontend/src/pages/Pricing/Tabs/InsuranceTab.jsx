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
      fetchPlans();
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
  };

  const setAsDefault = async (plan) => {
    try {
      await apiClient.post(
        `${API_BASE}/insurance-plans/${plan.id}/set_default/`
      );
      fetchPlans();
    } catch (err) {
      alert("Failed to set as default");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-xl mb-2">Loading insurance plans...</div>
        <div className="text-sm text-gray-500">Please wait</div>
      </div>
    );
  }

  const calculationTypeOptions = [
    { value: "free", label: "Free (Included)" },
    { value: "percentage", label: "Percentage of Total" },
    { value: "fixed", label: "Fixed Amount" },
    { value: "per_item", label: "Per High-Value Item" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-medium text-gray-800">Insurance Plans</h2>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg transition shadow-lg flex items-center justify-center gap-2 font-medium text-sm"
          >
            <FaPlus size={16} className="sm:w-5 sm:h-5" />
            Add New Plan
          </button>
        </div>

        {/* Plans Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-xl shadow-md border-2 p-5 sm:p-6 relative transition-all ${
                plan.is_active ? "border-gray-200" : "border-gray-300 opacity-75"
              }`}
            >
              {plan.is_default && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-4 py-1 rounded-full font-medium">
                  DEFAULT
                </span>
              )}
              {plan.is_mandatory && (
                <span className="absolute top-10 right-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  MANDATORY
                </span>
              )}

              <h3 className="text-lg sm:text-xl font-medium text-gray-800 mt-4 sm:mt-0">{plan.name}</h3>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                {plan.description || "No description"}
              </p>

              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Type:</strong> {plan.calculation_type_display || plan.calculation_type}</p>
                <p>
                  <strong>Rate:</strong>{" "}
                  {plan.calculation_type === "free"
                    ? "FREE"
                    : `${plan.rate} ${
                        plan.calculation_type === "percentage" ? "%" : "QAR"
                      }`}
                </p>
                {plan.minimum_premium > 0 && (
                  <p><strong>Min Premium:</strong> QAR {plan.minimum_premium}</p>
                )}
                {plan.maximum_coverage && (
                  <p><strong>Max Coverage:</strong> QAR {plan.maximum_coverage}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-6">
                <button
                  onClick={() => openEdit(plan)}
                  className="flex-1 py-2 bg-[#4c7085] text-white rounded-lg hover:bg-[#6b8ca3] transition text-sm font-medium flex items-center justify-center gap-2"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                >
                  <FaTrash />
                </button>
                <button
                  onClick={() => toggleActive(plan)}
                  className="px-4 py-2 text-sm font-medium"
                  title={plan.is_active ? "Deactivate" : "Activate"}
                >
                  {plan.is_active ? (
                    <FaToggleOn className="text-3xl text-green-600" />
                  ) : (
                    <FaToggleOff className="text-3xl text-gray-400" />
                  )}
                </button>
                {!plan.is_default && (
                  <button
                    onClick={() => setAsDefault(plan)}
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

        {/* Modal - Add/Edit Plan */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 max-w-2xl w-full my-8">
              <h3 className="text-xl sm:text-2xl font-medium text-gray-800 mb-6">
                {editingPlan ? "Edit" : "Add"} Insurance Plan
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Plan Name *"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <Input
                  label="Description (shown to customer)"
                  type="textarea"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Calculation Type"
                    type="select"
                    value={formData.calculation_type}
                    onChange={(e) => setFormData({ ...formData, calculation_type: e.target.value })}
                    options={calculationTypeOptions}
                  />

                  <Input
                    label={`Rate ${formData.calculation_type === "percentage" ? "(%)" : "(QAR)"} *`}
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    required={formData.calculation_type !== "free"}
                    disabled={formData.calculation_type === "free"}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Minimum Premium (QAR)"
                    type="number"
                    step="0.01"
                    value={formData.minimum_premium}
                    onChange={(e) => setFormData({ ...formData, minimum_premium: e.target.value })}
                  />

                  <Input
                    label="Maximum Coverage (QAR) – optional"
                    type="number"
                    step="0.01"
                    placeholder="Leave blank = unlimited"
                    value={formData.maximum_coverage}
                    onChange={(e) => setFormData({ ...formData, maximum_coverage: e.target.value })}
                  />
                </div>

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
                      checked={formData.is_mandatory}
                      onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                      className="w-5 h-5 text-[#4c7085] rounded focus:ring-[#4c7085]"
                    />
                    <span>Mandatory</span>
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
                    className="w-full sm:w-auto px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg text-sm font-medium transition shadow-lg"
                  >
                    {editingPlan ? "Update Plan" : "Create Plan"}
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

export default InsuranceTab;