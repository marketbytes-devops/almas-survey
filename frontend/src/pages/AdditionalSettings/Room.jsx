/* src/pages/AdditionalSettings/Room.jsx */
import React, { useState, useEffect, useRef } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiPlus, FiTrash2, FiEdit2, FiSearch, FiX, FiInfo,
  FiEye, FiEyeOff, FiCopy, FiChevronDown, FiChevronUp
} from "react-icons/fi";
import apiClient from "../../api/apiClient";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Loading from "../../components/Loading";

const Room = () => {
  const [rooms, setRooms] = useState([]);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRooms, setExpandedRooms] = useState(new Set());

  // Modals
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [copyModal, setCopyModal] = useState(null); // { type: 'room'|'item', sourceId, sourceName }

  // State for editing
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [targetRoomId, setTargetRoomId] = useState("");

  const roomMethods = useForm({
    defaultValues: { name: "", description: "" },
  });

  const itemMethods = useForm({
    defaultValues: {
      room: "",
      items: [{ name: "", description: "", length: "", width: "", height: "", volume: "", weight: "" }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: itemMethods.control,
    name: "items"
  });

  useEffect(() => {
    fetchData();
  }, []);

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
    } catch (err) {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRoomExpansion = (id) => {
    setExpandedRooms((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  // ROOM ACTIONS
  const onRoomSubmit = async (data) => {
    setSaving(true);
    setError(null);
    try {
      if (editingRoom) {
        const res = await apiClient.put(`/rooms/${editingRoom.id}/`, data);
        setRooms(rooms.map(r => r.id === editingRoom.id ? res.data : r));
        setSuccess("Room updated!");
      } else {
        const res = await apiClient.post("/rooms/", data);
        setRooms([...rooms, res.data]);
        setSuccess("Room created!");
      }
      setIsRoomModalOpen(false);
      roomMethods.reset();
      setEditingRoom(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to save room.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm("Delete room and all items?")) return;
    try {
      await apiClient.delete(`/rooms/${id}/`);
      setRooms(rooms.filter((r) => r.id !== id));
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

  // ITEM ACTIONS
  const onItemSubmit = async (data) => {
    setSaving(true);
    setError(null);
    try {
      const roomId = parseInt(data.room);
      const requests = data.items.map(item => {
        const payload = {
          ...item,
          room: roomId,
          length: item.length ? parseFloat(item.length) : null,
          width: item.width ? parseFloat(item.width) : null,
          height: item.height ? parseFloat(item.height) : null,
          volume: item.volume ? parseFloat(item.volume) : null,
          weight: item.weight ? parseFloat(item.weight) : null,
        };

        if (editingItem && item.id === editingItem.id) {
          return apiClient.put(`/items/${editingItem.id}/`, payload);
        }
        return apiClient.post("/items/", payload);
      });

      const responses = await Promise.all(requests);
      const newItemsData = responses.map(r => r.data);

      setItems(prev => ({
        ...prev,
        [roomId]: [
          ...(prev[roomId] || []).filter(i => !newItemsData.find(ni => ni.id === i.id)),
          ...newItemsData
        ]
      }));

      setSuccess(editingItem ? "Item updated!" : "Items added!");
      setIsItemModalOpen(false);
      itemMethods.reset();
      setEditingItem(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save items.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id, roomId) => {
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

  // COPY LOGIC
  const openCopyModal = (type, sourceId, sourceName) => {
    setCopyModal({ type, sourceId, sourceName });
    setTargetRoomId("");
  };

  const performCopy = async () => {
    if (!targetRoomId || targetRoomId === copyModal.sourceId) {
      setError("Select a valid destination room");
      return;
    }
    setSaving(true);
    try {
      if (copyModal.type === "item") {
        const allItems = Object.values(items).flat();
        const item = allItems.find((i) => i.id === copyModal.sourceId);
        const res = await apiClient.post("/items/", { ...item, room: targetRoomId, id: undefined });
        setItems(prev => ({ ...prev, [targetRoomId]: [...(prev[targetRoomId] || []), res.data] }));
      } else {
        const roomItems = items[copyModal.sourceId] || [];
        const requests = roomItems.map(item => apiClient.post("/items/", { ...item, room: targetRoomId, id: undefined }));
        const responses = await Promise.all(requests);
        const newItems = responses.map(r => r.data);
        setItems(prev => ({ ...prev, [targetRoomId]: [...(prev[targetRoomId] || []), ...newItems] }));
      }
      setSuccess("Copied successfully!");
      setCopyModal(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Copy failed");
    } finally {
      setSaving(false);
    }
  };

  const calculateVolumeWeight = (index, field, value) => {
    const values = itemMethods.getValues(`items.${index}`);
    let { length, width, height } = values;

    if (field === 'length') length = value;
    if (field === 'width') width = value;
    if (field === 'height') height = value;

    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;

    if (l > 0 && w > 0 && h > 0) {
      const volume = ((l * w * h) / 1000000).toFixed(4);
      const weight = (volume * 110).toFixed(2);
      itemMethods.setValue(`items.${index}.volume`, volume);
      itemMethods.setValue(`items.${index}.weight`, weight);
    } else {
      itemMethods.setValue(`items.${index}.volume`, "");
      itemMethods.setValue(`items.${index}.weight`, "");
    }
  };

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;

  return (
    <div className="mx-auto space-y-6 min-h-screen bg-slate-50">
      <PageHeader title="Rooms & Items" subtitle="Manage rooms and items with dimensions" />

      <div className="space-y-6 pb-12">
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center shadow-sm">
              <FiInfo className="mr-2" /> {success}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center shadow-sm">
              <FiInfo className="mr-2" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#4c7085] transition-all duration-200">
            <FiSearch className="absolute left-8 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
            <input
              type="text"
              placeholder="Search rooms..."
              className="input-style w-full !pl-12 h-[56px] rounded-2xl border-gray-100 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <button
              onClick={() => { setEditingRoom(null); roomMethods.reset(); setIsRoomModalOpen(true); }}
              className="bg-[#4c7085] hover:bg-[#3a5d72] text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-medium shadow-sm hover:shadow active:scale-[0.99]"
            >
              <FiPlus /> Add Room
            </button>
            <button
              onClick={() => { setEditingItem(null); itemMethods.reset({ items: [{ name: "", description: "", length: "", width: "", height: "", volume: "", weight: "" }] }); setIsItemModalOpen(true); }}
              className="btn-secondary"
            >
              <FiPlus /> Add Item
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <div key={room.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors duration-150">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-800">{room.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{room.description || "No description"}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                        {items[room.id]?.length || 0} Items
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingRoom(room); roomMethods.reset(room); setIsRoomModalOpen(true); }} className="p-2 text-slate-400 hover:text-[#4c7085] hover:bg-slate-100 rounded-lg transition-all" title="Edit Room"><FiEdit2 /></button>
                    <button onClick={() => openCopyModal('room', room.id, room.name)} className="p-2 text-slate-400 hover:text-green-600 hover:bg-slate-100 rounded-lg transition-all" title="Copy Room"><FiCopy /></button>
                    <button onClick={() => handleDeleteRoom(room.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete Room"><FiTrash2 /></button>
                    <button onClick={() => toggleRoomExpansion(room.id)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all">
                      {expandedRooms.has(room.id) ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedRooms.has(room.id) && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-slate-100 bg-slate-50/30">
                      <div className="p-4 space-y-3">
                        {items[room.id]?.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items[room.id].map((item) => (
                              <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm group">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-slate-800">{item.name}</h4>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingItem(item); itemMethods.reset({ room: room.id, items: [item] }); setIsItemModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-[#4c7085]"><FiEdit2 size={14} /></button>
                                    <button onClick={() => openCopyModal('item', item.id, item.name)} className="p-1.5 text-slate-400 hover:text-green-600"><FiCopy size={14} /></button>
                                    <button onClick={() => handleDeleteItem(item.id, room.id)} className="p-1.5 text-slate-400 hover:text-red-500"><FiTrash2 size={14} /></button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-500">
                                  <div className="col-span-2">{item.description}</div>
                                  <div>L: {item.length}cm</div>
                                  <div>W: {item.width}cm</div>
                                  <div>H: {item.height}cm</div>
                                  <div className="font-medium text-slate-700">Vol: {item.volume}m³</div>
                                  <div className="font-medium text-slate-700">Wt: {item.weight}kg</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-400 text-sm">No items in this room.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-100">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch size={24} className="text-slate-300" />
              </div>
              <p>No rooms found. Start by adding one!</p>
            </div>
          )}
        </div>
      </div>

      {/* ROOM MODAL */}
      <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title={editingRoom ? "Edit Room" : "Add New Room"}>
        <FormProvider {...roomMethods}>
          <form onSubmit={roomMethods.handleSubmit(onRoomSubmit)} className="space-y-4">
            <Input label="Room Name" name="name" rules={{ required: "Required" }} placeholder="e.g. Living Room" />
            <Input label="Description" name="description" type="textarea" placeholder="Optional details..." />
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setIsRoomModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#4c7085] text-white rounded-xl font-medium shadow-sm">{saving ? "Saving..." : "Save Room"}</button>
            </div>
          </form>
        </FormProvider>
      </Modal>

      {/* ITEM MODAL */}
      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title={editingItem ? "Edit Item" : "Add New Item"} className="max-w-2xl">
        <FormProvider {...itemMethods}>
          <form onSubmit={itemMethods.handleSubmit(onItemSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Target Room</label>
                <select {...itemMethods.register("room", { required: "Select a room" })} className="input-style w-full">
                  <option value="">Select Room</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative">
                    {fields.length > 1 && !editingItem && (
                      <button type="button" onClick={() => remove(index)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><FiTrash2 /></button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Item Name" name={`items.${index}.name`} rules={{ required: "Required" }} />
                      <Input label="Description" name={`items.${index}.description`} />
                      <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                        <Input label="L (cm)" name={`items.${index}.length`} type="number" onChange={(e) => calculateVolumeWeight(index, 'length', e.target.value)} />
                        <Input label="W (cm)" name={`items.${index}.width`} type="number" onChange={(e) => calculateVolumeWeight(index, 'width', e.target.value)} />
                        <Input label="H (cm)" name={`items.${index}.height`} type="number" onChange={(e) => calculateVolumeWeight(index, 'height', e.target.value)} />
                      </div>
                      <Input label="Volume (m³)" name={`items.${index}.volume`} readOnly disabled />
                      <Input label="Weight (kg)" name={`items.${index}.weight`} readOnly disabled />
                    </div>
                  </div>
                ))}
              </div>

              {!editingItem && (
                <button type="button" onClick={() => append({ name: "", description: "", length: "", width: "", height: "", volume: "", weight: "" })} className="w-full py-2 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl hover:border-[#4c7085] hover:text-[#4c7085] transition-all flex items-center justify-center gap-2 font-medium">
                  <FiPlus /> Add Multiple Items
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsItemModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#4c7085] text-white rounded-xl font-medium shadow-sm">{saving ? "Saving..." : "Save Items"}</button>
            </div>
          </form>
        </FormProvider>
      </Modal>

      {/* COPY MODAL */}
      <Modal isOpen={!!copyModal} onClose={() => setCopyModal(null)} title={`Copy ${copyModal?.type === 'item' ? 'Item' : 'Room Content'}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Copying: <span className="font-medium text-slate-800">{copyModal?.sourceName}</span></p>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Destination Room</label>
            <select value={targetRoomId} onChange={(e) => setTargetRoomId(e.target.value)} className="input-style w-full">
              <option value="">Select Target Room</option>
              {rooms.filter(r => r.id !== copyModal?.sourceId).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setCopyModal(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium">Cancel</button>
            <button onClick={performCopy} disabled={saving || !targetRoomId} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium shadow-sm disabled:opacity-50">{saving ? "Copying..." : "Perform Copy"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Room;