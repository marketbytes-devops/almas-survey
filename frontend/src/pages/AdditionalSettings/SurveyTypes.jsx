import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";
import Loading from "../../components/Loading";

const CATEGORY_ENDPOINT = {
  customer: "/customer-types/",
  service: "/service-types/",
  vehicle: "/vehicle-types/",
  pet: "/pet-types/",
  packing: "/packing-types/",
  hub: "/hub/",
  move: "/move-types/",
  tariff: "/tariff-types/",
};

const CATEGORY_LABEL = {
  customer: "Customer Types",
  service: "Service Types",
  vehicle: "Vehicle Types",
  pet: "Pet Types",
  packing: "Packing Types",
  hub: "Hub Types",
  move: "Move Types",
  tariff: "Tariff Types",
};

const SurveyTypes = () => {
  const [types, setTypes] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("customer");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const methods = useForm({ defaultValues: { name: "", description: "" } });
  const { handleSubmit, reset, watch, setError, clearErrors, formState } = methods;
  const { errors } = formState;

  useEffect(() => {
    const fetchAll = async () => {
      const init = {};
      Object.keys(CATEGORY_ENDPOINT).forEach((c) => (init[c] = []));

      try {
        const endpoints = Object.entries(CATEGORY_ENDPOINT);
        const responses = await Promise.all(
          endpoints.map(async ([cat, url]) => {
            try {
              const res = await apiClient.get(url);
              return { cat, data: res.data };
            } catch (err) {
              console.warn(`Warning: ${url} returned ${err.response?.status}`);
              return { cat, data: [] };
            }
          })
        );

        responses.forEach(({ cat, data }) => {
          init[cat] = data;
        });

        setTypes(init);
      } catch (e) {
        showMsg("Failed to load some data", "error");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const currentList = types[selectedCategory] || [];

  const onCategoryChange = (e) => {
    const newCat = e.target.value;
    setSelectedCategory(newCat);
    reset();
    clearErrors();
  };

  const onSubmit = async (data) => {
    if (!data.name?.trim()) return;

    setSaving(true);
    clearErrors();

    try {
      const endpoint = CATEGORY_ENDPOINT[selectedCategory];
      const resp = await apiClient.post(endpoint, {
        name: data.name.trim(),
        description: data.description?.trim() || "",
      });

      setTypes((prev) => ({
        ...prev,
        [selectedCategory]: [...(prev[selectedCategory] || []), resp.data],
      }));

      reset();
      showMsg("Saved successfully!");
    } catch (e) {
      const fieldErrors = e.response?.data;
      if (fieldErrors?.name?.[0]) {
        setError("name", { type: "server", message: fieldErrors.name[0] });
      } else {
        showMsg(fieldErrors?.detail || "Failed to save.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      const endpoint = CATEGORY_ENDPOINT[selectedCategory];
      await apiClient.delete(`${endpoint}${id}/`);

      setTypes((prev) => ({
        ...prev,
        [selectedCategory]: (prev[selectedCategory] || []).filter((t) => t.id !== id),
      }));

      showMsg("Deleted successfully!");
    } catch (e) {
      showMsg("Failed to delete.", "error");
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
          <h1 className="text-xs sm:text-lg font-medium">Additional Settings - Types</h1>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Toast Message */}
          {msg.text && (
            <div
              className={`p-4 rounded-lg text-center font-medium ${
                msg.type === "error"
                  ? "bg-red-100 text-red-700 border border-red-400"
                  : "bg-green-100 text-green-700 border border-green-400"
              }`}
            >
              {msg.text}
            </div>
          )}

          {/* Add Form Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Category Selection - Responsive Wrap */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                    <label
                      key={value}
                      className="flex items-center gap-2 cursor-pointer text-sm sm:text-base"
                    >
                      <input
                        type="radio"
                        name="category"
                        value={value}
                        checked={selectedCategory === value}
                        onChange={onCategoryChange}
                        className="w-4 h-4 text-[#4c7085] focus:ring-[#4c7085]"
                      />
                      <span className="font-medium">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 gap-6">
                  <Input
                    label="Name"
                    name="name"
                    type="text"
                    placeholder="Enter type name"
                    rules={{ required: "Name is required" }}
                    disabled={saving}
                  />

                  <Input
                    label="Description (optional)"
                    name="description"
                    type="textarea"
                    placeholder="Optional description"
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
                  {saving ? "Saving..." : "Save Type"}
                </button>
              </form>
            </FormProvider>
          </div>

          {/* List Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-4 sm:px-6 py-3">
              <h3 className="text-xs sm:text-lg font-medium">
                {CATEGORY_LABEL[selectedCategory]} ({currentList.length})
              </h3>
            </div>

            {currentList.length > 0 ? (
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
                      {currentList.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                            {item.description || "—"}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <button
                              onClick={() => deleteItem(item.id)}
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
                  {currentList.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg border border-gray-300 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {item.description || "No description"}
                      </p>
                      <div className="flex justify-end">
                        <button
                          onClick={() => deleteItem(item.id)}
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
                  No {CATEGORY_LABEL[selectedCategory].toLowerCase()} found.
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

export default SurveyTypes;