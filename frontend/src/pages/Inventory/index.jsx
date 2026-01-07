/* src/pages/Inventory/index.jsx */
import React, { useState } from "react";
import StockInHand from "./tabs/StockInHand";
import Purchase from "./tabs/Purchase";
import UsageTracking from "./tabs/UsageTracking";
import PlasticBoxes from "./tabs/PlasticBoxes";

const Inventory = () => {
    const [activeTab, setActiveTab] = useState("stock");

    const tabs = [
        { id: "stock", label: "Stock in Hand", component: <StockInHand /> },
        { id: "purchase", label: "Purchase", component: <Purchase /> },
        { id: "usage", label: "Used (or Sale)", component: <UsageTracking /> },
        { id: "boxes", label: "Plastic Boxes", component: <PlasticBoxes /> },
    ];

    return (
        <div className="container mx-auto p-4">
            <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-6 rounded-t-lg shadow-lg">
                <h1 className="text-xl font-bold">Inventory Management</h1>
            </div>

            <div className="bg-white shadow-md rounded-b-lg p-6">
                <div className="flex border-b border-gray-200 mb-6 space-x-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 px-4 text-sm font-medium transition-colors duration-200 ${activeTab === tab.id
                                    ? "border-b-2 border-[#4c7085] text-[#4c7085]"
                                    : "text-gray-500 hover:text-[#4c7085]"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="mt-4">
                    {tabs.find((tab) => tab.id === activeTab)?.component}
                </div>
            </div>
        </div>
    );
};

export default Inventory;
