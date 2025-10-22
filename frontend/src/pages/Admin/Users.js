import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTrashAlt, FaEdit } from "react-icons/fa";
import { FormProvider, useForm } from "react-hook-form";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import Loading from "../../components/Loading";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const createForm = useForm({
    defaultValues: {
      email: "",
      name: "",
      role_id: "",
    },
  });

  const editForm = useForm({
    defaultValues: {
      email: "",
      name: "",
      role_id: "",
    },
  });

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
      setUsers([...users, response.data]);
      setMessage("User created successfully");
      createForm.reset();
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Failed to create user. Please try again."
      );
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
      setUsers(
        users.map((user) => (user.id === editUser.id ? response.data : user))
      );
      setMessage("User updated successfully");
      setEditUser(null);
      editForm.reset();
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Failed to update user. Please try again."
      );
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!hasPermission("users", "delete")) {
      setError("You do not have permission to delete a user.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await apiClient.delete(`/auth/users/${id}/`);
        setUsers(users.filter((user) => user.id !== id));
        setMessage("User deleted successfully");
      } catch (error) {
        setError("Failed to delete user. Please try again.");
      }
    }
  };

  const openEditModal = (user) => {
    if (!hasPermission("users", "edit")) {
      setError("You do not have permission to edit a user.");
      return;
    }
    setEditUser({
      id: user.id,
      email: user.email,
      name: user.name,
      role_id: user.role?.id || "",
    });
    editForm.reset({
      email: user.email,
      name: user.name,
      role_id: user.role?.id || "",
    });
  };

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || isLoadingPermissions) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <p className="text-gray-600 mb-8">
        Create and manage users and their roles.
      </p>
      {error && (
        <motion.div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}
      {message && (
        <motion.div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {message}
        </motion.div>
      )}
      <div className="grid grid-cols-1 gap-8">
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold mb-4">Create User</h3>
          <FormProvider {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onCreateUser)}
              className="space-y-4"
            >
              <Input
                type="email"
                label="Email address"
                name="email"
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
                type="text"
                label="Name"
                name="name"
                rules={{ required: "Name is required" }}
                disabled={isCreating}
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
                disabled={isCreating}
              />
              <Button
                type="submit"
                disabled={isCreating || !hasPermission("users", "add")}
                className={`w-full p-3 rounded-lg transition duration-300 ${
                  isCreating || !hasPermission("users", "add")
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-500 text-white hover:bg-indigo-600"
                }`}
              >
                {isCreating ? "Creating..." : "Create User"}
              </Button>
            </form>
          </FormProvider>
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl shadow-xl p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-semibold mb-4">Existing Users</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 items-center mb-4 gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 text-sm pr-4 py-1.5  border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery("")}
                className="p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Clear Search
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {user.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {user.role?.name || "-"}
                      </td>
                      <td className="flex px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => openEditModal(user)}
                          disabled={!hasPermission("users", "edit")}
                          className={`flex items-center justify-center px-3 py-1 text-xs rounded mr-2 transition duration-300 ${
                            hasPermission("users", "edit")
                              ? "bg-blue-500 text-white hover:bg-blue-600"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          <FaEdit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={!hasPermission("users", "delete")}
                          className={`flex items-center justify-center px-3 py-1 text-xs rounded transition duration-300 ${
                            hasPermission("users", "delete")
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          <FaTrashAlt className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {searchQuery
                        ? "No users match the search."
                        : "No users found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {editUser && (
          <Modal
            isOpen={!!editUser}
            onClose={() => setEditUser(null)}
            title="Edit User"
          >
            <FormProvider {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onEditUser)}
                className="space-y-4"
              >
                <Input
                  type="email"
                  label="Email address"
                  name="email"
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
                  type="text"
                  label="Name"
                  name="name"
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
                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    onClick={() => setEditUser(null)}
                    className="p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isEditing || !hasPermission("users", "edit")}
                    className={`p-3 rounded-lg transition duration-300 ${
                      isEditing || !hasPermission("users", "edit")
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-indigo-500 text-white hover:bg-indigo-600"
                    }`}
                  >
                    {isEditing ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Users;
