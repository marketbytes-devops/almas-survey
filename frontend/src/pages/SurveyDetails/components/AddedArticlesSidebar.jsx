import React, { useState, useEffect } from "react";
import { FaTimes, FaCheck, FaEdit, FaMinus, FaPlus, FaCamera } from "react-icons/fa";
import { useFormContext } from "react-hook-form";
import Modal from "../../../components/Modal";
import CameraCapture from "../../../components/CameraCapture";

const AddedArticlesSidebar = ({
    showArticlesSidebar,
    setShowArticlesSidebar,
    apiData
}) => {
    const { watch, setValue } = useFormContext();
    const articles = watch("articles") || [];
    const [editingArticle, setEditingArticle] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [retakeFile, setRetakeFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

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
                    newData.volume = vol.toFixed(4);
                    newData.weight = wt.toFixed(2);
                }
            }
            return newData;
        });
    };

    const updateArticle = (articleId) => {
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
        setValue("articles", articles.filter(a => a.id !== id));
    };

    return (
        <>
            <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform z-50 ${showArticlesSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white">
                    <h3 className="font-medium">Added Articles ({articles.length})</h3>
                    <button
                        type="button"
                        onClick={() => setShowArticlesSidebar(false)}
                        className="p-1 hover:bg-white/20 rounded"
                    >
                        <FaTimes />
                    </button>
                </div>
                <div className="overflow-y-auto p-4 space-y-3 h-[calc(100%-64px)]">
                    {articles.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No articles added</p>
                    ) : (
                        articles.map(article => (
                            <div key={article.id} className="p-3 border border-gray-300 rounded-lg bg-white shadow-sm">
                                {editingArticle === article.id ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-medium text-sm text-gray-800">{article.itemName}</h4>
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => updateArticle(article.id)}
                                                    className="text-green-600 hover:text-green-800 p-1"
                                                    title="Save"
                                                >
                                                    <FaCheck className="w-3 h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={cancelEdit}
                                                    className="text-gray-600 hover:text-gray-800 p-1"
                                                    title="Cancel"
                                                >
                                                    <FaTimes className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Photo</label>
                                            <div className="flex items-center gap-2">
                                                {(retakeFile || article.photo) && (
                                                    <img
                                                        src={retakeFile ? URL.createObjectURL(retakeFile) : getImageUrl(article.photo)}
                                                        alt="Item"
                                                        className="w-12 h-12 object-cover rounded border"
                                                    />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCameraOpen(true)}
                                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-medium text-gray-700 flex items-center gap-1 transition-all border border-gray-300"
                                                >
                                                    <FaCamera className="w-3 h-3" />
                                                    <span>{(article.photo || retakeFile) ? "Retake Photo" : "Add Photo"}</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => handleEditInputChange('quantity', Math.max(1, (editFormData.quantity || 1) - 1))}
                                                    className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                                >
                                                    <FaMinus className="w-2 h-2" />
                                                </button>
                                                <input
                                                    type="number"
                                                    value={editFormData.quantity || 1}
                                                    onChange={(e) => handleEditInputChange('quantity', parseInt(e.target.value) || 1)}
                                                    className="w-12 text-center px-1 py-1 border rounded text-sm"
                                                    min="1"
                                                />
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => handleEditInputChange('quantity', (editFormData.quantity || 1) + 1)}
                                                    className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                                                >
                                                    <FaPlus className="w-2 h-2" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Moving Status</label>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditFormData(prev => ({ ...prev, moveStatus: 'moving' }))}
                                                    className={`px-3 py-1 text-xs rounded ${(editFormData.moveStatus || article.moveStatus) === 'moving' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                                                >
                                                    Moving
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditFormData(prev => ({ ...prev, moveStatus: 'not_moving' }))}
                                                    className={`px-3 py-1 text-xs rounded ${(editFormData.moveStatus || article.moveStatus) === 'not_moving' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                                                >
                                                    Not Moving
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Crate Required?</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`sidebar-crate-${article.id}`}
                                                        checked={editFormData.crateRequired === true}
                                                        onChange={() => handleEditInputChange('crateRequired', true)}
                                                        className="w-4 h-4 text-[#4c7085]"
                                                    />
                                                    <span className="text-sm">Yes</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`sidebar-crate-${article.id}`}
                                                        checked={editFormData.crateRequired === false}
                                                        onChange={() => handleEditInputChange('crateRequired', false)}
                                                        className="w-4 h-4 text-[#4c7085]"
                                                    />
                                                    <span className="text-sm">No</span>
                                                </label>
                                            </div>
                                        </div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Dimensions (cm)</label>
                                        <div className="grid grid-cols-3 gap-1">
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="L"
                                                value={editFormData.length || ""}
                                                onChange={(e) => handleEditInputChange('length', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="W"
                                                value={editFormData.width || ""}
                                                onChange={(e) => handleEditInputChange('width', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="H"
                                                value={editFormData.height || ""}
                                                onChange={(e) => handleEditInputChange('height', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Volume (m³)</label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={editFormData.volume || "0.0000"}
                                                    className="w-full px-2 py-1 bg-gray-50 border border-gray-300 rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Volume Unit</label>
                                                <select
                                                    value={editFormData.volumeUnit || ""}
                                                    onChange={(e) => handleEditInputChange('volumeUnit', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                >
                                                    {apiData.volumeUnits.map(unit => (
                                                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={editFormData.weight || "0.00"}
                                                    className="w-full px-2 py-1 bg-gray-50 border border-gray-300 rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Weight Unit</label>
                                                <select
                                                    value={editFormData.weightUnit || ""}
                                                    onChange={(e) => handleEditInputChange('weightUnit', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                >
                                                    {apiData.weightUnits.map(unit => (
                                                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Handyman</label>
                                                <select
                                                    value={editFormData.handyman || ""}
                                                    onChange={(e) => handleEditInputChange('handyman', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                >
                                                    <option value="">Select</option>
                                                    {apiData.handymanTypes.map(type => (
                                                        <option key={type.value} value={type.value}>{type.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Packing Option</label>
                                                <select
                                                    value={editFormData.packingOption || ""}
                                                    onChange={(e) => handleEditInputChange('packingOption', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                >
                                                    <option value="">Select</option>
                                                    {apiData.packingTypes.map(type => (
                                                        <option key={type.value} value={type.value}>{type.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm text-gray-800">{article.itemName}</div>
                                            <div className="text-xs text-gray-600 mt-1">Qty: {article.quantity}</div>
                                            {article.volume && (
                                                <div className="text-xs text-gray-600">
                                                    Vol: {article.volume} {apiData.volumeUnits.find(u => u.value === article.volumeUnit)?.label || 'm³'}
                                                </div>
                                            )}
                                            {article.photo && (
                                                <div className="mt-2">
                                                    <img
                                                        src={getImageUrl(article.photo)}
                                                        alt="Item"
                                                        className="w-16 h-16 object-cover rounded border border-gray-200"
                                                    />
                                                </div>
                                            )}
                                            {article.weight && (
                                                <div className="text-xs text-gray-600">
                                                    Wt: {article.weight} {apiData.weightUnits.find(u => u.value === article.weightUnit)?.label || 'kg'}
                                                </div>
                                            )}
                                            {(article.length || article.width || article.height) && (
                                                <div className="text-xs text-gray-600">
                                                    Dim: {article.length && `L:${article.length}cm`}
                                                    {article.width && ` × W:${article.width}cm`}
                                                    {article.height && ` × H:${article.height}cm`}
                                                </div>
                                            )}
                                            {article.handyman && (
                                                <div className="text-xs text-gray-600">
                                                    Handyman: {apiData.handymanTypes.find(h => h.value === article.handyman)?.label}
                                                </div>
                                            )}
                                            {article.packingOption && (
                                                <div className="text-xs text-gray-600">
                                                    Packing: {apiData.packingTypes.find(p => p.value === article.packingOption)?.label}
                                                </div>
                                            )}
                                            {article.room && (
                                                <div className="text-xs text-gray-600">
                                                    Room: {apiData.rooms.find(r => r.value === article.room)?.label || article.room}
                                                </div>
                                            )}
                                            <div className="text-xs mt-1">
                                                <span className="font-medium">Crate Required:</span>{" "}
                                                <span className={article.crateRequired ? "text-green-600" : "text-gray-600"}>
                                                    {article.crateRequired ? "Yes" : "No"}
                                                </span>
                                            </div>
                                            <div className="mt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingArticle(article.id);
                                                        setIsCameraOpen(true);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all border ${article.photo
                                                        ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
                                                        : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                                                        }`}
                                                >
                                                    <FaCamera className="w-3 h-3" />
                                                    <span>{article.photo ? "Retake Photo" : "Add Photo"}</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 ml-2">
                                            <button
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => setEditingArticle(article.id)}
                                                className="text-[#4c7085] hover:text-blue-800 p-1"
                                                title="Edit"
                                            >
                                                <FaEdit className="w-3 h-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => removeArticleFromSidebar(article.id)}
                                                className="text-red-600 hover:text-red-800 p-1"
                                                title="Remove"
                                            >
                                                <FaTimes className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
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
        </>
    );
};

export default AddedArticlesSidebar;
