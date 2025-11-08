import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import Input from "../../components/Input/index";
import { FaCopy, FaSave } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const LocalMove = () => {
  const methods = useForm();
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

      const hubs = hubsRes.data;
      const moveTypes = moveTypesRes.data;
      const tariffTypes = tariffTypesRes.data;
      const currencies = currenciesRes.data;
      const volumeUnits = volumeUnitsRes.data;
      const weightUnits = weightUnitsRes.data;

      setDropdownData({
        hubs: Array.isArray(hubs) ? hubs : hubs.results || [],
        moveTypes: Array.isArray(moveTypes) ? moveTypes : moveTypes.results || [],
        tariffTypes: Array.isArray(tariffTypes) ? tariffTypes : tariffTypes.results || [],
        currencies: Array.isArray(currencies) ? currencies : currencies.results || [],
        volumeUnits: Array.isArray(volumeUnits) ? volumeUnits : volumeUnits.results || [],
        weightUnits: Array.isArray(weightUnits) ? weightUnits : weightUnits.results || [],
      });
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      const message =
        err.response
          ? `Server Error: ${err.response.status} - ${err.response.data?.detail || err.message}`
          : err.request
            ? "No response from server. Check your network or API URL."
            : err.message;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getDropdownOptions = (data, nameField = "name", valueField = "id") => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      value: item[valueField] ?? item.id,
      label:
        item[nameField] ||
        item.title ||
        item.code ||
        item.symbol ||
        String(item[valueField] ?? item.id),
    }));
  };

  const tableUnitOptions = [
    ...getDropdownOptions(dropdownData.volumeUnits),
    ...getDropdownOptions(dropdownData.weightUnits),
    { value: "items", label: "Items" },
  ];

  const tableData = [
    { range: "Range 1", min: "00.01", max: "10.00", rate: "625.00", adjustment: "0.00" },
    { range: "Range 2", min: "10.01", max: "20.00", rate: "625.00", adjustment: "0.00" },
    { range: "Range 3", min: "20.01", max: "30.00", rate: "675.00", adjustment: "0.00" },
    { range: "Range 4", min: "30.01", max: "40.00", rate: "775.00", adjustment: "0.00" },
    { range: "Range 5", min: "40.01", max: "50.00", rate: "825.00", adjustment: "0.00" },
    { range: "Range 6", min: "50.01", max: "60.00", rate: "875.00", adjustment: "0.00" },
    { range: "Range 7", min: "60.01", max: "70.01", rate: "925.00", adjustment: "0.00" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl mb-4">Error Loading Data</div>
          <p className="text-gray-600 mb-4 break-words">{error}</p>
          <button
            onClick={fetchDropdownData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="bg-gray-50">
        <div className="max-w-full mx-auto">
          <h1 className="text-2xl font-medium text-gray-800 mb-6">
            Local Move Rates
          </h1>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select A Hub
                </label>
                <Input
                  name="hub"
                  type="select"
                  options={getDropdownOptions(dropdownData.hubs)}
                  rules={{ required: "Hub is required" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Move Type
                </label>
                <Input
                  name="type"
                  type="select"
                  options={getDropdownOptions(dropdownData.moveTypes)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tariff
                </label>
                <Input
                  name="tariff"
                  type="select"
                  options={getDropdownOptions(dropdownData.tariffTypes)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Unit is
                </label>
                <Input
                  name="unit"
                  type="select"
                  options={tableUnitOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Currency
                </label>
                <Input
                  name="currency"
                  type="select"
                  options={getDropdownOptions(dropdownData.currencies, "name", "id")}
                />
              </div>
            </div>

            <div className="flex items-end gap-3 mt-4">
              <button className="flex items-center gap-2 text-sm bg-gray-400 text-white py-2 px-4 rounded">
                <FaCopy />
                COPY
              </button>
              <button className="flex items-center gap-2 text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-4 rounded">
                <FaSave />
                SAVE
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Range #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Min. Value</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Max</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Flat Rate</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700" colSpan="2">
                    Rate Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Adjustment Rate</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{row.range}</td>
                    <td className="px-4 py-3">
                      <Input name={`range_${idx}_min`} type="text" value={row.min} readOnly />
                    </td>
                    <td className="px-4 py-3">
                      <Input name={`range_${idx}_max`} type="text" value={row.max} readOnly />
                    </td>
                    <td className="px-4 py-3">
                      <Input name={`rate_${idx}`} type="text" value={row.rate} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center">
                          <input type="radio" name={`rate_type_${idx}`} defaultChecked={idx === 0} />
                          <span className="ml-2 text-xs">Variable</span>
                        </label>
                        <label className="flex items-center">
                          <input type="radio" name={`rate_type_${idx}`} defaultChecked={idx !== 0} />
                          <span className="ml-2 text-xs">Flat</span>
                        </label>
                      </div>
                    </td>
                    <td className="px-1" />
                    <td className="px-4 py-3">
                      <Input name={`adj_${idx}`} type="text" value={row.adjustment} />
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