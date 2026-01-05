import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaMinus, FaChevronDown, FaChevronUp, FaTimes, FaBars, FaEdit, FaCheck, FaSearch, FaSignature, FaEye } from "react-icons/fa";
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
import Article from "./components/Article";
import AdditionalServicesTab from "./components/AdditionalServicesTab";
import VehicleDetails from "./components/VehicleDetails";

const salutationOptions = [
    { value: "Mr", label: "Mr" },
    { value: "Mrs", label: "Mrs" },
    { value: "Ms", label: "Ms" },
];

const frequencyOptions = [
    { value: "short_term", label: "Short Term" },
    { value: "long_term", label: "Long Term" },
];

const storageModeOptions = [
    { value: "ac", label: "AC" },
    { value: "non_ac", label: "Non-AC" },
    { value: "self_storage", label: "Self Storage" },
];

const serviceTypeOptions = [
    { value: "localMove", label: "Local Move" },
    { value: "internationalMove", label: "International Move" },
    { value: "carExport", label: "Car Import and Export" },
    { value: "storageServices", label: "Storage Services" },
    { value: "logistics", label: "Logistics" }
];


const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

const Customer = ({ apiData, countryOptions, getStateOptions, getCityOptions, originCountry, originState, register, watch, multipleAddresses, destinationAddresses, removeAddress, addAddress }) => {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <h3 className="text-lg sm:text-xl font-medium mb-4">Customer Details</h3>
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
            </div>

            <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <h3 className="text-lg sm:text-xl font-medium mb-4">Survey Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DatePickerInput label="Survey Date" name="surveyDate" />
                    <DatePickerInput label="Start Time" name="surveyStartTime" isTimeOnly />
                    <DatePickerInput label="End Time" name="surveyEndTime" isTimeOnly />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <h3 className="text-lg sm:text-xl font-medium mb-4">Origin Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Origin Address" name="originAddress" />
                    <Input label="Country" name="originCountry" type="select" options={countryOptions} />
                    <Input label="State" name="originState" type="select" options={getStateOptions(originCountry)} />
                    <Input label="City" name="originCity" type="select" options={getCityOptions(originCountry, originState)} />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <h3 className="text-lg sm:text-xl font-medium mb-4">Destination Details</h3>
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
            </div>

            <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <h3 className="text-lg sm:text-xl font-medium mb-4">Move Date</h3>
                <div className="grid grid-cols-1 gap-4">
                    <DatePickerInput label="Packing From" name="packingDateFrom" />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <h3 className="text-lg sm:text-xl font-medium mb-4">Storage Details</h3>
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
            </div>
        </div>
    );
};

