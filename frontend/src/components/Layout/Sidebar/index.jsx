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
  AiOutlineLogout,
  AiTwotoneProfile,
  AiOutlineGlobal,
  AiOutlineFileText,
  AiOutlineDatabase
} from "react-icons/ai";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";
import logo from "../../../assets/images/logo.webp";
import apiClient from "../../../api/apiClient";
import fallbackProfile from "../../../assets/images/profile-icon.png";

const Sidebar = ({ toggleSidebar }) => {
  const location = useLocation();
  const [isUserRolesOpen, setIsUserRolesOpen] = useState(false);
  const [isAdditionalSettingsOpen, setIsAdditionalSettingsOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
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

  const toggle = (setter) => () => setter((prev) => !prev);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const allMenuItems = [
    { id: "dashboard", to: "/", label: "Dashboard", icon: <AiOutlineProject className="w-5 h-5" />, page: "Dashboard", action: "view" },
    { id: "enquiries", to: "/enquiries", label: "Enquiries", icon: <AiOutlineSearch className="w-5 h-5" />, page: "enquiries", action: "view" },
    { id: "new-enquiries", to: "/new-enquiries", label: "New Assigned", icon: <AiOutlineAliwangwang className="w-5 h-5" />, page: "new_enquiries", action: "view" },
    { id: "scheduled-surveys", to: "/scheduled-surveys", label: "Scheduled Surveys", icon: <AiOutlineCalendar className="w-5 h-5" />, page: "scheduled_surveys", action: "view" },
    { id: "survey_summary", to: "/survey/survey-summary", label: "Survey Summary", icon: <AiOutlineBarChart className="w-5 h-5" />, page: "survey_summary", action: "view" },
    { id: "quotation", to: "/quotation-list", label: "Quotation", icon: <AiOutlineFileText className="w-5 h-5" />, page: "quotation", action: "view" },
    { id: "booking", to: "/booking-list", label: "Book Move", icon: <AiTwotoneProfile className="w-5 h-5" />, page: "booking", action: "view" },
    { id: "inventory", to: "/inventory", label: "Inventory", icon: <AiOutlineDatabase className="w-5 h-5" />, page: "inventory", action: "view" },
    {
      id: "pricing",
      label: "Pricing",
      icon: <AiOutlineDollar className="w-5 h-5" />,
      isOpen: isPricingOpen,
      toggle: toggle(setIsPricingOpen),
      page: "pricing",
      action: "view",
      subItems: [
        { to: "/pricing/local-move", label: "Local Move", icon: <AiOutlineHome className="w-4 h-4" />, page: "local_move", action: "view" },
        { to: "/pricing/international-move", label: "International Move", icon: <AiOutlineGlobal className="w-4 h-4" />, page: "international_move", action: "view" },
      ],
    },
    {
      id: "additional-settings",
      label: "Additional Settings",
      icon: <AiOutlineSliders className="w-5 h-5" />,
      isOpen: isAdditionalSettingsOpen,
      toggle: toggle(setIsAdditionalSettingsOpen),
      page: "additional_settings",
      action: "view",
      subItems: [
        { to: "/additional-settings/types", label: "Types", icon: <AiOutlineTag className="w-4 h-4" />, page: "types", action: "view" },
        { to: "/additional-settings/units", label: "Units", icon: <AiOutlineLineHeight className="w-4 h-4" />, page: "units", action: "view" },
        { to: "/additional-settings/currency", label: "Currency", icon: <AiOutlineDollar className="w-4 h-4" />, page: "currency", action: "view" },
        { to: "/additional-settings/tax", label: "Tax", icon: <AiOutlinePercentage className="w-4 h-4" />, page: "tax", action: "view" },
        { to: "/additional-settings/handyman", label: "Handyman", icon: <AiOutlineTool className="w-4 h-4" />, page: "handyman", action: "view" },
        { to: "/additional-settings/manpower", label: "Manpower", icon: <AiOutlineUsergroupAdd className="w-4 h-4" />, page: "manpower", action: "view" },
        { to: "/additional-settings/room", label: "Room", icon: <AiOutlineHome className="w-4 h-4" />, page: "room", action: "view" },
        { to: "/additional-settings/additional-services", label: "Additional Services", icon: <AiTwotoneProfile className="w-4 h-4" />, page: "additional-services", action: "view" },
        { to: "/additional-settings/labours", label: "Labours", icon: <AiOutlineTeam className="w-4 h-4" />, page: "labours", action: "view" },
        { to: "/additional-settings/materials", label: "Materials", icon: <AiOutlineTag className="w-4 h-4" />, page: "materials", action: "view" },
      ],
    },
    {
      id: "user-roles",
      label: "User Roles",
      icon: <AiOutlineSafety className="w-5 h-5" />,
      isOpen: isUserRolesOpen,
      toggle: toggle(setIsUserRolesOpen),
      page: "users",
      action: "view",
      subItems: [
        { to: "/user-roles/roles", label: "Roles", icon: <AiOutlineLock className="w-4 h-4" />, page: "roles", action: "view" },
        { to: "/user-roles/users", label: "Users", icon: <AiOutlineUsergroupAdd className="w-4 h-4" />, page: "users", action: "view" },
        { to: "/user-roles/permissions", label: "Permissions", icon: <AiOutlineKey className="w-4 h-4" />, page: "permissions", action: "view" },
      ],
    },
    { id: "profile", to: "/profile", label: "Profile", icon: <AiOutlineIdcard className="w-5 h-5" />, page: "Profile", action: "view" },
  ];

  const mobileMenuItems = allMenuItems.filter(item =>
    item.id === "pricing" ||
    item.id === "additional-settings" ||
    item.id === "user-roles" ||
    item.id === "profile"
  );

  const menuItems = isMobile() ? mobileMenuItems : allMenuItems;

  const renderMenuItem = (item) => {
    if (item.subItems) {
      const visibleSubItems = item.subItems.filter((sub) => hasPermission(sub.page, sub.action));
      if (visibleSubItems.length === 0 && !hasPermission(item.page, item.action)) return null;

      const isActive = visibleSubItems.some((sub) => location.pathname.startsWith(sub.to.split("/")[1]));

      return (
        <div key={item.id}>
          <button
            onClick={item.toggle}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${item.isOpen || isActive
              ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white"
              : "text-gray-700 hover:bg-gray-100"
              }`}
          >
            <span className="flex items-center gap-3">
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </span>
            {item.isOpen ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
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
                        `flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm transition-all ${isActive
                          ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white font-medium"
                          : "text-gray-600 hover:bg-gray-100"
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
          `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive
            ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white"
            : "text-gray-700 hover:bg-gray-100"
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
    <div className="w-72 h-screen bg-white shadow-lg flex flex-col">
      {isMobile() && !isLoading && (
        <div className="p-5 bg-gradient-to-br from-[#4c7085] to-[#6b8ca3] text-white">
          <div className="flex items-center gap-4">
            <img
              src={user.image}
              alt="Profile"
              className="w-14 h-14 rounded-full object-cover ring-4 ring-white/30"
              onError={(e) => (e.target.src = fallbackProfile)}
            />
            <div>
              <h3 className="text-lg font-bold">Hello, {user.name}!</h3>
              <p className="text-xs mt-1 opacity-80">{user.role}</p>
            </div>
          </div>
        </div>
      )}
      {!isMobile() && (
        <div className="p-6 border-b border-gray-200">
          <img src={logo} alt="Logo" className="w-full max-w-[180px] mx-auto" />
        </div>
      )}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-2 text-sm">
          {menuItems.map(renderMenuItem)}
        </ul>
      </nav>
      {isMobile() && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition"
          >
            <AiOutlineLogout className="w-5 h-5" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;