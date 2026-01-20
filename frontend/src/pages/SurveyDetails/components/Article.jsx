import React, { useState, useEffect, useRef, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaChevronDown, FaSearch, FaTimes, FaPlus, FaCheck, FaBoxOpen, FaMinus, FaCamera, FaBox } from "react-icons/fa";

import Input from "../../../components/Input";
import Modal from "../../../components/Modal";
import AddedArticlesSidebar from "./AddedArticlesSidebar";
import ItemRow from "./ItemRow";
import CameraCapture from "../../../components/CameraCapture";

const CARD_CLASS = "bg-white rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md";
const BUTTON_PRIMARY = "bg-[#4c7085] text-white hover:shadow-lg active:scale-95 transition-all rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2";
const BUTTON_SECONDARY = "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2";
const INPUT_SEARCH = "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4c7085] focus:ring-0 transition-all outline-none text-sm text-gray-900 placeholder-gray-500";

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
        quantity: 1,
        moveStatus: "moving",
        crateRequired: false,
    });
    const [manualVolume, setManualVolume] = useState(0);
    const [manualWeight, setManualWeight] = useState(0);
    const [itemCapturedImages, setItemCapturedImages] = useState({});
    const [manualItemPhoto, setManualItemPhoto] = useState(null);
    const [isManualCameraOpen, setIsManualCameraOpen] = useState(false);

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
            const removedItems = prevRoomArticlesRef.current.filter(pa =>
                !currentRoomArticles.some(ca => ca.itemName === pa.itemName)
            );

            if (currentRoomArticles.length > 0 || removedItems.length > 0) {
                setSelectedItems(prev => {
                    const next = { ...prev };
                    currentRoomArticles.forEach(article => { next[article.itemName] = true; });
                    removedItems.forEach(article => { next[article.itemName] = false; });
                    return next;
                });
                setItemQuantities(prev => {
                    const next = { ...prev };
                    currentRoomArticles.forEach(article => { next[article.itemName] = article.quantity; });
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
        if (!roomSearchQuery.trim()) return apiData.rooms;
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

        if (!itemSearchQuery.trim()) return roomItems;

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

    const getItemKey = (itemName) => `${selectedRoom?.value || 'general'}-${itemName}`;

    const updateQuantity = (itemName, qty) => {
        const newQty = Math.max(0, qty);
        setItemQuantities((prev) => ({ ...prev, [itemName]: newQty }));
        setSelectedItems((prev) => ({ ...prev, [itemName]: newQty > 0 }));
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
            const updatedArticles = [...articles];
            updatedArticles[existingIndex] = { ...updatedArticles[existingIndex], ...newArticleData, id: updatedArticles[existingIndex].id };
            setValue("articles", updatedArticles);
            setMessage("Article updated!");
        } else {
            const newArticle = { id: uuidv4(), ...newArticleData, addedAt: new Date().toISOString() };
            setValue("articles", [...articles, newArticle]);
            setMessage("Article added!");
        }

        setTimeout(() => setMessage(null), 3000);
        toggleExpandedItem(itemName);
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
        const timestamp = new Date().toISOString();

        selectedItemNames.forEach(itemName => {
            const existingIndex = articles.findIndex(a => a.itemName === itemName && a.room === (selectedRoom?.value || ""));
            const item = apiData.items.find(i => i.name === itemName && i.room === selectedRoom.id);
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
                const original = articles[existingIndex];

                const mergedData = {
                    ...original,
                    ...articleData,
                    id: original.id,
                    length: (length && length !== "") ? length : original.length,
                    width: (width && width !== "") ? width : original.width,
                    height: (height && height !== "") ? height : original.height,
                    volume: (volume && parseFloat(volume) > 0) ? volume : original.volume,
                    weight: (weight && parseFloat(weight) > 0) ? weight : original.weight,
                    volumeUnit: (articleData.volumeUnit) ? articleData.volumeUnit : original.volumeUnit,
                    weightUnit: (articleData.weightUnit) ? articleData.weightUnit : original.weightUnit,
                    photo: itemCapturedImages[itemKey]?.file || original.photo,
                    description: original.description, // Bulk add doesn't support description, keep original
                    handyman: original.handyman, // Bulk add doesn't support handyman, keep original
                    packingOption: original.packingOption, // Bulk add doesn't support packing, keep original
                    // Always update status fields from bulk controls
                    quantity,
                    moveStatus,
                    crateRequired
                };

                itemsToUpdate.push({ index: existingIndex, data: mergedData });
            } else {
                itemsToAdd.push({ id: uuidv4(), ...articleData, addedAt: timestamp });
            }
        });

        let newArticlesList = [...articles];
        itemsToUpdate.forEach(update => { newArticlesList[update.index] = update.data; });
        newArticlesList = [...newArticlesList, ...itemsToAdd];

        setValue("articles", newArticlesList);
        setMessage(`${itemsToAdd.length + itemsToUpdate.length} articles added/updated!`);
        setTimeout(() => setMessage(null), 3000);
        setSelectedItems({});
        setItemCapturedImages(prev => {
            const next = { ...prev };
            selectedItemNames.forEach(name => { delete next[getItemKey(name)]; });
            return next;
        });
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

        console.log("=== Adding Manual Item ===");
        console.log("manualFormData:", manualFormData);
        console.log("manualVolume:", manualVolume);
        console.log("manualWeight:", manualWeight);

        const newArticle = {
            id: uuidv4(),
            itemName: manualFormData.itemName.trim(),
            description: manualFormData.description || "",
            quantity: manualFormData.quantity || 1,
            length: manualFormData.length || "",
            width: manualFormData.width || "",
            height: manualFormData.height || "",
            volume: manualVolume > 0 ? manualVolume.toFixed(4) : "",
            volumeUnit: apiData.volumeUnits[0]?.value || "",
            weight: manualWeight > 0 ? manualWeight.toFixed(2) : "",
            weightUnit: apiData.weightUnits[0]?.value || "",
            handyman: "",
            packingOption: "",
            moveStatus: manualFormData.moveStatus || "moving",
            crateRequired: manualFormData.crateRequired || false,
            room: selectedRoom?.value || "",
            photo: manualItemPhoto || null,
            addedAt: new Date().toISOString(),
        };

        console.log("newArticle:", newArticle);

        setValue("articles", [...articles, newArticle]);
        setMessage("Custom item added!");
        setTimeout(() => setMessage(null), 3000);
        setShowManualAddForm(false);
        setManualFormData({ itemName: "", description: "", length: "", width: "", height: "", quantity: 1, moveStatus: "moving", crateRequired: false });
        setManualVolume(0);
        setManualWeight(0);
        setManualItemPhoto(null);
    };

    return (
        <div className="relative animate-in fade-in duration-500">
            <AddedArticlesSidebar showArticlesSidebar={showArticlesSidebar} setShowArticlesSidebar={setShowArticlesSidebar} apiData={apiData} />
            {showArticlesSidebar && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setShowArticlesSidebar(false)} />}

            <div className={`space-y-6 ${CARD_CLASS} p-6 border-gray-200`}>

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                    <div>
                        <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <FaBoxOpen className="w-4 h-4" />
                            </div>
                            Room
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 ml-10">Select a room to begin adding items</p>
                    </div>

                    <button type="button" onClick={() => setShowArticlesSidebar(true)} className={`${BUTTON_SECONDARY} ml-auto`}>
                        <FaBars /> View List ({articles.length})
                    </button>
                </div>

                {/* Room Selector */}
                <div ref={dropdownRef} className="relative z-20">
                    <button
                        type="button"
                        onClick={() => {
                            setShowRoomDropdown(prev => !prev);
                            if (!showRoomDropdown) setRoomSearchQuery("");
                        }}
                        className={`w-full py-3 px-4 text-left text-sm font-medium rounded-xl border transition-all flex justify-between items-center ${selectedRoom ? "bg-white border-[#4c7085] ring-1 ring-[#4c7085]" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}
                    >
                        <span className={selectedRoom ? "text-gray-900" : "text-gray-400"}>
                            {selectedRoom ? selectedRoom.label : "Select a room..."}
                        </span>
                        <FaChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showRoomDropdown ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                        {showRoomDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-80 flex flex-col"
                            >
                                <div className="p-3 border-b border-gray-100 bg-gray-50/50 sticky top-0">
                                    <div className="relative">
                                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                        <input
                                            type="text"
                                            value={roomSearchQuery}
                                            onChange={(e) => setRoomSearchQuery(e.target.value)}
                                            placeholder="Search rooms..."
                                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#4c7085] bg-white transition-colors"
                                            autoFocus
                                        />
                                        {roomSearchQuery && (
                                            <button onClick={() => setRoomSearchQuery("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                <FaTimes className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="overflow-y-auto flex-1">
                                    {filteredRooms.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 text-sm">No rooms found</div>
                                    ) : (
                                        filteredRooms.map(room => (
                                            <button
                                                key={room.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedRoom(room);
                                                    setValue("selectedRoom", room);
                                                    setShowRoomDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 last:border-0 flex justify-between items-center ${selectedRoom?.id === room.id ? 'bg-[#4c7085]/5 text-[#4c7085] font-medium' : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {room.label}
                                                {selectedRoom?.id === room.id && <FaCheck className="w-3.5 h-3.5" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Items Section */}
                {selectedRoom && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">

                        {/* Search & Actions Bar */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={itemSearchQuery}
                                    onChange={(e) => setItemSearchQuery(e.target.value)}
                                    placeholder={`Search items in ${selectedRoom.label}...`}
                                    className={INPUT_SEARCH}
                                />
                                {itemSearchQuery && (
                                    <button onClick={() => setItemSearchQuery("")} className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <FaTimes className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <button type="button" onClick={() => setShowManualAddForm(true)} className={`${BUTTON_SECONDARY} whitespace-nowrap`}>
                                <FaPlus /> Custom Item
                            </button>
                        </div>

                        {/* Bulk Add Action Bar */}
                        <AnimatePresence>
                            {Object.values(selectedItems).some(v => v) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-[#4c7085]/10 border border-[#4c7085]/20 rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 gap-3 items-center justify-between text-center md:text-left">
                                        <span className="text-sm font-medium text-[#4c7085]">
                                            {Object.values(selectedItems).filter(Boolean).length} items selected
                                        </span>
                                        <button type="button" onClick={addMultipleArticles} className={BUTTON_PRIMARY}>
                                            Save Selected Items
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Items List */}
                        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 bg-gray-50/30 max-h-[600px] overflow-y-auto">
                            {filteredItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                        <FaSearch className="w-6 h-6" />
                                    </div>
                                    <p className="text-gray-900 font-medium">No items found</p>
                                    <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                                        We couldn't find matches for "{itemSearchQuery || 'this room'}". Try a different search or add a custom item.
                                    </p>
                                    <button onClick={() => setShowManualAddForm(true)} className="mt-4 text-[#4c7085] text-sm font-medium hover:underline">
                                        Add Custom Item
                                    </button>
                                </div>
                            ) : (
                                filteredItems.map(item => (
                                    <ItemRow
                                        key={item.id || item.name}
                                        item={item}
                                        apiData={apiData}
                                        existingArticle={articles.find(a => a.itemName === item.name && a.room === selectedRoom.value)}
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
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Manual Add Modal */}
            <Modal
                isOpen={showManualAddForm}
                onClose={() => setShowManualAddForm(false)}
                title={`Add Custom Item — ${selectedRoom?.label || "General"}`}
            >
                <div className="space-y-4">
                    <Input label="Item Name" name="itemName" value={manualFormData.itemName} onChange={(e) => setManualFormData(prev => ({ ...prev, itemName: e.target.value }))} rules={{ required: true }} placeholder="e.g., Antique Piano" />
                    <Input label="Description (Optional)" name="description" type="textarea" value={manualFormData.description} onChange={(e) => setManualFormData(prev => ({ ...prev, description: e.target.value }))} rows={3} />

                    {/* Quantity, Status, Photo Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Quantity</label>
                            <div className="flex items-center border border-gray-200 rounded-lg h-10 bg-white shadow-sm overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setManualFormData(prev => ({ ...prev, quantity: Math.max(1, (prev.quantity || 1) - 1) }))}
                                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 border-r border-gray-100"
                                >
                                    <FaMinus className="w-2.5 h-2.5" />
                                </button>
                                <input
                                    type="number"
                                    value={manualFormData.quantity || 1}
                                    onChange={(e) => setManualFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                    className="flex-1 text-center text-sm font-medium text-gray-900 border-none focus:ring-0 p-0"
                                    min="1"
                                />
                                <button
                                    type="button"
                                    onClick={() => setManualFormData(prev => ({ ...prev, quantity: (prev.quantity || 1) + 1 }))}
                                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#4c7085] border-l border-gray-100"
                                >
                                    <FaPlus className="w-2.5 h-2.5" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Photo</label>
                            <button
                                type="button"
                                onClick={() => setIsManualCameraOpen(true)}
                                className={`w-full h-10 flex items-center justify-center rounded-lg border transition-all ${manualItemPhoto
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                    : "bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300"
                                    }`}
                            >
                                <FaCamera className="w-4 h-4 mr-2" />
                                {manualItemPhoto ? "Photo Added" : "Add Photo"}
                            </button>
                        </div>
                    </div>

                    {/* Status Toggles */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setManualFormData(prev => ({ ...prev, moveStatus: prev.moveStatus === 'moving' ? 'not_moving' : 'moving' }))}
                            className={`h-10 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-all ${manualFormData.moveStatus === 'moving'
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-red-50 border-red-200 text-red-700"
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${manualFormData.moveStatus === 'moving' ? "bg-green-500" : "bg-red-500"}`} />
                            {manualFormData.moveStatus === 'moving' ? "Moving" : "Not Moving"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setManualFormData(prev => ({ ...prev, crateRequired: !prev.crateRequired }))}
                            className={`h-10 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-all ${manualFormData.crateRequired
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : "bg-white border-gray-200 text-gray-500"
                                }`}
                        >
                            <FaBox className={`w-3 h-3 ${manualFormData.crateRequired ? "text-amber-600" : "text-gray-400"}`} />
                            {manualFormData.crateRequired ? "Crate Required" : "No Crate"}
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">Dimensions (cm)</label>
                        <div className="grid grid-cols-3 gap-3">
                            <Input label="" name="length" type="number" placeholder="L" value={manualFormData.length} onChange={(e) => handleManualDimensionChange('length', e.target.value)} />
                            <Input label="" name="width" type="number" placeholder="W" value={manualFormData.width} onChange={(e) => handleManualDimensionChange('width', e.target.value)} />
                            <Input label="" name="height" type="number" placeholder="H" value={manualFormData.height} onChange={(e) => handleManualDimensionChange('height', e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <span className="block text-xs text-gray-500 mb-1">Volume</span>
                            <div className="font-mono text-lg text-gray-800">{manualVolume.toFixed(4)} <span className="text-xs text-gray-400">m³</span></div>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-500 mb-1">Est. Weight</span>
                            <div className="font-mono text-lg text-gray-800">{manualWeight.toFixed(2)} <span className="text-xs text-gray-400">kg</span></div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowManualAddForm(false)} className={`${BUTTON_SECONDARY} flex-1`}>Cancel</button>
                        <button type="button" onClick={addManualItem} disabled={!manualFormData.itemName.trim()} className={`${BUTTON_PRIMARY} flex-1 disabled:opacity-50`}>Add Item</button>
                    </div>
                </div>
            </Modal>

            {/* Manual Item Camera Modal */}
            <Modal
                isOpen={isManualCameraOpen}
                title="Take Photo"
                className="z-[70]"
            >
                <CameraCapture
                    onCapture={(file) => {
                        if (file) {
                            setManualItemPhoto(file);
                            setIsManualCameraOpen(false);
                        }
                    }}
                    onCancel={() => setIsManualCameraOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default Article;
