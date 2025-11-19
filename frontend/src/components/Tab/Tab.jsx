const Tab = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
      <nav
        className="grid grid-cols-2 md:grid-cols-5 gap-4 overflow-x-auto scrollbar-hide space-x-1 p-2"
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
                relative flex-1 min-w-max px-8 py-2 text-sm font-medium rounded-xl
                transition-all duration-300 whitespace-nowrap
                ${isActive
                  ? "text-white bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] shadow-md"
                  : "text-[#4c7085] bg-gray-100 hover:bg-gray-200 hover:text-[#4c7085]"
                }
              `}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
            >
              {tab.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-t-lg"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Tab;