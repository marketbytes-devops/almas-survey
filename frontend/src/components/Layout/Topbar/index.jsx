import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import apiClient from "../../../api/apiClient";
import { useNavigate, useLocation } from "react-router-dom";

const routeNames = {
  "/": "Dashboard",
  "/enquiries": "Enquiries",
  "/new-enquiries": "New Assigned Enquiries",
  "/scheduled-surveys": "Scheduled Surveys",
  "/processing-enquiries": "Processing Enquiries",
  "/follow-ups": "Follow Ups",
  "/survey/survey-summary": "Survey Summary",
  "/survey-summary": "Survey Summary", // Add this alternative path
  "/survey-details": "Survey Details", // Base path for survey details
  "/survey/:surveyId/view": "View Survey",
  "/survey/:surveyId/print": "Print Survey",
  "/additional-settings/types": "Types",
  "/additional-settings/units": "Units",
  "/additional-settings/currency": "Currency",
  "/additional-settings/tax": "Tax",
  "/additional-settings/handyman": "Handyman",
  "/additional-settings/manpower": "Manpower",
  "/additional-settings/room": "Room",
  "/user-roles/roles": "Roles",
  "/user-roles/users": "Users",
  "/user-roles/permissions": "Permissions",
  "/profile": "Profile",
};

const Topbar = ({ toggleSidebar, isSidebarOpen, isAuthenticated, setIsAuthenticated, user }) => {
  const [profileImage, setProfileImage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState("Dashboard");

  useEffect(() => {
    if (isAuthenticated && user?.image) {
      setProfileImage(user.image);
    } else if (isAuthenticated) {
      apiClient
        .get("/auth/profile/")
        .then((response) => {
          setProfileImage(response.data.image || null);
        })
        .catch((error) => {
          console.error("Error fetching profile image:", error);
        });
    }

    const path = location.pathname;
    let matchedName = "Dashboard"; // Default to Dashboard

    // Special handling for survey routes
    if (path.includes("/survey/") && path.includes("/survey-details")) {
      matchedName = "Survey Details";
    } else if (path.includes("/survey/") && path.includes("/survey-summary")) {
      matchedName = "Survey Summary";
    } else {
      // Exact match first
      if (routeNames[path]) {
        matchedName = routeNames[path];
      } else {
        // Fallback: extract the last part of the path for a better display
        const pathParts = path.split('/').filter(part => part);
        if (pathParts.length > 0) {
          const lastPart = pathParts[pathParts.length - 1];
          // Convert kebab-case to Title Case
          matchedName = lastPart
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
    }

    setActivePage(matchedName);
  }, [isAuthenticated, user, location.pathname]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await apiClient.post("/auth/logout/", { refresh: refreshToken });
      }
    } catch (error) {
      console.error("Logout failed:", error.response ? error.response.data : error.message);
    } finally {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("selectedSurveyId");
      setIsAuthenticated(false);
      navigate("/login");
    }
  };

  return (
    <div
      className={`bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] shadow px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10 rounded-b-lg ${isSidebarOpen ? "md:mx-6" : "mx-4 sm:mx-6"}`}
    >
      <div className="flex items-center space-x-4">
        <motion.button
          className="text-white p-2 rounded-md hover:bg-[#2d4a5e]/20"
          onClick={toggleSidebar}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <FaBars className="w-4 h-4 sm:w-4 sm:h-4" />
        </motion.button>
        <span className="text-white text-sm font-light truncate max-w-[150px] sm:max-w-none">
          {activePage}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        {isAuthenticated && user?.username ? (
          <span className="hidden sm:block text-white text-sm font-light truncate max-w-[150px] sm:max-w-none">
            {user.username}
          </span>
        ) : (
          <span className="hidden sm:block text-white text-sm font-light truncate max-w-[150px] sm:max-w-none">
            Guest
          </span>
        )}
        {isAuthenticated && profileImage ? (
          <img
            src={profileImage}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover"
            onError={() => setProfileImage(null)}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300"></div>
        )}
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 rounded text-sm text-white hover:text-gray-100 transition-colors duration-300"
          >
            <FaSignOutAlt size={16} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Topbar;