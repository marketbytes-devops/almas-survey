/* src/pages/AdditionalSettings/Units.jsx */
import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { FiPlus, FiTrash2, FiSearch, FiX, FiInfo } from "react-icons/fi";
import apiClient from "../../api/apiClient";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Loading from "../../components/Loading";

const Units = () => {
  const [volumeUnits, setVolumeUnits] = useState([]);
  const [weightUnits, setWeightUnits] = useState([]);
  const [category, setCategory] = useState("volume");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const methods = useForm({
    defaultValues: { name: "", description: "" },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const [volumeRes, weightRes] = await Promise.all([
        apiClient.get("/volume-units/"),
        apiClient.get("/weight-units/"),
      ]);
      setVolumeUnits(volumeRes.data);
      setWeightUnits(weightRes.data);
    } catch (err) {
      setError("Failed to fetch units.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    setError(null);
    try {
      const endpoint = category === "volume" ? "/volume-units/" : "/weight-units/";
      const response = await apiClient.post(endpoint, data);

      if (category === "volume") {
        setVolumeUnits([response.data, ...volumeUnits]);
      } else {
        setWeightUnits([response.data, ...weightUnits]);
      }

      setSuccess("Unit added successfully!");
      setIsAddModalOpen(false);
      reset();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to add unit. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return;
    try {
      const endpoint = category === "volume" ? `/volume-units/${id}/` : `/weight-units/${id}/`;
      await apiClient.delete(endpoint);

      if (category === "volume") {
        setVolumeUnits(volumeUnits.filter((u) => u.id !== id));
      } else {
        setWeightUnits(weightUnits.filter((u) => u.id !== id));
      }

      setSuccess("Unit deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete unit.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const currentUnits = category === "volume" ? volumeUnits : weightUnits;
  const filteredUnits = currentUnits.filter((unit) =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [
    { id: "volume", label: "Volume Units" },
    { id: "weight", label: "Weight Units" },
  ];

  if (loading) return <div className="flex justify-center items-center min-h-[500px]"><Loading /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader title="Units" subtitle="Manage volume and weight measurement units" />

      <div className="space-y-6">
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center">
                <FiInfo className="mr-2" />
                <span className="text-sm font-medium">{success}</span>
              </div>
              <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">
                <FiX className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center">
                <FiInfo className="mr-2" />
                <span className="text-sm font-medium">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                <FiX className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <div className="overflow-x-auto pb-2 -mx-1 px-4 md:px-0 md:overflow-visible">
          <div className="flex gap-2 w-max md:w-full flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setSearchTerm(""); }}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border whitespace-nowrap ${category === cat.id
                  ? "bg-[#4c7085] text-white border-[#4c7085] shadow-sm shadow-[#4c7085]/20"
                  : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                  }`}
              >
                {cat.label}
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
            placeholder={`Search ${category} units...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-style w-full !pl-12 h-[52px] rounded-2xl border-gray-100 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full btn-primary"
        >
          <FiPlus className="w-5 h-5" />
          <span className="text-sm tracking-wide">Add New {category === 'volume' ? 'Volume' : 'Weight'} Unit</span>
        </button>

        {/* Content Area */}
        {filteredUnits.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiInfo className="text-gray-300 w-7 h-7" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">No units found</h3>
            <p className="text-gray-600 text-sm mt-1">
              {searchTerm ? "Try adjusting your search query" : `Get started by adding a new ${category} unit`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {/* Desktop Headers */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 rounded-xl border border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-widest">
              <div className="col-span-4">Unit Name</div>
              <div className="col-span-7">Description</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {/* List Items */}
            <div className="space-y-3">
              {filteredUnits.map((item) => (
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
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add New ${category === 'volume' ? 'Volume' : 'Weight'} Unit`}
      >
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Unit Name"
              name="name"
              rules={{ required: "Name is required" }}
              placeholder="e.g. CBM"
            />
            <Input
              label="Description"
              name="description"
              type="textarea"
              placeholder="Optional description..."
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="btn-secondary !bg-transparent !border-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-8"
              >
                {saving ? <Loading size="sm" color="white" /> : "Save"}
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};

export default Units;