/* src/pages/AdditionalSettings/Permissions.jsx */
import React, { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import { FaCog, FaSpinner } from "react-icons/fa";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";

const Permissions = () => {
  const { hasPermission, refreshPermissions } = usePermissions();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOverrides, setUserOverrides] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOverridesLoading, setIsOverridesLoading] = useState(false);

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

        // 2. Fetch all users
        const usersRes = await apiClient.get("/auth/users/");
        setUsers(usersRes.data);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load user permissions data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const openPermissionsModal = async (user) => {
    if (!hasPermission("permissions", "edit") && !isSuperadmin) {
      setError("You do not have permission to edit user permissions.");
      return;
    }

    setSelectedUser(user);
    setError("");
    setMessage("");
    setIsOverridesLoading(true);

    try {
      const response = await apiClient.get(`/auth/users/${user.id}/permissions/`);
      const existingOverrides = response.data || [];

      const overridesMap = {};
      
      // 1. Get Role Permissions from the selected user object (fetched in users list)
      const rolePermissions = user.role?.permissions || [];
      const rolePermsMap = {};
      rolePermissions.forEach(p => {
        rolePermsMap[p.page] = {
          view: p.can_view,
          add: p.can_add,
          edit: p.can_edit,
          delete: p.can_delete
        };
      });

      // 2. Initialize all pages with Role permissions as default (or false)
      Object.keys(pageNameMap).forEach((key) => {
        const rp = rolePermsMap[key] || {};
        overridesMap[key] = { 
          id: null, 
          view: rp.view || false, 
          add: rp.add || false, 
          edit: rp.edit || false, 
          delete: rp.delete || false 
        };
      });

      // 3. Apply existing overrides (these take precedence)
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

  const saveUserOverrides = async () => {
    if (!hasPermission("permissions", "edit") && !isSuperadmin) return;

    setIsSaving(true);
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
          // UPDATE existing override
          return apiClient.put(
            `/auth/users/${selectedUser.id}/permissions/${perm.id}/`,
            payload
          );
        } else {
          // CREATE new override (Always create if it doesn't exist, to ensure explicit False is saved)
          try {
            return await apiClient.post(
              `/auth/users/${selectedUser.id}/permissions/`,
              payload
            );
          } catch (err) {
            // If 400 due to unique constraint → find existing and UPDATE
            if (err.response?.status === 400 && 
                err.response?.data?.non_field_errors?.some(msg => msg.includes("unique set"))) {
              console.log(`Duplicate override for ${page} — updating instead`);
              
              // Fetch current overrides to get existing ID
              const existingRes = await apiClient.get(`/auth/users/${selectedUser.id}/permissions/`);
              const match = existingRes.data.find(p => p.page === page);
              
              if (match?.id) {
                return apiClient.put(
                  `/auth/users/${selectedUser.id}/permissions/${match.id}/`,
                  payload
                );
              }
            }
            // Ignore other errors or log them, but don't break the loop
            console.error(`Failed to save override for ${page}:`, err);
            return null;
          }
        }
      }).filter(Boolean);

      await Promise.all(promises);

      // Refresh global permissions
      await refreshPermissions();

      setMessage(`Permissions updated for ${selectedUser.name || selectedUser.email}`);
      setTimeout(() => {
        setSelectedUser(null);
        setMessage("");
      }, 2500);
    } catch (err) {
      console.error(err);
      setError("Failed to save permissions: " + (err.response?.data?.detail || err.message || "Unknown error"));
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
          <h1 className="text-xs sm:text-lg font-medium">User Permissions Management</h1>
          <p className="text-sm sm:text-base text-gray-200 mt-1">
            Manage individual user access overrides
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

          {/* Users List */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white px-4 sm:px-6 py-3">
              <h3 className="text-xs sm:text-lg font-medium">
                Users ({users.length})
              </h3>
            </div>

            {users.length > 0 ? (
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
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900">{user.email}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">{user.name || "—"}</td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                            {user.role?.name || "—"}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <button
                              onClick={() => openPermissionsModal(user)}
                              disabled={!hasPermission("permissions", "edit") && !isSuperadmin}
                              className={`text-sm font-medium px-6 py-2 rounded-lg transition flex items-center gap-2 mx-auto ${
                                !hasPermission("permissions", "edit") && !isSuperadmin
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
                  {users.map((user) => (
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
                      <div className="flex justify-center">
                        <button
                          onClick={() => openPermissionsModal(user)}
                          disabled={!hasPermission("permissions", "edit") && !isSuperadmin}
                          className={`text-sm font-medium px-6 py-2 rounded-lg transition flex items-center gap-2 ${
                            !hasPermission("permissions", "edit") && !isSuperadmin
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
                <p className="text-base sm:text-lg mb-2">No users available yet.</p>
                <p className="text-sm">Create users in the Users section.</p>
              </div>
            )}
          </div>
        </div>

        {/* Overrides Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 sm:p-8 max-w-5xl w-full my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Permission Overrides for: {selectedUser.name || selectedUser.email}
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
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
                        {Object.keys(userOverrides)
                          .sort()
                          .map((page) => (
                            <tr key={page} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {displayNames[page] || page}
                              </td>
                              {["view", "add", "edit", "delete"].map((action) => (
                                <td key={action} className="px-4 py-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={userOverrides[page]?.[action] || false}
                                    onChange={() => {
                                      setUserOverrides((prev) => ({
                                        ...prev,
                                        [page]: {
                                          ...prev[page],
                                          [action]: !prev[page]?.[action],
                                        },
                                      }));
                                    }}
                                    disabled={isSaving}
                                    className="w-5 h-5 text-[#4c7085] rounded focus:ring-[#4c7085] cursor-pointer"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveUserOverrides}
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Permissions;