import React, { useState, useEffect, useRef } from "react";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";
import Loading from "../../components/Loading";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaClone,
} from "react-icons/fa";

const Room = () => {
  const [rooms, setRooms] = useState([]);
  const [items, setItems] = useState({});
  const [selectedRoomForItem, setSelectedRoomForItem] = useState(null);
  const [expandedRooms, setExpandedRooms] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [savingRoom, setSavingRoom] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [itemRows, setItemRows] = useState([
    {
      id: Date.now(),
      name: "",
      description: "",
      length: "",
      width: "",
      height: "",
      volume: "",
      weight: "",
    },
  ]);

  const [roomForm, setRoomForm] = useState({ name: "", description: "" });
  const [copyModal, setCopyModal] = useState(null);
  const [targetRoomId, setTargetRoomId] = useState("");

  const roomNameInputRef = useRef(null);
  const itemNameInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsRes, itemsRes] = await Promise.all([
          apiClient.get("/rooms/"),
          apiClient.get("/items/"),
        ]);

        setRooms(roomsRes.data);

        const itemsByRoom = {};
        itemsRes.data.forEach((item) => {
          if (!itemsByRoom[item.room]) itemsByRoom[item.room] = [];
          itemsByRoom[item.room].push(item);
        });
        setItems(itemsByRoom);
      } catch {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (editingRoomId && roomNameInputRef.current) {
      roomNameInputRef.current.focus();
    }
  }, [editingRoomId]);

  useEffect(() => {
    if (editingItemId && itemNameInputRef.current) {
      itemNameInputRef.current.focus();
    }
  }, [editingItemId]);

  const toggleRoomExpansion = (id) => {
    setExpandedRooms((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleEditRoom = (room) => {
    setEditingRoomId(room.id);
    setRoomForm({ name: room.name, description: room.description || "" });
  };

  const cancelEditRoom = () => {
    setEditingRoomId(null);
    setRoomForm({ name: "", description: "" });
  };

  const saveRoom = async () => {
    if (!roomForm.name.trim()) return;
    setSavingRoom(true);
    try {
      if (editingRoomId) {
        const res = await apiClient.put(`/rooms/${editingRoomId}/`, roomForm);
        setRooms((prev) => prev.map((r) => (r.id === editingRoomId ? res.data : r)));
      } else {
        const res = await apiClient.post("/rooms/", roomForm);
        setRooms((prev) => [...prev, res.data]);
      }
      setSuccess(editingRoomId ? "Room updated!" : "Room created!");
      cancelEditRoom();
    } catch {
      setError("Failed to save room.");
    } finally {
      setSavingRoom(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleEditItem = (item) => {
    setItemRows([
      {
        id: item.id,
        name: item.name || "",
        description: item.description || "",
        length: item.length || "",
        width: item.width || "",
        height: item.height || "",
        volume: item.volume || "",
        weight: item.weight || "",
      },
    ]);
    setEditingItemId(item.id);
    setSelectedRoomForItem(item.room);
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    setSelectedRoomForItem(null);
    setItemRows([
      {
        id: Date.now(),
        name: "",
        description: "",
        length: "",
        width: "",
        height: "",
        volume: "",
        weight: "",
      },
    ]);
  };

  const updateRow = (id, field, value) => {
    setItemRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (["length", "width", "height"].includes(field)) {
          const l = parseFloat(updated.length) || 0;
          const w = parseFloat(updated.width) || 0;
          const h = parseFloat(updated.height) || 0;
          if (l > 0 && w > 0 && h > 0) {
            updated.volume = ((l * w * h) / 1000000).toFixed(4);
            updated.weight = (updated.volume * 110).toFixed(2);
          } else {
            updated.volume = "";
            updated.weight = "";
          }
        }
        return updated;
      })
    );
  };

  const addItemRow = () => {
    setItemRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "",
        description: "",
        length: "",
        width: "",
        height: "",
        volume: "",
        weight: "",
      },
    ]);
  };

  const saveAllItems = async () => {
    if (!selectedRoomForItem) return setError("Please select a room");
    const valid = itemRows.filter((r) => r.name.trim());
    if (valid.length === 0) return setError("Add at least one item");

    setSavingItems(true);
    try {
      const requests = valid.map((row) => {
        const payload = {
          name: row.name,
          description: row.description || "",
          room: selectedRoomForItem,
          length: row.length ? parseFloat(row.length) : null,
          width: row.width ? parseFloat(row.width) : null,
          height: row.height ? parseFloat(row.height) : null,
          volume: row.volume ? parseFloat(row.volume) : null,
          weight: row.weight ? parseFloat(row.weight) : null,
        };
        return editingItemId && row.id === editingItemId
          ? apiClient.put(`/items/${editingItemId}/`, payload)
          : apiClient.post("/items/", payload);
      });

      const res = await Promise.all(requests);
      const newItems = res.map((r) => r.data);

      setItems((prev) => ({
        ...prev,
        [selectedRoomForItem]: [
          ...(prev[selectedRoomForItem] || []).filter((i) => i.id !== editingItemId),
          ...newItems,
        ],
      }));

      setSuccess(editingItemId ? "Item updated!" : "Items added!");
      setItemRows([
        {
          id: Date.now(),
          name: "",
          description: "",
          length: "",
          width: "",
          height: "",
          volume: "",
          weight: "",
        },
      ]);
      setEditingItemId(null);
    } catch {
      setError("Failed to save items.");
    } finally {
      setSavingItems(false);
    }
  };

  const openCopyModal = (type, sourceId, sourceName) => {
    setCopyModal({ type, sourceId, sourceName });
    setTargetRoomId("");
  };

  const performCopy = async () => {
    if (!targetRoomId || targetRoomId === copyModal.sourceId) {
      setError("Please select a different room");
      return;
    }

    try {
      if (copyModal.type === "item") {
        const allItems = Object.values(items).flat();
        const item = allItems.find((i) => i.id === copyModal.sourceId);
        if (!item) return setError("Item not found");

        const res = await apiClient.post("/items/", {
          name: item.name,
          description: item.description || "",
          room: targetRoomId,
          length: item.length,
          width: item.width,
          height: item.height,
          volume: item.volume,
          weight: item.weight,
        });

        setItems((prev) => ({
          ...prev,
          [targetRoomId]: [...(prev[targetRoomId] || []), res.data],
        }));
        setSuccess(`Copied "${item.name}" successfully!`);
      }

      if (copyModal.type === "room") {
        const roomItems = items[copyModal.sourceId] || [];
        if (roomItems.length === 0) return setError("No items to copy");

        const requests = roomItems.map((item) =>
          apiClient.post("/items/", {
            name: item.name,
            description: item.description || "",
            room: targetRoomId,
            length: item.length,
            width: item.width,
            height: item.height,
            volume: item.volume,
            weight: item.weight,
          })
        );

        const responses = await Promise.all(requests);
        const newItems = responses.map((r) => r.data);

        setItems((prev) => ({
          ...prev,
          [targetRoomId]: [...(prev[targetRoomId] || []), ...newItems],
        }));
        setSuccess(`Copied ${newItems.length} items from "${copyModal.sourceName}"`);
      }

      setCopyModal(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Copy failed");
      setTimeout(() => setError(null), 3000);
    }
  };

  const deleteRoom = async (id) => {
    if (!window.confirm("Delete room and all items?")) return;
    try {
      await apiClient.delete(`/rooms/${id}/`);
      setRooms((prev) => prev.filter((r) => r.id !== id));
      setItems((prev) => {
        const c = { ...prev };
        delete c[id];
        return c;
      });
      setSuccess("Room deleted");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to delete room");
    }
  };

  const deleteItem = async (id, roomId) => {
    if (!window.confirm("Delete item?")) return;
    try {
      await apiClient.delete(`/items/${id}/`);
      setItems((prev) => ({
        ...prev,
        [roomId]: prev[roomId].filter((i) => i.id !== id),
      }));
      setSuccess("Item deleted");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to delete item");
    }
  };

  const formatDimensions = (item) => {
    const parts = [];
    if (item.length) parts.push(`L:${item.length}cm`);
    if (item.width) parts.push(`W:${item.width}cm`);
    if (item.height) parts.push(`H:${item.height}cm`);
    if (item.volume) parts.push(`Vol:${item.volume}m³`);
    if (item.weight) parts.push(`Wt:${item.weight}kg`);
    return parts.length ? parts.join(" × ") : "No dimensions";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-6">
          <h1 className="text-xs sm:text-lg font-medium">Manage Rooms & Items</h1>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {success && (
            <div className="p-4 bg-green-100 text-green-700 rounded-lg text-center font-medium border border-green-400">
              {success}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center font-medium border border-red-400">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-1 gap-8">
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
                <h2 className="text-xs sm:text-lg font-medium mb-6">
                  {editingRoomId ? "Edit Room" : "Add New Room"}
                </h2>
                <div className="space-y-4">
                  <Input
                    label="Room Name"
                    type="text"
                    placeholder="e.g. Living Room"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    disabled={savingRoom}
                    inputRef={roomNameInputRef}
                  />
                  <Input
                    label="Description (optional)"
                    type="textarea"
                    rows={3}
                    placeholder="e.g. Main living area with sofa..."
                    value={roomForm.description}
                    onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                    disabled={savingRoom}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={saveRoom}
                    disabled={savingRoom || !roomForm.name.trim()}
                    className={`w-full text-sm font-medium px-6 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${savingRoom || !roomForm.name.trim()
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:scale-105"
                      }`}
                  >
                    {savingRoom ? "Saving..." : editingRoomId ? "Update Room" : "Create Room"}
                  </button>
                  {editingRoomId && (
                    <button
                      onClick={cancelEditRoom}
                      className="w-full text-sm font-medium px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
                <h2 className="text-xs sm:text-lg font-medium mb-6">
                  {editingItemId ? "Edit Item" : "Add Items"}
                </h2>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Room *</label>
                  <select
                    value={selectedRoomForItem || ""}
                    onChange={(e) => setSelectedRoomForItem(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#4c7085] focus:ring-4 focus:ring-[#4c7085]/20 outline-none transition"
                  >
                    <option value="">Select Room</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRoomForItem && (
                  <>
                    {itemRows.map((row, idx) => (
                      <div key={row.id} className="p-5 mb-5 bg-gray-50 rounded-xl border border-gray-300">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-gray-800">Item {idx + 1}</h4>
                          {itemRows.length > 1 && (
                            <button
                              onClick={() => setItemRows((prev) => prev.filter((r) => r.id !== row.id))}
                              className="text-red-600 hover:text-red-800 transition"
                            >
                              <FaTrash size={18} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <Input
                            label="Item Name"
                            type="text"
                            placeholder="e.g. Sofa"
                            value={row.name}
                            onChange={(e) => updateRow(row.id, "name", e.target.value)}
                            inputRef={idx === 0 ? itemNameInputRef : null}
                          />
                          <Input
                            label="Description"
                            type="textarea"
                            rows={2}
                            placeholder="Optional description"
                            value={row.description}
                            onChange={(e) => updateRow(row.id, "description", e.target.value)}
                          />

                          <div className="grid grid-cols-3 gap-4">
                            <Input
                              label="Length (cm)"
                              type="number"
                              placeholder="0"
                              value={row.length}
                              onChange={(e) => updateRow(row.id, "length", e.target.value)}
                            />
                            <Input
                              label="Width (cm)"
                              type="number"
                              placeholder="0"
                              value={row.width}
                              onChange={(e) => updateRow(row.id, "width", e.target.value)}
                            />
                            <Input
                              label="Height (cm)"
                              type="number"
                              placeholder="0"
                              value={row.height}
                              onChange={(e) => updateRow(row.id, "height", e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Volume (m³)</label>
                              <input
                                type="text"
                                readOnly
                                value={row.volume || ""}
                                className="w-full px-4 py-3 bg-gray-100 rounded-lg text-gray-700"
                                placeholder="Auto-calculated"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Weight (kg)</label>
                              <input
                                type="text"
                                readOnly
                                value={row.weight || ""}
                                className="w-full px-4 py-3 bg-gray-100 rounded-lg text-gray-700"
                                placeholder="Auto-calculated"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={addItemRow}
                      className="w-full text-sm font-medium px-6 py-2 bg-[#4c7085] text-white rounded-lg hover:bg-[#6b8ca3] transition flex items-center justify-center gap-2"
                    >
                      <FaPlus /> Add Another Item
                    </button>
                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                      <button
                        onClick={saveAllItems}
                        disabled={savingItems}
                        className={`w-full text-sm font-medium px-6 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${savingItems
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:scale-105"
                          }`}
                      >
                        {savingItems ? "Saving..." : editingItemId ? "Update Item" : "Save All Items"}
                      </button>
                      {editingItemId && (
                        <button
                          onClick={cancelEditItem}
                          className="w-full text-sm font-medium px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-4 sm:px-6 py-3">
                <h3 className="text-xs sm:text-lg font-medium">
                  Rooms & Items ({rooms.length})
                </h3>
              </div>

              <div className="max-h-screen overflow-y-auto">
                {rooms.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <p className="text-base sm:text-lg mb-2">No rooms yet.</p>
                    <p className="text-sm">Create your first room using the form on the left!</p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <div key={room.id} className="border-b border-gray-200 last:border-0">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 hover:bg-gray-50 transition">
                        <div className="flex-1">
                          <div className="font-medium text-lg text-gray-800">{room.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {items[room.id]?.length || 0} item{items[room.id]?.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3 sm:mt-0">
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="text-[#4c7085] hover:text-[#6b8ca3] transition"
                            title="Edit Room"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            onClick={() => openCopyModal("room", room.id, room.name)}
                            className="text-green-600 hover:text-green-700 transition"
                            title="Copy Room + All Items"
                          >
                            <FaClone size={18} />
                          </button>
                          <button
                            onClick={() => deleteRoom(room.id)}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Delete Room"
                          >
                            <FaTrash size={18} />
                          </button>
                          <button
                            onClick={() => toggleRoomExpansion(room.id)}
                            className="text-gray-600 hover:text-gray-800 transition"
                            title={expandedRooms.has(room.id) ? "Hide items" : "Show items"}
                          >
                            {expandedRooms.has(room.id) ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                          </button>
                        </div>
                      </div>

                      {expandedRooms.has(room.id) && items[room.id]?.length > 0 && (
                        <div className="px-4 pb-4 space-y-3">
                          {items[room.id].map((item) => (
                            <div
                              key={item.id}
                              className="bg-gray-50 border border-gray-300 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {formatDimensions(item)}
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="text-[#4c7085] hover:text-[#6b8ca3] transition"
                                  title="Edit"
                                >
                                  <FaEdit size={16} />
                                </button>
                                <button
                                  onClick={() => openCopyModal("item", item.id, item.name)}
                                  className="text-green-600 hover:text-green-700 transition"
                                  title="Copy Item"
                                >
                                  <FaClone size={16} />
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id, room.id)}
                                  className="text-red-600 hover:text-red-800 transition"
                                  title="Delete"
                                >
                                  <FaTrash size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {copyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 sm:p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl sm:text-2xl font-medium text-gray-800">
                  Copy {copyModal.type === "item" ? "Item" : "Room"}
                </h3>
                <button
                  onClick={() => setCopyModal(null)}
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Copy from</label>
                  <input
                    type="text"
                    readOnly
                    value={copyModal.sourceName}
                    className="w-full px-4 py-3 bg-gray-100 rounded-lg text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Copy to</label>
                  <select
                    value={targetRoomId}
                    onChange={(e) => setTargetRoomId(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#4c7085] focus:ring-4 focus:ring-[#4c7085]/20 outline-none transition"
                  >
                    <option value="">Select destination room</option>
                    {rooms
                      .filter((r) => r.id !== copyModal.sourceId)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
                <button
                  onClick={() => setCopyModal(null)}
                  className="w-full sm:w-auto text-sm font-medium px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={performCopy}
                  disabled={!targetRoomId}
                  className={`w-full sm:w-auto text-sm font-medium px-6 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${!targetRoomId
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:scale-105"
                    }`}
                >
                  Copy Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;