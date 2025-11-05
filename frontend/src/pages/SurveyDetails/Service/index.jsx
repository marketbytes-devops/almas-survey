import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useParams } from "react-router";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import apiClient from "../../../api/apiClient";

const Input = ({ label, name, type = "text", options = [], rules = {}, ...props }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className="flex flex-col">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {rules.required && <span className="text-red-500"> *</span>}
        </label>
      )}
      {type === "select" ? (
        <select
          {...register(name, rules)}
          className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${error ? "border-red-500" : ""
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
          {...register(name, rules)}
          className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${error ? "border-red-500" : ""
            }`}
          rows={3}
          aria-label={label}
          placeholder="Enter notes..."
        />
      ) : type === "checkbox" ? (
        <label className="flex items-center mt-1 cursor-pointer">
          <input
            type="checkbox"
            {...register(name, rules)}
            className={`h-4 w-4 text-indigo-500 focus:ring-indigo-500 border-gray-300 rounded ${error ? "border-red-500" : ""
              }`}
            aria-label={label}
            {...props}
          />
          <span className="ml-2 text-sm text-gray-700">{label}</span>
        </label>
      ) : (
        <input
          type={type}
          {...register(name, rules)}
          className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${error ? "border-red-500" : ""
            }`}
          aria-label={label}
          {...props}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
};

const ServiceCheckbox = ({ label, name, rules = {}, notesName, notesRules = {} }) => {
  const { watch, setValue } = useFormContext();
  const isChecked = watch(name);
  const notesValue = watch(notesName);

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setValue(name, checked);
    if (!checked) {
      setValue(notesName, "");
    }
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          {...{ [name]: isChecked }}
          onChange={handleCheckboxChange}
          className="h-4 w-4 text-indigo-500 focus:ring-indigo-500 border-gray-300 rounded"
          aria-label={label}
        />
        <span className="ml-2 text-sm text-gray-700">{label}</span>
      </label>
      <AnimatePresence>
        {isChecked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Input
              label="Notes"
              name={notesName}
              type="textarea"
              rules={notesRules}
              placeholder="Enter additional notes..."
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Service = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const { customerData, articles = [], vehicles = [], pets = [] } = location.state || {};
  
  const methods = useForm({
    defaultValues: {
      // General Section
      generalOwnerPacked: false,
      generalOwnerPackedNotes: "",
      generalRestriction: false,
      generalRestrictionNotes: "",
      generalHandyman: false,
      generalHandymanNotes: "",
      generalInsurance: false,
      generalInsuranceNotes: "",

      // Origin Section
      originFloor: false,
      originFloorNotes: "",
      originLift: false,
      originLiftNotes: "",
      originParking: false,
      originParkingNotes: "",
      originStorage: false,
      originStorageNotes: "",

      // Destination Section
      destinationFloor: false,
      destinationFloorNotes: "",
      destinationLift: false,
      destinationLiftNotes: "",
      destinationParking: false,
      destinationParkingNotes: "",
    },
  });

  const { handleSubmit, watch, setValue } = methods;

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const onBack = () => {
    // Navigate back based on goods type
    const goodsType = customerData?.goodsType;
    if (goodsType === "pet") {
      navigate(`/survey/${surveyId}/pet`, {
        state: {
          customerData,
          pets,
        },
      });
    } else {
      navigate(`/survey/${surveyId}/article`, {
        state: {
          customerData,
          articles,
          vehicles,
        },
      });
    }
  };

  const onSubmit = async (serviceData) => {
    if (!customerData) {
      setError("Customer data is missing. Please go back and fill it.");
      return;
    }
    
    setIsLoading(true);
    try {
      // Prepare service payload with proper field mapping
      const servicePayload = {
        general_owner_packed: serviceData.generalOwnerPacked,
        general_owner_packed_notes: serviceData.generalOwnerPackedNotes,
        general_restriction: serviceData.generalRestriction,
        general_restriction_notes: serviceData.generalRestrictionNotes,
        general_handyman: serviceData.generalHandyman,
        general_handyman_notes: serviceData.generalHandymanNotes,
        general_insurance: serviceData.generalInsurance,
        general_insurance_notes: serviceData.generalInsuranceNotes,
        origin_floor: serviceData.originFloor,
        origin_floor_notes: serviceData.originFloorNotes,
        origin_lift: serviceData.originLift,
        origin_lift_notes: serviceData.originLiftNotes,
        origin_parking: serviceData.originParking,
        origin_parking_notes: serviceData.originParkingNotes,
        origin_storage: serviceData.originStorage,
        origin_storage_notes: serviceData.originStorageNotes,
        destination_floor: serviceData.destinationFloor,
        destination_floor_notes: serviceData.destinationFloorNotes,
        destination_lift: serviceData.destinationLift,
        destination_lift_notes: serviceData.destinationLiftNotes,
        destination_parking: serviceData.destinationParking,
        destination_parking_notes: serviceData.destinationParkingNotes,
      };

      // Save service data to survey
      await apiClient.patch(`/surveys/${surveyId}/`, servicePayload);

      // Save articles/vehicles/pets if they exist
      if (articles.length > 0) {
        await apiClient.post(`/surveys/${surveyId}/articles/`, { articles });
      }
      
      if (vehicles.length > 0) {
        await apiClient.post(`/surveys/${surveyId}/vehicles/`, { vehicles });
      }
      
      if (pets.length > 0) {
        await apiClient.post(`/surveys/${surveyId}/pets/`, { pets });
      }

      setMessage("All data saved successfully! Redirecting to summary...");
      
      // Navigate to summary after successful save
      setTimeout(() => {
        navigate(`/survey/${surveyId}/summary`, {
          state: {
            customerData,
            articles,
            vehicles,
            pets,
            serviceData,
          },
        });
      }, 2000);
      
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        "Failed to save data. Please try again.";
      console.error("Failed to save data:", error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sections = [
    {
      id: "general",
      title: "General",
      content: (
        <div className="grid grid-cols-1 gap-6">
          <ServiceCheckbox
            label="Any goods packed by the owner?"
            name="generalOwnerPacked"
            notesName="generalOwnerPackedNotes"
          />
          <ServiceCheckbox
            label="Is there any restriction on weight, volume, or budget?"
            name="generalRestriction"
            notesName="generalRestrictionNotes"
          />
          <ServiceCheckbox
            label="Do you require any handyman service at origin and destination?"
            name="generalHandyman"
            notesName="generalHandymanNotes"
          />
          <ServiceCheckbox
            label="Do you require insurance for your items?"
            name="generalInsurance"
            notesName="generalInsuranceNotes"
          />
        </div>
      ),
    },
    {
      id: "origin",
      title: "Origin",
      content: (
        <div className="grid grid-cols-1 gap-6">
          <ServiceCheckbox
            label="On which floor is your residence?"
            name="originFloor"
            notesName="originFloorNotes"
          />
          <ServiceCheckbox
            label="Is a lift available and allowed for use?"
            name="originLift"
            notesName="originLiftNotes"
          />
          <ServiceCheckbox
            label="Are there any parking restrictions?"
            name="originParking"
            notesName="originParkingNotes"
          />
          <ServiceCheckbox
            label="Is your destination house ready to occupy, or do you require a storage facility?"
            name="originStorage"
            notesName="originStorageNotes"
          />
        </div>
      ),
    },
    {
      id: "destination",
      title: "Destination",
      content: (
        <div className="grid grid-cols-1 gap-6">
          <ServiceCheckbox
            label="On which floor is your residence?"
            name="destinationFloor"
            notesName="destinationFloorNotes"
          />
          <ServiceCheckbox
            label="Is a lift available and allowed for use?"
            name="destinationLift"
            notesName="destinationLiftNotes"
          />
          <ServiceCheckbox
            label="Are there any parking restrictions?"
            name="destinationParking"
            notesName="destinationParkingNotes"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="max-full mx-auto">
      {error && (
        <motion.div
          className="mb-4 p-4 bg-red-100 text-red-700 rounded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}
      {message && (
        <motion.div
          className="mb-4 p-4 bg-green-100 text-green-700 rounded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {message}
        </motion.div>
      )}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {sections.map((section) => (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="group rounded-md shadow-inner w-full flex justify-between items-center p-4 text-left bg-gray-200 hover:bg-[#4c7085] transition-colors duration-300"
              >
                <span className="text-md font-medium text-gray-800 group-hover:text-white">{section.title}</span>
                {activeSection === section.id ? (
                  <FaChevronUp className="w-3 h-3 text-gray-600 group-hover:text-white" />
                ) : (
                  <FaChevronDown className="w-3 h-3 text-gray-600 group-hover:text-white" />
                )}
              </button>
              <AnimatePresence>
                {activeSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="p-4"
                  >
                    {section.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          <div className="mt-6 flex flex-col sm:flex-row sm:justify-end space-x-4">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-300"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-md hover:bg-[#6b8ca3] transition-colors duration-300 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save & Complete Survey"}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default Service;