const TabPanel = ({ children, activeTab, tabId }) => {
  if (activeTab !== tabId) return null;

  return (
    <div
      id={`panel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      className="animate-fadeIn"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
        {children}
      </div>
    </div>
  );
};

export default TabPanel;