import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaBars, FaSignOutAlt, FaCamera, FaUser } from "react-icons/fa";
import apiClient from "../../../api/apiClient";
import { useNavigate, useLocation } from "react-router-dom";

import fallbackProfile from "../../../assets/images/profile-icon.png";

const routeNames = {
  "/": "Dashboard",
  "/enquiries": "Enquiries",
  "/new-enquiries": "New Assigned Enquiries",
  "/scheduled-surveys": "Scheduled Surveys",
  "/processing-enquiries": "Processing Enquiries",
  "/follow-ups": "Follow Ups",
  "/survey/survey-summary": "Survey Summary",
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

const Topbar = ({ toggleSidebar, isSidebarOpen, isAuthenticated, setIsAuthenticated, user: initialUser }) => {
  const [user, setUser] = useState(initialUser);
  const [imagePreview, setImagePreview] = useState(initialUser?.image || fallbackProfile);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState({ show: false, type: "", msg: "" });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState("Dashboard");

  useEffect(() => {
    const path = location.pathname;
    let matchedName = "Dashboard";

    if (path.includes("/survey/") && path.includes("/survey-details")) {
      matchedName = "Survey Details";
    } else if (path.includes("/survey/") && path.includes("/survey-summary")) {
      matchedName = "Survey Summary";
    } else if (routeNames[path]) {
      matchedName = routeNames[path];
    } else {
      const lastPart = path.split("/").filter(Boolean).pop() || "";
      matchedName = lastPart
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
    setActivePage(matchedName);
  }, [location.pathname]);

  useEffect(() => {
    if (initialUser?.image) {
      setImagePreview(initialUser.image);
    } else {
      setImagePreview(fallbackProfile);
    }
  }, [initialUser?.image]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await apiClient.put("/auth/profile/", formData);
      const newImage = res.data.image || previewUrl;
      setImagePreview(newImage);
      setUser(prev => ({ ...prev, image: newImage }));
      showFeedback("success", "Profile picture updated!");
    } catch (err) {
      console.error("Upload failed:", err);
      setImagePreview(initialUser?.image || fallbackProfile);
      showFeedback("error", "Failed to update image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const showFeedback = (type, msg) => {
    setFeedback({ show: true, type, msg });
    setTimeout(() => setFeedback({ show: false, type: "", msg: "" }), 4000);
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;

    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) await apiClient.post("/auth/logout/", { refresh: refreshToken });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white shadow-md sticky top-0 z-20">
        <div className="px-4 py-6.5 md:py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={toggleSidebar}
              className="p-3 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm shrink-0"
              aria-label="Toggle menu"
            >
              <FaBars className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block w-2 h-2 bg-white/70 rounded-full animate-pulse"></div>
              <h1 className="text-sm font-medium">
                {activePage}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.username && (
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-medium">
                  {user.username}
                </span>
                <span className="text-xs opacity-80">
                  {user.role?.name || "User"}
                </span>
              </div>
            )}
            <div className="relative group">
              <label className="cursor-pointer block">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-11 h-11 rounded-full object-cover ring-4 ring-white/30 shadow-lg transition-all group-hover:ring-white/50"
                    onError={(e) => {
                      e.target.src = fallbackProfile;
                    }}
                  />
                  <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <FaCamera className="w-5 h-5 text-white" />
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm font-medium text-sm"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: feedback.show ? 80 : -100,
          opacity: feedback.show ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        {feedback.show && (
          <div
            className={`px-8 py-4 rounded-2xl shadow-2xl font-bold text-white flex items-center gap-3 backdrop-blur-xl border ${
              feedback.type === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 border-green-300"
                : "bg-gradient-to-r from-red-500 to-rose-600 border-red-300"
            }`}
          >
            {feedback.type === "success" ? "Success" : "Error"}
            <span className="font-medium">{feedback.msg}</span>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default Topbar;