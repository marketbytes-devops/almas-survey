/* src/pages/Pricing/LocalMove.jsx */
import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";
import Tab from "../../components/Tab/Tab";
import TabPanel from "../../components/Tab/TabPanel";
import PricingTab from "./Tabs/PricingTab";
import AdditionalChargesTab from "./Tabs/AdditionalChargesTab";
import IncludesTab from "./Tabs/Includes";
import ExcludesTab from "./Tabs/Exclude";
import InsuranceTab from "./Tabs/InsuranceTab";
import PaymentTermsTab from "./Tabs/PaymentTermsTab";
import NoteTab from "./Tabs/NoteTab";
import TruckTypeTab from "./Tabs/TruckTypeTab";
import ServicesTab from "./Tabs/ServicesTab";

const TAB_LIST = [
  { id: "pricing", label: "PRICING", component: PricingTab },
  { id: "additional-charges", label: "ADDITIONAL CHARGES", component: AdditionalChargesTab },
  { id: "includes", label: "INCLUDES", component: IncludesTab },
  { id: "excludes", label: "EXCLUDES", component: ExcludesTab },
  { id: "insurance", label: "INSURANCE", component: InsuranceTab },
  { id: "payment-terms", label: "PAYMENT TERMS", component: PaymentTermsTab },
  { id: "note", label: "NOTE", component: NoteTab },
  { id: "truck-type", label: "TRUCK TYPE", component: TruckTypeTab },
  { id: "services", label: "SERVICES", component: ServicesTab },
];

const QATAR_CITIES = [
  "Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Umm Salal",
  "Al Daayen", "Al Shamal", "Mesaieed", "Lusail", "Pearl-Qatar",
];

const LocalMove = () => {
  const methods = useForm();
  const navigate = useNavigate();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
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
    if (!permissionsLoading && !hasPermission("local_move", "view")) {
      navigate("/dashboard");
      return;
    }

    const fetchDropdowns = async () => {
      try {
        setLoading(true);
        const endpoints = [
          `/move-types/`,
          `/tariff-types/`,
          `/currencies/`,
          `/volume-units/`,
          `/weight-units/`,
        ];

        const responses = await Promise.all(
          endpoints.map((url) => apiClient.get(url))
        );

        const [moveTypesRes, tariffTypesRes, currenciesRes, volumeUnitsRes, weightUnitsRes] = responses;

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

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-slate-50"><Loading /></div>;

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-500 font-medium p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-md">
        <FiInfo className="mx-auto text-4xl mb-4" />
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-[#4c7085] text-white rounded-xl">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto space-y-6 min-h-screen bg-slate-50">
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
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-20 text-center">
                    <h3 className="text-xl font-medium text-slate-800 mb-2">
                      {tab.label} Module
                    </h3>
                    <p className="text-slate-500 max-w-sm mx-auto">This configuration module is currently under development.</p>
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
