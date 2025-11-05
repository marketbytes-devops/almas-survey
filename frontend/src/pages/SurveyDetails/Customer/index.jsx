import { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaPlus, FaMinus } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useParams, useNavigate } from "react-router";
import apiClient from "../../../api/apiClient";
import Loading from "../../../components/Loading";
import Input from "../../../components/Input";

const DatePickerInput = ({ label, name, rules = {}, isTimeOnly = false }) => {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();
  const value = watch(name);
  const error = errors[name];
  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {rules.required && <span className="text-red-500"> *</span>}
      </label>
      <DatePicker
        selected={value}
        onChange={(date) => setValue(name, date, { shouldValidate: true })}
        showTimeSelect={isTimeOnly}
        showTimeSelectOnly={isTimeOnly}
        timeIntervals={15}
        timeCaption="Time"
        dateFormat={isTimeOnly ? "h:mm aa" : "MM/dd/yyyy"}
        className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${error ? "border-red-500" : ""
          }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
};

const Customer = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);
  const [destinationAddresses, setDestinationAddresses] = useState([{}]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const methods = useForm({
    defaultValues: {
      customerType: "",
      isMilitary: false,
      salutation: "",
      firstName: "",
      middleName: "",
      lastName: "",
      mobileCountryCode: "",
      mobileNumber: "",
      email: "",
      address: "",
      company: "",
      surveyId: "",
      serviceType: "",
      goodsType: "",
      status: "",
      surveyDate: null,
      surveyStartTime: null,
      surveyEndTime: null,
      workDescription: "",
      includeVehicle: false,
      includePet: false,
      costTogetherVehicle: false,
      costTogetherPet: false,
      sameAsCustomerAddress: false,
      originAddress: "",
      originCity: "",
      originCountry: "",
      originState: "",
      originZip: "",
      podPol: "",
      multipleAddresses: false,
      destinationAddresses: [
        {
          address: "",
          city: "",
          country: "",
          state: "",
          zip: "",
          poe: "",
        },
      ],
      packingDateFrom: null,
      packingDateTo: null,
      loadingDate: null,
      eta: null,
      etd: null,
      estDeliveryDate: null,
      storageStartDate: null,
      storageFrequency: "",
      storageDuration: "",
      storageMode: "",
      transportMode: "road",
    },
  });

  const { handleSubmit, watch, setValue, reset, getValues } = methods;

  const goodsType = watch("goodsType");

  useEffect(() => {
    localStorage.setItem("goodsType", goodsType);
    window.dispatchEvent(new Event("goodsTypeChanged"));
  }, [goodsType]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const [customerResponse, serviceResponse] = await Promise.all([
          apiClient.get("/customer-types/"),
          apiClient.get("/service-types/"),
        ]);
        setCustomerTypes(
          customerResponse.data.map((type) => ({
            value: type.name,
            label: type.name,
          }))
        );
        setServiceTypes(
          serviceResponse.data.map((type) => ({
            value: type.name,
            label: type.name,
          }))
        );
      } catch (err) {
        setError("Failed to fetch types. Please try again.");
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const fetchSurveyData = async () => {
      if (surveyId) {
        setIsLoading(true);
        try {
          const response = await apiClient.get(`/surveys/${surveyId}/`);
          const surveyData = response.data;
          
          // Format destination addresses
          const formattedDestinationAddresses = surveyData.destination_addresses && surveyData.destination_addresses.length > 0 
            ? surveyData.destination_addresses 
            : [{
                address: "",
                city: "",
                country: "",
                state: "",
                zip: "",
                poe: "",
              }];

          reset({
            customerType: surveyData.customer_type || "",
            isMilitary: surveyData.is_military || false,
            salutation: surveyData.salutation || "",
            firstName: surveyData.first_name || surveyData.full_name || "",
            middleName: surveyData.middle_name || "",
            lastName: surveyData.last_name || "",
            mobileCountryCode: surveyData.mobile_country_code || "",
            mobileNumber: surveyData.mobile_number || "",
            email: surveyData.email || surveyData.enquiry?.email || "",
            address: surveyData.address || "",
            company: surveyData.company || "",
            surveyId: surveyData.survey_id || "",
            serviceType: surveyData.service_type || surveyData.enquiry?.service_type || "",
            goodsType: surveyData.goods_type || "",
            status: surveyData.status || "",
            surveyDate: surveyData.survey_date
              ? new Date(surveyData.survey_date)
              : null,
            surveyStartTime: surveyData.survey_start_time
              ? new Date(`1970-01-01T${surveyData.survey_start_time}`)
              : null,
            surveyEndTime: surveyData.survey_end_time
              ? new Date(`1970-01-01T${surveyData.survey_end_time}`)
              : null,
            workDescription: surveyData.work_description || "",
            includeVehicle: surveyData.include_vehicle || false,
            includePet: surveyData.include_pet || false,
            costTogetherVehicle: surveyData.cost_together_vehicle || false,
            costTogetherPet: surveyData.cost_together_pet || false,
            sameAsCustomerAddress: surveyData.same_as_customer_address || false,
            originAddress: surveyData.origin_address || "",
            originCity: surveyData.origin_city || "",
            originCountry: surveyData.origin_country || "",
            originState: surveyData.origin_state || "",
            originZip: surveyData.origin_zip || "",
            podPol: surveyData.pod_pol || "",
            multipleAddresses: surveyData.multiple_addresses || false,
            destinationAddresses: formattedDestinationAddresses,
            packingDateFrom: surveyData.packing_date_from
              ? new Date(surveyData.packing_date_from)
              : null,
            packingDateTo: surveyData.packing_date_to
              ? new Date(surveyData.packing_date_to)
              : null,
            loadingDate: surveyData.loading_date
              ? new Date(surveyData.loading_date)
              : null,
            eta: surveyData.eta ? new Date(surveyData.eta) : null,
            etd: surveyData.etd ? new Date(surveyData.etd) : null,
            estDeliveryDate: surveyData.est_delivery_date
              ? new Date(surveyData.est_delivery_date)
              : null,
            storageStartDate: surveyData.storage_start_date
              ? new Date(surveyData.storage_start_date)
              : null,
            storageFrequency: surveyData.storage_frequency || "",
            storageDuration: surveyData.storage_duration || "",
            storageMode: surveyData.storage_mode || "",
            transportMode: surveyData.transport_mode || "road",
          });

          setDestinationAddresses(formattedDestinationAddresses);
        } catch (error) {
          console.error("Failed to fetch survey data:", error);
          setError("Failed to fetch survey data. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSurveyData();
  }, [surveyId, reset]);

  const sameAsCustomerAddress = watch("sameAsCustomerAddress");
  const multipleAddresses = watch("multipleAddresses");

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const addAddress = () => {
    const newAddresses = [...destinationAddresses, {}];
    setDestinationAddresses(newAddresses);
    setValue("destinationAddresses", newAddresses);
  };

  const removeAddress = (index) => {
    if (destinationAddresses.length > 1) {
      const newAddresses = destinationAddresses.filter((_, i) => i !== index);
      setDestinationAddresses(newAddresses);
      setValue("destinationAddresses", newAddresses);
    }
  };

  const saveCustomerData = async (data) => {
    setIsSaving(true);
    try {
      // Prepare payload for API
      const payload = {
        customer_type: data.customerType,
        is_military: data.isMilitary,
        salutation: data.salutation,
        first_name: data.firstName,
        middle_name: data.middleName,
        last_name: data.lastName,
        mobile_country_code: data.mobileCountryCode,
        mobile_number: data.mobileNumber,
        email: data.email,
        address: data.address,
        company: data.company,
        survey_id: data.surveyId,
        service_type: data.serviceType,
        goods_type: data.goodsType,
        status: data.status,
        survey_date: data.surveyDate ? data.surveyDate.toISOString().split('T')[0] : null,
        survey_start_time: data.surveyStartTime ? data.surveyStartTime.toTimeString().split(' ')[0] : null,
        survey_end_time: data.surveyEndTime ? data.surveyEndTime.toTimeString().split(' ')[0] : null,
        work_description: data.workDescription,
        include_vehicle: data.includeVehicle,
        include_pet: data.includePet,
        cost_together_vehicle: data.costTogetherVehicle,
        cost_together_pet: data.costTogetherPet,
        same_as_customer_address: data.sameAsCustomerAddress,
        origin_address: data.originAddress,
        origin_city: data.originCity,
        origin_country: data.originCountry,
        origin_state: data.originState,
        origin_zip: data.originZip,
        pod_pol: data.podPol,
        multiple_addresses: data.multipleAddresses,
        destination_addresses: data.destinationAddresses,
        packing_date_from: data.packingDateFrom ? data.packingDateFrom.toISOString().split('T')[0] : null,
        packing_date_to: data.packingDateTo ? data.packingDateTo.toISOString().split('T')[0] : null,
        loading_date: data.loadingDate ? data.loadingDate.toISOString().split('T')[0] : null,
        eta: data.eta ? data.eta.toISOString().split('T')[0] : null,
        etd: data.etd ? data.etd.toISOString().split('T')[0] : null,
        est_delivery_date: data.estDeliveryDate ? data.estDeliveryDate.toISOString().split('T')[0] : null,
        storage_start_date: data.storageStartDate ? data.storageStartDate.toISOString().split('T')[0] : null,
        storage_frequency: data.storageFrequency,
        storage_duration: data.storageDuration,
        storage_mode: data.storageMode,
        transport_mode: data.transportMode,
      };

      // Save to API
      const response = await apiClient.patch(`/surveys/${surveyId}/`, payload);
      
      // Store in localStorage for navigation
      localStorage.setItem("customerData", JSON.stringify(data));
      
      return response.data;
    } catch (error) {
      console.error("Failed to save customer data:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const onNext = async (data) => {
    try {
      await saveCustomerData(data);
      
      const nextPath = data.goodsType === "pet" ? "pet" : "article";
      navigate(`/survey/${surveyId}/${nextPath}`, {
        state: { customerData: data },
      });
    } catch (error) {
      setError("Failed to save customer data. Please try again.");
    }
  };

  const salutationOptions = [
    { value: "Mr", label: "Mr" },
    { value: "Ms", label: "Ms" },
    { value: "Mrs", label: "Mrs" },
  ];
  const countryCodeOptions = [
    { value: "+1", label: "+1" },
    { value: "+91", label: "+91" },
  ];
  const goodsTypeOptions = [
    { value: "article", label: "Article" },
    { value: "pet", label: "Pet" },
  ];
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "non_active", label: "Non Active" },
  ];
  const frequencyOptions = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];
  const cityOptions = [
    { value: "new_york", label: "New York" },
    { value: "los_angeles", label: "Los Angeles" },
  ];
  const countryOptions = [
    { value: "usa", label: "USA" },
    { value: "india", label: "India" },
  ];
  const stateOptions = [
    { value: "ny", label: "New York" },
    { value: "ca", label: "California" },
  ];

  const sections = [
    {
      id: "customer-details",
      title: "Customer Details",
      content: (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer Type"
              name="customerType"
              type="select"
              options={customerTypes}
              rules={{ required: "Customer Type is required" }}
            />
            <Input
              label="Salutation"
              name="salutation"
              type="select"
              options={salutationOptions}
              rules={{ required: "Salutation is required" }}
            />
            <Input
              label="First Name"
              name="firstName"
              type="text"
              rules={{ required: "First Name is required" }}
            />
            <Input label="Middle Name" name="middleName" type="text" />
            <Input
              label="Last Name"
              name="lastName"
              type="text"
              rules={{ required: "Last Name is required" }}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Country Code"
                name="mobileCountryCode"
                type="select"
                options={countryCodeOptions}
                rules={{ required: "Country Code is required" }}
              />
              <Input
                label="Mobile Number"
                name="mobileNumber"
                type="text"
                rules={{
                  required: "Mobile Number is required",
                  pattern: {
                    value: /^\+?[0-9]{7,15}$/,
                    message: "Enter a valid mobile number (7-15 digits)",
                  },
                }}
              />
            </div>
            <Input
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
            />
            <Input
              label="Address"
              name="address"
              type="text"
              rules={{ required: "Address is required" }}
            />
            <Input label="Company" name="company" type="text" />
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-1 mt-1">(Optional Field)</p>
              <Input label="Is Military" name="isMilitary" type="checkbox" />
            </div>
          </div>
        </>
      ),
    },
    // ... (rest of the sections remain the same as your original code)
    {
      id: "survey-details",
      title: "Survey Details",
      content: (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Survey ID"
              name="surveyId"
              type="text"
              rules={{ required: "Survey ID is required" }}
            />
            <Input
              label="Service Type"
              name="serviceType"
              type="select"
              options={serviceTypes}
              rules={{ required: "Service Type is required" }}
            />
            <Input
              label="Goods Type"
              name="goodsType"
              type="select"
              options={goodsTypeOptions}
              rules={{ required: "Goods Type is required" }}
            />
            <Input
              label="Status"
              name="status"
              type="select"
              options={statusOptions}
              rules={{ required: "Status is required" }}
            />
            <DatePickerInput
              label="Survey Date"
              name="surveyDate"
              rules={{ required: "Survey Date is required" }}
            />
            <DatePickerInput
              label="Survey Start Time"
              name="surveyStartTime"
              isTimeOnly
              rules={{ required: "Survey Start Time is required" }}
            />
            <DatePickerInput
              label="Survey End Time"
              name="surveyEndTime"
              isTimeOnly
              rules={{ required: "Survey End Time is required" }}
            />
            <Input
              label="Work Description"
              name="workDescription"
              type="textarea"
              rules={{ required: "Work Description is required" }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              label="Include Vehicle"
              name="includeVehicle"
              type="checkbox"
            />
            <Input label="Include Pet" name="includePet" type="checkbox" />
            <Input
              label="Cost Together (Vehicle)"
              name="costTogetherVehicle"
              type="checkbox"
            />
            <Input
              label="Cost Together (Pet)"
              name="costTogetherPet"
              type="checkbox"
            />
          </div>
        </>
      ),
    },
    {
      id: "origin-address",
      title: "Origin Address",
      content: (
        <>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Same as Customer Address"
              name="sameAsCustomerAddress"
              type="checkbox"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              label="Address"
              name="originAddress"
              type="text"
              rules={{
                required: !sameAsCustomerAddress && "Address is required",
              }}
            />
            <Input
              label="City"
              name="originCity"
              type="select"
              options={cityOptions}
              rules={{ required: !sameAsCustomerAddress && "City is required" }}
            />
            <Input
              label="Country"
              name="originCountry"
              type="select"
              options={countryOptions}
              rules={{
                required: !sameAsCustomerAddress && "Country is required",
              }}
            />
            <Input
              label="State"
              name="originState"
              type="select"
              options={stateOptions}
              rules={{
                required: !sameAsCustomerAddress && "State is required",
              }}
            />
            <Input
              label="ZIP"
              name="originZip"
              type="text"
              rules={{ required: !sameAsCustomerAddress && "ZIP is required" }}
            />
            <Input
              label="POD/POL"
              name="podPol"
              type="text"
              rules={{ required: "POD/POL is required" }}
            />
          </div>
        </>
      ),
    },
    {
      id: "destination-details",
      title: "Destination Details",
      content: (
        <>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Multiple Addresses"
              name="multipleAddresses"
              type="checkbox"
            />
          </div>
          {multipleAddresses ? (
            <>
              {destinationAddresses.map((_, index) => (
                <div key={index} className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      Address ({index + 1})
                    </h3>
                    {destinationAddresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAddress(index)}
                        className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                        aria-label={`Remove Address ${index + 1}`}
                      >
                        <FaMinus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Address"
                      name={`destinationAddresses[${index}].address`}
                      type="text"
                      rules={{ required: "Address is required" }}
                    />
                    <Input
                      label="City"
                      name={`destinationAddresses[${index}].city`}
                      type="select"
                      options={cityOptions}
                      rules={{ required: "City is required" }}
                    />
                    <Input
                      label="Country"
                      name={`destinationAddresses[${index}].country`}
                      type="select"
                      options={countryOptions}
                      rules={{ required: "Country is required" }}
                    />
                    <Input
                      label="State"
                      name={`destinationAddresses[${index}].state`}
                      type="select"
                      options={stateOptions}
                      rules={{ required: "State is required" }}
                    />
                    <Input
                      label="ZIP"
                      name={`destinationAddresses[${index}].zip`}
                      type="text"
                      rules={{ required: "ZIP is required" }}
                    />
                    <Input
                      label="POE"
                      name={`destinationAddresses[${index}].poe`}
                      type="text"
                      rules={{ required: "POE is required" }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={addAddress}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-md hover:bg-[#6b8ca3] transition-colors duration-300"
                >
                  <FaPlus className="w-3 h-3" /> Add Address
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Address"
                name="destinationAddresses[0].address"
                type="text"
                rules={{ required: "Address is required" }}
              />
              <Input
                label="City"
                name="destinationAddresses[0].city"
                type="select"
                options={cityOptions}
                rules={{ required: "City is required" }}
              />
              <Input
                label="Country"
                name="destinationAddresses[0].country"
                type="select"
                options={countryOptions}
                rules={{ required: "Country is required" }}
              />
              <Input
                label="State"
                name="destinationAddresses[0].state"
                type="select"
                options={stateOptions}
                rules={{ required: "State is required" }}
              />
              <Input
                label="ZIP"
                name="destinationAddresses[0].zip"
                type="text"
                rules={{ required: "ZIP is required" }}
              />
              <Input
                label="POE"
                name="destinationAddresses[0].poe"
                type="text"
                rules={{ required: "POE is required" }}
              />
            </div>
          )}
        </>
      ),
    },
    {
      id: "move-details",
      title: "Move Details",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePickerInput
            label="Packing Date From"
            name="packingDateFrom"
            rules={{ required: "Packing Date From is required" }}
          />
          <DatePickerInput
            label="Packing Date To"
            name="packingDateTo"
            rules={{ required: "Packing Date To is required" }}
          />
          <DatePickerInput
            label="Loading Date"
            name="loadingDate"
            rules={{ required: "Loading Date is required" }}
          />
          <DatePickerInput
            label="ETA"
            name="eta"
            rules={{ required: "ETA is required" }}
          />
          <DatePickerInput
            label="ETD"
            name="etd"
            rules={{ required: "ETD is required" }}
          />
          <DatePickerInput
            label="Est. Delivery Date"
            name="estDeliveryDate"
            rules={{ required: "Est. Delivery Date is required" }}
          />
        </div>
      ),
    },
    {
      id: "storage-details",
      title: "Storage Details",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePickerInput
            label="Start Date"
            name="storageStartDate"
            rules={{ required: "Start Date is required" }}
          />
          <Input
            label="Frequency"
            name="storageFrequency"
            type="select"
            options={frequencyOptions}
            rules={{ required: "Frequency is required" }}
          />
          <Input
            label="Duration"
            name="storageDuration"
            type="text"
            rules={{ required: "Duration is required" }}
          />
          <Input
            label="Storage Mode"
            name="storageMode"
            type="text"
            rules={{ required: "Storage Mode is required" }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-full mx-auto">
      {isLoading && (
        <div className="flex justify-center items-center min-h-screen">
          <Loading />
        </div>
      )}
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
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onNext)} className="space-y-4">
          {sections.map((section) => (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="mb-4 group rounded-md shadow-inner w-full flex justify-between items-center p-4 text-left bg-gray-200 hover:bg-[#4c7085] transition-colors duration-300"
              >
                <span className="text-md font-medium text-gray-800 group-hover:text-white">
                  {section.title}
                </span>
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
                    className="p-4 bg-white rounded-lg shadow-md"
                  >
                    {section.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-md hover:bg-[#6b8ca3] transition-colors duration-300 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Next"}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default Customer;