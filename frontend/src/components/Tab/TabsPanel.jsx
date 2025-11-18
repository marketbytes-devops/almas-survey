const TabPanel = ({ children, activeTab, tabId }) => {
  return activeTab === tabId ? <div className="space-y-8">{children}</div> : null;
};

export default TabPanel;