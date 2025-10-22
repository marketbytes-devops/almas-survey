import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Button from "../../components/Button";
import Input from "../../components/Input";

const Tax = () => {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const methods = useForm({
    defaultValues: {
      tax_name: "",
      description: "",
    },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const response = await apiClient.get("/taxes/");
        setTaxes(response.data);
      } catch (err) {
        setError("Failed to fetch taxes. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTaxes();
  }, []);

  const onSubmit = async (data) => {
    if (!data.tax_name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { tax_name: data.tax_name, description: data.description || "" };
      const response = await apiClient.post("/taxes/", payload);
      setTaxes([...taxes, response.data]);
      reset();
      setSuccess("Tax saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save tax. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTax = async (id) => {
    if (!confirm("Are you sure you want to delete this tax?")) return;
    setError(null);
    try {
      await apiClient.delete(`/taxes/${id}/`);
      setTaxes(taxes.filter((t) => t.id !== id));
      setSuccess("Tax deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete tax. Please try again.");
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
          <h2 className="text-lg font-semibold mb-4">Add New Tax</h2>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  label="Tax Name"
                  name="tax_name"
                  type="text"
                  rules={{ required: "Tax Name is required" }}
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
                disabled={!methods.watch("tax_name")?.trim() || saving}
                className="w-full md:w-auto"
              >
                {saving ? "Saving..." : "Save New Tax"}
              </Button>
            </form>
          </FormProvider>
        </div>
        {taxes.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <h3 className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
              Taxes ({taxes.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {taxes.map((tax) => (
                    <tr key={tax.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{tax.tax_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={tax.description || "No description"}>{tax.description || "No description"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => handleDeleteTax(tax.id)}
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
            No taxes found. Add one above!
          </div>
        )}
      </div>
    </div>
  );
};

export default Tax;