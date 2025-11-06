import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const dummyMembers = [
  { id: 1, name: "John", mobile: "555-0101", email: "john@demo.com" },
  { id: 2, name: "Jane", mobile: "555-0102", email: "jane@demo.com" },
  { id: 3, name: "Michael", mobile: "555-0103", email: "mike@demo.com" },
  { id: 4, name: "Emily", mobile: "555-0104", email: "emily@demo.com" },
  { id: 5, name: "Davis", mobile: "555-0884", email: "davis@demo.com" },
  { id: 6, name: "amala", mobile: "555-0994", email: "amala@demo.com" },
];

export default function QuotationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const member = dummyMembers.find(m => m.id === Number(id));

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-red-600">Member not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-gray-600 text-white rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    serialNo: "1001",
    date: today,
    client: member.name,
    mobile: member.mobile,
    email: member.email,
    serviceRequired: "Logistics",
    movingFrom: "Villa 12, Al Waab, Doha",
    buildingFrom: "Ground + 1st Floor (Lift)",
    movingTo: "Apt 5B, West Bay Tower",
    moveDate: "2025-11-20",
    jobType: "Domestic",
    rooms: [
      { room: "Living Room", item: "Sofa-3", qty: 1, volume: "3.00" },
      { room: "Living Room", item: "TV 55\"", qty: 1, volume: "0.50" },
      { room: "Living Room", item: "Center Table", qty: 1, volume: "1.00" },
      { room: "Bedroom 1", item: "King Bed", qty: 1, volume: "5.00" },
      { room: "Bedroom 1", item: "Wardrobe", qty: 2, volume: "2.00" },
      { room: "Bedroom 1", item: "Dresser", qty: 1, volume: "1.50" },
      { room: "Bedroom 2", item: "Queen Bed", qty: 1, volume: "3.00" },
      
    ],
    services: {
      wallInstallation: true,
      curtainInstallation: true,
      kitchenPacking: true,
      clothesPacking: true,
      clothesUnpacking: false,
      miscBoxPacking: true,
      miscBoxUnpacking: false,
    },
    amount: "8500",
    advance: "3000",
  });

  const totalVolume = form.rooms
    .reduce((s, r) => s + parseFloat(r.volume || 0) * r.qty, 0)
    .toFixed(2);

  const handleSubmit = () => {
    const balance = (form.amount - form.advance).toFixed(2);
    console.log("Quotation →", { ...form, balance });
    alert("Quotation generated successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
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
          {/* Quotation No. + Date + Logo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-normal text-gray-700">Quotation No.</label>
              <input
                type="text"
                value={form.serialNo}
                onChange={e => setForm({ ...form, serialNo: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-normal text-gray-700">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-normal text-gray-700">Client Name</label>
              <input
                type="text"
                value={form.client}
                onChange={e => setForm({ ...form, client: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block font-normal text-gray-700">Mobile</label>
              <input
                type="text"
                value={form.mobile}
                onChange={e => setForm({ ...form, mobile: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block font-normal text-gray-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          </div>

          {/* Service Required */}
          <div>
            <label className="block font-normal text-gray-700">Service Required</label>
            <input
              type="text"
              value={form.serviceRequired}
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
                value={form.movingFrom}
                onChange={e => setForm({ ...form, movingFrom: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block font-normal text-gray-700">Building / Floor</label>
              <input
                type="text"
                value={form.buildingFrom}
                onChange={e => setForm({ ...form, buildingFrom: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block font-normal text-gray-700">Moving To</label>
              <input
                type="text"
                value={form.movingTo}
                onChange={e => setForm({ ...form, movingTo: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block font-normal text-gray-700">Date of Move</label>
              <input
                type="date"
                value={form.moveDate}
                onChange={e => setForm({ ...form, moveDate: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-normal text-gray-700">Kind of Job</label>
              <select
                value={form.jobType}
                onChange={e => setForm({ ...form, jobType: e.target.value })}
                className="w-full mt-1 border border-gray-300 rounded-lg px-4 py-2"
              >
                <option>Local</option>

                <option>International</option>
              </select>
            </div>
          </div>

          {/* Items & Volume */}
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
                  {form.rooms.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-3 text-sm font-medium">{row.room}</td>
                      <td className="px-4 py-3 text-sm">{row.item}</td>
                      <td className="px-4 py-3 text-sm text-center">{row.qty}</td>
                      <td className="px-4 py-3 text-sm text-center">{row.volume}</td>
                    </tr>
                  ))}
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
              {Object.keys(form.services).map(key => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={form.services[key]}
                    readOnly
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                  </span>
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
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full mt-2 border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-normal focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700">Advance</label>
              <input
                type="number"
                value={form.advance}
                onChange={e => setForm({ ...form, advance: e.target.value })}
                className="w-full mt-2 border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-normal focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700">Balance</label>
              <input
                type="text"
                readOnly
                value={form.amount && form.advance ? (form.amount - form.advance).toFixed(2) : ""}
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