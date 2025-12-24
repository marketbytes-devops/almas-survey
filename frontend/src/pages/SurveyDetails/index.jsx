import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaMinus, FaChevronDown, FaChevronUp, FaTimes, FaBars, FaEdit, FaCheck, FaSearch } from "react-icons/fa";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Loading from "../../components/Loading";
import Input from "../../components/Input";
import apiClient from "../../api/apiClient";
import { Country, State, City } from "country-state-city";
import SignatureModal from "../../components/SignatureModal/SignatureModal";
import Modal from "../../components/Modal";

const DatePickerInput = ({ label, name, rules = {}, isTimeOnly = false }) => {
  const methods = useFormContext();
  if (!methods) return null;

  const { setValue, watch, formState: { errors } } = methods;
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
        <p className="mt-1 text-xs text-red-500">{error.message || "This field is required"}</p>
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
  const [existingSurvey, setExistingSurvey] = useState(null);
  const { customerData: initialCustomerData } = location.state || {};
  const [showArticlesSidebar, setShowArticlesSidebar] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const [signatureUploaded, setSignatureUploaded] = useState(false);
  const [signatureImageUrl, setSignatureImageUrl] = useState(null);

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
      originCity: "Doha",
      originCountry: "QA",
      originState: "",
      multipleAddresses: false,
      destinationAddresses: [{
        id: uuidv4(),
        address: "",
        city: "Doha",
        country: "QA",
        state: "",
        zip: "",
        poe: ""
      }],
      storageRequired: false,
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
      apiClient.get(`/surveys/?enquiry_id=${surveyId}`).then((res) => {
        if (res.data.length > 0) {
          const survey = res.data[0];
          setExistingSurvey(survey);
          if (survey.signature_uploaded) {
            apiClient.get(`/surveys/${survey.survey_id}/signature/`)
              .then((res) => {
                setSignatureImageUrl(res.data.signature_url);
              })
              .catch(() => {
                console.warn("Could not load signature image");
              });
          }
          setSignatureUploaded(survey.signature_uploaded || false);
          const surveyDateTime = survey.survey_date ? new Date(survey.survey_date) : null;
          const surveyStartTime = survey.survey_start_time ? new Date(`1970-01-01T${survey.survey_start_time}`) : null;
          const surveyEndTime = survey.survey_end_time ? new Date(`1970-01-01T${survey.survey_end_time}`) : null;

          reset({
            enquiry: survey.enquiry || surveyId,
            customerType: survey.customer_type || "",
            isMilitary: survey.is_military || false,
            salutation: survey.salutation || "",
            fullName: survey.full_name || initialCustomerData?.fullName || "",
            phoneNumber: survey.mobile_number || initialCustomerData?.phoneNumber || "",
            email: survey.email || initialCustomerData?.email || "",
            serviceType: survey.service_type || initialCustomerData?.serviceType || "",
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
            originCity: survey.origin_city || "Doha",
            originCountry: survey.origin_country || "QA",
            originState: survey.origin_state || "",
            originZip: survey.origin_zip || "",
            podPol: survey.pod_pol || "",
            multipleAddresses: survey.multiple_addresses || false,
            destinationAddresses: survey.destination_addresses?.length > 0 ? survey.destination_addresses.map((addr) => ({
              id: uuidv4(),
              address: addr.address || "",
              city: addr.city || "",
              country: addr.country || "",
              state: addr.state || "",
              zip: addr.zip || "",
              poe: addr.poe || "",
            })) : [{ id: uuidv4(), address: "", city: "", country: "", state: "", zip: "", poe: "" }],
            packingDateFrom: survey.packing_date_from ? new Date(survey.packing_date_from) : null,
            packingDateTo: survey.packing_date_to ? new Date(survey.packing_date_to) : null,
            loadingDate: survey.loading_date ? new Date(survey.loading_date) : null,
            eta: survey.eta ? new Date(survey.eta) : null,
            etd: survey.etd ? new Date(survey.etd) : null,
            estDeliveryDate: survey.est_delivery_date ? new Date(survey.est_delivery_date) : null,
            storageStartDate: survey.storage_start_date ? new Date(survey.storage_start_date) : null,
            storageFrequency: survey.storage_frequency || "",
            storageDuration: survey.storage_duration || "",
            storageMode: survey.storage_mode || "",
            transportMode: survey.transport_mode || "road",
            articles: survey.articles?.map((a) => ({
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
              crateRequired: a.crate_required || false,
            })) || [],
            vehicles: survey.vehicles?.map((v) => ({
              id: uuidv4(),
              vehicleType: v.vehicle_type || "",
              make: v.make || "",
              model: v.model || "",
              insurance: v.insurance || false,
              remark: v.remark || "",
              transportMode: v.transport_mode || "",
            })) || [],
            additionalServices: survey.additional_services?.map(service => ({
              id: service.id,
              name: service.name,
              selected: true
            })) || [],
          });
          hasReset.current = true;
        }
        setIsLoading(false);
      }).catch(() => {
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
    ]).then((results) => {
      const data = results.map(r => r.data);
      setApiData({
        customerTypes: data[0].map(t => ({ value: t.id, label: t.name })),
        volumeUnits: data[1].map(u => ({ value: u.id, label: u.name })),
        weightUnits: data[2].map(u => ({ value: u.id, label: u.name })),
        packingTypes: data[3].map(t => ({ value: t.id, label: t.name })),
        handymanTypes: data[4].map(t => ({ value: t.id, label: t.type_name })),
        vehicleTypes: data[5].map(t => ({ value: t.id, label: t.name })),
        rooms: data[6].map(r => ({ id: r.id, value: r.id, label: r.name, name: r.name })),
        items: data[7],
      });
      setIsLoading(false);
    }).catch(() => {
      setError("Failed to load master data.");
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!existingSurvey && !hasReset.current) {
      const qatarStates = State.getStatesOfCountry("QA");
      const dohaState = qatarStates.find(s =>
        s.name.toLowerCase() === "doha" ||
        s.name.toLowerCase().includes("doha")
      );

      if (dohaState) {
        setValue("originState", dohaState.isoCode);
      }
    }
  }, [existingSurvey, hasReset, setValue]);

  const tabs = [
    { id: "customer", label: "Customer" },
    { id: "items", label: "Article" },
    { id: "additionalServices", label: "Additional Services" },
    { id: "status", label: "Survey Status" },
  ];

  const handleTabChange = (tabId) => {
    if (watch("goodsType") === "pet") {
      setMessage("Pet relocation feature is coming soon!");
      return;
    }
    setActiveTab(tabId);
  };

  const openSignatureModal = () => setIsSignatureModalOpen(true);

  const handleSignatureSave = async (file) => {
    if (!existingSurvey || !file) return;

    const formData = new FormData();
    formData.append("signature", file);

    setIsSignatureUploading(true);
    try {
      await apiClient.post(
        `/surveys/${existingSurvey.survey_id}/upload-signature/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMessage("Digital signature uploaded successfully!");
      setSignatureUploaded(true);

      const res = await apiClient.get(`/surveys/${existingSurvey.survey_id}/signature/`);
      setSignatureImageUrl(res.data.signature_url);

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Signature upload failed:", err);
      setError("Failed to upload signature.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSignatureUploading(false);
      setIsSignatureModalOpen(false);
    }
  };


  const Customer = () => {
    const [destinationAddresses, setDestinationAddresses] = useState(watch("destinationAddresses"));
    const multipleAddresses = watch("multipleAddresses");

    const countryOptions = Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name }));
    const getStateOptions = (code) => code ? State.getStatesOfCountry(code).map(s => ({ value: s.isoCode, label: s.name })) : [];
    const getCityOptions = (country, state) => country && state ? City.getCitiesOfState(country, state).map(c => ({ value: c.name, label: c.name })) : [];

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

    const salutationOptions = [{ value: "Mr", label: "Mr" }, { value: "Ms", label: "Ms" }, { value: "Mrs", label: "Mrs" }];

    const statusOptions = [
      { value: "pending", label: "Pending" },
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ];

    const frequencyOptions = [{ value: "short_term", label: "Short Term" }, { value: "long_term", label: "Long Term" },];
    const storageModeOptions = [{ value: "ac", label: "AC" }, { value: "non_ac", label: "Non-AC" }, { value: "self_storage", label: "Self Storage" }];

    const addAddress = () => {
      const newAddr = { id: uuidv4(), address: "", city: "", country: "", state: "", zip: "", poe: "" };
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
            <Input label="Customer Type" name="customerType" type="select" options={apiData.customerTypes} />
            <Input label="Salutation" name="salutation" type="select" options={salutationOptions} />
            <Input label="Full Name" name="fullName" rules={{ required: "Required" }} />
            <Input label="Phone" name="phoneNumber" rules={{ required: "Required" }} />
            <Input label="Email" name="email" type="email" />
            <Input label="Service Type" name="serviceType" type="select" options={serviceTypeOptions} />
            <Input label="Address" name="address" />
            <Input label="Company" name="company" />
            <div className="flex items-center gap-2">
              <input type="checkbox" {...register("isMilitary")} />
              <label className="text-sm font-medium text-gray-700">Military Status</label>
            </div>
          </div>
        ),
      },
      {
        id: "survey-details",
        title: "Survey Details",
        content: (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DatePickerInput label="Survey Date" name="surveyDate" />
            <DatePickerInput label="Start Time" name="surveyStartTime" isTimeOnly />
            <DatePickerInput label="End Time" name="surveyEndTime" isTimeOnly />
          </div>
        ),
      },
      {
        id: "origin-address",
        title: "Origin Address",
        content: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Origin Address" name="originAddress" />
            <Input label="Country" name="originCountry" type="select" options={countryOptions} />
            <Input label="State" name="originState" type="select" options={getStateOptions(originCountry)} />
            <Input label="City" name="originCity" type="select" options={getCityOptions(originCountry, originState)} />
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
              <span className="text-sm font-medium text-gray-700">Multiple Addresses</span>
            </label>

            {multipleAddresses ? (
              <>
                {destinationAddresses.map((addr, i) => {
                  const country = watch(`destinationAddresses[${i}].country`);
                  const state = watch(`destinationAddresses[${i}].state`);

                  return (
                    <div key={addr.id} className="bg-gray-100 p-4 rounded space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Address {i + 1}</h4>
                        {destinationAddresses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAddress(i)}
                            className="text-red-600 hover:text-red-800"
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
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <Input
                          label="ZIP"
                          name={`destinationAddresses[${i}].zip`}
                        />
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addAddress}
                  className="px-6 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-sm font-medium rounded-lg shadow hover:shadow-lg transition"
                >
                  Add Another Address
                </button>
              </>
            ) : (
              <>
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
                    options={getStateOptions(watch("destinationAddresses[0].country"))}
                  />
                  <Input
                    label="City"
                    name="destinationAddresses[0].city"
                    type="select"
                    options={getCityOptions(
                      watch("destinationAddresses[0].country"),
                      watch("destinationAddresses[0].state")
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <Input label="ZIP" name="destinationAddresses[0].zip" />
                </div>
              </>
            )}
          </div>
        ),
      },
      {
        id: "move-details",
        title: "Move Details",
        content: (
          <div className="grid grid-cols-1 gap-4">
            <DatePickerInput label="Packing From" name="packingDateFrom" />
          </div>
        ),
      },
      {
        id: "storage-details",
        title: "Storage Details",
        content: (
          <div className="space-y-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("storageRequired")}
                className="w-3 h-3 text-[#4c7085] rounded focus:ring-[#4c7085]"
              />
              <span className="text-sm font-medium text-gray-700">Storage Required?</span>
            </label>

            {watch("storageRequired") && (
              <div className="pl-9 space-y-4 border-l-4 border-[#4c7085] bg-gradient-to-r from-[#4c7085]/5 to-transparent p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePickerInput label="Storage Start Date" name="storageStartDate" />
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
              </div>
            )}
          </div>
        ),
      },
    ];

    return (
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-lg sm:text-xl font-medium mb-4">{section.title}</h3>
            {section.content}
          </div>
        ))}
      </div>
    );
  };

  const Article = () => {

    const selectedRoomFromForm = watch("selectedRoom");
    const [selectedRoom, setSelectedRoom] = useState(selectedRoomFromForm || null);
    const [showRoomDropdown, setShowRoomDropdown] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});
    const [itemQuantities, setItemQuantities] = useState({});
    const [itemSearchQuery, setItemSearchQuery] = useState("");
    const [selectedItems, setSelectedItems] = useState({});
    const dropdownRef = useRef(null);
    const [itemCratePreferences, setItemCratePreferences] = useState({});
    const [roomSearchQuery, setRoomSearchQuery] = useState("");
    const [showManualAddForm, setShowManualAddForm] = useState(false);
    const [manualFormData, setManualFormData] = useState({
      itemName: "",
      description: "",
      length: "",
      width: "",
      height: "",
    });
    const [manualVolume, setManualVolume] = useState(0);
    const [manualWeight, setManualWeight] = useState(0);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowRoomDropdown(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      if (selectedRoom && selectedRoom !== selectedRoomFromForm) {
        setValue("selectedRoom", selectedRoom);
      }
    }, [selectedRoom, selectedRoomFromForm, setValue]);
    const currentRoom = selectedRoom || selectedRoomFromForm;



    const filteredRooms = useMemo(() => {
      if (!roomSearchQuery.trim()) {
        return apiData.rooms;
      }
      const query = roomSearchQuery.toLowerCase().trim();
      return apiData.rooms.filter(room => {
        const roomLabel = room.label?.toLowerCase() || '';
        const roomName = room.name?.toLowerCase() || '';
        return roomLabel.includes(query) || roomName.includes(query);
      });
    }, [roomSearchQuery, apiData.rooms]);

    const filteredItems = useMemo(() => {
      if (!selectedRoom) return [];
      let roomItems = apiData.items.filter(i => i.room === selectedRoom.id);

      if (!itemSearchQuery.trim()) {
        return roomItems;
      }

      const query = itemSearchQuery.toLowerCase().trim();
      return roomItems.filter(item => {
        const name = item.name?.toLowerCase() || '';
        const description = item.description?.toLowerCase() || '';
        return name.includes(query) || description.includes(query);
      });
    }, [selectedRoom, apiData.items, itemSearchQuery]);

    const toggleExpandedItem = (itemName) => {
      setExpandedItems(prev => ({ ...prev, [itemName]: !prev[itemName] }));
    };

    const updateQuantity = (itemName, qty) => {
      const newQty = Math.max(0, qty);

      setItemQuantities((prev) => ({ ...prev, [itemName]: newQty }));

      if (newQty > 0) {
        setSelectedItems((prev) => ({ ...prev, [itemName]: true }));
      }
      else {
        setSelectedItems((prev) => ({ ...prev, [itemName]: false }));
      }
    };
    const toggleItemSelection = (itemName) => {
      setSelectedItems(prev => ({ ...prev, [itemName]: !prev[itemName] }));
    };

    const calculateVolume = (length, width, height) => {
      if (!length || !width || !height) return 0;
      return (parseFloat(length) * parseFloat(width) * parseFloat(height)) / 1000000;
    };

    const calculateWeight = (volume) => {
      return volume ? parseFloat(volume) * 110 : 0;
    };

    const addArticle = (itemName, formData = {}, isMoving = true) => {
      const length = formData[`length_${itemName}`] || "";
      const width = formData[`width_${itemName}`] || "";
      const height = formData[`height_${itemName}`] || "";

      const volume = calculateVolume(length, width, height);
      const weight = calculateWeight(volume);

      const crateRequired = formData.crateRequired || false;

      const newArticle = {
        id: uuidv4(),
        itemName,
        quantity: itemQuantities[itemName] || 1,
        volume: volume.toFixed(4),
        volumeUnit: formData[`volumeUnit_${itemName}`] || apiData.volumeUnits[0]?.value || "",
        weight: weight.toFixed(2),
        weightUnit: formData[`weightUnit_${itemName}`] || apiData.weightUnits[0]?.value || "",
        handyman: formData[`handyman_${itemName}`] || "",
        packingOption: formData[`packingOption_${itemName}`] || "",
        moveStatus: isMoving ? "moving" : "not_moving",
        room: selectedRoom?.value || "",
        length,
        width,
        height,
        crateRequired,
      };

      setValue("articles", [...watch("articles"), newArticle]);
      setMessage("Article added!");
      setTimeout(() => setMessage(null), 3000);
      toggleExpandedItem(itemName);
    };

    const addMultipleArticles = () => {
      const selectedItemNames = Object.keys(selectedItems).filter(name => selectedItems[name]);
      if (selectedItemNames.length === 0) return setError("Select at least one item");

      const newArticles = selectedItemNames.map(itemName => {
        const item = apiData.items.find(i => i.name === itemName && i.room === selectedRoom.id);

        const length = item?.length || "";
        const width = item?.width || "";
        const height = item?.height || "";

        const volumeValue = calculateVolume(length, width, height);
        const volume = volumeValue > 0 ? volumeValue.toFixed(4) : "";
        const weight = volumeValue > 0 ? calculateWeight(volumeValue).toFixed(2) : "";

        const itemKey = `${selectedRoom?.value || 'general'}-${itemName}`;
        const crateRequired = itemCratePreferences[itemKey] ?? false;

        return {
          id: uuidv4(),
          itemName,
          quantity: itemQuantities[itemName] > 0 ? itemQuantities[itemName] : 1,
          volume,
          volumeUnit: apiData.volumeUnits[0]?.value || "",
          weight,
          weightUnit: apiData.weightUnits[0]?.value || "",
          handyman: "",
          packingOption: "",
          moveStatus: "moving",
          room: selectedRoom?.value || "",
          length,
          width,
          height,
          crateRequired,
        };
      });

      setValue("articles", [...watch("articles"), ...newArticles]);
      setMessage(`${newArticles.length} articles added!`);
      setTimeout(() => setMessage(null), 3000);
      setSelectedItems({});
    };

    const removeArticle = (id) => {
      setValue("articles", watch("articles").filter(a => a.id !== id));
      setMessage("Article removed!");
      setTimeout(() => setMessage(null), 3000);
    };

    const handleManualDimensionChange = (field, value) => {
      setManualFormData(prev => ({ ...prev, [field]: value }));

      const l = field === 'length' ? value : manualFormData.length;
      const w = field === 'width' ? value : manualFormData.width;
      const h = field === 'height' ? value : manualFormData.height;

      if (l && w && h && !isNaN(l) && !isNaN(w) && !isNaN(h)) {
        const vol = (parseFloat(l) * parseFloat(w) * parseFloat(h)) / 1000000;
        setManualVolume(vol);
        setManualWeight(vol * 110);
      } else {
        setManualVolume(0);
        setManualWeight(0);
      }
    };

    const addManualItem = () => {
      if (!manualFormData.itemName.trim()) {
        setError("Item name is required");
        return;
      }
      const newArticle = {
        id: uuidv4(),
        itemName: manualFormData.itemName.trim(),
        description: manualFormData.description || "",
        quantity: 1,
        length: manualFormData.length || "",
        width: manualFormData.width || "",
        height: manualFormData.height || "",
        volume: manualVolume > 0 ? manualVolume.toFixed(4) : "",
        volumeUnit: apiData.volumeUnits[0]?.value || "",
        weight: manualWeight > 0 ? manualWeight.toFixed(2) : "",
        weightUnit: apiData.weightUnits[0]?.value || "",
        handyman: "",
        packingOption: "",
        moveStatus: "moving",
        crateRequired: false,
        room: selectedRoom?.value || "",
      };

      setValue("articles", [...watch("articles"), newArticle]);
      setMessage("Custom item added successfully!");
      setTimeout(() => setMessage(null), 3000);

      setShowManualAddForm(false);
      setManualFormData({ itemName: "", description: "", length: "", width: "", height: "" });
      setManualVolume(0);
      setManualWeight(0);
    };

    const ItemForm = ({ item, onAdd, onCancel }) => {
      const [formData, setFormData] = useState({
        [`length_${item.name}`]: item.length || "",
        [`width_${item.name}`]: item.width || "",
        [`height_${item.name}`]: item.height || "",
        [`volume_${item.name}`]: item.volume || "",
        [`weight_${item.name}`]: item.weight || "",
        [`volumeUnit_${item.name}`]: apiData.volumeUnits[0]?.value || "",
        [`weightUnit_${item.name}`]: apiData.weightUnits[0]?.value || "",
        [`handyman_${item.name}`]: "",
        [`packingOption_${item.name}`]: "",
        crateRequired: false,
      });

      const [isMoving, setIsMoving] = useState(true);

      const currentLength = formData[`length_${item.name}`];
      const currentWidth = formData[`width_${item.name}`];
      const currentHeight = formData[`height_${item.name}`];

      const volume = currentLength && currentWidth && currentHeight
        ? calculateVolume(currentLength, currentWidth, currentHeight).toFixed(4)
        : (item.volume || "0.0000");

      const weight = volume
        ? calculateWeight(parseFloat(volume)).toFixed(2)
        : (item.weight || "0.00");

      const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        const l = field === `length_${item.name}` ? value : formData[`length_${item.name}`];
        const w = field === `width_${item.name}` ? value : formData[`width_${item.name}`];
        const h = field === `height_${item.name}` ? value : formData[`height_${item.name}`];
        if (l && w && h) {
          const vol = calculateVolume(l, w, h);
          const wt = calculateWeight(vol);
          setFormData(prev => ({
            ...prev,
            [`volume_${item.name}`]: vol.toFixed(4),
            [`weight_${item.name}`]: wt.toFixed(2),
          }));
        }
      };

      const handleCrateChange = (value) => {
        setFormData(prev => ({ ...prev, crateRequired: value === 'yes' }));
      };

      return (
        <div className="px-4 pb-4 pt-4 bg-gradient-to-b from-indigo-50 to-white border-t border-indigo-200">
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isMoving ? 'bg-green-500 border-green-500' : 'bg-red-500 border-red-500'}`}
                onClick={() => setIsMoving(!isMoving)}
              >
                {isMoving ? (
                  <span className="text-white text-xs">M</span>
                ) : (
                  <span className="text-white text-xs">N</span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {isMoving ? "Moving" : "Not Moving"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="col-span-full">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Dimensions</h4>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Length (cm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData[`length_${item.name}`]}
                    onChange={(e) => handleInputChange(`length_${item.name}`, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                    placeholder={item.length ? `${item.length} (default)` : "0.00"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Width (cm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData[`width_${item.name}`]}
                    onChange={(e) => handleInputChange(`width_${item.name}`, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                    placeholder={item.width ? `${item.width} (default)` : "0.00"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData[`height_${item.name}`]}
                    onChange={(e) => handleInputChange(`height_${item.name}`, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                    placeholder={item.height ? `${item.height} (default)` : "0.00"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Volume (m³) <span className="text-green-600 text-xs">(auto)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={volume}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Volume Unit</label>
                  <select
                    value={formData[`volumeUnit_${item.name}`]}
                    onChange={(e) => setFormData(prev => ({ ...prev, [`volumeUnit_${item.name}`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                  >
                    {apiData.volumeUnits.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="col-span-full">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Weight</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Weight (kg) <span className="text-green-600 text-xs">(est.)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={weight}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Weight Unit</label>
                  <select
                    value={formData[`weightUnit_${item.name}`]}
                    onChange={(e) => setFormData(prev => ({ ...prev, [`weightUnit_${item.name}`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                  >
                    {apiData.weightUnits.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Handyman</label>
              <select
                value={formData[`handyman_${item.name}`]}
                onChange={(e) => setFormData(prev => ({ ...prev, [`handyman_${item.name}`]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
              >
                <option value="">Select</option>
                {apiData.handymanTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Packing Option</label>
              <select
                value={formData[`packingOption_${item.name}`]}
                onChange={(e) => setFormData(prev => ({ ...prev, [`packingOption_${item.name}`]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
              >
                <option value="">Select</option>
                {apiData.packingTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <button
              type="button"
              onClick={() => onAdd(item.name, formData, isMoving)}
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
      const [isMoving, setIsMoving] = useState(true);

      const toggleMovingStatus = () => {
        setIsMoving(prev => !prev);
      };

      return (
        <div className="border-b border-gray-200 last:border-0">
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4
        hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50
        transition-all rounded-lg"
          >
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleItemSelection(item.name)}
              className="focus:outline-none"
            >
              <div
                className={`w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all duration-200 ${isSelected
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
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">

              <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateQuantity(item.name, qty - 1)}
                  disabled={qty <= 0}
                  className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaMinus className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={qty}
                  readOnly
                  className="w-16 text-center font-medium text-gray-800 bg-transparent outline-none py-3 border-x border-gray-300"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateQuantity(item.name, qty + 1)}
                  className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition"
                >
                  <FaPlus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={toggleMovingStatus}
                  className="flex items-center p-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none gap-2"
                  title={isMoving ? "Mark as Not Moving" : "Mark as Moving"}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isMoving ? "bg-green-500 border-green-500" : "bg-red-500 border-red-500"}`}>
                    {isMoving ? (
                      <span className="text-white text-xs">M</span>
                    ) : (
                      <span className="text-white text-xs">N</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 hidden sm:inline">
                    {isMoving ? "Moving" : "Not Moving"}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center p-3.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none gap-2">
                <label className="font-medium text-gray-700 whitespace-nowrap">Crate Required?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`crate-row-${item.name.replace(/\s+/g, '-')}-${selectedRoom?.value || 'general'}`}
                      value="yes"
                      checked={(() => {
                        const itemKey = `${selectedRoom?.value || 'general'}-${item.name}`;
                        const articles = watch("articles");
                        const existingArticle = articles.find(a =>
                          a.itemName === item.name && a.room === selectedRoom?.value
                        );

                        if (existingArticle) {
                          return existingArticle.crateRequired === true;
                        } else {
                          return itemCratePreferences[itemKey] === true;
                        }
                      })()}
                      onChange={() => {
                        const itemKey = `${selectedRoom?.value || 'general'}-${item.name}`;
                        const articles = watch("articles");
                        const idx = articles.findIndex(a =>
                          a.itemName === item.name && a.room === selectedRoom?.value
                        );

                        if (idx !== -1) {
                          const updated = [...articles];
                          updated[idx] = { ...updated[idx], crateRequired: true };
                          setValue("articles", updated, { shouldDirty: true });
                        } else {
                          setItemCratePreferences(prev => ({ ...prev, [itemKey]: true }));
                        }
                      }}
                      className="w-4 h-4 text-[#4c7085]"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`crate-row-${item.name.replace(/\s+/g, '-')}-${selectedRoom?.value || 'general'}`}
                      value="no"
                      checked={(() => {
                        const itemKey = `${selectedRoom?.value || 'general'}-${item.name}`;
                        const articles = watch("articles");
                        const existingArticle = articles.find(a =>
                          a.itemName === item.name && a.room === selectedRoom?.value
                        );

                        if (existingArticle) {
                          return existingArticle.crateRequired === false;
                        } else {
                          return itemCratePreferences[itemKey] !== true;
                        }
                      })()}
                      onChange={() => {
                        const itemKey = `${selectedRoom?.value || 'general'}-${item.name}`;
                        const articles = watch("articles");
                        const idx = articles.findIndex(a =>
                          a.itemName === item.name && a.room === selectedRoom?.value
                        );

                        if (idx !== -1) {
                          const updated = [...articles];
                          updated[idx] = { ...updated[idx], crateRequired: false };
                          setValue("articles", updated, { shouldDirty: true });
                        } else {
                          setItemCratePreferences(prev => ({ ...prev, [itemKey]: false }));
                        }
                      }}
                      className="w-4 h-4 text-[#4c7085]"
                    />
                    <span>No</span>
                  </label>
                </div>
                </div>
              </div>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpandedItem(item.name);
                }}
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
              onAdd={(itemName, formData) => {
                addArticle(itemName, formData, isMoving);
              }}
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
          const article = articles.find(a => a.id === editingArticle);
          if (article) {
            setEditFormData({
              quantity: article.quantity || 1,
              length: article.length || "",
              width: article.width || "",
              height: article.height || "",
              volume: article.volume || "",
              volumeUnit: article.volumeUnit || apiData.volumeUnits[0]?.value || "",
              weight: article.weight || "",
              weightUnit: article.weightUnit || apiData.weightUnits[0]?.value || "",
              handyman: article.handyman || "",
              packingOption: article.packingOption || "",
              moveStatus: article.moveStatus || "moving",
              crateRequired: article.crateRequired || false,
            });
          }
        }
      }, [editingArticle, articles]);

      const calculateVolume = (length, width, height) => {
        if (!length || !width || !height) return 0;
        return (parseFloat(length) * parseFloat(width) * parseFloat(height)) / 1000000;
      };

      const calculateWeight = (volume) => {
        return volume ? parseFloat(volume) * 110 : 0;
      };

      const handleEditInputChange = (field, value) => {
        setEditFormData(prev => {
          const newData = { ...prev, [field]: value };
          if (field === 'length' || field === 'width' || field === 'height') {
            const l = field === 'length' ? value : prev.length;
            const w = field === 'width' ? value : prev.width;
            const h = field === 'height' ? value : prev.height;
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
        const updatedArticles = articles.map(article => {
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
              moveStatus: editFormData.moveStatus || article.moveStatus || "moving",
              crateRequired: editFormData.crateRequired ?? article.crateRequired,
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

      const removeArticleFromSidebar = (id) => {
        setValue("articles", articles.filter(a => a.id !== id));
        setMessage("Article removed!");
        setTimeout(() => setMessage(null), 3000);
      };

      return (
        <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform z-50 ${showArticlesSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
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
              <p className="text-center text-gray-500 py-8">No articles added</p>
            ) : (
              articles.map(article => (
                <div key={article.id} className="p-3 border border-gray-300 rounded-lg bg-white shadow-sm">
                  {editingArticle === article.id ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm text-gray-800">{article.itemName}</h4>
                        <div className="flex gap-1">
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => updateArticle(article.id)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Save"
                          >
                            <FaCheck className="w-3 h-3" />
                          </button>
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={cancelEdit} 
                            className="text-gray-600 hover:text-gray-800 p-1"
                            title="Cancel"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleEditInputChange('quantity', Math.max(1, (editFormData.quantity || 1) - 1))}
                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            <FaMinus className="w-2 h-2" />
                          </button>
                          <input
                            type="number"
                            value={editFormData.quantity || 1}
                            onChange={(e) => handleEditInputChange('quantity', parseInt(e.target.value) || 1)}
                            className="w-12 text-center px-1 py-1 border rounded text-sm"
                            min="1"
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleEditInputChange('quantity', (editFormData.quantity || 1) + 1)}
                            className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            <FaPlus className="w-2 h-2" />
                          </button>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Moving Status</label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setEditFormData(prev => ({ ...prev, moveStatus: 'moving' }))}
                            className={`px-3 py-1 text-xs rounded ${(editFormData.moveStatus || article.moveStatus) === 'moving' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                          >
                            Moving
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditFormData(prev => ({ ...prev, moveStatus: 'not_moving' }))}
                            className={`px-3 py-1 text-xs rounded ${(editFormData.moveStatus || article.moveStatus) === 'not_moving' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                          >
                            Not Moving
                          </button>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Crate Required?</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`sidebar-crate-${article.id}`}
                              checked={editFormData.crateRequired === true}
                              onChange={() => handleEditInputChange('crateRequired', true)}
                              className="w-4 h-4 text-[#4c7085]"
                            />
                            <span className="text-sm">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`sidebar-crate-${article.id}`}
                              checked={editFormData.crateRequired === false}
                              onChange={() => handleEditInputChange('crateRequired', false)}
                              className="w-4 h-4 text-[#4c7085]"
                            />
                            <span className="text-sm">No</span>
                          </label>
                        </div>
                      </div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Dimensions (cm)</label>
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="L"
                          value={editFormData.length || ""}
                          onChange={(e) => handleEditInputChange('length', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="W"
                          value={editFormData.width || ""}
                          onChange={(e) => handleEditInputChange('width', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="H"
                          value={editFormData.height || ""}
                          onChange={(e) => handleEditInputChange('height', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Volume (m³)</label>
                          <input
                            type="text"
                            readOnly
                            value={editFormData.volume || "0.0000"}
                            className="w-full px-2 py-1 bg-gray-50 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Volume Unit</label>
                          <select
                            value={editFormData.volumeUnit || ""}
                            onChange={(e) => handleEditInputChange('volumeUnit', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {apiData.volumeUnits.map(unit => (
                              <option key={unit.value} value={unit.value}>{unit.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
                          <input
                            type="text"
                            readOnly
                            value={editFormData.weight || "0.00"}
                            className="w-full px-2 py-1 bg-gray-50 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Weight Unit</label>
                          <select
                            value={editFormData.weightUnit || ""}
                            onChange={(e) => handleEditInputChange('weightUnit', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {apiData.weightUnits.map(unit => (
                              <option key={unit.value} value={unit.value}>{unit.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Handyman</label>
                          <select
                            value={editFormData.handyman || ""}
                            onChange={(e) => handleEditInputChange('handyman', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select</option>
                            {apiData.handymanTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Packing Option</label>
                          <select
                            value={editFormData.packingOption || ""}
                            onChange={(e) => handleEditInputChange('packingOption', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select</option>
                            {apiData.packingTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-800">{article.itemName}</div>
                        <div className="text-xs text-gray-600 mt-1">Qty: {article.quantity}</div>
                        {article.volume && (
                          <div className="text-xs text-gray-600">
                            Vol: {article.volume} {apiData.volumeUnits.find(u => u.value === article.volumeUnit)?.label || 'm³'}
                          </div>
                        )}
                        {article.weight && (
                          <div className="text-xs text-gray-600">
                            Wt: {article.weight} {apiData.weightUnits.find(u => u.value === article.weightUnit)?.label || 'kg'}
                          </div>
                        )}
                        {(article.length || article.width || article.height) && (
                          <div className="text-xs text-gray-600">
                            Dim: {article.length && `L:${article.length}cm`}
                            {article.width && ` × W:${article.width}cm`}
                            {article.height && ` × H:${article.height}cm`}
                          </div>
                        )}
                        {article.handyman && (
                          <div className="text-xs text-gray-600">
                            Handyman: {apiData.handymanTypes.find(h => h.value === article.handyman)?.label}
                          </div>
                        )}
                        {article.packingOption && (
                          <div className="text-xs text-gray-600">
                            Packing: {apiData.packingTypes.find(p => p.value === article.packingOption)?.label}
                          </div>
                        )}
                        {article.room && (
                          <div className="text-xs text-gray-600">
                            Room: {apiData.rooms.find(r => r.value === article.room)?.label || article.room}
                          </div>
                        )}
                        <div className="text-xs mt-1">
                          <span className="font-medium">Crate Required:</span>{" "}
                          <span className={article.crateRequired ? "text-green-600" : "text-gray-600"}>
                            {article.crateRequired ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setEditingArticle(article.id)}
                          className="text-[#4c7085] hover:text-blue-800 p-1"
                          title="Edit"
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => removeArticleFromSidebar(article.id)}
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
              <h3 className="text-lg sm:text-xl font-medium text-black">Select Room</h3>
              <button
                type="button"
                onClick={() => setShowArticlesSidebar(true)}
                className="hidden sm:flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white font-medium rounded-lg text-sm shadow-md hover:shadow-xl transition transform "
              >
                <FaBars /> View Added ({watch("articles").length})
              </button>
            </div>
            {watch("articles").length > 0 && (
              <button
                type="button"
                onClick={() => setShowArticlesSidebar(true)}
                className="fixed bottom-24 right-4 z-40 flex items-center justify-center w-14 h-14 sm:hidden bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-full shadow-2xl hover:shadow-xl transform hover:scale-110 transition-all duration-300"
                aria-label="View added articles"
              >
                <div className="relative">
                  <FaBars className="w-5 h-5" />
                  <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-4 h-4 bg-red-500 text-white text-xs font-light rounded-full px-2">
                    {watch("articles").length}
                  </span>
                </div>
              </button>
            )}

            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowRoomDropdown(prev => !prev);
                  if (!showRoomDropdown) {
                    setRoomSearchQuery("");
                  }
                }}
                className={`w-full px-6 py-2 text-left text-sm font-medium rounded-xl border-2 transition-all duration-300 flex justify-between items-center shadow-sm ${selectedRoom
                  ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-[#4c7085]"
                  }`}
              >
                <span>{selectedRoom ? selectedRoom.label : "Choose a room to add items"}</span>
                <FaChevronDown className={`w-4 h-4 transition-transform ${showRoomDropdown ? "rotate-180" : ""}`} />
              </button>

              {showRoomDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-indigo-200 rounded-xl shadow-2xl z-20 max-h-96 overflow-hidden">
                  <div className="p-3 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                      <input
                        type="text"
                        value={roomSearchQuery}
                        onChange={(e) => setRoomSearchQuery(e.target.value)}
                        placeholder="Search rooms..."
                        className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b8ca3] focus:border-transparent"
                        autoFocus
                      />
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      {roomSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setRoomSearchQuery("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredRooms.length === 0 ? (
                      <div className="px-6 py-8 text-center text-gray-500">
                        {roomSearchQuery ? "No rooms found matching your search" : "No rooms available"}
                      </div>
                    ) : (
                      filteredRooms.map(room => (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => {
                            setSelectedRoom(room);
                            setValue("selectedRoom", room);
                            setShowRoomDropdown(false);
                            setRoomSearchQuery("");
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-all text-sm font-medium border-b border-gray-100 last:border-0 ${selectedRoom?.id === room.id ? 'bg-blue-50 text-[#4c7085]' : 'text-gray-800'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{room.label}</span>
                            {selectedRoom?.id === room.id && (
                              <FaCheck className="w-4 h-4 text-[#4c7085]" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedRoom && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {Object.values(selectedItems).some(v => v) && (
                <div className="p-5 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white flex justify-between items-center">
                  <span className="font-medium">
                    {Object.values(selectedItems).filter(Boolean).length} item(s) selected
                  </span>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={addMultipleArticles}
                    className="px-6 py-2 bg-white text-[#4c7085] font-medium rounded-lg hover:bg-indigo-50 transition shadow-lg"
                  >
                    Add Selected
                  </button>
                </div>
              )}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder="Search items in this room..."
                    className="w-full px-4 py-3 pl-12 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  {itemSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setItemSearchQuery("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100">
                <button
                  type="button"
                  onClick={() => setShowManualAddForm(true)}
                  className="mx-auto px-8 py-2 text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white font-medium rounded-xl shadow-xl hover:shadow-2xl transform transition-all duration-300 flex items-center gap-4"
                >
                  <FaPlus className="w-6 h-6" />
                  Add Item Manually
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <p className="text-lg">
                      {itemSearchQuery
                        ? `No items found matching "${itemSearchQuery}"`
                        : "No items in this room"}
                    </p>
                    <p className="text-sm mt-2 text-gray-400">
                      Use "Add Item Manually" to create custom items
                    </p>
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <ItemRow
                      key={`${item.id || item.name}-${Math.random()}`} // or just item.id if unique
                      item={item}
                      onRemove={removeArticle}
                    />
                  ))
                )}
              </div>
              {/* MANUAL ADD MODAL */}
              {showManualAddForm && (
                <Modal
                  isOpen={showManualAddForm}
                  onClose={() => {
                    setShowManualAddForm(false);
                    setManualFormData({ itemName: "", description: "", length: "", width: "", height: "" });
                    setManualVolume(0);
                    setManualWeight(0);
                  }}
                  title={`Add Custom Item — ${selectedRoom?.label || "General"}`}
                  footer={
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setShowManualAddForm(false);
                          setManualFormData({ itemName: "", description: "", length: "", width: "", height: "" });
                          setManualVolume(0);
                          setManualWeight(0);
                        }}
                        className="w-full px-8 py-2 text-sm font-medium bg-gray-300 text-gray-700 rounded-sm hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={addManualItem}
                        disabled={!manualFormData.itemName.trim()}
                        className="whitespace-nowrap w-full px-8 py-2 text-sm font-medium bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-sm hover:shadow-2xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Item to Survey
                      </button>
                    </>
                  }
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <Input
                      label="Item Name"
                      name="itemName"
                      type="text"
                      value={manualFormData.itemName}
                      onChange={(e) => setManualFormData(prev => ({ ...prev, itemName: e.target.value }))}
                      rules={{ required: true }}
                      placeholder="e.g., Antique Piano"
                    />
                    <Input
                      label="Description (Optional)"
                      name="description"
                      type="textarea"
                      value={manualFormData.description}
                      onChange={(e) => setManualFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      placeholder="Any special notes..."
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dimensions (cm)
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        <Input
                          label="Length (cm)"
                          name="length"
                          type="number"
                          step="0.01"
                          value={manualFormData.length}
                          onChange={(e) => handleManualDimensionChange('length', e.target.value)}
                          placeholder="0.00"
                        />
                        <Input
                          label="Width (cm)"
                          name="width"
                          type="number"
                          step="0.01"
                          value={manualFormData.width}
                          onChange={(e) => handleManualDimensionChange('width', e.target.value)}
                          placeholder="0.00"
                        />
                        <Input
                          label="Height (cm)"
                          name="height"
                          type="number"
                          step="0.01"
                          value={manualFormData.height}
                          onChange={(e) => handleManualDimensionChange('height', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Volume (m³)
                        </label>
                        <div className="w-full px-6 py-4 text-center text-sm font-semibold bg-gray-100 border border-gray-300 rounded-xl">
                          {manualVolume.toFixed(4)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Weight (kg) <span className="text-sm font-normal text-gray-500">(estimated)</span>
                        </label>
                        <div className="w-full px-6 py-4 text-center text-sm font-semibold bg-gray-100 border border-gray-300 rounded-xl">
                          {manualWeight.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Modal>
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
      setValue("vehicles", [...vehicles, { id: uuidv4(), vehicleType: "", make: "", model: "", insurance: false, remark: "" }]);
    };

    const removeVehicle = (id) => {
      setValue("vehicles", vehicles.filter(v => v.id !== id));
    };

    return (
      <div className="mt-4 sm:mt-10 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg sm:text-xl font-medium">Vehicle Details</h2>
          <button type="button" onClick={addVehicle} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded">
            <FaPlus /> Add Vehicle
          </button>
        </div>

        {vehicles.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No vehicles added yet.</p>
        ) : (
          <div className="space-y-6">
            {vehicles.map((vehicle, index) => (
              <div key={vehicle.id} className="rounded-lg p-6 bg-gray-100 relative shadow-sm border border-gray-200">
                <button type="button" onClick={() => removeVehicle(vehicle.id)} className="absolute top-4 right-4 text-red-600 hover:bg-red-100 p-2 rounded">
                  <FaTimes />
                </button>
                <h4 className="text-lg sm:text-xl font-medium mb-4">Vehicle {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Vehicle Type" name={`vehicles[${index}].vehicleType`} type="select" options={apiData.vehicleTypes} />
                  <Input label="Make" name={`vehicles[${index}].make`} placeholder="e.g. Toyota" />
                  <Input label="Model" name={`vehicles[${index}].model`} placeholder="e.g. Camry" />
                  <div className="flex items-center gap-3">
                    <input type="checkbox" {...register(`vehicles[${index}].insurance`)} className="w-4 h-4" />
                    <label className="font-medium">Insurance Required</label>
                  </div>
                </div>
                <div className="mt-4">
                  <Input label="Remark (Optional)" name={`vehicles[${index}].remark`} type="textarea" rows={2} />
                </div>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={addVehicle} className="w-full flex sm:hidden mt-6 items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded">
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
      const isCurrentlySelected = selectedServices.some(service => service.id === serviceId);

      let updatedServices;
      if (isCurrentlySelected) {
        updatedServices = selectedServices.filter(service => service.id !== serviceId);
      } else {
        updatedServices = [...selectedServices, { id: serviceId, name: serviceName, selected: true }];
      }

      setValue("additionalServices", updatedServices, { shouldValidate: true });
    };

    const isServiceSelected = (serviceId) => {
      return selectedServices.some(service => service.id === serviceId);
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
        <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-6">Additional Services</h3>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {additionalServices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No additional services available. Please add services in the settings first.
            </div>
          ) : (
            additionalServices.map((service) => (
              <div
                key={service.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 ${isServiceSelected(service.id)
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={isServiceSelected(service.id)}
                    onChange={() => handleServiceToggle(service.id, service.name)}
                    className="w-5 h-5 text-[#4c7085] rounded focus:ring-[#6b8ca3]"
                  />
                  <span className={`font-medium ${isServiceSelected(service.id) ? "text-[#4c7085]" : "text-gray-700"
                    }`}>
                    {service.name}
                  </span>
                </div>

                {isServiceSelected(service.id) && (
                  <span className="text-sm text-green-600 font-medium">Selected</span>
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
                <div key={service.id} className="flex items-center justify-between">
                  <span className="text-green-700">{service.name}</span>
                  <button
                    type="button"
                    onClick={() => handleServiceToggle(service.id, service.name)}
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

  const SurveyStatus = () => {
    const statusOptions = [
      { value: "pending", label: "Pending" },
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ];

    const sections = [
      {
        id: "survey-status",
        title: "Survey Status",
        content: (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Status" name="status" type="select" options={statusOptions} />
              <Input
                label="Work Description"
                name="workDescription"
                type="textarea"
                placeholder="Enter any additional notes or description about the survey..."
              />
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Customer Digital Signature</h3>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-300">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-3">
                      Capture customer's digital signature to confirm survey completion.
                    </p>
                    <p className={`font-medium text-lg ${signatureUploaded ? "text-green-600" : "text-gray-600"}`}>
                      {signatureUploaded ? "✓ Signature has been added" : "No signature added yet"}
                    </p>
                    {signatureImageUrl && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Current Signature:</p>
                        <img
                          src={signatureImageUrl}
                          alt="Customer signature"
                          className="max-w-xs border-2 border-gray-300 rounded-lg shadow-md"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* VIEW BUTTON - ONLY IF SIGNATURE EXISTS */}
                    {/* {signatureUploaded && signatureImageUrl && (
                      <button
                        onClick={() => setIsSignatureModalOpen(true)}
                        className="px-6 py-2 text-sm bg-[#4c7085] hover:bg-[#4c7085] text-white font-semibold rounded-lg shadow transition transform "
                      >
                        View Signature
                      </button>
                    )} */}

                    {/* UPDATE / ADD BUTTON */}
                    <button
                      onClick={openSignatureModal}
                      disabled={isSignatureUploading}
                      className={`px-6 py-2 text-sm rounded-lg font-medium transition-all shadow-lg ${isSignatureUploading
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : signatureUploaded
                          ? "px-6 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition transform"
                          : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transform "
                        }`}
                    >
                      {isSignatureUploading
                        ? "Uploading..."
                        : signatureUploaded
                          ? "Update Signature"
                          : "Add Digital Signature"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
      },
    ];

    return (
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-lg sm:text-xl font-medium mb-4">{section.title}</h3>
            {section.content}
          </div>
        ))}
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
      survey_date: data.surveyDate ? data.surveyDate.toISOString().split("T")[0] : null,
      survey_start_time: data.surveyStartTime ? data.surveyStartTime.toTimeString().split(" ")[0].slice(0, 5) : null,
      survey_end_time: data.surveyEndTime ? data.surveyEndTime.toTimeString().split(" ")[0].slice(0, 5) : null,
      work_description: data.workDescription,
      include_vehicle: data.includeVehicle,
      origin_address: data.originAddress,
      origin_city: data.originCity,
      origin_country: data.originCountry,
      origin_state: data.originState,
      origin_zip: data.originZip,
      pod_pol: data.podPol,
      multiple_addresses: data.multipleAddresses,
      destination_addresses: data.destinationAddresses.map(a => ({
        address: a.address,
        city: a.city,
        country: a.country,
        state: a.state,
        zip: a.zip,
        poe: a.poe
      })),
      packing_date_from: data.packingDateFrom ? data.packingDateFrom.toISOString().split("T")[0] : null,
      packing_date_to: data.packingDateTo ? data.packingDateTo.toISOString().split("T")[0] : null,
      loading_date: data.loadingDate ? data.loadingDate.toISOString().split("T")[0] : null,
      eta: data.eta ? data.eta.toISOString().split("T")[0] : null,
      etd: data.etd ? data.etd.toISOString().split("T")[0] : null,
      est_delivery_date: data.estDeliveryDate ? data.estDeliveryDate.toISOString().split("T")[0] : null,
      storage_start_date: data.storageStartDate ? data.storageStartDate.toISOString().split("T")[0] : null,
      storage_frequency: data.storageFrequency,
      storage_duration: data.storageDuration,
      storage_mode: data.storageMode,
      transport_mode: data.transportMode,
      articles: data.articles.map(a => ({
        room: a.room || null,
        item_name: a.itemName,
        quantity: a.quantity,
        volume: a.volume || null,
        volume_unit: a.volumeUnit || null,
        weight: a.weight || null,
        weight_unit: a.weightUnit || null,
        handyman: a.handyman || null,
        packing_option: a.packingOption || null,
        move_status: a.moveStatus || "moving",
        length: a.length || null,
        width: a.width || null,
        height: a.height || null,
        crate_required: a.crateRequired || false,
      })),
      vehicles: data.vehicles.map(v => ({
        vehicle_type: v.vehicleType || null,
        make: v.make || "",
        model: v.model || "",
        insurance: v.insurance || false,
        remark: v.remark || "",
      })),
      additional_service_ids: data.additionalServices?.map(service => service.id) || [],
    };

    const request = existingSurvey
      ? apiClient.put(`/surveys/${existingSurvey.survey_id}/`, payload)
      : apiClient.post("/surveys/", payload);

    request
      .then(res => {
        setMessage(existingSurvey ? "Survey updated!" : "Survey created!");
        setTimeout(() => navigate(`/survey/${res.data.survey_id}/survey-summary`, { state: { customerData: data } }), 2000);
      })
      .catch(err => {
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
      setActiveTab("status");
    } else if (activeTab === "status") {
      if (data.articles.length === 0 && data.vehicles.length === 0 && data.additionalServices.length === 0) {
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
        return "Next";
      case "status":
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
      case "status":
        setActiveTab("additionalServices");
        break;
      default:
        navigate(-1);
        break;
    }
  };

  return (
    <>
      {isLoading && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><Loading /></div>}
      {error && <div className="fixed top-28 sm:top-20 right-4 sm:right-8 bg-red-500 text-white px-6 py-3 text-sm rounded shadow-lg z-50">{error}</div>}
      {message && <div className="fixed top-28 sm:top-20 right-4 sm:right-8 bg-green-500 text-white px-6 py-3 text-sm rounded shadow-lg z-50">{message}</div>}

      <div className="min-h-auto">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onNext)} className="mx-auto">
            <div className="grid sm:grid-cols-4 w-full gap-4 mb-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab.id ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white" : "bg-gray-200"}`}
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
            {activeTab === "status" && <SurveyStatus />}

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
        <SignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          onSave={handleSignatureSave}
          customerName={watch("fullName") || "Customer"}
        />
      </div>
    </>
  );
};

export default SurveyDetails;