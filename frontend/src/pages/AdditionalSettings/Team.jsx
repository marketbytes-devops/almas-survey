import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Button from "../../components/Button"; 
import Input from "../../components/Input"; 
import Select from "../../components/Select/Select";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const methods = useForm({
    defaultValues: {
      name: "",
      email: "",
      hub: "",
      role: "",
      phone: "",
    },
  });

  const { handleSubmit, reset, watch } = methods;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsResponse, hubsResponse] = await Promise.all([
          apiClient.get("/teams/"),
          apiClient.get("/hubs/"),
        ]);
        setTeams(teamsResponse.data);
        setHubs(hubsResponse.data);
      } catch (err) {
        setError("Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    if (!data.name.trim() || !data.email.trim() || !data.hub) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: data.name,
        email: data.email,
        hub: data.hub,
        role: data.role || "",
        phone: data.phone || "",
      };
      
      const response = await apiClient.post("/teams/", payload);
      setTeams([...teams, response.data]);
      reset();
      setSuccess("Team member added successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to add team member. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!confirm("Are you sure you want to delete this team member?")) return;
    setError(null);
    try {
      await apiClient.delete(`/teams/${id}/`);
      setTeams(teams.filter((t) => t.id !== id));
      setSuccess("Team member deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete team member. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const filteredTeams = watch("hub") 
    ? teams.filter(team => team.hub === parseInt(watch("hub")))
    : teams;

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="space-y-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Add New Team Member</h2>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  name="name"
                  type="text"
                  rules={{ required: "Name is required" }}
                  disabled={saving}
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  rules={{ 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  }}
                  disabled={saving}
                />
                <Select
                  label="Hub"
                  name="hub"
                  options={hubs.map(hub => ({ value: hub.id, label: hub.name }))}
                  rules={{ required: "Hub is required" }}
                  disabled={saving}
                />
                <Input
                  label="Role"
                  name="role"
                  type="text"
                  disabled={saving}
                />
                <Input
                  label="Phone"
                  name="phone"
                  type="tel"
                  disabled={saving}
                />
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto"
              >
                {saving ? "Saving..." : "Add Team Member"}
              </Button>
            </form>
          </FormProvider>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900">
              Team Members ({filteredTeams.length})
            </h3>
            <div className="w-48">
              <Select
                name="filterHub"
                options={[
                  { value: "", label: "All Hubs" },
                  ...hubs.map(hub => ({ value: hub.id, label: hub.name }))
                ]}
                onChange={(e) => methods.setValue("hub", e.target.value)}
              />
            </div>
          </div>
          
          {filteredTeams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hub</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTeams.map((team) => (
                    <tr key={team.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{team.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{team.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{team.hub_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{team.role || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{team.phone || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => handleDeleteTeam(team.id)}
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              No team members found. {watch("hub") && "Try selecting a different hub or "} 
              add one above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Teams;