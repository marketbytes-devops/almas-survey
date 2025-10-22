import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Button from "../../components/Button";
import Input from "../../components/Input";

const Room = () => {
  const [rooms, setRooms] = useState([]);
  const [items, setItems] = useState({}); 
  const [selectedRoomForItem, setSelectedRoomForItem] = useState(null);
  const [expandedRooms, setExpandedRooms] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [savingRoom, setSavingRoom] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
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
    },
  });

  const { handleSubmit: handleRoomSubmit, reset: resetRoom } = roomMethods;
  const { handleSubmit: handleItemSubmit, reset: resetItem } = itemMethods;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const roomsResponse = await apiClient.get("/rooms/");
        setRooms(roomsResponse.data);

        const itemsResponse = await apiClient.get("/items/");
        const itemsByRoom = {};
        itemsResponse.data.forEach((item) => {
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
    setExpandedRooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const onSaveRoom = async (data) => {
    if (!data.name.trim()) return;
    setSavingRoom(true);
    setError(null);
    try {
      const payload = { name: data.name, description: data.description || "" };
      const response = await apiClient.post("/rooms/", payload);
      setRooms([...rooms, response.data]);
      resetRoom();
      setSuccess("Room saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save room. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingRoom(false);
    }
  };

  const onSaveItem = async (data) => {
    if (!data.name.trim() || !selectedRoomForItem) return;
    setSavingItem(true);
    setError(null);
    try {
      const payload = { 
        name: data.name, 
        description: data.description || "", 
        room: selectedRoomForItem 
      };
      const response = await apiClient.post("/items/", payload);
      setItems((prev) => {
        const updated = { ...prev };
        if (!updated[selectedRoomForItem]) {
          updated[selectedRoomForItem] = [];
        }
        updated[selectedRoomForItem].push(response.data);
        return updated;
      });
      resetItem();
      setSelectedRoomForItem(null);
      setSuccess("Item saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save item. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm("Are you sure you want to delete this room? This will also delete all items in it.")) {
      return;
    }
    setError(null);
    try {
      await apiClient.delete(`/rooms/${id}/`);
      setRooms(rooms.filter((r) => r.id !== id));
      setItems((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      setSuccess("Room deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete room. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteItem = async (itemId, roomId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }
    setError(null);
    try {
      await apiClient.delete(`/items/${itemId}/`);
      setItems((prev) => {
        const updated = { ...prev };
        if (updated[roomId]) {
          updated[roomId] = updated[roomId].filter((item) => item.id !== itemId);
        }
        return updated;
      });
      setSuccess("Item deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete item. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <h2 className="text-lg font-semibold mb-6">Manage Rooms and Items</h2>
      
      <div className="space-y-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="text-md font-medium mb-4">Add New Room</h3>
          <FormProvider {...roomMethods}>
            <form onSubmit={handleRoomSubmit(onSaveRoom)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Room Name *"
                  name="name"
                  type="text"
                  rules={{ required: "Room Name is required" }}
                  disabled={savingRoom}
                />
                <Input
                  label="Description (optional)"
                  name="description"
                  type="textarea"
                  disabled={savingRoom}
                />
              </div>
              <Button
                type="submit"
                disabled={!roomMethods.watch("name")?.trim() || savingRoom}
                className="w-full md:w-auto"
              >
                {savingRoom ? "Saving..." : "Save New Room"}
              </Button>
            </form>
          </FormProvider>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="text-md font-medium mb-4">Add New Item to Room</h3>
          <select
            value={selectedRoomForItem || ""}
            onChange={(e) => setSelectedRoomForItem(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={savingItem}
          >
            <option value="">Select a Room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </select>
          {selectedRoomForItem && (
            <FormProvider {...itemMethods}>
              <form onSubmit={handleItemSubmit(onSaveItem)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Item Name *"
                    name="name"
                    type="text"
                    rules={{ required: "Item Name is required" }}
                    disabled={savingItem}
                  />
                  <Input
                    label="Description (optional)"
                    name="description"
                    type="textarea"
                    disabled={savingItem}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!itemMethods.watch("name")?.trim() || savingItem}
                  className="w-full md:w-auto"
                >
                  {savingItem ? "Saving..." : "Save New Item"}
                </Button>
              </form>
            </FormProvider>
          )}
        </div>
        {rooms.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <h3 className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
              Existing Rooms and Items ({rooms.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Count</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rooms.map((room) => (
                    <React.Fragment key={room.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {room.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={room.description || "No description"}>
                          {room.description || "No description"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {items[room.id]?.length || 0}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <Button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded mr-2"
                          >
                            Delete Room
                          </Button>
                          <button
                            onClick={() => toggleRoomExpansion(room.id)}
                            className="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                          >
                            {expandedRooms.has(room.id) ? "Hide Items" : "Show Items"}
                          </button>
                        </td>
                      </tr>
                      {expandedRooms.has(room.id) && (
                        <tr>
                          <td colSpan="4" className="p-0">
                            <div className="bg-gray-50">
                              {items[room.id] && items[room.id].length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {items[room.id].map((item) => (
                                      <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={item.description || "No description"}>{item.description || "No description"}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                          <Button
                                            onClick={() => handleDeleteItem(item.id, room.id)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs rounded"
                                          >
                                            Delete
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-gray-500 text-sm text-center py-4">No items in this room.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No rooms available. Add one above!
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;