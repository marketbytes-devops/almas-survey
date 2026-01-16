import React from "react";
import { FaMinus, FaPlus, FaChevronUp, FaChevronDown, FaCamera, FaTrash } from "react-icons/fa";
import { useFormContext } from "react-hook-form";
import ItemForm from "./ItemForm";
import Modal from "../../../components/Modal";
import CameraCapture from "../../../components/CameraCapture";

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
    selectedRoomValue,
    itemCapturedImages,
    setItemCapturedImages
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

    // Check for captured image in parent state
    const currentCapturedImage = itemCapturedImages[itemKey];
    // Check for existing photo in article
    const hasExistingPhoto = !!existingArticle?.photo;
    const hasPhoto = hasExistingPhoto || !!currentCapturedImage;

    const [isCameraOpen, setIsCameraOpen] = React.useState(false);

    const handleCameraClick = () => {
        setIsCameraOpen(true);
    };

    const handleCapture = (file) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setItemCapturedImages(prev => ({
                    ...prev,
                    [itemKey]: {
                        file: file,
                        preview: reader.result
                    }
                }));
            };
            reader.readAsDataURL(file);
            setIsCameraOpen(false);
        }
    };


    return (
        <div className="border-b border-gray-200 last:border-0">
            <div
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-2 sm:p-4
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

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={handleCameraClick}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm font-medium ${hasPhoto
                                ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            <FaCamera className="w-4 h-4" />
                            <span>{hasPhoto ? "Retake Photo" : "Add Photo"}</span>
                        </button>
                    </div>

                    <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden w-full sm:w-auto">
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => updateQuantity(item.name, qty - 1)}
                            disabled={qty <= 0}
                            className="flex-1 sm:flex-none px-4 py-2 text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed border-r border-gray-300 sm:border-r-0"
                        >
                            <FaMinus className="w-4 h-4 mx-auto" />
                        </button>
                        <input
                            type="text"
                            value={qty}
                            readOnly
                            className="flex-1 sm:w-16 text-center font-medium text-gray-800 bg-transparent outline-none py-2 border-r border-gray-300 sm:border-x sm:border-gray-300"
                        />
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => updateQuantity(item.name, qty + 1)}
                            className="flex-1 sm:flex-none px-4 py-2 text-gray-600 hover:bg-gray-100 transition"
                        >
                            <FaPlus className="w-4 h-4 mx-auto" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => toggleMoveStatus(item.name)}
                            className="flex-1 sm:flex-none flex items-center justify-center p-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none gap-2"
                            title={isMoving ? "Mark as Not Moving" : "Mark as Moving"}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isMoving ? "bg-green-500 border-green-500" : "bg-red-500 border-red-500"}`}>
                                {isMoving ? (
                                    <span className="text-white text-[10px]">M</span>
                                ) : (
                                    <span className="text-white text-[10px]">N</span>
                                )}
                            </div>
                            <span className="text-sm text-gray-600">
                                {isMoving ? "Moving" : "Not Moving"}
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 text-sm w-full sm:w-auto">
                        <div className="flex-1 sm:flex-none flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-3.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none gap-2">
                            <label className="font-medium text-gray-700 whitespace-nowrap text-xs">Crate Required?</label>
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
                                    <span className="text-xs">Yes</span>
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
                                    <span className="text-xs">No</span>
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
                        className="w-full sm:w-auto text-sm font-medium flex gap-2 items-center justify-center py-2 px-4 text-[#4c7085] hover:bg-indigo-100 rounded-lg sm:rounded-full transition border border-[#4c7085]/20 sm:border-0"
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
                        addArticleCallback(itemName, { ...formData, photo: currentCapturedImage?.file }, isM);
                    }}
                    onCancel={() => toggleExpandedItem(item.name)}
                    capturedImage={currentCapturedImage}
                />
            )}

            <Modal
                isOpen={isCameraOpen}
                title="Take Photo"
                className="z-[70]"
            >
                <CameraCapture
                    onCapture={handleCapture}
                    onCancel={() => setIsCameraOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default ItemRow;
