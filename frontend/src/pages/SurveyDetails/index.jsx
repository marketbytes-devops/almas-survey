import { useState, useEffect, useRef, useMemo } from "react";
import {
  FaPlus,
  FaMinus,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaBars,
  FaEdit,
  FaCheck,
} from "react-icons/fa";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Loading from "../../components/Loading";
import Input from "../../components/Input";
import apiClient from "../../api/apiClient";
import { Country, State, City } from "country-state-city";

const DatePickerInput = ({ label, name, rules = {}, isTimeOnly = false }) => {
  const methods = useFormContext();
  if (!methods) return null;

  const {
    setValue,
    watch,
    formState: { errors },
  } = methods;
  const value = watch(name);
  const error = errors?.[name];

  const inputClasses = `
    w-full px-3 py-2 text-sm border rounded-md 
    transition-all duration-200 
    focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-opacity-50
    ${error ? "border-red-500" : "border-gray-300"}
    ${value ? "text-black" : "text-black"}
  `;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {rules?.required && <span className="text-red-500">*</span>}
      </label>

      <DatePicker
        selected={value}
        onChange={(date) => setValue(name, date, { shouldValidate: true })}
        showTimeSelect={isTimeOnly}
        showTimeSelectOnly={isTimeOnly}
        timeIntervals={15}
        timeCaption="Time"
        dateFormat={isTimeOnly ? "h:mm aa" : "MM/dd/yyyy"}
        className={inputClasses}
        wrapperClassName="w-full"
        placeholderText={isTimeOnly ? "Select time" : "Select date"}
        popperClassName="z-50"
        calendarClassName="shadow-lg border border-gray-200"
      />

      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error.message || "This field is required"}
        </p>
      )}
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
  // const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const [existingSurvey, setExistingSurvey] = useState(null);
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const { customerData: initialCustomerData } = location.state || {};
  const [showArticlesSidebar, setShowArticlesSidebar] = useState(false);

  const [apiData, setApiData] = useState({
    customerTypes: [],
    volumeUnits: [],
    weightUnits: [],
    packingTypes: [],
    handymanTypes: [],
    vehicleTypes: [],
    rooms: [],
    items: [],
  });

  const methods = useForm({
    defaultValues: {
      enquiry: surveyId || "",
      customerType: "",
      isMilitary: false,
      salutation: "",
      fullName: initialCustomerData?.fullName || "",
      phoneNumber: initialCustomerData?.phoneNumber || "",
      email: initialCustomerData?.email || "",
      serviceType: initialCustomerData?.serviceType || "",
      address: "",
      company: "",
      goodsType: "article",
      status: "pending",
      surveyDate: initialCustomerData?.surveyDate || null,
      surveyStartTime: initialCustomerData?.surveyStartTime || null,
      surveyEndTime: null,
      workDescription: "",
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
      additionalServices: [],
    },
  });

  const { handleSubmit, watch, setValue, reset, register } = methods;
  const hasReset = useRef(false);

  useEffect(() => {
    if (surveyId) {
      setIsLoading(true);
      apiClient
        .get(`/surveys/?enquiry_id=${surveyId}`)
        .then((res) => {
          if (res.data.length > 0) {
            const survey = res.data[0];
            setExistingSurvey(survey);
            const surveyDateTime = survey.survey_date
              ? new Date(survey.survey_date)
              : null;
            const surveyStartTime = survey.survey_start_time
              ? new Date(`1970-01-01T${survey.survey_start_time}`)
              : null;
            const surveyEndTime = survey.survey_end_time
              ? new Date(`1970-01-01T${survey.survey_end_time}`)
              : null;

            reset({
              enquiry: survey.enquiry || surveyId,
              // customerType: survey.customer_type?.id || "",
              customerType: survey.customer_type || "",
              isMilitary: survey.is_military || false,
              salutation: survey.salutation || "",
              fullName: survey.full_name || initialCustomerData?.fullName || "",
              phoneNumber:
                survey.mobile_number || initialCustomerData?.phoneNumber || "",
              email: survey.email || initialCustomerData?.email || "",
              serviceType:
                survey.service_type || initialCustomerData?.serviceType || "",
              address: survey.address || "",
              company: survey.company || "",
              goodsType: survey.goods_type || "article",
              status: survey.status || "pending",
              surveyDate: surveyDateTime,
              surveyStartTime,
              surveyEndTime,
              workDescription: survey.work_description || "",
              includeVehicle: survey.include_vehicle || false,
              originAddress: survey.origin_address || "",
              originCity: survey.origin_city || "",
              originCountry: survey.origin_country || "",
              originState: survey.origin_state || "",
              originZip: survey.origin_zip || "",
              podPol: survey.pod_pol || "",
              multipleAddresses: survey.multiple_addresses || false,
              destinationAddresses:
                survey.destination_addresses?.length > 0
                  ? survey.destination_addresses.map((addr) => ({
                      id: uuidv4(),
                      address: addr.address || "",
                      city: addr.city || "",
                      country: addr.country || "",
                      state: addr.state || "",
                      zip: addr.zip || "",
                      poe: addr.poe || "",
                    }))
                  : [
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
              packingDateFrom: survey.packing_date_from
                ? new Date(survey.packing_date_from)
                : null,
              packingDateTo: survey.packing_date_to
                ? new Date(survey.packing_date_to)
                : null,
              loadingDate: survey.loading_date
                ? new Date(survey.loading_date)
                : null,
              eta: survey.eta ? new Date(survey.eta) : null,
              etd: survey.etd ? new Date(survey.etd) : null,
              estDeliveryDate: survey.est_delivery_date
                ? new Date(survey.est_delivery_date)
                : null,
              storageStartDate: survey.storage_start_date
                ? new Date(survey.storage_start_date)
                : null,
              storageFrequency: survey.storage_frequency || "",
              storageDuration: survey.storage_duration || "",
              storageMode: survey.storage_mode || "",
              transportMode: survey.transport_mode || "road",
              articles:
                survey.articles?.map((a) => ({
                  id: uuidv4(),
                  itemName: a.item_name || "",
                  quantity: a.quantity || 0,
                  volume: a.volume || "",
                  volumeUnit: a.volume_unit || "",
                  weight: a.weight || "",
                  weightUnit: a.weight_unit || "",
                  handyman: a.handyman || "",
                  packingOption: a.packing_option || "",
                  moveStatus: a.move_status || "",
                  room: a.room || "",
                  length: a.length || "",
                  width: a.width || "",
                  height: a.height || "",
                })) || [],
              vehicles:
                survey.vehicles?.map((v) => ({
                  id: uuidv4(),
                  vehicleType: v.vehicle_type || "",
                  make: v.make || "",
                  model: v.model || "",
                  insurance: v.insurance || false,
                  remark: v.remark || "",
                  transportMode: v.transport_mode || "",
                })) || [],
              additionalServices:
                survey.additional_services?.map((service) => ({
                  id: service.id,
                  name: service.name,
                  selected: true,
                })) || [],
            });
            hasReset.current = true;
          }
          setIsLoading(false);
        })
        .catch(() => {
          setError("Failed to fetch survey data.");
          setIsLoading(false);
        });
    }
  }, [surveyId, initialCustomerData, reset]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      apiClient.get("/customer-types/"),
      apiClient.get("/volume-units/"),
      apiClient.get("/weight-units/"),
      apiClient.get("/packing-types/"),
      apiClient.get("/handyman/"),
      apiClient.get("/vehicle-types/"),
      apiClient.get("/rooms/"),
      apiClient.get("/items/"),
    ])
      .then((results) => {
        const data = results.map((r) => r.data);
        setApiData({
          customerTypes: data[0].map((t) => ({ value: t.id, label: t.name })),
          volumeUnits: data[1].map((u) => ({ value: u.id, label: u.name })),
          weightUnits: data[2].map((u) => ({ value: u.id, label: u.name })),
          packingTypes: data[3].map((t) => ({ value: t.id, label: t.name })),
          handymanTypes: data[4].map((t) => ({
            value: t.id,
            label: t.type_name,
          })),
          vehicleTypes: data[5].map((t) => ({ value: t.id, label: t.name })),
          rooms: data[6].map((r) => ({
            id: r.id,
            value: r.id,
            label: r.name,
            name: r.name,
          })),
          items: data[7],
        });
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to load master data.");
        setIsLoading(false);
      });
  }, []);

  const tabs = [
    { id: "customer", label: "Customer" },
    { id: "items", label: "Article" },
    { id: "additionalServices", label: "Additional Services" },
  ];

  const handleTabChange = (tabId) => {
    if (watch("goodsType") === "pet") {
      setMessage("Pet relocation feature is coming soon!");
      return;
    }
    setActiveTab(tabId);
  };

  const Customer = () => {
    const [destinationAddresses, setDestinationAddresses] = useState(
      watch("destinationAddresses")
    );
    const multipleAddresses = watch("multipleAddresses");

    const countryOptions = Country.getAllCountries().map((c) => ({
      value: c.isoCode,
      label: c.name,
    }));
    const getStateOptions = (code) =>
      code
        ? State.getStatesOfCountry(code).map((s) => ({
            value: s.isoCode,
            label: s.name,
          }))
        : [];
    const getCityOptions = (country, state) =>
      country && state
        ? City.getCitiesOfState(country, state).map((c) => ({
            value: c.name,
            label: c.name,
          }))
        : [];

    const originCountry = watch("originCountry");
    const originState = watch("originState");
    const destinationCountry = watch("destinationAddresses[0].country");
    const destinationState = watch("destinationAddresses[0].state");

    const serviceTypeOptions = [
      { value: "localMove", label: "Local Move" },
      { value: "internationalMove", label: "International Move" },
      { value: "carExport", label: "Car Import and Export" },
      { value: "storageServices", label: "Storage Services" },
      { value: "logistics", label: "Logistics" },
    ];

    const salutationOptions = [
      { value: "Mr", label: "Mr" },
      { value: "Ms", label: "Ms" },
      { value: "Mrs", label: "Mrs" },
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

    const addAddress = () => {
      const newAddr = {
        id: uuidv4(),
        address: "",
        city: "",
        country: "",
        state: "",
        zip: "",
        poe: "",
      };
      const updated = [...destinationAddresses, newAddr];
      setDestinationAddresses(updated);
      setValue("destinationAddresses", updated);
    };

    const removeAddress = (index) => {
      if (destinationAddresses.length > 1) {
        const updated = destinationAddresses.filter((_, i) => i !== index);
        setDestinationAddresses(updated);
        setValue("destinationAddresses", updated);
      }
    };

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
            />
            <Input
              label="Salutation"
              name="salutation"
              type="select"
              options={salutationOptions}
            />
            <Input
              label="Full Name"
              name="fullName"
              rules={{ required: "Required" }}
            />
            <Input
              label="Phone"
              name="phoneNumber"
              rules={{ required: "Required" }}
            />
            <Input label="Email" name="email" type="email" />
            <Input
              label="Service Type"
              name="serviceType"
              type="select"
              options={serviceTypeOptions}
            />
            <Input label="Address" name="address" />
            <Input label="Company" name="company" />
            <Input
              label="Status"
              name="status"
              type="select"
              options={statusOptions}
            />
            <div className="flex items-center gap-2">
              <input type="checkbox" {...register("isMilitary")} />
              <label>Military</label>
            </div>
          </div>
        ),
      },
      {
        id: "survey-details",
        title: "Survey Details",
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePickerInput label="Survey Date" name="surveyDate" />
            <DatePickerInput
              label="Start Time"
              name="surveyStartTime"
              isTimeOnly
            />
            <DatePickerInput label="End Time" name="surveyEndTime" isTimeOnly />
            <Input
              label="Work Description"
              name="workDescription"
              type="textarea"
            />
          </div>
        ),
      },
      {
        id: "origin-address",
        title: "Origin Address",
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Origin Address" name="originAddress" />
            <Input
              label="Country"
              name="originCountry"
              type="select"
              options={countryOptions}
            />
            <Input
              label="State"
              name="originState"
              type="select"
              options={getStateOptions(originCountry)}
            />
            <Input
              label="City"
              name="originCity"
              type="select"
              options={getCityOptions(originCountry, originState)}
            />
            <Input label="ZIP" name="originZip" />
            <Input label="POD/POL" name="podPol" />
          </div>
        ),
      },
      {
        id: "destination-details",
        title: "Destination Details",
        content: (
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("multipleAddresses")} />
              <span>Multiple Addresses</span>
            </label>
            {multipleAddresses ? (
              <>
                {destinationAddresses.map((addr, i) => {
                  const country = watch(`destinationAddresses[${i}].country`);
                  const state = watch(`destinationAddresses[${i}].state`);
                  return (
                    <div
                      key={addr.id}
                      className="bg-gray-100 p-4 rounded space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Address {i + 1}</h4>
                        {destinationAddresses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAddress(i)}
                            className="text-red-600"
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Address"
                          name={`destinationAddresses[${i}].address`}
                        />
                        <Input
                          label="Country"
                          name={`destinationAddresses[${i}].country`}
                          type="select"
                          options={countryOptions}
                        />
                        <Input
                          label="State"
                          name={`destinationAddresses[${i}].state`}
                          type="select"
                          options={getStateOptions(country)}
                        />
                        <Input
                          label="City"
                          name={`destinationAddresses[${i}].city`}
                          type="select"
                          options={getCityOptions(country, state)}
                        />
                        <Input
                          label="ZIP"
                          name={`destinationAddresses[${i}].zip`}
                        />
                        <Input
                          label="POE"
                          name={`destinationAddresses[${i}].poe`}
                        />
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addAddress}
                  className="px-6 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-sm font-medium rounded-lg shadow hover:shadow-lg transform transition"
                >
                  Add Address
                </button>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Address" name="destinationAddresses[0].address" />
                <Input
                  label="Country"
                  name="destinationAddresses[0].country"
                  type="select"
                  options={countryOptions}
                />
                <Input
                  label="State"
                  name="destinationAddresses[0].state"
                  type="select"
                  options={getStateOptions(destinationCountry)}
                />
                <Input
                  label="City"
                  name="destinationAddresses[0].city"
                  type="select"
                  options={getCityOptions(destinationCountry, destinationState)}
                />
                <Input label="ZIP" name="destinationAddresses[0].zip" />
                <Input label="POE" name="destinationAddresses[0].poe" />
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
            <DatePickerInput label="Packing From" name="packingDateFrom" />
            <DatePickerInput label="Packing To" name="packingDateTo" />
            <DatePickerInput label="Loading Date" name="loadingDate" />
            <DatePickerInput label="ETA" name="eta" />
            <DatePickerInput label="ETD" name="etd" />
            <DatePickerInput label="Est. Delivery" name="estDeliveryDate" />
          </div>
        ),
      },
      {
        id: "storage-details",
        title: "Storage Details",
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePickerInput label="Storage Start" name="storageStartDate" />
            <Input
              label="Frequency"
              name="storageFrequency"
              type="select"
              options={frequencyOptions}
            />
            <Input label="Duration" name="storageDuration" />
            <Input
              label="Mode"
              name="storageMode"
              type="select"
              options={storageModeOptions}
            />
          </div>
        ),
      },
    ];

    return (
      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-white rounded-lg shadow p-4 md:p-6"
          >
            <h3 className="text-lg sm:text-xl font-medium mb-4">
              {section.title}
            </h3>
            {section.content}
          </div>
        ))}
      </div>
    );
  };

  const Article = () => {
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showRoomDropdown, setShowRoomDropdown] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});
    const [itemQuantities, setItemQuantities] = useState({});
    const [selectedItems, setSelectedItems] = useState({});

    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setShowRoomDropdown(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleExpandedItem = (itemName) => {
      setExpandedItems((prev) => ({ ...prev, [itemName]: !prev[itemName] }));
    };

    const updateQuantity = (itemName, qty) => {
      setItemQuantities((prev) => ({ ...prev, [itemName]: Math.max(0, qty) })); // Allow 0
    };
    const toggleItemSelection = (itemName) => {
      setSelectedItems((prev) => ({ ...prev, [itemName]: !prev[itemName] }));
    };

    const calculateVolume = (length, width, height) => {
      if (!length || !width || !height) return 0;
      return (
        (parseFloat(length) * parseFloat(width) * parseFloat(height)) / 1000000
      );
    };

    const calculateWeight = (volume) => {
      return volume ? parseFloat(volume) * 110 : 0;
    };

    const addArticle = (itemName, formData = {}) => {
      const length = formData[`length_${itemName}`] || "";
      const width = formData[`width_${itemName}`] || "";
      const height = formData[`height_${itemName}`] || "";

      const volume = calculateVolume(length, width, height);
      const weight = calculateWeight(volume);

      const newArticle = {
        id: uuidv4(),
        itemName,
        quantity: itemQuantities[itemName] || 0,
        volume: volume.toFixed(4),
        volumeUnit:
          formData[`volumeUnit_${itemName}`] ||
          apiData.volumeUnits[0]?.value ||
          "",
        weight: weight.toFixed(2),
        weightUnit:
          formData[`weightUnit_${itemName}`] ||
          apiData.weightUnits[0]?.value ||
          "",
        handyman: formData[`handyman_${itemName}`] || "",
        packingOption: formData[`packingOption_${itemName}`] || "",
        moveStatus: "new",
        room: selectedRoom?.value || "",
        length,
        width,
        height,
      };

      setValue("articles", [...watch("articles"), newArticle]);
      setMessage("Article added!");
      setTimeout(() => setMessage(null), 3000);
      toggleExpandedItem(itemName);
      setItemQuantities((prev) => ({ ...prev, [itemName]: 1 }));
    };

    const addMultipleArticles = () => {
      const selectedItemNames = Object.keys(selectedItems).filter(
        (name) => selectedItems[name]
      );
      if (selectedItemNames.length === 0)
        return setError("Select at least one item");

      const newArticles = selectedItemNames.map((itemName) => ({
        id: uuidv4(),
        itemName,
        quantity: itemQuantities[itemName] || 1,
        volume: "",
        volumeUnit: "",
        weight: "",
        weightUnit: "",
        handyman: "",
        packingOption: "",
        moveStatus: "new",
        room: selectedRoom?.value || "",
        length: "",
        width: "",
        height: "",
      }));

      setValue("articles", [...watch("articles"), ...newArticles]);
      setMessage(`${newArticles.length} articles added!`);
      setTimeout(() => setMessage(null), 3000);
      setSelectedItems({});
    };
    // ✅ Use useMemo instead of useEffect + useState
    const filteredRooms = useMemo(() => {
      const query = roomSearchQuery.toLowerCase().trim();
      const roomsToFilter = apiData.rooms || [];

      console.log("🔍 Debug Search:");
      console.log("Search Query:", query);
      console.log("All Rooms:", roomsToFilter);

      if (!query) {
        console.log("✅ Empty query, showing all rooms");
        return roomsToFilter;
      }

      const filtered = roomsToFilter.filter((room) => {
        const roomLabel = (room.label || "").toLowerCase();
        const roomName = (room.name || "").toLowerCase();
        return roomLabel.includes(query) || roomName.includes(query);
      });

      console.log(
        "✅ Filtered Results:",
        filtered.map((r) => r.label)
      );
      return filtered;
    }, [roomSearchQuery, apiData.rooms]); // ← Only depend on length// ← Only depend on length, not the full array

    const removeArticle = (id) => {
      setValue(
        "articles",
        watch("articles").filter((a) => a.id !== id)
      );
      setMessage("Article removed!");
      setTimeout(() => setMessage(null), 3000);
    };
    const ItemForm = ({ item, onAdd, onCancel }) => {
      // Initialize formData with master item values (this is the key!)
      const [formData, setFormData] = useState({
        [`length_${item.name}`]: item.length || "",
        [`width_${item.name}`]: item.width || "",
        [`height_${item.name}`]: item.height || "",
        [`volume_${item.name}`]: item.volume || "",
        [`weight_${item.name}`]: item.weight || "",
        [`volumeUnit_${item.name}`]: "",
        [`weightUnit_${item.name}`]: "",
        [`handyman_${item.name}`]: "",
        [`packingOption_${item.name}`]: "",
      });

      // Set default units only after apiData is loaded
      useEffect(() => {
        if (apiData.volumeUnits.length > 0) {
          setFormData((prev) => ({
            ...prev,
            [`volumeUnit_${item.name}`]: apiData.volumeUnits[0].value,
            [`weightUnit_${item.name}`]: apiData.weightUnits[0]?.value || "",
          }));
        }
      }, [apiData.volumeUnits, apiData.weightUnits, item.name]);
      const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        const l =
          field === `length_${item.name}`
            ? value
            : formData[`length_${item.name}`];
        const w =
          field === `width_${item.name}`
            ? value
            : formData[`width_${item.name}`];
        const h =
          field === `height_${item.name}`
            ? value
            : formData[`height_${item.name}`];

        if (l && w && h) {
          const vol = calculateVolume(l, w, h);
          const wt = calculateWeight(vol);

          setFormData((prev) => ({
            ...prev,
            [`volume_${item.name}`]: vol.toFixed(4),
            [`weight_${item.name}`]: wt.toFixed(2),
          }));
        }
      };

      // Re-calculate volume/weight whenever L/W/H changes (live update)
      const currentLength = formData[`length_${item.name}`];
      const currentWidth = formData[`width_${item.name}`];
      const currentHeight = formData[`height_${item.name}`];

      const volume =
        currentLength && currentWidth && currentHeight
          ? calculateVolume(currentLength, currentWidth, currentHeight).toFixed(
              4
            )
          : item.volume || "0.0000";

      const weight = volume
        ? calculateWeight(parseFloat(volume)).toFixed(2)
        : item.weight || "0.00";

      return (
        <div className="px-4 pb-4 pt-4 bg-gradient-to-b from-indigo-50 to-white border-t border-indigo-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="col-span-full">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Dimensions
              </h4>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData[`length_${item.name}`]}
                    onChange={(e) =>
                      handleInputChange(`length_${item.name}`, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                    placeholder={
                      item.length ? `${item.length} (default)` : "0.00"
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData[`width_${item.name}`]}
                    onChange={(e) =>
                      handleInputChange(`width_${item.name}`, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                    placeholder={
                      item.width ? `${item.width} (default)` : "0.00"
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData[`height_${item.name}`]}
                    onChange={(e) =>
                      handleInputChange(`height_${item.name}`, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                    placeholder={
                      item.height ? `${item.height} (default)` : "0.00"
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Volume (m³){" "}
                    <span className="text-green-600 text-xs">(auto)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={volume}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Volume Unit
                  </label>
                  <select
                    value={formData[`volumeUnit_${item.name}`]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [`volumeUnit_${item.name}`]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                  >
                    {apiData.volumeUnits.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="col-span-full">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Weight
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Weight (kg){" "}
                    <span className="text-green-600 text-xs">(est.)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={weight}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Weight Unit
                  </label>
                  <select
                    value={formData[`weightUnit_${item.name}`]}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [`weightUnit_${item.name}`]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                  >
                    {apiData.weightUnits.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Handyman
              </label>
              <select
                value={formData[`handyman_${item.name}`]}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [`handyman_${item.name}`]: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
              >
                <option value="">Select</option>
                {apiData.handymanTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Packing Option
              </label>
              <select
                value={formData[`packingOption_${item.name}`]}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [`packingOption_${item.name}`]: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
              >
                <option value="">Select</option>
                {apiData.packingTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <button
              type="button"
              onClick={() => onAdd(item.name, formData)}
              className="px-6 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-sm font-medium rounded-lg shadow hover:shadow-lg transform transition"
            >
              Add to Survey
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    };
    const ItemRow = ({ item }) => {
      const qty = itemQuantities[item.name] || 0;
      const isSelected = selectedItems[item.name] || false;

      return (
        <div className="border-b border-gray-200 last:border-0">
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 
                      hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 
                      transition-all rounded-lg"
          >
            <div className="flex items-start sm:items-center gap-4 flex-1 w-full">
              {/* Custom Circle Selection Button */}
              <button
                type="button"
                onClick={() => toggleItemSelection(item.name)}
                className="focus:outline-none"
              >
                <div
                  className={`w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? "bg-[#4c7085] border-[#4c7085]"
                      : "bg-white border-gray-400"
                  }`}
                >
                  {isSelected && (
                    <div className="w-4 h-4 bg-white rounded-full" />
                  )}
                </div>
              </button>

              <div className="flex-1">
                <div className="font-semibold text-gray-800 text-sm sm:text-base">
                  {item.name}
                </div>

                {item.description && (
                  <div className="text-xs text-gray-500 mt-1">
                    {item.description}
                  </div>
                )}

                {(item.length || item.width || item.height) && (
                  <div className="text-xs text-gray-500 mt-1">
                    {item.length && `L:${item.length}cm`}
                    {item.width && ` × W:${item.width}cm`}
                    {item.height && ` × H:${item.height}cm`}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center justify-between w-full sm:w-auto bg-white border border-gray-300 rounded-lg shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.name, Math.max(0, qty - 1))
                  }
                  className="p-3 text-gray-600 hover:bg-gray-100 rounded-l-lg transition w-1/3 sm:w-auto"
                >
                  <FaMinus className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={qty}
                  readOnly
                  className="w-full sm:w-16 text-center font-medium text-gray-800 bg-transparent outline-none py-2"
                />
                <button
                  type="button"
                  onClick={() => updateQuantity(item.name, qty + 1)}
                  className="p-3 text-gray-600 hover:bg-gray-100 rounded-r-lg transition w-1/3 sm:w-auto"
                >
                  <FaPlus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => toggleExpandedItem(item.name)}
                className="text-sm flex gap-2 items-center justify-center p-3 text-[#4c7085] hover:bg-indigo-100 rounded-full transition"
              >
                Item Options{" "}
                {expandedItems[item.name] ? (
                  <FaChevronUp className="w-4 h-4" />
                ) : (
                  <FaChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {expandedItems[item.name] && (
            <ItemForm
              item={item}
              onAdd={addArticle}
              onCancel={() => toggleExpandedItem(item.name)}
            />
          )}
        </div>
      );
    };
    const AddedArticlesSidebar = () => {
      const articles = watch("articles");
      const [editingArticle, setEditingArticle] = useState(null);
      const [editFormData, setEditFormData] = useState({});

      useEffect(() => {
        if (editingArticle) {
          const article = articles.find((a) => a.id === editingArticle);
          if (article) {
            setEditFormData({
              quantity: article.quantity || 1,
              length: article.length || "",
              width: article.width || "",
              height: article.height || "",
              volume: article.volume || "",
              volumeUnit:
                article.volumeUnit || apiData.volumeUnits[0]?.value || "",
              weight: article.weight || "",
              weightUnit:
                article.weightUnit || apiData.weightUnits[0]?.value || "",
              handyman: article.handyman || "",
              packingOption: article.packingOption || "",
            });
          }
        }
      }, [editingArticle, articles]);

      const calculateVolume = (length, width, height) => {
        if (!length || !width || !height) return 0;
        return (
          (parseFloat(length) * parseFloat(width) * parseFloat(height)) /
          1000000
        );
      };

      const calculateWeight = (volume) => {
        return volume ? parseFloat(volume) * 110 : 0;
      };

      const handleEditInputChange = (field, value) => {
        setEditFormData((prev) => {
          const newData = { ...prev, [field]: value };

          if (field === "length" || field === "width" || field === "height") {
            const l = field === "length" ? value : prev.length;
            const w = field === "width" ? value : prev.width;
            const h = field === "height" ? value : prev.height;

            if (l && w && h) {
              const vol = calculateVolume(l, w, h);
              const wt = calculateWeight(vol);
              newData.volume = vol.toFixed(4);
              newData.weight = wt.toFixed(2);
            }
          }

          return newData;
        });
      };

      const updateArticle = (articleId) => {
        const updatedArticles = articles.map((article) => {
          if (article.id === articleId) {
            return {
              ...article,
              quantity: editFormData.quantity || 1,
              length: editFormData.length || "",
              width: editFormData.width || "",
              height: editFormData.height || "",
              volume: editFormData.volume || "",
              volumeUnit: editFormData.volumeUnit || "",
              weight: editFormData.weight || "",
              weightUnit: editFormData.weightUnit || "",
              handyman: editFormData.handyman || "",
              packingOption: editFormData.packingOption || "",
            };
          }
          return article;
        });

        setValue("articles", updatedArticles);
        setEditingArticle(null);
        setMessage("Article updated!");
        setTimeout(() => setMessage(null), 3000);
      };

      const cancelEdit = () => {
        setEditingArticle(null);
        setEditFormData({});
      };

      const removeArticle = (id) => {
        setValue(
          "articles",
          articles.filter((a) => a.id !== id)
        );
        setMessage("Article removed!");
        setTimeout(() => setMessage(null), 3000);
      };

      return (
        <div
          className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform z-50 ${
            showArticlesSidebar ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white">
            <h3 className="font-medium">Added Articles ({articles.length})</h3>
            <button
              onClick={() => setShowArticlesSidebar(false)}
              className="p-1 hover:bg-white/20 rounded"
            >
              <FaTimes />
            </button>
          </div>

          <div className="overflow-y-auto p-4 space-y-3 h-[calc(100%-64px)]">
            {articles.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No articles added
              </p>
            ) : (
              articles.map((article) => (
                <div
                  key={article.id}
                  className="p-3 border border-gray-300 rounded-lg bg-white shadow-sm"
                >
                  {editingArticle === article.id ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm text-gray-800">
                          {article.itemName}
                        </h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateArticle(article.id)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Save"
                          >
                            <FaCheck className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            title="Cancel"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Quantity
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEditInputChange(
                                "quantity",
                                Math.max(1, (editFormData.quantity || 1) - 1)
                              )
                            }
                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            <FaMinus className="w-2 h-2" />
                          </button>
                          <input
                            type="number"
                            value={editFormData.quantity || 1}
                            onChange={(e) =>
                              handleEditInputChange(
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-12 text-center px-1 py-1 border rounded text-sm"
                            min="1"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleEditInputChange(
                                "quantity",
                                (editFormData.quantity || 1) + 1
                              )
                            }
                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            <FaPlus className="w-2 h-2" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Dimensions (cm)
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="L"
                            value={editFormData.length || ""}
                            onChange={(e) =>
                              handleEditInputChange("length", e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="W"
                            value={editFormData.width || ""}
                            onChange={(e) =>
                              handleEditInputChange("width", e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="H"
                            value={editFormData.height || ""}
                            onChange={(e) =>
                              handleEditInputChange("height", e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Volume (m³)
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={editFormData.volume || "0.0000"}
                            className="w-full px-2 py-1 bg-gray-50 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Volume Unit
                          </label>
                          <select
                            value={editFormData.volumeUnit || ""}
                            onChange={(e) =>
                              handleEditInputChange(
                                "volumeUnit",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {apiData.volumeUnits.map((unit) => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Weight (kg)
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={editFormData.weight || "0.00"}
                            className="w-full px-2 py-1 bg-gray-50 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Weight Unit
                          </label>
                          <select
                            value={editFormData.weightUnit || ""}
                            onChange={(e) =>
                              handleEditInputChange(
                                "weightUnit",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {apiData.weightUnits.map((unit) => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Handyman
                          </label>
                          <select
                            value={editFormData.handyman || ""}
                            onChange={(e) =>
                              handleEditInputChange("handyman", e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select</option>
                            {apiData.handymanTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Packing Option
                          </label>
                          <select
                            value={editFormData.packingOption || ""}
                            onChange={(e) =>
                              handleEditInputChange(
                                "packingOption",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select</option>
                            {apiData.packingTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-800">
                          {article.itemName}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Qty: {article.quantity}
                        </div>
                        {article.volume && (
                          <div className="text-xs text-gray-600">
                            Vol: {article.volume}{" "}
                            {apiData.volumeUnits.find(
                              (u) => u.value === article.volumeUnit
                            )?.label || "m³"}
                          </div>
                        )}
                        {article.weight && (
                          <div className="text-xs text-gray-600">
                            Wt: {article.weight}{" "}
                            {apiData.weightUnits.find(
                              (u) => u.value === article.weightUnit
                            )?.label || "kg"}
                          </div>
                        )}
                        {(article.length ||
                          article.width ||
                          article.height) && (
                          <div className="text-xs text-gray-600">
                            Dim: {article.length && `L:${article.length}cm`}
                            {article.width && ` × W:${article.width}cm`}
                            {article.height && ` × H:${article.height}cm`}
                          </div>
                        )}
                        {article.handyman && (
                          <div className="text-xs text-gray-600">
                            Handyman:{" "}
                            {
                              apiData.handymanTypes.find(
                                (h) => h.value === article.handyman
                              )?.label
                            }
                          </div>
                        )}
                        {article.packingOption && (
                          <div className="text-xs text-gray-600">
                            Packing:{" "}
                            {
                              apiData.packingTypes.find(
                                (p) => p.value === article.packingOption
                              )?.label
                            }
                          </div>
                        )}
                        {article.room && (
                          <div className="text-xs text-gray-600">
                            Room:{" "}
                            {apiData.rooms.find((r) => r.value === article.room)
                              ?.label || article.room}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => setEditingArticle(article.id)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit"
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeArticle(article.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove"
                        >
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      );
    };
    return (
      <div className="relative">
        <AddedArticlesSidebar />
        {showArticlesSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowArticlesSidebar(false)}
          />
        )}

        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg sm:text-xl font-medium text-black">
                Select Room
              </h3>
              <button
                type="button"
                onClick={() => setShowArticlesSidebar(true)}
                className="hidden sm:flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white font-medium rounded-lg text-sm shadow-md hover:shadow-xl transition transform hover:scale-105"
              >
                <FaBars /> View Added ({watch("articles").length})
              </button>
            </div>

            {/* 🔥 FIXED: Room Search Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  value={roomSearchQuery}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log("📝 Input changed to:", newValue);
                    setRoomSearchQuery(newValue);

                    // Clear selected room if user is typing something different
                    if (selectedRoom && newValue !== selectedRoom.label) {
                      setSelectedRoom(null);
                    }

                    // Always show dropdown when typing
                    setShowRoomDropdown(true);
                  }}
                  onFocus={() => {
                    console.log("🎯 Input focused");
                    setShowRoomDropdown(true);
                  }}
                  placeholder="Type to search rooms..."
                  className="w-full px-6 py-3 text-left text-sm font-medium rounded-xl border-2 border-gray-300 bg-white text-gray-700 placeholder-gray-500 pr-12 shadow-sm focus:outline-none focus:border-blue-500"
                />

                {/* Clear button */}
                {roomSearchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering other events
                      console.log("🗑️ Clearing search");
                      setRoomSearchQuery("");
                      setSelectedRoom(null);
                      setShowRoomDropdown(true); // Keep dropdown open after clearing
                    }}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                )}

                {/* Dropdown arrow */}
                <button
                  type="button"
                  onClick={() => {
                    console.log("⬇️ Arrow clicked");
                    setShowRoomDropdown(!showRoomDropdown);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <FaChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      showRoomDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Dropdown menu */}
              {showRoomDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                  {filteredRooms.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No rooms found matching "{roomSearchQuery}"
                    </div>
                  ) : (
                    filteredRooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => {
                          console.log("✅ Room selected:", room.label);
                          setSelectedRoom(room);
                          setRoomSearchQuery(room.label);
                          setShowRoomDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-sm border-b border-gray-100 last:border-0 ${
                          selectedRoom?.id === room.id
                            ? "bg-blue-100 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {room.label}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {selectedRoom && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {Object.values(selectedItems).some((v) => v) && (
                <div className="p-5 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white flex justify-between items-center">
                  <span className="font-medium">
                    {Object.values(selectedItems).filter(Boolean).length}{" "}
                    item(s) selected
                  </span>
                  <button
                    onClick={addMultipleArticles}
                    className="px-6 py-2 bg-white text-[#4c7085] font-medium rounded-lg hover:bg-indigo-50 transition shadow-lg"
                  >
                    Add Selected
                  </button>
                </div>
              )}

              <div className="divide-y divide-gray-200">
                {apiData.items
                  .filter((i) => i.room === selectedRoom.id)
                  .map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
              </div>

              {apiData.items.filter((i) => i.room === selectedRoom.id)
                .length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <p className="text-lg">No items found in this room.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const VehicleDetails = () => {
    const vehicles = watch("vehicles") || [];

    const addVehicle = () => {
      setValue("vehicles", [
        ...vehicles,
        {
          id: uuidv4(),
          vehicleType: "",
          make: "",
          model: "",
          insurance: false,
          remark: "",
        },
      ]);
    };

    const removeVehicle = (id) => {
      setValue(
        "vehicles",
        vehicles.filter((v) => v.id !== id)
      );
    };

    return (
      <div className="mt-4 sm:mt-10 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg sm:text-xl font-medium">Vehicle Details</h2>
          <button
            type="button"
            onClick={addVehicle}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded"
          >
            <FaPlus /> Add Vehicle
          </button>
        </div>

        {vehicles.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No vehicles added yet.
          </p>
        ) : (
          <div className="space-y-6">
            {vehicles.map((vehicle, index) => (
              <div
                key={vehicle.id}
                className="rounded-lg p-6 bg-gray-100 relative"
              >
                <button
                  type="button"
                  onClick={() => removeVehicle(vehicle.id)}
                  className="absolute top-4 right-4 text-red-600 hover:bg-red-100 p-2 rounded"
                >
                  <FaTimes />
                </button>
                <h4 className="text-lg sm:text-xl font-medium mb-4">
                  Vehicle {index + 1}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Vehicle Type"
                    name={`vehicles[${index}].vehicleType`}
                    type="select"
                    options={apiData.vehicleTypes}
                  />
                  <Input
                    label="Make"
                    name={`vehicles[${index}].make`}
                    placeholder="e.g. Toyota"
                  />
                  <Input
                    label="Model"
                    name={`vehicles[${index}].model`}
                    placeholder="e.g. Camry"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      {...register(`vehicles[${index}].insurance`)}
                      className="w-4 h-4"
                    />
                    <label className="font-medium">Insurance Required</label>
                  </div>
                </div>
                <div className="mt-4">
                  <Input
                    label="Remark (Optional)"
                    name={`vehicles[${index}].remark`}
                    type="textarea"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addVehicle}
          className="w-full flex sm:hidden mt-6 items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded"
        >
          <FaPlus /> Add Vehicle
        </button>
      </div>
    );
  };

  const AdditionalServicesTab = () => {
    const [additionalServices, setAdditionalServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const selectedServices = watch("additionalServices") || [];

    useEffect(() => {
      const fetchAdditionalServices = async () => {
        try {
          const response = await apiClient.get("/survey-additional-services/");
          setAdditionalServices(response.data);
        } catch (err) {
          setError("Failed to load additional services.");
          console.error("Error fetching additional services:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchAdditionalServices();
    }, []);

    const handleServiceToggle = (serviceId, serviceName) => {
      const isCurrentlySelected = selectedServices.some(
        (service) => service.id === serviceId
      );

      let updatedServices;
      if (isCurrentlySelected) {
        updatedServices = selectedServices.filter(
          (service) => service.id !== serviceId
        );
      } else {
        updatedServices = [
          ...selectedServices,
          { id: serviceId, name: serviceName, selected: true },
        ];
      }

      setValue("additionalServices", updatedServices, { shouldValidate: true });
    };

    const isServiceSelected = (serviceId) => {
      return selectedServices.some((service) => service.id === serviceId);
    };

    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loading />
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-6">
          Additional Services
        </h3>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {additionalServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No additional services available. Please add services in the
              settings first.
            </div>
          ) : (
            additionalServices.map((service) => (
              <div
                key={service.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 ${
                  isServiceSelected(service.id)
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={isServiceSelected(service.id)}
                    onChange={() =>
                      handleServiceToggle(service.id, service.name)
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span
                    className={`font-medium ${
                      isServiceSelected(service.id)
                        ? "text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    {service.name}
                  </span>
                </div>

                {isServiceSelected(service.id) && (
                  <span className="text-sm text-green-600 font-medium">
                    Selected
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        {selectedServices.length > 0 && (
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-lg sm:text-xl font-medium text-green-800 mb-2">
              Selected Additional Services ({selectedServices.length})
            </h4>
            <div className="space-y-2">
              {selectedServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-green-700">{service.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleServiceToggle(service.id, service.name)
                    }
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const saveSurveyData = async (data) => {
    setIsLoading(true);
    const payload = {
      enquiry: surveyId ? parseInt(surveyId) : null,
      customer_type: data.customerType || null,
      is_military: data.isMilitary,
      salutation: data.salutation,
      full_name: data.fullName,
      phone_number: data.phoneNumber,
      email: data.email,
      service_type: data.serviceType,
      address: data.address,
      company: data.company,
      goods_type: data.goodsType,
      status: data.status,
      survey_date: data.surveyDate
        ? data.surveyDate.toISOString().split("T")[0]
        : null,
      survey_start_time: data.surveyStartTime
        ? data.surveyStartTime.toTimeString().split(" ")[0].slice(0, 5)
        : null,
      survey_end_time: data.surveyEndTime
        ? data.surveyEndTime.toTimeString().split(" ")[0].slice(0, 5)
        : null,
      work_description: data.workDescription,
      include_vehicle: data.includeVehicle,
      origin_address: data.originAddress,
      origin_city: data.originCity,
      origin_country: data.originCountry,
      origin_state: data.originState,
      origin_zip: data.originZip,
      pod_pol: data.podPol,
      multiple_addresses: data.multipleAddresses,
      destination_addresses: data.destinationAddresses.map((a) => ({
        address: a.address,
        city: a.city,
        country: a.country,
        state: a.state,
        zip: a.zip,
        poe: a.poe,
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
      articles: data.articles.map((a) => ({
        room: a.room || null,
        item_name: a.itemName,
        quantity: a.quantity,
        volume: a.volume || null,
        volume_unit: a.volumeUnit || null,
        weight: a.weight || null,
        weight_unit: a.weightUnit || null,
        handyman: a.handyman || null,
        packing_option: a.packingOption || null,
        move_status: a.moveStatus || "new",
        length: a.length || null,
        width: a.width || null,
        height: a.height || null,
      })),
      vehicles: data.vehicles.map((v) => ({
        vehicle_type: v.vehicleType || null,
        make: v.make || "",
        model: v.model || "",
        insurance: v.insurance || false,
        remark: v.remark || "",
      })),
      additional_service_ids:
        data.additionalServices?.map((service) => service.id) || [],
    };

    const request = existingSurvey
      ? apiClient.put(`/surveys/${existingSurvey.survey_id}/`, payload)
      : apiClient.post("/surveys/", payload);

    request
      .then((res) => {
        setMessage(existingSurvey ? "Survey updated!" : "Survey created!");
        setTimeout(
          () =>
            navigate(`/survey/${res.data.survey_id}/survey-summary`, {
              state: { customerData: data },
            }),
          2000
        );
      })
      .catch((err) => {
        console.error("Error saving survey:", err.response?.data);
        setError("Failed to save survey.");
      })
      .finally(() => setIsLoading(false));
  };

  const onNext = (data) => {
    if (activeTab === "customer") {
      setActiveTab("items");
    } else if (activeTab === "items") {
      setActiveTab("additionalServices");
    } else if (activeTab === "additionalServices") {
      if (
        data.articles.length === 0 &&
        data.vehicles.length === 0 &&
        data.additionalServices.length === 0
      ) {
        setError("Add at least one article, vehicle, or additional service");
        return;
      }
      saveSurveyData(data);
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Saving...";

    switch (activeTab) {
      case "customer":
        return "Next";
      case "items":
        return "Next";
      case "additionalServices":
        return "Save & Complete";
      default:
        return "Next";
    }
  };

  const handleBack = () => {
    switch (activeTab) {
      case "items":
        setActiveTab("customer");
        break;
      case "additionalServices":
        setActiveTab("items");
        break;
      default:
        navigate(-1);
        break;
    }
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Loading />
        </div>
      )}
      {error && (
        <div className="fixed top-28 sm:top-20 right-4 sm:right-8 bg-red-500 text-white px-6 py-3 text-sm rounded shadow-lg z-50">
          {error}
        </div>
      )}
      {message && (
        <div className="fixed top-28 sm:top-20 right-4 sm:right-8 bg-green-500 text-white px-6 py-3 text-sm rounded shadow-lg z-50">
          {message}
        </div>
      )}

      <div className="min-h-auto">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onNext)} className="mx-auto">
            <div className="grid sm:grid-cols-3 w-full gap-4 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-6 py-2 rounded-lg text-sm font-medium ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "customer" && <Customer />}
            {activeTab === "items" && (
              <>
                <Article />
                <div className="mt-4 sm:mt-10">
                  <VehicleDetails />
                </div>
              </>
            )}
            {activeTab === "additionalServices" && <AdditionalServicesTab />}
            <div className="flex gap-4 mt-4 sm:mt-10">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getButtonText()}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </>
  );
};

export default SurveyDetails;
