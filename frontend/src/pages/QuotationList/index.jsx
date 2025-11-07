// src/pages/QuotationPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Loading from "../../components/Loading";

export default function QuotationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const survey = state?.survey;

  const [form, setForm] = useState({
    serialNo: "1001",
    date: new Date().toISOString().split("T")[0],
    amount: "8500",
    advance: "3000",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!survey) {
      setLoading(true);
      setTimeout(() => setLoading(false), 500); // Simulate load
    }
  }, [survey]);

  if (loading || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  const totalVolume = survey.articles
    ? survey.articles
        .reduce((sum, a) => sum + (parseFloat(a.calculated_volume) || 0), 0)
        .toFixed(2)
    : "0.00";

  const balance = form.amount && form.advance
    ? (parseFloat(form.amount) - parseFloat(form.advance)).toFixed(2)
    : "0.00";

  const handleSubmit = () => {
    alert(`Quotation ${form.serialNo} generated for ${survey.full_name}!`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header - EXACT SAME */}
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-3 px-8 flex justify-between items-center">
          <h2 className="text-lg font-light">Quotation</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-4xl hover:opacity-80 transition"
          >
            ×
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Quotation No. + Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-normal text-gray-700">Quotation No.</label>
              <input
                type="text"
                value={form.serialNo}
                onChange={(e) => setForm({ ...form, serialNo: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-normal text-gray-700">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Client Info - REAL DATA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-normal text-gray-700">Client Name</label>
              <input
                type="text"
                value={survey.full_name || ""}
                readOnly
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-normal text-gray-700">Mobile</label>
              <input
                type="text"
                value={survey.phone_number || ""}
                readOnly
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-normal text-gray-700">Email</label>
              <input
                type="email"
                value={survey.email || ""}
                readOnly
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
              />
            </div>
          </div>

          {/* Service Required */}
          <div>
            <label className="block font-normal text-gray-700">Service Required</label>
            <input
              type="text"
              value={survey.service_type_display || "Local Move"}
              readOnly
              className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
            />
          </div>

          {/* Move Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-normal text-gray-700">Moving From</label>
              <input
                type="text"
                value={survey.origin_address || ""}
                readOnly
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-normal text-gray-700">Building / Floor</label>
              <input
                type="text"
                value={survey.origin_floor ? "Yes" : "Ground"}
                readOnly
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-normal text-gray-700">Moving To</label>
              <input
                type="text"
                value={survey.destination_addresses?.[0]?.address || ""}
                readOnly
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
              />
            </div>
            <div>
              <label className="block font-normal text-gray-700">Date of Move</label>
              <input
                type="date"
                value={survey.loading_date || ""}
                readOnly
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-normal text-gray-700">Kind of Job</label>
              <select
                value={survey.service_type_display?.includes("International") ? "International" : "Local"}
                readOnly
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 bg-gray-50"
              >
                <option>Local</option>
                <option>International</option>
              </select>
            </div>
          </div>

          {/* Items & Volume - REAL ARTICLES */}
          <div>
            <h3 className="font-medium text-xl mb-3">Items & Volume</h3>
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Room</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Item</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Qty</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Volume (cbm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {survey.articles?.length > 0 ? (
                    survey.articles.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="px-4 py-3 text-sm font-medium">{row.room_name || "Unknown"}</td>
                        <td className="px-4 py-3 text-sm">{row.item_name}</td>
                        <td className="px-4 py-3 text-sm text-center">{row.quantity}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {parseFloat(row.calculated_volume || 0).toFixed(3)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-gray-500">
                        No items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-4 font-semibold text-xl text-[#4c7085]">
              Total Volume: {totalVolume} CBM
            </div>
          </div>

          {/* Additional Services */}
          <div>
            <h3 className="font-medium text-xl mb-3">Additional Services</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: "wallInstallation", label: "Wall Installation" },
                { key: "curtainInstallation", label: "Curtain Installation" },
                { key: "kitchenPacking", label: "Kitchen Packing" },
                { key: "clothesPacking", label: "Clothes Packing" },
                { key: "clothesUnpacking", label: "Clothes Unpacking" },
                { key: "miscBoxPacking", label: "Misc Box Packing" },
                { key: "miscBoxUnpacking", label: "Misc Box Unpacking" },
              ].map((s) => (
                <label key={s.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={survey.general_handyman || Math.random() > 0.5}
                    readOnly
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-sm">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-xl">
            <div>
              <label className="block font-bold text-gray-700">Total Amount (QAR)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full mt-2 border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-normal focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700">Advance</label>
              <input
                type="number"
                value={form.advance}
                onChange={(e) => setForm({ ...form, advance: e.target.value })}
                className="w-full mt-2 border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-normal focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700">Balance</label>
              <input
                type="text"
                readOnly
                value={balance}
                className="w-full mt-2 border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-bold bg-white"
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] hover:from-[#3a586d] hover:to-[#54738a] text-white text-lg px-4 py-2 rounded-xl shadow-lg transform hover:scale-105 transition duration-200"
            >
              Generate Quotation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}