import React, { useState, useEffect } from "react";
import { FaTimes, FaCheck, FaEdit, FaMinus, FaPlus, FaCamera, FaTrash } from "react-icons/fa";
import { useFormContext } from "react-hook-form";
import Modal from "../../../components/Modal";
import CameraCapture from "../../../components/CameraCapture";
import { usePermissions } from "../../../components/PermissionsContext/PermissionsContext";

const AddedArticlesSidebar = ({
    showArticlesSidebar,
    setShowArticlesSidebar,
    apiData
}) => {
    const { watch, setValue } = useFormContext();
    const { hasPermission } = usePermissions();
    const articles = watch("articles") || [];
    const [editingArticle, setEditingArticle] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [retakeFile, setRetakeFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    const getImageUrl = (photo) => {
        if (!photo) return null;
        if (photo instanceof File) return URL.createObjectURL(photo);
        if (typeof photo === 'string') {
            if (photo.startsWith("http") || photo.startsWith("data:")) return photo;
            return `http://127.0.0.1:8000${photo}`;
        }
        return null;
    };

    useEffect(() => {
        if (editingArticle) {
            const article = articles.find(a => a.id === editingArticle);
            if (article) {
                setEditFormData({
                    quantity: article.quantity || 1,
                    length: article.length || "",
                    width: article.width || "",
                    height: article.height || "",
                    volume: article.volume || "",
                    volumeUnit: article.volumeUnit || apiData.volumeUnits[0]?.value || "",
                    weight: article.weight || "",
                    weightUnit: article.weightUnit || apiData.weightUnits[0]?.value || "",
                    handyman: article.handyman || "",
                    packingOption: article.packingOption || "",
                    moveStatus: article.moveStatus || "moving",
                    crateRequired: article.crateRequired || false,
                });
                setRetakeFile(null);
            }
        }
    }, [editingArticle, articles, apiData]);

    const calculateVolume = (length, width, height) => {
        if (!length || !width || !height) return 0;
        return (parseFloat(length) * parseFloat(width) * parseFloat(height)) / 1000000;
    };

    const calculateWeight = (volume) => {
        return volume ? parseFloat(volume) * 110 : 0;
    };

    const handleEditInputChange = (field, value) => {
        setEditFormData(prev => {
            const newData = { ...prev, [field]: value };
            if (field === 'length' || field === 'width' || field === 'height') {
                const l = field === 'length' ? value : prev.length;
                const w = field === 'width' ? value : prev.width;
                const h = field === 'height' ? value : prev.height;
                if (l && w && h) {
                    const vol = calculateVolume(l, w, h);
                    const wt = calculateWeight(vol);
                    newData.volume = vol.toFixed(2);
                    newData.weight = wt.toFixed(2);
                }
            }
            return newData;
        });
    };

    const updateArticle = (articleId) => {
        if (!hasPermission("surveys", "edit")) return;
        const updatedArticles = articles.map(article => {
            if (article.id === articleId) {
                return {
                    ...article,
                    quantity: editFormData.quantity || 1,
                    length: editFormData.length || "",
                    width: editFormData.width || "",
                    height: editFormData.height || "",
                    volume: editFormData.volume || "",
                    volumeUnit: editFormData.volumeUnit || "",
                    weight: editFormData.weight || "",
                    weightUnit: editFormData.weightUnit || "",
                    handyman: editFormData.handyman || "",
                    packingOption: editFormData.packingOption || "",
                    moveStatus: editFormData.moveStatus || article.moveStatus || "moving",
                    crateRequired: editFormData.crateRequired ?? article.crateRequired,
                    photo: retakeFile || article.photo,
                };
            }
            return article;
        });
        setValue("articles", updatedArticles);
        setEditingArticle(null);
        setRetakeFile(null);
    };

    const cancelEdit = () => {
        setEditingArticle(null);
        setEditFormData({});
        setRetakeFile(null);
    };

    const handleCapture = (file) => {
        if (file) {
            setRetakeFile(file);
            setIsCameraOpen(false);
        }
    };

    const removeArticleFromSidebar = (id) => {
        if (!hasPermission("surveys", "edit")) return;
        setValue("articles", articles.filter(a => a.id !== id));
    };

    return (
        <>
            <div className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${showArticlesSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white">
                    <div>
                        <h3 className="text-lg font-medium text-gray-800">Added Articles</h3>
                        <p className="text-xs text-gray-600 mt-0.5">{articles.length} items in survey</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowArticlesSidebar(false)}
                        className="p-2 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 p-4 space-y-4 bg-gray-50">
                    {articles.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                                <FaEdit className="w-6 h-6 text-gray-300" />
                            </div>
                            <h4 className="text-gray-900 font-medium mb-1">No articles added yet</h4>
                            <p className="text-gray-600 text-sm">Items you select will appear here.</p>
                        </div>
                    ) : (
                        articles.map(article => (
                            <div key={article.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm transition-all hover:shadow-md">
                                {editingArticle === article.id ? (
                                    <div className="space-y-4 animate-in fade-in duration-200">

                                        {/* Edit Header */}
                                        <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                                            <h4 className="font-medium text-sm text-gray-900">{article.itemName}</h4>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => updateArticle(article.id)}
                                                    disabled={!hasPermission("surveys", "edit")}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-colors disabled:opacity-50"
                                                    title="Save"
                                                >
                                                    <FaCheck className="w-3 h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={cancelEdit}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                                                    title="Cancel"
                                                >
                                                    <FaTimes className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Edit Form */}
                                        <div className="space-y-4">

                                            {/* Photo & Qty Row */}
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    {(retakeFile || article.photo) ? (
                                                        <div className="relative group">
                                                            <img
                                                                src={retakeFile ? URL.createObjectURL(retakeFile) : getImageUrl(article.photo)}
                                                                alt="Item"
                                                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                            />
                                                            <button
                                                                onClick={() => setIsCameraOpen(true)}
                                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white"
                                                            >
                                                                <FaCamera className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsCameraOpen(true)}
                                                            className="w-16 h-16 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 border border-gray-200 border-dashed transition-colors"
                                                        >
                                                            <FaCamera className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5">Quantity</label>
                                                    <div className="flex items-center border border-gray-200 rounded-lg h-9 bg-white shadow-sm overflow-hidden w-fit">
                                                        <button
                                                            type="button"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => handleEditInputChange('quantity', Math.max(1, (editFormData.quantity || 1) - 1))}
                                                            className="w-9 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-700 border-r border-gray-100"
                                                        >
                                                            <FaMinus className="w-2.5 h-2.5" />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={editFormData.quantity || 1}
                                                            onChange={(e) => handleEditInputChange('quantity', parseInt(e.target.value) || 1)}
                                                            className="w-12 text-center text-sm font-medium text-gray-900 focus:outline-none p-0 border-none h-full"
                                                            min="1"
                                                        />
                                                        <button
                                                            type="button"
                                                            onMouseDown={(e) => e.preventDefault()}
                                                            onClick={() => handleEditInputChange('quantity', (editFormData.quantity || 1) + 1)}
                                                            className="w-9 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#4c7085] border-l border-gray-100"
                                                        >
                                                            <FaPlus className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Toggles */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditFormData(prev => ({ ...prev, moveStatus: prev.moveStatus === 'moving' ? 'not_moving' : 'moving' }))}
                                                    className={`h-9 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-all ${(editFormData.moveStatus || article.moveStatus) === 'moving'
                                                        ? "bg-green-50 border-green-200 text-green-700"
                                                        : "bg-red-50 border-red-200 text-red-700"
                                                        }`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${(editFormData.moveStatus || article.moveStatus) === 'moving' ? "bg-green-500" : "bg-red-500"}`} />
                                                    {(editFormData.moveStatus || article.moveStatus) === 'moving' ? "Moving" : "Not Moving"}
                                                </button>

                                                <div className="flex items-center justify-center h-9 px-3 bg-white border border-gray-200 rounded-lg">
                                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={editFormData.crateRequired === true}
                                                            onChange={(e) => handleEditInputChange('crateRequired', e.target.checked)}
                                                            className="w-4 h-4 text-[#4c7085] rounded focus:ring-0 cursor-pointer"
                                                        />
                                                        Crate Required?
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Dimensions */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Dimensions (cm)</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-600">L</span>
                                                        <input type="number" step="0.01" value={editFormData.length || ""} onChange={(e) => handleEditInputChange('length', e.target.value)}
                                                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-[#4c7085] outline-none" placeholder="0" />
                                                    </div>
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-600">W</span>
                                                        <input type="number" step="0.01" value={editFormData.width || ""} onChange={(e) => handleEditInputChange('width', e.target.value)}
                                                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-[#4c7085] outline-none" placeholder="0" />
                                                    </div>
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-600">H</span>
                                                        <input type="number" step="0.01" value={editFormData.height || ""} onChange={(e) => handleEditInputChange('height', e.target.value)}
                                                            className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-[#4c7085] outline-none" placeholder="0" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Auto-calculated Volume & Weight */}
                                            <div className="grid grid-cols-2 gap-4 bg-[#4c7085]/5 p-3 rounded-lg border border-[#4c7085]/10 mt-2">
                                                <div>
                                                    <span className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Vol (m³)</span>
                                                    <div className="text-sm font-medium text-[#4c7085]">{parseFloat(editFormData.volume || 0).toFixed(2)}</div>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Weight (kg)</span>
                                                    <div className="text-sm font-medium text-[#4c7085]">{parseFloat(editFormData.weight || 0).toFixed(2)}</div>
                                                </div>
                                            </div>

                                            {/* Advanced Selects */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Handyman</label>
                                                    <select
                                                        value={editFormData.handyman || ""}
                                                        onChange={(e) => handleEditInputChange('handyman', e.target.value)}
                                                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-[#4c7085]"
                                                    >
                                                        <option value="">None</option>
                                                        {apiData.handymanTypes.map(type => (
                                                            <option key={type.value} value={type.value}>{type.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Packing</label>
                                                    <select
                                                        value={editFormData.packingOption || ""}
                                                        onChange={(e) => handleEditInputChange('packingOption', e.target.value)}
                                                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-[#4c7085]"
                                                    >
                                                        <option value="">None</option>
                                                        {apiData.packingTypes.map(type => (
                                                            <option key={type.value} value={type.value}>{type.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-gray-800 text-sm truncate">{article.itemName}</h4>
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">x{article.quantity}</span>
                                            </div>

                                            <div className="text-xs text-gray-600 space-y-0.5">
                                                <p className="flex items-center gap-2">
                                                    <span>Room: <span className="text-gray-700 font-medium">{apiData.rooms.find(r => r.value === article.room)?.label || article.room || "General"}</span></span>
                                                    {(parseFloat(article.volume) > 0) && (
                                                        <span>• {parseFloat(article.volume).toFixed(2)} m³</span>
                                                    )}
                                                </p>
                                                {article.addedAt && (
                                                    <p className="text-xs text-gray-600">
                                                        Added: {new Date(article.addedAt).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                )}

                                                {article.description && (
                                                    <p className="text-xs text-gray-600 italic mt-0.5">
                                                        "{article.description}"
                                                    </p>
                                                )}

                                                {(article.length || article.width || article.height) && (
                                                    <div className="mt-2 flex flex-col gap-1.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                                        <p className="text-[11px] text-gray-600 uppercase tracking-wider font-medium">Dimensions & Load</p>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <div className="text-xs text-gray-700">
                                                                <span className="text-gray-500 mr-1">Vol:</span>
                                                                <span className="text-[#4c7085] font-medium">{parseFloat(article.volume || 0).toFixed(2)} m³</span>
                                                            </div>
                                                            <div className="text-xs text-gray-700">
                                                                <span className="text-gray-500 mr-1">Weight:</span>
                                                                <span className="text-[#4c7085] font-medium">{parseFloat(article.weight || 0).toFixed(2)} kg</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {(article.moveStatus === 'not_moving') ? (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 uppercase tracking-tighter font-medium">Not Moving</span>
                                                    ) : (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded border border-green-100 uppercase tracking-tighter font-medium">Moving</span>
                                                    )}
                                                    {article.crateRequired ? (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 uppercase tracking-tighter font-medium">Crate Required</span>
                                                    ) : (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200 uppercase tracking-tighter font-medium">No Crate Needed</span>
                                                    )}
                                                    {article.handyman && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded border border-orange-100 uppercase tracking-tighter font-medium">Handyman</span>
                                                    )}
                                                </div>
                                            </div>

                                            {(article.photo) && (
                                                <div className="mt-2 group relative w-fit">
                                                    <img
                                                        src={getImageUrl(article.photo)}
                                                        alt="Item"
                                                        className="w-12 h-12 object-cover rounded border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                                                        onClick={() => setPreviewImage(getImageUrl(article.photo))}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <button
                                                type="button"
                                                onClick={() => hasPermission("surveys", "edit") && setEditingArticle(article.id)}
                                                disabled={!hasPermission("surveys", "edit")}
                                                className="p-1.5 bg-white border border-gray-200 rounded-md text-gray-600 hover:text-[#4c7085] hover:border-[#4c7085] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Edit"
                                            >
                                                <FaEdit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeArticleFromSidebar(article.id)}
                                                disabled={!hasPermission("surveys", "edit")}
                                                className="p-1.5 bg-white border border-gray-200 rounded-md text-gray-600 hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Remove"
                                            >
                                                <FaTrash className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {/* Summary Footer */}
                    {articles.length > 0 && (
                        <div className="mt-auto pt-6 border-t border-gray-200 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Total Volume:</span>
                                <span className="font-medium text-gray-900">
                                    {articles.reduce((sum, a) => sum + (parseFloat(a.volume) || 0) * (a.quantity || 1), 0).toFixed(2)} m³
                                </span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Total Items:</span>
                                <span className="font-medium text-gray-900">
                                    {articles.reduce((sum, a) => sum + (a.quantity || 1), 0)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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

            {/* Image Preview Modal */}
            <Modal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                title="Image Preview"
                className="z-[80]"
            >
                <div className="flex justify-center p-4">
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
                    />
                </div>
                <div className="flex justify-end p-4 pt-0">
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transaction-colors text-sm font-medium"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default AddedArticlesSidebar;

