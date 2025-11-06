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
} from "react-icons/ai";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";
import logo from "../../../assets/images/logo.webp";
import apiClient from "../../../api/apiClient";

const Sidebar = ({ toggleSidebar }) => {
  const location = useLocation();
  const [isUserRolesOpen, setIsUserRolesOpen] = useState(false);
  const [isadditional_settingsOpen, setIsadditional_settingsOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false); // New state for Pricing section
  const [permissions, setPermissions] = useState([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [surveyId, setSurveyId] = useState(localStorage.getItem("selectedSurveyId") || null);
  const [goodsType, setGoodsType] = useState(localStorage.getItem("goodsType") || "article");

  useEffect(() => {
    const fetchProfile = async () => {
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
    const handleStorageChange = () => {
      const newGoodsType = localStorage.getItem("goodsType") || "article";
      setGoodsType(newGoodsType);
      const newSurveyId = localStorage.getItem("selectedSurveyId") || null;
      setSurveyId(newSurveyId);
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("goodsTypeChanged", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("goodsTypeChanged", handleStorageChange);
    };
  }, []);

  const hasPermission = (page, action) => {
    if (isSuperadmin) return true;
    const perm = permissions.find((p) => p.page === page);
    const hasPerm = perm && perm[`can_${action}`];
    if (!hasPerm) {
      console.log(`No permission for page: ${page}, action: ${action}`);
    }
    return hasPerm;
  };

  const toggleUserRoles = () => setIsUserRolesOpen(!isUserRolesOpen);
  const toggleadditional_settings = () => setIsadditional_settingsOpen(!isadditional_settingsOpen);
  const togglePricing = () => setIsPricingOpen(!isPricingOpen); // Toggle function for Pricing section

  const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

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
      to: "/quotation",
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
        {
          id: "types",
          to: "/additional-settings/types",
          label: "Types",
          icon: <AiOutlineTag className="w-4 h-4 mr-3" />,
          page: "types",
          action: "view",
        },
        {
          id: "units",
          to: "/additional-settings/units",
          label: "Units",
          icon: <AiOutlineLineHeight className="w-4 h-4 mr-3" />,
          page: "units",
          action: "view",
        },
        {
          id: "currency",
          to: "/additional-settings/currency",
          label: "Currency",
          icon: <AiOutlineDollar className="w-4 h-4 mr-3" />,
          page: "currency",
          action: "view",
        },
        {
          id: "tax",
          to: "/additional-settings/tax",
          label: "Tax",
          icon: <AiOutlinePercentage className="w-4 h-4 mr-3" />,
          page: "tax",
          action: "view",
        },
        {
          id: "handyman",
          to: "/additional-settings/handyman",
          label: "Handyman",
          icon: <AiOutlineTool className="w-4 h-4 mr-3" />,
          page: "handyman",
          action: "view",
        },
        {
          id: "manpower",
          to: "/additional-settings/manpower",
          label: "Manpower",
          icon: <AiOutlineTeam className="w-4 h-4 mr-3" />,
          page: "manpower",
          action: "view",
        },
        {
          id: "room",
          to: "/additional-settings/room",
          label: "Room",
          icon: <AiOutlineHome className="w-4 h-4 mr-3" />,
          page: "room",
          action: "view",
        },
      ],
    },
    {
      id: "user-roles",
      label: "User Roles",
      icon: <AiOutlineSafety className="w-4 h-4 mr-3" />,
      page: "users",
      action: "view",
      subItems: [
        {
          id: "roles",
          to: "/user-roles/roles",
          label: "Roles",
          icon: <AiOutlineLock className="w-4 h-4 mr-3" />,
          page: "roles",
          action: "view",
        },
        {
          id: "users",
          to: "/user-roles/users",
          label: "Users",
          icon: <AiOutlineUsergroupAdd className="w-4 h-4 mr-3" />,
          page: "users",
          action: "view",
        },
        {
          id: "permissions",
          to: "/user-roles/permissions",
          label: "Permissions",
          icon: <AiOutlineKey className="w-4 h-4 mr-3" />,
          page: "permissions",
          action: "view",
        },
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
            className={`flex items-center justify-between w-full text-sm py-3 px-3 rounded rounded-bl-xl transition-colors duration-200 ${isOpen || isActiveSubmenu
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
                        `flex items-center justify-between w-full text-sm py-3 px-3 rounded rounded-bl-xl transition-colors duration-200 ${isActive
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
            `flex items-center justify-between w-full text-sm py-3 px-3 rounded rounded-bl-xl transition-colors duration-200 ${isActive
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
      <div className="p-4 flex items-center justify-center border-b border-gray-200">
        <img src={logo} className="w-full" alt="Prime Logo" />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>{renderMenuItem(item)}</li>
          ))}
        </ul>
      </nav>
    </motion.div>
  );
};

export default Sidebar;
