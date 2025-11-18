import React, { useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import Tab from "../../components/Tab/Tab";
import TabPanel from "../../components/Tab/TabsPanel";
import PricingTab from "./Tabs/Pricing";
import AdditionalChargesTab from "./Tabs/AdditionalCharges";
import IncludesTab from "./Tabs/Includes";
import Exclude from "./Tabs/Exclude";
import ExcludesTab from "./Tabs/Exclude";

const TAB_LIST = [
  { id: "pricing", label: "PRICING", component: PricingTab },
  { id: "additional-charges", label: "ADDITIONAL CHARGES", component: AdditionalChargesTab },
  { id: "includes", label: "INCLUDES", component: IncludesTab },
  { id: "excludes", label: "EXCLUDES", component: ExcludesTab },
  { id: "insurance", label: "INSURANCE", component: null },
  { id: "payment-terms", label: "PAYMENT TERMS", component: null },
  { id: "note", label: "NOTE", component: null },
  { id: "truck-type", label: "TRUCK TYPE", component: null },
  { id: "remarks", label: "REMARKS", component: null },
  { id: "locations", label: "LOCATIONS", component: null },
  { id: "services", label: "SERVICES", component: null },
];

const LocalMove = () => {
  const methods = useForm();

  const [activeTab, setActiveTab] = useState("pricing");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAutoSelectedHub, setHasAutoSelectedHub] = useState(false);

  const [selectedHub, setSelectedHub] = useState("");
  const [selectedMoveType, setSelectedMoveType] = useState("");
  const [selectedTariff, setSelectedTariff] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");

  const [dropdownData, setDropdownData] = useState({
    hubs: [],
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
          `${API_BASE_URL}/hub/`,
          `${API_BASE_URL}/move-types/`,
          `${API_BASE_URL}/tariff-types/`,
          `${API_BASE_URL}/currencies/`,
          `${API_BASE_URL}/volume-units/`,
          `${API_BASE_URL}/weight-units/`,
        ];
        const responses = await Promise.all(endpoints.map(url => apiClient.get(url)));
        const [hubsRes, moveTypesRes, tariffTypesRes, currenciesRes, volumeUnitsRes, weightUnitsRes] = responses;

        const hubs = Array.isArray(hubsRes.data) ? hubsRes.data : hubsRes.data.results || [];
        const activeHubs = hubs.filter(h => h.is_active !== false);

        setDropdownData({
          hubs,
          moveTypes: moveTypesRes.data.results || moveTypesRes.data,
          tariffTypes: tariffTypesRes.data.results || tariffTypesRes.data,
          currencies: currenciesRes.data.results || currenciesRes.data,
          volumeUnits: volumeUnitsRes.data.results || volumeUnitsRes.data,
          weightUnits: weightUnitsRes.data.results || weightUnitsRes.data,
        });

        if (activeHubs.length > 0 && !hasAutoSelectedHub) {
          setSelectedHub(String(activeHubs[0].id));
          setHasAutoSelectedHub(true);
        }
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchDropdowns();
  }, []);

  const sharedProps = {
    selectedHub,
    setSelectedHub,
    selectedMoveType,
    setSelectedMoveType,
    selectedTariff,
    setSelectedTariff,
    selectedUnit,
    setSelectedUnit,
    selectedCurrency,
    setSelectedCurrency,
    dropdownData,
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600 text-2xl">{error}</div>;

  return (
    <FormProvider {...methods}>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Local Move Configuration</h1>
          
          <Tab tabs={TAB_LIST} activeTab={activeTab} setActiveTab={setActiveTab} />

          {TAB_LIST.map(tab => (
            <TabPanel key={tab.id} activeTab={activeTab} tabId={tab.id}>
              {tab.component ? (
                <tab.component {...sharedProps} />
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
                  <p className="text-3xl font-bold text-gray-700 mb-4">{tab.label}</p>
                  <p className="text-lg text-gray-500">This section is under development</p>
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