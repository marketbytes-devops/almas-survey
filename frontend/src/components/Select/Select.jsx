import React from "react";
import { useFormContext } from "react-hook-form";

const Select = ({
  label,
  name,
  options = [],
  rules = {},
  disabled = false,
  className = "",
  onChange, // Add onChange prop for standalone usage
  value, // Add value prop for standalone usage
  ...props
}) => {
  // Check if we're inside a FormProvider
  const formContext = useFormContext();

  // If we're inside a form, use form methods, otherwise use standalone props
  const isInsideForm = !!formContext;

  if (isInsideForm) {
    // Inside Form - use react-hook-form
    const {
      register,
      formState: { errors },
    } = formContext;

    const error = errors[name];

    return (
      <div className="mb-4">
        {label && (
          <label
            htmlFor={name}
            className="block text-sm font-medium text-gray-600 mb-1.5 ml-1"
          >
            {label}
            {rules.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          id={name}
          {...register(name, rules)}
          disabled={disabled}
          className={`input-style ${error ? "!border-red-500 !ring-red-200" : ""} ${className}`}
          {...props}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error.message}</p>
        )}
      </div>
    );
  } else {
    // Outside Form - use standalone mode
    return (
      <div className="mb-4">
        {label && (
          <label
            htmlFor={name}
            className="block text-sm font-medium text-gray-600 mb-1.5 ml-1"
          >
            {label}
          </label>
        )}
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input-style ${className}`}
          {...props}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
};

export default Select;