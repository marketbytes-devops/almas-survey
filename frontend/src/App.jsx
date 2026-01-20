import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useState } from "react";
import "./index.css";
import Layout from "./components/Layout";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import Enquiries from "./pages/Enquiries";
import ScheduledSurveys from "./pages/ScheduledSurveys";
import NewAssignedEnquiries from "./pages/NewAssignedEnquiries";
import Login from "./pages/Auth/Login";
import ResetPassword from "./pages/Auth/ResetPassword";
import Users from "./pages/Admin/Users";
import Permissions from "./pages/Admin/Permissions";
import Roles from "./pages/Admin/Roles";
import FollowUps from "./pages/FollowUps";
import ProcessingEnquiries from "./pages/ProcessingEnquiries";
import Profile from "./pages/AdditionalSettings/Profile";
import SurveyTypes from "./pages/AdditionalSettings/SurveyTypes";
import Units from "./pages/AdditionalSettings/Units";
import Currency from "./pages/AdditionalSettings/Currency";
import Tax from "./pages/AdditionalSettings/Tax";
import Handyman from "./pages/AdditionalSettings/Handyman";
import ManpowerManagement from "./pages/Admin/ManpowerManagement";
import Room from "./pages/AdditionalSettings/Room";
import SurveySummary from "./pages/SurveySummary";
import SurveyDetails from "./pages/SurveyDetails";
import LocalMove from "./pages/Pricing/LocalMove";
import InternationalMove from "./pages/Pricing/InternationalMove";
import QuotationList from "./pages/Quotation/QuotationList";
import QuotationCreate from "./pages/Quotation/QuotationCreate";
import QuotationEdit from "./pages/Quotation/QuotationEdit";
import QuotationView from "./pages/Quotation/QuotationView";
import QuotationLocalMove from "./components/Templates/QuotationLocalMove";
import AdditionalServices from "./pages/AdditionalSettings/AdditionalService";
import Labours from "./pages/AdditionalSettings/Labours";
import Materials from "./pages/AdditionalSettings/Materials";
import BookingList from "./pages/Bookings/BookingList";
import BookingDetailView from "./pages/Bookings/BookingDetailView";
import BookingForm from "./pages/Bookings/BookingForm";
import Inventory from "./pages/Inventory";

// NEW: Permissions Context (global effective permissions)
import { PermissionsProvider, usePermissions } from "./components/PermissionsContext/PermissionsContext";

