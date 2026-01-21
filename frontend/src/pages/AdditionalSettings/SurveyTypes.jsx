import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiSearch, FiCheck, FiX, FiInfo } from "react-icons/fi";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";
import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";

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
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [types, setTypes] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("customer");
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Feedback states
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const methods = useForm({ defaultValues: { name: "", description: "" } });
  const { handleSubmit, reset, setError: setFormError } = methods;

  useEffect(() => {
    if (!hasPermission("types", "view")) {
      navigate("/dashboard");
      return;
    }
    fetchAll();
  }, [hasPermission, navigate]);

  const fetchAll = async () => {
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

      const init = {};
      responses.forEach(({ cat, data }) => {
        init[cat] = data;
      });
      setTypes(init);
    } catch (e) {
      setError("Failed to load data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSearchQuery("");
    reset();
  };

  const onSubmit = async (data) => {
    if (!hasPermission("types", "add")) {
      setError("Permission denied");
      return;
    }
    if (!data.name?.trim()) return;

    setIsSubmitting(true);
    try {
      const endpoint = CATEGORY_ENDPOINT[selectedCategory];
      const resp = await apiClient.post(endpoint, {
        name: data.name.trim(),
        description: data.description?.trim() || "",
      });

      setTypes((prev) => ({
        ...prev,
        [selectedCategory]: [resp.data, ...(prev[selectedCategory] || [])],
      }));

      reset();
      setIsAddOpen(false);
      setMessage(`${CATEGORY_LABEL[selectedCategory].slice(0, -1)} added successfully`);
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      const fieldErrors = e.response?.data;
      if (fieldErrors?.name?.[0]) {
        setFormError("name", { type: "server", message: fieldErrors.name[0] });
      } else {
        setError(fieldErrors?.detail || "Failed to save. Please try again.");
        setTimeout(() => setError(null), 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (id) => {
    if (!hasPermission("types", "delete")) {
      setError("Permission denied");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const endpoint = CATEGORY_ENDPOINT[selectedCategory];
      await apiClient.delete(`${endpoint}${id}/`);

      setTypes((prev) => ({
        ...prev,
        [selectedCategory]: (prev[selectedCategory] || []).filter((t) => t.id !== id),
      }));

      setMessage("Deleted successfully");
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setError("Failed to delete item. It may be in use.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const currentList = types[selectedCategory] || [];
  const filteredList = currentList.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Settings & Configurations"
        subtitle="Manage system types, categories and dropdown options"
      />

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <FiX className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {message && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center justify-between">
            <span className="text-sm font-medium">{message}</span>
            <button onClick={() => setMessage(null)} className="text-green-400 hover:text-green-600">
              <FiX className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      <div className="overflow-x-auto pb-2 -mx-1 px-4 md:px-0 md:overflow-visible">
        <div className="flex gap-2 w-max md:w-full flex-wrap">
          {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border whitespace-nowrap ${selectedCategory === key
                ? "bg-[#4c7085] text-white border-[#4c7085] shadow-sm shadow-[#4c7085]/20"
                : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <FiSearch className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder={`Search ${CATEGORY_LABEL[selectedCategory]}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-style w-full !pl-12 h-[52px] rounded-2xl border-gray-100 shadow-sm"
        />
      </div>
      {hasPermission("types", "add") && (
        <button
          onClick={() => setIsAddOpen(true)}
          className="w-full btn-primary"
        >
          <FiPlus className="w-5 h-5" />
          <span className="text-sm tracking-wide">Add New Type</span>
        </button>
      )}
      {/* Content Area */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiInfo className="text-gray-300 w-7 h-7" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">No types found</h3>
          <p className="text-gray-600 text-sm mt-1">
            {searchQuery ? "Try adjusting your search query" : "Get started by adding a new type"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* Desktop Headers */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 rounded-xl border border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-widest">
            <div className="col-span-4">Name</div>
            <div className="col-span-7">Description</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          {/* List Items */}
          <div className="space-y-3">
            {filteredList.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key={item.id}
                className="group bg-white p-4 md:px-6 md:py-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] text-xs font-medium shrink-0">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{item.name}</span>
                    </div>
                  </div>
                  <div className="col-span-7">
                    <p className="text-sm text-gray-600 line-clamp-1 md:line-clamp-2">
                      {item.description || <span className="text-gray-400 italic">No description provided</span>}
                    </p>
                  </div>
                  <div className="col-span-1 flex justify-end md:justify-center">
                    {hasPermission("types", "delete") && (
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <Modal
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            title={`Add ${CATEGORY_LABEL[selectedCategory]?.slice(0, -1)}`}
          >
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="Name"
                  name="name"
                  placeholder="e.g. Regular, Express, etc."
                  rules={{ required: "Name is required" }}
                />

                <Input
                  label="Description"
                  name="description"
                  type="textarea"
                  placeholder="Optional details about this type..."
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="btn-secondary !bg-transparent !border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary px-8"
                  >
                    {isSubmitting ? <Loading size="sm" color="white" /> : "Save"}
                  </button>
                </div>
              </form>
            </FormProvider>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SurveyTypes;