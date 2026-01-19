import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import apiClient from "../../../api/apiClient";
import Input from "../../../components/Input";

const API_BASE = apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

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

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-xl mb-2">Loading notes...</div>
        <div className="text-sm text-gray-500">Please wait</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-medium text-gray-800">Quote Notes & Remarks</h2>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg transition shadow-lg flex items-center justify-center gap-2 font-medium text-sm"
          >
            <FaPlus size={16} className="sm:w-5 sm:h-5" />
            Add Note
          </button>
        </div>

        {/* Notes List - Responsive */}
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-base sm:text-lg mb-2">No notes added yet.</p>
              <p className="text-sm">Create your first note using the button above.</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={`bg-white rounded-xl shadow-md border-2 p-5 sm:p-6 transition-all hover:shadow-lg ${!note.is_active ? "opacity-75 border-gray-300" : "border-gray-200"
                  }`}
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-gray-700 text-sm sm:text-base whitespace-pre-wrap mt-2">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4">
                    <button
                      onClick={() => openEdit(note)}
                      className="text-[#4c7085] hover:text-[#6b8ca3] transition text-sm font-medium"
                      title="Edit"
                    >
                      <FaEdit size={18} className="sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-red-600 hover:text-red-800 transition text-sm font-medium"
                      title="Delete"
                    >
                      <FaTrash size={18} className="sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => toggleActive(note)}
                      className="transition text-sm font-medium"
                      title={note.is_active ? "Deactivate" : "Activate"}
                    >
                      {note.is_active ? (
                        <FaToggleOn className="text-2xl sm:text-3xl text-green-600" />
                      ) : (
                        <FaToggleOff className="text-2xl sm:text-3xl text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal - Add/Edit Note */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 max-w-2xl w-full my-8">
            <h3 className="text-xl sm:text-2xl font-medium text-gray-800 mb-6">
              {editingNote ? "Edit" : "Add"} Note
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Content (shown in quote) *"
                type="textarea"
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="e.g. Free storage for first 30 days. Storage charges apply after that..."
                required
              />

              <div className="flex flex-wrap gap-6 text-sm">
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
                  className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg text-sm font-medium transition shadow-lg"
                >
                  {editingNote ? "Update Note" : "Create Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )
      }
    </div >
  );
};

export default NoteTab;