import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import apiClient from "../../api/apiClient";
import Loading from "../Loading";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

const routeNames = {
  "/": "Dashboard",
  "/enquiries": "Enquiries",
  "/new-enquiries": "New Assigned Enquiries",
  "/scheduled-surveys": "Scheduled Surveys",
  "/processing-enquiries": "Processing Enquiries",
  "/follow-ups": "Follow Ups",
  "/survey/:surveyId/survey-details": "Survey Details",
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

const Layout = ({ isAuthenticated, setIsAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;
      setIsOpen(isDesktop);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    apiClient
      .get("/auth/profile/")
      .then((res) => {
        setUser({
          username: res.data.username || "User",
          image: res.data.image || null,
        });
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsOpen(!isOpen);
    }
  };

  const getActivePage = () => {
    const path = location.pathname;
    for (const [route, name] of Object.entries(routeNames)) {
      if (route.includes(":surveyId")) {
        const regex = new RegExp(`^${route.replace(":surveyId", "[^/]+")}$`);
        if (regex.test(path)) return name;
      }
      if (path === route || path.startsWith(route + "/")) return name;
    }
    return "Dashboard";
  };

  const activePage = getActivePage();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <motion.aside
        className="fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl"
        initial={false}
        animate={{ x: isOpen ? 0 : -288 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Sidebar toggleSidebar={toggleSidebar} />
      </motion.aside>
      {isOpen && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 z-30 backdrop-brightness-50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out
          ${isOpen ? "md:ml-72" : "md:ml-0"}`}
      >
        <Topbar
          toggleSidebar={toggleSidebar}
          isOpen={isOpen}
          user={user}
          activePage={activePage}
          isAuthenticated={isAuthenticated}
          setIsAuthenticated={setIsAuthenticated}
        />

        <main className="flex-1 pb-20 md:pb-6 pt-4 px-4 sm:px-6 lg:px-8 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-screen">
              <Loading />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <BottomNav activePage={activePage} />
        </div>
      </div>
    </div>
  );
};

export default Layout;