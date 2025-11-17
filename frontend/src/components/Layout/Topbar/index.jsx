import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaBars, FaSignOutAlt, FaCamera } from "react-icons/fa";
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
  const [imagePreview, setImagePreview] = useState(initialUser?.image || null);
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
      setImagePreview(res.data.image || previewUrl);
      setUser(prev => ({ ...prev, image: res.data.image }));
      showFeedback("success", "Profile picture updated!");
    } catch (err) {
      console.error("Upload failed:", err);
      setImagePreview(initialUser?.image || null);
      showFeedback("error", "Failed to update image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const showFeedback = (type, msg) => {
    setFeedback({ show: true, type, msg });
    setTimeout(() => setFeedback({ show: false, type: "", msg: "" }), 3000);
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) await apiClient.post("/auth/logout/", { refresh: refreshToken });
    } catch (err) { console.error(err); }
    finally {
      localStorage.clear();
      setIsAuthenticated(false);
      navigate("/login");
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white shadow-md sticky top-0 z-20">
        <div className="px-4 py-7 md:py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-white/20 transition shrink-0"
              aria-label="Toggle menu"
            >
              <FaBars className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <h1 className="text-sm font-medium truncate">{activePage}</h1>
          </div>
          <div className="flex items-center gap-3">
            {user?.username && (
              <span className="hidden xs:block text-sm font-light truncate max-w-[100px]">
                {user.username}
              </span>
            )}
            <div className="relative group">
              <label className="cursor-pointer block">
                <div className="relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                      <FaCamera className="w-5 h-5 text-white/70" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FaCamera className="w-5 h-5" />
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
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
                className="hidden sm:flex items-center gap-2 text-sm hover:text-red-200 transition"
              >
                <FaSignOutAlt />
                <span className="hidden md:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{
          y: feedback.show ? 80 : -50,
          opacity: feedback.show ? 1 : 0,
        }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        {feedback.show && (
          <div
            className={`px-6 py-3 rounded-full shadow-2xl font-medium text-white ${
              feedback.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {feedback.msg}
          </div>
        )}
      </motion.div>
    </>
  );
};

export default Topbar;