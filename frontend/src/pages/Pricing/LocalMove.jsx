import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import Tab from "../../components/Tab/Tab";
import TabPanel from "../../components/Tab/TabPanel";
import PricingTab from "./Tabs/Pricing";
import AdditionalChargesTab from "./Tabs/AdditionalCharges";
import IncludesTab from "./Tabs/Includes";
import ExcludesTab from "./Tabs/Exclude";
import InsuranceTab from "./Tabs/InsuranceTab";
import PaymentTermsTab from "./Tabs/PaymentTermsTab";
import NoteTab from "./Tabs/NoteTab";
import TruckTypeTab from "./Tabs/TruckTypeTab";
import RemarksTab from "./Tabs/RemarksTab";

const TAB_LIST = [
  { id: "pricing", label: "PRICING", component: PricingTab },
  {
    id: "additional-charges",
    label: "ADDITIONAL CHARGES",
    component: AdditionalChargesTab,
  },
  { id: "includes", label: "INCLUDES", component: IncludesTab },
  { id: "excludes", label: "EXCLUDES", component: ExcludesTab },
  { id: "insurance", label: "INSURANCE", component: InsuranceTab },
  { id: "payment-terms", label: "PAYMENT TERMS", component: PaymentTermsTab },
  { id: "note", label: "NOTE", component: NoteTab },
  { id: "truck-type", label: "TRUCK TYPE", component: TruckTypeTab },
  { id: "remarks", label: "REMARKS", component: RemarksTab },
  { id: "locations", label: "LOCATIONS", component: null },
  { id: "services", label: "SERVICES", component: null },
];

const QATAR_CITIES = [
  "Doha",
  "Al Rayyan",
  "Al Wakrah",
  "Al Khor",
  "Umm Salal",
  "Al Daayen",
  "Al Shamal",
  "Mesaieed",
  "Lusail",
  "Pearl-Qatar",
];

const LocalMove = () => {
  const methods = useForm();
  const [activeTab, setActiveTab] = useState("pricing");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAutoSelectedCity, setHasAutoSelectedCity] = useState(false);
  const [selectedCity, setSelectedCity] = useState(""); 
  const [selectedMoveType, setSelectedMoveType] = useState("");
  const [selectedTariff, setSelectedTariff] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [dropdownData, setDropdownData] = useState({
    moveTypes: [],
    tariffTypes: [],
    currencies: [],
    volumeUnits: [],
    weightUnits: [],
  });

  const API_BASE_URL = apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setLoading(true);

        const endpoints = [
          `${API_BASE_URL}/move-types/`,
          `${API_BASE_URL}/tariff-types/`,
          `${API_BASE_URL}/currencies/`,
          `${API_BASE_URL}/volume-units/`,
          `${API_BASE_URL}/weight-units/`,
        ];

        const responses = await Promise.all(
          endpoints.map((url) => apiClient.get(url))
        );

        const [
          moveTypesRes,
          tariffTypesRes,
          currenciesRes,
          volumeUnitsRes,
          weightUnitsRes,
        ] = responses;

        setDropdownData({
          moveTypes: moveTypesRes.data.results || moveTypesRes.data,
          tariffTypes: tariffTypesRes.data.results || tariffTypesRes.data,
          currencies: currenciesRes.data.results || currenciesRes.data,
          volumeUnits: volumeUnitsRes.data.results || volumeUnitsRes.data,
          weightUnits: weightUnitsRes.data.results || weightUnitsRes.data,
        });

        if (!hasAutoSelectedCity) {
          setSelectedCity("Doha");
          setHasAutoSelectedCity(true);
        }
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        setError("Failed to load required data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchDropdowns();
  }, [hasAutoSelectedCity]);

  const sharedProps = {
    selectedHub: selectedCity, 
    setSelectedHub: setSelectedCity,
    selectedMoveType,
    setSelectedMoveType,
    selectedTariff,
    setSelectedTariff,
    selectedUnit,
    setSelectedUnit,
    selectedCurrency,
    setSelectedCurrency,
    dropdownData: {
      ...dropdownData,
      hubs: QATAR_CITIES.map((city) => ({ id: city, name: city })), 
    },
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600 text-2xl">
        {error}
      </div>
    );

  return (
    <FormProvider {...methods}>
      <div className="bg-gray-50 min-h-screen">
        <div className="w-full">
          <Tab
            tabs={TAB_LIST}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          {TAB_LIST.map((tab) => (
            <TabPanel key={tab.id} activeTab={activeTab} tabId={tab.id}>
              {tab.component ? (
                <tab.component {...sharedProps} />
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
                  <p className="text-3xl font-medium text-gray-700 mb-4">
                    {tab.label}
                  </p>
                  <p className="text-lg text-gray-500">Coming Soon...</p>
                </div>
              )}
            </TabPanel>
          ))}
        </div>
      </div>
    </FormProvider>
  );
};

export default LocalMove;
