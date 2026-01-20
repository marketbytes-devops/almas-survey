import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";
import Loading from "../../components/Loading";

const AdditionalServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // New state for modal

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
      setServices((prev) => {
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
    if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.delete(`/survey-additional-services/${id}/`);
      setServices((prev) => prev.filter((s) => s.id !== id));
      setSuccess(`"${name}" has been deleted successfully!`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Delete error:", err);
      const errorMsg = err.response?.status === 404
        ? "Service not found."
        : "Failed to delete service. It might be in use or server error.";
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
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
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-6">
          <h1 className="text-xs sm:text-lg font-medium">Additional Services Management</h1>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Success/Error Messages */}
          <div className="fixed top-4 right-4 z-50 w-80 max-w-full">
            {success && (
              <div className="p-4 mb-2 bg-green-100 border-l-4 border-green-500 text-green-700 rounded shadow-lg">
                <p className="font-medium">{success}</p>
              </div>
            )}
            {error && (
              <div className="p-4 mb-2 bg-red-100 border-l-4 border-red-500 text-red-700 rounded shadow-lg">
                <p className="font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Add New Service Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="Service Name"
                  name="name"
                  type="text"
                  placeholder="e.g. Piano Moving, Storage in Transit..."
                  rules={{
                    required: "Service name is required",
                    minLength: { value: 2, message: "Minimum 2 characters" },
                  }}
                  disabled={saving}
                />

                <button
                  type="submit"
                  disabled={!watchedName?.trim() || saving}
                  className={`w-full text-sm font-medium px-6 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${!watchedName?.trim() || saving
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:scale-105"
                    }`}
                >
                  {saving ? "Saving..." : "Add Service"}
                </button>
              </form>
            </FormProvider>
          </div>

          {/* Services List Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-4 sm:px-6 py-3">
              <h3 className="text-xs sm:text-lg font-medium">
                Survey Additional Services ({services.length})
              </h3>
            </div>

            {services.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-300">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">
                          Name
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-medium text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {services.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                            {service.name}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <button
                              onClick={() => handleDelete(service.id, service.name)}
                              disabled={deletingId === service.id}
                              className={`text-sm font-medium px-6 py-2 rounded-lg transition ${deletingId === service.id
                                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                  : "bg-red-600 text-white hover:bg-red-700"
                                }`}
                            >
                              {deletingId === service.id ? "Deleting..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3 p-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-gray-50 rounded-lg border border-gray-300 p-4"
                    >
                      <div className="flex justify-center items-center mb-2">
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                      </div>
                      <div className="flex justify-center items-center">
                        <button
                          onClick={() => handleDelete(service.id, service.name)}
                          disabled={deletingId === service.id}
                          className={`text-sm font-medium px-6 py-2 rounded-lg transition ${deletingId === service.id
                              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                        >
                          {deletingId === service.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <p className="text-base sm:text-lg mb-2">No additional services yet.</p>
                <p className="text-sm">Add one using the form above!</p>
              </div>
            )}
          </div>
        </div>

        {/* Optional Custom Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
              <p className="mb-6">
                Are you sure you want to delete <strong>"{confirmDelete.name}"</strong>?<br />
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const { id, name } = confirmDelete;
                    setConfirmDelete(null);
                    setDeletingId(id);
                    try {
                      await apiClient.delete(`/survey-additional-services/${id}/`);
                      setServices((prev) => prev.filter((s) => s.id !== id));
                      setSuccess(`"${name}" deleted successfully!`);
                      setTimeout(() => setSuccess(null), 5000);
                    } catch (err) {
                      setError("Failed to delete service.");
                      setTimeout(() => setError(null), 5000);
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdditionalServices;