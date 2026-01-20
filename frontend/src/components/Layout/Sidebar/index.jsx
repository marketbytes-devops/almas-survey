import { useLocation, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiGrid,
  FiSearch,
  FiPlusSquare,
  FiCalendar,
  FiBarChart2,
  FiFileText,
  FiPackage,
  FiTruck,
  FiBriefcase,
  FiDollarSign,
  FiSettings,
  FiUsers,
  FiUser,
  FiLogOut,
  FiChevronUp,
  FiChevronDown,
  FiTag,
  FiLayers,
  FiPercent,
  FiTool,
  FiHome,
  FiGlobe,
  FiShield,
  FiKey
} from "react-icons/fi";
import { BiBox, BiMoneyWithdraw } from "react-icons/bi";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";
// import logo from "../../../assets/images/logo.webp";
import apiClient from "../../../api/apiClient";
import fallbackProfile from "../../../assets/images/profile-icon.png";

const Sidebar = ({ toggleSidebar }) => {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState({
    name: "User",
    role: "User",
    image: fallbackProfile,
  });

  const isMobile = () => window.innerWidth <= 767;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile/");
        const data = response.data;

        setUser({
          name: data.name || "User",
          role: data.role?.name || "User",
          image: data.image || fallbackProfile,
        });

        setIsSuperadmin(data.is_superuser === true || data.role?.name === "Superadmin");

        const roleId = data.role?.id;
        if (roleId) {
          const res = await apiClient.get(`/auth/roles/${roleId}/`);
          setPermissions(res.data.permissions || []);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to load user data");
        setUser(prev => ({ ...prev, image: fallbackProfile }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    return perm?.[`can_${action}`] === true;
  };

  const handleToggle = (id) => {
    setOpenDropdown(prev => prev === id ? null : id);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const allMenuItems = [
    { id: "dashboard", to: "/", label: "Dashboard", icon: <FiGrid className="w-5 h-5" />, page: "Dashboard", action: "view" },
    { id: "enquiries", to: "/enquiries", label: "Enquiries", icon: <FiSearch className="w-5 h-5" />, page: "enquiries", action: "view" },
    { id: "new-enquiries", to: "/new-enquiries", label: "New Assigned", icon: <FiPlusSquare className="w-5 h-5" />, page: "new_enquiries", action: "view" },
    { id: "scheduled-surveys", to: "/scheduled-surveys", label: "Scheduled Surveys", icon: <FiCalendar className="w-5 h-5" />, page: "scheduled_surveys", action: "view" },
    { id: "survey_summary", to: "/survey/survey-summary", label: "Survey Summary", icon: <FiBarChart2 className="w-5 h-5" />, page: "survey_summary", action: "view" },
    { id: "quotation", to: "/quotation-list", label: "Quotation", icon: <FiFileText className="w-5 h-5" />, page: "quotation", action: "view" },
    { id: "booking", to: "/booking-list", label: "Booked Moves", icon: <FiBriefcase className="w-5 h-5" />, page: "booking", action: "view" },
    { id: "inventory", to: "/inventory", label: "Inventory", icon: <BiBox className="w-5 h-5" />, page: "inventory", action: "view" },
    {
      id: "pricing",
      label: "Pricing",
      icon: <FiDollarSign className="w-5 h-5" />,
      isOpen: openDropdown === "pricing",
      toggle: () => handleToggle("pricing"),
      page: "pricing",
      action: "view",
      subItems: [
        { to: "/pricing/local-move", label: "Local Move", icon: <FiHome className="w-3 h-3" />, page: "local_move", action: "view" },
        { to: "/pricing/international-move", label: "International Move", icon: <FiGlobe className="w-3 h-3" />, page: "international_move", action: "view" },
      ],
    },
    {
      id: "additional-settings",
      label: "Additional Settings",
      icon: <FiSettings className="w-5 h-5" />,
      isOpen: openDropdown === "additional-settings",
      toggle: () => handleToggle("additional-settings"),
      page: "additional_settings",
      action: "view",
      subItems: [
        { to: "/additional-settings/types", label: "Types", icon: <FiTag className="w-3 h-3" />, page: "types", action: "view" },
        { to: "/additional-settings/units", label: "Units", icon: <FiLayers className="w-3 h-3" />, page: "units", action: "view" },
        { to: "/additional-settings/currency", label: "Currency", icon: <BiMoneyWithdraw className="w-3 h-3" />, page: "currency", action: "view" },
        { to: "/additional-settings/tax", label: "Tax", icon: <FiPercent className="w-3 h-3" />, page: "tax", action: "view" },
        { to: "/additional-settings/handyman", label: "Handyman", icon: <FiTool className="w-3 h-3" />, page: "handyman", action: "view" },
        { to: "/additional-settings/manpower", label: "Manpower", icon: <HiOutlineUserGroup className="w-3 h-3" />, page: "manpower", action: "view" },
        { to: "/additional-settings/room", label: "Room", icon: <FiHome className="w-3 h-3" />, page: "room", action: "view" },
        { to: "/additional-settings/additional-services", label: "Additional Services", icon: <FiPlusSquare className="w-3 h-3" />, page: "additional-services", action: "view" },
        { to: "/additional-settings/labours", label: "Labours", icon: <FiUsers className="w-3 h-3" />, page: "labours", action: "view" },
        { to: "/additional-settings/materials", label: "Materials", icon: <FiPackage className="w-3 h-3" />, page: "materials", action: "view" },
      ],
    },
    {
      id: "user-roles",
      label: "User Roles",
      icon: <FiShield className="w-5 h-5" />,
      isOpen: openDropdown === "user-roles",
      toggle: () => handleToggle("user-roles"),
      page: "users",
      action: "view",
      subItems: [
        { to: "/user-roles/roles", label: "Roles", icon: <FiShield className="w-3 h-3" />, page: "roles", action: "view" },
        { to: "/user-roles/users", label: "Users", icon: <FiUsers className="w-3 h-3" />, page: "users", action: "view" },
        { to: "/user-roles/permissions", label: "Permissions", icon: <FiKey className="w-3 h-3" />, page: "permissions", action: "view" },
      ],
    },
    { id: "profile", to: "/profile", label: "Profile", icon: <FiUser className="w-5 h-5" />, page: "Profile", action: "view" },
  ];

  const excludedOnMobile = [
    "enquiries",
    "new-enquiries",
    "scheduled-surveys",
    "survey_summary",
    "quotation",
    "booking",
    "inventory",
    "dashboard",
    "profile"
  ];

  const menuItems = isMobile()
    ? allMenuItems.filter(item => !excludedOnMobile.includes(item.id))
    : allMenuItems;

  const renderMenuItem = (item) => {
    if (item.subItems) {
      const visibleSubItems = item.subItems.filter((sub) => hasPermission(sub.page, sub.action));
      if (visibleSubItems.length === 0 && !hasPermission(item.page, item.action)) return null;

      const isActive = visibleSubItems.some((sub) => location.pathname.startsWith(sub.to.split("/")[1]));

      return (
        <div key={item.id}>
          <button
            onClick={item.toggle}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${item.isOpen || isActive
              ? "bg-[#4c7085] text-white shadow-md shadow-[#4c7085]/10"
              : "text-gray-600 hover:bg-gray-50/80"
              }`}
          >
            <span className="flex items-center gap-3">
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </span>
            {item.isOpen ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
          </button>

          <AnimatePresence>
            {item.isOpen && visibleSubItems.length > 0 && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="ml-8 mt-2 space-y-1"
              >
                {visibleSubItems.map((sub) => (
                  <li key={sub.to}>
                    <NavLink
                      to={sub.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all ${isActive
                          ? "bg-[#6b8ca3]/10 text-[#4c7085] font-medium"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }`
                      }
                      onClick={() => isMobile() && toggleSidebar()}
                    >
                      {sub.icon}
                      <span>{sub.label}</span>
                    </NavLink>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (!hasPermission(item.page, item.action)) return null;

    return (
      <NavLink
        key={item.id}
        to={item.to}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium text-sm ${isActive
            ? "bg-[#4c7085] text-white shadow-md shadow-[#4c7085]/10"
            : "text-gray-600 hover:bg-gray-50/80"
          }`
        }
        onClick={() => isMobile() && toggleSidebar()}
      >
        {item.icon}
        <span>{item.label}</span>
      </NavLink>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50 text-red-600">
        <p className="text-lg font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-72 h-screen bg-white flex flex-col border-r border-gray-100">
      {isMobile() && !isLoading && (
        <div className="p-6 bg-[#4c7085] text-white">
          <div className="flex items-center gap-4">
            <img
              src={user.image}
              alt="Profile"
              className="w-14 h-14 rounded-full object-cover ring-4 ring-white/30"
              onError={(e) => (e.target.src = fallbackProfile)}
            />
            <div>
              <h3 className="text-lg font-semibold">Hello, {user.name}!</h3>
              <p className="text-xs mt-1 opacity-80">{user.role}</p>
            </div>
          </div>
        </div>
      )}
      {!isMobile() && (
        <div className="p-8 border-b border-gray-50 flex flex-col items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#4c7085] to-[#6b8ca3] flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-xl">M</span>
            </div>
            <h1 className="text-2xl tracking-tighter text-[#4c7085]">
              <span className="font-semibold">Muvr</span>
              <span className="font-light text-[#6b8ca3]">Cloud</span>
            </h1>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-2 font-medium">Logistics Management</p>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-2 text-sm">
          {menuItems.map(renderMenuItem)}
        </ul>
      </nav>
      {isMobile() && (
        <div className="p-4 relative bottom-20 mt-auto border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-3 text-red-500 hover:bg-red-50 rounded-xl font-medium transition text-xs uppercase tracking-widest"
          >
            <FiLogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;