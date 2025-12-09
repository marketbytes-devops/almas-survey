import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaCheck,
} from "react-icons/fa";
import apiClient from "../../../api/apiClient";

const API_BASE = apiClient.defaults.baseURL || "http://127.0.0.1:8000/api";

const NoteTab = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    is_default: false,
    is_active: true,
    order: 0,
  });

  const categories = [
    { value: "general", label: "General" },
    { value: "packing", label: "Packing" },
    { value: "delivery", label: "Delivery" },
    { value: "storage", label: "Storage" },
    { value: "payment", label: "Payment" },
    { value: "legal", label: "Legal / Terms & Conditions" },
    { value: "custom", label: "Custom" },
  ];

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API_BASE}/quote-notes/`);
      setNotes(res.data);
    } catch (err) {
      alert("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNote) {
        await apiClient.patch(`${API_BASE}/quote-notes/${editingNote.id}/`, formData);
      } else {
        await apiClient.post(`${API_BASE}/quote-notes/`, formData);
      }
      setShowModal(false);
      resetForm();
      fetchNotes();
      alert("Note saved!");
    } catch (err) {
      alert("Save failed");
    }
  };

  const resetForm = () => {
    setEditingNote(null);
    setFormData({
      title: "",
      content: "",
      category: "general",
      is_default: false,
      is_active: true,
      order: 0,
    });
  };

  const openEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category,
      is_default: note.is_default,
      is_active: note.is_active,
      order: note.order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note permanently?")) return;
    try {
      await apiClient.delete(`${API_BASE}/quote-notes/${id}/`);
      fetchNotes();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const toggleActive = async (note) => {
    try {
      await apiClient.post(`${API_BASE}/quote-notes/${note.id}/toggle_active/`);
      fetchNotes();
    } catch (err) {
      alert("Failed");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading notes...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Quote Notes & Remarks</h2>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg font-medium"
        >
          Add Note
        </button>
      </div>

      <div className="grid gap-6">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`bg-white rounded-xl shadow-md border p-6 hover:shadow-lg transition ${
              !note.is_active ? "opacity-70" : ""
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-800">{note.title}</h3>
                  {note.is_default && (
                    <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                      DEFAULT
                    </span>
                  )}
                  <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                    {note.category_display}
                  </span>
                </div>
                <p className="text-gray-700 mt-3 whitespace-pre-wrap">{note.content}</p>
              </div>

              <div className="flex gap-2 ml-4">
                <button onClick={() => openEdit(note)} className="text-blue-600 hover:text-blue-800">
                  Edit
                </button>
                <button onClick={() => handleDelete(note.id)} className="text-red-600 hover:text-red-800">
                  Trash
                </button>
                <button onClick={() => toggleActive(note)}>
                  {note.is_active ? (
                    <FaToggleOn className="text-2xl text-green-600" />
                  ) : (
                    <FaToggleOff className="text-2xl text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {editingNote ? "Edit" : "Add"} Note
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:border-[#4c7085] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Content (shown in quote)</label>
                <textarea
                  rows={6}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:border-[#4c7085] outline-none font-mono text-sm"
                  placeholder="e.g. Free storage for first 30 days. Storage charges apply after that..."
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  />
                  <span>Include by default in all quotes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
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
                  {editingNote ? "Update Note" : "Create Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteTab;