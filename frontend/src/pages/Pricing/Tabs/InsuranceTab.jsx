import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaToggleOn,
  FaToggleOff,
  FaShieldAlt,
  FaSave,
  FaTimes
} from "react-icons/fa";
import apiClient from "../../../api/apiClient";
import { usePermissions } from "../../../components/PermissionsContext/PermissionsContext";

const API_BASE = apiClient.defaults.baseURL || "http://127.0.0.1:8000/api";

const InsuranceTab = () => {
  const { hasPermission } = usePermissions();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = async () => {
    if (editingId) {
      if (!hasPermission("local_move", "edit")) {
        alert("Permission denied");
        return;
      }
    } else {
      if (!hasPermission("local_move", "add")) {
        alert("Permission denied");
        return;
      }
    }

    if (!formData.name) return;

    setSaving(true);
    try {
      if (editingId) {
        await apiClient.patch(
          `${API_BASE}/insurance-plans/${editingId}/`,
          formData
        );
      } else {
        await apiClient.post(`${API_BASE}/insurance-plans/`, formData);
      }
      resetForm();
      fetchPlans();
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

  const startEdit = (plan) => {
    setEditingId(plan.id);
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
  };

  const handleDelete = async (id) => {
    if (!hasPermission("local_move", "delete")) {
      alert("Permission denied");
      return;
    }
    if (!window.confirm("Delete this insurance plan permanently?")) return;

    try {
      await apiClient.delete(`${API_BASE}/insurance-plans/${id}/`);
      fetchPlans();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const toggleActive = async (plan) => {
    if (!hasPermission("local_move", "edit")) {
      alert("Permission denied");
      return;
    }
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
    if (!hasPermission("local_move", "edit")) {
      alert("Permission denied");
      return;
    }
    try {
      await apiClient.post(
        `${API_BASE}/insurance-plans/${plan.id}/set_default/`
      );
      fetchPlans();
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
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <h3 className="text-lg font-medium text-gray-800 mb-6 border-b border-gray-100 pb-4">Insurance Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div>
            <Label required>Plan Name</Label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Full Coverage, Basic Liability"
              className="input-style w-full font-medium text-gray-700"
              disabled={saving}
            />
          </div>

          <div>
            <Label>Description</Label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Plan details shown to customer..."
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
          {(editingId ? hasPermission("local_move", "edit") : hasPermission("local_move", "add")) && (
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
                  {editingId ? "Update Plan" : "Add Plan"}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 sm:px-8 sm:py-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-800">Available Insurance Plans</h3>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-600">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="text-gray-300 text-xl" />
            </div>
            <p className="text-gray-600 font-medium">No plans configured</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest pl-8">Plan Name</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest">Description</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center">Active</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center">Default</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#4c7085]/10 text-[#4c7085] flex items-center justify-center">
                            <FaShieldAlt size={14} />
                          </div>
                          <span className="font-medium text-gray-800">{plan.name}</span>
                          {plan.is_mandatory && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">MANDATORY</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium text-sm max-w-xs">
                        {plan.description || "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleActive(plan)}
                          className="focus:outline-none"
                          disabled={!hasPermission("local_move", "edit")}
                        >
                          {plan.is_active ? <FaToggleOn className="text-2xl text-green-500" /> : <FaToggleOff className="text-2xl text-gray-300" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!plan.is_default ? (
                          <button
                            onClick={() => setAsDefault(plan)}
                            className="text-gray-300 hover:text-yellow-500 transition-colors"
                            title="Set Default"
                            disabled={!hasPermission("local_move", "edit")}
                          >
                            <FaCheck />
                          </button>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium">Default</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right pr-8">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission("local_move", "edit") && (
                            <button
                              onClick={() => startEdit(plan)}
                              className="w-8 h-8 flex items-center justify-center text-[#4c7085] bg-gray-50 rounded-lg hover:bg-[#4c7085] hover:text-white transition-colors"
                            >
                              <FaEdit size={14} />
                            </button>
                          )}
                          {hasPermission("local_move", "delete") && (
                            <button
                              onClick={() => handleDelete(plan.id)}
                              className="w-8 h-8 flex items-center justify-center text-red-600 bg-red-50 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                            >
                              <FaTrash size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {plans.map((plan) => (
                <div key={plan.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-xl bg-[#4c7085]/10 text-[#4c7085] flex-shrink-0 flex items-center justify-center">
                        <FaShieldAlt size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-800">{plan.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {plan.is_default && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold">DEFAULT</span>}
                          {plan.is_mandatory && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">MANDATORY</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => toggleActive(plan)}
                        className="focus:outline-none"
                        disabled={!hasPermission("local_move", "edit")}
                      >
                        {plan.is_active ? <FaToggleOn className="text-2xl text-green-500" /> : <FaToggleOff className="text-2xl text-gray-300" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">
                    {plan.description || "No description provided."}
                  </p>

                  <div className="flex justify-end gap-2 pt-1">
                    {hasPermission("local_move", "edit") && (
                      <button
                        onClick={() => startEdit(plan)}
                        className="flex-1 sm:flex-none py-2 px-4 bg-gray-100 text-[#4c7085] rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <FaEdit /> Edit
                      </button>
                    )}
                    {hasPermission("local_move", "delete") && (
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="flex-1 sm:flex-none py-2 px-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <FaTrash /> Delete
                      </button>
                    )}
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

export default InsuranceTab;