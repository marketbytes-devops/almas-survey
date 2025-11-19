import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCog } from "react-icons/fa";
import Button from "../../components/Button";
import Modal from "../../components/Modal";
import Loading from "../../components/Loading";
import apiClient from "../../api/apiClient";

const Permissions = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({}); // { Dashboard: { view: true, add: false, ... } }
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [permissionsData, setPermissionsData] = useState([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  // Mapping: frontend key → backend page name
  const pageNameMap = {
    Dashboard: "Dashboard",
    Profile: "Profile",
    enquiries: "enquiries",
    processing_enquiries: "processing_enquiries",
    follow_ups: "follow_ups",
    scheduled_surveys: "scheduled_surveys",
    new_enquiries: "new_enquiries",
    survey_service_details: "survey_service_details",
    survey_summary: "survey_summary",
    local_move: "local_move",
    international_move: "international_move",
    types: "types",
    units: "units",
    currency: "currency",
    tax: "tax",
    handyman: "handyman",
    manpower: "manpower",
    room: "room",
    additionalServices: "additional-services",
    users: "users",
    roles: "roles",
    permissions: "permissions",
  };

  const displayNames = {
    Dashboard: "Dashboard",
    Profile: "Profile",
    enquiries: "Enquiries",
    processing_enquiries: "Processing Enquiries",
    follow_ups: "Follow Ups",
    scheduled_surveys: "Scheduled Surveys",
    new_enquiries: "New Enquiries",
    survey_service_details: "Survey Details",
    survey_summary: "Survey Summary",
    local_move: "Local Move",
    international_move: "International Move",
    types: "Types",
    units: "Units",
    currency: "Currency",
    tax: "Tax",
    handyman: "Handyman",
    manpower: "Manpower",
    room: "Room",
    additionalServices: "Additional Services",
    users: "Users",
    roles: "Roles",
    permissions: "Permissions",
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile/");
        const user = response.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");

        if (user.role?.id) {
          const res = await apiClient.get(`/auth/roles/${user.role.id}/`);
          setPermissionsData(res.data.permissions || []);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setIsLoadingPermissions(false);
      }
    };
    fetchProfile();
    fetchRoles();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissionsData.find(p => p.page === page);
    return perm?.[`can_${action}`] || false;
  };

  const fetchRoles = async () => {
    try {
      const response = await apiClient.get("/auth/roles/");
      setRoles(response.data);
    } catch (err) {
      setError("Failed to fetch roles.");
    }
  };

  // Select All – toggles ALL 4 actions for ALL pages
  const handleSelectAll = () => {
    const allChecked = Object.values(permissions).every(
      p => p.view && p.add && p.edit && p.delete
    );

    const newState = {};
    Object.keys(permissions).forEach(key => {
      newState[key] = {
        id: permissions[key].id,
        view: !allChecked,
        add: !allChecked,
        edit: !allChecked,
        delete: !allChecked,
      };
    });
    setPermissions(newState);
  };

  const isAllSelected = () => {
    return Object.values(permissions).every(p => p.view && p.add && p.edit && p.delete);
  };

  const openPermissionsModal = async (role) => {
    if (!hasPermission("permissions", "edit")) {
      setError("You do not have permission to edit permissions.");
      return;
    }

    setSelectedRole(role);
    setError("");
    setMessage("");

    try {
      const response = await apiClient.get(`/auth/roles/${role.id}/`);
      const rolePerms = response.data.permissions || [];

      const permsMap = {};
      Object.keys(pageNameMap).forEach(key => {
        permsMap[key] = { id: null, view: false, add: false, edit: false, delete: false };
      });

      rolePerms.forEach(p => {
        const frontendKey = Object.keys(pageNameMap).find(
          k => pageNameMap[k] === p.page
        );
        if (frontendKey) {
          permsMap[frontendKey] = {
            id: p.id,
            view: p.can_view,
            add: p.can_add,
            edit: p.can_edit,
            delete: p.can_delete,
          };
        }
      });

      setPermissions(permsMap);
    } catch (err) {
      setError("Failed to load permissions.");
    }
  };

  const handlePermissionChange = (page, action) => {
    setPermissions(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        [action]: !prev[page][action],
      },
    }));
  };

  const handleSavePermissions = async () => {
    if (!hasPermission("permissions", "edit")) return;

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const promises = Object.entries(permissions).map(async ([key, perm]) => {
        const apiPage = pageNameMap[key];
        const payload = {
          role: selectedRole.id,
          page: apiPage,
          can_view: perm.view,
          can_add: perm.add,
          can_edit: perm.edit,
          can_delete: perm.delete,
        };

        if (perm.id) {
          return apiClient.put(`/auth/permissions/${perm.id}/`, payload);
        } else {
          return apiClient.post(`/auth/permissions/`, payload);
        }
      });

      await Promise.all(promises);
      setMessage(`Permissions updated for "${selectedRole.name}"`);
      setTimeout(() => setSelectedRole(null), 1500);
    } catch (err) {
      console.error(err);
      setError("Failed to save permissions.");
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
    <motion.div className="min-h-screen mx-auto">
      <h1 className="text-2xl font-medium mb-6">Permissions Management</h1>

      {error && (
        <motion.div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </motion.div>
      )}
      {message && (
        <motion.div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {message}
        </motion.div>
      )}

      <div className="bg-white rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{role.name}</td>
                  <td className="px-6 py-4">
                    <Button
                      onClick={() => openPermissionsModal(role)}
                      disabled={!hasPermission("permissions", "edit")}
                      className={`flex items-center gap-2 px-4 py-2 text-xs rounded-md ${
                        hasPermission("permissions", "edit")
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <FaCog /> Permissions
                    </Button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr><td colSpan={2} className="text-center py-8 text-gray-500">No roles found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedRole && (
          <Modal
            isOpen={!!selectedRole}
            onClose={() => setSelectedRole(null)}
            title={`Permissions – ${selectedRole.name}`}
          >
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected()}
                  onChange={handleSelectAll}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="ml-3 text-lg font-medium text-gray-700">
                  Select All Permissions
                </span>
              </label>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                    {["view", "add", "edit", "delete"].map(act => (
                      <th key={act} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        {act.charAt(0).toUpperCase() + act.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.keys(permissions).map(key => (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {displayNames[key] || key}
                      </td>
                      {["view", "add", "edit", "delete"].map(action => (
                        <td key={action} className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={permissions[key][action] || false}
                            onChange={() => handlePermissionChange(key, action)}
                            disabled={!hasPermission("permissions", "edit")}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 disabled:opacity-50"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <Button
                onClick={() => setSelectedRole(null)}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePermissions}
                disabled={isSaving || !hasPermission("permissions", "edit")}
                className={`px-8 py-2 rounded-lg flex items-center gap-2 ${
                  isSaving || !hasPermission("permissions", "edit")
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Permissions"
                )}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Permissions;