import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import apiClient from "../../api/apiClient";
import bgAuth from "../../assets/images/bg-auth.JPG";
import Button from "../../components/Button";
import { FormProvider, useForm } from "react-hook-form";
import InputField from "../../components/Input";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("request_otp");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const requestOtpForm = useForm({
    defaultValues: { email: "" },
  });

  const resetPasswordForm = useForm({
    defaultValues: { email: "", otp: "", newPassword: "" },
  });

  const onRequestOtpSubmit = async (data) => {
    try {
      const response = await apiClient.post("/auth/request-otp/", {
        email: data.email,
      });
      setMessage(response.data.message || "OTP sent successfully!");
      setError("");
      setStep("reset_password");
      resetPasswordForm.setValue("email", data.email);
    } catch (error) {
      setError(
        error.response?.data?.error || "Failed to send OTP. Please try again."
      );
      setMessage("");
    }
  };

  const onResetPasswordSubmit = async (data) => {
    if (!/^\d{6}$/.test(data.otp)) {
      setError("OTP must be exactly 6 digits");
      return;
    }

    try {
      const response = await apiClient.post("/auth/reset-password/", {
        email: data.email,
        otp: data.otp,
        new_password: data.newPassword,
      });

      setMessage(response.data.message || "Password reset successfully!");
      setError("");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setError(
        error.response?.data?.error ||
        "Invalid or expired OTP. Please try again."
      );
      setMessage("");
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
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md mx-auto lg:mx-0 lg:mr-12 p-6 sm:p-8 lg:p-10">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-medium text-[#4c7085] mb-2">
            {step === "request_otp" ? "Forgot Password?" : "Set New Password"}
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            {step === "request_otp"
              ? "Enter your email to receive a 6-digit OTP"
              : "Enter the OTP and your new password"}
          </p>
        </div>
        <h2 className="text-xl font-medium text-[#4c7085] text-center mb-6">
          {step === "request_otp" ? "Request OTP" : "Reset Password"}
        </h2>
        {error && (
          <p className="text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm text-center mb-6">
            {error}
          </p>
        )}
        {message && (
          <p className="text-green-600 bg-green-50 px-4 py-3 rounded-lg text-sm text-center mb-6 font-medium">
            {message}
          </p>
        )}
        {step === "request_otp" ? (
          <FormProvider {...requestOtpForm}>
            <form
              onSubmit={requestOtpForm.handleSubmit(onRequestOtpSubmit)}
              className="space-y-6"
            >
              <InputField
                label="Email Address"
                name="email"
                type="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address",
                  },
                }}
                placeholder="you@example.com"
              />

              <Button type="submit" className="w-full text-lg py-3">
                Send OTP
              </Button>
            </form>
          </FormProvider>
        ) : (
          <FormProvider {...resetPasswordForm}>
            <form
              onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)}
              className="space-y-6"
            >
              <InputField
                label="Email Address"
                name="email"
                type="email"
                disabled
                placeholder="your email (auto-filled)"
              />

              <InputField
                label="6-Digit OTP"
                name="otp"
                type="text"
                rules={{
                  required: "OTP is required",
                  pattern: {
                    value: /^\d{6}$/,
                    message: "OTP must be exactly 6 digits",
                  },
                }}
                placeholder="Enter OTP"
                maxLength={6}
              />

              <InputField
                label="New Password"
                name="newPassword"
                type="password"
                rules={{
                  required: "New password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                }}
                placeholder="••••••••"
              />

              <Button type="submit" className="w-full text-lg py-3">
                Reset Password
              </Button>
            </form>
          </FormProvider>
        )}
        <div className="text-center pt-6">
          <Link
            to="/login"
            className="text-sm sm:text-base text-gray-600 hover:text-[#4c7085] underline transition-colors font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ResetPassword;