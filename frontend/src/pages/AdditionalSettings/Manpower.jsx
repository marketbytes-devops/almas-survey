import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Button from "../../components/Button";
import Input from "../../components/Input";

const Manpower = () => {
  const [manpower, setManpower] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const methods = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { handleSubmit, reset } = methods;

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
      const payload = { name: data.name, description: data.description || "" };
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
    if (!confirm("Are you sure you want to delete this manpower?")) return;
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

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="space-y-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Add New Manpower</h2>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  label="Name"
                  name="name"
                  type="text"
                  rules={{ required: "Name is required" }}
                  disabled={saving}
                />
                <Input
                  label="Description (optional)"
                  name="description"
                  type="textarea"
                  disabled={saving}
                />
              </div>
              <Button
                type="submit"
                disabled={!methods.watch("name")?.trim() || saving}
                className="w-full md:w-auto"
              >
                {saving ? "Saving..." : "Save New Manpower"}
              </Button>
            </form>
          </FormProvider>
        </div>
        {manpower.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <h3 className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
              Manpower ({manpower.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {manpower.map((man) => (
                    <tr key={man.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{man.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={man.description || "No description"}>{man.description || "No description"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => handleDeleteManpower(man.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No manpower found. Add one above!
          </div>
        )}
      </div>
    </div>
  );
};

export default Manpower;