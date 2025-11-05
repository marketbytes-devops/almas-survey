// pages/SurveyDetails/Article.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { FaChevronDown, FaChevronUp, FaPlus } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useParams } from "react-router";
import apiClient from "../../../api/apiClient";
import Input from "../../../components/Input";

const Loading = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
  </div>
);

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
          aria-label={`Decrease ${label || "quantity"}`}
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
          aria-label={label || "quantity"}
        />
        <button
          type="button"
          onClick={increment}
          className="p-3 bg-gray-200 rounded-r-lg hover:bg-gray-300 transition-colors"
          aria-label={`Increase ${label || "quantity"}`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error.message}</p>}
    </div>
  );
};

const Article = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(null);
  const [activeTab, setActiveTab] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [itemQuantities, setItemQuantities] = useState({});
  const [articles, setArticles] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [roomItems, setRoomItems] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [roomOptions, setRoomOptions] = useState([]);
  const [volumeUnitOptions, setVolumeUnitOptions] = useState([]);
  const [weightUnitOptions, setWeightUnitOptions] = useState([]);
  const [packingOptionOptions, setPackingOptionOptions] = useState([]);
  const [handymanOptions, setHandymanOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [vehicleTypeOptions, setVehicleTypeOptions] = useState([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  const { customerData } = location.state || {};

  const methods = useForm({
    defaultValues: {
      articles: [],
      vehicles: [],
      category: "",
      itemName: "",
      quantity: 0,
      volume: "",
      volumeUnit: "",
      weight: "",
      weightUnit: "",
      handyman: "",
      packingOption: "",
      moveStatus: "",
      amount: "",
      currency: "",
      remarks: "",
      vehicleType: "",
      make: "",
      model: "",
      insurance: false,
      remark: "",
    },
  });

  const { handleSubmit, watch, setValue, reset } = methods;

  const refetchAllTypes = async () => {
    setIsLoadingTypes(true);
    try {
      const [
        roomsResponse,
        volumeUnitsResponse,
        weightUnitsResponse,
        packingTypesResponse,
        handymanResponse,
        currencyResponse,
        vehicleTypesResponse,
      ] = await Promise.all([
        apiClient.get("/rooms/"),
        apiClient.get("/volume-units/"),
        apiClient.get("/weight-units/"),
        apiClient.get("/packing-types/"),
        apiClient.get("/handyman/"),
        apiClient.get("/currencies/"),
        apiClient.get("/vehicle-types/"),
      ]);

      setRoomOptions(
        roomsResponse.data.map((room) => ({
          id: room.id,
          value: room.name,
          label: room.name,
        }))
      );
      setVolumeUnitOptions(
        volumeUnitsResponse.data.map((unit) => ({
          value: unit.name,
          label: unit.name,
        }))
      );
      setWeightUnitOptions(
        weightUnitsResponse.data.map((unit) => ({
          value: unit.name,
          label: unit.name,
        }))
      );
      setPackingOptionOptions(
        packingTypesResponse.data.map((type) => ({
          value: type.name.toLowerCase(),
          label: type.name,
        }))
      );
      setHandymanOptions(
        handymanResponse.data.map((handyman) => ({
          value: handyman.type_name,
          label: handyman.type_name,
        }))
      );
      setCurrencyOptions(
        currencyResponse.data.map((currency) => ({
          value: currency.name,
          label: currency.name,
        }))
      );
      setVehicleTypeOptions(
        vehicleTypesResponse.data.map((type) => ({
          value: type.name,
          label: type.name,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch types:", err);
      setError("Failed to fetch some options. Using default values.");
      setRoomOptions([
        { id: 1, value: "bedroom1", label: "Bedroom 1" },
        { id: 2, value: "bedroom2", label: "Bedroom 2" },
        { id: 3, value: "bedroom3", label: "Bedroom 3" },
        { id: 4, value: "living_room", label: "Living Room" },
        { id: 5, value: "kitchen", label: "Kitchen" },
        { id: 6, value: "dining_room", label: "Dining Room" },
        { id: 7, value: "bathroom", label: "Bathroom" },
      ]);
      setVolumeUnitOptions([{ value: "CFT", label: "CFT Net" }]);
      setWeightUnitOptions([{ value: "KG", label: "KG Net" }]);
      setPackingOptionOptions([
        { value: "full", label: "FullPacking" },
        { value: "partial", label: "Partial Packing" },
        { value: "none", label: "No Packing" },
      ]);
      setHandymanOptions([
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ]);
      setCurrencyOptions([
        { value: "USD", label: "USD" },
        { value: "INR", label: "INR" },
      ]);
      setVehicleTypeOptions([
        { value: "car", label: "Car" },
        { value: "truck", label: "Truck" },
        { value: "motorcycle", label: "Motorcycle" },
      ]);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoadingTypes(false);
    }
  };

  useEffect(() => {
    refetchAllTypes();
  }, []);

  useEffect(() => {
    if (selectedRoom?.id) {
      const fetchItems = async () => {
        try {
          const response = await apiClient.get(`/items/?room_id=${selectedRoom.id}`);
          setRoomItems(response.data);
        } catch (err) {
          console.error("Failed to fetch items:", err);
          const fallbackItems = roomItemsMap[selectedRoom.value] || [];
          setRoomItems(fallbackItems.map((item, index) => ({
            id: `fb_${index}`,
            name: item.value,
          })));
        }
      };
      fetchItems();
    } else {
      setRoomItems([]);
    }
  }, [selectedRoom]);

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

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
    const updatedArticles = [...articles, newArticle];
    setArticles(updatedArticles);
    setValue("articles", updatedArticles);
    setExpandedItems((prev) => ({ ...prev, [itemName]: false }));
    setItemQuantities((prev) => {
      const newQuantities = { ...prev };
      delete newQuantities[itemName];
      return newQuantities;
    });
    setSuccess("Article added successfully!");
    setTimeout(() => setSuccess(null), 3000);
  };

  const addVehicle = (data) => {
    const newVehicle = {
      vehicleType: data.vehicleType,
      make: data.make,
      model: data.model,
      insurance: data.insurance,
      remark: data.remark,
    };
    const updatedVehicles = [...vehicles, newVehicle];
    setVehicles(updatedVehicles);
    setValue("vehicles", updatedVehicles);
    setSuccess("Vehicle added successfully!");
    setTimeout(() => setSuccess(null), 3000);
    reset({
      articles: watch("articles"),
      vehicles: updatedVehicles,
      vehicleType: "",
      make: "",
      model: "",
      insurance: false,
      remark: "",
    });
  };

  const onNext = () => {
    navigate(`/survey/${surveyId}/service`, {
      state: {
        customerData,
        articles,
        vehicles,
      },
    });
  };

  const onBack = () => {
    navigate(`/survey/${surveyId}/customer`, {
      state: { customerData },
    });
  };

  const onAddNewArticle = () => {
    navigate(`/survey/${surveyId}/add-article`, {
      state: { customerData, articles, vehicles },
    });
  };

  const roomItemsMap = {
    bedroom1: [
      { value: "bed", label: "Bed" },
      { value: "wardrobe", label: "Wardrobe" },
      { value: "dresser", label: "Dresser" },
      { value: "nightstand", label: "Nightstand" },
      { value: "mattress", label: "Mattress" },
    ],
    bedroom2: [
      { value: "bed", label: "Bed" },
      { value: "wardrobe", label: "Wardrobe" },
      { value: "study_table", label: "Study Table" },
      { value: "chair", label: "Chair" },
    ],
    bedroom3: [
      { value: "bed", label: "Bed" },
      { value: "wardrobe", label: "Wardrobe" },
      { value: "bookshelf", label: "Bookshelf" },
    ],
    living_room: [
      { value: "sofa", label: "Sofa" },
      { value: "tv", label: "TV" },
      { value: "coffee_table", label: "Coffee Table" },
      { value: "tv_stand", label: "TV Stand" },
      { value: "speaker", label: "Speaker" },
      { value: "carpet", label: "Carpet" },
    ],
    kitchen: [
      { value: "refrigerator", label: "Refrigerator" },
      { value: "microwave", label: "Microwave" },
      { value: "oven", label: "Oven" },
      { value: "dining_table", label: "Dining Table" },
      { value: "kitchen_cabinet", label: "Kitchen Cabinet" },
    ],
    dining_room: [
      { value: "dining_table", label: "Dining Table" },
      { value: "dining_chair", label: "Dining Chair" },
      { value: "buffet", label: "Buffet" },
      { value: "china_cabinet", label: "China Cabinet" },
    ],
    bathroom: [
      { value: "washing_machine", label: "Washing Machine" },
      { value: "bathroom_cabinet", label: "Bathroom Cabinet" },
      { value: "mirror", label: "Mirror" },
    ],
  };

  const moveStatusOptions = [
    { value: "new", label: "New" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  const noPackingArticles = articles.filter((article) => article.packingOption === "none");

  const getItemsForRoom = () => {
    return roomItems;
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setShowRoomDropdown(false);
    setActiveTab("");
    setActiveSection("master-article");
  };

  const ItemRow = ({ item, itemQuantities, updateQuantity, addArticle, expandedItems, toggleExpandedItem, volumeUnitOptions, weightUnitOptions, handymanOptions, packingOptionOptions, currencyOptions }) => {
    const itemFormMethods = useForm({
      defaultValues: {
        [`volume_${item.value}`]: "",
        [`volumeUnit_${item.value}`]: volumeUnitOptions[0]?.value || "CFT",
        [`weight_${item.value}`]: "",
        [`weightUnit_${item.value}`]: weightUnitOptions[0]?.value || "KG",
        [`handyman_${item.value}`]: handymanOptions[0]?.value || "",
        [`packingOption_${item.value}`]: packingOptionOptions[0]?.value || "",
        [`moveStatus_${item.value}`]: "new",
        [`amount_${item.value}`]: "",
        [`currency_${item.value}`]: currencyOptions[0]?.value || "",
        [`remarks_${item.value}`]: "",
        [`quantity_${item.value}`]: itemQuantities[item.value] || 0,
      },
    });

    const { handleSubmit: handleItemSubmit } = itemFormMethods;

    return (
      <>
        <tr key={`${item.value}-main`} className="border-b border-gray-200 flex flex-col sm:table-row">
          <td
            className="text-left py-4 px-4 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleExpandedItem(item.value)}
          >
            <span className="font-medium">{item.label}</span>
          </td>
          <td className="text-center py-4 px-4">
            <FormProvider {...itemFormMethods}>
              <QuantityInput
                label=""
                name={`quantity_${item.value}`}
                onChange={(newQuantity) => updateQuantity(item.value, newQuantity)}
              />
            </FormProvider>
          </td>
          <td className="text-right py-4 px-4">
            <button
              type="button"
              onClick={handleItemSubmit((data) => addArticle(item.value, data))}
              className="px-4 py-2 w-full sm:w-auto bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:shadow-md transition-all text-sm"
            >
              Add
            </button>
          </td>
        </tr>
        <AnimatePresence>
          {expandedItems[item.value] && (
            <tr key={`${item.value}-details`} className="border border-gray-200">
              <td colSpan="3">
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="p-4 bg-white"
                >
                  <FormProvider {...itemFormMethods}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Volume" name={`volume_${item.value}`} type="number" rules={{ required: "Volume is required" }} />
                      <Input label="Volume Unit" name={`volumeUnit_${item.value}`} type="select" options={volumeUnitOptions} rules={{ required: "Volume Unit is required" }} />
                      <Input label="Weight" name={`weight_${item.value}`} type="number" rules={{ required: "Weight is required" }} />
                      <Input label="Weight Unit" name={`weightUnit_${item.value}`} type="select" options={weightUnitOptions} rules={{ required: "Weight Unit is required" }} />
                      <Input label="Handyman" name={`handyman_${item.value}`} type="select" options={handymanOptions} rules={{ required: "Handyman is required" }} />
                      <Input label="Packing Option" name={`packingOption_${item.value}`} type="select" options={packingOptionOptions} rules={{ required: "Packing Option is required" }} />
                      <Input label="Move Status" name={`moveStatus_${item.value}`} type="select" options={moveStatusOptions} rules={{ required: "Move Status is required" }} />
                      <Input label="Amount" name={`amount_${item.value}`} type="number" rules={{ required: "Amount is required" }} />
                      <Input label="Currency" name={`currency_${item.value}`} type="select" options={currencyOptions} rules={{ required: "Currency is required" }} />
                      <Input label="Remarks" name={`remarks_${item.value}`} type="textarea" />
                    </div>
                    <div className="mt-4 flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={handleItemSubmit((data) => addArticle(item.value, data))}
                        className="px-4 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg text-sm hover:bg-[#6b8ca3]"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpandedItem(item.value)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                      >
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
          {activeTab !== "no-packing" && (
            <div className="mt-4">
              {selectedRoom ? (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full border-collapse">
                    <thead className="hidden sm:table-row-group">
                      <tr className="bg-gray-100">
                        <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-left">Item</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-center">Quantity</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getItemsForRoom().map((itemData) => (
                        <ItemRow
                          key={itemData.id}
                          item={{ value: itemData.name, label: itemData.name }}
                          itemQuantities={itemQuantities}
                          updateQuantity={updateQuantity}
                          addArticle={addArticle}
                          expandedItems={expandedItems}
                          toggleExpandedItem={toggleExpandedItem}
                          volumeUnitOptions={volumeUnitOptions}
                          weightUnitOptions={weightUnitOptions}
                          handymanOptions={handymanOptions}
                          packingOptionOptions={packingOptionOptions}
                          currencyOptions={currencyOptions}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Please select a room to view items.
                </div>
              )}
            </div>
          )}
          {activeTab === "no-packing" && (
            <div className="mt-4">
              {noPackingArticles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-left">Item</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-left">Room</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-left">Quantity</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-left">Volume</th>
                        <th className="py-3 px-4 text-sm font-semibold text-gray-700 text-left">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {noPackingArticles.map((article, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4 text-sm">{article.itemName}</td>
                          <td className="py-3 px-4 text-sm">{roomOptions.find(r => r.value === article.room)?.label || article.room}</td>
                          <td className="py-3 px-4 text-sm">{article.quantity}</td>
                          <td className="py-3 px-4 text-sm">{article.volume} {article.volumeUnit}</td>
                          <td className="py-3 px-4 text-sm">{article.weight} {article.weightUnit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No Packing Items not available now
                </div>
              )}
            </div>
          )}
          {articles.length > 0 && (
            <div className="fixed bottom-4 right-4">
              <button
                type="button"
                onClick={() => console.log("View Articles", articles)}
                className="px-4 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:shadow-md transition-all text-sm"
              >
                View Items Qty ({articles.length})
              </button>
            </div>
          )}
        </>
      ),
    },
    {
      id: "vehicle",
      title: "Vehicle",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
          <Input label="Vehicle Type" name="vehicleType" type="select" options={vehicleTypeOptions} rules={{ required: "Vehicle Type is required" }} />
          <Input label="Make" name="make" type="text" rules={{ required: "Make is required" }} />
          <Input label="Model" name="model" type="text" rules={{ required: "Model is required" }} />
          <Input label="Insurance" name="insurance" type="checkbox" />
          <Input label="Remark" name="remark" type="textarea" />
          <div className="flex flex-col sm:flex-row sm:gap-3 sm:justify-end col-span-1 sm:col-span-2">
            <button
              type="button"
              onClick={handleSubmit(addVehicle)}
              className="px-4 py-2 w-full sm:w-auto bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:bg-[#6b8ca3] hover:shadow-md transition-all duration-300 text-sm"
            >
              Add Vehicle
            </button>
            <button
              type="button"
              onClick={() =>
                reset({
                  articles: watch("articles"),
                  vehicles: watch("vehicles"),
                  vehicleType: "",
                  make: "",
                  model: "",
                  insurance: false,
                  remark: "",
                })
              }
              className="px-4 py-2 w-full sm:w-auto bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 hover:shadow-md transition-all duration-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-full mx-auto">
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg shadow"
          >
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg shadow"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      {isLoadingTypes && <Loading />}
      <FormProvider {...methods}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 mb-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowRoomDropdown(!showRoomDropdown);
                  setActiveTab("selectRoom");
                }}
                className={`w-full px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center ${
                  activeTab === "selectRoom"
                    ? "border-b-2 border-indigo-500 text-indigo-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <span className="text-gray-700">
                  {selectedRoom ? selectedRoom.label : "Select a Room"}
                </span>
                <FaChevronDown
                  className={`w-3 h-3 text-gray-600 transition-transform ${
                    showRoomDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {showRoomDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
                  >
                    {roomOptions.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => handleRoomSelect(room)}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        {room.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("no-packing")}
              className={`w-full px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center ${
                activeTab === "no-packing"
                  ? "border-b-2 border-indigo-500 text-indigo-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              No Packing
            </button>
            <button
              type="button"
              onClick={onAddNewArticle}
              className="w-full px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:bg-[#6b8ca3] transition-colors flex justify-center items-center"
            >
              <FaPlus className="w-3 h-3 mr-2" /> Add New Article
            </button>
          </div>
          {sections.map((section) => (
            <div key={section.id}>
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="mb-4 group rounded-lg shadow-sm w-full flex justify-between items-center p-4 text-left bg-gray-100 hover:bg-[#4c7085] transition-all duration-300"
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
                    className="p-4 bg-white rounded-lg shadow-md"
                  >
                    {section.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 w-full sm:w-auto bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 hover:shadow-md transition-all duration-300 text-sm"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onNext}
              className="px-4 py-2 w-full sm:w-auto bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:bg-[#6b8ca3] hover:shadow-md transition-all duration-300 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      </FormProvider>
    </div>
  );
};

export default Article;