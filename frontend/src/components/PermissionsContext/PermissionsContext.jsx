// src/context/PermissionsContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../../api/apiClient"; // Adjust the path based on your project structure

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
  const [effectivePermissions, setEffectivePermissions] = useState({});
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [permissionsError, setPermissionsError] = useState(null);

  // Fetch effective permissions once when the app loads (after login)
  useEffect(() => {
    const fetchEffectivePermissions = async () => {
      // Skip if no auth token (user not logged in)
      const token = localStorage.getItem("access_token"); // Adjust if your token key is different
      if (!token) {
        setIsLoadingPermissions(false);
        return;
      }

      try {
        setIsLoadingPermissions(true);
        setPermissionsError(null);

        // Fetch profile to check superadmin
        const profileRes = await apiClient.get("/auth/profile/");
        const user = profileRes.data;

        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");

        // Fetch effective permissions (role + user overrides)
        const permsRes = await apiClient.get("/auth/effective-permissions/");
        setEffectivePermissions(permsRes.data || {});

      } catch (err) {
        console.error("Failed to load effective permissions:", err);
        setPermissionsError("Failed to load permissions. Some features may be restricted.");
        setEffectivePermissions({});
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchEffectivePermissions();

    // Optional: Refresh when window regains focus
    const handleFocus = () => fetchEffectivePermissions();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Core permission check function - used everywhere
  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    if (isLoadingPermissions) return false; // Prevent actions during loading

    const pagePerm = effectivePermissions[page];
    return pagePerm?.[`can_${action}`] === true;
  };

  // Function to manually refresh permissions (call after updating overrides)
  const refreshPermissions = async () => {
    setIsLoadingPermissions(true);
    try {
      const permsRes = await apiClient.get("/auth/effective-permissions/");
      setEffectivePermissions(permsRes.data || {});
    } catch (err) {
      console.error("Failed to refresh permissions:", err);
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const value = {
    hasPermission,
    isSuperadmin,
    isLoadingPermissions,
    permissionsError,
    effectivePermissions,
    refreshPermissions,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

// Custom hook for easy usage in any component
export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};