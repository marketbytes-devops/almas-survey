import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaPlus, FaMinus, FaChevronDown, FaChevronUp, FaTimes, FaEdit,
    FaCheck, FaSearch, FaSignature, FaEye, FaMapMarkerAlt, FaSpinner,
    FaCalendar, FaClock, FaUser, FaTruck, FaBox
} from "react-icons/fa";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Loading from "../../components/Loading";
import apiClient from "../../api/apiClient";
import { Country, State, City } from "country-state-city";
import SignatureModal from "../../components/SignatureModal/SignatureModal"; // Keeping this as is, assuming it's a specific component
import Article from "./components/Article";
import AdditionalServicesTab from "./components/AdditionalServicesTab";
import VehicleDetails from "./components/VehicleDetails";
import PageHeader from "../../components/PageHeader";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";

// --- STYLING CONSTANTS ---
const CARD_CLASS = "bg-white rounded-2xl border border-gray-200 shadow-sm p-6 transition-all hover:shadow-md";
const BUTTON_BASE = "px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm";
const INPUT_CLASS_BASE = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#4c7085] focus:ring-0 transition-all outline-none text-sm text-gray-900 placeholder-gray-500";
const LABEL_CLASS = "block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1";

// --- HELPER FUNCTIONS ---
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// --- COMPONENTS ---

// 1. Reusable Input Field
const InputField = ({ label, name, type = "text", options = [], rules = {}, placeholder, ...props }) => {
    const { register, formState: { errors } } = useFormContext();

    // Helper to get nested error safely
    const getNestedError = (obj, path) => {
        return path.split(/[\.\[\]]/).filter(Boolean).reduce((acc, part) => acc && acc[part], obj);
    };
    const error = getNestedError(errors, name);

    return (
        <div className="flex flex-col">
            {label && (
                <label className={LABEL_CLASS}>
                    {label}
                    {rules.required && <span className="text-red-500"> *</span>}
                </label>
            )}
            {type === "select" ? (
                <div className="relative">
                    <select
                        {...register(name, rules)}
                        className={`${INPUT_CLASS_BASE} appearance-none ${error ? "border-red-500 bg-red-50/10" : ""}`}
                        {...props}
                    >
                        <option value="">Select option</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-600">
                        <FaChevronDown className="w-3 h-3" />
                    </div>
                </div>
            ) : type === "textarea" ? (
                <textarea
                    {...register(name, rules)}
                    placeholder={placeholder}
                    className={`${INPUT_CLASS_BASE} min-h-[120px] resize-y ${error ? "border-red-500 bg-red-50/10" : ""}`}
                    {...props}
                />
            ) : (
                <input
                    type={type}
                    {...register(name, rules)}
                    placeholder={placeholder}
                    className={`${INPUT_CLASS_BASE} ${error ? "border-red-500 bg-red-50/10" : ""}`}
                    {...props}
                />
            )}
            {error && <p className="mt-1.5 ml-1 text-xs text-red-500 font-medium">{error.message || "Required"}</p>}
        </div>
    );
};

