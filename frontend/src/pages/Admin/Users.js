/* src/pages/AdditionalSettings/Users.jsx */
import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";
import Loading from "../../components/Loading";
import { FaSearch, FaTrashAlt, FaEdit, FaCog } from "react-icons/fa";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext"; // ← For refreshPermissions

const Users = () => {
  const { refreshPermissions } = usePermissions(); // ← From context

  const [users, setUsers] = useState([]);
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
  const [editUser, setEditUser] = useState(null);

  // User Overrides Modal
  const [selectedUserForOverrides, setSelectedUserForOverrides] = useState(null);
  const [userOverrides, setUserOverrides] = useState({});
  const [isOverridesLoading, setIsOverridesLoading] = useState(false);
  const [isSavingOverride, setIsSavingOverride] = useState(false);

  const createForm = useForm({
    defaultValues: { email: "", name: "", role_id: "" },
  });

  const editForm = useForm({
    defaultValues: { email: "", name: "", role_id: "" },
  });

  const { reset: resetCreateForm } = createForm;
  const { reset: resetEditForm } = editForm;

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
    fetchUsers();
    fetchRoles();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/auth/users/");
      setUsers(response.data);
    } catch (error) {
      setError("Failed to fetch users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await apiClient.get("/auth/roles/");
      setRoles(response.data);
    } catch (error) {
      setError("Failed to fetch roles. Please try again.");
    }
  };

  const onCreateUser = async (data) => {
    setError("");
    setMessage("");
    if (!hasPermission("users", "add")) {
      setError("You do not have permission to create a user.");
      return;
    }
    setIsCreating(true);
    try {
      const response = await apiClient.post("/auth/users/", {
        ...data,
        role_id: parseInt(data.role_id),
      });

      // Append new user without full refresh
      setUsers((prev) => [...prev, response.data]);

      resetCreateForm();
      setMessage("User created successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Failed to create user. Please check the details."
      );
      setTimeout(() => setError(""), 4000);
    } finally {
      setIsCreating(false);
    }
  };

  const onEditUser = async (data) => {
    setError("");
    setMessage("");
    if (!hasPermission("users", "edit")) {
      setError("You do not have permission to edit a user.");
      return;
    }
    setIsEditing(true);
    try {
      const response = await apiClient.put(`/auth/users/${editUser.id}/`, {
        ...data,
        role_id: parseInt(data.role_id),
      });
      setUsers((prev) =>
        prev.map((user) => (user.id === editUser.id ? response.data : user))
      );
      setMessage("User updated successfully");
      setEditUser(null);
      resetEditForm();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Failed to update user. Please try again."
      );
      setTimeout(() => setError(""), 4000);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!hasPermission("users", "delete")) {
      setError("You do not have permission to delete a user.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await apiClient.delete(`/auth/users/${id}/`);
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setMessage("User deleted successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setError("Failed to delete user. Please try again.");
      setTimeout(() => setError(""), 4000);
    }
  };

  const openEditModal = (user) => {
    if (!hasPermission("users", "edit")) {
      setError("You do not have permission to edit a user.");
      return;
    }
    setEditUser(user);
    editForm.reset({
      email: user.email,
      name: user.name || "",
      role_id: user.role?.id || "",
    });
  };

  // ── Manage User Permission Overrides ───────────────────────────────────────────

  const openOverridesModal = async (user) => {
    if (!hasPermission("users", "edit")) {
      setError("You do not have permission to manage user permissions.");
      return;
    }

    setSelectedUserForOverrides(user);
    setError("");
    setMessage("");
    setIsOverridesLoading(true);

    try {
      const response = await apiClient.get(`/auth/users/${user.id}/permissions/`);
      const existingOverrides = response.data || [];

      const overridesMap = {};

      // List of ALL known pages (so table always shows everything)
      const allPages = [
        "Dashboard", "Profile", "enquiries", "new_enquiries", "scheduled_surveys",
        "survey_summary", "quotation", "booking", "inventory", "pricing",
        "local_move", "international_move", "types", "units", "currency", "tax",
        "handyman", "manpower", "room", "additional-services", "labours", "materials",
        "users", "roles", "permissions"
      ];

      // Initialize all pages with default false
      allPages.forEach((page) => {
        overridesMap[page] = {
          id: null,
          view: false,
          add: false,
          edit: false,
          delete: false,
        };
      });

      // Apply existing overrides from backend
      existingOverrides.forEach((p) => {
        if (overridesMap[p.page]) {
          overridesMap[p.page] = {
            id: p.id,
            view: p.can_view,
            add: p.can_add,
            edit: p.can_edit,
            delete: p.can_delete,
          };
        }
      });

      setUserOverrides(overridesMap);
    } catch (err) {
      setError("Failed to load user overrides.");
      console.error(err);
    } finally {
      setIsOverridesLoading(false);
    }
  };

  const handleOverrideChange = (page, action) => {
    setUserOverrides((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [action]: !prev[page]?.[action],
      },
    }));
  };

  const handleDeleteOverride = async (page) => {
    if (!window.confirm(`Delete override for "${page}"?`)) return;

    const override = userOverrides[page];
    if (!override?.id) return; // No override to delete

    try {
      await apiClient.delete(
        `/auth/users/${selectedUserForOverrides.id}/permissions/${override.id}/`
      );

      // Remove from local state
      setUserOverrides((prev) => {
        const updated = { ...prev };
        updated[page] = {
          id: null,
          view: false,
          add: false,
          edit: false,
          delete: false,
        };
        return updated;
      });

      setMessage(`Override deleted for ${page}`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete override.");
      console.error(err);
    }
  };

  const saveUserOverrides = async () => {
    if (!hasPermission("users", "edit")) return;

    setIsSavingOverride(true);
    setError("");
    setMessage("");

    try {
      const promises = Object.entries(userOverrides).map(async ([page, perm]) => {
        const payload = {
          page,
          can_view: perm.view || false,
          can_add: perm.add || false,
          can_edit: perm.edit || false,
          can_delete: perm.delete || false,
        };

        if (perm.id) {
          // Update existing
          return apiClient.put(
            `/auth/users/${selectedUserForOverrides.id}/permissions/${perm.id}/`,
            payload
          );
        } else if (perm.view || perm.add || perm.edit || perm.delete) {
          // Create new only if changed from default
          return apiClient.post(
            `/auth/users/${selectedUserForOverrides.id}/permissions/`,
            payload
          );
        }
      }).filter(Boolean);

      await Promise.all(promises);

      // Refresh global permissions → Sidebar updates immediately
      await refreshPermissions();

      setMessage(`Overrides updated for ${selectedUserForOverrides.name || selectedUserForOverrides.email}`);
      setTimeout(() => {
        setSelectedUserForOverrides(null);
        setMessage("");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Failed to save overrides.");
    } finally {
      setIsSavingOverride(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-xs sm:text-lg font-medium">User Management</h1>
          <p className="text-sm sm:text-base text-gray-200 mt-1">
            Create and manage users and their roles
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

          {/* Create User Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
            <FormProvider {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateUser)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    rules={{
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email",
                      },
                    }}
                    disabled={isCreating}
                  />
                  <Input
                    label="Full Name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    rules={{ required: "Name is required" }}
                    disabled={isCreating}
                  />
                </div>

                <Input
                  label="User Role"
                  name="role_id"
                  type="select"
                  options={[
                    { value: "", label: "Select Role" },
                    ...roles.map((role) => ({
                      value: role.id,
                      label: role.name,
                    })),
                  ]}
                  rules={{ required: "Role is required" }}
                  disabled={isCreating}
                />

                <button
                  type="submit"
                  disabled={isCreating || !hasPermission("users", "add")}
                  className={`w-full text-sm font-medium px-6 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${
                    isCreating || !hasPermission("users", "add")
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white cursor-pointer"
                  }`}
                >
                  {isCreating ? "Creating..." : "Create User"}
                </button>
              </form>
            </FormProvider>
          </div>

          {/* Users List Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-4 sm:px-6 py-3">
              <h3 className="text-xs sm:text-lg font-medium">
                Users ({users.length})
              </h3>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#4c7085] focus:ring-4 focus:ring-[#4c7085]/20 outline-none transition text-sm sm:text-base"
                />
              </div>
            </div>

            {filteredUsers.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-300">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Email</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Name</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Role</th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{user.email}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">{user.name || "—"}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                            {user.role?.name || "—"}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center space-x-2">
                            <button
                              onClick={() => openEditModal(user)}
                              disabled={!hasPermission("users", "edit")}
                              className={`text-sm font-medium px-4 py-2 rounded-lg transition ${
                                !hasPermission("users", "edit")
                                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                  : "bg-[#4c7085] text-white hover:bg-[#6b8ca3]"
                              }`}
                            >
                              <FaEdit className="inline mr-1" /> Edit
                            </button>
                            <button
                              onClick={() => openOverridesModal(user)}
                              disabled={!hasPermission("users", "edit")}
                              className={`text-sm font-medium px-4 py-2 rounded-lg transition ${
                                !hasPermission("users", "edit")
                                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                  : "bg-purple-600 text-white hover:bg-purple-700"
                              }`}
                            >
                              <FaCog className="inline mr-1" /> Overrides
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={!hasPermission("users", "delete")}
                              className={`text-sm font-medium px-4 py-2 rounded-lg transition ${
                                !hasPermission("users", "delete")
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
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-gray-50 rounded-lg border border-gray-300 p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900">{user.name || "—"}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><strong>Email:</strong> {user.email}</p>
                          <p><strong>Role:</strong> {user.role?.name || "—"}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          onClick={() => openEditModal(user)}
                          disabled={!hasPermission("users", "edit")}
                          className={`flex-1 text-sm font-medium px-4 py-2 rounded-lg transition ${
                            !hasPermission("users", "edit")
                              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                              : "bg-[#4c7085] text-white hover:bg-[#6b8ca3]"
                          }`}
                        >
                          <FaEdit className="inline mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => openOverridesModal(user)}
                          disabled={!hasPermission("users", "edit")}
                          className={`flex-1 text-sm font-medium px-4 py-2 rounded-lg transition ${
                            !hasPermission("users", "edit")
                              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                              : "bg-purple-600 text-white hover:bg-purple-700"
                          }`}
                        >
                          <FaCog className="inline mr-1" /> Overrides
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={!hasPermission("users", "delete")}
                          className={`flex-1 text-sm font-medium px-4 py-2 rounded-lg transition ${
                            !hasPermission("users", "delete")
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
                  {searchQuery ? "No users match your search." : "No users found."}
                </p>
                <p className="text-sm">Create your first user using the form above!</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit User Modal */}
        {editUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 sm:p-8 max-w-md w-full">
              <h3 className="text-xs sm:text-lg font-medium mb-6">Edit User</h3>

              <FormProvider {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditUser)} className="space-y-6">
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    rules={{
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email",
                      },
                    }}
                    disabled={isEditing}
                  />
                  <Input
                    label="Full Name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    rules={{ required: "Name is required" }}
                    disabled={isEditing}
                  />
                  <Input
                    label="User Role"
                    name="role_id"
                    type="select"
                    options={[
                      { value: "", label: "Select Role" },
                      ...roles.map((role) => ({
                        value: role.id,
                        label: role.name,
                      })),
                    ]}
                    rules={{ required: "Role is required" }}
                    disabled={isEditing}
                  />

                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setEditUser(null)}
                      className="w-full sm:w-auto text-sm font-medium px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEditing || !hasPermission("users", "edit")}
                      className={`w-full sm:w-auto text-sm font-medium px-6 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${
                        isEditing || !hasPermission("users", "edit")
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

        {/* User Overrides Modal */}
        {selectedUserForOverrides && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 sm:p-8 max-w-5xl w-full my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Permission Overrides for: {selectedUserForOverrides.name || selectedUserForOverrides.email}
                </h3>
                <button
                  onClick={() => setSelectedUserForOverrides(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {isOverridesLoading ? (
                <div className="flex justify-center py-10">
                  <Loading />
                </div>
              ) : (
                <>
                  {/* Overrides Table */}
                  <div className="overflow-x-auto max-h-[60vh] border border-gray-200 rounded-lg shadow-sm">
                    <table className="w-full min-w-max">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Module</th>
                          <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">View</th>
                          <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">Add</th>
                          <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">Edit</th>
                          <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">Delete</th>
                          <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Object.keys(userOverrides)
                          .sort()
                          .map((page) => (
                            <tr key={page} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {page.charAt(0).toUpperCase() + page.slice(1).replace("-", " ")}
                              </td>
                              {["view", "add", "edit", "delete"].map((action) => (
                                <td key={action} className="px-4 py-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={userOverrides[page]?.[action] || false}
                                    onChange={() => handleOverrideChange(page, action)}
                                    disabled={isSavingOverride}
                                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                                  />
                                </td>
                              ))}
                              <td className="px-4 py-4 text-center">
                                {userOverrides[page]?.id && (
                                  <button
                                    onClick={() => handleDeleteOverride(page)}
                                    disabled={isSavingOverride}
                                    className="text-red-600 hover:text-red-800 transition"
                                  >
                                    <FaTrashAlt className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
                    <button
                      onClick={() => setSelectedUserForOverrides(null)}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveUserOverrides}
                      disabled={isSavingOverride}
                      className={`px-6 py-2.5 rounded-lg font-medium shadow transition flex items-center gap-2 ${
                        isSavingOverride
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:opacity-90"
                      }`}
                    >
                      {isSavingOverride ? "Saving..." : "Save Overrides"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;