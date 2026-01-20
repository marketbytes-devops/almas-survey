import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaToggleOn,
  FaToggleOff,
  FaFileContract,
  FaSave,
  FaTimes
} from "react-icons/fa";
import apiClient from "../../../api/apiClient";
import RichTextEditor from "../../../components/RichTextEditor";

const API_BASE = apiClient.defaults.baseURL || "http://127.0.0.1:8000/api";

const PaymentTermsTab = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async () => {
    if (!formData.name) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        advance_percentage: parseFloat(formData.advance_percentage) || 0,
      };

      if (editingId) {
        await apiClient.patch(`${API_BASE}/payment-terms/${editingId}/`, payload);
      } else {
        await apiClient.post(`${API_BASE}/payment-terms/`, payload);
      }
      resetForm();
      fetchTerms();
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
      advance_percentage: "50.00",
      advance_due_on: "survey",
      balance_due_on: "delivery",
      is_default: false,
      is_active: true,
      order: 0,
    });
  };

  const startEdit = (term) => {
    setEditingId(term.id);
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
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this payment term permanently?")) return;

    try {
      await apiClient.delete(`${API_BASE}/payment-terms/${id}/`);
      fetchTerms();
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

  const Label = ({ children, required }) => (
    <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <h3 className="text-lg font-medium text-gray-800 mb-6 border-b border-gray-100 pb-4">Payment Terms Configuration</h3>

        <div className="space-y-6">
          <div>
            <Label required>Term Name</Label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Standard Payment Terms"
              className="input-style w-full font-medium text-gray-700 max-w-md"
              disabled={saving}
            />
          </div>

          <div>
            <Label>Description / Content</Label>
            <div className="mt-1">
              <RichTextEditor
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter payment terms description..."
                rows={6}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          {editingId && (
            <button
              onClick={resetForm}
              className="w-full sm:w-auto px-6 h-[46px] rounded-xl font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              <FaTimes /> Cancel
            </button>
          )}
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
                {editingId ? "Update Terms" : "Add Terms"}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 sm:px-8 sm:py-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-800">Available Payment Terms</h3>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-600">Loading...</div>
        ) : terms.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaFileContract className="text-gray-300 text-xl" />
            </div>
            <p className="text-gray-600 font-medium">No payment terms configured</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest pl-8 w-1/4">Name</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest w-1/2">Preview</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center">Active</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center">Default</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {terms.map((term) => (
                    <tr key={term.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 pl-8 align-top pt-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#4c7085]/10 text-[#4c7085] flex items-center justify-center">
                            <FaFileContract size={14} />
                          </div>
                          <span className="font-medium text-gray-800">{term.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm align-top pt-5">
                        <div dangerouslySetInnerHTML={{ __html: term.description || "No description" }} />
                      </td>
                      <td className="px-6 py-4 text-center align-top pt-5">
                        <button onClick={() => toggleActive(term)} className="focus:outline-none">
                          {term.is_active ? <FaToggleOn className="text-2xl text-green-500" /> : <FaToggleOff className="text-2xl text-gray-300" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center align-top pt-5">
                        {!term.is_default ? (
                          <button onClick={() => setAsDefault(term)} className="text-gray-300 hover:text-yellow-500 transition-colors" title="Set Default">
                            <FaCheck />
                          </button>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium">Default</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right pr-8 align-top pt-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(term)}
                            className="w-8 h-8 flex items-center justify-center text-[#4c7085] bg-gray-50 rounded-lg hover:bg-[#4c7085] hover:text-white transition-colors"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(term.id)}
                            className="w-8 h-8 flex items-center justify-center text-red-600 bg-red-50 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {terms.map((term) => (
                <div key={term.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                      <div className="w-10 h-10 rounded-xl bg-[#4c7085]/10 text-[#4c7085] flex-shrink-0 flex items-center justify-center mt-0.5">
                        <FaFileContract size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-800 truncate mb-1">{term.name}</h4>
                        {term.is_default && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold">DEFAULT</span>}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button onClick={() => toggleActive(term)} className="focus:outline-none">
                        {term.is_active ? <FaToggleOn className="text-2xl text-green-500" /> : <FaToggleOff className="text-2xl text-gray-300" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl max-h-32 overflow-hidden">
                    <div dangerouslySetInnerHTML={{ __html: term.description || "No description" }} />
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-gray-50">
                    <button
                      onClick={() => startEdit(term)}
                      className="flex-1 sm:flex-none py-2 px-4 bg-gray-100 text-[#4c7085] rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(term.id)}
                      className="flex-1 sm:flex-none py-2 px-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <FaTrash /> Delete
                    </button>
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

export default PaymentTermsTab;