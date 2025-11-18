import { useLocation, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AiOutlineProject,
  AiOutlineSearch,
  AiOutlineAliwangwang,
  AiOutlineCalendar,
  AiOutlineBarChart,
  AiOutlineSliders,
  AiOutlineTag,
  AiOutlineLineHeight,
  AiOutlineDollar,
  AiOutlinePercentage,
  AiOutlineTool,
  AiOutlineTeam,
  AiOutlineHome,
  AiOutlineSafety,
  AiOutlineLock,
  AiOutlineUsergroupAdd,
  AiOutlineKey,
  AiOutlineIdcard,
  AiOutlineUser,
  AiOutlineLogout,
} from "react-icons/ai";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";
import logo from "../../../assets/images/logo.webp";
import apiClient from "../../../api/apiClient";
import fallbackProfile from "../../../assets/images/profile-icon.png";

const Sidebar = ({ toggleSidebar }) => {
  const location = useLocation();
  const [isUserRolesOpen, setIsUserRolesOpen] = useState(false);
  const [isadditional_settingsOpen, setIsadditional_settingsOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
    const [userData, setUserData] = useState({ 
    username: "User", 
    image: fallbackProfile 
  });

  const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile/");
        const user = response.data;
        setUserData({ 
          username: user.username || "User", 
          image: user.image || fallbackProfile 
        });
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");
        const roleId = user.role?.id;
        if (roleId) {
          const res = await apiClient.get(`/auth/roles/${roleId}/`);
          setPermissions(res.data.permissions || []);
        } else {
          setPermissions([]);
          setError("No role assigned to user");
        }
      } catch (error) {
        console.error("Unable to fetch user profile:", error);
        setPermissions([]);
        setIsSuperadmin(false);
        setError("Failed to fetch profile or role permissions");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm && perm[`can_${action}`];
  };

  const toggleUserRoles = () => setIsUserRolesOpen(!isUserRolesOpen);
  const toggleadditional_settings = () => setIsadditional_settingsOpen(!isadditional_settingsOpen);
  const togglePricing = () => setIsPricingOpen(!isPricingOpen);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const menuItems = [
    {
      id: "dashboard",
      to: "/",
      label: "Dashboard",
      icon: <AiOutlineProject className="w-4 h-4 mr-3" />,
      page: "Dashboard",
      action: "view",
    },
    {
      id: "enquiries",
      to: "/enquiries",
      label: "Enquiries",
      icon: <AiOutlineSearch className="w-4 h-4 mr-3" />,
      page: "enquiries",
      action: "view",
    },
    {
      id: "new-enquiries",
      to: "/new-enquiries",
      label: "New Assigned Enquiries",
      icon: <AiOutlineAliwangwang className="w-4 h-4 mr-3" />,
      page: "new_enquiries",
      action: "view",
    },
    {
      id: "scheduled-surveys",
      to: "/scheduled-surveys",
      label: "Scheduled Surveys",
      icon: <AiOutlineCalendar className="w-4 h-4 mr-3" />,
      page: "scheduled_surveys",
      action: "view",
    },
    {
      id: "survey_summary",
      to: "/survey/survey-summary",
      label: "Survey Summary",
      icon: <AiOutlineBarChart className="w-4 h-4 mr-3" />,
      page: "survey_summary",
      action: "view",
    },
    {
      id: "pricing",
      label: "Pricing",
      icon: <AiOutlineDollar className="w-4 h-4 mr-3" />,
      page: "pricing",
      action: "view",
      subItems: [
        {
          id: "local-move",
          to: "/pricing/local-move",
          label: "Local Move",
          icon: <AiOutlineHome className="w-4 h-4 mr-3" />,
          page: "local_move",
          action: "view",
        },
        {
          id: "international-move",
          to: "/pricing/international-move",
          label: "International Move",
          icon: <AiOutlineTool className="w-4 h-4 mr-3" />,
          page: "international_move",
          action: "view",
        },
      ],
    },
    {
      id: "quotation",
      to: "/quotation-list",
      label: "Quotation",
      icon: <AiOutlineBarChart className="w-4 h-4 mr-3" />,
      page: "quotation",
      action: "view",
    },
    {
      id: "additional-settings",
      label: "Additional Settings",
      icon: <AiOutlineSliders className="w-4 h-4 mr-3" />,
      page: "additional_settings",
      action: "view",
      subItems: [
        { id: "types", to: "/additional-settings/types", label: "Types", icon: <AiOutlineTag className="w-4 h-4 mr-3" />, page: "types", action: "view" },
        { id: "units", to: "/additional-settings/units", label: "Units", icon: <AiOutlineLineHeight className="w-4 h-4 mr-3" />, page: "units", action: "view" },
        { id: "currency", to: "/additional-settings/currency", label: "Currency", icon: <AiOutlineDollar className="w-4 h-4 mr-3" />, page: "currency", action: "view" },
        { id: "tax", to: "/additional-settings/tax", label: "Tax", icon: <AiOutlinePercentage className="w-4 h-4 mr-3" />, page: "tax", action: "view" },
        { id: "handyman", to: "/additional-settings/handyman", label: "Handyman", icon: <AiOutlineTool className="w-4 h-4 mr-3" />, page: "handyman", action: "view" },
        { id: "manpower", to: "/additional-settings/manpower", label: "Manpower", icon: <AiOutlineTeam className="w-4 h-4 mr-3" />, page: "manpower", action: "view" },
        { id: "room", to: "/additional-settings/room", label: "Room", icon: <AiOutlineHome className="w-4 h-4 mr-3" />, page: "room", action: "view" },
      ],
    },
    {
      id: "user-roles",
      label: "User Roles",
      icon: <AiOutlineSafety className="w-4 h-4 mr-3" />,
      page: "users",
      action: "view",
      subItems: [
        { id: "roles", to: "/user-roles/roles", label: "Roles", icon: <AiOutlineLock className="w-4 h-4 mr-3" />, page: "roles", action: "view" },
        { id: "users", to: "/user-roles/users", label: "Users", icon: <AiOutlineUsergroupAdd className="w-4 h-4 mr-3" />, page: "users", action: "view" },
        { id: "permissions", to: "/user-roles/permissions", label: "Permissions", icon: <AiOutlineKey className="w-4 h-4 mr-3" />, page: "permissions", action: "view" },
      ],
    },
    {
      id: "profile",
      to: "/profile",
      label: "Profile",
      icon: <AiOutlineIdcard className="w-4 h-4 mr-3" />,
      page: "Profile",
      action: "view",
    },
  ];

  const renderMenuItem = (item) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-between w-full bg-gray-200 text-gray-800 text-sm py-3 px-3 rounded">
          {item.icon}
          {item.label}
        </div>
      );
    }
    if (item.subItems) {
      const filteredSubItems = item.subItems.filter((subItem) =>
        hasPermission(subItem.page, subItem.action)
      );
      if (filteredSubItems.length === 0) return null;
      const isActiveSubmenu = filteredSubItems.some(
        (subItem) => location.pathname === subItem.to
      );
      let toggleFunction, isOpen;
      switch (item.id) {
        case "user-roles":
          toggleFunction = toggleUserRoles;
          isOpen = isUserRolesOpen;
          break;
        case "additional-settings":
          toggleFunction = toggleadditional_settings;
          isOpen = isadditional_settingsOpen;
          break;
        case "pricing":
          toggleFunction = togglePricing;
          isOpen = isPricingOpen;
          break;
        default:
          return null;
      }
      return (
        <>
          <button
            onClick={toggleFunction}
            className={`flex items-center justify-between w-full text-sm py-3 px-3 rounded rounded-bl-xl transition-colors duration-200 ${
              isOpen || isActiveSubmenu
                ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            <span className="flex items-center">
              {item.icon}
              {item.label}
            </span>
            {isOpen ? (
              <FaChevronUp className="w-3 h-3" />
            ) : (
              <FaChevronDown className="w-3 h-3" />
            )}
          </button>
          <AnimatePresence>
            {isOpen && (
              <motion.ul
                className="ml-2 mt-1 space-y-1"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {filteredSubItems.map((subItem) => (
                  <li key={subItem.id}>
                    <NavLink
                      to={subItem.to}
                      className={({ isActive }) =>
                        `flex items-center justify-between w-full text-sm py-3 px-3 rounded rounded-bl-xl transition-colors duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white"
                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        }`
                      }
                      onClick={() => isMobile() && toggleSidebar()}
                    >
                      <span className="flex items-center">
                        {subItem.icon}
                        {subItem.label}
                      </span>
                    </NavLink>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </>
      );
    } else {
      if (!hasPermission(item.page, item.action)) return null;
      return (
        <NavLink
          to={item.to}
          className={({ isActive }) =>
            `flex items-center justify-between w-full text-sm py-3 px-3 rounded rounded-bl-xl transition-colors duration-200 ${
              isActive
                ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`
          }
          onClick={() => isMobile() && toggleSidebar()}
        >
          <span className="flex items-center">
            {item.icon}
            {item.label}
          </span>
        </NavLink>
      );
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      className="fixed top-0 left-0 w-72 h-screen bg-white shadow-lg flex flex-col z-50"
      initial={{ opacity: 0, x: "-100%" }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {isMobile() && (
        <div className="p-5 bg-gradient-to-br from-[#4c7085] to-[#6b8ca3] text-white border-b border-white/20">
          <div className="flex items-center gap-4">
            {userData.image ? (
              <img 
                src={userData.image} 
                alt="Profile" 
                className="w-14 h-14 rounded-full object-cover ring-4 ring-white/30"
                onError={(e) => { e.target.src = fallbackProfile; }}
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
                <AiOutlineUser className="w-8 h-8" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">Hello!</h3>
              <p className="text-sm opacity-90">@{userData.username}</p>
            </div>
          </div>
        </div>
      )}
      {!isMobile() && (
        <div className="p-4 flex items-center justify-center border-b border-gray-200">
          <img src={logo} className="w-full" alt="Prime Logo" />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {isMobile() ? (
          <ul className="space-y-2">
            {hasPermission("pricing", "view") && (
              <li>
                <button
                  onClick={togglePricing}
                  className={`w-full flex items-center justify-between text-sm py-4 px-4 rounded-lg transition-colors ${
                    isPricingOpen || location.pathname.startsWith("/pricing")
                      ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  <span className="flex items-center">
                    <AiOutlineDollar className="w-5 h-5 mr-3" />
                    Pricing
                  </span>
                  {isPricingOpen ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                <AnimatePresence>
                  {isPricingOpen && (
                    <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="ml-2 mt-2 space-y-1">
                      {hasPermission("local_move", "view") && (
                        <li>
                          <NavLink
                            to="/pricing/local-move"
                            className={({ isActive }) =>
                              `block py-3 px-4 rounded text-sm ${isActive ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`
                            }
                            onClick={() => toggleSidebar()}
                          >
                            Local Move
                          </NavLink>
                        </li>
                      )}
                      {hasPermission("international_move", "view") && (
                        <li>
                          <NavLink
                            to="/pricing/international-move"
                            className={({ isActive }) =>
                              `block py-3 px-4 rounded text-sm ${isActive ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`
                            }
                            onClick={() => toggleSidebar()}
                          >
                            International Move
                          </NavLink>
                        </li>
                      )}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            )}
            {hasPermission("additional_settings", "view") && (
              <li>
                <button
                  onClick={toggleadditional_settings}
                  className={`w-full flex items-center justify-between text-sm py-4 px-4 rounded-lg transition-colors ${
                    isadditional_settingsOpen || location.pathname.startsWith("/additional-settings")
                      ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  <span className="flex items-center">
                    <AiOutlineSliders className="w-5 h-5 mr-3" />
                    Additional Settings
                  </span>
                  {isadditional_settingsOpen ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                <AnimatePresence>
                  {isadditional_settingsOpen && (
                    <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="ml-2 mt-2 space-y-1">
                      {hasPermission("types", "view") && (
                        <li>
                          <NavLink to="/additional-settings/types" className={({ isActive }) => `block py-3 px-4 rounded text-sm ${isActive ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} onClick={() => toggleSidebar()}>
                            Types
                          </NavLink>
                        </li>
                      )}
                      {hasPermission("units", "view") && (
                        <li>
                          <NavLink to="/additional-settings/units" className={({ isActive }) => `block py-3 px-4 rounded text-sm ${isActive ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} onClick={() => toggleSidebar()}>
                            Units
                          </NavLink>
                        </li>
                      )}
                      {hasPermission("currency", "view") && (
                        <li>
                          <NavLink to="/additional-settings/currency" className={({ isActive }) => `block py-3 px-4 rounded text-sm ${isActive ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} onClick={() => toggleSidebar()}>
                            Currency
                          </NavLink>
                        </li>
                      )}
                      {hasPermission("tax", "view") && (
                        <li>
                          <NavLink to="/additional-settings/tax" className={({ isActive }) => `block py-3 px-4 rounded text-sm ${isActive ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} onClick={() => toggleSidebar()}>
                            Tax
                          </NavLink>
                        </li>
                      )}
                      {hasPermission("handyman", "view") && (
                        <li>
                          <NavLink to="/additional-settings/handyman" className={({ isActive }) => `block py-3 px-4 rounded text-sm ${isActive ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} onClick={() => toggleSidebar()}>
                            Handyman
                          </NavLink>
                        </li>
                      )}
                      {hasPermission("manpower", "view") && (
                        <li>
                          <NavLink to="/additional-settings/manpower" className={({ isActive }) => `block py-3 px-4 rounded text-sm ${isActive ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} onClick={() => toggleSidebar()}>
                            Manpower
                          </NavLink>
                        </li>
                      )}
                      {hasPermission("room", "view") && (
                        <li>
                          <NavLink to="/additional-settings/room" className={({ isActive }) => `block py-3 px-4 rounded text-sm ${isActive ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} onClick={() => toggleSidebar()}>
                            Room
                          </NavLink>
                        </li>
                      )}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            )}
            {hasPermission("users", "view") && (
              <li>
                <button
                  onClick={toggleUserRoles}
                  className={`w-full flex items-center justify-between text-sm py-4 px-4 rounded-lg transition-colors ${
                    isUserRolesOpen || location.pathname.startsWith("/user-roles")
                      ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  <span className="flex items-center">
                    <AiOutlineSafety className="w-5 h-5 mr-3" />
                    User Roles
                  </span>
                  {isUserRolesOpen ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                <AnimatePresence>
                  {isUserRolesOpen && (
                    <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="ml-2 mt-2 space-y-1">
                      {hasPermission("roles", "view") && (
                        <li>
                          <NavLink to="/user-roles/roles" className={({ isActive }) => `block py-3 px-4 rounded text-sm ${isActive ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} onClick={() => toggleSidebar()}>
                            Roles
                          </NavLink>
                        </li>
                      )}
                      {hasPermission("users", "view") && (
                        <li>
                          <NavLink to="/user-roles/users" className={({ isActive }) => `block py-3 px-4 rounded text-sm ${isActive ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} onClick={() => toggleSidebar()}>
                            Users
                          </NavLink>
                        </li>
                      )}
                      {hasPermission("permissions", "view") && (
                        <li>
                          <NavLink to="/user-roles/permissions" className={({ isActive }) => `block py-3 px-4 rounded text-sm ${isActive ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} onClick={() => toggleSidebar()}>
                            Permissions
                          </NavLink>
                        </li>
                      )}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            )}
            {hasPermission("Profile", "view") && (
              <li>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `flex items-center text-sm py-4 px-4 rounded-lg transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`
                  }
                  onClick={() => toggleSidebar()}
                >
                  <AiOutlineIdcard className="w-5 h-5 mr-3" />
                  Profile
                </NavLink>
              </li>
            )}
          </ul>
        ) : (
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>{renderMenuItem(item)}</li>
            ))}
          </ul>
        )}
      </nav>
      {isMobile() && (
        <div className="p-4 border-t border-gray-200 relative bottom-20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-4 text-[#4c7085] hover:text-[#6b8ca3] rounded-lg font-semibold transition"
          >
            <AiOutlineLogout className="w-5 h-5" />
            Logout
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default Sidebar;