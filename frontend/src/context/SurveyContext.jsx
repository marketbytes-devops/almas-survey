import { createContext, useContext, useState } from "react";

const SurveyContext = createContext();

export const SurveyProvider = ({ children }) => {
  const [goodsType, setGoodsType] = useState(null);
  const [serviceType, setServiceType] = useState("");
  const [customerType, setCustomerType] = useState("");

  const resetGoodsType = () => setGoodsType(null);

  return (
    <SurveyContext.Provider
      value={{
        goodsType,
        setGoodsType,
        resetGoodsType,
        serviceType,
        setServiceType,
        customerType,
        setCustomerType,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurveyContext = () => useContext(SurveyContext);
