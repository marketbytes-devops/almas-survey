// Layout.jsx
import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../api/apiClient";
import Loading from "../Loading";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

const Layout = ({ isAuthenticated, setIsAuthenticated }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
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
        const data = res.data;
        setUser({
          name: data.name || "User",
          username: data.username || "user",
          role: data.role?.name || "User",
          image: data.image || null,
        });
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const isDesktop = window.innerWidth >= 1024;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-white overflow-hidden">
      <AnimatePresence>
        {sidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`${isDesktop ? "relative" : "fixed inset-y-0 left-0"} z-50 w-72 bg-white shadow-2xl`}
          >
            <Sidebar toggleSidebar={closeSidebar} user={user} />
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        animate={{
          scale: sidebarOpen && !isDesktop ? 0.96 : 1,
          borderRadius: sidebarOpen && !isDesktop ? "1.5rem" : "0",
          boxShadow: sidebarOpen && !isDesktop ? "0 20px 40px -10px rgba(0,0,0,0.3)" : "none",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <Topbar
          toggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          user={user}
          setIsAuthenticated={setIsAuthenticated}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-screen">
                <Loading />
              </div>
            ) : (
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            )}
          </div>
        </main>

        <BottomNav />
      </motion.div>
    </div>
  );
};

export default Layout;