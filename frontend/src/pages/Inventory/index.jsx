import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../components/PermissionsContext/PermissionsContext";
import StockInHand from "./tabs/StockInHand";
import Purchase from "./tabs/Purchase";
import UsageTracking from "./tabs/UsageTracking";
import PlasticBoxes from "./tabs/PlasticBoxes";
import PageHeader from "../../components/PageHeader";

const Inventory = () => {
    const navigate = useNavigate();
    const { hasPermission, isLoadingPermissions } = usePermissions();
    const [activeTab, setActiveTab] = useState("stock");

    useEffect(() => {
        if (!isLoadingPermissions && !hasPermission("inventory", "view")) {
            navigate("/dashboard");
        }
    }, [hasPermission, isLoadingPermissions, navigate]);

    const tabs = [
        { id: "stock", label: "Stock in Hand", component: <StockInHand /> },
        { id: "purchase", label: "Purchase", component: <Purchase /> },
        { id: "usage", label: "Used (or Sale)", component: <UsageTracking /> },
        { id: "boxes", label: "Plastic Boxes", component: <PlasticBoxes /> },
    ];

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="px-4 md:px-0">
                <PageHeader
                    title="Inventory Management"
                    subtitle="Track stock, purchases, and material usage"
                />
            </div>

            <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px] md:min-h-[600px]">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-100 px-4 md:px-6 pt-1 md:pt-2 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 md:py-4 px-4 md:px-6 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? "border-[#4c7085] text-[#4c7085]"
                                : "border-transparent text-gray-600 hover:text-[#4c7085] hover:border-[#4c7085]/30"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-4 md:p-6">
                    {tabs.find((tab) => tab.id === activeTab)?.component}
                </div>
            </div>
        </div>
    );
};

export default Inventory;
