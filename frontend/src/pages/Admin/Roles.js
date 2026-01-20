/* src/pages/AdditionalSettings/Roles.jsx */
import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";
import Loading from "../../components/Loading";
import { FaSearch, FaTrashAlt, FaEdit } from "react-icons/fa";

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editRole, setEditRole] = useState(null);

  const createForm = useForm({
    defaultValues: { name: "", description: "" },
  });

  const editForm = useForm({
    defaultValues: { name: "", description: "" },
  });

  const { handleSubmit: handleCreate, reset: resetCreate } = createForm;
  const { handleSubmit: handleEdit, reset: resetEdit } = editForm;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile/");
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");

        const roleId = user.role?.id;
        if (roleId) {
          const res = await apiClient.get(`/auth/roles/${roleId}/`);
          setPermissions(res.data.permissions || []);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        console.error("Unable to fetch user profile:", error);
        setPermissions([]);
        setIsSuperadmin(false);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchProfile();
    fetchRoles();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/auth/roles/");
      setRoles(response.data);
    } catch (error) {
      setError("Failed to fetch roles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateRole = async (data) => {
    setError("");
    setMessage("");
    if (!hasPermission("roles", "add")) {
      setError("You do not have permission to create a role.");
      return;
    }
    setIsCreating(true);
    try {
      const response = await apiClient.post("/auth/roles/", data);
      setRoles((prev) => [...prev, response.data]);
      resetCreate();
      setMessage("Role created successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Failed to create role. Please try again."
      );
      setTimeout(() => setError(""), 4000);
    } finally {
      setIsCreating(false);
    }
  };

  const onUpdateRole = async (data) => {
    setError("");
    setMessage("");
    if (!hasPermission("roles", "edit")) {
      setError("You do not have permission to edit a role.");
      return;
    }
    setIsEditing(true);
    try {
      const response = await apiClient.put(`/auth/roles/${editRole.id}/`, data);
      setRoles((prev) =>
        prev.map((role) => (role.id === editRole.id ? response.data : role))
      );
      setMessage("Role updated successfully");
      setEditRole(null);
      resetEdit();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Failed to update role. Please try again."
      );
      setTimeout(() => setError(""), 4000);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!hasPermission("roles", "delete")) {
      setError("You do not have permission to delete a role.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this role?")) return;

    try {
      await apiClient.delete(`/auth/roles/${id}/`);
      setRoles((prev) => prev.filter((role) => role.id !== id));
      setMessage("Role deleted successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setError("Failed to delete role. Please try again.");
      setTimeout(() => setError(""), 4000);
    }
  };

  const openEditModal = (role) => {
    if (!hasPermission("roles", "edit")) {
      setError("You do not have permission to edit a role.");
      return;
    }
    setEditRole(role);
    editForm.reset({
      name: role.name,
      description: role.description || "",
    });
  };

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || isLoadingPermissions) {
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
          <h1 className="text-xs sm:text-lg font-medium">Roles Management</h1>
          <p className="text-sm sm:text-base text-gray-200 mt-1">
            Create and manage user roles and permissions
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Messages */}
          {message && (
            <div className="p-4 bg-green-100 text-green-700 rounded-lg text-center font-medium border border-green-400">
              {message}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg text-center font-medium border border-red-400">
              {error}
            </div>
          )}

          {/* Create Role Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
            <FormProvider {...createForm}>
              <form onSubmit={handleCreate(onCreateRole)} className="space-y-6">
                <Input
                  label="Role Name"
                  name="name"
                  type="text"
                  placeholder="e.g. Sales Manager, Surveyor"
                  rules={{ required: "Role name is required" }}
                  disabled={isCreating}
                />

                <Input
                  label="Description (optional)"
                  name="description"
                  type="textarea"
                  rows={3}
                  placeholder="Describe the purpose of this role..."
                  disabled={isCreating}
                />

                <button
                  type="submit"
                  disabled={isCreating || !hasPermission("roles", "add")}
                  className={`w-full text-sm font-medium px-6 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${
                    isCreating || !hasPermission("roles", "add")
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white cursor-pointer"
                  }`}
                >
                  {isCreating ? "Creating..." : "Create Role"}
                </button>
              </form>
            </FormProvider>
          </div>

          {/* Roles List Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-4 sm:px-6 py-3">
              <h3 className="text-xs sm:text-lg font-medium">
                Existing Roles ({roles.length})
              </h3>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search roles by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#4c7085] focus:ring-4 focus:ring-[#4c7085]/20 outline-none transition text-sm sm:text-base"
                />
              </div>
            </div>

            {filteredRoles.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-300">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Role Name</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Description</th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredRoles.map((role) => (
                        <tr key={role.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                            {role.name}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                            {role.description || "—"}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center space-x-2">
                            <button
                              onClick={() => openEditModal(role)}
                              disabled={!hasPermission("roles", "edit")}
                              className={`text-sm font-medium px-4 py-2 rounded-lg transition ${
                                !hasPermission("roles", "edit")
                                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                  : "bg-[#4c7085] text-white hover:bg-[#6b8ca3]"
                              }`}
                            >
                              <FaEdit className="inline mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              disabled={!hasPermission("roles", "delete")}
                              className={`text-sm font-medium px-4 py-2 rounded-lg transition ${
                                !hasPermission("roles", "delete")
                                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                  : "bg-red-600 text-white hover:bg-red-700"
                              }`}
                            >
                              <FaTrashAlt className="inline mr-1" /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3 p-4">
                  {filteredRoles.map((role) => (
                    <div key={role.id} className="bg-gray-50 rounded-lg border border-gray-300 p-4">
                      <div className="flex justify-center items-center mb-3">
                        <h4 className="font-medium text-gray-900">{role.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 flex justify-center items-center mb-4">
                        {role.description || "No description"}
                      </p>
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => openEditModal(role)}
                          disabled={!hasPermission("roles", "edit")}
                          className={`flex-1 text-sm font-medium px-4 py-2 rounded-lg transition ${
                            !hasPermission("roles", "edit")
                              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                              : "bg-[#4c7085] text-white hover:bg-[#6b8ca3]"
                          }`}
                        >
                          <FaEdit className="inline mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={!hasPermission("roles", "delete")}
                          className={`flex-1 text-sm font-medium px-4 py-2 rounded-lg transition ${
                            !hasPermission("roles", "delete")
                              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          <FaTrashAlt className="inline mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-base sm:text-lg mb-2">
                  {searchQuery ? "No matching roles found." : "No roles available."}
                </p>
                <p className="text-sm">Create your first role using the form above!</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Role Modal */}
        {editRole && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 sm:p-8 max-w-md w-full">
              <h3 className="text-xs sm:text-lg font-medium mb-6">Edit Role</h3>

              <FormProvider {...editForm}>
                <form onSubmit={handleEdit(onUpdateRole)} className="space-y-6">
                  <Input
                    label="Role Name"
                    name="name"
                    type="text"
                    placeholder="e.g. Sales Manager"
                    rules={{ required: "Role name is required" }}
                    disabled={isEditing}
                  />

                  <Input
                    label="Description (optional)"
                    name="description"
                    type="textarea"
                    rows={3}
                    placeholder="Describe the purpose of this role..."
                    disabled={isEditing}
                  />

                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setEditRole(null)}
                      className="w-full sm:w-auto text-sm font-medium px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEditing || !hasPermission("roles", "edit")}
                      className={`w-full sm:w-auto text-sm font-medium px-6 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${
                        isEditing || !hasPermission("roles", "edit")
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white cursor-pointer"
                      }`}
                    >
                      {isEditing ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </FormProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roles;