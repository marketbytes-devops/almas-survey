import { useState } from "react";
import { Link, useNavigate } from "react-router"; 
import { motion } from "framer-motion";
import bgAuth from "../../assets/images/bg-auth.webp";
import Button from "../../components/Button";
import apiClient from "../../api/apiClient";
import { FormProvider, useForm } from "react-hook-form";
import InputField from "../../components/Input";

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const methods = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { handleSubmit } = methods;

  const onSubmit = async (data) => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("isAuthenticated");

    try {
      const response = await apiClient.post("/auth/login/", {
        email: data.email,
        password: data.password,
      });

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      setIsAuthenticated(true);
      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.error ||
          "Login failed. Please check your credentials and try again."
      );
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-100 flex items-center justify-center lg:justify-end p-4 sm:p-6 lg:p-12"
      style={{
        backgroundImage: `url(${bgAuth})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Card - responsive width */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md mx-auto lg:mx-0 lg:mr-12 p-6 sm:p-8 lg:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-medium text-[#4c7085] mb-2">
            Welcome Back!
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Log in to access your profile and manage your account securely.
          </p>
        </div>

        <h2 className="text-xl font-medium text-[#4c7085] text-center mb-6">
          Login
        </h2>

        {/* Error message */}
        {error && (
          <p className="text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm text-center mb-6">
            {error}
          </p>
        )}

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <InputField
              label="Email"
              name="email"
              type="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email",
                },
              }}
              placeholder="Enter your email"
            />

            <InputField
              label="Password"
              name="password"
              type="password"
              rules={{ required: "Password is required" }}
              placeholder="Enter your password"
            />

            <Button type="submit" className="w-full text-lg py-3">
              Login
            </Button>

            <div className="text-center pt-4">
              <Link
                to="/reset-password"
                className="text-sm sm:text-base text-gray-600 hover:text-[#4c7085] underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </form>
        </FormProvider>
      </div>
    </motion.div>
  );
};

export default Login;