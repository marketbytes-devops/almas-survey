import React, { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Loading from "../../components/Loading";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaClone, // Correct copy icon
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

  // Form rows
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

  // COPY MODAL
  const [copyModal, setCopyModal] = useState(null);
  const [targetRoomId, setTargetRoomId] = useState("");

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

  const toggleRoomExpansion = (id) => {
    setExpandedRooms((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  // ROOM CRUD
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
        setRooms((prev) =>
          prev.map((r) => (r.id === editingRoomId ? res.data : r))
        );
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

  // EDIT ITEM EDIT
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

  // ROW UPDATE
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
    if (!selectedRoomForItem) return setError("Select a room");
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
          ...(prev[selectedRoomForItem] || []).filter(
            (i) => i.id !== editingItemId
          ),
          ...newItems,
        ],
      }));

      setSuccess(editingItemId ? "Updated!" : "Items added!");
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
      setError("Failed to save");
    } finally {
      setSavingItems(false);
    }
  };

  // COPY LOGIC
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
        // FIXED: Find item by correct ID
        const allItems = Object.values(items).flat();
        const item = allItems.find((i) => i.id === copyModal.sourceId);

        if (!item) {
          setError("Item not found");
          return;
        }

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
        if (roomItems.length === 0) {
          setError("No items to copy");
          return;
        }

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
        setSuccess(
          `Copied ${newItems.length} items from "${copyModal.sourceName}"`
        );
      }

      setCopyModal(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setError("Copy failed");
      setTimeout(() => setError(null), 3000);
    }
  };

  // DELETE
  const deleteRoom = async (id) => {
    if (!confirm("Delete room and all items?")) return;
    await apiClient.delete(`/rooms/${id}/`);
    setRooms((prev) => prev.filter((r) => r.id !== id));
    setItems((prev) => {
      const c = { ...prev };
      delete c[id];
      return c;
    });
    setSuccess("Room deleted");
  };

  const deleteItem = async (id, roomId) => {
    if (!confirm("Delete item?")) return;
    await apiClient.delete(`/items/${id}/`);
    setItems((prev) => ({
      ...prev,
      [roomId]: prev[roomId].filter((i) => i.id !== id),
    }));
    setSuccess("Item deleted");
  };

  const formatDimensions = (item) => {
    const p = [];
    if (item.length) p.push(`L:${item.length}cm`);
    if (item.width) p.push(`W:${item.width}cm`);
    if (item.height) p.push(`H:${item.height}cm`);
    if (item.volume) p.push(`Vol:${item.volume}m³`);
    if (item.weight) p.push(`Wt:${item.weight}kg`);
    return p.length ? p.join(" × ") : "No dimensions";
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );

  return (
    <div className="p-6 max-w-full mx-auto">
      {success && (
        <div className="mb-4 p-4 bg-green-100 rounded-lg">{success}</div>
      )}
      {error && <div className="mb-4 p-4 bg-red-100 rounded-lg">{error}</div>}

      <h1 className="text-3xl font-bold mb-8">Manage Rooms & Items</h1>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* LEFT: FORMS */}
        <div className="space-y-8">
          {/* Room Form */}
          <div className="bg-white p-8 rounded-xl shadow">
            <h2 className="text-2xl font-bold mb-6">
              {editingRoomId ? "Edit Room" : "Add New Room"}
            </h2>
            <input
              type="text"
              placeholder="Room Name *"
              value={roomForm.name}
              onChange={(e) =>
                setRoomForm({ ...roomForm, name: e.target.value })
              }
              className="w-full p-3 border rounded-lg mb-4"
            />
            <input
              type="text"
              placeholder="Description"
              value={roomForm.description}
              onChange={(e) =>
                setRoomForm({ ...roomForm, description: e.target.value })
              }
              className="w-full p-3 border rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <Button onClick={saveRoom} disabled={savingRoom}>
                {savingRoom ? "Saving..." : editingRoomId ? "Update" : "Create"}
              </Button>
              {editingRoomId && (
                <Button variant="secondary" onClick={cancelEditRoom}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Add/Edit Items */}
          <div className="bg-white p-8 rounded-xl shadow">
            <h2 className="text-2xl font-bold mb-6">
              {editingItemId ? "Edit Item" : "Add Items"}
            </h2>
            <select
              value={selectedRoomForItem || ""}
              onChange={(e) =>
                setSelectedRoomForItem(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full p-3 border rounded-lg mb-6"
            >
              <option value="">Select Room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {selectedRoomForItem && (
              <>
                {itemRows.map((row, idx) => (
                  <div
                    key={row.id}
                    className="p-6 mb-6 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex justify-between mb-4">
                      <h4>Item {idx + 1}</h4>
                      {itemRows.length > 1 && (
                        <button
                          onClick={() =>
                            setItemRows((prev) =>
                              prev.filter((r) => r.id !== row.id)
                            )
                          }
                          className="text-red-600"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Name *"
                      value={row.name}
                      onChange={(e) =>
                        updateRow(row.id, "name", e.target.value)
                      }
                      className="w-full p-3 border rounded mb-3"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={row.description}
                      onChange={(e) =>
                        updateRow(row.id, "description", e.target.value)
                      }
                      className="w-full p-3 border rounded mb-3"
                    />
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <input
                        type="number"
                        placeholder="Length"
                        value={row.length}
                        onChange={(e) =>
                          updateRow(row.id, "length", e.target.value)
                        }
                        className="p-3 border rounded"
                      />
                      <input
                        type="number"
                        placeholder="Width"
                        value={row.width}
                        onChange={(e) =>
                          updateRow(row.id, "width", e.target.value)
                        }
                        className="p-3 border rounded"
                      />
                      <input
                        type="number"
                        placeholder="Height"
                        value={row.height}
                        onChange={(e) =>
                          updateRow(row.id, "height", e.target.value)
                        }
                        className="p-3 border rounded"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        readOnly
                        value={row.volume || ""}
                        placeholder="Volume (m³)"
                        className="p-3 bg-gray-200 rounded"
                      />
                      <input
                        type="text"
                        readOnly
                        value={row.weight || ""}
                        placeholder="Weight (kg)"
                        className="p-3 bg-gray-200 rounded"
                      />
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={addItemRow}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg"
                  >
                    <FaPlus /> Add Another Item
                  </button>
                  <Button onClick={saveAllItems} disabled={savingItems}>
                    {savingItems
                      ? "Saving..."
                      : editingItemId
                      ? "Update"
                      : "Save All"}
                  </Button>
                  {editingItemId && (
                    <Button variant="secondary" onClick={cancelEditItem}>
                      Cancel
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: LIST */}
        <div className="bg-white rounded-xl shadow">
          <div className="bg-gray-100 px-6 py-4 font-bold text-lg border-b">
            Rooms & Items ({rooms.length})
          </div>
          <div className="max-h-screen overflow-y-auto">
            {rooms.map((room) => (
              <div key={room.id} className="border-b">
                <div className="flex items-center justify-between p-5 hover:bg-gray-50">
                  <div>
                    <div className="font-semibold text-lg">{room.name}</div>
                    <div className="text-sm text-gray-600">
                      {items[room.id]?.length || 0} items
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditRoom(room)}
                      className="text-blue-600"
                      title="Edit Room"
                    >
                      <FaEdit size={18} />
                    </button>
                    <button
                      onClick={() => openCopyModal("room", room.id, room.name)}
                      className="text-green-600"
                      title="Copy Room + All Items"
                    >
                      <FaClone size={18} />
                    </button>
                    <button
                      onClick={() => deleteRoom(room.id)}
                      className="text-red-600"
                    >
                      <FaTrash size={18} />
                    </button>
                    <button
                      onClick={() => toggleRoomExpansion(room.id)}
                      className="text-gray-600"
                    >
                      {expandedRooms.has(room.id) ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {expandedRooms.has(room.id) &&
                  items[room.id]?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-4 bg-gray-50 mx-4 mb-2 rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-gray-500 ml-4">
                          {formatDimensions(item)}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() =>
                            openCopyModal("item", item.id, item.name)
                          }
                          className="text-green-600"
                          title="Copy Item"
                        >
                          <FaClone size={16} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id, room.id)}
                          className="text-red-600"
                          title="Delete"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ))}

            {rooms.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                No rooms yet. Create one!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COPY MODAL */}
      {copyModal && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">
                Copy {copyModal.type === "item" ? "Item" : "Room"}
              </h3>
              <button
                onClick={() => setCopyModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-medium">Copy from</label>
                <input
                  type="text"
                  readOnly
                  value={copyModal.sourceName}
                  className="w-full p-3 bg-gray-100 rounded-lg mt-1"
                />
              </div>

              <div>
                <label className="block font-medium">Copy to</label>
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(Number(e.target.value))}
                  className="w-full p-3 border rounded-lg mt-1"
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

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="secondary" onClick={() => setCopyModal(null)}>
                Cancel
              </Button>
              <Button onClick={performCopy} disabled={!targetRoomId}>
                Copy Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
