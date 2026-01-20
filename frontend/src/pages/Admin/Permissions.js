/* src/pages/AdditionalSettings/Permissions.jsx */
import React, { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import { FaCog, FaSpinner } from "react-icons/fa";

const Permissions = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [effectivePermissions, setEffectivePermissions] = useState({}); // New: for global checks
  const [isLoading, setIsLoading] = useState(true);

  const pageNameMap = {
    Dashboard: "Dashboard",
    Profile: "Profile",
    enquiries: "enquiries",
    new_enquiries: "new_enquiries",
    scheduled_surveys: "scheduled_surveys",
    survey_summary: "survey_summary",
    quotation: "quotation",
    booking: "booking",
    inventory: "inventory",
    pricing: "pricing",
    local_move: "local_move",
    international_move: "international_move",
    types: "types",
    units: "units",
    currency: "currency",
    tax: "tax",
    handyman: "handyman",
    manpower: "manpower",
    room: "room",
    "additional-services": "additional-services",
    labours: "labours",
    materials: "materials",
    users: "users",
    roles: "roles",
    permissions: "permissions",
  };

  const displayNames = {
    Dashboard: "Dashboard",
    Profile: "Profile",
    enquiries: "Enquiries",
    new_enquiries: "New Assigned Enquiries",
    scheduled_surveys: "Scheduled Surveys",
    survey_summary: "Survey Summary",
    quotation: "Quotation Management",
    booking: "Booked Moves",
    inventory: "Inventory Management",
    pricing: "Pricing Settings",
    local_move: "Local Move Pricing",
    international_move: "International Move Pricing",
    types: "Types",
    units: "Units",
    currency: "Currency",
    tax: "Tax Settings",
    handyman: "Handyman Services",
    manpower: "Manpower",
    room: "Room Types",
    "additional-services": "Additional Services",
    labours: "Labours",
    materials: "Materials",
    users: "Users",
    roles: "Roles",
    permissions: "Permissions",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch profile & superadmin status
        const profileRes = await apiClient.get("/auth/profile/");
        const user = profileRes.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");

        // 2. Fetch effective permissions (for hasPermission checks)
        const permsRes = await apiClient.get("/auth/effective-permissions/");
        setEffectivePermissions(permsRes.data || {});

        // 3. Fetch all roles
        const rolesRes = await apiClient.get("/auth/roles/");
        setRoles(rolesRes.data);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load permissions data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = effectivePermissions[page];
    return perm?.[`can_${action}`] === true;
  };

  const handleSelectAll = () => {
    const allChecked = Object.values(permissions).every(
      (p) => p.view && p.add && p.edit && p.delete
    );

    const newState = {};
    Object.keys(permissions).forEach((key) => {
      newState[key] = {
        id: permissions[key]?.id,
        view: !allChecked,
        add: !allChecked,
        edit: !allChecked,
        delete: !allChecked,
      };
    });
    setPermissions(newState);
  };

  const isAllSelected = () => {
    return Object.values(permissions).every((p) => p.view && p.add && p.edit && p.delete);
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
      Object.keys(pageNameMap).forEach((key) => {
        permsMap[key] = { id: null, view: false, add: false, edit: false, delete: false };
      });

      rolePerms.forEach((p) => {
        const frontendKey = Object.keys(pageNameMap).find(
          (k) => pageNameMap[k] === p.page
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
      setError("Failed to load role permissions.");
      console.error(err);
    }
  };

  const handlePermissionChange = (page, action) => {
    setPermissions((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [action]: !prev[page]?.[action],
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
        if (!apiPage) return null;

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
        } else if (perm.view || perm.add || perm.edit || perm.delete) {
          return apiClient.post("/auth/permissions/", payload);
        }
      }).filter(Boolean);

      await Promise.all(promises);
      setMessage(`Permissions updated successfully for "${selectedRole.name}"`);
      setTimeout(() => {
        setSelectedRole(null);
        setMessage("");
      }, 2500);
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save permissions. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
          <h1 className="text-xs sm:text-lg font-medium">Permissions Management</h1>
          <p className="text-sm sm:text-base text-gray-200 mt-1">
            Fine-tune role-based access control for all modules
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

          {/* Roles List */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-4 sm:px-6 py-3">
              <h3 className="text-xs sm:text-lg font-medium">
                Roles ({roles.length})
              </h3>
            </div>

            {roles.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-300">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">
                          Role Name
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-medium text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {roles.map((role) => (
                        <tr key={role.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">
                            {role.name}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <button
                              onClick={() => openPermissionsModal(role)}
                              disabled={!hasPermission("permissions", "edit")}
                              className={`text-sm font-medium px-6 py-2 rounded-lg transition flex items-center gap-2 mx-auto ${
                                !hasPermission("permissions", "edit")
                                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                  : "bg-[#4c7085] text-white hover:bg-[#6b8ca3]"
                              }`}
                            >
                              <FaCog /> Manage Permissions
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3 p-4">
                  {roles.map((role) => (
                    <div key={role.id} className="bg-gray-50 rounded-lg border border-gray-300 p-4">
                      <div className="flex justify-center items-center mb-3">
                        <h4 className="text-sm sm:text-lg font-medium">{role.name}</h4>
                      </div>
                      <div className="flex justify-center">
                        <button
                          onClick={() => openPermissionsModal(role)}
                          disabled={!hasPermission("permissions", "edit")}
                          className={`text-sm font-medium px-6 py-2 rounded-lg transition flex items-center gap-2 ${
                            !hasPermission("permissions", "edit")
                              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                              : "bg-[#4c7085] text-white hover:bg-[#6b8ca3]"
                          }`}
                        >
                          <FaCog /> Manage Permissions
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-base sm:text-lg mb-2">No roles available yet.</p>
                <p className="text-sm">Create your first role in the Roles section.</p>
              </div>
            )}
          </div>
        </div>

        {/* Permissions Edit Modal */}
        {selectedRole && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 sm:p-8 max-w-6xl w-full my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Permissions for: {selectedRole.name}
                </h3>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Select All */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected()}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-[#4c7085] rounded focus:ring-[#4c7085]"
                  />
                  <span className="text-base font-medium text-gray-700">Select All Permissions</span>
                </label>
              </div>

              {/* Permissions Table */}
              <div className="overflow-x-auto max-h-[60vh] border border-gray-200 rounded-lg shadow-sm">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Module</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">View</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">Add</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">Edit</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.keys(permissions)
                      .sort()
                      .map((key) => (
                        <tr key={key} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {displayNames[key] || key}
                          </td>
                          {["view", "add", "edit", "delete"].map((action) => (
                            <td key={action} className="px-4 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={permissions[key]?.[action] || false}
                                onChange={() => handlePermissionChange(key, action)}
                                disabled={isSaving}
                                className="w-5 h-5 text-[#4c7085] rounded focus:ring-[#4c7085] disabled:opacity-50 cursor-pointer"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePermissions}
                  disabled={isSaving}
                  className={`px-6 py-2.5 rounded-lg font-medium shadow transition flex items-center gap-2 min-w-[140px] justify-center ${
                    isSaving
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:opacity-90"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Permissions"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Permissions;