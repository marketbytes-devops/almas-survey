import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import apiClient from "../../../api/apiClient";
import Input from "../../../components/Input";

const ExcludesTab = () => {
  const [items, setItems] = useState([]);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const API_BASE_URL = apiClient.defaults.baseURL || "http://127.0.0.1:8000/api";

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await apiClient.get(`${API_BASE_URL}/inclusion-exclusion/?type=exclude`);
      setItems(res.data);
    } catch (err) {
      console.error("Failed to load excludes:", err);
    }
  };

  const addItem = async () => {
    const text = newText.trim();
    if (!text) return;

    setSaving(true);
    try {
      const res = await apiClient.post(`${API_BASE_URL}/inclusion-exclusion/`, {
        text,
        type: "exclude"
      });
      setItems([...items, res.data]);
      setNewText("");
    } catch (err) {
      alert("Failed to add item. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item permanently?")) return;

    setDeletingId(id);
    try {
      await apiClient.delete(`${API_BASE_URL}/inclusion-exclusion/${id}/`);
      setItems(items.filter((i) => i.id !== id));
    } catch (err) {
      alert("Failed to delete item");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-2xl font-medium text-red-700 mb-6">What is Excluded</h2>
        <div className="grid gap-4 mb-6">
          <Input
            label="Add New Exclusion"
            placeholder="e.g. Storage fees, Customs duties, Insurance"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            type="text"
            disabled={saving}
          />

          <button
            onClick={addItem}
            disabled={saving || !newText.trim()}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition shadow-lg flex items-center justify-center gap-2 font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              "Adding..."
            ) : (
              <>
                <FaPlus size={16} className="sm:w-4 sm:h-4" /> Add
              </>
            )}
          </button>
        </div>
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-base sm:text-lg mb-2">No excludes added yet.</p>
              <p className="text-sm">Add your first exclusion above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-red-50 p-4 sm:p-5 rounded-xl hover:bg-red-100 transition shadow-sm border border-red-200"
                >
                  <span className="text-gray-800 font-medium text-sm sm:text-base flex-1">
                    {item.text}
                  </span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    disabled={deletingId === item.id}
                    className="ml-4 p-2 text-red-700 hover:text-red-900 disabled:opacity-50 transition rounded-lg"
                    title="Delete permanently"
                  >
                    {deletingId === item.id ? (
                      <span className="text-xs sm:text-sm">Deleting...</span>
                    ) : (
                      <FaTrash size={16} className="sm:w-4 sm:h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcludesTab;