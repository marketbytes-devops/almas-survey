import React from "react";
import { FaMinus, FaPlus, FaChevronUp, FaChevronDown, FaCamera, FaBox } from "react-icons/fa";
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
    const itemKey = getItemKey(item.name);
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
        setItemCratePreferences(prev => ({ ...prev, [rowItemKey]: val === 'yes' }));
    };

    const isCrateRequired = itemCratePreferences[itemKey] === true;
    const currentCapturedImage = itemCapturedImages[itemKey];
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
        <div className="group transition-colors bg-white hover:bg-gray-50/80">
            <div className={`flex flex-col md:flex-row items-center gap-4 p-4 ${isSelected ? 'bg-[#4c7085]/5' : ''}`}>

                {/* Selection & Info */}
                <div className="flex-1 flex items-start gap-4 w-full md:w-auto">
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => toggleItemSelection(item.name)}
                        className="focus:outline-none mt-1"
                    >
                        <div
                            className={`w-5 h-5 rounded border transition-all duration-200 flex items-center justify-center ${isSelected
                                ? "bg-[#4c7085] border-[#4c7085]"
                                : "bg-white border-gray-300 group-hover:border-[#4c7085]"
                                }`}
                        >
                            {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                        </div>
                    </button>
                    <div>
                        <div className={`text-sm font-medium ${isSelected ? 'text-[#4c7085]' : 'text-gray-900'}`}>
                            {item.name}
                        </div>
                        {item.description && (
                            <div className="text-xs text-gray-500 mt-0.5 max-w-md">
                                {item.description}
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">

                    {/* Quantity Selector */}
                    <div className="flex items-center border border-gray-200 rounded-lg h-9 bg-white shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => updateQuantity(item.name, qty - 1)}
                            disabled={qty <= 0}
                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors border-r border-gray-100"
                        >
                            <FaMinus className="w-2.5 h-2.5" />
                        </button>
                        <input
                            type="text"
                            value={qty}
                            readOnly
                            className="w-10 text-center text-sm font-medium text-gray-900 border-none focus:ring-0 p-0"
                        />
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => updateQuantity(item.name, qty + 1)}
                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#4c7085] transition-colors border-l border-gray-100"
                        >
                            <FaPlus className="w-2.5 h-2.5" />
                        </button>
                    </div>

                    {/* Move Status Toggle */}
                    <button
                        type="button"
                        onClick={() => toggleMoveStatus(item.name)}
                        className={`h-9 px-3 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${isMoving
                            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${isMoving ? "bg-green-500" : "bg-red-500"}`} />
                        {isMoving ? "Moving" : "Not Moving"}
                    </button>

                    {/* Crate Required Toggle */}
                    <button
                        type="button"
                        onClick={() => handleCrateChange(isCrateRequired ? 'no' : 'yes')}
                        className={`h-9 px-3 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${isCrateRequired
                            ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                            : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                            }`}
                        title="Toggle Crate Requirement"
                    >
                        <FaBox className={`w-3 h-3 ${isCrateRequired ? "text-amber-600" : "text-gray-400"}`} />
                        {isCrateRequired ? "Crate" : "No Crate"}
                    </button>

                    {/* Photo Button */}
                    <button
                        type="button"
                        onClick={handleCameraClick}
                        className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-all ${hasPhoto
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-inner"
                            : "bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300"
                            }`}
                        title={hasPhoto ? "Photo Added" : "Add Photo"}
                    >
                        <FaCamera className="w-4 h-4" />
                    </button>

                    {/* Expand Options */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandedItem(item.name);
                        }}
                        className={`h-9 px-3 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${expandedItems[item.name]
                            ? "bg-gray-100 text-gray-900 border-gray-300"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                    >
                        More
                        {expandedItems[item.name] ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                    </button>

                </div>
            </div>

            {/* Expanded Details Form */}
            {expandedItems[item.name] && (
                <div className="bg-gray-50/50 border-t border-gray-100 p-4 animate-in slide-in-from-top-2 duration-200">
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
                </div>
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
