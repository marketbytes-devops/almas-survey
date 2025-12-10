import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import apiClient from "../../../api/apiClient";

const IncludesTab = () => {
  const [items, setItems] = useState([]);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const API_BASE_URL = apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

  // Load items on mount
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

  // ADD → INSTANTLY SAVE TO DATABASE
  const addItem = async () => {
    const text = newText.trim();
    if (!text) return;

    setSaving(true);
    try {
      const res = await apiClient.post(`${API_BASE_URL}/inclusion-exclusion/`, {
        text,
        type: "include"
      });
      setItems([...items, res.data]);  // add the real saved item
      setNewText("");
    } catch (err) {
      alert("Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  // DELETE → INSTANTLY DELETE FROM DATABASE
  const deleteItem = async (id) => {
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

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">What is Included</h2>

        {/* Add Input */}
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addItem()}
            placeholder="e.g. Packing materials, Labor, Transportation"
            className="flex-1 px-4 py-3 border-2 rounded-lg focus:border-blue-500 outline-none text-gray-700"
            disabled={saving}
          />
          <button
            onClick={addItem}
            disabled={saving || !newText.trim()}
            className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-8 py-3 rounded-lg hover:shadow-xl transition flex items-center gap-3 font-medium disabled:opacity-60"
          >
            {saving ? "Adding..." : <> <FaPlus /> Add </>}
          </button>
        </div>

        {/* List */}
        <ul className="space-y-3">
          {items.length === 0 ? (
            <p className="text-center text-gray-500 py-12 text-lg">No includes added yet.</p>
          ) : (
            items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between bg-gray-50 p-5 rounded-xl hover:bg-gray-100 transition shadow-sm"
              >
                <span className="text-gray-800 font-medium">{item.text}</span>
                <button
                  onClick={() => deleteItem(item.id)}
                  disabled={deletingId === item.id}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50 transition"
                >
                  {deletingId === item.id ? "Deleting..." : <FaTrash size={18} />}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default IncludesTab;