// 2. DatePicker Input
const DatePickerInput = ({ label, name, rules = {}, isTimeOnly = false }) => {
    const { setValue, watch, formState: { errors } } = useFormContext();
    const value = watch(name);
    const error = errors?.[name];

    return (
        <div className="w-full">
            {label && (
                <label className={LABEL_CLASS}>
                    {label} {rules?.required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                <DatePicker
                    selected={value}
                    onChange={(date) => setValue(name, date, { shouldValidate: true })}
                    showTimeSelect={isTimeOnly}
                    showTimeSelectOnly={isTimeOnly}
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat={isTimeOnly ? "h:mm aa" : "MM/dd/yyyy"}
                    className={`${INPUT_CLASS_BASE} ${error ? "border-red-500 bg-red-50/10" : ""}`}
                    placeholderText={isTimeOnly ? "Select time" : "Select date"}
                    wrapperClassName="w-full"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-600">
                    {isTimeOnly ? <FaClock className="w-4 h-4" /> : <FaCalendar className="w-4 h-4" />}
                </div>
            </div>
            {error && <p className="mt-1.5 ml-1 text-xs text-red-500 font-medium">{error.message}</p>}
        </div>
    );
};

const Customer = ({ apiData, countryOptions, getStateOptions, getCityOptions, originCountry, originState, register, watch, multipleAddresses, destinationAddresses, removeAddress, addAddress, setValue }) => {
    const [isLocating, setIsLocating] = useState(false);

    const salutationOptions = [
        { value: "Mr", label: "Mr" },
        { value: "Mrs", label: "Mrs" },
        { value: "Ms", label: "Ms" },
    ];

    const serviceTypeOptions = [
        { value: "localMove", label: "Local Move" },
        { value: "internationalMove", label: "International Move" },
        { value: "carExport", label: "Car Import and Export" },
        { value: "storageServices", label: "Storage Services" },
        { value: "logistics", label: "Logistics" }
    ];

    const handleGetLocation = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
                        const data = await response.json();

                        if (data && data.address) {
                            const address = data.address;
                            const fullAddress = data.display_name;
                            const fetchedCountry = address.country;
                            const fetchedState = address.state || address.region || "";
                            const fetchedIsoState = address["ISO3166-2-lvl4"] || address["ISO3166-2"] || "";

                            // 1. Set Full Address & GPS
                            setValue("originAddress", fullAddress, { shouldValidate: true });
                            setValue("originGps", `https://www.google.com/maps?q=${latitude},${longitude}`, { shouldValidate: true });

                            // 2. Match Country
                            const allCountries = Country.getAllCountries();
                            const matchedCountry = allCountries.find(c =>
                                c.name.toLowerCase() === fetchedCountry.toLowerCase() ||
                                c.isoCode === (address.country_code || "").toUpperCase()
                            );

                            if (matchedCountry) {
                                setValue("originCountry", matchedCountry.isoCode, { shouldValidate: true });

                                // 3. Match State (with small delay to ensure country is set)
                                setTimeout(() => {
                                    const allStates = State.getStatesOfCountry(matchedCountry.isoCode);
                                    let matchedState = null;

                                    // Try ISO match first
                                    if (fetchedIsoState) {
                                        const isoSuffix = fetchedIsoState.split('-')[1];
                                        if (isoSuffix) matchedState = allStates.find(s => s.isoCode === isoSuffix);
                                    }
                                    // Fallback to name match
                                    if (!matchedState) {
                                        matchedState = allStates.find(s => s.name.toLowerCase() === fetchedState.toLowerCase());
                                    }
                                    // Fallback to fuzzy name match
                                    if (!matchedState) {
                                        matchedState = allStates.find(s =>
                                            fetchedState.toLowerCase().includes(s.name.toLowerCase()) ||
                                            s.name.toLowerCase().includes(fetchedState.toLowerCase())
                                        );
                                    }

                                    if (matchedState) {
                                        setValue("originState", matchedState.isoCode, { shouldValidate: true });

                                        // 4. Match City (Delayed)
                                        setTimeout(() => {
                                            const allCities = City.getCitiesOfState(matchedCountry.isoCode, matchedState.isoCode);

                                            // Prioritized candidates from most specific to least specific
                                            const cityCandidates = [
                                                address.city,
                                                address.town,
                                                address.village,
                                                address.municipality,
                                                address.city_district,
                                                address.suburb,
                                                address.neighbourhood,
                                                address.county,         // Often contains the district name (e.g., Alappuzha)
                                                address.state_district  // Often contains the major city name (e.g., Thiruvananthapuram)
                                            ].filter(Boolean);

                                            let matchedCity = null;

                                            // Strategy A: Exact Match
                                            for (const candidate of cityCandidates) {
                                                matchedCity = allCities.find(c => c.name.toLowerCase() === candidate.toLowerCase());
                                                if (matchedCity) break;
                                            }

                                            // Strategy B: Library Contains Candidate (e.g. Lib: "Cherthala" vs Cand: "Cherthala South")
                                            if (!matchedCity) {
                                                for (const candidate of cityCandidates) {
                                                    matchedCity = allCities.find(c => c.name.toLowerCase().includes(candidate.toLowerCase()));
                                                    if (matchedCity) break;
                                                }
                                            }

                                            // Strategy C: Candidate Contains Library (e.g. Lib: "Trivandrum" vs Cand: "Thiruvananthapuram City")
                                            // Also checking known alliases if possible, but basic substring text here
                                            if (!matchedCity) {
                                                for (const candidate of cityCandidates) {
                                                    matchedCity = allCities.find(c => candidate.toLowerCase().includes(c.name.toLowerCase()));
                                                    if (matchedCity) break;
                                                }
                                            }

                                            // Set the city
                                            if (matchedCity) {
                                                setValue("originCity", matchedCity.name, { shouldValidate: true });
                                            } else if (cityCandidates.length > 0) {
                                                // Fallback: Just set the first valid candidate name even if not in dropdown
                                                // This ensures visual feedback even if the library is missing the city
                                                setValue("originCity", cityCandidates[0], { shouldValidate: true });
                                            }
                                        }, 300);
                                    }
                                }, 100);
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching location data:", error);
                        setValue("originGps", `https://www.google.com/maps?q=${latitude},${longitude}`, { shouldValidate: true });
                    } finally {
                        setIsLocating(false);
                    }
                },
                (error) => {
                    alert("Unable to fetch location.");
                    setIsLocating(false);
                }
            );
        } else {
            alert("Geolocation not supported.");
            setIsLocating(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Customer Details Card */}
            <div className={CARD_CLASS}>
                <h3 className="flex items-center gap-2 text-base font-medium text-gray-800 mb-6">
                    <div className="w-8 h-8 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085]">
                        <FaUser className="w-4 h-4" />
                    </div>
                    Customer Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <InputField label="Customer Type" name="customerType" type="select" options={apiData.customerTypes} />
                    <InputField label="Salutation" name="salutation" type="select" options={salutationOptions} />
                    <InputField label="Full Name" name="fullName" rules={{ required: "Required" }} width="col-span-2" />
                    <InputField label="Phone" name="phoneNumber" rules={{ required: "Required" }} />
                    <InputField label="Email" name="email" type="email" />
                    <InputField label="Service Type" name="serviceType" type="select" options={serviceTypeOptions} />
                    <InputField label="Company" name="company" />
                    <div className="flex items-end pb-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${watch("isMilitary") ? 'bg-[#4c7085] border-[#4c7085]' : 'bg-white border-gray-300 group-hover:border-[#4c7085]'}`}>
                                <input type="checkbox" {...register("isMilitary")} className="hidden" />
                                {watch("isMilitary") && <FaCheck className="text-white text-[10px]" />}
                            </div>
                            <span className="text-sm font-medium text-gray-700">Military Status</span>
                        </label>
                    </div>
                    <div className="md:col-span-4">
                        <InputField label="Address (Billing)" name="address" />
                    </div>
                </div>
            </div>

            {/* Survey Details Card */}
            <div className={CARD_CLASS}>
                <h3 className="flex items-center gap-2 text-base font-medium text-gray-800 mb-6">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                        <FaCalendar className="w-4 h-4" />
                    </div>
                    Survey Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DatePickerInput label="Survey Date" name="surveyDate" />
                    <DatePickerInput label="Start Time" name="surveyStartTime" isTimeOnly />
                    <DatePickerInput label="End Time" name="surveyEndTime" isTimeOnly />
                </div>
            </div>

            {/* Origin Address Card */}
            <div className={CARD_CLASS}>
                <h3 className="flex items-center gap-2 text-base font-medium text-gray-800 mb-6">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <FaMapMarkerAlt className="w-4 h-4" />
                    </div>
                    Origin Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 relative">
                        <InputField label="Full Origin Address" name="originAddress" />
                        <button
                            type="button"
                            onClick={handleGetLocation}
                            disabled={isLocating}
                            className={`absolute right-2 top-[28px] p-2 rounded-lg transition-colors ${isLocating
                                ? 'text-gray-600 cursor-not-allowed'
                                : watch("originGps")
                                    ? 'text-green-600 hover:bg-green-50'
                                    : 'text-[#4c7085] hover:bg-[#4c7085]/10'
                                }`}
                            title={watch("originGps") ? "Location detected" : "Auto-detect location"}
                        >
                            {isLocating ? <FaSpinner className="animate-spin" /> : (watch("originGps") ? <FaCheck /> : <FaMapMarkerAlt />)}
                        </button>
                    </div>
                    <InputField label="Country" name="originCountry" type="select" options={countryOptions} />
                    <InputField label="State" name="originState" type="select" options={getStateOptions(originCountry)} />
                    <InputField label="City" name="originCity" type="select" options={getCityOptions(originCountry, originState)} />
                    <InputField label="GPS Coordinates / Link" name="originGps" placeholder="https://maps.google.com/..." />
                    {watch("originGps") && (
                        <a href={watch("originGps")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline mt-2 ml-1">
                            <FaMapMarkerAlt /> Go to map
                        </a>
                    )}
                </div>
            </div>

            {/* Destination Card */}
            <div className={CARD_CLASS}>
                <h3 className="flex items-center gap-2 text-base font-medium text-gray-800 mb-6">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                        <FaTruck className="w-4 h-4" />
                    </div>
                    Destination Details
                </h3>

                <div className="mb-6">
                    <label className="flex items-center gap-3 cursor-pointer w-fit">
                        <div className={`w-11 h-6 rounded-full p-1 transition-colors ${multipleAddresses ? 'bg-[#4c7085]' : 'bg-gray-200'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${multipleAddresses ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" {...register("multipleAddresses")} className="hidden" />
                        <span className="text-sm font-medium text-gray-700">Multiple Drop-off Addresses</span>
                    </label>
                </div>

                <div className="space-y-6">
                    {destinationAddresses.map((addr, i) => {
                        const country = watch(`destinationAddresses.${i}.country`);
                        const state = watch(`destinationAddresses.${i}.state`);

                        return (
                            <div key={addr.id || i} className="bg-gray-50 rounded-xl p-6 border border-gray-100 relative group">
                                <h4 className="text-xs uppercase tracking-widest text-gray-600 font-medium mb-4">Destination {i + 1}</h4>
                                {multipleAddresses && destinationAddresses.length > 1 && (
                                    <button type="button" onClick={() => removeAddress(i)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                                        <FaTimes />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="lg:col-span-4">
                                        <InputField label="Address" name={`destinationAddresses.${i}.address`} />
                                    </div>
                                    <InputField label="Country" name={`destinationAddresses.${i}.country`} type="select" options={countryOptions} />
                                    <InputField label="State" name={`destinationAddresses.${i}.state`} type="select" options={getStateOptions(country)} />
                                    <InputField label="City" name={`destinationAddresses.${i}.city`} type="select" options={getCityOptions(country, state)} />
                                    <InputField label="ZIP Code" name={`destinationAddresses.${i}.zip`} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {multipleAddresses && hasPermission("survey_details", "edit") && (
                    <button
                        type="button"
                        onClick={addAddress}
                        className="mt-4 px-4 py-2 bg-white border border-[#4c7085] text-[#4c7085] hover:bg-[#4c7085]/5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <FaPlus className="w-3 h-3" /> Add Another Destination
                    </button>
                )}
            </div>

            {/* Move Dates */}
            <div className={CARD_CLASS}>
                <h3 className="flex items-center gap-2 text-base font-medium text-gray-800 mb-6">
                    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                        <FaClock className="w-4 h-4" />
                    </div>
                    Move Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DatePickerInput label="Expected Packing Date" name="packingDateFrom" />
                    <DatePickerInput label="Loading Date" name="loadingDate" />
                    <DatePickerInput label="Est. Delivery Date" name="estDeliveryDate" />
                </div>
            </div>
        </div>
    );
};


const SurveyStatus = ({ register, watch, signatureUploaded, signatureImageUrl, isSignatureUploading, setIsSignatureModalOpen, isSignatureModalOpen, localSignatureFile }) => {
    const { hasPermission } = usePermissions();
    const statusOptions = [
        { value: "pending", label: "Pending" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
    ];

    return (
        <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={CARD_CLASS}>
                <h3 className="flex items-center gap-2 text-base font-medium text-gray-800 mb-6">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <FaCheck className="w-4 h-4" />
                    </div>
                    Status & Completion
                </h3>

                <div className="grid grid-cols-1 gap-6 mb-8">
                    <InputField label="Current Status" name="status" type="select" options={statusOptions} />
                    <InputField label="Surveyor Notes / Work Description" name="workDescription" type="textarea" placeholder="Internal notes about the survey scope..." />
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                            <FaSignature className="text-[#4c7085]" /> Customer Signature
                        </h4>
                        {(signatureUploaded || signatureImageUrl || localSignatureFile) && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Signed</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div
                            className={`h-48 rounded-xl border-2 border-dashed flex items-center justify-center relative overflow-hidden bg-white transition-all ${(signatureUploaded || signatureImageUrl || localSignatureFile) ? 'border-[#4c7085]/50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {(signatureImageUrl || (localSignatureFile && URL.createObjectURL(localSignatureFile))) ? (
                                <>
                                    <img
                                        src={signatureImageUrl || (localSignatureFile && URL.createObjectURL(localSignatureFile))}
                                        alt="Signature"
                                        className="w-full h-full object-contain p-4"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setIsSignatureModalOpen(true)}
                                            className="px-4 py-2 bg-white rounded-lg text-sm font-medium shadow-lg hover:bg-gray-50"
                                        >
                                            Update Signature
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-gray-600">
                                    <FaSignature className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-xs">No signature captured</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 leading-relaxed">
                                The signature confirms the customer agrees with the surveyed items and volume.
                            </p>
                            {hasPermission("survey_details", "edit") && (
                                <button
                                    type="button"
                                    onClick={() => setIsSignatureModalOpen(true)}
                                    disabled={isSignatureUploading}
                                    className={`w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${(signatureUploaded || signatureImageUrl || localSignatureFile)
                                        ? "bg-white border border-[#4c7085] text-[#4c7085] hover:bg-[#4c7085]/5"
                                        : "bg-[#4c7085] text-white hover:shadow-lg hover:-translate-y-0.5"
                                        }`}
                                >
                                    {(signatureUploaded || signatureImageUrl || localSignatureFile) ? "Re-Capture Signature" : "Capture Signature Now"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SurveyDetails = () => {
    const { surveyId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = usePermissions();
    const [activeTab, setActiveTab] = useState("customer");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [existingSurvey, setExistingSurvey] = useState(null);
    const { customerData: initialCustomerData } = location.state || {};
    // const [showArticlesSidebar, setShowArticlesSidebar] = useState(false); // Unused
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
            vehicles: [],
            additionalServices: [],
            articles: [],
            originGps: "",
        },
    });

    const { handleSubmit, watch, setValue, reset, register } = methods;
    const hasReset = useRef(false);

    // Memoize options
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

                    // Populate Form
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
                        originGps: survey.origin_gps || "",
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
                            id: a.id,
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
                            photo: a.photo || null,
                            addedAt: a.created_at || null,
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
            // setError("Failed to load master data."); // Suppress error for cleaner UX, or handle gracefully
            setIsLoading(false);
        });
    }, []);

    // Set default Origin State for QA
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
        { id: "customer", label: "Customer Info" },
        { id: "items", label: "Articles" },
        { id: "additionalServices", label: "Services" },
        { id: "status", label: "Finalize" },
    ];

    const handleTabChange = (tabId) => {
        if (watch("goodsType") === "pet") {
            setMessage("Pet relocation feature is coming soon!");
            return;
        }
        setActiveTab(tabId);
    };

    const handleSignatureSave = async (file) => {
        if (!hasPermission("survey_details", "edit")) return alert("Permission denied");
        if (!file) return;

        if (!existingSurvey) {
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
                { headers: { "Content-Type": "multipart/form-data" } }
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
        if (!hasPermission("surveys", "edit")) return alert("Permission denied");
        setIsLoading(true);

        const processedArticles = await Promise.all(data.articles.map(async (a) => {
            let processedPhoto = undefined;
            if (a.photo instanceof File) {
                try {
                    processedPhoto = await fileToBase64(a.photo);
                } catch (e) {
                    console.error("Error converting photo", e);
                }
            } else if (typeof a.photo === 'string') {
                processedPhoto = undefined;
            } else if (a.photo === null) {
                processedPhoto = null;
            }

            const articleObj = {
                id: (typeof a.id === 'number') ? a.id : undefined,
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
                added_at: a.addedAt || null,
            };

            if (processedPhoto !== undefined) {
                articleObj.photo = processedPhoto;
            }
            return articleObj;
        }));

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
            origin_gps: data.originGps,
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
            articles: processedArticles,
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
                setTimeout(() => navigate(`/survey/${newSurveyId}/survey-summary`, { state: { customerData: data } }), 700);
            })
            .catch(err => {
                console.error("Error saving survey:", err.response?.data);
                setError("Failed to save survey. Check required fields.");
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
            // Validate that at least one item/vehicle/service exists
            if (data.articles.length === 0 && data.vehicles.length === 0 && data.additionalServices.length === 0) {
                setError("Please add at least one item, vehicle, or service before completing.");
                setTimeout(() => setError(null), 3000);
                return;
            }
            // Save the survey
            saveSurveyData(data);
        }
    };

    const getButtonText = () => {
        if (isLoading) return "Processing...";
        if (activeTab === "status") return "Complete Survey";
        return "Next Step";
    };

    const handleBack = () => {
        if (activeTab === "items") setActiveTab("customer");
        else if (activeTab === "additionalServices") setActiveTab("items");
        else if (activeTab === "status") setActiveTab("additionalServices");
        else navigate(-1);
    };

    return (
        <div className="pb-20 space-y-6">
            <PageHeader
                title="Conduct Survey"
                subtitle={`Survey ID: ${surveyId || "New"}`}
                extra={
                    <button onClick={() => navigate("/scheduled-surveys")} className={`${BUTTON_BASE} bg-white border border-gray-100 text-gray-600 hover:bg-gray-50`}>
                        Cancel
                    </button>
                }
            />

            {(isLoading) && <div className="fixed inset-0 bg-white/50 z-[99] flex items-center justify-center backdrop-blur-sm"><Loading /></div>}

            <AnimatePresence>
                {(error || message) && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-24 right-4 z-[100] px-6 py-4 rounded-xl shadow-lg border ${error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                        {error || message}
                    </motion.div>
                )}
            </AnimatePresence>

            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onNext)} className="space-y-6">

                    {/* Tabs */}
                    <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex overflow-x-auto gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabChange(tab.id)}
                                className={`whitespace-nowrap flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                    ? "bg-[#4c7085] text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[400px]">
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
                                setValue={setValue}
                            />
                        )}
                        {activeTab === "items" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Article apiData={apiData} setMessage={setMessage} setError={setError} />
                                <VehicleDetails />
                            </div>
                        )}
                        {activeTab === "additionalServices" && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <AdditionalServicesTab
                                    services={watch("additionalServices")}
                                    setServices={(newServices) => setValue("additionalServices", newServices)}
                                />
                            </div>
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
                    </div>

                    {/* Navigation Buttons */}
                    <div className="fixed bottom-20 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 flex items-center justify-between sm:justify-end gap-3 z-40 lg:bg-transparent lg:border-none lg:p-0 lg:static">
                        <button
                            type="button"
                            onClick={handleBack}
                            className={`${BUTTON_BASE} flex-1 sm:flex-none sm:w-32 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50`}
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`${BUTTON_BASE} flex-1 sm:flex-none sm:w-48 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:shadow-lg disabled:opacity-50`}
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
    );
};

export default SurveyDetails;