import React from "react";
import { useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { FaPlus, FaTimes, FaCar } from "react-icons/fa";
import Input from "../../../components/Input"; // Use standard Input

const CARD_CLASS = "bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6";
const BUTTON_PRIMARY = "flex items-center justify-center gap-2 px-6 py-2.5 bg-[#4c7085] text-white text-sm font-medium rounded-lg shadow-sm hover:bg-[#3e5c6e] active:scale-95 transition-all w-full sm:w-auto ml-auto";
const BUTTON_SECONDARY = "flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm";

const VehicleDetails = () => {
    const { watch, setValue, register } = useFormContext();
    const vehicles = watch("vehicles") || [];

    const addVehicle = () => {
        setValue("vehicles", [
            ...vehicles,
            {
                id: uuidv4(),
                vehicleType: "",
                make: "",
                model: "",
                insurance: false,
                remark: ""
            }
        ]);
    };

    const removeVehicle = (id) => {
        setValue("vehicles", vehicles.filter(v => v.id !== id));
    };

    return (
        <div className={CARD_CLASS}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-[#4c7085]">
                        <FaCar className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">Vehicle Details</h2>
                        <p className="text-xs text-gray-600">Add any vehicles involved in the move</p>
                    </div>
                </div>
            </div>

            {vehicles.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <FaCar className="text-gray-600 w-5 h-5" />
                    </div>
                    <p className="text-gray-900 font-medium mb-1">No vehicles added</p>
                    <p className="text-gray-600 text-sm">Click the button below to add vehicle details.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 mb-6">
                    {vehicles.map((vehicle, index) => (
                        <div
                            key={vehicle.id}
                            className="group relative bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#4c7085]/30"
                        >
                            <button
                                type="button"
                                onClick={() => removeVehicle(vehicle.id)}
                                className="absolute top-4 right-4 p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Remove Vehicle"
                            >
                                <FaTimes />
                            </button>

                            <div className="flex items-center gap-3 mb-6 pr-10">
                                <div className="w-6 h-6 rounded-full bg-[#4c7085] text-white flex items-center justify-center text-xs font-medium">
                                    {index + 1}
                                </div>
                                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Vehicle Specification</h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Vehicle Type"
                                        name={`vehicles[${index}].vehicleType`}
                                        placeholder="e.g. SUV, Sedan, Motorcycle"
                                    />
                                </div>
                                <Input
                                    label="Make"
                                    name={`vehicles[${index}].make`}
                                    placeholder="e.g. Toyota"
                                />
                                <Input
                                    label="Model"
                                    name={`vehicles[${index}].model`}
                                    placeholder="e.g. Camry"
                                />

                                <label className="sm:col-span-2 flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer transition hover:bg-gray-100 border border-gray-200">
                                    <input
                                        type="checkbox"
                                        {...register(`vehicles[${index}].insurance`)}
                                        className="w-4 h-4 text-[#4c7085] rounded border-gray-300 focus:ring-[#4c7085]"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Comprehensive Insurance Required</span>
                                </label>

                                <div className="sm:col-span-2">
                                    <Input
                                        label="Additional Notes"
                                        name={`vehicles[${index}].remark`}
                                        type="textarea"
                                        rows={2}
                                        placeholder="Any specific handling requirements..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={addVehicle}
                    className={BUTTON_PRIMARY}
                >
                    <FaPlus className="w-3 h-3" /> Add Vehicle Details
                </button>
            </div>
        </div>
    );
};

export default VehicleDetails;