const SurveyStatus = ({ register, watch, signatureUploaded, signatureImageUrl, isSignatureUploading, setIsSignatureModalOpen, isSignatureModalOpen, localSignatureFile }) => {
    return (
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-lg sm:text-xl font-medium mb-4">Survey Status</h3>
            <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Status" name="status" type="select" options={statusOptions} />
                    <Input label="Work Description" name="workDescription" type="textarea" placeholder="Enter any additional notes or description about the survey..." />
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                    <h4 className="text-lg font-medium text-gray-800 mb-6 flex items-center gap-2">
                        <FaEdit className="text-[#4c7085]" />
                        Customer Digital Signature
                    </h4>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-full md:w-64 h-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden relative group">
                            {(signatureUploaded || signatureImageUrl || localSignatureFile) ? (
                                <div className="relative w-full h-full p-2">
                                    <img
                                        src={signatureImageUrl || (localSignatureFile ? URL.createObjectURL(localSignatureFile) : "")}
                                        alt="Signature"
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => setIsSignatureModalOpen(true)}
                                            className="px-4 py-2 bg-white text-gray-800 text-xs font-bold rounded-lg shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
                                        >
                                            Update Signature
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <FaSignature size={32} className="opacity-20" />
                                    <span className="text-xs font-medium italic">No signature captured</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-4">
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {signatureUploaded || signatureImageUrl || localSignatureFile
                                    ? "Customer signature has been captured successfully and will be included in the survey report."
                                    : "Please capture the customer's digital signature to finalize the survey. This signature will be used for official documentation."}
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsSignatureModalOpen(true)}
                                disabled={isSignatureUploading}
                                className={`
                                    flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all
                                    ${(signatureUploaded || signatureImageUrl || localSignatureFile)
                                        ? "bg-white border-2 border-[#4c7085] text-[#4c7085] hover:bg-[#4c7085]/5"
                                        : "bg-[#4c7085] text-white shadow-md hover:shadow-lg hover:bg-[#3d5a6b]"}
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                <FaPlus size={14} />
                                {(signatureUploaded || signatureImageUrl || localSignatureFile) ? "Change Signature" : "Capture Signature"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
    const [localSignatureFile, setLocalSignatureFile] = useState(null);

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

    const countryOptions = useMemo(() => Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })), []);
    const getStateOptions = useCallback((code) => code ? State.getStatesOfCountry(code).map(s => ({ value: s.isoCode, label: s.name })) : [], []);
    const getCityOptions = useCallback((country, state) => country && state ? City.getCitiesOfState(country, state).map(c => ({ value: c.name, label: c.name })) : [], []);

    const originCountry = watch("originCountry");
    const originState = watch("originState");
    const destinationAddresses = watch("destinationAddresses") || [];
    const multipleAddresses = watch("multipleAddresses");

    const addAddress = () => {
        const newAddr = { id: uuidv4(), address: "", city: "Doha", country: "QA", state: "", zip: "", poe: "" };
        const updated = [...destinationAddresses, newAddr];
        setValue("destinationAddresses", updated);
    };

    const removeAddress = (index) => {
        if (destinationAddresses.length > 1) {
            const updated = destinationAddresses.filter((_, i) => i !== index);
            setValue("destinationAddresses", updated);
        }
    };

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
                            id: service.service_id,
                            name: service.name,
                            selected: true,
                            quantity: service.quantity || 1,
                            remarks: service.remarks || ""
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
        if (!file) return;

        if (!existingSurvey) {
            // New survey: Save locally and show preview
            setLocalSignatureFile(file);
            setSignatureUploaded(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSignatureImageUrl(reader.result);
            };
            reader.readAsDataURL(file);
            setIsSignatureModalOpen(false);
            return;
        }

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
            additional_services: data.additionalServices?.map(service => ({
                service_id: service.id,
                quantity: service.quantity || 1,
                remarks: service.remarks || "",
            })) || [],
        };

        const request = existingSurvey
            ? apiClient.put(`/surveys/${existingSurvey.survey_id}/`, payload)
            : apiClient.post("/surveys/", payload);

        request
            .then(async (res) => {
                const newSurveyId = res.data.survey_id;

                // If there's a local signature to upload
                if (localSignatureFile && !existingSurvey) {
                    const formData = new FormData();
                    formData.append("signature", localSignatureFile);
                    try {
                        await apiClient.post(
                            `/surveys/${newSurveyId}/upload-signature/`,
                            formData,
                            { headers: { "Content-Type": "multipart/form-data" } }
                        );
                    } catch (err) {
                        console.error("Delayed signature upload failed:", err);
                    }
                }

                setMessage(existingSurvey ? "Survey updated!" : "Survey created!");
                setTimeout(() => navigate(`/survey/${newSurveyId}/survey-summary`, { state: { customerData: data } }), 2000);
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

                        {activeTab === "customer" && (
                            <Customer
                                apiData={apiData}
                                countryOptions={countryOptions}
                                getStateOptions={getStateOptions}
                                getCityOptions={getCityOptions}
                                originCountry={originCountry}
                                originState={originState}
                                register={register}
                                watch={watch}
                                multipleAddresses={methods.watch("multipleAddresses")}
                                destinationAddresses={methods.watch("destinationAddresses")}
                                removeAddress={removeAddress}
                                addAddress={addAddress}
                            />
                        )}
                        {activeTab === "items" && (
                            <>
                                <Article apiData={apiData} setMessage={setMessage} setError={setError} />
                                <div className="mt-4 sm:mt-10">
                                    <VehicleDetails />
                                </div>
                            </>
                        )}
                        {activeTab === "additionalServices" && (
                            <AdditionalServicesTab
                                services={watch("additionalServices")}
                                setServices={(newServices) => setValue("additionalServices", newServices)}
                            />
                        )}
                        {activeTab === "status" && (
                            <SurveyStatus
                                register={register}
                                watch={watch}
                                signatureUploaded={signatureUploaded}
                                signatureImageUrl={signatureImageUrl}
                                isSignatureUploading={isSignatureUploading}
                                setIsSignatureModalOpen={setIsSignatureModalOpen}
                                isSignatureModalOpen={isSignatureModalOpen}
                                localSignatureFile={localSignatureFile}
                            />
                        )}

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