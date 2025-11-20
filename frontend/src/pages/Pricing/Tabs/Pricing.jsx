import React, { useState, useEffect } from "react";
import { FaCopy, FaSave, FaPlus, FaTrash } from "react-icons/fa";
import { Country, State, City } from "country-state-city";
import apiClient from "../../../api/apiClient";

const PricingTab = ({
  selectedMoveType,
  setSelectedMoveType,
  selectedTariff,
  setSelectedTariff,
  selectedUnit,
  setSelectedUnit,
  selectedCurrency,
  setSelectedCurrency,
  dropdownData,
}) => {
  const [tableData, setTableData] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [existingIds, setExistingIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [qatarCities, setQatarCities] = useState([]);
  const [selectedPricingCity, setSelectedPricingCity] = useState("");

  const API_BASE_URL =
    apiClient.defaults.baseURL || "https://backend.almasintl.com/api";

  useEffect(() => {
    const getQatarCities = () => {
      const qatar = Country.getAllCountries().find(c => c.name === "Qatar");
      if (!qatar) return [];
      const cities = City.getCitiesOfCountry(qatar.isoCode) || [];
      return cities.map(city => ({
        value: city.name,
        label: city.name
      }));
    };
    
    const cities = getQatarCities();
    setQatarCities(cities);
    
    const doha = cities.find(c => c.value === "Doha");
    if (doha) {
      setSelectedPricingCity(doha.value);
    }
  }, []);

  useEffect(() => {
    if (!selectedPricingCity || !selectedMoveType) {
      setTableData([]);
      setIsUpdateMode(false);
      setExistingIds(new Set());
      return;
    }

    const fetchPricing = async () => {
      try {
        const params = new URLSearchParams();
        params.append("pricing_city", selectedPricingCity);
        params.append("move_type", selectedMoveType);
        
        const res = await apiClient.get(`${API_BASE_URL}/price/active/?${params}`);
        const apiRows = (res.data || []).map((r, i) => ({
          id: r.id,
          range: `Range ${i + 1}`,
          min: String(r.min_volume || 0).padStart(5, "0"),
          max: String(r.max_volume || 0).padStart(5, "0"),
          flatRate: r.rate_type === "flat" ? String(r.rate) : "",
          variableRate: r.rate_type === "variable" ? String(r.rate) : "0.00",
          rateType: r.rate_type || (i === 0 ? "flat" : "variable"),
        }));
        
        setTableData(apiRows);
        setNextId(apiRows.length ? Math.max(...apiRows.map((x) => x.id)) + 1 : 1);
        setExistingIds(new Set(apiRows.map((r) => r.id)));
        setIsUpdateMode(apiRows.length > 0);
      } catch (err) {
        console.error("Failed to fetch pricing:", err);
        setTableData([]);
      }
    };

    fetchPricing();
  }, [selectedPricingCity, selectedMoveType]);

  const getOptions = (data, labelField = "name", valueField = "id") => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      value: String(item[valueField] || item.id),
      label: item[labelField] || item.title || item.code || item.symbol || String(item.id),
    }));
  };

  const unitOptions = [
    ...getOptions(dropdownData.volumeUnits),
    ...getOptions(dropdownData.weightUnits),
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
              variableRate: type === "variable" ? row.variableRate : "0.00",
            }
          : row
      )
    );
  };

  const addRow = () => {
    setTableData((prev) => [
      ...prev,
      {
        id: nextId,
        range: `Range ${prev.length + 1}`,
        min: "00.00",
        max: "00.00",
        flatRate: "",
        variableRate: "0.00",
        rateType: "variable",
      },
    ]);
    setNextId((prev) => prev + 1);
  };

  const deleteRow = (id) => {
    setTableData((prev) => prev.filter((row) => row.id !== id));
    if (existingIds.has(id)) {
      setExistingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleSave = async () => {
    if (!selectedPricingCity || !selectedMoveType || !selectedTariff || !selectedUnit || !selectedCurrency) {
      alert("Please fill all required fields: City, Move Type, Tariff, Unit, and Currency");
      return;
    }
    
    if (tableData.length === 0) {
      alert("Please add at least one pricing range");
      return;
    }

    setSaving(true);
    const payload = tableData.map((row) => ({
      id: existingIds.has(row.id) ? row.id : undefined,
      min_volume: parseFloat(row.min) || 0,
      max_volume: parseFloat(row.max) || 999999,
      rate: parseFloat(row.rateType === "flat" ? row.flatRate : row.variableRate) || 0,
      rate_type: row.rateType,
      pricing_country: "Qatar", 
      pricing_city: selectedPricingCity, 
      move_type: parseInt(selectedMoveType),
      currency: dropdownData.currencies.find((c) => c.id == selectedCurrency)?.name || "QAR",
    }));

    try {
      if (isUpdateMode) {
        const updates = payload.filter((p) => p.id);
        const creates = payload.filter((p) => !p.id);
        if (updates.length) await apiClient.patch(`${API_BASE_URL}/price/bulk-update/`, updates);
        if (creates.length) await apiClient.post(`${API_BASE_URL}/price/bulk-update/`, creates);
      } else {
        await apiClient.post(`${API_BASE_URL}/price/bulk-update/`, payload);
      }
      alert("Pricing saved successfully!");
      setIsUpdateMode(true);
    } catch (err) {
      console.error(err);
      alert("Failed to save pricing. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
            <select
              value={selectedPricingCity}
              onChange={(e) => setSelectedPricingCity(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#4c7085] focus:ring-4 focus:ring-[#4c7085]/20 outline-none transition"
            >
              <option value="">Select City</option>
              {qatarCities.map((city) => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Country: Qatar</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Move Type *</label>
            <select
              value={selectedMoveType}
              onChange={(e) => setSelectedMoveType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#4c7085] focus:ring-4 focus:ring-[#4c7085]/20 outline-none transition"
            >
              <option value="">Select Move Type</option>
              {getOptions(dropdownData.moveTypes).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tariff</label>
            <select
              value={selectedTariff}
              onChange={(e) => setSelectedTariff(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#4c7085] focus:ring-4 focus:ring-[#4c7085]/20 outline-none transition"
            >
              <option value="">Select Tariff</option>
              {getOptions(dropdownData.tariffTypes).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Table Unit *</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#4c7085] focus:ring-4 focus:ring-[#4c7085]/20 outline-none transition"
            >
              <option value="">Select Unit</option>
              {unitOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Currency *</label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#4c7085] focus:ring-4 focus:ring-[#4c7085]/20 outline-none transition"
            >
              <option value="">Select Currency</option>
              {getOptions(dropdownData.currencies, "name").map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium text-sm">
            <FaCopy /> <span>Copy from Another City</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-8 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:from-[#3a586d] hover:to-[#54738a] transition disabled:opacity-60 font-medium text-sm"
          >
            <FaSave />
            <span>{saving ? "Saving..." : isUpdateMode ? "Update Pricing" : "Save Pricing"}</span>
          </button>
        </div>

        {selectedPricingCity && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Current Location:</strong> {selectedPricingCity}, Qatar
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
              <tr>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-700">Range</th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-700">Min</th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-700">Max</th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-700">Flat Rate</th>
                <th className="px-6 py-5 text-left text-sm font-bold text-gray-700">Variable Rate</th>
                <th className="px-6 py-5 text-center text-sm font-bold text-gray-700">Rate Type</th>
                <th className="px-6 py-5 text-center text-sm font-bold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tableData.map((row) => {
                const isFlat = row.rateType === "flat";
                return (
                  <tr key={row.id} className="hover:bg-blue-50 transition">
                    <td className="px-6 py-5 font-semibold text-gray-800">{row.range}</td>
                    <td className="px-6 py-5">
                      <input
                        type="text"
                        value={row.min}
                        onChange={(e) => handleInputChange(row.id, "min", e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <input
                        type="text"
                        value={row.max}
                        onChange={(e) => handleInputChange(row.id, "max", e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <input
                        type="text"
                        value={row.flatRate}
                        disabled={!isFlat}
                        onChange={(e) => handleInputChange(row.id, "flatRate", e.target.value)}
                        className={`w-28 px-3 py-2 border rounded-lg font-medium transition ${
                          isFlat
                            ? "border-purple-400 bg-purple-50 focus:border-purple-600"
                            : "bg-gray-100 cursor-not-allowed"
                        }`}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <input
                        type="text"
                        value={row.variableRate}
                        disabled={row.rateType !== "variable"}
                        onChange={(e) => handleInputChange(row.id, "variableRate", e.target.value)}
                        className={`w-28 px-3 py-2 border rounded-lg font-medium transition ${
                          row.rateType === "variable"
                            ? "border-green-400 bg-green-50 focus:border-green-600"
                            : "bg-gray-100 cursor-not-allowed"
                        }`}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-8">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`rate_${row.id}`}
                            checked={row.rateType === "variable"}
                            onChange={() => handleRateTypeChange(row.id, "variable")}
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="ml-2 font-medium text-green-700">Variable</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`rate_${row.id}`}
                            checked={isFlat}
                            onChange={() => handleRateTypeChange(row.id, "flat")}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="ml-2 font-medium text-purple-700">Flat</span>
                        </label>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <FaTrash size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden">
          {tableData.map((row) => {
            const isFlat = row.rateType === "flat";
            return (
              <div key={row.id} className="border-b border-gray-200 p-5 hover:bg-blue-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-gray-800">{row.range}</h4>
                  <button onClick={() => deleteRow(row.id)} className="text-red-600">
                    <FaTrash size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input placeholder="Min" value={row.min} onChange={(e) => handleInputChange(row.id, "min", e.target.value)} className="px-4 py-3 border rounded-lg" />
                  <input placeholder="Max" value={row.max} onChange={(e) => handleInputChange(row.id, "max", e.target.value)} className="px-4 py-3 border rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input placeholder="Flat Rate" value={row.flatRate} disabled={!isFlat} onChange={(e) => handleInputChange(row.id, "flatRate", e.target.value)} className={`px-4 py-3 border rounded-lg ${isFlat ? "border-purple-400 bg-purple-50" : "bg-gray-100"}`} />
                  <input placeholder="Variable Rate" value={row.variableRate} disabled={!isFlat === false} onChange={(e) => handleInputChange(row.id, "variableRate", e.target.value)} className={`px-4 py-3 border rounded-lg ${!isFlat ? "border-green-400 bg-green-50" : "bg-gray-100"}`} />
                </div>
                <div className="flex justify-center gap-8">
                  <label className="flex items-center">
                    <input type="radio" name={`m_${row.id}`} checked={!isFlat} onChange={() => handleRateTypeChange(row.id, "variable")} className="text-green-600" />
                    <span className="ml-2 font-medium">Variable</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name={`m_${row.id}`} checked={isFlat} onChange={() => handleRateTypeChange(row.id, "flat")} className="text-purple-600" />
                    <span className="ml-2 font-medium">Flat</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-5 border-t bg-gray-50">
          <button
            onClick={addRow}
            className="w-full flex items-center justify-center gap-3 px-6 py-2 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded-lg hover:from-[#3a586d] hover:to-[#54738a] transition font-medium text-sm"
          >
            <FaPlus size={20} />
            <span>Add New Range</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default PricingTab;