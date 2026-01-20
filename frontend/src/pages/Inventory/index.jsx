import { useState } from "react";
import StockInHand from "./tabs/StockInHand";
import Purchase from "./tabs/Purchase";
import UsageTracking from "./tabs/UsageTracking";
import PlasticBoxes from "./tabs/PlasticBoxes";
import PageHeader from "../../components/PageHeader";

const Inventory = () => {
    const [activeTab, setActiveTab] = useState("stock");

    const tabs = [
        { id: "stock", label: "Stock in Hand", component: <StockInHand /> },
        { id: "purchase", label: "Purchase", component: <Purchase /> },
        { id: "usage", label: "Used (or Sale)", component: <UsageTracking /> },
        { id: "boxes", label: "Plastic Boxes", component: <PlasticBoxes /> },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <PageHeader
                title="Inventory Management"
                subtitle="Track stock, purchases, and material usage"
            />

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px]">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-100 px-6 pt-2 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-6 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? "border-[#4c7085] text-[#4c7085]"
                                : "border-transparent text-gray-600 hover:text-[#4c7085] hover:border-[#4c7085]/30"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {tabs.find((tab) => tab.id === activeTab)?.component}
                </div>
            </div>
        </div>
    );
};

export default Inventory;
