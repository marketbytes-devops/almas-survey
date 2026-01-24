/* src/pages/Admin/Roles.js */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiTrash2,
  FiEdit3,
  FiPlus,
  FiShield,
  FiInfo,
  FiCheckCircle,
  FiXCircle,

  FiChevronUp,
  FiChevronDown,
  FiLock,
  FiSave
} from "react-icons/fi";
import apiClient from "../../api/apiClient";
import Input from "../../components/Input";
import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";
import Modal from "../../components/Modal";

const Roles = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [roles, setRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState(new Set());
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState(null);
  const [rolePermissions, setRolePermissions] = useState({});
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const createForm = useForm({
    defaultValues: { name: "", description: "" },
  });

  const editForm = useForm({
    defaultValues: { name: "", description: "" },
  });

  const { handleSubmit: handleCreate, reset: resetCreate } = createForm;
  const { handleSubmit: handleEdit, reset: resetEdit } = editForm;

  useEffect(() => {
    if (!hasPermission("roles", "view")) {
      navigate("/dashboard");
      return;
    }
    fetchRoles();
  }, [hasPermission, navigate]);


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
    setIsCreatingRole(true);
    try {
      const response = await apiClient.post("/auth/roles/", data);
      setRoles((prev) => [...prev, response.data]);
      resetCreate();
      setIsCreateModalOpen(false);
      setMessage("Role created successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Failed to create role. Please try again."
      );
      setTimeout(() => setError(""), 4000);
    } finally {
      setIsCreatingRole(false);
    }
  };

  const onUpdateRole = async (data) => {
    setError("");
    setMessage("");
    if (!hasPermission("roles", "edit")) {
      setError("You do not have permission to edit a role.");
      return;
    }
    setIsEditingRole(true);
    try {
      const response = await apiClient.put(`/auth/roles/${editRole.id}/`, data);
      setRoles((prev) =>
        prev.map((role) => (role.id === editRole.id ? response.data : role))
      );
      setMessage("Role updated successfully");
      setEditRole(null);
      resetEdit();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        "Failed to update role. Please try again."
      );
      setTimeout(() => setError(""), 4000);
    } finally {
      setIsEditingRole(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!hasPermission("roles", "delete")) {
      setError("You do not have permission to delete a role.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this role?")) return;

    try {
      await apiClient.delete(`/auth/roles/${id}/`);
      setRoles((prev) => prev.filter((role) => role.id !== id));
      setMessage("Role deleted successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setError("Failed to delete role. Please try again.");
      setTimeout(() => setError(""), 4000);
    }
  };

  const openEditModal = (role) => {
    if (!hasPermission("roles", "edit")) {
      setError("You do not have permission to edit a role.");
      return;
    }
    setEditRole(role);
    editForm.reset({
      name: role.name,
      description: role.description || "",
    });
  };

  const toggleRoleExpand = (roleId) => {
    setExpandedRoles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  // --- Permissions Editor Logic ---

  const openPermissionsModal = async (role) => {
    if (!hasPermission("roles", "edit")) {
      setError("You do not have permission to manage role permissions.");
      return;
    }
    setSelectedRoleForPerms(role);
    setIsLoadingPermissions(true);

    try {
      // Fetch fresh role data to get permissions
      const response = await apiClient.get(`/auth/roles/${role.id}/`);
      const perms = response.data.permissions || [];

      const permsMap = {};
      perms.forEach(p => {
        permsMap[p.page] = p; // Store the full permission object
      });
      setRolePermissions(permsMap);
    } catch (err) {
      console.error("Failed to fetch role permissions:", err);
      setError("Failed to load permissions.");
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const handlePermissionChange = (page, field) => {
    setRolePermissions(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        [field]: !prev[page][field]
      }
    }));
  };

  const saveRolePermissions = async () => {
    if (!selectedRoleForPerms) return;
    setIsSavingPermissions(true);
    setMessage("");
    setError("");

    try {
      // Create list of promises for all permission updates
      const updatePromises = Object.values(rolePermissions).map(perm => {
        return apiClient.put(`/auth/permissions/${perm.id}/`, {
          role: selectedRoleForPerms.id,
          page: perm.page,
          can_view: perm.can_view,
          can_add: perm.can_add,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete
        });
      });

      await Promise.all(updatePromises);
      setMessage(`Permissions updated for ${selectedRoleForPerms.name}`);
      setTimeout(() => {
        setIsSavingPermissions(false);
        setSelectedRoleForPerms(null);
        setMessage("");
      }, 2000);

      // Refresh roles list to ensure underlying data is sync (though we edited perms directly)
      fetchRoles();

    } catch (err) {
      console.error("Failed to save permissions:", err);
      setError("Failed to save permission changes.");
      setIsSavingPermissions(false);
    }
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

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        title="Roles Management"
        subtitle="Manage user roles and their access levels"
        extra={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-50">
              <FiShield className="text-[#4c7085]" />
              {roles.length} Total Roles
            </div>
            {hasPermission("roles", "add") && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-[#4c7085] text-white px-4 py-2 rounded-xl hover:bg-[#6b8ca3] transition-all shadow-sm text-sm font-medium"
              >
                <FiPlus /> Create Role
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

      {/* Search */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
          <FiSearch className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Search by role name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#4c7085]/10 focus:border-[#4c7085] transition-all outline-none"
        />
      </div>

      {filteredRoles.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-gray-300 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-800">No roles found</h3>
          <p className="text-gray-600 text-sm mt-1">
            {searchQuery ? "Try a different search term" : "Start by creating a new role"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Role Info</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085]">
                          <FiShield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{role.name}</p>
                          <p className="text-xs text-gray-500">System Role</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-gray-600 max-w-sm">
                        {role.description || (
                          <span className="text-gray-300 italic flex items-center gap-1">
                            <FiInfo className="w-3 h-3" /> No description provided
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openPermissionsModal(role)}
                          className="w-9 h-9 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                          title="Manage Permissions"
                        >
                          <FiLock className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(role)}
                          className="w-9 h-9 flex items-center justify-center text-gray-600 bg-gray-50 hover:bg-gray-800 hover:text-white rounded-xl transition-all"
                          title="Edit Role"
                        >
                          <FiEdit3 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="w-9 h-9 flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                          title="Delete Role"
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
            {filteredRoles.map((role) => {
              const isExpanded = expandedRoles.has(role.id);
              return (
                <div key={role.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleRoleExpand(role.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085]">
                        <FiShield />
                      </div>
                      <h4 className="font-medium text-gray-800 text-sm">{role.name}</h4>
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
                            <p className="text-[10px] uppercase font-medium text-gray-400 tracking-wider">Description</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {role.description || "No description provided"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openPermissionsModal(role)}
                              className="flex-1 bg-blue-50 text-blue-600 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                            >
                              <FiLock /> Perms
                            </button>
                            <button
                              onClick={() => openEditModal(role)}
                              className="flex-1 bg-white border border-gray-200 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                            >
                              <FiEdit3 /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role.id)}
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
        title="Create New Role"
      >
        <FormProvider {...createForm}>
          <form onSubmit={handleCreate(onCreateRole)} className="space-y-6">
            <Input
              label="Role Name"
              name="name"
              placeholder="e.g. Sales Manager, Surveyor"
              rules={{ required: "Role name is required" }}
              disabled={isCreatingRole}
            />
            <Input
              label="Description (optional)"
              name="description"
              type="textarea"
              rows={3}
              placeholder="Describe the purpose of this role..."
              disabled={isCreatingRole}
            />
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                disabled={isCreatingRole}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#4c7085] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#6b8ca3] transition-all disabled:opacity-50"
                disabled={isCreatingRole}
              >
                {isCreatingRole ? "Creating..." : "Create Role"}
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editRole}
        onClose={() => setEditRole(null)}
        title="Edit Role"
      >
        <FormProvider {...editForm}>
          <form onSubmit={handleEdit(onUpdateRole)} className="space-y-6">
            <Input
              label="Role Name"
              name="name"
              placeholder="e.g. Sales Manager"
              rules={{ required: "Role name is required" }}
              disabled={isEditingRole}
            />
            <Input
              label="Description (optional)"
              name="description"
              type="textarea"
              rows={3}
              placeholder="Describe the purpose of this role..."
              disabled={isEditingRole}
            />
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditRole(null)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                disabled={isEditingRole}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#4c7085] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#6b8ca3] transition-all disabled:opacity-50"
                disabled={isEditingRole}
              >
                {isEditingRole ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        isOpen={!!selectedRoleForPerms}
        onClose={() => setSelectedRoleForPerms(null)}
        title={`Manage Role Permissions: ${selectedRoleForPerms?.name}`}
        maxWidth="max-w-5xl"
      >
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 items-start">
            <FiShield className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Role-Level Permissions</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Changes here will affect ALL users assigned to this role, unless they have individual overrides.
              </p>
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
                  {Object.keys(rolePermissions).sort((a, b) => {
                    const indexA = SIDEBAR_ORDER.indexOf(a);
                    const indexB = SIDEBAR_ORDER.indexOf(b);
                    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                  }).map((page) => (
                    <tr key={page} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-800">{displayNames[page] || page}</p>
                        <p className="text-[10px] text-gray-400 font-medium">/{page}</p>
                      </td>
                      {["can_view", "can_add", "can_edit", "can_delete"].map((field) => (
                        <td key={field} className="px-4 py-4 text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rolePermissions[page][field] || false}
                              onChange={() => handlePermissionChange(page, field)}
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
              type="button"
              onClick={() => setSelectedRoleForPerms(null)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              disabled={isSavingPermissions}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveRolePermissions}
              className="flex-1 bg-[#4c7085] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#6b8ca3] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              disabled={isSavingPermissions}
            >
              {isSavingPermissions ? "Saving..." : <><FiSave /> Save Permissions</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


export default Roles;