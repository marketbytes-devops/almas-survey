import React from "react";
import { useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { FaPlus, FaTimes } from "react-icons/fa";
import Input from "../../../components/Input";

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
        <div className="mt-4 sm:mt-10 bg-white rounded-lg shadow p-2 sm:p-6">
            <div className="flex justify-between items-center mb-2 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-medium">Vehicle Details</h2>
            </div>

            {vehicles.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    <p className="text-gray-500 mb-4 font-medium italic">No vehicles added yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {vehicles.map((vehicle, index) => (
                        <div
                            key={vehicle.id}
                            className="group relative bg-white border border-gray-200 rounded-xl p-2 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#4c7085]/30"
                        >
                            <button
                                type="button"
                                onClick={() => removeVehicle(vehicle.id)}
                                className="absolute -top-3 -right-3 w-8 h-8 bg-white text-red-500 border border-red-100 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 hover:bg-red-50"
                            >
                                <FaTimes size={12} />
                            </button>

                            <div className="flex items-center gap-3 mb-3 sm:mb-6">
                                <div className="w-8 h-8 rounded-lg bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-bold">
                                    {index + 1}
                                </div>
                                <h4 className="text-lg font-semibold text-gray-800">Vehicle Specification</h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-5">
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

                                <label className="sm:col-span-2 flex items-center gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg cursor-pointer transition hover:bg-gray-100/80 border border-gray-100">
                                    <input
                                        type="checkbox"
                                        {...register(`vehicles[${index}].insurance`)}
                                        className="w-5 h-5 text-[#4c7085] rounded border-gray-300 focus:ring-[#4c7085]"
                                    />
                                    <span className="font-medium text-gray-700">Comprehensive Insurance Required</span>
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
            <div className="flex justify-center items-center text-center pt-2 sm:pt-6">
                <button
                    type="button"
                    onClick={addVehicle}
                    className="w-full hidden sm:flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-sm font-medium text-white rounded shadow transition hover:shadow-lg"
                >
                    <FaPlus /> Add Vehicle Details
                </button>
            </div>
            <button
                type="button"
                onClick={addVehicle}
                className="w-full flex sm:hidden  items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-sm font-medium text-white rounded-lg shadow-md"
            >
                <FaPlus /> Add Vehicle Details
            </button>
        </div>
    );
};

export default VehicleDetails;
