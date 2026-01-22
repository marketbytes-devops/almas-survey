import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaStickyNote,
  FaSave,
  FaTimes
} from "react-icons/fa";
import apiClient from "../../../api/apiClient";
import { usePermissions } from "../../../components/PermissionsContext/PermissionsContext";

const API_BASE = apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

const NoteTab = () => {
  const { hasPermission } = usePermissions();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    is_default: false,
    is_active: true,
    order: 0,
  });

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

    if (!formData.content) return;

    setSaving(true);
    try {
      if (editingId) {
        await apiClient.patch(`${API_BASE}/quote-notes/${editingId}/`, formData);
      } else {
        await apiClient.post(`${API_BASE}/quote-notes/`, formData);
      }
      resetForm();
      fetchNotes();
    } catch (err) {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "",
      content: "",
      category: "general",
      is_default: false,
      is_active: true,
      order: 0,
    });
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category,
      is_default: note.is_default,
      is_active: note.is_active,
      order: note.order,
    });
  };

  const handleDelete = async (id) => {
    if (!hasPermission("local_move", "delete")) {
      alert("Permission denied");
      return;
    }
    if (!window.confirm("Delete this note permanently?")) return;
    try {
      await apiClient.delete(`${API_BASE}/quote-notes/${id}/`);
      fetchNotes();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const toggleActive = async (note) => {
    if (!hasPermission("local_move", "edit")) {
      alert("Permission denied");
      return;
    }
    try {
      await apiClient.post(`${API_BASE}/quote-notes/${note.id}/toggle_active/`);
      fetchNotes();
    } catch (err) {
      alert("Failed");
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
        <h3 className="text-lg font-medium text-gray-800 mb-6 border-b border-gray-100 pb-4">Note Configuration</h3>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div>
            <Label required>Note Content (as shown in quote)</Label>
            <textarea
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="e.g. Free storage for first 30 days. Storage charges apply after that..."
              className="input-style w-full font-medium text-gray-700 min-h-[120px] py-3 resize-none"
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
              disabled={saving || !formData.content}
              className="w-full sm:w-auto px-8 h-[46px] bg-[#4c7085] hover:bg-[#405d6f] text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  {editingId ? <FaSave /> : <FaPlus />}
                  {editingId ? "Update Note" : "Add Note"}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 sm:px-8 sm:py-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-800">Available Quote Notes</h3>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-600">Loading...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaStickyNote className="text-gray-300 text-xl" />
            </div>
            <p className="text-gray-600 font-medium">No notes configured</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest pl-8 w-3/4">Content</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-center">Active</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {notes.map((note) => (
                    <tr key={note.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 pl-8">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#4c7085]/10 text-[#4c7085] flex-shrink-0 flex items-center justify-center mt-0.5">
                            <FaStickyNote size={14} />
                          </div>
                          <span className="font-medium text-gray-800 whitespace-pre-wrap">{note.content}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center align-top pt-5">
                        <button
                          onClick={() => toggleActive(note)}
                          className="focus:outline-none"
                          disabled={!hasPermission("local_move", "edit")}
                        >
                          {note.is_active ? <FaToggleOn className="text-2xl text-green-500" /> : <FaToggleOff className="text-2xl text-gray-300" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right pr-8 align-top pt-5">
                        <div className="flex items-center justify-end gap-2">
                          {hasPermission("local_move", "edit") && (
                            <button
                              onClick={() => startEdit(note)}
                              className="w-8 h-8 flex items-center justify-center text-[#4c7085] bg-gray-50 rounded-lg hover:bg-[#4c7085] hover:text-white transition-colors"
                            >
                              <FaEdit size={14} />
                            </button>
                          )}
                          {hasPermission("local_move", "delete") && (
                            <button
                              onClick={() => handleDelete(note.id)}
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
              {notes.map((note) => (
                <div key={note.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                      <div className="w-8 h-8 rounded-lg bg-[#4c7085]/10 text-[#4c7085] flex-shrink-0 flex items-center justify-center mt-0.5">
                        <FaStickyNote size={14} />
                      </div>
                      <p className="font-medium text-gray-800 text-sm whitespace-pre-wrap">{note.content}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => toggleActive(note)}
                        className="focus:outline-none"
                        disabled={!hasPermission("local_move", "edit")}
                      >
                        {note.is_active ? <FaToggleOn className="text-2xl text-green-500" /> : <FaToggleOff className="text-2xl text-gray-300" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-gray-50">
                    {hasPermission("local_move", "edit") && (
                      <button
                        onClick={() => startEdit(note)}
                        className="flex-1 sm:flex-none py-2 px-4 bg-gray-100 text-[#4c7085] rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <FaEdit /> Edit
                      </button>
                    )}
                    {hasPermission("local_move", "delete") && (
                      <button
                        onClick={() => handleDelete(note.id)}
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

export default NoteTab;