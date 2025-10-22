import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import apiClient from "../../api/apiClient";
import Loading from "../Loading";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

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

  const getActivePage = () => {
    const path = location.pathname;
    for (const [route, name] of Object.entries(routeNames)) {
      if (route.includes(":surveyId")) {
        const regex = new RegExp(`^${route.replace(":surveyId", "[^/]+")}$`);
        if (regex.test(path)) {
          return name;
        }
      }
      if (path === route) {
        return name;
      }
    }
    return "Dashboard";
  };

  const activePage = getActivePage();

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      apiClient
        .get("/auth/profile/")
        .then((response) => {
          setUser({
            username: response.data.username,
            image: response.data.image,
          });
        })
        .catch((error) => {
          console.error("Error fetching user:", error);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <motion.div
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-white shadow-lg transform ${isOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 ease-in-out`}
        initial={{ opacity: 0, x: "-100%" }}
        animate={{ opacity: 1, x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.1 }}
      >
        <Sidebar toggleSidebar={toggleSidebar} />
      </motion.div>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black opacity-50 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${isOpen ? "md:ml-72" : "md:ml-0"
          }`}
      >
        <Topbar
          toggleSidebar={toggleSidebar}
          isOpen={isOpen}
          isAuthenticated={isAuthenticated}
          setIsAuthenticated={setIsAuthenticated}
          user={user}
          activePage={activePage}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center min-h-screen">
              <Loading />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;