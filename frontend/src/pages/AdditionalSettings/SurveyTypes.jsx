/* src/pages/AdditionalSettings/SurveyTypes.jsx */
import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Loading from "../../components/Loading";

const CATEGORY_ENDPOINT = {
  customer: "/customer-types/",
  service: "/service-types/",
  vehicle: "/vehicle-types/",
  pet: "/pet-types/",
  packing: "/packing-types/",
  hub: "/hub/",
  move: "/move-types/",       // New endpoint for Move Type
  tariff: "/tariff-types/",  // New endpoint for Tariff Type
};

const CATEGORY_LABEL = {
  customer: "Customer Types",
  service: "Service Types",
  vehicle: "Vehicle Types",
  pet: "Pet Types",
  packing: "Packing Types",
  hub: "Hub Types",
  move: "Move Types",        // New label for Move Type
  tariff: "Tariff Types",    // New label for Tariff Type
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

  /* -------------------------------------------------- FETCH -------------------------------------------------- */
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

  /* -------------------------------------------------- HELPERS ------------------------------------------------- */
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

  /* -------------------------------------------------- CREATE -------------------------------------------------- */
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

  /* -------------------------------------------------- DELETE -------------------------------------------------- */
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
      <div className="flex justify-center items-center min-h-screen"><Loading/></div>
    );
  }

  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md">
      {/* Toast */}
      {msg.text && (
        <div
          className={`mb-4 px-4 py-2 rounded border ${
            msg.type === "error"
              ? "bg-red-100 border-red-400 text-red-700"
              : "bg-green-100 border-green-400 text-green-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* ---------- ADD FORM ---------- */}
      <div className="p-4 border border-gray-200 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Add New Type</h2>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Category radios */}
            <div className="flex flex-wrap gap-4 mb-4">
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <label key={value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={value}
                    checked={selectedCategory === value}
                    onChange={onCategoryChange}
                    className="form-radio text-indigo-600 h-4 w-4"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>

            {/* Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Name"
                  name="name"
                  type="text"
                  placeholder="Enter type name"
                  rules={{ required: "Name is required" }}
                  disabled={saving}
                  error={errors.name?.message}
                />
              </div>
              <div>
                <Input
                  label="Description (optional)"
                  name="description"
                  type="textarea"
                  placeholder="Optional description"
                  disabled={saving}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving || !watch("name")?.trim()}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? "Saving…" : "Save Type"}
            </Button>
          </form>
        </FormProvider>
      </div>

      {/* ---------- LIST TABLE ---------- */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <h3 className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900">
          {CATEGORY_LABEL[selectedCategory]} ({currentList.length})
        </h3>
        {currentList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate"
                      title={item.description || ""}
                    >
                      {item.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        onClick={() => deleteItem(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">
            No {CATEGORY_LABEL[selectedCategory].toLowerCase()} found. Add one above!
          </p>
        )}
      </div>
    </div>
  );
};

export default SurveyTypes;
