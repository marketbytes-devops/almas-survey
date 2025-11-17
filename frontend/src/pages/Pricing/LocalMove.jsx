import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
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

  const [selectedHub, setSelectedHub] = useState("");
  const [selectedMoveType, setSelectedMoveType] = useState("");
  const [selectedTariff, setSelectedTariff] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");

  const [tableData, setTableData] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [existingIds, setExistingIds] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hasAutoSelectedHub, setHasAutoSelectedHub] = useState(false);

  const API_BASE_URL = apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

  useEffect(() => {
    const fetchDropdownData = async () => {
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
        const responses = await Promise.all(endpoints.map((url) => apiClient.get(url)));
        const [
          hubsRes,
          moveTypesRes,
          tariffTypesRes,
          currenciesRes,
          volumeUnitsRes,
          weightUnitsRes,
        ] = responses;

        const hubs = Array.isArray(hubsRes.data) ? hubsRes.data : hubsRes.data.results || [];
        const activeHubs = hubs.filter(h => h.is_active !== false);

        setDropdownData({
          hubs,
          moveTypes: Array.isArray(moveTypesRes.data) ? moveTypesRes.data : moveTypesRes.data.results || [],
          tariffTypes: Array.isArray(tariffTypesRes.data) ? tariffTypesRes.data : tariffTypesRes.data.results || [],
          currencies: Array.isArray(currenciesRes.data) ? currenciesRes.data : currenciesRes.data.results || [],
          volumeUnits: Array.isArray(volumeUnitsRes.data) ? volumeUnitsRes.data : volumeUnitsRes.data.results || [],
          weightUnits: Array.isArray(weightUnitsRes.data) ? weightUnitsRes.data : weightUnitsRes.data.results || [],
        });

        if (activeHubs.length > 0 && !hasAutoSelectedHub) {
          const firstHub = activeHubs[0];
          setSelectedHub(String(firstHub.id));
          setHasAutoSelectedHub(true);
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.detail || err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchDropdownData();
  }, [API_BASE_URL, hasAutoSelectedHub]);

  useEffect(() => {
    const fetchPricing = async () => {
      if (!selectedHub && !selectedMoveType) {
        setTableData([]);
        setIsUpdateMode(false);
        setExistingIds(new Set());
        return;
      }

      try {
        const params = new URLSearchParams();
        if (selectedHub) params.append("hub", selectedHub);
        if (selectedMoveType) params.append("move_type", selectedMoveType);

        const res = await apiClient.get(`${API_BASE_URL}/price/active/?${params}`);
        const apiRows = (res.data || []).map((r, i) => {
          const isFirst = i === 0;
          return {
            id: r.id,
            range: `Range ${i + 1}`,
            min: String(r.min_volume).padStart(5, "0"),
            max: String(r.max_volume).padStart(5, "0"),
            flatRate: String(r.rate),
            variableRate: "0.00",
            rateType: isFirst ? "flat" : "variable",
          };
        });

        setTableData(apiRows);
        setNextId(apiRows.length ? Math.max(...apiRows.map((x) => x.id)) + 1 : 1);
        setExistingIds(new Set(apiRows.map((r) => r.id)));
        setIsUpdateMode(apiRows.length > 0);
      } catch (err) {
        console.error(err);
        setTableData([]);
        setIsUpdateMode(false);
        setExistingIds(new Set());
      }
    };

    fetchPricing();
  }, [selectedHub, selectedMoveType, API_BASE_URL]);

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
    setTableData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleRateTypeChange = (id, type) => {
    setTableData((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
            ...row,
            rateType: type,
            flatRate: type === "flat" ? row.flatRate : "",
            variableRate: type === "variable" ? row.variableRate : "",
          }
          : row
      )
    );
  };

  const addRow = () => {
    const newRow = {
      id: nextId,
      range: `Range ${tableData.length + 1}`,
      min: "00.00",
      max: "00.00",
      flatRate: "",
      variableRate: "0.00",
      rateType: "variable",
    };
    setTableData((prev) => [...prev, newRow]);
    setNextId((prev) => prev + 1);
  };

  const deleteRow = (id) => {
    setTableData((prev) => prev.filter((row) => row.id !== id));
    if (existingIds.has(id)) {
      setExistingIds((prev) => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
    }
  };

  const handleSave = async () => {
    if (!selectedHub || !selectedMoveType || !selectedTariff || !selectedUnit || !selectedCurrency) {
      alert("Please select all filters: Location, Move Type, Tariff, Unit, Currency");
      return;
    }

    if (tableData.length === 0) {
      alert("Add at least one row");
      return;
    }

    setSaving(true);

    const payload = tableData.map((row) => {
      const base = {
        min_volume: parseFloat(row.min) || 0,
        max_volume: parseFloat(row.max) || 0,
        rate: 0,
        rate_type: row.rateType,
        hub: parseInt(selectedHub),
        move_type: parseInt(selectedMoveType),
        currency: dropdownData.currencies.find(c => c.id == selectedCurrency)?.name || "QAR",
      };

      if (row.rateType === "flat") {
        base.rate = parseFloat(row.flatRate) || 0;
      } else {
        base.rate = parseFloat(row.variableRate) || 0;
      }

      if (existingIds.has(row.id)) {
        base.id = row.id;
      }

      return base;
    });

    try {
      if (isUpdateMode) {
        const updates = payload.filter((p) => p.id);
        const creates = payload.filter((p) => !p.id);

        if (updates.length > 0) {
          await apiClient.patch(`${API_BASE_URL}/price/bulk-update/`, updates);
        }
        if (creates.length > 0) {
          await apiClient.post(`${API_BASE_URL}/price/bulk-update/`, creates);
        }
      } else {
        await apiClient.post(`${API_BASE_URL}/price/bulk-update/`, payload);
      }

      alert("Pricing saved successfully!");
      setIsUpdateMode(true);
      const savedIds = payload.map((p) => p.id).filter(Boolean);
      setExistingIds(new Set([...existingIds, ...savedIds]));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to save pricing");
    } finally {
      setSaving(false);
    }
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
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="bg-gray-50 min-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-8">Local Move Rates</h1>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <Input
                  name="hub"
                  type="select"
                  options={getDropdownOptions(dropdownData.hubs)}
                  onChange={(e) => setSelectedHub(e.target.value)}
                  value={selectedHub}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Move Type *</label>
                <Input
                  name="move_type"
                  type="select"
                  options={getDropdownOptions(dropdownData.moveTypes)}
                  onChange={(e) => setSelectedMoveType(e.target.value)}
                  value={selectedMoveType}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tariff *</label>
                <Input
                  name="tariff"
                  type="select"
                  options={getDropdownOptions(dropdownData.tariffTypes)}
                  onChange={(e) => setSelectedTariff(e.target.value)}
                  value={selectedTariff}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Unit is *</label>
                <Input
                  name="unit"
                  type="select"
                  options={tableUnitOptions}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  value={selectedUnit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Currency *</label>
                <Input
                  name="currency"
                  type="select"
                  options={getDropdownOptions(dropdownData.currencies, "name", "id")}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  value={selectedCurrency}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                <FaCopy /> COPY
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:from-[#3a586d] hover:to-[#54738a] transition shadow-md disabled:opacity-50"
              >
                <FaSave /> {saving ? "Saving..." : isUpdateMode ? "UPDATE" : "SAVE"}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">Range #</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">Min. Value</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">Max</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">Flat Rate</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">Variable Rate</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700" colSpan="2">
                    Rate Type
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tableData.map((row, index) => {
                  const isFlat = row.rateType === "flat";
                  const isVariable = row.rateType === "variable";

                  return (
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
                          disabled={!isFlat}
                          onChange={(e) => handleInputChange(row.id, "flatRate", e.target.value)}
                          className={`w-28 px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition font-medium ${!isFlat ? "bg-gray-200 cursor-not-allowed" : ""
                            }`}
                        />
                      </td>

                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={row.variableRate}
                          disabled={!isVariable}
                          onChange={(e) => handleInputChange(row.id, "variableRate", e.target.value)}
                          className={`w-28 px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition font-medium ${!isVariable ? "bg-gray-200 cursor-not-allowed" : ""
                            }`}
                        />
                      </td>

                      <td className="px-6 py-4" colSpan="2">
                        <div className="flex items-center justify-center gap-6">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name={`rateType_${row.id}`}
                              checked={isVariable}
                              onChange={() => handleRateTypeChange(row.id, "variable")}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">Variable</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name={`rateType_${row.id}`}
                              checked={isFlat}
                              onChange={() => handleRateTypeChange(row.id, "flat")}
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">Flat</span>
                          </label>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => deleteRow(row.id)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="p-4 border-t">
              <button
                type="button"
                onClick={addRow}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
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