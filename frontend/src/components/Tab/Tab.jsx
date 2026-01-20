const Tab = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 sticky top-2 z-30 mx-[-1rem] sm:mx-0">
      <nav
        className="flex md:grid md:grid-cols-5 overflow-x-auto scrollbar-hide p-2 gap-2"
        role="tablist"
        aria-label="Local Move Configuration Tabs"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex-none px-6 py-2 text-xs sm:text-sm font-medium rounded-xl
                transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? "text-white bg-[#4c7085] shadow-md ring-1 ring-[#4c7085] ring-offset-1"
                  : "text-gray-600 bg-gray-50 hover:bg-gray-100 border border-transparent"
                }
              `}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Tab;