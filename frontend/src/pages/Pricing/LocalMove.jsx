import React, { useState, useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import Input from "../../components/Input/index";
import { FaCopy, FaSave, FaPlus, FaTrash } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const LocalMove = () => {
  const methods = useForm();
  const { register, watch } = methods;

  const [dropdownData, setDropdownData] = useState({
    hubs: [],
    moveTypes: [],
    tariffTypes: [],
    currencies: [],
    volumeUnits: [],
    weightUnits: [],
  });

  const [tableRows, setTableRows] = useState([]);
  const nextLocalId = useRef(1); 

  const [selectedHub, setSelectedHub] = useState("");
  const [selectedMoveType, setSelectedMoveType] = useState("");
  const [selectedTariff, setSelectedTariff] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  const API_BASE_URL = apiClient.defaults.baseURL || "http://127.0.0.1:8000/api";

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setLoading(true);
        const endpoints = [
          `${API_BASE_URL}/hub/`,
          `${API_BASE_URL}/move-types/`,
          `${API_BASE_URL}/tariff-types/`,
          `${API_BASE_URL}/currencies/`,
          `${API_BASE_URL}/volume-units/`,
          `${API_BASE_URL}/weight-units/`,
        ];
        const responses = await Promise.all(
          endpoints.map((url) => apiClient.get(url))
        );
        const [
          hubsRes,
          moveTypesRes,
          tariffTypesRes,
          currenciesRes,
          volumeUnitsRes,
          weightUnitsRes,
        ] = responses;

        setDropdownData({
          hubs: hubsRes.data?.results || hubsRes.data || [],
          moveTypes: moveTypesRes.data?.results || moveTypesRes.data || [],
          tariffTypes: tariffTypesRes.data?.results || tariffTypesRes.data || [],
          currencies: currenciesRes.data?.results || currenciesRes.data || [],
          volumeUnits: volumeUnitsRes.data?.results || volumeUnitsRes.data || [],
          weightUnits: weightUnitsRes.data?.results || weightUnitsRes.data || [],
        });
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDropdowns();
  }, [API_BASE_URL]);

  useEffect(() => {
    const fetchLive = async () => {
      if (!selectedHub && !selectedMoveType) {
        setTableRows([]); 
        return;
      }
      try {
        const params = new URLSearchParams();
        if (selectedHub) params.append("hub", selectedHub);
        if (selectedMoveType) params.append("move_type", selectedMoveType);

        const res = await apiClient.get(`${API_BASE_URL}/price/active/?${params}`);
        const apiRows = (res.data || []).map((r, i) => ({
          localId: i + 1000,
          id: r.id,
          min_volume: String(r.min_volume).padStart(5, "0"),
          max_volume: String(r.max_volume).padStart(5, "0"),
          flat_rate: String(r.rate),
          variable_rate: "0.00",
          rate_type: r.rate_type,
        }));
        setTableRows(apiRows.length ? apiRows : []);
        setIsUpdateMode(apiRows.length > 0);
      } catch {
        setTableRows([]);
        setIsUpdateMode(false);
      }
    };
    fetchLive();
  }, [selectedHub, selectedMoveType, API_BASE_URL]);

  const getOptions = (data, label = "name", value = "id") =>
    Array.isArray(data)
      ? data.map((item) => ({
          value: item[value] ?? item.id,
          label:
            item[label] ||
            item.title ||
            item.code ||
            item.symbol ||
            String(item.id),
        }))
      : [];

  const unitOptions = [
    ...getOptions(dropdownData.volumeUnits),
    ...getOptions(dropdownData.weightUnits),
    { value: "items", label: "Items" },
  ];

  const addRow = () => {
    const isFirstRow = tableRows.length === 0;
    const newRow = {
      localId: nextLocalId.current++,
      min_volume: "00.01",
      max_volume: "00.00",
      flat_rate: "0.00",
      variable_rate: "0.00",
      rate_type: isFirstRow ? "flat" : "variable",
    };
    setTableRows((prev) => [...prev, newRow]);
  };

  const deleteRow = async (localId) => {
    const row = tableRows.find((r) => r.localId === localId);
    if (row?.id) {
      try {
        await apiClient.delete(
          `${API_BASE_URL}/price/bulk-delete/?ids=${row.id}`
        );
      } catch (e) {
        console.warn("Failed to delete on server", e);
      }
    }
    setTableRows((prev) => prev.filter((r) => r.localId !== localId));
  };

  const updateField = (localId, field, value) => {
    setTableRows((prev) =>
      prev.map((r) =>
        r.localId === localId ? { ...r, [field]: value } : r
      )
    );
  };

  const setRateType = (localId, type) => {
    setTableRows((prev) =>
      prev.map((r) =>
        r.localId === localId ? { ...r, rate_type: type } : r
      )
    );
  };

  const handleSave = async () => {
    const payload = tableRows.map((row) => ({
      ...(row.id && { id: row.id }), 
      min_volume: parseFloat(row.min_volume) || 0,
      max_volume: parseFloat(row.max_volume) || 0,
      rate:
        row.rate_type === "flat"
          ? parseFloat(row.flat_rate) || 0
          : parseFloat(row.variable_rate) || 0,
      rate_type: row.rate_type,
      hub: selectedHub || null,
      move_type: selectedMoveType || null,
      currency: selectedCurrency || "QAR",
    }));

    try {
      const res = await apiClient.post(
        `${API_BASE_URL}/price/bulk-update/`,
        payload
      );
      const saved = res.data.data.map((sv, i) => ({
        ...tableRows[i],
        id: sv.id,
      }));
      setTableRows(saved);
      setIsUpdateMode(true);
      alert("Pricing table saved successfully!");
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.detail ||
          "Failed to save pricing table. Check console."
      );
    }
  };

  const handleCopy = () => {
    const json = JSON.stringify(tableRows, null, 2);
    navigator.clipboard.writeText(json);
    alert("Table copied to clipboard!");
  };

  if (loading) return <Loading />;
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <FormProvider {...methods}>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-8">
            Local Move Rates
          </h1>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <Input
                  name="hub"
                  type="select"
                  options={getOptions(dropdownData.hubs)}
                  onChange={(e) => setSelectedHub(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Move Type
                </label>
                <Input
                  name="move_type"
                  type="select"
                  options={getOptions(dropdownData.moveTypes)}
                  onChange={(e) => setSelectedMoveType(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tariff
                </label>
                <Input
                  name="tariff"
                  type="select"
                  options={getOptions(dropdownData.tariffTypes)}
                  onChange={(e) => setSelectedTariff(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Unit is
                </label>
                <Input
                  name="unit"
                  type="select"
                  options={unitOptions}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Currency
                </label>
                <Input
                  name="currency"
                  type="select"
                  options={getOptions(dropdownData.currencies)}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                <FaCopy /> COPY
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:from-[#3a586d] hover:to-[#54738a] transition shadow-md"
              >
                <FaSave /> {isUpdateMode ? "UPDATE" : "SAVE"}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Range #
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Min. Value
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Max
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Flat Rate
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Variable Rate
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">
                    Rate Type
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tableRows.map((row, idx) => {
                  const isFlat = row.rate_type === "flat";
                  const isVariable = row.rate_type === "variable";

                  return (
                    <tr key={row.localId} className="hover:bg-blue-50">
                      <td className="px-6 py-4 font-medium text-gray-800">
                        Range {idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={row.min_volume}
                          onChange={(e) =>
                            updateField(row.localId, "min_volume", e.target.value)
                          }
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={row.max_volume}
                          onChange={(e) =>
                            updateField(row.localId, "max_volume", e.target.value)
                          }
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={row.flat_rate}
                          disabled={!isFlat}
                          onChange={(e) =>
                            updateField(row.localId, "flat_rate", e.target.value)
                          }
                          className={`w-28 px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none font-medium ${
                            !isFlat ? "bg-gray-200 cursor-not-allowed" : ""
                          }`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={row.variable_rate}
                          disabled={!isVariable}
                          onChange={(e) =>
                            updateField(
                              row.localId,
                              "variable_rate",
                              e.target.value
                            )
                          }
                          className={`w-28 px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-medium ${
                            !isVariable ? "bg-gray-200 cursor-not-allowed" : ""
                          }`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-6">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name={`rate_${row.localId}`}
                              checked={isVariable}
                              onChange={() => setRateType(row.localId, "variable")}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              Variable
                            </span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name={`rate_${row.localId}`}
                              checked={isFlat}
                              onChange={() => setRateType(row.localId, "flat")}
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              Flat
                            </span>
                          </label>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => deleteRow(row.localId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="p-4">
              <button
                type="button"
                onClick={addRow}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
              >
                <FaPlus /> Add Row
              </button>
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default LocalMove;