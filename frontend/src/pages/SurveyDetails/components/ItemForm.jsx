import React, { useState } from "react";

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
        <div className="px-4 pb-4 pt-4 bg-gradient-to-b from-indigo-50 to-white border-t border-indigo-200">
            <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isMoving ? 'bg-green-500 border-green-500' : 'bg-red-500 border-red-500'}`}
                        onClick={() => setIsMoving(!isMoving)}
                    >
                        {isMoving ? (
                            <span className="text-white text-xs">M</span>
                        ) : (
                            <span className="text-white text-xs">N</span>
                        )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                        {isMoving ? "Moving" : "Not Moving"}
                    </span>
                </label>

                {capturedImage && (
                    <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                        <img
                            src={capturedImage.preview}
                            alt="Captured item"
                            className="w-10 h-10 object-cover rounded-md border border-gray-200"
                        />
                        <span className="text-xs text-indigo-700 font-medium">Image Captured</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="col-span-full">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Dimensions</h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Length (cm)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData[`length_${item.name}`]}
                                onChange={(e) => handleInputChange(`length_${item.name}`, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                                placeholder={item.length ? `${item.length} (default)` : "0.00"}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Width (cm)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData[`width_${item.name}`]}
                                onChange={(e) => handleInputChange(`width_${item.name}`, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                                placeholder={item.width ? `${item.width} (default)` : "0.00"}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData[`height_${item.name}`]}
                                onChange={(e) => handleInputChange(`height_${item.name}`, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                                placeholder={item.height ? `${item.height} (default)` : "0.00"}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Volume (m³) <span className="text-green-600 text-xs">(auto)</span>
                            </label>
                            <input
                                type="text"
                                readOnly
                                value={volume}
                                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Volume Unit</label>
                            <select
                                value={formData[`volumeUnit_${item.name}`]}
                                onChange={(e) => setFormData(prev => ({ ...prev, [`volumeUnit_${item.name}`]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                            >
                                {apiData.volumeUnits.map(unit => (
                                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="col-span-full">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Weight</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Weight (kg) <span className="text-green-600 text-xs">(est.)</span>
                            </label>
                            <input
                                type="text"
                                readOnly
                                value={weight}
                                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Weight Unit</label>
                            <select
                                value={formData[`weightUnit_${item.name}`]}
                                onChange={(e) => setFormData(prev => ({ ...prev, [`weightUnit_${item.name}`]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                            >
                                {apiData.weightUnits.map(unit => (
                                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Handyman</label>
                    <select
                        value={formData[`handyman_${item.name}`]}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`handyman_${item.name}`]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
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
                        value={formData[`packingOption_${item.name}`]}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`packingOption_${item.name}`]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                    >
                        <option value="">Select</option>
                        {apiData.packingTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-4">
                <button
                    type="button"
                    onClick={() => onAdd(item.name, formData, isMoving)}
                    className="w-full sm:w-auto py-2 px-4 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-sm font-medium rounded-lg shadow hover:shadow-lg transition"
                >
                    {existingArticle ? "Update Article" : "Add to Survey"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full sm:w-auto py-2 px-4 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default ItemForm;
