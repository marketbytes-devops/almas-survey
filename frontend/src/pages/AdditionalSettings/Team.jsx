/* src/pages/AdditionalSettings/Team.jsx */
import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { FiPlus, FiTrash2, FiSearch, FiX, FiInfo } from "react-icons/fi";
import apiClient from "../../api/apiClient";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import Input from "../../components/Input";
import Loading from "../../components/Loading";

const Team = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const methods = useForm({
    defaultValues: { name: "", email: "", role: "", phone: "" },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await apiClient.get("/teams/");
      setTeams(response.data);
    } catch (err) {
      setError("Failed to fetch team members.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    setError(null);
    try {
      const response = await apiClient.post("/teams/", data);
      setTeams([...teams, response.data]);
      setSuccess("Team member added successfully!");
      setIsAddModalOpen(false);
      reset();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg =
        err.response?.data?.email?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        "Failed to add team member. Please check the details.";
      setError(msg);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team member?")) return;
    try {
      await apiClient.delete(`/teams/${id}/`);
      setTeams(teams.filter((t) => t.id !== id));
      setSuccess("Team member deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete team member.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const filteredTeams = teams.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50">
      <PageHeader title="Team Members" subtitle="Manage your team and their roles" />

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center shadow-sm"
          >
            <FiInfo className="mr-2" /> {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center shadow-sm"
          >
            <FiInfo className="mr-2" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#4c7085] transition-all duration-200">
          <FiSearch className="text-slate-400 text-lg mr-3" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600">
              <FiX />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full mt-4 bg-[#4c7085] hover:bg-[#3a5d72] text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-medium shadow-sm hover:shadow active:scale-[0.99]"
        >
          <FiPlus className="text-lg" /> Add New Team Member
        </button>
      </div>

      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTeams.length > 0 ? (
              filteredTeams.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{member.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{member.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{member.role || "—"}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{member.phone || "—"}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete"
                    >
                      <FiTrash2 className="text-lg" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-slate-100 p-4 rounded-full mb-3">
                      <FiSearch className="text-2xl text-slate-400" />
                    </div>
                    <p>No team members found matching your search.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden grid grid-cols-1 gap-4">
        {filteredTeams.map((member) => (
          <div key={member.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-slate-800">{member.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
              </div>
              <button
                onClick={() => handleDelete(member.id)}
                className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
              >
                <FiTrash2 className="text-lg" />
              </button>
            </div>
            <div className="flex flex-col gap-1 mt-2 text-sm text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <span>{member.role || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span>{member.phone || "—"}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredTeams.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>No team members found.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Team Member"
      >
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Name"
              name="name"
              rules={{ required: "Name is required" }}
              placeholder="e.g. John Doe"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                }
              }}
              placeholder="e.g. john@example.com"
            />
            <Input
              label="Role"
              name="role"
              placeholder="e.g. Sales Manager"
            />
            <Input
              label="Phone"
              name="phone"
              type="tel"
              placeholder="e.g. +971 50 123 4567"
            />

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-[#4c7085] text-white font-medium rounded-xl hover:bg-[#3a5d72] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {saving ? "Saving..." : "Add Member"}
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};

export default Team;