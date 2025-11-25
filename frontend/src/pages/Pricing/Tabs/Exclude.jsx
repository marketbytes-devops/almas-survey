import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import apiClient from "../../../api/apiClient";

const ExcludesTab = () => {
  const [items, setItems] = useState([]);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const API_BASE_URL = apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

  // Load all excludes on mount
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

  // ADD → INSTANTLY SAVED TO DATABASE
  const addItem = async () => {
    const text = newText.trim();
    if (!text) return;

    setSaving(true);
    try {
      const res = await apiClient.post(`${API_BASE_URL}/inclusion-exclusion/`, {
        text,
        type: "exclude"
      });
      setItems([...items, res.data]);  // Add real saved item from server
      setNewText("");
    } catch (err) {
      alert("Failed to add item. Please try again.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // DELETE → INSTANTLY DELETED FROM DATABASE
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
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-red-700 mb-6">What is Excluded</h2>

        {/* Add New Item */}
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addItem()}
            placeholder="e.g. Storage fees, Customs duties, Insurance"
            className="flex-1 px-4 py-3 border-2 border-red-300 rounded-lg focus:border-red-500 outline-none text-gray-700 placeholder-gray-400"
            disabled={saving}
          />
          <button
            onClick={addItem}
            disabled={saving || !newText.trim()}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition shadow-lg flex items-center gap-3 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              "Adding..."
            ) : (
              <>
                <FaPlus size={18} /> Add
              </>
            )}
          </button>
        </div>

        {/* Items List */}
        <ul className="space-y-3">
          {items.length === 0 ? (
            <p className="text-center text-gray-500 py-12 text-lg">No excludes added yet.</p>
          ) : (
            items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between bg-red-50 p-5 rounded-xl hover:bg-red-100 transition shadow-sm border border-red-200"
              >
                <span className="text-gray-800 font-medium">• {item.text}</span>
                <button
                  onClick={() => deleteItem(item.id)}
                  disabled={deletingId === item.id}
                  className="text-red-700 hover:text-red-900 disabled:opacity-50 transition"
                  title="Delete permanently"
                >
                  {deletingId === item.id ? (
                    <span className="text-sm">Deleting...</span>
                  ) : (
                    <FaTrash size={18} />
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default ExcludesTab;