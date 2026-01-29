/* src/pages/Admin/Permissions.js */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSettings,
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiUser,
  FiMail,
  FiSearch,
  FiChevronRight,
  FiLock,
  FiUnlock,
  FiSave
} from "react-icons/fi";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";

const Permissions = () => {
  const navigate = useNavigate();
  const { hasPermission, refreshPermissions } = usePermissions();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOverrides, setUserOverrides] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOverridesLoading, setIsOverridesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const pageNameMap = {
    Dashboard: "Dashboard",
    Profile: "Profile",
    enquiries: "enquiries",
    new_enquiries: "new_enquiries",
    follow_ups: "follow_ups",
    processing_enquiries: "processing_enquiries",
    scheduled_surveys: "scheduled_surveys",
    survey_details: "survey_details",
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

  const SIDEBAR_ORDER = [
    "Dashboard",
    "enquiries",
    "new_enquiries",
    "follow_ups",
    "processing_enquiries",
    "scheduled_surveys",
    "survey_details",
    "survey_summary",
    "quotation",
    "booking",
    "inventory",
    "pricing",
    "local_move",
    "international_move",
    "additional_settings",
    "types",
    "units",
    "currency",
    "tax",
    "handyman",
    "manpower",
    "room",
    "additional-services",
    "labours",
    "materials",
    "users",
    "roles",
    "permissions",
    "Profile",
  ];

  const displayNames = {
    Dashboard: "Dashboard",
    Profile: "Profile",
    enquiries: "Enquiries",
    new_enquiries: "New Assigned Enquiries",
    follow_ups: "Follow Ups",
    processing_enquiries: "Processing Enquiries",
    scheduled_surveys: "Scheduled Surveys",
    survey_details: "Survey Details",
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
    if (!hasPermission("permissions", "view")) {
      navigate("/dashboard");
      return;
    }
    const fetchData = async () => {
      try {
        const usersRes = await apiClient.get("/auth/users/");
        setUsers(usersRes.data);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load user permissions data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hasPermission, navigate]);

  const openPermissionsModal = async (user) => {
    if (!hasPermission("permissions", "edit")) {
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

  const handleSelectAll = (selectAll = true) => {
    const newOverrides = { ...userOverrides };
    Object.keys(newOverrides).forEach(page => {
      newOverrides[page] = {
        ...newOverrides[page],
        view: selectAll,
        add: selectAll,
        edit: selectAll,
        delete: selectAll
      };
    });
    setUserOverrides(newOverrides);
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
    if (!hasPermission("permissions", "edit")) return;

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
          return apiClient.put(
            `/auth/users/${selectedUser.id}/permissions/${perm.id}/`,
            payload
          );
        } else {
          try {
            return await apiClient.post(
              `/auth/users/${selectedUser.id}/permissions/`,
              payload
            );
          } catch (err) {
            if (err.response?.status === 400 &&
              err.response?.data?.non_field_errors?.some(msg => msg.includes("unique set"))) {
              const existingRes = await apiClient.get(`/auth/users/${selectedUser.id}/permissions/`);
              const match = existingRes.data.find(p => p.page === page);
              if (match?.id) {
                return apiClient.put(
                  `/auth/users/${selectedUser.id}/permissions/${match.id}/`,
                  payload
                );
              }
            }
            return null;
          }
        }
      }).filter(Boolean);

      await Promise.all(promises);
      await refreshPermissions();

      setMessage(`Permissions updated for ${selectedUser.name || selectedUser.email}`);
      setTimeout(() => {
        setSelectedUser(null);
        setMessage("");
      }, 2500);
    } catch (err) {
      console.error(err);
      setError("Failed to save permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Permissions Management"
        subtitle="Manage individual user access overrides and permissions"
        extra={
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-50">
            <FiLock className="text-[#4c7085]" />
            {users.length} Total Users
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
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">×</button>
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
            <button onClick={() => setMessage("")} className="text-green-400 hover:text-green-600">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
          <FiSearch className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search users to manage permissions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#4c7085]/10 focus:border-[#4c7085] transition-all outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <motion.div
            key={user.id}
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            onClick={() => openPermissionsModal(user)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085] font-medium text-lg">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-medium uppercase tracking-wider">
                {user.role?.name || "No Role"}
              </div>
            </div>
            <h3 className="font-medium text-gray-800 mb-1">{user.name || "Unnamed User"}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-2 mb-6">
              <FiMail className="w-3.5 h-3.5" /> {user.email}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50 group-hover:border-gray-100 transition-colors">
              <span className="text-xs font-medium text-gray-400">Access Control</span>
              <div className="flex items-center gap-1 text-[#4c7085] font-medium text-sm">
                Manage <FiChevronRight />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`Permissions Overrides: ${selectedUser?.name || selectedUser?.email}`}
        maxWidth="max-w-5xl"
      >
        {isOverridesLoading ? (
          <div className="flex justify-center py-20">
            <Loading />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-start">
              <FiUnlock className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Individual Overrides</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  These settings will override the default permissions assigned to the user's role.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Select All Permissions</h4>
                <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Quickly enable or disable all access rights across all modules</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-gray-200 hover:border-red-100 flex-1 sm:flex-none"
                >
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="px-5 py-2 text-xs font-medium bg-[#4c7085] text-white hover:bg-[#3a5d72] rounded-xl transition-all shadow-sm hover:shadow focus:ring-4 focus:ring-[#4c7085]/10 flex-1 sm:flex-none"
                >
                  Select All
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-20 bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Module / Page</th>
                      <th className="px-4 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-center">View</th>
                      <th className="px-4 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-center">Add</th>
                      <th className="px-4 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-center">Edit</th>
                      <th className="px-4 py-4 text-xs font-medium text-gray-400 uppercase tracking-widest text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {Object.keys(userOverrides)
                      .sort((a, b) => {
                        const indexA = SIDEBAR_ORDER.indexOf(a);
                        const indexB = SIDEBAR_ORDER.indexOf(b);
                        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                      })
                      .map((page) => (
                        <tr key={page} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-800">{displayNames[page] || page}</p>
                            <p className="text-[10px] text-gray-400 font-medium">/{page}</p>
                          </td>
                          {["view", "add", "edit", "delete"].map((action) => (
                            <td key={action} className="px-4 py-4 text-center">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={userOverrides[page]?.[action] || false}
                                  onChange={() => handleOverrideChange(page, action)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4c7085]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4c7085]"></div>
                              </label>
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-50">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={saveUserOverrides}
                className="flex-1 bg-[#4c7085] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#6b8ca3] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : <><FiSave /> Save Changes</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Permissions;