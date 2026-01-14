import React, { useState, useEffect, useRef, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaChevronDown, FaSearch, FaTimes, FaPlus, FaCheck } from "react-icons/fa";

import Input from "../../../components/Input";
import Modal from "../../../components/Modal";
import AddedArticlesSidebar from "./AddedArticlesSidebar";
import ItemRow from "./ItemRow";

const Article = ({ apiData, setMessage, setError }) => {
    const { watch, setValue } = useFormContext();
    const articles = watch("articles") || [];
    const selectedRoomFromForm = watch("selectedRoom");
    const [selectedRoom, setSelectedRoom] = useState(selectedRoomFromForm || null);
    const [showRoomDropdown, setShowRoomDropdown] = useState(false);
    const [showArticlesSidebar, setShowArticlesSidebar] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});
    const [itemQuantities, setItemQuantities] = useState({});
    const [itemSearchQuery, setItemSearchQuery] = useState("");
    const [selectedItems, setSelectedItems] = useState({});
    const dropdownRef = useRef(null);
    const [itemCratePreferences, setItemCratePreferences] = useState({});
    const [itemMoveStatuses, setItemMoveStatuses] = useState({});
    const [roomSearchQuery, setRoomSearchQuery] = useState("");
    const [showManualAddForm, setShowManualAddForm] = useState(false);
    const [manualFormData, setManualFormData] = useState({
        itemName: "",
        description: "",
        length: "",
        width: "",
        height: "",
    });
    const [manualVolume, setManualVolume] = useState(0);
    const [manualWeight, setManualWeight] = useState(0);
    const [itemCapturedImages, setItemCapturedImages] = useState({});

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowRoomDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (selectedRoom?.value && selectedRoom?.value !== selectedRoomFromForm?.value) {
            setValue("selectedRoom", selectedRoom);
        }
    }, [selectedRoom, selectedRoomFromForm, setValue]);

    const currentRoom = selectedRoom || selectedRoomFromForm;

    const prevRoomRef = useRef();
    const prevRoomArticlesRef = useRef([]);

    // Sync local state when selectedRoom or articles change
    useEffect(() => {
        const roomChanged = prevRoomRef.current?.value !== selectedRoom?.value;
        prevRoomRef.current = selectedRoom;

        const currentRoomArticles = selectedRoom ? articles.filter(a => a.room === selectedRoom.value) : [];

        if (roomChanged) {
            // Full reset on room change
            setExpandedItems({});
            setSelectedItems({});
            setItemQuantities({});
            setItemMoveStatuses({});
            setItemCratePreferences({});

            if (currentRoomArticles.length > 0) {
                const newQuantities = {};
                const newMoveStatuses = {};
                const newCratePreferences = {};
                const newSelectedItems = {};

                currentRoomArticles.forEach(article => {
                    newQuantities[article.itemName] = article.quantity;
                    newSelectedItems[article.itemName] = true;

                    const itemKey = `${selectedRoom.value}-${article.itemName}`;
                    newMoveStatuses[itemKey] = article.moveStatus;
                    newCratePreferences[itemKey] = article.crateRequired;
                });

                setItemQuantities(newQuantities);
                setSelectedItems(newSelectedItems);
                setItemMoveStatuses(newMoveStatuses);
                setItemCratePreferences(newCratePreferences);
            }
        } else {
            // Room hasn't changed, but articles might have (e.g., added/removed via sidebar or manual add)
            // We want to ensure saved articles are reflected in local state, 
            // but we MUST NOT wipe out provisional selections (items checked but not yet added/saved).

            // Find items that were REMOVED from the current room in the articles list
            const removedItems = prevRoomArticlesRef.current.filter(pa =>
                !currentRoomArticles.some(ca => ca.itemName === pa.itemName)
            );

            if (currentRoomArticles.length > 0 || removedItems.length > 0) {
                setSelectedItems(prev => {
                    const next = { ...prev };
                    currentRoomArticles.forEach(article => {
                        next[article.itemName] = true;
                    });
                    removedItems.forEach(article => {
                        next[article.itemName] = false;
                    });
                    return next;
                });

                setItemQuantities(prev => {
                    const next = { ...prev };
                    currentRoomArticles.forEach(article => {
                        next[article.itemName] = article.quantity;
                    });
                    return next;
                });

                setItemMoveStatuses(prev => {
                    const next = { ...prev };
                    currentRoomArticles.forEach(article => {
                        const itemKey = `${selectedRoom.value}-${article.itemName}`;
                        next[itemKey] = article.moveStatus;
                    });
                    return next;
                });

                setItemCratePreferences(prev => {
                    const next = { ...prev };
                    currentRoomArticles.forEach(article => {
                        const itemKey = `${selectedRoom.value}-${article.itemName}`;
                        next[itemKey] = article.crateRequired;
                    });
                    return next;
                });
            }
        }

        prevRoomArticlesRef.current = currentRoomArticles;
    }, [selectedRoom, articles]);


    const filteredRooms = useMemo(() => {
        if (!roomSearchQuery.trim()) {
            return apiData.rooms;
        }
        const query = roomSearchQuery.toLowerCase().trim();
        return apiData.rooms.filter(room => {
            const roomLabel = room.label?.toLowerCase() || '';
            const roomName = room.name?.toLowerCase() || '';
            return roomLabel.includes(query) || roomName.includes(query);
        });
    }, [roomSearchQuery, apiData.rooms]);

    const filteredItems = useMemo(() => {
        if (!selectedRoom) return [];
        let roomItems = apiData.items.filter(i => i.room === selectedRoom.id);

        if (!itemSearchQuery.trim()) {
            return roomItems;
        }

        const query = itemSearchQuery.toLowerCase().trim();
        return roomItems.filter(item => {
            const name = item.name?.toLowerCase() || '';
            const description = item.description?.toLowerCase() || '';
            return name.includes(query) || description.includes(query);
        });
    }, [selectedRoom, apiData.items, itemSearchQuery]);

    const toggleExpandedItem = (itemName) => {
        setExpandedItems(prev => ({ ...prev, [itemName]: !prev[itemName] }));
    };

    // Helper to generate a unique key for item state
    const getItemKey = (itemName) => `${selectedRoom?.value || 'general'}-${itemName}`;

    const updateQuantity = (itemName, qty) => {
        const newQty = Math.max(0, qty);

        setItemQuantities((prev) => ({ ...prev, [itemName]: newQty }));

        if (newQty > 0) {
            setSelectedItems((prev) => ({ ...prev, [itemName]: true }));
        }
        else {
            setSelectedItems((prev) => ({ ...prev, [itemName]: false }));
        }
    };
    const toggleItemSelection = (itemName) => {
        setSelectedItems(prev => ({ ...prev, [itemName]: !prev[itemName] }));
    };

    const toggleMoveStatus = (itemName) => {
        const key = getItemKey(itemName);
        setItemMoveStatuses(prev => ({
            ...prev,
            [key]: prev[key] === 'not_moving' ? 'moving' : 'not_moving'
        }));
    };

    const calculateVolume = (length, width, height) => {
        if (!length || !width || !height) return 0;
        return (parseFloat(length) * parseFloat(width) * parseFloat(height)) / 1000000;
    };

    const calculateWeight = (volume) => {
        return volume ? parseFloat(volume) * 110 : 0;
    };

    const addArticle = (itemName, formData = {}, isMoving = true) => {
        const length = formData[`length_${itemName}`] || "";
        const width = formData[`width_${itemName}`] || "";
        const height = formData[`height_${itemName}`] || "";

        const volume = calculateVolume(length, width, height);
        const weight = calculateWeight(volume);

        const crateRequired = formData.crateRequired || false;

        const existingIndex = articles.findIndex(
            a => a.itemName === itemName && a.room === (selectedRoom?.value || "")
        );

        const newArticleData = {
            itemName,
            quantity: itemQuantities[itemName] || 1,
            volume: volume.toFixed(4),
            volumeUnit: formData[`volumeUnit_${itemName}`] || apiData.volumeUnits[0]?.value || "",
            weight: weight.toFixed(2),
            weightUnit: formData[`weightUnit_${itemName}`] || apiData.weightUnits[0]?.value || "",
            handyman: formData[`handyman_${itemName}`] || "",
            packingOption: formData[`packingOption_${itemName}`] || "",
            moveStatus: isMoving ? "moving" : "not_moving",
            room: selectedRoom?.value || "",
            length,
            width,
            height,
            crateRequired,
            photo: formData.photo || null,
        };

        if (existingIndex !== -1) {
            // Update existing
            const updatedArticles = [...articles];
            updatedArticles[existingIndex] = {
                ...updatedArticles[existingIndex],
                ...newArticleData,
                id: updatedArticles[existingIndex].id // keep ID
            };
            setValue("articles", updatedArticles);
            setMessage("Article updated!");
        } else {
            // Add new
            const newArticle = {
                id: uuidv4(),
                ...newArticleData
            };
            setValue("articles", [...articles, newArticle]);
            setMessage("Article added!");
        }

        setTimeout(() => setMessage(null), 3000);
        toggleExpandedItem(itemName);

        // Clear captured image for this item
        const itemKey = getItemKey(itemName);
        setItemCapturedImages(prev => {
            const next = { ...prev };
            delete next[itemKey];
            return next;
        });
    };

    const addMultipleArticles = () => {
        const selectedItemNames = Object.keys(selectedItems).filter(name => selectedItems[name]);
        if (selectedItemNames.length === 0) return setError("Select at least one item");

        const itemsToAdd = [];
        const itemsToUpdate = [];

        selectedItemNames.forEach(itemName => {
            const existingIndex = articles.findIndex(
                a => a.itemName === itemName && a.room === (selectedRoom?.value || "")
            );

            const item = apiData.items.find(i => i.name === itemName && i.room === selectedRoom.id);
            // Default values if not in formData (for multiple add we use simplified defaults or existing logic)
            // For multiple add, we might not have specific form data, so we use ItemRow state or defaults.
            // But if the user opened the form and typed something, where is it?
            // It's in `ItemForm` local state. We don't have access to it here easily.
            // Assumption: Multiple add adds basic items with defaults or whatever state we have tracked.
            // We have tracked: Quantity, MoveStatus, CrateRequired.
            // We DO NOT track dimensions/etc in parent state.

            const length = item?.length || "";
            const width = item?.width || "";
            const height = item?.height || "";

            const volumeValue = calculateVolume(length, width, height);
            const volume = volumeValue > 0 ? volumeValue.toFixed(4) : "";
            const weight = volumeValue > 0 ? calculateWeight(volumeValue).toFixed(2) : "";

            const itemKey = getItemKey(itemName);
            const crateRequired = itemCratePreferences[itemKey] ?? false;
            const moveStatus = itemMoveStatuses[itemKey] === 'not_moving' ? 'not_moving' : 'moving';
            const quantity = itemQuantities[itemName] > 0 ? itemQuantities[itemName] : 1;

            const articleData = {
                itemName,
                quantity,
                volume,
                volumeUnit: apiData.volumeUnits[0]?.value || "",
                weight,
                weightUnit: apiData.weightUnits[0]?.value || "",
                handyman: "",
                packingOption: "",
                moveStatus,
                room: selectedRoom?.value || "",
                length,
                width,
                height,
                crateRequired,
                photo: itemCapturedImages[itemKey]?.file || null,
            };

            if (existingIndex !== -1) {
                // Prepare update
                const original = articles[existingIndex];
                itemsToUpdate.push({
                    index: existingIndex,
                    data: { ...original, ...articleData, id: original.id }
                });
            } else {
                itemsToAdd.push({
                    id: uuidv4(),
                    ...articleData
                });
            }
        });

        let newArticlesList = [...articles];
        // Apply updates
        itemsToUpdate.forEach(update => {
            newArticlesList[update.index] = update.data;
        });
        // Apply adds
        newArticlesList = [...newArticlesList, ...itemsToAdd];

        setValue("articles", newArticlesList);
        setMessage(`${itemsToAdd.length + itemsToUpdate.length} articles processed!`);
        setTimeout(() => setMessage(null), 3000);
        setSelectedItems({});

        // Clear captured images for the processed items
        setItemCapturedImages(prev => {
            const next = { ...prev };
            selectedItemNames.forEach(name => {
                const itemKey = getItemKey(name);
                delete next[itemKey];
            });
            return next;
        });
    };

    const removeArticle = (id) => {
        setValue("articles", articles.filter(a => a.id !== id));
        setMessage("Article removed!");
        setTimeout(() => setMessage(null), 3000);
    };

    const handleManualDimensionChange = (field, value) => {
        setManualFormData(prev => ({ ...prev, [field]: value }));

        const l = field === 'length' ? value : manualFormData.length;
        const w = field === 'width' ? value : manualFormData.width;
        const h = field === 'height' ? value : manualFormData.height;

        if (l && w && h && !isNaN(l) && !isNaN(w) && !isNaN(h)) {
            const vol = (parseFloat(l) * parseFloat(w) * parseFloat(h)) / 1000000;
            setManualVolume(vol);
            setManualWeight(vol * 110);
        } else {
            setManualVolume(0);
            setManualWeight(0);
        }
    };

    const addManualItem = () => {
        if (!manualFormData.itemName.trim()) {
            setError("Item name is required");
            return;
        }
        const newArticle = {
            id: uuidv4(),
            itemName: manualFormData.itemName.trim(),
            description: manualFormData.description || "",
            quantity: 1,
            length: manualFormData.length || "",
            width: manualFormData.width || "",
            height: manualFormData.height || "",
            volume: manualVolume > 0 ? manualVolume.toFixed(4) : "",
            volumeUnit: apiData.volumeUnits[0]?.value || "",
            weight: manualWeight > 0 ? manualWeight.toFixed(2) : "",
            weightUnit: apiData.weightUnits[0]?.value || "",
            handyman: "",
            packingOption: "",
            moveStatus: "moving",
            crateRequired: false,
            room: selectedRoom?.value || "",
        };

        setValue("articles", [...articles, newArticle]);
        setMessage("Custom item added successfully!");
        setTimeout(() => setMessage(null), 3000);

        setShowManualAddForm(false);
        setManualFormData({ itemName: "", description: "", length: "", width: "", height: "" });
        setManualVolume(0);
        setManualWeight(0);
    };


    return (
        <div className="relative">
            <AddedArticlesSidebar
                showArticlesSidebar={showArticlesSidebar}
                setShowArticlesSidebar={setShowArticlesSidebar}
                apiData={apiData}
            />
            {showArticlesSidebar && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setShowArticlesSidebar(false)}
                />
            )}
            <div className="space-y-8">
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg sm:text-xl font-medium text-black">Select Room</h3>
                        <button
                            type="button"
                            onClick={() => setShowArticlesSidebar(true)}
                            className="hidden sm:flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white font-medium rounded-lg text-sm shadow-md hover:shadow-xl transition transform "
                        >
                            <FaBars /> View Added ({articles.length})
                        </button>
                    </div>
                    {articles.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowArticlesSidebar(true)}
                            className="fixed bottom-24 right-4 z-40 flex items-center justify-center w-14 h-14 sm:hidden bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-full shadow-2xl hover:shadow-xl transform hover:scale-110 transition-all duration-300"
                            aria-label="View added articles"
                        >
                            <div className="relative">
                                <FaBars className="w-5 h-5" />
                                <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-4 h-4 bg-red-500 text-white text-xs font-light rounded-full px-2">
                                    {articles.length}
                                </span>
                            </div>
                        </button>
                    )}

                    <div ref={dropdownRef} className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setShowRoomDropdown(prev => !prev);
                                if (!showRoomDropdown) {
                                    setRoomSearchQuery("");
                                }
                            }}
                            className={`w-full px-6 py-2 text-left text-sm font-medium rounded-xl border-2 transition-all duration-300 flex justify-between items-center shadow-sm ${selectedRoom
                                ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:border-[#4c7085]"
                                }`}
                        >
                            <span>{selectedRoom ? selectedRoom.label : "Choose a room to add items"}</span>
                            <FaChevronDown className={`w-4 h-4 transition-transform ${showRoomDropdown ? "rotate-180" : ""}`} />
                        </button>

                        {showRoomDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-indigo-200 rounded-xl shadow-2xl z-20 max-h-96 overflow-hidden">
                                <div className="p-3 border-b border-gray-100 bg-gray-50">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={roomSearchQuery}
                                            onChange={(e) => setRoomSearchQuery(e.target.value)}
                                            placeholder="Search rooms..."
                                            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b8ca3] focus:border-transparent"
                                            autoFocus
                                        />
                                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        {roomSearchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setRoomSearchQuery("")}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <FaTimes className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {filteredRooms.length === 0 ? (
                                        <div className="px-6 py-8 text-center text-gray-500">
                                            {roomSearchQuery ? "No rooms found matching your search" : "No rooms available"}
                                        </div>
                                    ) : (
                                        filteredRooms.map(room => (
                                            <button
                                                key={room.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedRoom(room);
                                                    setValue("selectedRoom", room);
                                                    setShowRoomDropdown(false);
                                                    setRoomSearchQuery("");
                                                }}
                                                className={`w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all text-sm font-medium border-b border-gray-100 last:border-0 ${selectedRoom?.id === room.id ? 'bg-blue-50 text-[#4c7085]' : 'text-gray-800'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{room.label}</span>
                                                    {selectedRoom?.id === room.id && (
                                                        <FaCheck className="w-4 h-4 text-[#4c7085]" />
                                                    )}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {selectedRoom && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        {Object.values(selectedItems).some(v => v) && (
                            <div className="p-5 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white flex justify-between items-center">
                                <span className="font-medium">
                                    {Object.values(selectedItems).filter(Boolean).length} item(s) selected
                                </span>
                                <button
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={addMultipleArticles}
                                    className="px-6 py-2 bg-white text-[#4c7085] font-medium rounded-lg hover:bg-indigo-50 transition shadow-lg"
                                >
                                    Add and Update Selected
                                </button>
                            </div>
                        )}
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={itemSearchQuery}
                                    onChange={(e) => setItemSearchQuery(e.target.value)}
                                    placeholder="Search items in this room..."
                                    className="w-full px-4 py-3 pl-12 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                {itemSearchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setItemSearchQuery("")}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <FaTimes className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="p-6 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100">
                            <button
                                type="button"
                                onClick={() => setShowManualAddForm(true)}
                                className="mx-auto px-8 py-2 text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white font-medium rounded-xl shadow-xl hover:shadow-2xl transform transition-all duration-300 flex items-center gap-4"
                            >
                                <FaPlus className="w-6 h-6" />
                                Add Item Manually
                            </button>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {filteredItems.length === 0 ? (
                                <div className="text-center py-16 text-gray-500">
                                    <p className="text-lg">
                                        {itemSearchQuery
                                            ? `No items found matching "${itemSearchQuery}"`
                                            : "No items in this room"}
                                    </p>
                                    <p className="text-sm mt-2 text-gray-400">
                                        Use "Add Item Manually" to create custom items
                                    </p>
                                </div>
                            ) : (
                                filteredItems.map(item => {
                                    // Find existing article to pass down (not strictly needed since we hydrated state, but good for ItemForm)
                                    const existingArticle = articles.find(
                                        a => a.itemName === item.name && a.room === selectedRoom.value
                                    );

                                    return (
                                        <ItemRow
                                            key={item.id || item.name}
                                            item={item}
                                            apiData={apiData}
                                            existingArticle={existingArticle} // Pass existing article data
                                            itemQuantities={itemQuantities}
                                            setItemQuantities={setItemQuantities}
                                            selectedItems={selectedItems}
                                            setSelectedItems={setSelectedItems}
                                            itemMoveStatuses={itemMoveStatuses}
                                            toggleMoveStatus={toggleMoveStatus}
                                            itemCratePreferences={itemCratePreferences}
                                            setItemCratePreferences={setItemCratePreferences}
                                            expandedItems={expandedItems}
                                            toggleExpandedItem={toggleExpandedItem}
                                            addArticleCallback={addArticle}
                                            getItemKey={getItemKey}
                                            selectedRoomValue={selectedRoom?.value}
                                            itemCapturedImages={itemCapturedImages}
                                            setItemCapturedImages={setItemCapturedImages}
                                        />
                                    );
                                })
                            )}
                        </div>
                        {/* MANUAL ADD MODAL */}
                        {showManualAddForm && (
                            <Modal
                                isOpen={showManualAddForm}
                                onClose={() => {
                                    setShowManualAddForm(false);
                                    setManualFormData({ itemName: "", description: "", length: "", width: "", height: "" });
                                    setManualVolume(0);
                                    setManualWeight(0);
                                }}
                                title={`Add Custom Item — ${selectedRoom?.label || "General"}`}
                                footer={
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowManualAddForm(false);
                                                setManualFormData({ itemName: "", description: "", length: "", width: "", height: "" });
                                                setManualVolume(0);
                                                setManualWeight(0);
                                            }}
                                            className="w-full px-8 py-2 text-sm font-medium bg-gray-300 text-gray-700 rounded-sm hover:bg-gray-400 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={addManualItem}
                                            disabled={!manualFormData.itemName.trim()}
                                            className="whitespace-nowrap w-full px-8 py-2 text-sm font-medium bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-sm hover:shadow-2xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Add Item to Survey
                                        </button>
                                    </>
                                }
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                >
                                    <Input
                                        label="Item Name"
                                        name="itemName"
                                        type="text"
                                        value={manualFormData.itemName}
                                        onChange={(e) => setManualFormData(prev => ({ ...prev, itemName: e.target.value }))}
                                        rules={{ required: true }}
                                        placeholder="e.g., Antique Piano"
                                    />
                                    <Input
                                        label="Description (Optional)"
                                        name="description"
                                        type="textarea"
                                        value={manualFormData.description}
                                        onChange={(e) => setManualFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={4}
                                        placeholder="Any special notes..."
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Dimensions (cm)
                                        </label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <Input
                                                label="Length (cm)"
                                                name="length"
                                                type="number"
                                                step="0.01"
                                                value={manualFormData.length}
                                                onChange={(e) => handleManualDimensionChange('length', e.target.value)}
                                                placeholder="0.00"
                                            />
                                            <Input
                                                label="Width (cm)"
                                                name="width"
                                                type="number"
                                                step="0.01"
                                                value={manualFormData.width}
                                                onChange={(e) => handleManualDimensionChange('width', e.target.value)}
                                                placeholder="0.00"
                                            />
                                            <Input
                                                label="Height (cm)"
                                                name="height"
                                                type="number"
                                                step="0.01"
                                                value={manualFormData.height}
                                                onChange={(e) => handleManualDimensionChange('height', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Volume (m³)
                                            </label>
                                            <div className="w-full px-6 py-4 text-center text-sm font-semibold bg-gray-100 border border-gray-300 rounded-xl">
                                                {manualVolume.toFixed(4)}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Weight (kg) <span className="text-sm font-normal text-gray-500">(estimated)</span>
                                            </label>
                                            <div className="w-full px-6 py-4 text-center text-sm font-semibold bg-gray-100 border border-gray-300 rounded-xl">
                                                {manualWeight.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </Modal>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Article;
