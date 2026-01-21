import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiSearch, FiX, FiInfo } from "react-icons/fi";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";
import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";

const AdditionalServices = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Feedback states
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const methods = useForm({
    defaultValues: { name: "" },
  });

  const { handleSubmit, reset, setError: setFormError } = methods;

  useEffect(() => {
    if (!hasPermission("additional-services", "view")) {
      navigate("/dashboard");
      return;
    }
    fetchServices();
  }, [hasPermission, navigate]);

  const fetchServices = async () => {
    try {
      const response = await apiClient.get("/survey-additional-services/");
      setServices(response.data);
    } catch (err) {
      setError("Failed to load additional services. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!hasPermission("additional-services", "add")) {
      setError("Permission denied");
      return;
    }
    if (!data.name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = { name: data.name.trim() };
      const response = await apiClient.post("/survey-additional-services/", payload);

      const newService = response.data;
      setServices((prev) => {
        const updated = [...prev, newService];
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });

      reset();
      setIsAddOpen(false);
      setMessage("Service added successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const fieldErrors = err.response?.data;
      if (fieldErrors?.name) {
        setFormError("name", { type: "server", message: Array.isArray(fieldErrors.name) ? fieldErrors.name[0] : fieldErrors.name });
      } else {
        setError("Failed to save service. Please try again.");
        setTimeout(() => setError(null), 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!hasPermission("additional-services", "delete")) {
      setError("Permission denied");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await apiClient.delete(`/survey-additional-services/${id}/`);
      setServices((prev) => prev.filter((s) => s.id !== id));
      setMessage("Service deleted successfully!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError("Failed to delete service. It may be in use.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Additional Services"
        subtitle="Manage extra services like Piano Moving or Handyman"
      />

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <FiX className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {message && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-medium">{message}</span>
            <button onClick={() => setMessage(null)} className="text-green-400 hover:text-green-600">
              <FiX className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <FiSearch className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-style w-full !pl-12 h-[52px] rounded-2xl border-gray-100 shadow-sm"
        />
      </div>

      {hasPermission("additional-services", "add") && (
        <button
          onClick={() => setIsAddOpen(true)}
          className="w-full btn-primary"
        >
          <FiPlus className="w-5 h-5" />
          <span className="text-sm tracking-wide">Add New Service</span>
        </button>
      )}

      {/* Content Area */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiInfo className="text-gray-300 w-7 h-7" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">No services found</h3>
          <p className="text-gray-600 text-sm mt-1">
            {searchQuery ? "Try adjusting your search query" : "Get started by adding a new service"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* Desktop Headers */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 rounded-xl border border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-widest">
            <div className="col-span-11">Service Name</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          {/* List Items */}
          <div className="space-y-3">
            {filteredServices.map((service) => (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key={service.id}
                className="group bg-white p-4 md:px-6 md:py-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="col-span-11">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] text-xs font-medium shrink-0">
                        {service.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{service.name}</span>
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end md:justify-center">
                    {hasPermission("additional-services", "delete") && (
                      <button
                        onClick={() => handleDelete(service.id, service.name)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <Modal
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            title="Add New Service"
          >
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="Service Name"
                  name="name"
                  placeholder="e.g. Piano Moving"
                  rules={{
                    required: "Service name is required",
                    minLength: { value: 2, message: "Minimum 2 characters" }
                  }}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="btn-secondary !bg-transparent !border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary px-8"
                  >
                    {isSubmitting ? <Loading size="sm" color="white" /> : "Save Service"}
                  </button>
                </div>
              </form>
            </FormProvider>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdditionalServices;