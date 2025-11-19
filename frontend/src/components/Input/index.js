import { useState } from "react";
import { useFormContext } from "react-hook-form";

const Input = ({ 
  label, 
  name, 
  type = "text", 
  options = [], 
  rules = {}, 
  onChange, 
  value: controlledValue, 
  readOnly, 
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const context = useFormContext(); 

  const error = context?.formState?.errors?.[name];
  const isControlled = controlledValue !== undefined || onChange;

  const getInputType = () => {
    if (type === "password") return showPassword ? "text" : "password";
    return type;
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  if (readOnly && type === "text") {
    return (
      <div className="flex flex-col">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {rules.required && <span className="text-red-500"> *</span>}
          </label>
        )}
        <div className={`px-3 py-2 text-sm border rounded bg-gray-100 ${error ? "border-red-500" : "border-gray-300"}`}>
          {controlledValue || props.defaultValue || ""}
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
      </div>
    );
  }

  const inputProps = {
    ...props,
    className: `w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-colors ${
      error ? "border-red-500" : "border-gray-300 focus:border-indigo-500"
    } ${type === "password" ? "pr-10" : ""}`,
  };

  if (context && name && !isControlled) {
    const { register } = context;
    const registered = register(name, rules);

    return (
      <div className="flex flex-col">
        {type !== "checkbox" && label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {rules.required && <span className="text-red-500"> *</span>}
          </label>
        )}

          {type === "select" ? (
            <select {...registered} {...inputProps}>
              <option value="">Select an option</option>
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : type === "textarea" ? (
            <textarea {...registered} {...inputProps} rows={4} />
          ) : type === "checkbox" ? (
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" {...registered} className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
              <span className="ml-2 text-sm text-gray-700">
                {label}
                {rules.required && <span className="text-red-500"> *</span>}
              </span>
            </label>
          ) : (
            <div className="relative">
              <input type={getInputType()} {...registered} {...inputProps} />
              {type === "password" && (
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
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
  }

  return (
    <div className="flex flex-col">
      {type !== "checkbox" && label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {type === "select" ? (
        <select
          value={controlledValue}
          onChange={onChange}
          {...inputProps}
        >
          <option value="">Select an option</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea value={controlledValue} onChange={onChange} {...inputProps} rows={4} />
      ) : type === "checkbox" ? (
        <label className="flex items-center cursor-pointer">
          <input type="checkbox" checked={controlledValue} onChange={onChange} className="h-4 w-4 text-indigo-600 rounded" />
          <span className="ml-2 text-sm text-gray-700">{label}</span>
        </label>
      ) : (
        <div className="relative">
          <input
            type={getInputType()}
            value={controlledValue}
            onChange={onChange}
            {...inputProps}
          />
          {type === "password" && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
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