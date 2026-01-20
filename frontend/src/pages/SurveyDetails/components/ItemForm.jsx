import React, { useState } from "react";
import { FaBox } from "react-icons/fa";
import Input from "../../../components/Input"; // Assuming generic Input component is available or stick to raw inputs for dense form
// Actually, standard inputs in SurveyDetails usually use the raw styled inputs for density.

const ItemForm = ({ item, onAdd, onCancel, apiData, existingArticle, capturedImage }) => {
    const [formData, setFormData] = useState({
        [`length_${item.name}`]: existingArticle?.length || item.length || "",
        [`width_${item.name}`]: existingArticle?.width || item.width || "",
        [`height_${item.name}`]: existingArticle?.height || item.height || "",
        [`volume_${item.name}`]: existingArticle?.volume || item.volume || "",
        [`weight_${item.name}`]: existingArticle?.weight || item.weight || "",
        [`volumeUnit_${item.name}`]: existingArticle?.volumeUnit || apiData.volumeUnits[0]?.value || "",
        [`weightUnit_${item.name}`]: existingArticle?.weightUnit || apiData.weightUnits[0]?.value || "",
        [`handyman_${item.name}`]: existingArticle?.handyman || "",
        [`packingOption_${item.name}`]: existingArticle?.packingOption || "",
        crateRequired: existingArticle?.crateRequired || false,
    });

    // If existing article, use its status, else default to true
    const [isMoving, setIsMoving] = useState(
        existingArticle ? existingArticle.moveStatus === 'moving' : true
    );

    const calculateVolume = (length, width, height) => {
        if (!length || !width || !height) return 0;
        return (parseFloat(length) * parseFloat(width) * parseFloat(height)) / 1000000;
    };

    const calculateWeight = (volume) => {
        return volume ? parseFloat(volume) * 110 : 0;
    };

    const currentLength = formData[`length_${item.name}`];
    const currentWidth = formData[`width_${item.name}`];
    const currentHeight = formData[`height_${item.name}`];

    const volume = currentLength && currentWidth && currentHeight
        ? calculateVolume(currentLength, currentWidth, currentHeight).toFixed(4)
        : (formData[`volume_${item.name}`] || "0.0000");

    const weight = volume
        ? calculateWeight(parseFloat(volume)).toFixed(2)
        : (formData[`weight_${item.name}`] || "0.00");

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        const l = field === `length_${item.name}` ? value : formData[`length_${item.name}`];
        const w = field === `width_${item.name}` ? value : formData[`width_${item.name}`];
        const h = field === `height_${item.name}` ? value : formData[`height_${item.name}`];
        if (l && w && h) {
            const vol = calculateVolume(l, w, h);
            const wt = calculateWeight(vol);
            setFormData(prev => ({
                ...prev,
                [`volume_${item.name}`]: vol.toFixed(4),
                [`weight_${item.name}`]: wt.toFixed(2),
            }));
        }
    };

    return (
        <div className="px-4 pb-4 pt-4 bg-gray-50/50 rounded-b-lg">

            {/* Options Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setIsMoving(!isMoving)}
                        className={`h-9 px-3 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${isMoving
                            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${isMoving ? "bg-green-500" : "bg-red-500"}`} />
                        {isMoving ? "Moving" : "Not Moving"}
                    </button>

                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, crateRequired: !prev.crateRequired }))}
                        className={`h-9 px-3 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${formData.crateRequired
                            ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                    >
                        <FaBox className={`w-3 h-3 ${formData.crateRequired ? "text-amber-600" : "text-gray-400"}`} />
                        {formData.crateRequired ? "Crate Required" : "No Crate"}
                    </button>
                </div>

                {capturedImage && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-indigo-600 font-medium px-2 py-1 bg-indigo-50 rounded-md">
                            Image Captured
                        </span>
                        <img
                            src={capturedImage.preview}
                            alt="Captured item"
                            className="w-10 h-10 object-cover rounded border border-indigo-100"
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                {/* Dimensions Section */}
                <div className="space-y-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions</h4>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">L (cm)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData[`length_${item.name}`]}
                                onChange={(e) => handleInputChange(`length_${item.name}`, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-[#4c7085] focus:ring-0 outline-none transition-colors"
                                placeholder={item.length || "0"}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">W (cm)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData[`width_${item.name}`]}
                                onChange={(e) => handleInputChange(`width_${item.name}`, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-[#4c7085] focus:ring-0 outline-none transition-colors"
                                placeholder={item.width || "0"}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">H (cm)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData[`height_${item.name}`]}
                                onChange={(e) => handleInputChange(`height_${item.name}`, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-[#4c7085] focus:ring-0 outline-none transition-colors"
                                placeholder={item.height || "0"}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Volume <span className="text-[10px]">(m³)</span>
                            </label>
                            <div className="flex">
                                <input
                                    type="text"
                                    readOnly
                                    value={volume}
                                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-l-lg text-sm font-medium text-gray-600"
                                />
                                <select
                                    value={formData[`volumeUnit_${item.name}`]}
                                    onChange={(e) => setFormData(prev => ({ ...prev, [`volumeUnit_${item.name}`]: e.target.value }))}
                                    className="px-2 py-2 bg-gray-50 border-y border-r border-gray-200 rounded-r-lg text-xs text-gray-500 outline-none hover:bg-gray-100"
                                >
                                    {apiData.volumeUnits.map(unit => (
                                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Weight <span className="text-[10px]">(kg)</span>
                            </label>
                            <div className="flex">
                                <input
                                    type="text"
                                    readOnly
                                    value={weight}
                                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-l-lg text-sm font-medium text-gray-600"
                                />
                                <select
                                    value={formData[`weightUnit_${item.name}`]}
                                    onChange={(e) => setFormData(prev => ({ ...prev, [`weightUnit_${item.name}`]: e.target.value }))}
                                    className="px-2 py-2 bg-gray-50 border-y border-r border-gray-200 rounded-r-lg text-xs text-gray-500 outline-none hover:bg-gray-100"
                                >
                                    {apiData.weightUnits.map(unit => (
                                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Services Section */}
                <div className="space-y-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Services</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Handyman Services</label>
                            <select
                                value={formData[`handyman_${item.name}`]}
                                onChange={(e) => setFormData(prev => ({ ...prev, [`handyman_${item.name}`]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-[#4c7085] focus:ring-0 outline-none transition-colors"
                            >
                                <option value="">None Required</option>
                                {apiData.handymanTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Packing Options</label>
                            <select
                                value={formData[`packingOption_${item.name}`]}
                                onChange={(e) => setFormData(prev => ({ ...prev, [`packingOption_${item.name}`]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-[#4c7085] focus:ring-0 outline-none transition-colors"
                            >
                                <option value="">Standard Packing</option>
                                {apiData.packingTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => onAdd(item.name, formData, isMoving)}
                    className="px-5 py-2.5 bg-[#4c7085] text-white text-sm font-medium rounded-lg shadow-sm hover:bg-[#3e5c6e] active:scale-95 transition-all"
                >
                    {existingArticle ? "Update Item" : "Save Changes"}
                </button>
            </div>
        </div>
    );
};

export default ItemForm;
