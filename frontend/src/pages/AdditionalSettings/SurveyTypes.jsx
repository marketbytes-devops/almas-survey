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
  hub: "/hubs/",
};

const CATEGORY_LABEL = {
  customer: "Customer Types",
  service: "Service Types",
  vehicle: "Vehicle Types",
  pet: "Pet Types",
  packing: "Packing Types",
  hub: "Hub Types",
};

const SurveyTypes = () => {
  const [types, setTypes] = useState({}); // {customer: [], service: [], ...}
  const [selectedCategory, setSelectedCategory] = useState("customer");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const methods = useForm({ defaultValues: { name: "", description: "" } });
  const { handleSubmit, reset, watch } = methods;

  /* -------------------------------------------------- FETCH -------------------------------------------------- */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const responses = await Promise.all(
          Object.values(CATEGORY_ENDPOINT).map((ep) => apiClient.get(ep))
        );
        const data = {};
        Object.keys(CATEGORY_ENDPOINT).forEach((cat, i) => {
          data[cat] = responses[i].data;
        });
        setTypes(data);
      } catch (e) {
        showMsg("Failed to load data", "error");
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
    setSelectedCategory(e.target.value);
    reset();
  };

  /* -------------------------------------------------- CREATE -------------------------------------------------- */
  const onSubmit = async (data) => {
    if (!data.name?.trim()) return;
    setSaving(true);
    try {
      const endpoint = CATEGORY_ENDPOINT[selectedCategory];
      const resp = await apiClient.post(endpoint, {
        name: data.name.trim(),
        description: data.description?.trim() || "",
      });
      setTypes((prev) => ({
        ...prev,
        [selectedCategory]: [...prev[selectedCategory], resp.data],
      }));
      reset();
      showMsg("Saved successfully!");
    } catch (e) {
      const err = e.response?.data?.name?.[0] || "Failed to save.";
      showMsg(err, "error");
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
        [selectedCategory]: prev[selectedCategory].filter((t) => t.id !== id),
      }));
      showMsg("Deleted successfully!");
    } catch (e) {
      showMsg("Failed to delete.", "error");
    }
  };

  /* -------------------------------------------------- RENDER -------------------------------------------------- */
  if (loading) return <div><Loading /></div>;

  return (
    <div className="p-4 mx-auto bg-white rounded-lg shadow-md">
      {msg.text && (
        <div
          className={`mb-4 px-4 py-2 rounded border ${msg.type === "error"
              ? "bg-red-100 border-red-400 text-red-700"
              : "bg-green-100 border-green-400 text-green-700"
            }`}
        >
          {msg.text}
        </div>
      )}

      {/* ---------- ADD FORM ---------- */}
      <div className="p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Add New Type</h2>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Category radios */}
            <div className="flex flex-wrap gap-4">
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <label key={value} className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={value}
                    checked={selectedCategory === value}
                    onChange={onCategoryChange}
                    className="form-radio text-indigo-600"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
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
              disabled={saving || !watch("name")?.trim()}
              className="w-full md:w-auto"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </form>
        </FormProvider>
      </div>

      {/* ---------- LIST ---------- */}
      <div className="rounded-lg overflow-hidden shadow-md">
        <h3 className="bg-gray-50 px-4 py-2 text-sm font-semibold">
          {CATEGORY_LABEL[selectedCategory]} ({currentList.length})
        </h3>

        {currentList.length ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium">{item.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate" title={item.description}>
                    {item.description || "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      onClick={() => deleteItem(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-6 text-gray-500">
            No {CATEGORY_LABEL[selectedCategory].toLowerCase()} yet. Add one above!
          </p>
        )}
      </div>
    </div>
  );
};

export default SurveyTypes;