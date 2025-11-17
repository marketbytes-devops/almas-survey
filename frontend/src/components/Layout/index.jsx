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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
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
          username: res.data.username,
          image: res.data.image || null,
        });
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

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
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 md:relative md:shadow-lg`}
        initial={false}
      >
        <Sidebar toggleSidebar={() => setSidebarOpen(false)} />
      </motion.aside>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 backdrop-brightness-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          user={user}
          activePage={activePage}
          isAuthenticated={isAuthenticated}
          setIsAuthenticated={setIsAuthenticated}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center min-h-screen">
              <Loading />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
        <BottomNav isAuthenticated={isAuthenticated} activePage={activePage} />
      </div>
    </div>
  );
};

export default Layout;