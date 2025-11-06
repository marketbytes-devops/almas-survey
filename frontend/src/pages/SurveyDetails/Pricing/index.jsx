import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import Input from "../../../components/Input";
import Dropdown from "../../../components/Dropdown";
import { FaCopy, FaSave } from "react-icons/fa";

const navItems = [
  { label: "Destination Service", to: "/destination" },
  { label: "Special Items", to: "/special" },
  { label: "Extra Charges", to: "/extra" },
  { label: "Haulage & Terminal Fees", to: "/haulage" },
  { label: "Service Levels", to: "/levels" },
  { label: "Terms & Attachments", to: "/terms" },
  { label: "Pricing/Port Comments", to: "/pricing" },
];

const Pricing = () => {
  const methods = useForm();
  const [activeTab, setActiveTab] = useState("pricing");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const tableData = [
    { range: "Range 2", min: "10.01", max: "", rate: "625.00", adjustment: "0.00" },
    { range: "Range 3", min: "20.01", max: "40.00", rate: "675.00", adjustment: "0.00" },
    { range: "Range 4", min: "30.01", max: "50.00", rate: "775.00", adjustment: "0.00" },
    { range: "Range 5", min: "40.01", max: "60.00", rate: "825.00", adjustment: "0.00" },
    { range: "Range 6", min: "50.01", max: "70.00", rate: "875.00", adjustment: "0.00" },
    { range: "Range 7", min: "60.01", max: "", rate: "925.00", adjustment: "0.00" },
  ];

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex flex-wrap gap-2 py-3 text-sm">
              {navItems.map((item) => (
                <button
                  key={item.to}
                  onClick={() => setActiveTab(item.to.slice(1))}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    activeTab === item.to.slice(1)
                      ? "bg-white/20 shadow-md"
                      : "hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-[#1e40af] text-center mb-8">
            DESTINATION SERVICE RATES
          </h1>

          {/* Controls Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select A Hub
                </label>
                <Input
                  name="hub"
                  type="select"
                  options={[
                    { value: "Dukhan", label: "Dukhan" },
                    { value: "Doha", label: "Doha" },
                  ]}
                  rules={{ required: "Hub is required" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <Input
                  name="type"
                  type="select"
                  options={[
                    { value: "FCL", label: "FCL" },
                    { value: "LCL", label: "LCL" },
                    { value: "AIR", label: "AIR" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tariff
                </label>
                <Input
                  name="tariff"
                  type="select"
                  options={[
                    { value: "Main Tariff", label: "Main Tariff" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Unit is
                </label>
                <Input
                  name="unit"
                  type="select"
                  options={[
                    { value: "CBM", label: "CBM" },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Currency
                </label>
                <Input
                  name="currency"
                  type="select"
                  options={[
                    { value: "USD", label: "USD" },
                  ]}
                />
              </div>

              <div className="flex items-end gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                  <FaCopy />
                  COPY
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                  <FaSave />
                  SAVE
                </button>
              </div>
            </div>
          </div>

          {/* Rates Table */}
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
                    <td className="px-1"></td>
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

export default Pricing;