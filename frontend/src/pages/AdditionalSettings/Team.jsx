import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Button from "../../components/Button";
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

  const { handleSubmit, reset } = methods;

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
      <div className="flex justify-center items-center min-h-screen"><Loading/></div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="text-lg sm:text-xl font-medium text-gray-800 mb-4">Add New Team Member</h2>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  name="name"
                  type="text"
                  rules={{ required: "Name is required" }}
                  disabled={saving}
                  placeholder="John Doe"
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
                    },
                  }}
                  disabled={saving}
                  placeholder="john@example.com"
                />
                <Input
                  label="Role"
                  name="role"
                  type="text"
                  disabled={saving}
                  placeholder="Sales Manager"
                />
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  disabled={saving}
                  placeholder="+971 50 123 4567"
                />
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Add Team Member"
                )}
              </Button>
            </form>
          </FormProvider>
        </div>

        {/* Team Members List */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Team Members ({teams.length})
            </h3>
          </div>

          {teams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teams.map((team) => (
                    <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {team.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {team.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {team.role || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {team.phone || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded transition"
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
            <div className="text-center py-10 text-gray-500">
              No team members added yet. Use the form above to add one!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Team;