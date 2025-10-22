import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import apiClient from "../../api/apiClient";
import bgAuth from "../../assets/images/bg-auth.avif";
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
      setMessage(response.data.message);
      setError("");
      setStep("reset_password");
      resetPasswordForm.setValue("email", data.email); // Carry over email to next step
    } catch (error) {
      setError(
        error.response?.data?.error || "Failed to send OTP. Please try again."
      );
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
      setMessage(response.data.message);
      setError("");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setError(
        error.response?.data?.error ||
          "Failed to reset password. Please try again."
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
            Reset Your Password
          </h3>
          <p className="text-gray-600 text-center opacity-75">
            Enter your email to receive an OTP, then set your new password
            securely.
          </p>
        </div>
        <h2 className="text-2xl font-semibold mb-4 text-center opacity-90">
          {step === "request_otp" ? "Request OTP" : "Reset Password"}
        </h2>
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        {message && (
          <p className="text-green-600 mb-4 text-center">{message}</p>
        )}
        {step === "request_otp" ? (
          <FormProvider {...requestOtpForm}>
            <form
              onSubmit={requestOtpForm.handleSubmit(onRequestOtpSubmit)}
              className="space-y-4"
            >
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
              <Button
                type="submit"
                className="w-full bg-gray-900 text-white hover:bg-gray-800"
              >
                Send OTP
              </Button>
            </form>
          </FormProvider>
        ) : (
          <FormProvider {...resetPasswordForm}>
            <form
              onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)}
              className="space-y-4"
            >
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
                label="OTP"
                name="otp"
                type="text"
                rules={{
                  required: "OTP is required",
                  pattern: {
                    value: /^\d{6}$/,
                    message: "OTP must be exactly 6 digits",
                  },
                }}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
              />
              <InputField
                label="New Password"
                name="newPassword"
                type="password"
                rules={{ required: "New password is required" }}
                placeholder="Enter new password"
              />
              <Button
                type="submit"
                className="w-full bg-gray-900 text-white hover:bg-gray-800"
              >
                Reset Password
              </Button>
            </form>
          </FormProvider>
        )}
        <div className="text-center pt-4">
          <Link
            to="/login"
            className="text-sm text-gray-600 hover:text-[#4c7085]"
          >
            Back to Login?
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ResetPassword;
