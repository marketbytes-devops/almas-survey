import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCog } from "react-icons/fa";
import { FormProvider, useForm } from "react-hook-form";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import Loading from "../../components/Loading";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";

const Permissions = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissionsData, setPermissionsData] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const permissionsForm = useForm({
    defaultValues: {},
  });

  const pageNameMap = {
    // User Dashboard and Profile
    Dashboard: { apiName: "Dashboard", displayName: "Dashboard" },
    Profile: { apiName: "Profile", displayName: "Profile" },

    // Enquiry Related Pages
    enquiries: { apiName: "enquiries", displayName: "Enquiries" },
    processing_enquiries: {
      apiName: "processing_enquiries",
      displayName: "Processing Enquiries",
    },
    follow_ups: { apiName: "follow_ups", displayName: "Follow Ups" },
    scheduled_surveys: {
      apiName: "scheduled_surveys",
      displayName: "Scheduled Surveys",
    },
    new_enquiries: { apiName: "new_enquiries", displayName: "New Enquiries" },

    // Start Survey Related Pages
    survey_service_details: {
      apiName: "survey_service_details",
      displayName: "Survey Details",
    },
    survey_summary: {
      apiName: "survey_summary",
      displayName: "Survey Summary",
    },
    local_move: { apiName: "local_move", displayName: "Local Move" },
    international_move: {
      apiName: "international_move",
      displayName: "International Move",
    },

    // Additional Settings Pages
    types: { apiName: "types", displayName: "Types" },
    units: { apiName: "units", displayName: "Units" },
    currency: { apiName: "currency", displayName: "Currency" },
    tax: { apiName: "tax", displayName: "Tax" },
    handyman: { apiName: "handyman", displayName: "Handyman" },
    manpower: { apiName: "manpower", displayName: "Manpower" },
    room: { apiName: "room", displayName: "Room" },

    // User Role Pages
    users: { apiName: "users", displayName: "Users" },
    roles: { apiName: "roles", displayName: "Roles" },
    permissions: { apiName: "permissions", displayName: "Permissions" },
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile/");
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");
        const roleId = user.role?.id;
        if (roleId) {
          const res = await apiClient.get(`/auth/roles/${roleId}/`);
          setPermissionsData(res.data.permissions || []);
        } else {
          setPermissionsData([]);
        }
      } catch (error) {
        console.error("Unable to fetch user profile:", error);
        setPermissionsData([]);
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
    const perm = permissionsData.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const fetchRoles = async () => {
    try {
      const response = await apiClient.get("/auth/roles/");
      setRoles(response.data);
    } catch (error) {
      setError("Failed to fetch roles. Please try again.");
    }
  };

  // Select All Handler - toggles ALL permissions for ALL pages
  const handleSelectAll = () => {
    setPermissions((prev) => {
      const allSelected = Object.values(prev).every(
        (page) => page.view && page.add && page.edit && page.delete
      );

      return Object.keys(prev).reduce((acc, page) => {
        acc[page] = {
          ...prev[page],
          view: !allSelected,
          add: !allSelected,
          edit: !allSelected,
          delete: !allSelected,
        };
        return acc;
      }, {});
    });
  };

  // Check if all permissions are selected
  const isAllSelected = () => {
    return Object.values(permissions).every(
      (page) => page.view && page.add && page.edit && page.delete
    );
  };

  const openPermissionsModal = async (role) => {
    if (!hasPermission("permissions", "edit")) {
      setError("You do not have permission to edit permissions.");
      return;
    }
    setSelectedRole(role);
    try {
      const response = await apiClient.get(`/auth/roles/${role.id}/`);
      const rolePermissions = response.data.permissions || [];
      const permissionsMap = Object.keys(pageNameMap).reduce((acc, key) => {
        acc[key] = {
          id: null,
          view: false,
          add: false,
          edit: false,
          delete: false,
        };
        return acc;
      }, {});
      rolePermissions.forEach((perm) => {
        const pageKey = Object.keys(pageNameMap).find(
          (key) => pageNameMap[key].apiName === perm.page
        );
        if (pageKey) {
          permissionsMap[pageKey] = {
            id: perm.id,
            view: perm.can_view,
            add: perm.can_add,
            edit: perm.can_edit,
            delete: perm.can_delete,
          };
        }
      });
      setPermissions(permissionsMap);
    } catch (error) {
      setError("Failed to fetch permissions. Please try again.");
    }
  };

  const handlePermissionChange = (page, action) => {
    setPermissions((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [action]: !prev[page][action],
      },
    }));
  };

  const handleSavePermissions = async () => {
    if (!hasPermission("permissions", "edit")) {
      setError("You do not have permission to edit permissions.");
      return;
    }
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const updatePromises = Object.keys(permissions).map(async (page) => {
        const perm = permissions[page];
        const apiPageName = pageNameMap[page].apiName;
        if (perm.id) {
          return apiClient.put(`/auth/permissions/${perm.id}/`, {
            role: selectedRole.id,
            page: apiPageName,
            can_view: perm.view,
            can_add: perm.add,
            can_edit: perm.edit,
            can_delete: perm.delete,
          });
        } else {
          return apiClient.post(`/auth/permissions/`, {
            role: selectedRole.id,
            page: apiPageName,
            can_view: perm.view,
            can_add: perm.add,
            can_edit: perm.edit,
            can_delete: perm.delete,
          });
        }
      });
      await Promise.all(updatePromises);
      setMessage(`Permissions updated for ${selectedRole.name}`);
      setSelectedRole(null);
    } catch (error) {
      console.error("Save Permissions Error:", error);
      setError("Failed to update permissions. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingPermissions) {
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
      <h1 className="text-2xl font-bold mb-6">Permissions Management</h1>
      <p className="text-gray-600 mb-8">
        View and manage permissions for roles.
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
      <motion.div
        className="bg-white rounded-2xl shadow-xl p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-xl font-semibold mb-4">Existing Roles</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {role.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <Button
                      onClick={() => openPermissionsModal(role)}
                      disabled={!hasPermission("permissions", "edit")}
                      className={`flex items-center justify-start px-3 py-1 text-xs rounded transition duration-300 ${
                        hasPermission("permissions", "edit")
                          ? "bg-indigo-500 text-white hover:bg-indigo-600"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <FaCog className="w-4 h-4 mr-1" /> Permissions
                    </Button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td
                    colSpan="2"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No roles found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      <AnimatePresence>
        {selectedRole && (
          <Modal
            isOpen={!!selectedRole}
            onClose={() => setSelectedRole(null)}
            title={`Permissions for ${selectedRole.name}`}
          >
            {/* FIXED: Select All OUTSIDE FormProvider */}
            <div className="mb-4 p-2 bg-gray-50 rounded-lg">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllSelected()}
                  onChange={handleSelectAll}
                  disabled={!hasPermission("permissions", "edit")}
                  className={`h-4 w-4 text-indigo-500 focus:ring-indigo-500 border-gray-300 rounded ${
                    !hasPermission("permissions", "edit")
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Select All Permissions
                </span>
              </label>
            </div>

            <FormProvider {...permissionsForm}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Page
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        View
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Add
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Edit
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.keys(permissions).map((page) => (
                      <tr key={page} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {pageNameMap[page].displayName}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Input
                            type="checkbox"
                            name={`view_${page}`}
                            onChange={(e) =>
                              handlePermissionChange(page, "view")
                            }
                            checked={permissions[page]?.view || false}
                            disabled={!hasPermission("permissions", "edit")}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Input
                            type="checkbox"
                            name={`add_${page}`}
                            onChange={(e) =>
                              handlePermissionChange(page, "add")
                            }
                            checked={permissions[page]?.add || false}
                            disabled={!hasPermission("permissions", "edit")}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Input
                            type="checkbox"
                            name={`edit_${page}`}
                            onChange={(e) =>
                              handlePermissionChange(page, "edit")
                            }
                            checked={permissions[page]?.edit || false}
                            disabled={!hasPermission("permissions", "edit")}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Input
                            type="checkbox"
                            name={`delete_${page}`}
                            onChange={(e) =>
                              handlePermissionChange(page, "delete")
                            }
                            checked={permissions[page]?.delete || false}
                            disabled={!hasPermission("permissions", "edit")}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  onClick={() => setSelectedRole(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  disabled={isSaving || !hasPermission("permissions", "edit")}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isSaving || !hasPermission("permissions", "edit")
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-indigo-500 text-white hover:bg-indigo-600"
                  }`}
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </FormProvider>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Permissions;
