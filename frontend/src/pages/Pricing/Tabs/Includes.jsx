import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import apiClient from "../../../api/apiClient";
import { usePermissions } from "../../../components/PermissionsContext/PermissionsContext";

const IncludesTab = () => {
  const { hasPermission } = usePermissions();
  const [items, setItems] = useState([]);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const API_BASE_URL = apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await apiClient.get(`${API_BASE_URL}/inclusion-exclusion/?type=include`);
      setItems(res.data);
    } catch (err) {
      console.error("Failed to load includes");
    }
  };

  const addItem = async () => {
    if (!hasPermission("local_move", "add")) {
      alert("Permission denied");
      return;
    }
    const text = newText.trim();
    if (!text) return;

    setSaving(true);
    try {
      const res = await apiClient.post(`${API_BASE_URL}/inclusion-exclusion/`, {
        text,
        type: "include"
      });
      setItems([...items, res.data]);
      setNewText("");
    } catch (err) {
      alert("Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (!hasPermission("local_move", "delete")) {
      alert("Permission denied");
      return;
    }
    if (!window.confirm("Delete this item permanently?")) return;

    setDeletingId(id);
    try {
      await apiClient.delete(`${API_BASE_URL}/inclusion-exclusion/${id}/`);
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      alert("Failed to delete");
    } finally {
      setDeletingId(null);
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
        <h3 className="text-lg font-medium text-gray-800 mb-6 border-b border-gray-100 pb-4">Inclusion Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-end">
          <div className="lg:col-span-2">
            <Label required>Inclusion Text</Label>
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="e.g. Packing materials, Labor, Transportation"
              className="input-style w-full font-medium text-gray-700"
              disabled={saving}
            />
          </div>
          {hasPermission("local_move", "add") && (
            <div>
              <button
                onClick={addItem}
                disabled={saving || !newText.trim()}
                className="w-full h-[46px] bg-[#4c7085] hover:bg-[#405d6f] text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  "Adding..."
                ) : (
                  <>
                    <FaPlus className="w-4 h-4" /> Add Inclusion
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 sm:px-8 sm:py-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-800">What is Included</h3>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaPlus className="text-gray-300 text-xl" />
            </div>
            <p className="text-gray-600 font-medium">No inclusions added yet</p>
            <p className="text-xs text-gray-600 mt-1">Add your first inclusion above</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest w-full">Inclusion</th>
                    <th className="px-8 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-4 text-gray-700 font-medium">{item.text}</td>
                      <td className="px-8 py-4 text-right">
                        {hasPermission("local_move", "delete") && (
                          <button
                            onClick={() => deleteItem(item.id)}
                            disabled={deletingId === item.id}
                            className="w-8 h-8 flex items-center justify-center text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors ml-auto disabled:opacity-50"
                            title="Delete permanently"
                          >
                            {deletingId === item.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <FaTrash size={14} />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <span className="font-medium text-gray-800 break-words flex-1 pr-4">{item.text}</span>
                  {hasPermission("local_move", "delete") && (
                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={deletingId === item.id}
                      className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-red-600 bg-red-50 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {deletingId === item.id ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <FaTrash size={16} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default IncludesTab;