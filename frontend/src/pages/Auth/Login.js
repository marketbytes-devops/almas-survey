import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import bgAuth from "../../assets/images/bg-auth.avif";
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
      className="min-h-screen bg-gray-100 flex items-center justify-end p-6"
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
      <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-md w-full max-w-sm">
        <div className="flex flex-col justify-center items-center mb-4">
          <h3 className="text-xl font-semibold text-[#4c7085] mb-2 opacity-90">
            Welcome Back!
          </h3>
          <p className="text-gray-600 text-center opacity-75">
            Log in to access your profile and manage your account securely.
          </p>
        </div>
        <h2 className="text-2xl text-[#4c7085] font-semibold mb-4 text-center">
          Login
        </h2>
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="submit" className="w-full">
              Login
            </Button>
            <div className="text-center">
              <Link
                to="/reset-password"
                className="text-sm text-gray-600 hover:text-[#4c7085]"
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
