import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";
import {
  FiUsers,
  FiPieChart,
  FiActivity,
  FiShield,
  FiSearch,
  FiTarget,
  FiLoader
} from "react-icons/fi";
import PageHeader from "../../../components/PageHeader";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    unassigned: 0,
    processing: 0,
    activeStaff: 0,
    totalRoles: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch all enquiries
        const enquiryRes = await apiClient.get("/contacts/enquiries/");
        const allEnquiries = enquiryRes.data || [];

        // Fetch users
        const userRes = await apiClient.get("/auth/users/");
        const allUsers = userRes.data || [];

        // Fetch roles
        const roleRes = await apiClient.get("/auth/roles/");
        const allRoles = roleRes.data || [];

        const unassigned = allEnquiries.filter(e => !e.assigned_user).length;
        const processing = allEnquiries.filter(e => e.assigned_user).length;

        setStats({
          totalEnquiries: allEnquiries.length,
          unassigned,
          processing,
          activeStaff: allUsers.length,
          totalRoles: allRoles.length
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#4c7085]">
        <FiLoader className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Enquiries", value: stats.totalEnquiries, icon: <FiSearch />, color: "bg-blue-50 text-blue-600" },
    { label: "Unassigned", value: stats.unassigned, icon: <FiTarget />, color: "bg-amber-50 text-amber-600" },
    { label: "Processing", value: stats.processing, icon: <FiActivity />, color: "bg-green-50 text-green-600" },
    { label: "Active Staff", value: stats.activeStaff, icon: <FiUsers />, color: "bg-[#4c7085]/10 text-[#4c7085]" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Web Admin Dashboard"
        subtitle="Real-time MuvrCloud Insights"
        extra={
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-50">
            <FiActivity className="text-green-500 animate-pulse" />
            Live View
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 group hover:border-[#4c7085] transition-all duration-300">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center text-lg mb-3`}>
              {stat.icon}
            </div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-medium text-[#4c7085] mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Grid Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enquiry Management */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-50 rounded-lg">
                <FiSearch className="text-[#4c7085]" />
              </div>
              <h3 className="font-medium text-gray-800 text-lg">Enquiry Management</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">Manage and monitor all incoming move enquiries.</p>
          </div>

          <div className="p-6 flex-1 bg-gray-50/30 space-y-3">
            <NavLink to="/enquiries" className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#4c7085] transition-all group">
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#4c7085]">Browse All Enquiries</span>
              <span className="bg-[#4c7085]/10 text-[#4c7085] text-xs font-medium px-2.5 py-1 rounded-full">{stats.totalEnquiries}</span>
            </NavLink>
            <NavLink to="/processing-enquiries" className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#4c7085] transition-all group">
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#4c7085]">Assigned (Processing)</span>
              <span className="bg-green-50 text-green-600 text-xs font-medium px-2.5 py-1 rounded-full">{stats.processing}</span>
            </NavLink>
          </div>
        </div>

        {/* Governance & User Access */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-50 rounded-lg">
                <FiShield className="text-[#4c7085]" />
              </div>
              <h3 className="font-medium text-gray-800 text-lg">System Governance</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">Administer users, roles, and access controls.</p>
          </div>

          <div className="p-6 flex-1 bg-gray-50/30 space-y-3">
            <NavLink to="/user-roles/roles" className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#4c7085] transition-all group">
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#4c7085]">Roles & Permissions</span>
              <span className="bg-[#4c7085]/10 text-[#4c7085] text-xs font-medium px-2.5 py-1 rounded-full">{stats.totalRoles}</span>
            </NavLink>
            <NavLink to="/user-roles/users" className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#4c7085] transition-all group">
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#4c7085]">User Management</span>
              <span className="bg-[#4c7085]/10 text-[#4c7085] text-xs font-medium px-2.5 py-1 rounded-full">{stats.activeStaff}</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Placeholder for future Analytics */}
      <div className="bg-[#4c7085] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-md">
          <h2 className="text-xl font-medium mb-2">MuvrCloud Analytics</h2>
          <p className="text-blue-100 text-sm opacity-90 leading-relaxed">
            Analytics features for Conversion Ratios and Lost Reason Analysis are being integrated. Stay tuned for deeper data insights.
          </p>
        </div>
        <FiPieChart className="absolute bottom-10 right-10 text-[100px] opacity-10" />
      </div>
    </div>
  );
};

export default AdminDashboard;
