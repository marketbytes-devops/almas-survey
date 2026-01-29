import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../../api/apiClient";
import { usePermissions } from "../../../components/PermissionsContext/PermissionsContext";
import {
  FiUsers,
  FiPieChart,
  FiActivity,
  FiShield,
  FiSearch,
  FiTarget,
  FiLoader,
  FiClock,
  FiCalendar,
  FiLayers,
  FiCreditCard,
  FiTrendingUp
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import PageHeader from "../../../components/PageHeader";

const SERVICE_TYPE_MAP = {
  localMove: "Local Move",
  internationalMove: "Intl Move",
  carExport: "Car Export",
  storageServices: "Storage",
  logistics: "Logistics",
};

const CHART_COLORS = ['#ffffff', '#a7c4df', '#89a8c1', '#6b8ca3', '#cbd5e1'];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    unassigned: 0,
    processing: 0,
    followUps: 0,
    scheduledSurveys: 0,
    activeStaff: 0,
    totalRoles: 0
  });
  const [chartData, setChartData] = useState({
    trends: [],
    distribution: []
  });
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermissions();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const enquiryRes = await apiClient.get("/contacts/enquiries/");
        const allEnquiries = enquiryRes.data || [];

        // Fetch users (if permitted)
        let allUsers = [];
        if (hasPermission("users", "view")) {
          try {
            const userRes = await apiClient.get("/auth/users/");
            allUsers = userRes.data || [];
          } catch (e) { console.warn("Failed to fetch users stats"); }
        }

        // Fetch roles (if permitted)
        let allRoles = [];
        if (hasPermission("roles", "view")) {
          try {
            const roleRes = await apiClient.get("/auth/roles/");
            allRoles = roleRes.data || [];
          } catch (e) { console.warn("Failed to fetch roles stats"); }
        }

        const unassigned = allEnquiries.filter(e => !e.assigned_user_email).length;
        const processing = allEnquiries.filter(e => e.assigned_user_email && e.contact_status === "Under Processing").length;
        const followUps = allEnquiries.filter(e => !e.survey_date).length;
        const scheduledSurveys = allEnquiries.filter(e => e.survey_date).length;

        // Process Trends (Last 7 Days)
        const trends = [...Array(7)].map((_, i) => {
          const date = subDays(new Date(), i);
          return {
            date: format(date, 'MMM dd'),
            count: allEnquiries.filter(e => isSameDay(new Date(e.created_at), date)).length,
          };
        }).reverse();

        // Process Distribution
        const distMap = {};
        allEnquiries.forEach(e => {
          const type = e.serviceType || 'Other';
          distMap[type] = (distMap[type] || 0) + 1;
        });
        const distribution = Object.keys(distMap).map(key => ({
          name: SERVICE_TYPE_MAP[key] || key,
          value: distMap[key]
        })).sort((a, b) => b.value - a.value).slice(0, 5);

        setStats({
          totalEnquiries: allEnquiries.length,
          unassigned,
          processing,
          followUps,
          scheduledSurveys,
          activeStaff: allUsers.length,
          totalRoles: allRoles.length
        });

        setChartData({ trends, distribution });

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
    { label: "Follow Ups", value: stats.followUps, icon: <FiClock />, color: "bg-amber-50 text-amber-600" },
    { label: "Scheduled", value: stats.scheduledSurveys, icon: <FiCalendar />, color: "bg-purple-50 text-purple-600" },
    { label: "Active Staff", value: stats.activeStaff, icon: <FiUsers />, color: "bg-[#4c7085]/10 text-[#4c7085]" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Enquiry Management */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FiSearch className="text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-800 text-lg">Leads</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">Lead acquisition and assignment tracking.</p>
          </div>

          <div className="p-6 flex-1 bg-gray-50/30 space-y-3">
            <NavLink to="/enquiries" className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#4c7085] transition-all group">
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#4c7085]">All Enquiries</span>
              <span className="bg-[#4c7085]/10 text-[#4c7085] text-xs font-medium px-2.5 py-1 rounded-full">{stats.totalEnquiries}</span>
            </NavLink>
            <NavLink to="/new-enquiries" className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#4c7085] transition-all group">
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#4c7085]">Unassigned Enquiries</span>
              <span className="bg-amber-50 text-amber-600 text-xs font-medium px-2.5 py-1 rounded-full">{stats.unassigned}</span>
            </NavLink>
          </div>
        </div>

        {/* Survey & Follow-up Operations */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <FiTarget className="text-green-600" />
              </div>
              <h3 className="font-medium text-gray-800 text-lg">Operations</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">Managing follow-ups and survey schedules.</p>
          </div>

          <div className="p-6 flex-1 bg-gray-50/30 space-y-3">
            <NavLink to="/follow-ups" className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#4c7085] transition-all group">
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#4c7085]">Active Follow-Ups</span>
              <span className="bg-amber-50 text-amber-600 text-xs font-medium px-2.5 py-1 rounded-full">{stats.followUps}</span>
            </NavLink>
            <NavLink to="/scheduled-surveys" className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#4c7085] transition-all group">
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#4c7085]">Scheduled Surveys</span>
              <span className="bg-purple-50 text-purple-600 text-xs font-medium px-2.5 py-1 rounded-full">{stats.scheduledSurveys}</span>
            </NavLink>
          </div>
        </div>
        {/* System Administration */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-50 rounded-lg">
                <FiShield className="text-[#4c7085]" />
              </div>
              <h3 className="font-medium text-gray-800 text-lg">Governance</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">Administering roles and access controls.</p>
          </div>

          <div className="p-6 flex-1 bg-gray-50/30 space-y-3">
            <NavLink to="/user-roles/roles" className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#4c7085] transition-all group">
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#4c7085]">Roles & Permissions</span>
              <span className="bg-slate-50 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">{stats.totalRoles}</span>
            </NavLink>
            <NavLink to="/user-roles/users" className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#4c7085] transition-all group">
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#4c7085]">User Management</span>
              <span className="bg-slate-50 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">{stats.activeStaff}</span>
            </NavLink>
          </div>
        </div>

        {/* Inventory & Pricing */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FiLayers className="text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-800 text-lg">Assets</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">Managing items, rooms and pricing rules.</p>
          </div>

          <div className="p-6 flex-1 bg-gray-50/30 space-y-3">
            <NavLink to="/additional-settings/room" className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#4c7085] transition-all group">
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#4c7085]">Rooms & Items</span>
            </NavLink>
            <NavLink to="/additional-settings/additional-services" className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#4c7085] transition-all group">
              <span className="text-sm font-medium text-gray-600 group-hover:text-[#4c7085]">Additional Services</span>
            </NavLink>
          </div>
        </div>
        {/* Analytics - Area Chart */}
        <div className="lg:col-span-1 bg-[#4c7085] rounded-3xl p-6 shadow-sm border border-[#5d849b] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/10 rounded-lg">
              <FiTrendingUp className="text-white" />
            </div>
            <h3 className="font-medium text-white text-lg">Lead Velocity</h3>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.trends}>
                <defs>
                  <linearGradient id="colorTrends" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#e2e8f0', fontSize: 10 }}
                  dy={10}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorTrends)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Distribution - Pie Chart */}
        <div className="bg-[#4c7085] rounded-3xl p-6 shadow-sm border border-[#5d849b] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/10 rounded-lg">
              <FiPieChart className="text-white" />
            </div>
            <h3 className="font-medium text-white text-lg">Move Types</h3>
          </div>
          <div className="h-[180px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.distribution}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(255,255,255,0.2)" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 ml-4">
              {chartData.distribution.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                  <span className="text-[10px] text-blue-50 font-medium uppercase truncate max-w-[80px]">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

