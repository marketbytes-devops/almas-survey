// src/components/VolumeEntry/VolumeEntry.jsx
import React, { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import { FaPlus, FaMinus, FaTimes, FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function VolumeEntry({ onVolumeChange }) {
  const [rooms, setRooms] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch rooms and items on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsRes, itemsRes] = await Promise.all([
          apiClient.get("/rooms/"),
          apiClient.get("/items/")
        ]);
        setRooms(roomsRes.data);
        setItems(itemsRes.data);
        setError(null);
      } catch (err) {
        console.error("Failed to load rooms/items:", err);
        setError("Failed to load data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Add item to articles list
  const addItem = (item) => {
    const newArticle = {
      id: Date.now(),
      itemId: item.id,
      itemName: item.name,
      quantity: 1,
      length: item.length || "",
      width: item.width || "",
      height: item.height || "",
      volume: "",
    };
    
    // Calculate initial volume if dimensions exist
    if (item.length && item.width && item.height) {
      const l = parseFloat(item.length);
      const w = parseFloat(item.width);
      const h = parseFloat(item.height);
      newArticle.volume = ((l * w * h) / 1000000).toFixed(4);
    }
    
    const updated = [...articles, newArticle];
    setArticles(updated);
    calculateVolume(updated);
  };

  // Update article field
  const updateArticle = (id, field, value) => {
    const updated = articles.map(a => {
      if (a.id === id) {
        const newA = { ...a, [field]: value };
        
        // Recalculate volume if dimension changed
        if (field === "length" || field === "width" || field === "height" || field === "quantity") {
          const l = parseFloat(newA.length) || 0;
          const w = parseFloat(newA.width) || 0;
          const h = parseFloat(newA.height) || 0;
          newA.volume = (l && w && h) ? ((l * w * h) / 1000000).toFixed(4) : "0.0000";
        }
        return newA;
      }
      return a;
    });
    setArticles(updated);
    calculateVolume(updated);
  };

  // Calculate total volume
  const calculateVolume = (list) => {
    const total = list.reduce((sum, a) => {
      const v = parseFloat(a.volume) || 0;
      const q = parseInt(a.quantity) || 0;
      return sum + (v * q);
    }, 0);
    onVolumeChange(total.toFixed(4));
  };

  // Remove article
  const removeArticle = (id) => {
    const updated = articles.filter(a => a.id !== id);
    setArticles(updated);
    calculateVolume(updated);
  };

  // Increase quantity
  const increaseQuantity = (id) => {
    const updated = articles.map(a => 
      a.id === id ? { ...a, quantity: a.quantity + 1 } : a
    );
    setArticles(updated);
    calculateVolume(updated);
  };

  // Decrease quantity
  const decreaseQuantity = (id) => {
    const updated = articles.map(a => 
      a.id === id && a.quantity > 1 ? { ...a, quantity: a.quantity - 1 } : a
    );
    setArticles(updated);
    calculateVolume(updated);
  };

  // Calculate total volume for display
  const totalVolume = articles.reduce((sum, a) => {
    const v = parseFloat(a.volume) || 0;
    const q = parseInt(a.quantity) || 0;
    return sum + (v * q);
  }, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-2xl p-8 border-2 border-blue-200">
      {/* Header with Total Volume */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-blue-300">
        <h3 className="text-2xl font-bold text-gray-800">📦 Volume Entry</h3>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total Volume</div>
          <div className="text-4xl font-bold text-blue-600">
            {totalVolume.toFixed(4)} <span className="text-2xl">m³</span>
          </div>
        </div>
      </div>

      {/* Room Selector Dropdown */}
      <div className="mb-6 relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Room to Add Items
        </label>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full px-6 py-4 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-xl flex justify-between items-center hover:shadow-lg transition-all"
        >
          <span className="font-medium">
            {selectedRoom ? `📍 ${selectedRoom.name}` : "Choose a room..."}
          </span>
          {showDropdown ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        
        {showDropdown && (
          <div className="absolute z-20 bg-white border-2 border-gray-300 mt-2 rounded-xl shadow-2xl w-full max-h-64 overflow-y-auto">
            {rooms.length === 0 ? (
              <div className="px-6 py-4 text-gray-500 text-center">
                No rooms available
              </div>
            ) : (
              rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => {
                    setSelectedRoom(room);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-blue-50 transition-colors border-b last:border-b-0"
                >
                  <div className="font-semibold text-gray-800">{room.name}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Items List for Selected Room */}
      {selectedRoom && (
        <div className="mb-8 bg-white rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-bold text-gray-800 mb-4">
            Available Items in {selectedRoom.name}
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {items
              .filter(i => i.room === selectedRoom.id)
              .map(item => (
                <div 
                  key={item.id} 
                  className="border-2 border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{item.name}</div>
                      {item.length && item.width && item.height && (
                        <div className="text-sm text-gray-500 mt-1">
                          📏 {item.length} × {item.width} × {item.height} cm
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => addItem(item)}
                      className="ml-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <FaPlus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                </div>
              ))}
            {items.filter(i => i.room === selectedRoom.id).length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No items available for this room
              </div>
            )}
          </div>
        </div>
      )}

      {/* Added Items List */}
      {articles.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xl font-bold text-gray-800">✅ Added Items</h4>
            <div className="text-sm text-gray-600">
              {articles.length} item(s) added
            </div>
          </div>
          
          <div className="space-y-3">
            {articles.map(a => (
              <div 
                key={a.id} 
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all"
              >
                {/* Remove Button */}
                <button 
                  onClick={() => removeArticle(a.id)} 
                  className="text-red-600 hover:text-red-800 hover:scale-110 transition-all"
                  title="Remove item"
                >
                  <FaTimes className="w-5 h-5" />
                </button>

                {/* Item Details */}
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{a.itemName}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    📐 {a.length || "—"} × {a.width || "—"} × {a.height || "—"} cm
                  </div>
                  <div className="text-sm font-medium text-blue-600 mt-1">
                    Volume: {a.volume || "0.0000"} m³ × Qty: {a.quantity} = {((parseFloat(a.volume) || 0) * a.quantity).toFixed(4)} m³
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => decreaseQuantity(a.id)}
                    disabled={a.quantity <= 1}
                    className="w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  >
                    <FaMinus className="w-3 h-3" />
                  </button>
                  
                  <input
                    type="number"
                    value={a.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      updateArticle(a.id, "quantity", Math.max(1, val));
                    }}
                    className="w-16 text-center px-2 py-2 border-2 border-gray-300 rounded-lg font-bold text-lg"
                    min="1"
                  />
                  
                  <button
                    onClick={() => increaseQuantity(a.id)}
                    className="w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all flex items-center justify-center"
                  >
                    <FaPlus className="w-3 h-3" />
                  </button>
                </div>

                {/* Edit Dimensions */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="L"
                    value={a.length}
                    onChange={(e) => updateArticle(a.id, "length", e.target.value)}
                    className="w-16 px-2 py-1 border rounded text-sm"
                    step="0.01"
                  />
                  <input
                    type="number"
                    placeholder="W"
                    value={a.width}
                    onChange={(e) => updateArticle(a.id, "width", e.target.value)}
                    className="w-16 px-2 py-1 border rounded text-sm"
                    step="0.01"
                  />
                  <input
                    type="number"
                    placeholder="H"
                    value={a.height}
                    onChange={(e) => updateArticle(a.id, "height", e.target.value)}
                    className="w-16 px-2 py-1 border rounded text-sm"
                    step="0.01"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {articles.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-lg text-center">
          <div className="text-6xl mb-4">📦</div>
          <div className="text-xl font-semibold text-gray-600 mb-2">
            No items added yet
          </div>
          <div className="text-gray-500">
            Select a room above and start adding items to calculate volume
          </div>
        </div>
      )}
    </div>
  );
}