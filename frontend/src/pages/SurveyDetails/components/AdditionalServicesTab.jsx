import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import Loading from "../../../components/Loading";
import apiClient from "../../../api/apiClient";
import { FaCheck, FaTrash, FaPen, FaBoxOpen } from "react-icons/fa";
import { usePermissions } from "../../../components/PermissionsContext/PermissionsContext";

const AdditionalServicesTab = () => {
    const { watch, setValue } = useFormContext();
    const { hasPermission } = usePermissions();
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
        if (!hasPermission("surveys", "edit")) return;
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
        if (!hasPermission("surveys", "edit")) return;
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Services</h3>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-3 mb-8">
                {additionalServices.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No additional services available. Please add services in the settings first.
                    </div>
                ) : (
                    additionalServices.map((service) => (
                        <div
                            key={service.id}
                            onClick={() => {
                                if (hasPermission("surveys", "edit")) {
                                    handleServiceToggle(service.id, service.name);
                                }
                            }}
                            className={`flex items-center justify-between p-3 sm:p-4 border rounded-xl transition-all duration-200 ${hasPermission("surveys", "edit") ? "cursor-pointer" : "cursor-not-allowed opacity-60"} ${isServiceSelected(service.id)
                                ? "bg-[#4c7085]/5 border-[#4c7085] shadow-sm"
                                : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isServiceSelected(service.id) ? "bg-[#4c7085] border-[#4c7085]" : "bg-white border-gray-300"
                                    }`}>
                                    {isServiceSelected(service.id) && <FaCheck className="w-3 h-3 text-white" />}
                                </div>
                                <span className={`font-medium ${isServiceSelected(service.id) ? "text-[#4c7085]" : "text-gray-700"
                                    }`}>
                                    {service.name}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedServices.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-6">
                    <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">
                        Selected Services ({selectedServices.length})
                    </h4>

                    <div className="space-y-4">
                        {selectedServices.map((service) => (
                            <div
                                key={service.id}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-5"
                            >
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-10 h-10 rounded-lg bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] flex-shrink-0">
                                            <FaBoxOpen className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-medium text-gray-900 text-sm sm:text-base leading-tight">{service.name}</h5>
                                            <p className="text-xs text-gray-600 mt-1">Configure details below</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                                        <div className="flex items-center border border-gray-200 rounded-lg h-9 bg-white shadow-sm overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newQty = Math.max(1, (service.quantity || 1) - 1);
                                                    updateServiceDetails(service.id, "quantity", newQty);
                                                }}
                                                disabled={!hasPermission("surveys", "edit")}
                                                className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-gray-700 border-r border-gray-100 transition-colors disabled:opacity-50"
                                            >
                                                -
                                            </button>
                                            <span className="w-10 text-center text-sm font-medium text-gray-900">
                                                {service.quantity || 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newQty = (service.quantity || 1) + 1;
                                                    updateServiceDetails(service.id, "quantity", newQty);
                                                }}
                                                disabled={!hasPermission("surveys", "edit")}
                                                className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#4c7085] border-l border-gray-100 transition-colors disabled:opacity-50"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleServiceToggle(service.id, service.name)}
                                            disabled={!hasPermission("surveys", "edit")}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 disabled:opacity-50"
                                            title="Remove Service"
                                        >
                                            <FaTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FaPen className="w-3 h-3 text-gray-600" />
                                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Remarks</label>
                                    </div>
                                    <textarea
                                        value={service.remarks || ""}
                                        onChange={(e) => updateServiceDetails(service.id, "remarks", e.target.value)}
                                        readOnly={!hasPermission("surveys", "edit")}
                                        className={`w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4c7085] focus:bg-white transition-all min-h-[60px] resize-y ${!hasPermission("surveys", "edit") ? "opacity-60 cursor-not-allowed" : ""}`}
                                        placeholder="Add any specific details..."
                                    />
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
