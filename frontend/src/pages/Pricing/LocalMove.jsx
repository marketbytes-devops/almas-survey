import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import Input from "../../components/Input/index";
import { FaCopy, FaSave } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const LocalMove = () => {
  const methods = useForm();
  const { register, setValue, watch } = methods;

  const [dropdownData, setDropdownData] = useState({
    hubs: [],
    moveTypes: [],
    tariffTypes: [],
    currencies: [],
    volumeUnits: [],
    weightUnits: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = apiClient.defaults.baseURL || "http://127.0.0.1:8000/api";

  // Editable table data with rate type
  const [tableData, setTableData] = useState([
    { id: 1, range: "Range 1", min: "00.01", max: "10.00", flatRate: "625.00", adjustmentRate: "0.00", rateType: "variable" },
    { id: 2, range: "Range 2", min: "10.01", max: "20.00", flatRate: "625.00", adjustmentRate: "0.00", rateType: "flat" },
    { id: 3, range: "Range 3", min: "20.01", max: "30.00", flatRate: "675.00", adjustmentRate: "0.00", rateType: "flat" },
    { id: 4, range: "Range 4", min: "30.01", max: "40.00", flatRate: "775.00", adjustmentRate: "0.00", rateType: "flat" },
    { id: 5, range: "Range 5", min: "40.01", max: "50.00", flatRate: "825.00", adjustmentRate: "0.00", rateType: "flat" },
    { id: 6, range: "Range 6", min: "50.01", max: "60.00", flatRate: "875.00", adjustmentRate: "0.00", rateType: "flat" },
    { id: 7, range: "Range 7", min: "60.01", max: "70.00", flatRate: "925.00", adjustmentRate: "0.00", rateType: "flat" },
  ]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoints = [
        `${API_BASE_URL}/hub/`,
        `${API_BASE_URL}/move-types/`,
        `${API_BASE_URL}/tariff-types/`,
        `${API_BASE_URL}/currencies/`,
        `${API_BASE_URL}/volume-units/`,
        `${API_BASE_URL}/weight-units/`,
      ];

      const requests = endpoints.map((url) => apiClient.get(url));
      const responses = await Promise.all(requests);

      const [
        hubsRes,
        moveTypesRes,
        tariffTypesRes,
        currenciesRes,
        volumeUnitsRes,
        weightUnitsRes,
      ] = responses;

      setDropdownData({
        hubs: Array.isArray(hubsRes.data) ? hubsRes.data : hubsRes.data.results || [],
        moveTypes: Array.isArray(moveTypesRes.data) ? moveTypesRes.data : moveTypesRes.data.results || [],
        tariffTypes: Array.isArray(tariffTypesRes.data) ? tariffTypesRes.data : tariffTypesRes.data.results || [],
        currencies: Array.isArray(currenciesRes.data) ? currenciesRes.data : currenciesRes.data.results || [],
        volumeUnits: Array.isArray(volumeUnitsRes.data) ? volumeUnitsRes.data : volumeUnitsRes.data.results || [],
        weightUnits: Array.isArray(weightUnitsRes.data) ? weightUnitsRes.data : weightUnitsRes.data.results || [],
      });
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      setError(err.response?.data?.detail || err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getDropdownOptions = (data, nameField = "name", valueField = "id") => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      value: item[valueField] ?? item.id,
      label: item[nameField] || item.title || item.code || item.symbol || String(item.id),
    }));
  };

  const tableUnitOptions = [
    ...getDropdownOptions(dropdownData.volumeUnits),
    ...getDropdownOptions(dropdownData.weightUnits),
    { value: "items", label: "Items" },
  ];

  const handleInputChange = (id, field, value) => {
    setTableData(prev => prev.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleRateTypeChange = (id, type) => {
    setTableData(prev => prev.map(row =>
      row.id === id ? { ...row, rateType: type } : row
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchDropdownData} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-8">Local Move Rates</h1>

          {/* Top Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <Input name="hub" type="select" options={getDropdownOptions(dropdownData.hubs)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Move Type</label>
                <Input name="type" type="select" options={getDropdownOptions(dropdownData.moveTypes)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tariff</label>
                <Input name="tariff" type="select" options={getDropdownOptions(dropdownData.tariffTypes)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Unit is</label>
                <Input name="unit" type="select" options={tableUnitOptions} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Currency</label>
                <Input name="currency" type="select" options={getDropdownOptions(dropdownData.currencies, "name", "id")} />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                <FaCopy /> COPY
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:from-[#3a586d] hover:to-[#54738a] transition shadow-md">
                <FaSave /> SAVE
              </button>
            </div>
          </div>

          {/* Editable Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Range #</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Min. Value</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Max</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Flat Rate</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700" colSpan="2">Rate Type</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Adjustment Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tableData.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">{row.range}</td>
                    
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={row.min}
                        onChange={(e) => handleInputChange(row.id, "min", e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      />
                    </td>
                    
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={row.max}
                        onChange={(e) => handleInputChange(row.id, "max", e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                      />
                    </td>
                    
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={row.flatRate}
                        onChange={(e) => handleInputChange(row.id, "flatRate", e.target.value)}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition font-medium"
                      />
                    </td>
                    
                    <td className="px-6 py-4" colSpan="2">
                      <div className="flex items-center justify-center gap-6">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`rateType_${row.id}`}
                            checked={row.rateType === "variable"}
                            onChange={() => handleRateTypeChange(row.id, "variable")}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">Variable</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`rateType_${row.id}`}
                            checked={row.rateType === "flat"}
                            onChange={() => handleRateTypeChange(row.id, "flat")}
                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">Flat</span>
                        </label>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={row.adjustmentRate}
                        onChange={(e) => handleInputChange(row.id, "adjustmentRate", e.target.value)}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
                        placeholder="0.00"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default LocalMove;