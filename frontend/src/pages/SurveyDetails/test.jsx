import { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaChevronUp, FaPlus, FaMinus } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Loading from "../../components/Loading";
import Input from "../../components/Input";
import apiClient from "../../api/apiClient";

const DatePickerInput = ({ label, name, rules = {}, isTimeOnly = false }) => {
  const { setValue, watch, formState: { errors } } = useFormContext();
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
        className={`w-full px-2 py-2 text-sm border rounded focus:outline-indigo-500 focus:ring focus:ring-indigo-200 transition-colors ${error ? "border-red-500" : ""}`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
};

const QuantityInput = ({ label, name, rules = {}, onChange }) => {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const value = watch(name) || 0;
  const error = errors[name];

  const increment = () => {
    const newValue = value + 1;
    setValue(name, newValue, { shouldValidate: true });
    if (onChange) onChange(newValue);
  };

  const decrement = () => {
    if (value > 0) {
      const newValue = value - 1;
      setValue(name, newValue, { shouldValidate: true });
      if (onChange) onChange(newValue);
    }
  };

  return (
    <div className="flex flex-col w-full items-center">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {rules.required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={decrement}
          className="p-3 bg-gray-200 rounded-l-lg hover:bg-gray-300 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
          </svg>
        </button>
        <input
          type="number"
          value={value}
          readOnly
          className="w-20 text-center px-3 py-3 text-sm border-t border-b border-gray-300 focus:outline-none"
        />
        <button
          type="button"
          onClick={increment}
          className="p-3 bg-gray-200 rounded-r-lg hover:bg-gray-300 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error.message}</p>}
    </div>
  );
};

const ServiceCheckbox = ({ label, name, rules = {}, notesName, notesRules = {} }) => {
  const { watch, setValue, register } = useFormContext();
  const isChecked = watch(name);
  const notesValue = watch(notesName);

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setValue(name, checked, { shouldValidate: true });
    if (!checked) {
      setValue(notesName, "");
    }
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          {...register(name)}
          checked={isChecked}
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

const SurveyDetails = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("customer");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [apiData, setApiData] = useState({
    customerTypes: [],
    volumeUnits: [],
    weightUnits: [],
    packingTypes: [],
    handymanTypes: [],
    vehicleTypes: [],
    petTypes: [],
    rooms: [],
    items: [],
    currencies: [],
    serviceTypes: [],
  });
  const [existingSurvey, setExistingSurvey] = useState(null);

  const { customerData: initialCustomerData } = location.state || {};

  const methods = useForm({
    defaultValues: {
      enquiry: surveyId || "",
      customerType: "",
      isMilitary: false,
      salutation: "",
      fullName: initialCustomerData?.fullName || "",
      phoneNumber: initialCustomerData?.phoneNumber || "",
      email: initialCustomerData?.email || "",
      address: "",
      company: "",
      goodsType: "",
      status: "pending",
      surveyDate: initialCustomerData?.surveyDate || null,
      surveyStartTime: initialCustomerData?.surveyStartTime || null,
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
          id: uuidv4(),
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
      articles: [],
      vehicles: [],
      pets: [],
      generalOwnerPacked: false,
      generalOwnerPackedNotes: "",
      generalRestriction: false,
      generalRestrictionNotes: "",
      generalHandyman: false,
      generalHandymanNotes: "",
      generalInsurance: false,
      generalInsuranceNotes: "",
      originFloor: false,
      originFloorNotes: "",
      originLift: false,
      originLiftNotes: "",
      originParking: false,
      originParkingNotes: "",
      originStorage: false,
      originStorageNotes: "",
      destinationFloor: false,
      destinationFloorNotes: "",
      destinationLift: false,
      destinationLiftNotes: "",
      destinationParking: false,
      destinationParkingNotes: "",
    },
  });

  const { handleSubmit, watch, setValue, reset, register } = methods;

  const hasReset = useRef(false);

  useEffect(() => {
    if (surveyId) {
      setIsLoading(true);
      apiClient
        .get(`/surveys/?enquiry_id=${surveyId}`)
        .then((response) => {
          if (response.data.length > 0) {
            const survey = response.data[0];
            setExistingSurvey(survey);
            const surveyDateTime = survey.survey_date ? new Date(survey.survey_date) : null;
            const surveyStartTime = survey.survey_start_time ?
              new Date(`1970-01-01T${survey.survey_start_time}`) : null;
            reset({
              ...methods.getValues(),
              enquiry: survey.enquiry || surveyId, 
              customerType: survey.customer_type?.id || "",
              isMilitary: survey.is_military || false,
              salutation: survey.salutation || "",
              fullName: survey.full_name || survey.enquiry?.fullName || initialCustomerData?.fullName || "",
              phoneNumber: survey.mobile_number || survey.enquiry?.phoneNumber || initialCustomerData?.phoneNumber || "",
              email: survey.email || survey.enquiry?.email || initialCustomerData?.email || "",
              address: survey.address || "",
              company: survey.company || "",
              goodsType: survey.goods_type || "",
              status: survey.status || "pending",
              surveyDate: surveyDateTime,
              surveyStartTime: surveyStartTime,
              surveyEndTime: survey.survey_end_time ?
                new Date(`1970-01-01T${survey.survey_end_time}`) : null,
              workDescription: survey.work_description || "",
              includeVehicle: survey.include_vehicle || false,
              includePet: survey.include_pet || false,
              costTogetherVehicle: survey.cost_together_vehicle || false,
              costTogetherPet: survey.cost_together_pet || false,
              sameAsCustomerAddress: survey.same_as_customer_address || false,
              originAddress: survey.origin_address || "",
              originCity: survey.origin_city || "",
              originCountry: survey.origin_country || "",
              originState: survey.origin_state || "",
              originZip: survey.origin_zip || "",
              podPol: survey.pod_pol || "",
              multipleAddresses: survey.multiple_addresses || false,
              destinationAddresses: survey.destination_addresses?.length > 0
                ? survey.destination_addresses.map((addr) => ({
                  id: uuidv4(),
                  address: addr.address || "",
                  city: addr.city || "",
                  country: addr.country || "",
                  state: addr.state || "",
                  zip: addr.zip || "",
                  poe: addr.poe || "",
                }))
                : [{ id: uuidv4(), address: "", city: "", country: "", state: "", zip: "", poe: "" }],
            });
            hasReset.current = true;
          } else {
            reset({
              ...methods.getValues(),
              enquiry: surveyId,
              fullName: initialCustomerData?.fullName || "",
              phoneNumber: initialCustomerData?.phoneNumber || "",
              email: initialCustomerData?.email || "",
              surveyDate: initialCustomerData?.surveyDate || null,
            });
            hasReset.current = true;
          }
          setIsLoading(false);
        })
        .catch((err) => {
          setError("Failed to fetch survey data. Please try again.");
          setIsLoading(false);
          console.error("Survey fetch error:", err);
        });
    }
  }, [surveyId, initialCustomerData, reset]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      apiClient.get("/customer-types/").then((response) => ({
        customerTypes: response.data.map((type) => ({
          value: type.id,
          label: type.name,
        })),
      })),
      apiClient.get("/volume-units/").then((response) => ({
        volumeUnits: response.data.map((unit) => ({
          value: unit.id,
          label: unit.name,
        })),
      })),
      apiClient.get("/weight-units/").then((response) => ({
        weightUnits: response.data.map((unit) => ({
          value: unit.id,
          label: unit.name,
        })),
      })),
      apiClient.get("/packing-types/").then((response) => ({
        packingTypes: response.data.map((type) => ({
          value: type.id,
          label: type.name,
        })),
      })),
      apiClient.get("/handyman/").then((response) => ({
        handymanTypes: response.data.map((type) => ({
          value: type.id,
          label: type.type_name,
        })),
      })),
      apiClient.get("/vehicle-types/").then((response) => ({
        vehicleTypes: response.data.map((type) => ({
          value: type.id,
          label: type.name,
        })),
      })),
      apiClient.get("/pet-types/").then((response) => ({
        petTypes: response.data.map((type) => ({
          value: type.id,
          label: type.name,
        })),
      })),
      apiClient.get("/rooms/").then((response) => ({
        rooms: response.data.map((room) => ({
          id: room.id,
          value: room.id,
          label: room.name,
        })),
      })),
      apiClient.get("/items/").then((response) => ({
        items: response.data.map((item) => ({
          id: item.id,
          name: item.name,
          room: item.room,
        })),
      })),
      apiClient.get("/currencies/").then((response) => ({
        currencies: response.data.map((currency) => ({
          value: currency.id,
          label: currency.name,
        })),
      })),
    ])
      .then((results) => {
        const combinedData = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setApiData((prev) => ({
          ...prev,
          ...combinedData,
        }));
        setIsLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch types. Please try again.");
        setIsLoading(false);
        console.error("API fetch error:", err);
      });
  }, []);

  const tabs = [
    { id: "customer", label: "Customer" },
    { id: "items", label: watch("goodsType") === "pet" ? "Pet" : "Article" },
    { id: "service", label: "Service" },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const Customer = () => {
    const [activeSection, setActiveSection] = useState("customer-details");
    const [destinationAddresses, setDestinationAddresses] = useState(watch("destinationAddresses"));
    const sameAsCustomerAddress = watch("sameAsCustomerAddress");
    const multipleAddresses = watch("multipleAddresses");
    const serviceTypeDisplay = existingSurvey?.service_type_display || initialCustomerData?.serviceTypeDisplay || "N/A";

    const addAddress = () => {
      const newAddresses = [...destinationAddresses, { id: uuidv4() }];
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

    const salutationOptions = [
      { value: "Mr", label: "Mr" },
      { value: "Ms", label: "Ms" },
      { value: "Mrs", label: "Mrs" },
    ];
    const goodsTypeOptions = [
      { value: "article", label: "Article" },
      { value: "pet", label: "Pet" },
    ];
    const statusOptions = [
      { value: "pending", label: "Pending" },
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ];
    const frequencyOptions = [
      { value: "weekly", label: "Weekly" },
      { value: "monthly", label: "Monthly" },
      { value: "yearly", label: "Yearly" },
    ];
    const storageModeOptions = [
      { value: "warehouse", label: "Warehouse" },
      { value: "container", label: "Container" },
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer Type"
              name="customerType"
              type="select"
              options={apiData.customerTypes}
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
              label="Full Name"
              name="fullName"
              type="text"
              rules={{ required: "Full Name is required" }}
            />
            <Input
              label="Mobile Number"
              name="phoneNumber"
              type="text"
              rules={{
                required: "Mobile Number is required",
                pattern: {
                  value: /^\+?[0-9]{7,15}$/,
                  message: "Enter a valid mobile number (7-15 digits)",
                },
              }}
            />
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
        ),
      },
      {
        id: "survey-details",
        title: "Survey Details",
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type <span className="text-gray-500">(Read Only)</span>
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-800">
                {serviceTypeDisplay || "Not Available"}
              </div>
              {(!serviceTypeDisplay || serviceTypeDisplay === "N/A") && (
                <p className="mt-1 text-xs text-yellow-600">
                  Service type will be set after saving
                </p>
              )}
            </div>
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
        ),
      },
      {
        id: "origin-address",
        title: "Origin Address",
        content: (
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Same as Customer Address"
              name="sameAsCustomerAddress"
              type="checkbox"
            />
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
          </div>
        ),
      },
      {
        id: "destination-details",
        title: "Destination Details",
        content: (
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Multiple Addresses"
              name="multipleAddresses"
              type="checkbox"
            />
            {multipleAddresses ? (
              <>
                {destinationAddresses.map((address, index) => (
                  <div key={address.id} className="mt-4">
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
          </div>
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
              type="select"
              options={storageModeOptions}
              rules={{ required: "Storage Mode is required" }}
            />
          </div>
        ),
      },
    ];

    return (
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => setActiveSection(section.id)}
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
            {activeSection === section.id && (
              <div className="p-4 bg-white rounded-lg shadow-md">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const Article = () => {
    const [activeSection, setActiveSection] = useState("master-article");
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showRoomDropdown, setShowRoomDropdown] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});
    const [itemQuantities, setItemQuantities] = useState({});

    const toggleExpandedItem = (itemName) => {
      setExpandedItems((prev) => ({
        ...prev,
        [itemName]: !prev[itemName],
      }));
    };

    const updateQuantity = (itemName, newQuantity) => {
      setItemQuantities((prev) => ({ ...prev, [itemName]: newQuantity }));
    };

    const addArticle = (itemName, itemData) => {
      const newArticle = {
        id: uuidv4(),
        itemName,
        quantity: itemQuantities[itemName] || 1,
        volume: itemData[`volume_${itemName}`] || "",
        volumeUnit: itemData[`volumeUnit_${itemName}`] || "",
        weight: itemData[`weight_${itemName}`] || "",
        weightUnit: itemData[`weightUnit_${itemName}`] || "",
        handyman: itemData[`handyman_${itemName}`] || "",
        packingOption: itemData[`packingOption_${itemName}`] || "",
        moveStatus: itemData[`moveStatus_${itemName}`] || "",
        amount: itemData[`amount_${itemName}`] || "",
        currency: itemData[`currency_${itemName}`] || "",
        remarks: itemData[`remarks_${itemName}`] || "",
        room: selectedRoom?.value || "",
      };
      const updatedArticles = [...watch("articles"), newArticle];
      setValue("articles", updatedArticles);
      setExpandedItems((prev) => ({ ...prev, [itemName]: false }));
      setItemQuantities((prev) => {
        const newQuantities = { ...prev };
        delete newQuantities[itemName];
        return newQuantities;
      });
      setMessage("Article added successfully!");
      setTimeout(() => setMessage(null), 3000);
    };

    const handleRoomSelect = (room) => {
      setSelectedRoom(room);
      setShowRoomDropdown(false);
      setActiveSection("master-article");
    };

    const ItemRow = ({ item }) => {
      const itemFormMethods = useForm({
        defaultValues: {
          [`volume_${item.name}`]: "",
          [`volumeUnit_${item.name}`]: apiData.volumeUnits[0]?.value || "",
          [`weight_${item.name}`]: "",
          [`weightUnit_${item.name}`]: apiData.weightUnits[0]?.value || "",
          [`handyman_${item.name}`]: apiData.handymanTypes[0]?.value || "",
          [`packingOption_${item.name}`]: apiData.packingTypes[0]?.value || "",
          [`moveStatus_${item.name}`]: "new",
          [`amount_${item.name}`]: "",
          [`currency_${item.name}`]: apiData.currencies[0]?.value || "",
          [`remarks_${item.name}`]: "",
          [`quantity_${item.name}`]: itemQuantities[item.name] || 0,
        },
      });

      const { handleSubmit: handleItemSubmit } = itemFormMethods;

      return (
        <>
          <tr key={`${item.name}-main`} className="border-b border-gray-200">
            <td className="text-left py-4 px-4 text-sm text-gray-700 cursor-pointer hover:bg-gray-50" onClick={() => toggleExpandedItem(item.name)}>
              <span className="font-medium">{item.name}</span>
            </td>
            <td className="text-center py-4 px-4">
              <FormProvider {...itemFormMethods}>
                <QuantityInput label="" name={`quantity_${item.name}`} onChange={(newQuantity) => updateQuantity(item.name, newQuantity)} />
              </FormProvider>
            </td>
            <td className="text-right py-4 px-4">
              <button type="button" onClick={handleItemSubmit((data) => addArticle(item.name, data))} className="px-4 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg text-sm">
                Add
              </button>
            </td>
          </tr>
          <AnimatePresence>
            {expandedItems[item.name] && (
              <tr key={`${item.name}-details`} className="border border-gray-200">
                <td colSpan="3">
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-4 bg-white">
                    <FormProvider {...itemFormMethods}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Volume" name={`volume_${item.name}`} type="number" rules={{ required: "Volume is required" }} />
                        <Input label="Volume Unit" name={`volumeUnit_${item.name}`} type="select" options={apiData.volumeUnits} />
                        <Input label="Weight" name={`weight_${item.name}`} type="number" rules={{ required: "Weight is required" }} />
                        <Input label="Weight Unit" name={`weightUnit_${item.name}`} type="select" options={apiData.weightUnits} />
                        <Input label="Handyman" name={`handyman_${item.name}`} type="select" options={apiData.handymanTypes} />
                        <Input label="Packing Option" name={`packingOption_${item.name}`} type="select" options={apiData.packingTypes} />
                        <Input label="Amount" name={`amount_${item.name}`} type="number" />
                        <Input label="Currency" name={`currency_${item.name}`} type="select" options={apiData.currencies} />
                        <Input label="Remarks" name={`remarks_${item.name}`} type="textarea" />
                      </div>
                      <div className="mt-4 flex gap-3 justify-end">
                        <button type="button" onClick={handleItemSubmit((data) => addArticle(item.name, data))} className="px-4 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg text-sm">
                          Update
                        </button>
                        <button type="button" onClick={() => toggleExpandedItem(item.name)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
                          Cancel
                        </button>
                      </div>
                    </FormProvider>
                  </motion.div>
                </td>
              </tr>
            )}
          </AnimatePresence>
        </>
      );
    };

    const sections = [
      {
        id: "master-article",
        title: "Master Article",
        content: (
          <>
            {selectedRoom ? (
              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-left">Item</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-center">Quantity</th>
                      <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiData.items
                      .filter((item) => item.room === selectedRoom.id)
                      .map((itemData) => (
                        <ItemRow key={itemData.id} item={itemData} />
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">Please select a room to view items.</div>
            )}
          </>
        ),
      },
      {
        id: "vehicle",
        title: "Vehicle",
        content: (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            <Input label="Vehicle Type" name="vehicles[0].vehicleType" type="select" options={apiData.vehicleTypes} rules={{ required: "Vehicle Type is required" }} />
            <Input label="Make" name="vehicles[0].make" type="text" rules={{ required: "Make is required" }} />
            <Input label="Model" name="vehicles[0].model" type="text" rules={{ required: "Model is required" }} />
            <Input label="Remark" name="vehicles[0].remark" type="textarea" />
          </div>
        ),
      },
    ];

    return (
      <div className="space-y-4">
        <div className="relative mb-4">
          <button type="button" onClick={() => setShowRoomDropdown(!showRoomDropdown)} className="w-full px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex justify-between items-center">
            <span>{selectedRoom ? selectedRoom.label : "Select a Room"}</span>
            <FaChevronDown className={`w-3 h-3 transition-transform ${showRoomDropdown ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {showRoomDropdown && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg">
                {apiData.rooms.map((room) => (
                  <button key={room.id} type="button" onClick={() => handleRoomSelect(room)} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-100">
                    {room.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {sections.map((section) => (
          <div key={section.id}>
            <button type="button" onClick={() => setActiveSection(section.id)} className="w-full flex justify-between items-center p-4 bg-gray-100 hover:bg-[#4c7085] hover:text-white rounded-lg transition-colors">
              <span className="text-md font-medium">{section.title}</span>
              {activeSection === section.id ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
            </button>
            {activeSection === section.id && (
              <div className="p-4 bg-white rounded-lg shadow-md mt-2">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const Pet = () => {
    const [activeSection, setActiveSection] = useState("pet-details");
    const breedOptions = {
      dog: [
        { value: "labrador", label: "Labrador Retriever" },
        { value: "german_shepherd", label: "German Shepherd" },
        { value: "golden_retriever", label: "Golden Retriever" },
        { value: "bulldog", label: "Bulldog" },
        { value: "beagle", label: "Beagle" },
        { value: "poodle", label: "Poodle" },
        { value: "other", label: "Other" },
      ],
      cat: [
        { value: "siamese", label: "Siamese" },
        { value: "persian", label: "Persian" },
        { value: "maine_coon", label: "Maine Coon" },
        { value: "ragdoll", label: "Ragdoll" },
        { value: "bengal", label: "Bengal" },
        { value: "other", label: "Other" },
      ],
      bird: [
        { value: "parrot", label: "Parrot" },
        { value: "canary", label: "Canary" },
        { value: "finch", label: "Finch" },
        { value: "cockatiel", label: "Cockatiel" },
        { value: "other", label: "Other" },
      ],
      other: [
        { value: "other", label: "Other" },
      ],
    };
    const vaccinationOptions = [
      { value: "up_to_date", label: "Up to Date" },
      { value: "not_up_to_date", label: "Not Up to Date" },
      { value: "unknown", label: "Unknown" },
    ];

    const getBreedOptions = (petType) => {
      return breedOptions[petType] || breedOptions.other;
    };

    const onAddPet = (data) => {
      const newPet = {
        ...data,
        id: Date.now(),
      };
      const updatedPets = [...watch("pets"), newPet];
      setValue("pets", updatedPets);
      reset({
        ...watch(),
        petName: "",
        petType: "",
        breed: "",
        age: 0,
        weight: 0,
        specialCare: "",
        transportRequirements: "",
        feedingInstructions: "",
        medication: "",
        vaccinationStatus: "",
        behaviorNotes: "",
      });
      setMessage("Pet added successfully!");
      setTimeout(() => setMessage(null), 3000);
    };

    const removePet = (petId) => {
      const updatedPets = watch("pets").filter((pet) => pet.id !== petId);
      setValue("pets", updatedPets);
      setMessage("Pet removed successfully!");
      setTimeout(() => setMessage(null), 3000);
    };

    const sections = [
      {
        id: "pet-details",
        title: "Pet Details",
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <Input
              label="Pet Name"
              name="petName"
              type="text"
              rules={{ required: "Pet Name is required" }}
              placeholder="Enter pet name"
            />
            <Input
              label="Pet Type"
              name="petType"
              type="select"
              options={[{ value: "", label: "Select Pet Type" }, ...apiData.petTypes]}
              rules={{ required: "Pet Type is required" }}
            />
            <Input
              label="Breed"
              name="breed"
              type="select"
              options={[{ value: "", label: "Select Breed" }, ...getBreedOptions(watch("petType"))]}
              rules={{ required: "Breed is required" }}
            />
            <Input
              label="Age (years)"
              name="age"
              type="number"
              rules={{
                required: "Age is required",
                min: { value: 0, message: "Age cannot be negative" },
                max: { value: 50, message: "Please enter a valid age" },
              }}
              placeholder="Age in years"
            />
            <Input
              label="Weight (kg)"
              name="weight"
              type="number"
              rules={{
                required: "Weight is required",
                min: { value: 0, message: "Weight cannot be negative" },
                max: { value: 200, message: "Please enter a valid weight" },
              }}
              placeholder="Weight in kilograms"
            />
            <Input
              label="Vaccination Status"
              name="vaccinationStatus"
              type="select"
              options={[{ value: "", label: "Select Status" }, ...vaccinationOptions]}
              rules={{ required: "Vaccination status is required" }}
            />
            <div className="md:col-span-2">
              <Input
                label="Special Care Instructions"
                name="specialCare"
                type="textarea"
                placeholder="Any special care requirements, health issues, or specific needs"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Transport Requirements"
                name="transportRequirements"
                type="textarea"
                placeholder="Specific requirements for transport (cage size, temperature, etc.)"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Feeding Instructions"
                name="feedingInstructions"
                type="textarea"
                placeholder="Feeding schedule, diet restrictions, special food requirements"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Medication"
                name="medication"
                type="textarea"
                placeholder="Current medications, dosage, and administration instructions"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Behavior Notes"
                name="behaviorNotes"
                type="textarea"
                placeholder="Temperament, behavior with other animals/people, any special handling requirements"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleSubmit(onAddPet)}
                className="px-6 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:bg-[#6b8ca3] transition-colors duration-300"
              >
                Add Pet
              </button>
              <button
                type="button"
                onClick={() => reset({ ...watch(), petName: "", petType: "", breed: "", age: 0, weight: 0, specialCare: "", transportRequirements: "", feedingInstructions: "", medication: "", vaccinationStatus: "", behaviorNotes: "" })}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300"
              >
                Clear Form
              </button>
            </div>
          </div>
        ),
      },
      {
        id: "pet-list",
        title: "Added Pets",
        content: (
          <div className="p-4">
            {watch("pets").length > 0 ? (
              <div className="space-y-4">
                {watch("pets").map((pet, index) => (
                  <motion.div
                    key={pet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {pet.petName}
                          <span className="ml-2 text-sm font-normal text-gray-600 capitalize">
                            ({pet.petType})
                          </span>
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">{pet.breed}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePet(pet.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        aria-label={`Remove ${pet.petName}`}
                      >
                        <FaMinus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Age:</span>
                        <p className="text-gray-600">{pet.age} years</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Weight:</span>
                        <p className="text-gray-600">{pet.weight} kg</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Vaccination:</span>
                        <p className="text-gray-600 capitalize">{pet.vaccinationStatus?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">ID:</span>
                        <p className="text-gray-600">#{index + 1}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {pet.specialCare && (
                        <div>
                          <span className="font-medium text-gray-700 text-sm">Special Care:</span>
                          <p className="text-gray-600 text-sm">{pet.specialCare}</p>
                        </div>
                      )}
                      {pet.transportRequirements && (
                        <div>
                          <span className="font-medium text-gray-700 text-sm">Transport:</span>
                          <p className="text-gray-600 text-sm">{pet.transportRequirements}</p>
                        </div>
                      )}
                      {pet.medication && (
                        <div>
                          <span className="font-medium text-gray-700 text-sm">Medication:</span>
                          <p className="text-gray-600 text-sm">{pet.medication}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No pets added yet</p>
                <p className="text-gray-400 text-sm mt-1">Add pets using the form above</p>
              </div>
            )}
          </div>
        ),
      },
    ];

    return (
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => setActiveSection(section.id)}
              className="group rounded-lg shadow-sm w-full flex justify-between items-center p-4 text-left bg-gray-100 hover:bg-[#4c7085] transition-all duration-300"
            >
              <span className="text-md font-medium text-gray-800 group-hover:text-white">
                {section.title}
                {section.id === "pet-list" && watch("pets").length > 0 && (
                  <span className="ml-2 bg-white text-[#4c7085] px-2 py-1 rounded-full text-xs">
                    {watch("pets").length} {watch("pets").length === 1 ? 'pet' : 'pets'}
                  </span>
                )}
              </span>
              {activeSection === section.id ? (
                <FaChevronUp className="w-3 h-3 text-gray-600 group-hover:text-white" />
              ) : (
                <FaChevronDown className="w-3 h-3 text-gray-600 group-hover:text-white" />
              )}
            </button>
            {activeSection === section.id && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden p-4">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const Service = () => {
    const [activeSection, setActiveSection] = useState("general");

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
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => setActiveSection(section.id)}
              className="group rounded-md shadow-inner w-full flex justify-between items-center p-4 text-left bg-gray-200 hover:bg-[#4c7085] transition-colors duration-300"
            >
              <span className="text-md font-medium text-gray-800 group-hover:text-white">{section.title}</span>
              {activeSection === section.id ? (
                <FaChevronUp className="w-3 h-3 text-gray-600 group-hover:text-white" />
              ) : (
                <FaChevronDown className="w-3 h-3 text-gray-600 group-hover:text-white" />
              )}
            </button>
            {activeSection === section.id && (
              <div className="p-4">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

const saveSurveyData = async (data) => {
  setIsLoading(true);

   const enquiryId = surveyId ? parseInt(surveyId) : null;

    setIsLoading(true);

    const payload = {
      enquiry: enquiryId,
      customer_type: data.customerType || null,
      is_military: data.isMilitary,
      salutation: data.salutation,
      full_name: data.fullName,
      mobile_number: data.phoneNumber,
      email: data.email,
      address: data.address,
      company: data.company,
      goods_type: data.goodsType,
      status: data.status,
      survey_date: data.surveyDate ? data.surveyDate.toISOString().split('T')[0] : null,
      survey_start_time: data.surveyStartTime ?
        data.surveyStartTime.toTimeString().split(' ')[0] : null,
      survey_end_time: data.surveyEndTime ?
        data.surveyEndTime.toTimeString().split(' ')[0] : null,
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
      destination_addresses: data.destinationAddresses.map(addr => ({
        address: addr.address,
        city: addr.city,
        country: addr.country,
        state: addr.state,
        zip: addr.zip,
        poe: addr.poe,
      })),
      packing_date_from: data.packingDateFrom
        ? data.packingDateFrom.toISOString().split("T")[0]
        : null,
      packing_date_to: data.packingDateTo
        ? data.packingDateTo.toISOString().split("T")[0]
        : null,
      loading_date: data.loadingDate
        ? data.loadingDate.toISOString().split("T")[0]
        : null,
      eta: data.eta ? data.eta.toISOString().split("T")[0] : null,
      etd: data.etd ? data.etd.toISOString().split("T")[0] : null,
      est_delivery_date: data.estDeliveryDate
        ? data.estDeliveryDate.toISOString().split("T")[0]
        : null,
      storage_start_date: data.storageStartDate
        ? data.storageStartDate.toISOString().split("T")[0]
        : null,
      storage_frequency: data.storageFrequency,
      storage_duration: data.storageDuration,
      storage_mode: data.storageMode,
      transport_mode: data.transportMode,
      general_owner_packed: data.generalOwnerPacked,
      general_owner_packed_notes: data.generalOwnerPackedNotes,
      general_restriction: data.generalRestriction,
      general_restriction_notes: data.generalRestrictionNotes,
      general_handyman: data.generalHandyman,
      general_handyman_notes: data.generalHandymanNotes,
      general_insurance: data.generalInsurance,
      general_insurance_notes: data.generalInsuranceNotes,
      origin_floor: data.originFloor,
      origin_floor_notes: data.originFloorNotes,
      origin_lift: data.originLift,
      origin_lift_notes: data.originLiftNotes,
      origin_parking: data.originParking,
      origin_parking_notes: data.originParkingNotes,
      origin_storage: data.originStorage,
      origin_storage_notes: data.originStorageNotes,
      destination_floor: data.destinationFloor,
      destination_floor_notes: data.destinationFloorNotes,
      destination_lift: data.destinationLift,
      destination_lift_notes: data.destinationLiftNotes,
      destination_parking: data.destinationParking,
      destination_parking_notes: data.destinationParkingNotes,
      articles: data.articles.map((article) => ({
        room: article.room || null,
        item_name: article.itemName,
        quantity: article.quantity,
        volume: article.volume || null,
        volume_unit: article.volumeUnit || null,
        weight: article.weight || null,
        weight_unit: article.weightUnit || null,
        handyman: article.handyman || null,
        packing_option: article.packingOption || null,
        move_status: article.moveStatus,
        amount: article.amount || null,
        currency: article.currency || null,
        remarks: article.remarks,
      })),
      vehicles: data.vehicles.map((vehicle) => ({
        vehicle_type: vehicle.vehicleType || null,
        make: vehicle.make,
        model: vehicle.model,
        insurance: vehicle.insurance,
        remark: vehicle.remark,
        transport_mode: vehicle.transportMode,
      })),
      pets: data.pets.map((pet) => ({
        pet_name: pet.petName,
        pet_type: pet.petType || null,
        breed: pet.breed,
        age: pet.age,
        weight: pet.weight,
        special_care: pet.specialCare,
        transport_requirements: pet.transportRequirements,
        feeding_instructions: pet.feedingInstructions,
        medication: pet.medication,
        vaccination_status: pet.vaccinationStatus,
        behavior_notes: pet.behaviorNotes,
      })),
    };

    if (existingSurvey) {
      return apiClient
        .put(`/surveys/${existingSurvey.survey_id}/`, payload)
        .then((response) => {
          setMessage("Survey updated successfully!");
          setTimeout(() => {
            navigate(`/survey/${existingSurvey.survey_id}/survey-summary`, {
              state: {
                customerData: { ...data, survey_id: response.data.survey_id },
                articles: data.articles,
                vehicles: data.vehicles,
                pets: data.pets,
                serviceData: {
                  general_owner_packed: data.generalOwnerPacked,
                  general_owner_packed_notes: data.generalOwnerPackedNotes,
                  general_restriction: data.generalRestriction,
                  general_restriction_notes: data.generalRestrictionNotes,
                  general_handyman: data.generalHandyman,
                  general_handyman_notes: data.generalHandymanNotes,
                  general_insurance: data.generalInsurance,
                  general_insurance_notes: data.generalInsuranceNotes,
                  origin_floor: data.originFloor,
                  origin_floor_notes: data.originFloorNotes,
                  origin_lift: data.originLift,
                  origin_lift_notes: data.originLiftNotes,
                  origin_parking: data.originParking,
                  origin_parking_notes: data.originParkingNotes,
                  origin_storage: data.originStorage,
                  origin_storage_notes: data.originStorageNotes,
                  destination_floor: data.destinationFloor,
                  destination_floor_notes: data.destinationFloorNotes,
                  destination_lift: data.destinationLift,
                  destination_lift_notes: data.destinationLiftNotes,
                  destination_parking: data.destinationParking,
                  destination_parking_notes: data.destinationParkingNotes,
                },
              },
            });
          }, 2000);
          setIsLoading(false);
          return response.data;
        })
        .catch((error) => {
          setError("Failed to update survey data. Please try again.");
          setIsLoading(false);
          throw error;
        });
    } else {
      const { surveyId, ...payloadWithoutSurveyId } = payload;
      return apiClient
        .post(`/surveys/`, payloadWithoutSurveyId)
        .then((response) => {
          const newSurveyId = response.data.survey_id;
          setMessage("Survey created successfully!");
          setTimeout(() => {
            navigate(`/survey/${newSurveyId}/survey-summary`, {
              state: {
                customerData: { ...data, survey_id: response.data.survey_id },
                articles: data.articles,
                vehicles: data.vehicles,
                pets: data.pets,
                serviceData: {
                  general_owner_packed: data.generalOwnerPacked,
                  general_owner_packed_notes: data.generalOwnerPackedNotes,
                  general_restriction: data.generalRestriction,
                  general_restriction_notes: data.generalRestrictionNotes,
                  general_handyman: data.generalHandyman,
                  general_handyman_notes: data.generalHandymanNotes,
                  general_insurance: data.generalInsurance,
                  general_insurance_notes: data.generalInsuranceNotes,
                  origin_floor: data.originFloor,
                  origin_floor_notes: data.originFloorNotes,
                  origin_lift: data.originLift,
                  origin_lift_notes: data.originLiftNotes,
                  origin_parking: data.originParking,
                  origin_parking_notes: data.originParkingNotes,
                  origin_storage: data.originStorage,
                  origin_storage_notes: data.originStorageNotes,
                  destination_floor: data.destinationFloor,
                  destination_floor_notes: data.destinationFloorNotes,
                  destination_lift: data.destinationLift,
                  destination_lift_notes: data.destinationLiftNotes,
                  destination_parking: data.destinationParking,
                  destination_parking_notes: data.destinationParkingNotes,
                },
              },
            });
          }, 2000);
          setIsLoading(false);
          return response.data;
        })
        .catch((error) => {
          setError("Failed to create survey data. Please try again.");
          setIsLoading(false);
          throw error;
        });
    }
  };

  const onNext = async (data) => {
    if (activeTab === "customer") {
      try {
        setActiveTab(data.goodsType === "pet" ? "items" : "items");
      } catch (error) {
        setError("Failed to proceed to next step. Please try again.");
      }
    } else if (activeTab === "items") {
      if (data.goodsType === "pet" && data.pets.length === 0) {
        setError("Please add at least one pet before proceeding.");
        return;
      }
      if (data.goodsType === "article" && data.articles.length === 0) {
        setError("Please add at least one article before proceeding.");
        return;
      }
      setActiveTab("service");
    } else if (activeTab === "service") {
      try {
        await saveSurveyData(data);
      } catch (error) {
        console.error("Failed to save survey data:", error);
      }
    }
  };

  const onBack = () => {
    if (activeTab === "service") {
      setActiveTab(watch("goodsType") === "pet" ? "items" : "items");
    } else if (activeTab === "items") {
      setActiveTab("customer");
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
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
        <form onSubmit={handleSubmit(onNext)} className="space-y-6">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`py-2 px-4 text-sm font-medium ${activeTab === tab.id
                    ? "border-b-2 border-[#4c7085] text-[#4c7085]"
                    : "text-gray-500 hover:text-[#4c7085]"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            {activeTab === "customer" && <Customer />}
            {activeTab === "items" && (watch("goodsType") === "pet" ? <Pet /> : <Article />)}
            {activeTab === "service" && <Service />}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 w-full sm:w-auto bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 hover:shadow-md transition-all duration-300 text-sm"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 w-full sm:w-auto bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:bg-[#6b8ca3] hover:shadow-md transition-all duration-300 text-sm disabled:opacity-50"
            >
              {isLoading ? "Saving..." : activeTab === "service" ? "Save & Complete Survey" : "Next"}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default SurveyDetails;