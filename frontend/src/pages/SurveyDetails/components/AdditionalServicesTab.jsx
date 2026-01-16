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
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-2 md:p-6">
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Additional Services</h3>

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
                            className={`flex items-center justify-between p-2 sm:p-4 border rounded-lg transition-all duration-200 ${isServiceSelected(service.id)
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
                <div className="mt-2">
                    <div className="flex items-center gap-3 mb-6">
                        <h4 className="text-xl font-medium text-gray-900">
                            Selected ({selectedServices.length})
                        </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {selectedServices.map((service) => (
                            <div
                                key={service.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group relative"
                            >
                                <div className="p-4 sm:p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        {/* Service Icon and Name */}
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#4c7085] flex items-center justify-center text-white border border-[#4c7085] transition-colors duration-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-medium text-gray-900 text-lg leading-tight truncate">{service.name}</h5>
                                                <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">Additional Service</p>
                                            </div>
                                        </div>

                                        {/* Controls Row: Quantity and Delete Button */}
                                        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                            <div className="flex items-center bg-gray-100/80 border border-gray-100 rounded-xl p-1 shadow-inner flex-1 sm:flex-none justify-between sm:justify-start">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newQty = Math.max(1, (service.quantity || 1) - 1);
                                                        updateServiceDetails(service.id, "quantity", newQty);
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                                                >
                                                    <span className="text-xl font-medium">−</span>
                                                </button>
                                                <span className="text-lg font-bold w-12 text-center text-gray-800">
                                                    {service.quantity || 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newQty = (service.quantity || 1) + 1;
                                                        updateServiceDetails(service.id, "quantity", newQty);
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                                                >
                                                    <span className="text-xl font-medium">+</span>
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleServiceToggle(service.id, service.name)}
                                                className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all duration-300"
                                                title="Remove Service"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remarks & Special Instructions */}
                                    <div className="mt-5 pt-5 border-t border-gray-50">
                                        <div className="flex items-center gap-2 mb-3 px-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            <label className="text-sm font-medium text-gray-600">Remarks & Special Instructions</label>
                                        </div>
                                        <textarea
                                            value={service.remarks || ""}
                                            onChange={(e) => updateServiceDetails(service.id, "remarks", e.target.value)}
                                            className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4c7085] focus:bg-white focus:border-transparent transition-all duration-300 min-h-[80px]"
                                            placeholder="Add any specific details or requirements for this service..."
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
