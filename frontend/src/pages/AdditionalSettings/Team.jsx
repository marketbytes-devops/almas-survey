/* src/pages/AdditionalSettings/Team.jsx */
import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";
import Loading from "../../components/Loading";

const Team = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const methods = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "",
      phone: "",
    },
  });

  const { handleSubmit, reset, watch } = methods;
  const watchedName = watch("name");
  const watchedEmail = watch("email");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await apiClient.get("/teams/");
        setTeams(response.data);
      } catch (err) {
        setError("Failed to fetch team members. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const onSubmit = async (data) => {
    if (!data.name.trim() || !data.email.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        role: data.role?.trim() || null,
        phone: data.phone?.trim() || null,
      };

      const response = await apiClient.post("/teams/", payload);
      setTeams((prev) => [...prev, response.data]);
      reset();
      setSuccess("Team member added successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const msg =
        err.response?.data?.email?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        "Failed to add team member. Please check the details.";
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team member?")) return;

    setError(null);
    try {
      await apiClient.delete(`/teams/${id}/`);
      setTeams((prev) => prev.filter((t) => t.id !== id));
      setSuccess("Team member deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete team member.");
      setTimeout(() => setError(null), 4000);
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
          <h1 className="text-xs sm:text-lg font-medium">Team Management</h1>
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

          {/* Add New Team Member Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Name *"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    rules={{ required: "Name is required" }}
                    disabled={saving}
                  />
                  <Input
                    label="Email *"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    rules={{
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    }}
                    disabled={saving}
                  />
                  <Input
                    label="Role"
                    name="role"
                    type="text"
                    placeholder="Sales Manager"
                    disabled={saving}
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    type="tel"
                    placeholder="+971 50 123 4567"
                    disabled={saving}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || !watchedName?.trim() || !watchedEmail?.trim()}
                  className={`w-full text-sm font-medium px-6 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${saving || !watchedName?.trim() || !watchedEmail?.trim()
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:scale-105"
                    }`}
                >
                  {saving ? "Saving..." : "Add Team Member"}
                </button>
              </form>
            </FormProvider>
          </div>

          {/* Team Members List Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-4 sm:px-6 py-3">
              <h3 className="text-xs sm:text-lg font-medium">
                Team Members ({teams.length})
              </h3>
            </div>

            {teams.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-300">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Name</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Email</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Role</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Phone</th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {teams.map((team) => (
                        <tr key={team.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                            {team.name || "—"}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">{team.email || "—"}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">{team.role || "—"}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">{team.phone || "—"}</td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
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
                  {teams.map((team) => (
                    <div key={team.id} className="bg-gray-50 rounded-lg border border-gray-300 p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900">{team.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><strong>Email:</strong> {team.email || "—"}</p>
                          <p><strong>Role:</strong> {team.role || "—"}</p>
                          <p><strong>Phone:</strong> {team.phone || "—"}</p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
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
              <div className="text-center py-12 text-gray-600">
                <p className="text-base sm:text-lg mb-2">No team members added yet.</p>
                <p className="text-sm">Use the form above to add one!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Team;