import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Button from "../../components/Button";
import Input from "../../components/Input";

const Units = () => {
  const [volumeUnits, setVolumeUnits] = useState([]);
  const [weightUnits, setWeightUnits] = useState([]);
  const [selectedUnitCategory, setSelectedUnitCategory] = useState("volume");
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
    const fetchUnits = async () => {
      try {
        const [volumeResponse, weightResponse] = await Promise.all([
          apiClient.get("/volume-units/"),
          apiClient.get("/weight-units/"),
        ]);
        setVolumeUnits(volumeResponse.data);
        setWeightUnits(weightResponse.data);
      } catch (err) {
        setError("Failed to fetch units. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchUnits();
  }, []);

  const handleUnitCategoryChange = (e) => {
    const newCategory = e.target.value;
    setSelectedUnitCategory(newCategory);
    reset();
  };

  const onSubmit = async (data) => {
    if (!data.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { name: data.name, description: data.description || "" };
      let response;
      let updatedUnits;
      switch (selectedUnitCategory) {
        case "volume":
          response = await apiClient.post("/volume-units/", payload);
          updatedUnits = [...volumeUnits, response.data];
          setVolumeUnits(updatedUnits);
          break;
        case "weight":
          response = await apiClient.post("/weight-units/", payload);
          updatedUnits = [...weightUnits, response.data];
          setWeightUnits(updatedUnits);
          break;
        default:
          throw new Error("Invalid unit category selected");
      }
      reset();
      setSuccess("Unit saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save unit. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async (id, category) => {
    if (!confirm(`Are you sure you want to delete this ${category} unit?`)) return;
    setError(null);
    try {
      switch (category) {
        case "volume":
          await apiClient.delete(`/volume-units/${id}/`);
          setVolumeUnits(volumeUnits.filter((u) => u.id !== id));
          break;
        case "weight":
          await apiClient.delete(`/weight-units/${id}/`);
          setWeightUnits(weightUnits.filter((u) => u.id !== id));
          break;
        default:
          throw new Error("Invalid unit category for deletion");
      }
      setSuccess("Unit deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete unit. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const getUnitsByCategory = () => {
    switch (selectedUnitCategory) {
      case "volume": return volumeUnits;
      case "weight": return weightUnits;
      default: return [];
    }
  };

  const currentUnits = getUnitsByCategory();
  const categoryLabels = {
    volume: "Volume Units",
    weight: "Weight Units",
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="space-y-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Add New Unit</h2>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-wrap gap-4 mb-4">
                {[
                  { value: "volume", label: "Volume Unit" },
                  { value: "weight", label: "Weight Unit" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="unitCategory"
                      value={option.value}
                      checked={selectedUnitCategory === option.value}
                      onChange={handleUnitCategoryChange}
                      className="form-radio text-indigo-600 h-4 w-4"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
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
                {saving ? "Saving..." : "Save New Unit"}
              </Button>
            </form>
          </FormProvider>
        </div>
        {currentUnits.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <h3 className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
              {categoryLabels[selectedUnitCategory]} ({currentUnits.length})
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
                  {currentUnits.map((unit) => (
                    <tr key={unit.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{unit.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={unit.description || "No description"}>{unit.description || "No description"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => handleDeleteUnit(unit.id, selectedUnitCategory)}
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
            No {categoryLabels[selectedUnitCategory].toLowerCase()} found. Add one above!
          </div>
        )}
      </div>
    </div>
  );
};

export default Units;