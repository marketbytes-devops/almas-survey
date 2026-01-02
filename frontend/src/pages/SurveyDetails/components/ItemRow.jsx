import React from "react";
import { FaMinus, FaPlus, FaChevronUp, FaChevronDown } from "react-icons/fa";
import { useFormContext } from "react-hook-form";
import ItemForm from "./ItemForm";

const ItemRow = ({
    item,
    apiData,
    existingArticle,
    itemQuantities,
    setItemQuantities,
    selectedItems,
    setSelectedItems,
    itemMoveStatuses,
    toggleMoveStatus,
    itemCratePreferences,
    setItemCratePreferences,
    expandedItems,
    toggleExpandedItem,
    addArticleCallback,
    getItemKey,
    selectedRoomValue
}) => {
    const { watch, setValue } = useFormContext();
    const qty = itemQuantities[item.name] || 0;
    const isSelected = selectedItems[item.name] || false;

    // Stable keys are crucial here
    const itemKey = getItemKey(item.name);
    // Determine if moving. Default is true (moving) unless explicitly set to 'not_moving'
    const isMoving = itemMoveStatuses[itemKey] !== 'not_moving';

    const toggleItemSelection = (itemName) => {
        setSelectedItems(prev => ({ ...prev, [itemName]: !prev[itemName] }));
    };

    const updateQuantity = (itemName, q) => {
        const newQty = Math.max(0, q);
        setItemQuantities((prev) => ({ ...prev, [itemName]: newQty }));

        if (newQty > 0) {
            setSelectedItems((prev) => ({ ...prev, [itemName]: true }));
        }
        else {
            setSelectedItems((prev) => ({ ...prev, [itemName]: false }));
        }
    };

    const handleCrateChange = (val) => {
        const rowItemKey = getItemKey(item.name);
        // Directly update local state first
        setItemCratePreferences(prev => ({ ...prev, [rowItemKey]: val === 'yes' }));

        // Also update existing article if present (optional here, but better done on "Add/Update")
        // Or we could trigger an update immediately?
        // The requirement says "once selected I want auto active". 
        // If we update here, we might want to call `addArticleCallback` implicitly?
        // For now, let's keep it in local state until "Update" or "Add" is clicked.
    };

    // Check crate status - prioritize local state which was hydrated from existing article
    const isCrateRequired = itemCratePreferences[itemKey] === true;

    return (
        <div className="border-b border-gray-200 last:border-0">
            <div
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4
      hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50
      transition-all rounded-lg"
            >
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggleItemSelection(item.name)}
                    className="focus:outline-none"
                >
                    <div
                        className={`w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all duration-200 ${isSelected
                            ? "bg-[#4c7085] border-[#4c7085]"
                            : "bg-white border-gray-400"
                            }`}
                    >
                        {isSelected && (
                            <div className="w-4 h-4 bg-white rounded-full" />
                        )}
                    </div>
                </button>
                <div className="flex-1">
                    <div className="font-semibold text-gray-800 text-sm sm:text-base">
                        {item.name}
                    </div>
                    {item.description && (
                        <div className="text-xs text-gray-500 mt-1">
                            {item.description}
                        </div>
                    )}
                    {(item.length || item.width || item.height) && (
                        <div className="text-xs text-gray-500 mt-1">
                            {item.length && `L:${item.length}cm`}
                            {item.width && ` × W:${item.width}cm`}
                            {item.height && ` × H:${item.height}cm`}
                        </div>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">

                    <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => updateQuantity(item.name, qty - 1)}
                            disabled={qty <= 0}
                            className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaMinus className="w-4 h-4" />
                        </button>
                        <input
                            type="text"
                            value={qty}
                            readOnly
                            className="w-16 text-center font-medium text-gray-800 bg-transparent outline-none py-3 border-x border-gray-300"
                        />
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => updateQuantity(item.name, qty + 1)}
                            className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition"
                        >
                            <FaPlus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => toggleMoveStatus(item.name)}
                            className="flex items-center p-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none gap-2"
                            title={isMoving ? "Mark as Not Moving" : "Mark as Moving"}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isMoving ? "bg-green-500 border-green-500" : "bg-red-500 border-red-500"}`}>
                                {isMoving ? (
                                    <span className="text-white text-xs">M</span>
                                ) : (
                                    <span className="text-white text-xs">N</span>
                                )}
                            </div>
                            <span className="text-xs text-gray-600 hidden sm:inline">
                                {isMoving ? "Moving" : "Not Moving"}
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center p-3.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none gap-2">
                            <label className="font-medium text-gray-700 whitespace-nowrap">Crate Required?</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`crate-row-${item.name.replace(/\s+/g, '-')}-${selectedRoomValue || 'general'}`}
                                        value="yes"
                                        checked={isCrateRequired}
                                        onChange={() => handleCrateChange('yes')}
                                        className="w-4 h-4 text-[#4c7085]"
                                    />
                                    <span>Yes</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`crate-row-${item.name.replace(/\s+/g, '-')}-${selectedRoomValue || 'general'}`}
                                        value="no"
                                        checked={!isCrateRequired}
                                        onChange={() => handleCrateChange('no')}
                                        className="w-4 h-4 text-[#4c7085]"
                                    />
                                    <span>No</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandedItem(item.name);
                        }}
                        className="text-sm flex gap-2 items-center justify-center p-3 text-[#4c7085] hover:bg-indigo-100 rounded-full transition"
                    >
                        Item Options{" "}
                        {expandedItems[item.name] ? (
                            <FaChevronUp className="w-4 h-4" />
                        ) : (
                            <FaChevronDown className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {expandedItems[item.name] && (
                <ItemForm
                    item={item}
                    apiData={apiData}
                    existingArticle={existingArticle}
                    onAdd={(itemName, formData, isM) => {
                        addArticleCallback(itemName, formData, isM);
                    }}
                    onCancel={() => toggleExpandedItem(item.name)}
                />
            )}
        </div>
    );
};

export default ItemRow;
