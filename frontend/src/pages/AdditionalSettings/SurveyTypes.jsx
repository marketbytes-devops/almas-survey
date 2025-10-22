import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Button from "../../components/Button"; 
import Input from "../../components/Input"; 

const SurveyTypes = () => {
  const [customerTypes, setCustomerTypes] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [petTypes, setPetTypes] = useState([]);
  const [packingTypes, setPackingTypes] = useState([]);
  const [selectedTypeCategory, setSelectedTypeCategory] = useState("customer");
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

  const { handleSubmit, reset, setValue } = methods;

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const [customerResponse, serviceResponse, vehicleResponse, petResponse, packingResponse] = await Promise.all([
          apiClient.get("/customer-types/"),
          apiClient.get("/service-types/"),
          apiClient.get("/vehicle-types/"),
          apiClient.get("/pet-types/"),
          apiClient.get("/packing-types/"),
        ]);
        setCustomerTypes(customerResponse.data);
        setServiceTypes(serviceResponse.data);
        setVehicleTypes(vehicleResponse.data);
        setPetTypes(petResponse.data);
        setPackingTypes(packingResponse.data);
      } catch (err) {
        setError("Failed to fetch types. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTypes();
  }, []);

  const handleTypeCategoryChange = (e) => {
    const newCategory = e.target.value;
    setSelectedTypeCategory(newCategory);
    reset();
  };

  const onSubmit = async (data) => {
    if (!data.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { name: data.name, description: data.description || "" };
      let response;
      let updatedTypes;
      switch (selectedTypeCategory) {
        case "customer":
          response = await apiClient.post("/customer-types/", payload);
          updatedTypes = [...customerTypes, response.data];
          setCustomerTypes(updatedTypes);
          break;
        case "service":
          response = await apiClient.post("/service-types/", payload);
          updatedTypes = [...serviceTypes, response.data];
          setServiceTypes(updatedTypes);
          break;
        case "vehicle":
          response = await apiClient.post("/vehicle-types/", payload);
          updatedTypes = [...vehicleTypes, response.data];
          setVehicleTypes(updatedTypes);
          break;
        case "pet":
          response = await apiClient.post("/pet-types/", payload);
          updatedTypes = [...petTypes, response.data];
          setPetTypes(updatedTypes);
          break;
        case "packing":
          response = await apiClient.post("/packing-types/", payload);
          updatedTypes = [...packingTypes, response.data];
          setPackingTypes(updatedTypes);
          break;
        default:
          throw new Error("Invalid type category selected");
      }
      reset();
      setSuccess("Type saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save type. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteType = async (id, category) => {
    if (!confirm(`Are you sure you want to delete this ${category} type?`)) return;
    setError(null);
    try {
      switch (category) {
        case "customer":
          await apiClient.delete(`/customer-types/${id}/`);
          setCustomerTypes(customerTypes.filter((t) => t.id !== id));
          break;
        case "service":
          await apiClient.delete(`/service-types/${id}/`);
          setServiceTypes(serviceTypes.filter((t) => t.id !== id));
          break;
        case "vehicle":
          await apiClient.delete(`/vehicle-types/${id}/`);
          setVehicleTypes(vehicleTypes.filter((t) => t.id !== id));
          break;
        case "pet":
          await apiClient.delete(`/pet-types/${id}/`);
          setPetTypes(petTypes.filter((t) => t.id !== id));
          break;
        case "packing":
          await apiClient.delete(`/packing-types/${id}/`);
          setPackingTypes(packingTypes.filter((t) => t.id !== id));
          break;
        default:
          throw new Error("Invalid type category for deletion");
      }
      setSuccess("Type deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete type. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const getTypesByCategory = () => {
    switch (selectedTypeCategory) {
      case "customer": return customerTypes;
      case "service": return serviceTypes;
      case "vehicle": return vehicleTypes;
      case "pet": return petTypes;
      case "packing": return packingTypes;
      default: return [];
    }
  };

  const currentTypes = getTypesByCategory();
  const categoryLabels = {
    customer: "Customer Types",
    service: "Service Types",
    vehicle: "Vehicle Types",
    pet: "Pet Types",
    packing: "Packing Types",
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="space-y-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Add New Type</h2>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-wrap gap-4 mb-4">
                {[
                  { value: "customer", label: "Customer Type" },
                  { value: "service", label: "Service Type" },
                  { value: "vehicle", label: "Vehicle Type" },
                  { value: "pet", label: "Pet Type" },
                  { value: "packing", label: "Packing Type" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="typeCategory"
                      value={option.value}
                      checked={selectedTypeCategory === option.value}
                      onChange={handleTypeCategoryChange}
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
                {saving ? "Saving..." : "Save New Type"}
              </Button>
            </form>
          </FormProvider>
        </div>
        {currentTypes.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <h3 className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
              {categoryLabels[selectedTypeCategory]} ({currentTypes.length})
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
                  {currentTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{type.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={type.description || "No description"}>{type.description || "No description"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => handleDeleteType(type.id, selectedTypeCategory)}
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
            No {categoryLabels[selectedTypeCategory].toLowerCase()} found. Add one above!
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyTypes;