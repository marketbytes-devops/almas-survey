import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import Loading from "../../../components/Loading";
import apiClient from "../../../api/apiClient";

const AdditionalServicesTab = () => {
    const { watch, setValue } = useFormContext();
    const [additionalServices, setAdditionalServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const selectedServices = watch("additionalServices") || [];

    useEffect(() => {
        const fetchAdditionalServices = async () => {
            try {
                const response = await apiClient.get("/survey-additional-services/");
                setAdditionalServices(response.data);
            } catch (err) {
                setError("Failed to load additional services.");
                console.error("Error fetching additional services:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdditionalServices();
    }, []);

    const handleServiceToggle = (serviceId, serviceName) => {
        const isCurrentlySelected = selectedServices.some(service => service.id === serviceId);

        let updatedServices;
        if (isCurrentlySelected) {
            updatedServices = selectedServices.filter(service => service.id !== serviceId);
        } else {
            updatedServices = [...selectedServices, {
                id: serviceId,
                name: serviceName,
                selected: true,
                quantity: 1,
                remarks: ""
            }];
        }

        setValue("additionalServices", updatedServices, { shouldValidate: true });
    };

    const updateServiceDetails = (serviceId, field, value) => {
        const updatedServices = selectedServices.map(service => {
            if (service.id === serviceId) {
                return { ...service, [field]: value };
            }
            return service;
        });
        setValue("additionalServices", updatedServices, { shouldValidate: true });
    };

    const isServiceSelected = (serviceId) => {
        return selectedServices.some(service => service.id === serviceId);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loading />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-6">Additional Services</h3>

            {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {additionalServices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No additional services available. Please add services in the settings first.
                    </div>
                ) : (
                    additionalServices.map((service) => (
                        <div
                            key={service.id}
                            className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 ${isServiceSelected(service.id)
                                ? "bg-blue-50 border-blue-200"
                                : "bg-white border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                <input
                                    type="checkbox"
                                    checked={isServiceSelected(service.id)}
                                    onChange={() => handleServiceToggle(service.id, service.name)}
                                    className="w-5 h-5 text-[#4c7085] rounded focus:ring-[#6b8ca3]"
                                />
                                <span className={`font-medium ${isServiceSelected(service.id) ? "text-[#4c7085]" : "text-gray-700"
                                    }`}>
                                    {service.name}
                                </span>
                            </div>

                            {isServiceSelected(service.id) && (
                                <span className="text-sm text-green-600 font-medium">Selected</span>
                            )}
                        </div>
                    ))
                )}
            </div>
            {selectedServices.length > 0 && (
                <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="text-lg sm:text-xl font-medium text-green-800 mb-2">
                        Selected Additional Services ({selectedServices.length})
                    </h4>
                    <div className="space-y-2">
                        {selectedServices.map((service) => (
                            <div key={service.id} className="bg-white p-4 rounded border border-green-100 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-green-800 font-medium text-lg">{service.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleServiceToggle(service.id, service.name)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 px-2">Select Quantity</label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newQty = Math.max(1, (service.quantity || 1) - 1);
                                                    updateServiceDetails(service.id, "quantity", newQty);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold"
                                            >
                                                -
                                            </button>
                                            <span className="text-lg font-medium w-8 text-center text-gray-700">{service.quantity || 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newQty = (service.quantity || 1) + 1;
                                                    updateServiceDetails(service.id, "quantity", newQty);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                        <textarea
                                            value={service.remarks || ""}
                                            onChange={(e) => updateServiceDetails(service.id, "remarks", e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            rows={2}
                                            placeholder="Add remarks..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdditionalServicesTab;