const ProtectedRoute = ({
  children,
  requiredPage,
  requiredAction = "view",
}) => {
  const { hasPermission, isLoadingPermissions, isSuperadmin } = usePermissions();

  // Show loading spinner while permissions are being fetched
  if (isLoadingPermissions) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#4c7085]"></div>
        <p className="ml-4 text-gray-600 font-medium">Loading permissions...</p>
      </div>
    );
  }

  // Final permission check using effective permissions (role + user overrides)
  const canAccess = isSuperadmin || (requiredPage ? hasPermission(requiredPage, requiredAction) : true);

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );

  const router = createBrowserRouter([
    {
      path: "/login",
      element: <Login setIsAuthenticated={setIsAuthenticated} />,
    },
    {
      path: "/reset-password",
      element: <ResetPassword />,
    },
    {
      path: "/",
      element: (
        <ProtectedRoute requiredPage="Dashboard">
          <Layout
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
          />
        </ProtectedRoute>
      ),
      errorElement: (
        <div className="flex justify-center items-center min-h-screen text-red-600 bg-gray-50">
          Something went wrong. Please try again or contact support.
        </div>
      ),
      children: [
        { index: true, element: <AdminDashboard /> },

        { path: "/enquiries", element: <ProtectedRoute requiredPage="enquiries"><Enquiries /></ProtectedRoute> },
        { path: "/scheduled-surveys", element: <ProtectedRoute requiredPage="scheduled_surveys"><ScheduledSurveys /></ProtectedRoute> },
        { path: "/new-enquiries", element: <ProtectedRoute requiredPage="new_enquiries"><NewAssignedEnquiries /></ProtectedRoute> },
        { path: "/processing-enquiries", element: <ProtectedRoute requiredPage="processing_enquiries"><ProcessingEnquiries /></ProtectedRoute> },
        { path: "/follow-ups", element: <ProtectedRoute requiredPage="follow_ups"><FollowUps /></ProtectedRoute> },

        { path: "/survey/:surveyId/survey-details", element: <ProtectedRoute requiredPage="survey_details"><SurveyDetails /></ProtectedRoute> },
        { path: "/survey/:surveyId/survey-summary", element: <ProtectedRoute requiredPage="survey_summary"><SurveySummary /></ProtectedRoute> },
        { path: "/survey/survey-summary", element: <ProtectedRoute requiredPage="survey_summary"><SurveySummary /></ProtectedRoute> },

        { path: "/booking-list", element: <ProtectedRoute requiredPage="booking"><BookingList /></ProtectedRoute> },
        { path: "/booking-detail/:id", element: <ProtectedRoute requiredPage="booking"><BookingDetailView /></ProtectedRoute> },
        { path: "/booking-form/:id?", element: <ProtectedRoute requiredPage="booking"><BookingForm /></ProtectedRoute> },
        { path: "/booking-form/quotation/:quotId", element: <ProtectedRoute requiredPage="booking"><BookingForm /></ProtectedRoute> },

        { path: "/pricing/local-move", element: <ProtectedRoute requiredPage="local_move"><LocalMove /></ProtectedRoute> },
        { path: "/pricing/international-move", element: <ProtectedRoute requiredPage="international_move"><InternationalMove /></ProtectedRoute> },

        { path: "/quotation-list", element: <ProtectedRoute requiredPage="quotation"><QuotationList /></ProtectedRoute> },
        { path: "/quotation-create/survey/:id", element: <ProtectedRoute requiredPage="quotation"><QuotationCreate /></ProtectedRoute> },
        { path: "/quotation-create/enquiry/:id", element: <ProtectedRoute requiredPage="quotation"><QuotationCreate /></ProtectedRoute> },
        { path: "/quotation-create/:id", element: <Navigate to="/quotation-list" replace /> },
        { path: "/quotation-edit/:id", element: <ProtectedRoute requiredPage="quotation"><QuotationEdit /></ProtectedRoute> },
        { path: "/quotation-view/:id", element: <ProtectedRoute requiredPage="quotation"><QuotationView /></ProtectedRoute> },
        { path: "/quotation-template-local-move", element: <ProtectedRoute requiredPage="quotation"><QuotationLocalMove /></ProtectedRoute> },

        { path: "/additional-settings/types", element: <ProtectedRoute requiredPage="types"><SurveyTypes /></ProtectedRoute> },
        { path: "/additional-settings/units", element: <ProtectedRoute requiredPage="units"><Units /></ProtectedRoute> },
        { path: "/additional-settings/currency", element: <ProtectedRoute requiredPage="currency"><Currency /></ProtectedRoute> },
        { path: "/additional-settings/tax", element: <ProtectedRoute requiredPage="tax"><Tax /></ProtectedRoute> },
        { path: "/additional-settings/handyman", element: <ProtectedRoute requiredPage="handyman"><Handyman /></ProtectedRoute> },
        { path: "/additional-settings/manpower", element: <ProtectedRoute requiredPage="manpower"><ManpowerManagement /></ProtectedRoute> },
        { path: "/additional-settings/room", element: <ProtectedRoute requiredPage="room"><Room /></ProtectedRoute> },
        { path: "/additional-settings/additional-services", element: <ProtectedRoute requiredPage="additional-services"><AdditionalServices /></ProtectedRoute> },
        { path: "/additional-settings/labours", element: <ProtectedRoute requiredPage="labours"><Labours /></ProtectedRoute> },
        { path: "/additional-settings/materials", element: <ProtectedRoute requiredPage="materials"><Materials /></ProtectedRoute> },

        { path: "/inventory", element: <ProtectedRoute requiredPage="inventory"><Inventory /></ProtectedRoute> },

        { path: "/profile", element: <ProtectedRoute requiredPage="Profile"><Profile /></ProtectedRoute> },

        { path: "/user-roles/users", element: <ProtectedRoute requiredPage="users" requiredAction="view"><Users /></ProtectedRoute> },
        { path: "/user-roles/roles", element: <ProtectedRoute requiredPage="roles" requiredAction="view"><Roles /></ProtectedRoute> },
        { path: "/user-roles/permissions", element: <ProtectedRoute requiredPage="permissions" requiredAction="view"><Permissions /></ProtectedRoute> },
      ],
    },
  ]);

  return (
    <PermissionsProvider>
      <RouterProvider router={router} />
    </PermissionsProvider>
  );
}

export default App;