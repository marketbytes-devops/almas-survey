/* src/pages/Admin/Users.js */
import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiTrash2,
  FiEdit3,
  FiPlus,
  FiUser,
  FiMail,
  FiCheckCircle,
  FiXCircle,
  FiChevronUp,
  FiChevronDown,
  FiUsers
} from "react-icons/fi";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";
import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState(new Set());

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
      console.error("Failed to fetch roles:", error);
    }
  };

  const onCreateUser = async (data) => {
    setError("");
    setMessage("");
    if (!hasPermission("users", "add")) {
      setError("You do not have permission to create a user.");
      return;
    }
    setIsCreatingUser(true);
    try {
      const response = await apiClient.post("/auth/users/", {
        ...data,
        role_id: parseInt(data.role_id),
      });

      setUsers((prev) => [...prev, response.data]);
      resetCreateForm();
      setIsCreateModalOpen(false);
      setMessage("User created successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Failed to create user. Please check the details."
      );
      setTimeout(() => setError(""), 4000);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const onEditUser = async (data) => {
    setError("");
    setMessage("");
    if (!hasPermission("users", "edit")) {
      setError("You do not have permission to edit a user.");
      return;
    }
    setIsEditingUser(true);
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
      setIsEditingUser(false);
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

  const toggleUserExpand = (userId) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading || isLoadingPermissions) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="User Management"
        subtitle="Create and manage users and their roles"
        extra={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-50">
              <FiUsers className="text-[#4c7085]" />
              {users.length} Total Users
            </div>
            {hasPermission("users", "add") && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-[#4c7085] text-white px-4 py-2 rounded-xl hover:bg-[#6b8ca3] transition-all shadow-sm text-sm font-medium"
              >
                <FiPlus /> Create User
              </button>
            )}
          </div>
        }
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FiXCircle />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
              ×
            </button>
          </motion.div>
        )}
        {message && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FiCheckCircle />
              <span className="text-sm font-medium">{message}</span>
            </div>
            <button onClick={() => setMessage("")} className="text-green-400 hover:text-green-600">
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
          <FiSearch className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#4c7085]/10 focus:border-[#4c7085] transition-all outline-none"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUser className="text-gray-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">No users found</h3>
          <p className="text-gray-600 text-sm mt-1">
            {searchQuery ? "Try a different search term" : "Start by creating a new user"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">User Info</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium">
                          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.name || "Unnamed User"}</p>
                          <p className="text-xs text-gray-500">ID: #{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiMail className="w-4 h-4 text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">
                        {user.role?.name || "No Role"}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="w-9 h-9 flex items-center justify-center text-gray-600 bg-gray-50 hover:bg-gray-800 hover:text-white rounded-xl transition-all"
                          title="Edit User"
                        >
                          <FiEdit3 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="w-9 h-9 flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                          title="Delete User"
                        >
                          <FiTrash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Grid */}
          <div className="lg:hidden space-y-4">
            {filteredUsers.map((user) => {
              const isExpanded = expandedUsers.has(user.id);
              return (
                <div key={user.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleUserExpand(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm">{user.name || "Unnamed User"}</h4>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user.role?.name || "No Role"}</p>
                      </div>
                    </div>
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden bg-gray-50/50 border-t border-gray-50"
                      >
                        <div className="p-4 space-y-4">
                          <div>
                            <p className="text-[10px] uppercase font-medium text-gray-400 tracking-wider">Email Address</p>
                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                              <FiMail className="text-gray-400" /> {user.email}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="flex-1 bg-white border border-gray-200 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                            >
                              <FiEdit3 /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
      >
        <FormProvider {...createForm}>
          <form onSubmit={createForm.handleSubmit(onCreateUser)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Full Name"
                name="name"
                placeholder="John Doe"
                rules={{ required: "Name is required" }}
                disabled={isCreatingUser}
              />
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
                disabled={isCreatingUser}
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
                disabled={isCreatingUser}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                disabled={isCreatingUser}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#4c7085] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#6b8ca3] transition-all disabled:opacity-50"
                disabled={isCreatingUser}
              >
                {isCreatingUser ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User"
      >
        <FormProvider {...editForm}>
          <form onSubmit={editForm.handleSubmit(onEditUser)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Full Name"
                name="name"
                placeholder="John Doe"
                rules={{ required: "Name is required" }}
                disabled={isEditingUser}
              />
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
                disabled={isEditingUser}
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
                disabled={isEditingUser}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                disabled={isEditingUser}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#4c7085] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#6b8ca3] transition-all disabled:opacity-50"
                disabled={isEditingUser}
              >
                {isEditingUser ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </div>
  );
};

export default Users;