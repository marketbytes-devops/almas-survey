import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";
import apiClient from "../../../api/apiClient";

const IncludesTab = () => {
  const [items, setItems] = useState([]);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);

  const API_BASE_URL = apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await apiClient.get(`${API_BASE_URL}/inclusion-exclusion/`);
      setItems(res.data.filter(i => i.type === "include"));
    } catch (err) {}
  };

  const addItem = () => {
    if (!newText.trim()) return;
    setItems([...items, { id: Date.now(), text: newText.trim(), type: "include" }]);
    setNewText("");
  };

  const deleteItem = (id) => {
    setItems(items.filter(i => i.id !== id));
  };

  const saveAll = async () => {
    const payload = items.map(i => ({
      text: i.text,
      type: "include",
      id: i.id > 1000 ? undefined : i.id
    }));
    try {
      setSaving(true);
      await apiClient.post(`${API_BASE_URL}/inclusion-exclusion/`, payload);
      alert("Includes saved!");
      fetchItems();
    } catch (err) {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">What is Included</h2>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyPress={e => e.key === "Enter" && addItem()}
            placeholder="e.g. Packing materials, Labor, Transportation"
            className="flex-1 px-4 py-2 border rounded-lg focus:border-blue-500 outline-none"
          />
          <button onClick={addItem} className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-6 py-2 rounded-lg hover:shadow-lg transition flex items-center gap-2">
            <FaPlus /> Add
          </button>
        </div>

        <div className="flex justify-end mb-4">
          <button onClick={saveAll} disabled={saving || items.length === 0} className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold shadow-lg">
            <FaSave /> {saving ? "Saving..." : "SAVE ALL"}
          </button>
        </div>

        <ul className="space-y-3">
          {items.map(item => (
            <li key={item.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition">
              <span className="text-gray-800">• {item.text}</span>
              <button onClick={() => deleteItem(item.id)} className="text-red-600 hover:text-red-800">
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
        {items.length === 0 && <p className="text-center text-gray-500 py-8">No includes added yet.</p>}
      </div>
    </div>
  );
};

export default IncludesTab;