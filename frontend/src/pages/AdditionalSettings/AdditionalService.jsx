import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient"; 
import Button from "../../components/Button";
import Input from "../../components/Input";
import Loading from "../../components/Loading";

const AdditionalServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const methods = useForm({
    defaultValues: {
      name: "",
    },
  });

  const { handleSubmit, reset, watch } = methods;
  const watchedName = watch("name");

  useEffect(() => {
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
    fetchServices();
  }, []);

  const onSubmit = async (data) => {
    if (!data.name.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = { name: data.name.trim() };
      const response = await apiClient.post("/survey-additional-services/", payload);

      const newService = response.data;
      setServices(prev => {
        const updated = [...prev, newService];
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });

      reset();
      setSuccess("Additional service added successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg = err.response?.data?.name?.[0] || "Failed to save service.";
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.delete(`/survey-additional-services/${id}/`);
      setServices(prev => prev.filter(s => s.id !== id));
      setSuccess("Service deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete service. It might be in use.");
      setTimeout(() => setError(null), 4000);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md">
      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Add New Form */}
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="text-lg sm:text-xl font-medium mb-6">Add New Survey Additional Service</h2>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="w-full">
                <Input
                  label="Service Name *"
                  name="name"
                  type="text"
                  placeholder="e.g. Piano Moving, Storage in Transit..."
                  rules={{
                    required: "Service name is required",
                    minLength: { value: 2, message: "Minimum 2 characters" },
                  }}
                  disabled={saving}
                />
              </div>

              <Button
                type="submit"
                disabled={!watchedName?.trim() || saving}
                className="w-full sm:w-auto"
              >
                {saving ? "Saving..." : "Add Service"}
              </Button>
            </form>
          </FormProvider>
        </div>

        {/* List of Services */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <h3 className="bg-gray-50 px-6 py-4 text-lg font-semibold text-gray-900 border-b border-gray-200">
            Survey Additional Services ({services.length})
          </h3>

          {services.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {service.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => handleDelete(service.id, service.name)}
                          disabled={deletingId === service.id}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded disabled:opacity-50"
                        >
                          {deletingId === service.id ? "Deleting..." : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No additional services yet. Add one using the form above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdditionalServices;