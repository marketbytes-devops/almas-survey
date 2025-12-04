import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Loading from "../../components/Loading";

const Room = () => {
  const [rooms, setRooms] = useState([]);
  const [items, setItems] = useState({});
  const [selectedRoomForItem, setSelectedRoomForItem] = useState(null);
  const [expandedRooms, setExpandedRooms] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [savingRoom, setSavingRoom] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const roomMethods = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const itemMethods = useForm({
    defaultValues: {
      name: "",
      description: "",
      width: "",
      length: "",
      height: "",
      volume: "",
      weight: "",
    },
  });

  const { handleSubmit: handleRoomSubmit, reset: resetRoom } = roomMethods;
  const {
    handleSubmit: handleItemSubmit,
    reset: resetItem,
    watch: watchItem,
    setValue: setItemValue,
    getValues: getItemValues,
  } = itemMethods;

  // Watch dimension fields for live calculation
  const length = watchItem("length");
  const width = watchItem("width");
  const height = watchItem("height");

  // Auto-calculate volume & weight whenever L, W, or H changes
  useEffect(() => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;

    if (l > 0 && w > 0 && h > 0) {
      const volume = ((l * w * h) / 1_000_000).toFixed(4);
      const weight = (volume * 110).toFixed(2);
      setItemValue("volume", volume, { shouldValidate: false });
      setItemValue("weight", weight, { shouldValidate: false });
    } else if (length === "" && width === "" && height === "") {
      // Only clear if all are empty
      setItemValue("volume", "");
      setItemValue("weight", "");
    }
    // Don't clear if user is editing and has partial input
  }, [length, width, height, setItemValue]);

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
          if (!itemsByRoom[item.room]) {
            itemsByRoom[item.room] = [];
          }
          itemsByRoom[item.room].push(item);
        });
        setItems(itemsByRoom);
      } catch (err) {
        setError("Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleRoomExpansion = (roomId) => {
    setExpandedRooms((prev) => {
      const newSet = new Set(prev);
      newSet.has(roomId) ? newSet.delete(roomId) : newSet.add(roomId);
      return newSet;
    });
  };

  // ROOM CRUD
  const handleEditRoom = (room) => {
    setEditingRoomId(room.id);
    resetRoom({
      name: room.name,
      description: room.description || "",
    });
  };

  const cancelEditRoom = () => {
    setEditingRoomId(null);
    resetRoom();
  };

  const onSaveRoom = async (data) => {
    if (!data.name.trim()) return;
    setSavingRoom(true);
    setError(null);
    try {
      const payload = { name: data.name, description: data.description || "" };

      if (editingRoomId) {
        const res = await apiClient.put(`/rooms/${editingRoomId}/`, payload);
        setRooms((prev) =>
          prev.map((r) => (r.id === editingRoomId ? res.data : r))
        );
        cancelEditRoom();
        setSuccess("Room updated successfully!");
      } else {
        const res = await apiClient.post("/rooms/", payload);
        setRooms((prev) => [...prev, res.data]);
        resetRoom();
        setSuccess("Room created successfully!");
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save room.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingRoom(false);
    }
  };

  // ITEM CRUD
  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setSelectedRoomForItem(item.room);

    // Reset form with existing values
    resetItem({
      name: item.name || "",
      description: item.description || "",
      length: item.length || "",
      width: item.width || "",
      height: item.height || "",
      volume: item.volume || "",

      weight: item.weight || "", // we will recalculate below
    });

    // Force trigger calculation immediately after reset
    setTimeout(() => {
      const l = item.length || "";
      const w = item.width || "";
      const h = item.height || "";

      if (l && w && h) {
        const vol = (
          (parseFloat(l) * parseFloat(w) * parseFloat(h)) /
          1_000_000
        ).toFixed(4);
        const wt = (vol * 110).toFixed(2);
        setItemValue("volume", vol);
        setItemValue("weight", wt);
      } else {
        setItemValue("volume", item.volume || "");
        setItemValue("weight", item.weight || "");
      }
    }, 0);
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    setSelectedRoomForItem(null);
    resetItem();
  };

  const onSaveItem = async (data) => {
    if (!data.name.trim() || !selectedRoomForItem) return;
    setSavingItem(true);
    setError(null);
    try {
      const payload = {
        name: data.name,
        description: data.description || "",
        room: selectedRoomForItem,
        length: data.length ? parseFloat(data.length) : null,
        width: data.width ? parseFloat(data.width) : null,
        height: data.height ? parseFloat(data.height) : null,
        volume: data.volume ? parseFloat(data.volume) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
      };

      let response;
      if (editingItemId) {
        response = await apiClient.put(`/items/${editingItemId}/`, payload);
        setItems((prev) => ({
          ...prev,
          [selectedRoomForItem]: prev[selectedRoomForItem].map((i) =>
            i.id === editingItemId ? response.data : i
          ),
        }));
        cancelEditItem();
        setSuccess("Item updated successfully!");
      } else {
        response = await apiClient.post("/items/", payload);
        setItems((prev) => ({
          ...prev,
          [selectedRoomForItem]: [
            ...(prev[selectedRoomForItem] || []),
            response.data,
          ],
        }));
        resetItem();
        setSelectedRoomForItem(null);
        setSuccess("Item created successfully!");
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save item.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!confirm("Delete this room and all its items?")) return;
    try {
      await apiClient.delete(`/rooms/${id}/`);
      setRooms((prev) => prev.filter((r) => r.id !== id));
      setItems((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      setSuccess("Room deleted.");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to delete room.");
    }
  };

  const handleDeleteItem = async (itemId, roomId) => {
    if (!confirm("Delete this item?")) return;
    try {
      await apiClient.delete(`/items/${itemId}/`);
      setItems((prev) => ({
        ...prev,
        [roomId]: prev[roomId].filter((i) => i.id !== itemId),
      }));
      setSuccess("Item deleted.");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to delete item.");
    }
  };

  // Enhanced display for items list
  const formatItemDimensions = (item) => {
    const parts = [];
    if (item.length) parts.push(`L:${item.length}cm`);
    if (item.width) parts.push(`W:${item.width}cm`);
    if (item.height) parts.push(`H:${item.height}cm`);
    if (item.volume) parts.push(`Vol:${item.volume}m³`);
    if (item.weight) parts.push(`Wt:${item.weight}kg`);
    return parts.length > 0 ? parts.join(" × ") : "No dimensions";
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );

  return (
    <div className="p-4 mx-auto max-w-full bg-white rounded-lg shadow-md">
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4 mt-2 text-gray-800">
        Manage Rooms & Items
      </h2>

      <div className="grid lg:grid-cols gap-8">
        {/* ADD / EDIT ROOM */}
        <div className="space-y-6">
          {/* Room Form */}
          <div className="p-6 border border-gray-300 rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">
              {editingRoomId ? "Edit Room" : "Add New Room"}
            </h3>
            <FormProvider {...roomMethods}>
              <form
                onSubmit={handleRoomSubmit(onSaveRoom)}
                className="space-y-4"
              >
                <Input
                  label="Room Name"
                  name="name"
                  rules={{ required: true }}
                  disabled={savingRoom}
                />
                <Input
                  label="Description"
                  name="description"
                  type="textarea"
                  disabled={savingRoom}
                />
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={savingRoom || !roomMethods.watch("name")?.trim()}
                  >
                    {savingRoom
                      ? "Saving..."
                      : editingRoomId
                      ? "Update Room"
                      : "Save Room"}
                  </Button>
                  {editingRoomId && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={cancelEditRoom}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </FormProvider>
          </div>

          {/* Item Form */}
          <div className="p-6 border border-gray-300 rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">
              {editingItemId ? "Edit Item" : "Add New Item"}
            </h3>
            <select
              value={selectedRoomForItem || ""}
              onChange={(e) =>
                setSelectedRoomForItem(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full p-3 mb-4 border rounded-lg"
              disabled={savingItem}
            >
              <option value="">Select Room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {selectedRoomForItem && (
              <FormProvider {...itemMethods}>
                <form
                  onSubmit={handleItemSubmit(onSaveItem)}
                  className="space-y-5"
                >
                  <Input
                    label="Item Name"
                    name="name"
                    rules={{ required: true }}
                    disabled={savingItem}
                  />
                  <Input
                    label="Description"
                    name="description"
                    type="textarea"
                    disabled={savingItem}
                  />

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Dimensions (cm)
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <Input
                        label="Length"
                        name="length"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        disabled={savingItem}
                      />
                      <Input
                        label="Width"
                        name="width"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        disabled={savingItem}
                      />
                      <Input
                        label="Height"
                        name="height"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        disabled={savingItem}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Volume (m³){" "}
                        <span className="text-xs text-gray-500">(auto)</span>
                      </label>
                      <input
                        type="text"
                        value={watchItem("volume") || ""}
                        readOnly
                        className="mt-1 w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm"
                        placeholder="Auto-calculated"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Weight (kg){" "}
                        <span className="text-xs text-gray-500">(est.)</span>
                      </label>
                      <input
                        type="text"
                        value={watchItem("weight") || ""}
                        readOnly
                        className="mt-1 w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm"
                        placeholder="Auto-estimated"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={savingItem || !watchItem("name")?.trim()}
                    >
                      {savingItem
                        ? "Saving..."
                        : editingItemId
                        ? "Update Item"
                        : "Save Item"}
                    </Button>
                    {editingItemId && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={cancelEditItem}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </FormProvider>
            )}
          </div>
        </div>

        {/* LIST */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <h3 className="bg-gray-50 px-6 py-4 text-lg font-semibold">
            Rooms & Items ({rooms.length})
          </h3>
          <div className="max-h-screen overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="text-left p-4">Room</th>
                  <th className="text-left p-4">Items</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <React.Fragment key={room.id}>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="p-4 font-medium">{room.name}</td>
                      <td className="p-4 text-gray-600">
                        {items[room.id]?.length || 0}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditRoom(room)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            Delete
                          </Button>
                          <button
                            onClick={() => toggleRoomExpansion(room.id)}
                            className="text-indigo-600 text-sm"
                          >
                            {expandedRooms.has(room.id) ? "Hide" : "Show"} Items
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRooms.has(room.id) &&
                      items[room.id]?.length > 0 && (
                        <tr>
                          <td colSpan={3} className="p-0 bg-gray-50">
                            <div className="p-4">
                              {items[room.id].map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between items-center py-2 px-4 hover:bg-white rounded"
                                >
                                  <div>
                                    <span className="font-medium">
                                      {item.name}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-3">
                                      {formatItemDimensions(item)}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleEditItem(item)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="danger"
                                      onClick={() =>
                                        handleDeleteItem(item.id, room.id)
                                      }
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {rooms.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No rooms yet. Create one!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
