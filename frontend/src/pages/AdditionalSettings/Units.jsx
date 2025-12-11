import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";
import Loading from "../../components/Loading";

const Units = () => {
  const [volumeUnits, setVolumeUnits] = useState([]);
  const [weightUnits, setWeightUnits] = useState([]);
  const [selectedUnitCategory, setSelectedUnitCategory] = useState("volume");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const methods = useForm({
    defaultValues: { name: "", description: "" },
  });

  const { handleSubmit, reset, watch } = methods;

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
      const payload = { name: data.name.trim(), description: data.description?.trim() || "" };
      let updatedUnits;
      if (selectedUnitCategory === "volume") {
        const response = await apiClient.post("/volume-units/", payload);
        updatedUnits = [...volumeUnits, response.data];
        setVolumeUnits(updatedUnits);
      } else {
        const response = await apiClient.post("/weight-units/", payload);
        updatedUnits = [...weightUnits, response.data];
        setWeightUnits(updatedUnits);
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
    if (!window.confirm(`Are you sure you want to delete this ${category} unit?`)) return;
    setError(null);
    try {
      if (category === "volume") {
        await apiClient.delete(`/volume-units/${id}/`);
        setVolumeUnits(volumeUnits.filter((u) => u.id !== id));
      } else {
        await apiClient.delete(`/weight-units/${id}/`);
        setWeightUnits(weightUnits.filter((u) => u.id !== id));
      }
      setSuccess("Unit deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete unit. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const getUnitsByCategory = () => {
    return selectedUnitCategory === "volume" ? volumeUnits : weightUnits;
  };

  const currentUnits = getUnitsByCategory();
  const categoryLabels = {
    volume: "Volume Units",
    weight: "Weight Units",
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
          <h1 className="text-xs sm:text-lg font-medium">Units Management</h1>
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

          {/* Add New Unit Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Category Selection */}
                <div className="flex flex-wrap gap-4">
                  {[
                    { value: "volume", label: "Volume Unit" },
                    { value: "weight", label: "Weight Unit" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer text-sm sm:text-base"
                    >
                      <input
                        type="radio"
                        name="unitCategory"
                        value={option.value}
                        checked={selectedUnitCategory === option.value}
                        onChange={handleUnitCategoryChange}
                        className="w-4 h-4 text-[#4c7085] focus:ring-[#4c7085]"
                      />
                      <span className="font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 gap-6">
                  <Input
                    label="Name"
                    name="name"
                    type="text"
                    placeholder="e.g. Cubic Meter, Kilogram"
                    rules={{ required: "Name is required" }}
                    disabled={saving}
                  />

                  <Input
                    label="Description (optional)"
                    name="description"
                    type="textarea"
                    rows={3}
                    placeholder="Optional description for this unit"
                    disabled={saving}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || !watch("name")?.trim()}
                  className={`w-full text-sm font-medium px-6 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${
                    saving || !watch("name")?.trim()
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:scale-105"
                  }`}
                >
                  {saving ? "Saving..." : "Save New Unit"}
                </button>
              </form>
            </FormProvider>
          </div>

          {/* Units List Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-4 sm:px-6 py-3">
              <h3 className="text-xs sm:text-lg font-medium">
                {categoryLabels[selectedUnitCategory]} ({currentUnits.length})
              </h3>
            </div>

            {currentUnits.length > 0 ? (
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
                      {currentUnits.map((unit) => (
                        <tr key={unit.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{unit.name}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                            {unit.description || "—"}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <button
                              onClick={() => handleDeleteUnit(unit.id, selectedUnitCategory)}
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
                  {currentUnits.map((unit) => (
                    <div key={unit.id} className="bg-gray-50 rounded-lg border border-gray-300 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{unit.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {unit.description || "No description"}
                      </p>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDeleteUnit(unit.id, selectedUnitCategory)}
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
              <div className="text-center py-12 text-gray-500">
                <p className="text-base sm:text-lg mb-2">
                  No {categoryLabels[selectedUnitCategory].toLowerCase()} found.
                </p>
                <p className="text-sm">Add one using the form above!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Units;