/* src/pages/AdditionalSettings/Permissions.jsx */
import React, { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import { FaCog } from "react-icons/fa";

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
    quotation: "quotation",
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
    quotation: "Quotation",
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
        } else if (perm.view || perm.add || perm.edit || perm.delete) {
          return apiClient.post("/auth/permissions/", payload);
        }
      }).filter(Boolean);

      await Promise.all(promises);
      setMessage(`Permissions updated for "${selectedRole.name}"`);
      setTimeout(() => {
        setSelectedRole(null);
        setMessage("");
      }, 2000);
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

          {/* Roles List Card */}
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
                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">Role Name</th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs sm:text-sm font-medium text-gray-700">Actions</th>
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
                              <FaCog /> Permissions
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
                      <div className="flex justify-center items-center">
                        <h4 className="text-xs sm:text-lg font-medium">{role.name}</h4>
                      </div>
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={() => openPermissionsModal(role)}
                          disabled={!hasPermission("permissions", "edit")}
                          className={`text-sm font-medium px-6 py-2 rounded-lg transition flex items-center gap-2 ${
                            !hasPermission("permissions", "edit")
                              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                              : "bg-[#4c7085] text-white hover:bg-[#6b8ca3]"
                          }`}
                        >
                          <FaCog /> Permissions
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-base sm:text-lg mb-2">No roles available.</p>
                <p className="text-sm">Create roles in the Roles section first.</p>
              </div>
            )}
          </div>
        </div>

        {/* Permissions Modal */}
        {selectedRole && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 sm:p-8 max-w-5xl w-full my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs sm:text-lg font-medium">
                  Permissions – {selectedRole.name}
                </h3>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-gray-500 hover:text-gray-700 transition text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Select All */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected()}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-[#4c7085] rounded focus:ring-[#4c7085]"
                  />
                  <span className="text-xs sm:text-lg font-medium">Select All Permissions</span>
                </label>
              </div>

              {/* Permissions Table */}
              <div className="overflow-x-auto max-h-96 border border-gray-300 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Module</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">View</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Add</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Edit</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.keys(permissions).map((key) => (
                      <tr key={key} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {displayNames[key] || key}
                        </td>
                        {["view", "add", "edit", "delete"].map((action) => (
                          <td key={action} className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={permissions[key][action] || false}
                              onChange={() => handlePermissionChange(key, action)}
                              disabled={!hasPermission("permissions", "edit")}
                              className="w-5 h-5 text-[#4c7085] rounded focus:ring-[#4c7085] disabled:opacity-50"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
                <button
                  onClick={() => setSelectedRole(null)}
                  className="w-full sm:w-auto text-sm font-medium px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePermissions}
                  disabled={isSaving || !hasPermission("permissions", "edit")}
                  className={`w-full sm:w-auto text-sm font-medium px-6 py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${
                    isSaving || !hasPermission("permissions", "edit")
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white cursor-pointer"
                  }`}
                >
                  {isSaving ? "Saving..." : "Save Permissions"}
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