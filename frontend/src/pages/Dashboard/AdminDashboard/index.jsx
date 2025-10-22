import { NavLink } from "react-router";
import { motion } from "framer-motion";

const cardVariants = {
  hover: { scale: 1.05, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)" },
  rest: { scale: 1, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" },
};

const AdminDashboard = () => {
  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        {[
          {
            title: "New Enquiries",
            description: "View all new enquiries submitted to the system.",
            link: "/enquiries",
            buttonText: "View New Enquiries",
          },
          {
            title: "Processing Enquiries",
            description: "Enquiries assigned to salespersons and under processing.",
            link: "/processing-enquiries",
            buttonText: "View Processing Enquiries",
          },
          {
            title: "Follow Ups",
            description: "List all non-scheduled enquiries for all employees.",
            link: "/follow-ups",
            buttonText: "View Follow Ups",
          },
          {
            title: "Scheduled Surveys",
            description: "List all scheduled surveys for all employees.",
            link: "/scheduled-surveys",
            buttonText: "View Scheduled Surveys",
          },
        ].map((card, index) => (
          <motion.div
            key={index}
            className="bg-white shadow rounded-lg p-4 sm:p-6"
            variants={cardVariants}
            initial="rest"
            whileHover="hover"
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg sm:text-xl font-medium text-[#2d4a5e]">{card.title}</h3>
            <p className="text-sm text-gray-600 mt-2">{card.description}</p>
            <NavLink
              to={card.link}
              className="w-full mt-4 inline-block bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-sm font-medium py-2.5 px-4 rounded hover:bg-[#4c7085] text-center"
            >
              {card.buttonText}
            </NavLink>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;