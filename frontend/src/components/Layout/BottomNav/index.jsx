import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";
import {
  AiOutlineProject,
  AiOutlineSearch,
  AiOutlineAliwangwang,
  AiOutlineCalendar,
  AiOutlineBarChart,
  AiOutlineDollar,
  AiOutlineSliders,
  AiOutlineSafety,
  AiOutlineIdcard,
  AiOutlineFileText,
} from "react-icons/ai";

const BottomNav = () => {
  const location = useLocation();
  const [permissions, setPermissions] = useState([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get("/auth/profile/");
        const user = res.data;
        setIsSuperadmin(user.is_superuser || user.role?.name === "Superadmin");

        if (user.role?.id) {
          const roleRes = await apiClient.get(`/auth/roles/${user.role.id}/`);
          setPermissions(roleRes.data.permissions || []);
        }
      } catch (err) {
        console.error("Failed to load permissions for BottomNav", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const hasPermission = (page) => {
    if (isSuperadmin || isLoading) return isSuperadmin;
    return permissions.some(p => p.page === page && p.can_view);
  };

  const navItems = [
    { to: "/", label: "Home", icon: AiOutlineProject, page: "Dashboard" },
    { to: "/enquiries", label: "Enquiries", icon: AiOutlineSearch, page: "enquiries" },
    { to: "/new-enquiries", label: "New", icon: AiOutlineAliwangwang, page: "new_enquiries" },
    { to: "/scheduled-surveys", label: "Surveys", icon: AiOutlineCalendar, page: "scheduled_surveys" },
    { to: "/survey/survey-summary", label: "Summary", icon: AiOutlineBarChart, page: "survey_summary" },
    { to: "/quotation-list", label: "Quotes", icon: AiOutlineFileText, page: "quotation" },
  ];

  const visibleItems = navItems.filter(item => hasPermission(item.page));

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  if (visibleItems.length === 0 || isLoading) return null;

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 md:hidden"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex justify-start items-center min-w-max px-4 py-2 gap-6">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center min-w-[60px] py-2 relative"
              >
                <div className={`transition-all duration-300 ${active ? "scale-110" : "scale-100"}`}>
                  <Icon className={`w-6 h-6 ${active ? "text-[#4c7085]" : "text-gray-500"}`} />
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium transition-colors ${
                    active ? "text-[#4c7085]" : "text-gray-500"
                  }`}
                >
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="bottomNavActive"
                    className="absolute -top-1 w-8 h-1 bg-[#4c7085] rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
      <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </motion.div>
  );
};

export default BottomNav;