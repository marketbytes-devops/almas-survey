const Tab = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
      <div className="flex flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-semibold transition-all duration-300 border-b-4 whitespace-nowrap
              ${activeTab === tab.id
                ? "text-white bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] border-[#4c7085]"
                : "text-gray-700 bg-gray-100 hover:bg-gray-200 border-transparent"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tab;