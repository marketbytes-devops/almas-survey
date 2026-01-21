import React, { useState, useEffect } from "react";
import { FaCopy, FaSave, FaPlus, FaTrash, FaLandmark } from "react-icons/fa";
import { Country, State, City } from "country-state-city";
import apiClient from "../../../api/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { FiTrash2, FiCopy, FiSave, FiPlus } from "react-icons/fi";
import { usePermissions } from "../../../components/PermissionsContext/PermissionsContext";

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
  const { hasPermission } = usePermissions();
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
    if (!hasPermission("local_move", "add")) return;
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
    if (!hasPermission("local_move", "delete")) return;
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
    if (!hasPermission("local_move", "edit") && !hasPermission("local_move", "add")) {
      alert("Permission denied");
      return;
    }

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

  const Label = ({ children, required }) => (
    <label className="block text-xs font-medium text-gray-600 uppercase tracking-widest mb-2 ml-1">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <h3 className="text-lg font-medium text-gray-800 mb-6 border-b border-gray-100 pb-4">Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <Label required>City</Label>
            <div className="relative">
              <select
                value={selectedPricingCity}
                onChange={(e) => setSelectedPricingCity(e.target.value)}
                className="input-style w-full font-medium text-gray-700 appearance-none"
              >
                <option value="">Select City</option>
                {qatarCities.map((city) => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-600">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
            <p className="text-[10px] text-gray-600 mt-1.5 ml-1 font-medium tracking-wide">COUNTRY: QATAR</p>
          </div>

          <div>
            <Label required>Move Type</Label>
            <div className="relative">
              <select
                value={selectedMoveType}
                onChange={(e) => setSelectedMoveType(e.target.value)}
                className="input-style w-full font-medium text-gray-700 appearance-none"
              >
                <option value="">Select Move Type</option>
                {getOptions(dropdownData.moveTypes).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-600">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>

          <div>
            <Label>Tariff</Label>
            <div className="relative">
              <select
                value={selectedTariff}
                onChange={(e) => setSelectedTariff(e.target.value)}
                className="input-style w-full font-medium text-gray-700 appearance-none"
              >
                <option value="">Select Tariff</option>
                {getOptions(dropdownData.tariffTypes).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-600">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>

          <div>
            <Label required>Table Unit</Label>
            <div className="relative">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="input-style w-full font-medium text-gray-700 appearance-none"
              >
                <option value="">Select Unit</option>
                {unitOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-600">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>

          <div>
            <Label required>Currency</Label>
            <div className="relative">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="input-style w-full font-medium text-gray-700 appearance-none"
              >
                <option value="">Select Currency</option>
                {getOptions(dropdownData.currencies, "name").map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-600">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-100">
          {hasPermission("local_move", "edit") && (
            <button className="btn-secondary">
              <FiCopy className="w-4 h-4" /> <span className="pl-2">Copy</span>
            </button>
          )}
          {(hasPermission("local_move", "edit") || hasPermission("local_move", "add")) && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              <FiSave className="w-4 h-4" />
              <span>{saving ? "Saving..." : isUpdateMode ? "Update Pricing" : "Save Pricing"}</span>
            </button>
          )}
        </div>

        {selectedPricingCity && (
          <div className="mt-6 p-4 bg-[#4c7085]/5 border border-[#4c7085]/10 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#4c7085]/10 flex items-center justify-center text-[#4c7085]">
              <span className="text-xs font-medium"><FaLandmark /></span>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-widest font-medium">Current Location</p>
              <p className="text-sm font-medium text-gray-800">
                {selectedPricingCity}, Qatar
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 grid justify-center items-center md:flex md:justify-between md:items-center gap-2">
          <h3 className="text-lg font-medium text-gray-800">Pricing Ranges</h3>
          {hasPermission("local_move", "add") && (
            <button
              onClick={addRow}
              className="btn-primary !py-2.5 !px-5 !text-xs !rounded-xl"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Range</span>
            </button>
          )}
        </div>

        {tableData.length === 0 ? (
          <div className="p-12 text-center text-gray-600 text-sm">
            No pricing ranges added yet. Click "Add Range" to start.
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left min-w-max">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Range</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Min</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Max</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Flat Rate</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap">Variable Rate</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap text-center">Rate Type</th>
                    <th className="px-6 py-4 text-xs font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tableData.map((row) => {
                    const isFlat = row.rateType === "flat";
                    return (
                      <tr key={row.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap font-medium text-gray-700 text-sm">{row.range}</td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <input
                            type="text"
                            value={row.min}
                            onChange={(e) => handleInputChange(row.id, "min", e.target.value)}
                            className="input-style w-24 !py-2 !px-3 font-medium text-center"
                          />
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <input
                            type="text"
                            value={row.max}
                            onChange={(e) => handleInputChange(row.id, "max", e.target.value)}
                            className="input-style w-24 !py-2 !px-3 font-medium text-center"
                          />
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <input
                            type="text"
                            value={row.flatRate}
                            disabled={!isFlat}
                            onChange={(e) => handleInputChange(row.id, "flatRate", e.target.value)}
                            className={`input-style w-28 !py-2 !px-3 font-medium transition ${!isFlat ? "bg-gray-50 text-gray-600" : "text-gray-800"}`}
                          />
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <input
                            type="text"
                            value={row.variableRate}
                            disabled={isFlat}
                            onChange={(e) => handleInputChange(row.id, "variableRate", e.target.value)}
                            className={`input-style w-28 !py-2 !px-3 font-medium transition ${isFlat ? "bg-gray-50 text-gray-600" : "text-gray-800"}`}
                          />
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex justify-center gap-4">
                            <label className="flex items-center cursor-pointer group">
                              <input
                                type="radio"
                                name={`rate_${row.id}`}
                                checked={!isFlat}
                                onChange={() => handleRateTypeChange(row.id, "variable")}
                                className="hidden"
                              />
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${!isFlat ? "bg-[#4c7085] text-white border-[#4c7085]" : "bg-white text-gray-600 border-gray-200 group-hover:bg-gray-50"}`}>Variable</span>
                            </label>
                            <label className="flex items-center cursor-pointer group">
                              <input
                                type="radio"
                                name={`rate_${row.id}`}
                                checked={isFlat}
                                onChange={() => handleRateTypeChange(row.id, "flat")}
                                className="hidden"
                              />
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isFlat ? "bg-[#4c7085] text-white border-[#4c7085]" : "bg-white text-gray-600 border-gray-200 group-hover:bg-gray-50"}`}>Flat</span>
                            </label>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          {hasPermission("local_move", "delete") && (
                            <button
                              onClick={() => deleteRow(row.id)}
                              className="w-8 h-8 flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-all duration-200 mx-auto"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
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
                  <div key={row.id} className="border-b border-gray-100 p-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex justify-between items-center mb-6">
                      <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">{row.range}</span>
                      {hasPermission("local_move", "delete") && (
                        <button onClick={() => deleteRow(row.id)} className="w-8 h-8 flex items-center justify-center text-red-600 bg-red-50 rounded-lg">
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>Min Val</Label>
                        <input value={row.min} onChange={(e) => handleInputChange(row.id, "min", e.target.value)} className="input-style font-medium text-gray-800" />
                      </div>
                      <div>
                        <Label>Max Val</Label>
                        <input value={row.max} onChange={(e) => handleInputChange(row.id, "max", e.target.value)} className="input-style font-medium text-gray-800" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label>Flat Rate</Label>
                        <input value={row.flatRate} disabled={!isFlat} onChange={(e) => handleInputChange(row.id, "flatRate", e.target.value)} className={`input-style font-medium text-gray-800 ${!isFlat && "bg-gray-50 text-gray-600"}`} />
                      </div>
                      <div>
                        <Label>Var. Rate</Label>
                        <input value={row.variableRate} disabled={isFlat} onChange={(e) => handleInputChange(row.id, "variableRate", e.target.value)} className={`input-style font-medium text-gray-800 ${isFlat && "bg-gray-50 text-gray-600"}`} />
                      </div>
                    </div>
                    <div className="flex bg-gray-50 p-1 rounded-xl">
                      <button onClick={() => handleRateTypeChange(row.id, "variable")} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${!isFlat ? "bg-white shadow-sm text-[#4c7085]" : "text-gray-600 hover:text-gray-700"}`}>Variable</button>
                      <button onClick={() => handleRateTypeChange(row.id, "flat")} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${isFlat ? "bg-white shadow-sm text-[#4c7085]" : "text-gray-600 hover:text-gray-700"}`}>Flat Rate</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default PricingTab;