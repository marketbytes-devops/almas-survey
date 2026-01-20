/* src/pages/AdditionalSettings/Manpower.jsx */
import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";
import Loading from "../../components/Loading";

const Manpower = () => {
  const [manpower, setManpower] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const methods = useForm({
    defaultValues: { name: "", description: "" },
  });

  const { handleSubmit, reset, watch } = methods;

  useEffect(() => {
    const fetchManpower = async () => {
      try {
        const response = await apiClient.get("/manpower/");
        setManpower(response.data);
      } catch (err) {
        setError("Failed to fetch manpower. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchManpower();
  }, []);

  const onSubmit = async (data) => {
    if (!data.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { name: data.name.trim(), description: data.description?.trim() || "" };
      const response = await apiClient.post("/manpower/", payload);
      setManpower([...manpower, response.data]);
      reset();
      setSuccess("Manpower saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save manpower. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteManpower = async (id) => {
    if (!window.confirm("Are you sure you want to delete this manpower?")) return;
    setError(null);
    try {
      await apiClient.delete(`/manpower/${id}/`);
      setManpower(manpower.filter((m) => m.id !== id));
      setSuccess("Manpower deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete manpower. Please try again.");
      setTimeout(() => setError(null), 3000);
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
          <h1 className="text-xs sm:text-lg font-medium">Manpower Management</h1>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Success/Error Messages */}
          {success && (
            <div className="p-4 bg-green-100 text-green-700 rounded-lg text-center font-medium border border-green-400">
              {success}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center font-medium border border-red-400">
              {error}
            </div>
          )}

          {/* Add New Manpower Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <Input
                    label="Name"
                    name="name"
                    type="text"
                    placeholder="e.g. Packer, Driver, Supervisor"
                    rules={{ required: "Name is required" }}
                    disabled={saving}
                  />

                  <Input
                    label="Description (optional)"
                    name="description"
                    type="textarea"
                    rows={3}
                    placeholder="Optional description for this manpower type"
                    disabled={saving}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || !watch("name")?.trim()}
                  className={`w-full text-sm font-medium px-6 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${saving || !watch("name")?.trim()
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:scale-105"
                    }`}
                >
                  {saving ? "Saving..." : "Save New Manpower"}
                </button>
              </form>
            </FormProvider>
          </div>

          {/* Manpower List Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-4 sm:px-6 py-3">
              <h3 className="text-xs sm:text-lg font-medium">
                Manpower ({manpower.length})
              </h3>
            </div>

            {manpower.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-300">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Name</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Description</th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {manpower.map((man) => (
                        <tr key={man.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{man.name}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                            {man.description || "—"}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <button
                              onClick={() => handleDeleteManpower(man.id)}
                              className="text-sm font-medium px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3 p-4">
                  {manpower.map((man) => (
                    <div key={man.id} className="bg-gray-50 rounded-lg border border-gray-300 p-4">
                      <div className="flex justify-center items-center mb-2">
                        <h4 className="font-medium text-gray-900">{man.name}</h4>
                      </div>
                      <p className="flex justify-center items-center text-sm text-gray-600 mb-4">
                        {man.description || "No description"}
                      </p>
                      <div className="flex justify-center items-center">
                        <button
                          onClick={() => handleDeleteManpower(man.id)}
                          className="text-sm font-medium px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <p className="text-base sm:text-lg mb-2">No manpower found.</p>
                <p className="text-sm">Add one using the form above!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manpower;