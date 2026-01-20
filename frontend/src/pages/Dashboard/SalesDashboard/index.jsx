import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import apiClient from "../../../api/apiClient";
import { FiLoader } from "react-icons/fi";
import PageHeader from "../../../components/PageHeader";

const cardVariants = {
  hover: { scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.05)" },
  rest: { scale: 1, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.02)" },
};

const SalesDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    new: 0,
    processing: 0,
    scheduled: 0,
    followUps: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/contacts/enquiries/");
        const data = res.data || [];

        setStats({
          new: data.filter(e => !e.assigned_user).length,
          processing: data.filter(e => e.assigned_user && !e.survey_date).length,
          scheduled: data.filter(e => e.survey_date).length,
          followUps: data.filter(e => !e.has_survey && e.assigned_user).length
        });
      } catch (err) {
        console.error("Failed to fetch sales dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-[#4c7085]">
        <FiLoader className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  const cards = [
    {
      title: "New Enquiries",
      description: "Leads waiting to be assigned or initially contacted.",
      link: "/new-enquiries",
      count: stats.new,
      buttonText: `View ${stats.new} New`,
      color: "bg-blue-500"
    },
    {
      title: "Active Processing",
      description: "Leads currently being handled by staff.",
      link: "/processing-enquiries",
      count: stats.processing,
      buttonText: `View ${stats.processing} Processing`,
      color: "bg-green-500"
    },
    {
      title: "Scheduled Surveys",
      description: "Confirmed survey appointments for move assessment.",
      link: "/scheduled-surveys",
      count: stats.scheduled,
      buttonText: `View ${stats.scheduled} Scheduled`,
      color: "bg-purple-500"
    },
    {
      title: "Follow Ups",
      description: "Leads requiring contact before a survey can be scheduled.",
      link: "/follow-ups",
      count: stats.followUps,
      buttonText: `View ${stats.followUps} Follow-Ups`,
      color: "bg-amber-500"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Sales Dashboard"
        subtitle="Manage your leads and schedules efficiently"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col justify-between"
            variants={cardVariants}
            initial="rest"
            whileHover="hover"
            transition={{ duration: 0.2 }}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-medium text-gray-800">{card.title}</h3>
                <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${card.color}`}>
                  {card.count}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">{card.description}</p>
            </div>
            <NavLink
              to={card.link}
              className="w-full inline-block bg-[#4c7085] hover:bg-[#3d5a6b] text-white text-sm font-medium py-3.5 px-6 rounded-2xl text-center transition-all shadow-sm active:scale-[0.98]"
              aria-label={`View ${card.title}`}
            >
              {card.buttonText}
            </NavLink>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SalesDashboard;
