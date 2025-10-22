import { useState, useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
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
import Loading from "./components/Loading";
import apiClient from "./api/apiClient";
import FollowUps from "./pages/FollowUps";
import ProcessingEnquiries from "./pages/ProcessingEnquiries";
import Profile from "./pages/AdditionalSettings/Profile";
import SurveyTypes from "./pages/AdditionalSettings/SurveyTypes";
import Units from "./pages/AdditionalSettings/Units";
import Currency from "./pages/AdditionalSettings/Currency";
import Tax from "./pages/AdditionalSettings/Tax";
import Handyman from "./pages/AdditionalSettings/Handyman";
import Manpower from "./pages/AdditionalSettings/Manpower";
import Room from "./pages/AdditionalSettings/Room";
import SurveySummary from "./pages/SurveySummary";
import SurveyDetails from "./pages/SurveyDetails";
import SurveyView from "./pages/SurveyView";
import SurveyPrint from "./pages/SurveyPrint";

const ProtectedRoute = ({ children, isAuthenticated, requiredPage, requiredAction = "view" }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await apiClient.get("/auth/profile/");
        const user = response.data;
        if (user.is_superuser || user.role?.name === "Superadmin") {
          setHasPermission(true);
          setIsLoading(false);
          return;
        }
        const roleId = user.role?.id;
        if (!roleId) {
          setHasPermission(false);
          setIsLoading(false);
          return;
        }
        const roleResponse = await apiClient.get(`/auth/roles/${roleId}/`);
        const perms = roleResponse.data.permissions || [];
        const pagePerm = perms.find((p) => p.page === requiredPage);
        if (!requiredPage || (pagePerm && pagePerm[`can_${requiredAction}`])) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkPermissions();
  }, [isAuthenticated, requiredPage, requiredAction]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  }
  if (!hasPermission) {
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
        <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="Dashboard">
          <Layout isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        </ProtectedRoute>
      ),
      errorElement: (
        <div className="flex justify-center items-center min-h-screen text-red-600">
          Something went wrong. Please try again or contact support.
        </div>
      ),
      children: [
        { index: true, element: <AdminDashboard /> },
        {
          path: "/enquiries",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="enquiries">
              <Enquiries />
            </ProtectedRoute>
          ),
        },
        {
          path: "/scheduled-surveys",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="scheduled_surveys">
              <ScheduledSurveys />
            </ProtectedRoute>
          ),
        },
        {
          path: "/new-enquiries",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="new_enquiries">
              <NewAssignedEnquiries />
            </ProtectedRoute>
          ),
        },
        {
          path: "/processing-enquiries",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="processing_enquiries">
              <ProcessingEnquiries />
            </ProtectedRoute>
          ),
        },
        {
          path: "/follow-ups",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="follow_ups">
              <FollowUps />
            </ProtectedRoute>
          ),
        },
        {
          path: "/survey/:surveyId/survey-details",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="survey_details">
              <SurveyDetails />
            </ProtectedRoute>
          ),
        },
        {
          path: "/survey/:surveyId/survey-summary",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="survey_summary">
              <SurveySummary />
            </ProtectedRoute>
          ),
        },
        {
          path: "/survey/survey-summary", 
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="survey_summary">
              <SurveySummary />
            </ProtectedRoute>
          ),
        },
        {
          path: "/survey/:surveyId/view",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="survey_summary">
              <SurveyView />
            </ProtectedRoute>
          ),
        },
        {
          path: "/survey/:surveyId/print",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="survey_summary">
              <SurveyView />
            </ProtectedRoute>
          ),
        },
        {
          path: "/additional-settings/types",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="types">
              <SurveyTypes />
            </ProtectedRoute>
          ),
        },
        {
          path: "/additional-settings/units",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="units">
              <Units />
            </ProtectedRoute>
          ),
        },
        {
          path: "/additional-settings/currency",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="currency">
              <Currency />
            </ProtectedRoute>
          ),
        },
        {
          path: "/additional-settings/tax",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="tax">
              <Tax />
            </ProtectedRoute>
          ),
        },
        {
          path: "/additional-settings/handyman",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="handyman">
              <Handyman />
            </ProtectedRoute>
          ),
        },
        {
          path: "/additional-settings/manpower",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="manpower">
              <Manpower />
            </ProtectedRoute>
          ),
        },
        {
          path: "/additional-settings/room",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="room">
              <Room />
            </ProtectedRoute>
          ),
        },
        {
          path: "/profile",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="Profile">
              <Profile />
            </ProtectedRoute>
          ),
        },
        {
          path: "/user-roles/users",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="users" requiredAction="view">
              <Users />
            </ProtectedRoute>
          ),
        },
        {
          path: "/user-roles/roles",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="roles" requiredAction="view">
              <Roles />
            </ProtectedRoute>
          ),
        },
        {
          path: "/user-roles/permissions",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredPage="permissions" requiredAction="view">
              <Permissions />
            </ProtectedRoute>
          ),
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;