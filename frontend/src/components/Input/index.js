import { useState } from "react";
import { useFormContext } from "react-hook-form";

const Input = ({ label, name, type = "text", options = [], rules = {}, onChange, readOnly, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const context = useFormContext();
  
  if (!context) {
    console.error(`Input component "${name}" must be used within a FormProvider`);
    return (
      <div className="text-red-500 text-sm">
        Error: Form context not found. Please ensure this component is wrapped in a FormProvider.
      </div>
    );
  }
  
  const {
    register,
    formState: { errors },
  } = context;
  const error = errors[name];
  const registered = register(name, rules);
  const handleInputChange = onChange
    ? (e) => {
        registered.onChange(e);
        onChange(e);
      }
    : registered.onChange;

  // Determine input type for password fields
  const getInputType = () => {
    if (type === "password") {
      return showPassword ? "text" : "password";
    }
    return type;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (readOnly && type === "text") {
    return (
      <div className="flex flex-col">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {rules.required && <span className="text-red-500"> *</span>}
          </label>
        )}
        <div
          className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors bg-gray-100 ${
            error ? "border-red-500" : ""
          }`}
        >
          {props.value || ""}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {type !== "checkbox" && label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {rules.required && <span className="text-red-500"> *</span>}
        </label>
      )}
      {type === "select" ? (
        <select
          {...registered}
          onChange={handleInputChange}
          className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${
            error ? "border-red-500" : ""
          }`}
          aria-label={label}
          {...props}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          {...registered}
          onChange={handleInputChange}
          className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${
            error ? "border-red-500" : ""
          }`}
          rows={4}
          aria-label={label}
          {...props}
        />
      ) : type === "checkbox" ? (
        <label className="flex items-center mt-1 cursor-pointer">
          <input
            type="checkbox"
            {...registered}
            onChange={handleInputChange}
            className={`h-4 w-4 text-indigo-500 focus:ring-indigo-500 border-gray-300 rounded ${
              error ? "border-red-500" : ""
            }`}
            {...props}
          />
          {label && (
            <span className="ml-2 text-sm text-gray-700">
              {label}
              {rules.required && <span className="text-red-500"> *</span>}
            </span>
          )}
        </label>
      ) : (
        <div className="relative">
          <input
            type={getInputType()}
            {...registered}
            onChange={handleInputChange}
            className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors pr-10 ${
              error ? "border-red-500" : ""
            }`}
            aria-label={label}
            {...props}
          />
          {/* Password Toggle Button */}
          {type === "password" && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                // Eye open icon (visible password)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                // Eye closed icon (hidden password)
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
};

export default Input;