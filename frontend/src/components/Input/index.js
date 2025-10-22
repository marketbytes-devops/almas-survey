import { useFormContext } from "react-hook-form";

const Input = ({ label, name, type = "text", options = [], rules = {}, onChange, readOnly, ...props }) => {
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
        <input
          type={type}
          {...registered}
          onChange={handleInputChange}
          className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${
            error ? "border-red-500" : ""
          }`}
          aria-label={label}
          {...props}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
};

export default Input;