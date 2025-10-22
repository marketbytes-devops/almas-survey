import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaTrashAlt } from "react-icons/fa";
import { FormProvider, useForm } from "react-hook-form";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const createForm = useForm({
    defaultValues: {
      name: "",
      description: "",
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
      setRoles([...roles, response.data]);
      setMessage("Role created successfully");
      createForm.reset();
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Failed to create role. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!hasPermission("roles", "delete")) {
      setError("You do not have permission to delete a role.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this role?")) {
      try {
        await apiClient.delete(`/auth/roles/${id}/`);
        setRoles(roles.filter((role) => role.id !== id));
        setMessage("Role deleted successfully");
      } catch (error) {
        setError("Failed to delete role. Please try again.");
      }
    }
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
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold mb-6">Roles Management</h1>
      <p className="text-gray-600 mb-8">Create and manage roles for users.</p>
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
          <h3 className="text-xl font-semibold mb-4">Create Role</h3>
          <FormProvider {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onCreateRole)}
              className="space-y-4"
            >
              <Input
                type="text"
                label="Role Name"
                name="name"
                rules={{ required: "Role name is required" }}
                disabled={isCreating}
              />
              <Input
                type="textarea"
                label="Description"
                name="description"
                rules={{ required: false }}
                disabled={isCreating}
              />
              <Button
                type="submit"
                disabled={isCreating || !hasPermission("roles", "add")}
                className={`w-full p-3 rounded-lg transition duration-300 ${
                  isCreating || !hasPermission("roles", "add")
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-500 text-white hover:bg-indigo-600"
                }`}
              >
                {isCreating ? "Creating..." : "Create Role"}
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
          <h3 className="text-xl font-semibold mb-4">Existing Roles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 items-center mb-4 gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by role name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 text-sm pr-4 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    Role Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoles.length > 0 ? (
                  filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {role.name}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate"
                        title={role.description || "No description"}
                      >
                        {role.description || "No description"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={!hasPermission("roles", "delete")}
                          className={`flex items-center justify-center px-3 py-1 text-xs rounded transition duration-300 ${
                            hasPermission("roles", "delete")
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
                      colSpan="3"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {searchQuery
                        ? "No roles match the search."
                        : "No roles found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Roles;
