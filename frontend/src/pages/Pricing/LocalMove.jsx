import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";
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
import ServicesTab from "./Tabs/ServicesTab";

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
  { id: "services", label: "SERVICES", component: ServicesTab },
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

  const API_BASE_URL = apiClient.defaults.baseURL || "http://127.0.0.1:8000/api";

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

  console.log("Rendering LocalMove Component");

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
      <div className="flex justify-center items-center min-h-[600px]">
        <Loading />
      </div>
    );
  if (error)
    return (
      <div className="min-h-[600px] flex items-center justify-center text-red-500 font-medium">
        {error}
      </div>
    );

  return (
    <div className="animate-in fade-in duration-500 space-y-8 pb-10">
      <PageHeader
        title="Move Pricing Configuration"
        subtitle="Manage rates, services, and terms for local moves"
      />

      <FormProvider {...methods}>
        <div className="space-y-6">
          <Tab
            tabs={TAB_LIST}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <div className="min-h-[500px]">
            {TAB_LIST.map((tab) => (
              <TabPanel key={tab.id} activeTab={activeTab} tabId={tab.id}>
                {tab.component ? (
                  <tab.component {...sharedProps} />
                ) : (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-20 text-center">
                    <h3 className="text-xl font-medium text-gray-800 mb-2">
                      {tab.label} Module
                    </h3>
                    <p className="text-gray-600 max-w-sm mx-auto">This configuration module is currently under development. Please check back later.</p>
                  </div>
                )}
              </TabPanel>
            ))}
          </div>
        </div>
      </FormProvider>
    </div>
  );
};

export default LocalMove;
