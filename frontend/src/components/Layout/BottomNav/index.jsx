import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import {
  FaHome,
  FaSearch,
  FaEnvelope,
  FaCalendar,
  FaUser,
} from "react-icons/fa";
import { motion } from "framer-motion";
import apiClient from "../../../api/apiClient";

const BottomNav = ({ isAuthenticated, activePage }) => {
  const [permissions, setPermissions] = useState([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) {
        setPermissions([]);
        setIsSuperadmin(false);
        setIsLoading(false);
        return;
      }
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
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [isAuthenticated]);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const menuItems = [
    {
      id: "dashboard",
      to: "/",
      label: "Dashboard",
      icon: <FaHome className="w-6 h-6" />,
      page: "Dashboard",
      action: "view",
    },
    {
      id: "enquiries",
      to: "/enquiries",
      label: "Enquiries",
      icon: <FaSearch className="w-6 h-6" />,
      page: "enquiries",
      action: "view",
    },
    {
      id: "new-enquiries",
      to: "/new-enquiries",
      label: "New Enquiries",
      icon: <FaEnvelope className="w-6 h-6" />,
      page: "new_enquiries",
      action: "view",
    },
    {
      id: "scheduled-surveys",
      to: "/scheduled-surveys",
      label: "Surveys",
      icon: <FaCalendar className="w-6 h-6" />,
      page: "scheduled_surveys",
      action: "view",
    },
    {
      id: "profile",
      to: "/profile",
      label: "Profile",
      icon: <FaUser className="w-6 h-6" />,
      page: "Profile",
      action: "view",
    },
  ];

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 flex justify-around items-center py-2 md:hidden"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {menuItems.map((item) =>
        isLoading || hasPermission(item.page, item.action) ? (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 text-gray-800 transition-colors duration-200 ${
                isActive
                  ? "text-[#4c7085]"
                  : "hover:text-[#6b8ca3]"
              } ${isLoading ? "opacity-50" : ""}`
            }
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ) : null
      )}
    </motion.div>
  );
};

export default BottomNav;