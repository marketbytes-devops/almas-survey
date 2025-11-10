import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const SERVICE_TYPE_DISPLAY = {
  localMove: "Local Move",
  internationalMove: "International Move",
  carExport: "Car Import and Export",
  storageServices: "Storage Services",
  logistics: "Logistics",
};

const SERVICE_INCLUDES = [
  "Packing Service",
  "Customer packed boxes collection",
  "Miscellaneous items packing",
  "Furniture dismantling and packing",
  "Loading",
  "Transportation",
  "Unloading , unpacking",
  "Furniture assembly",
  "Debris removal on same day",
];

const SERVICE_EXCLUDES = [
  "Insurance",
  "Storage",
  "Cleaning service, plumbing service , electrical works if any",
  "Chandelier removal / installation/ Plan soil removal, Wall installation",
];

export default function QuotationEdit() {
  const { id } = useParams(); // survey_id
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    serialNo: "",
    date: today,
    client: "",
    mobile: "",
    email: "",
    serviceRequired: "",
    movingFrom: "",
    buildingFrom: "",
    movingTo: "",
    moveDate: today,
    jobType: "Local",
    rooms: [],
    services: {
      wallInstallation: false,
      curtainInstallation: false,
      kitchenPacking: false,
      clothesPacking: false,
      clothesUnpacking: false,
      miscBoxPacking: false,
      miscBoxUnpacking: false,
    },
    includedServices: SERVICE_INCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {}),
    excludedServices: SERVICE_EXCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {}),
    amount: "",
    advance: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Fetch survey
        const surveyRes = await apiClient.get(`/surveys/${id}/`);
        const s = surveyRes.data;
        setSurvey(s);

        // 2. Check if quotation exists
        const checkRes = await apiClient.get(`/quotation-create/check/?survey_id=${id}`);
        if (!checkRes.data.exists) {
          setError("No quotation found for this survey.");
          setLoading(false);
          return;
        }

        // 3. Fetch quotation
        const qRes = await apiClient.get(`/quotation-create/${checkRes.data.quotation_id}/`);
        const q = qRes.data;
        setQuotation(q);

        // Safely parse volume
        const rooms = (s.articles || []).map(a => {
          const vol = a.volume != null ? parseFloat(a.volume) : 0;
          const volume = isNaN(vol) ? "0.00" : vol.toFixed(2);
          return {
            room: a.room_name || "—",
            item: a.item_name || "—",
            qty: a.quantity || 0,
            volume,
          };
        });

        const get = (primary, fallback) => primary ?? fallback ?? "—";

        // Initialize includes/excludes from backend
        const includedObj = SERVICE_INCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {});
        const excludedObj = SERVICE_EXCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {});

        (q.included_services || []).forEach(service => {
          if (SERVICE_INCLUDES.includes(service)) includedObj[service] = true;
        });
        (q.excluded_services || []).forEach(service => {
          if (SERVICE_EXCLUDES.includes(service)) excludedObj[service] = true;
        });

        setForm({
          serialNo: q.serial_no || "1001",
          date: q.date || today,
          client: get(s.full_name, s.enquiry?.fullName),
          mobile: get(s.phone_number, s.enquiry?.phoneNumber),
          email: get(s.email, s.enquiry?.email),
          serviceRequired:
            SERVICE_TYPE_DISPLAY[s.service_type] ||
            SERVICE_TYPE_DISPLAY[s.enquiry?.serviceType] ||
            "—",
          movingFrom: get(s.origin_address),
          buildingFrom: [
            s.origin_floor ? "Floor" : "",
            s.origin_lift ? "Lift" : "",
          ].filter(Boolean).join(" + ") || "—",
          movingTo: s.destination_addresses?.[0]?.address || "—",
          moveDate: s.packing_date_from || today,
          jobType: s.service_type === "localMove" ? "Local" : "International",
          rooms,
          services: {
            wallInstallation: !!s.general_handyman,
            curtainInstallation: !!s.general_handyman,
            kitchenPacking: !!s.general_owner_packed,
            clothesPacking: !!s.general_owner_packed,
            clothesUnpacking: false,
            miscBoxPacking: !!s.general_owner_packed,
            miscBoxUnpacking: false,
          },
          includedServices: includedObj,
          excludedServices: excludedObj,
          amount: q.amount != null ? q.amount.toString() : "",
          advance: q.advance != null ? q.advance.toString() : "",
        });
      } catch (err) {
        setError("Failed to load quotation data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, today]);

  const totalVolume = form.rooms
    .reduce((sum, r) => {
      const vol = parseFloat(r.volume) || 0;
      const qty = r.qty || 0;
      return sum + vol * qty;
    }, 0)
    .toFixed(2);

  const balance = form.amount && form.advance
    ? (parseFloat(form.amount) - parseFloat(form.advance)).toFixed(2)
    : "";

  const handleUpdate = async () => {
    if (!form.amount) {
      alert("Please enter the total amount.");
      return;
    }

    if (!quotation?.quotation_id) {
      alert("Quotation ID missing.");
      return;
    }

    const payload = {
      serial_no: form.serialNo,
      date: form.date,
      amount: parseFloat(form.amount),
      advance: form.advance ? parseFloat(form.advance) : 0,
      included_services: Object.keys(form.includedServices).filter(k => form.includedServices[k]),
      excluded_services: Object.keys(form.excludedServices).filter(k => form.excludedServices[k]),
    };

    try {
      await apiClient.patch(`/quotation-create/${quotation.quotation_id}/`, payload);
      alert("Quotation updated successfully!");
      navigate("/quotation-list");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})[0] ||
        "Update failed.";
      alert("Error: " + msg);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 p-5">{error}</div>;
  }

  return (
    <div className="bg-gray-50">
      <div className="mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-3 px-8 flex justify-between items-center">
          <h2 className="text-lg font-light">Edit Quotation</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-4xl hover:opacity-80 transition"
          >
            ×
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Quotation No. & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-normal text-black text-sm">Quotation No.</label>
              <input
                type="text"
                value={form.serialNo}
                onChange={(e) => setForm({ ...form, serialNo: e.target.value })}
                className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-normal text-black text-sm">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal focus:border-blue-500"
              />
            </div>
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-normal text-black text-sm">Client Name</label>
              <input
                type="text"
                value={form.client}
                readOnly
                className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-normal text-black text-sm">Mobile</label>
              <input
                type="text"
                value={form.mobile}
                readOnly
                className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-normal text-black text-sm">Email</label>
              <input
                type="email"
                value={form.email}
                readOnly
                className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal bg-gray-100"
              />
            </div>
          </div>

          {/* Service */}
          <div>
            <label className="block font-normal text-black text-sm">Service Required</label>
            <input
              type="text"
              value={form.serviceRequired}
              readOnly
              className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal bg-gray-100"
            />
          </div>

          {/* Moving Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-normal text-black text-sm">Moving From</label>
              <input
                type="text"
                value={form.movingFrom}
                readOnly
                className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-normal text-black text-sm">Building / Floor</label>
              <input
                type="text"
                value={form.buildingFrom}
                readOnly
                className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-normal text-black text-sm">Moving To</label>
              <input
                type="text"
                value={form.movingTo}
                readOnly
                className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal bg-gray-100"
              />
            </div>
            <div>
              <label className="block font-normal text-black text-sm">Date of Move</label>
              <input
                type="date"
                value={form.moveDate}
                readOnly
                className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal bg-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-normal text-black text-sm">Kind of Job</label>
              <input
                type="text"
                value={form.jobType}
                readOnly
                className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal bg-gray-100"
              />
            </div>
          </div>

          {/* Items & Volume */}
          <div>
            <h3 className="font-medium text-lg mb-3">Items & Volume</h3>
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Room</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase">Item</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase">Qty</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase">Volume (cbm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {form.rooms.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No items found.
                      </td>
                    </tr>
                  ) : (
                    form.rooms.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="px-4 py-3 text-sm font-medium">{row.room}</td>
                        <td className="px-4 py-3 text-sm">{row.item}</td>
                        <td className="px-4 py-3 text-sm text-center">{row.qty}</td>
                        <td className="px-4 py-3 text-sm text-center">{row.volume}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-4 font-normal text-lg text-[#4c7085]">
              Total Volume - {totalVolume} CBM
            </div>
          </div>

          {/* Additional Services */}
          <div>
            <h3 className="font-medium text-lg mb-3">Additional Services</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(form.services).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    readOnly
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* SERVICE INCLUDES & EXCLUDES - ADDED HERE */}
          <div className="rounded-xl overflow-hidden border-2 border-gray-300">
            <div className="grid grid-cols-2 text-white font-bold text-lg">
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 py-4 text-center">SERVICE INCLUDES</div>
              <div className="bg-gradient-to-r from-red-600 to-red-700 py-4 text-center">SERVICE EXCLUDES</div>
            </div>

            <div className="grid grid-cols-2 bg-gray-50">
              {/* Includes */}
              <div className="p-6 space-y-4">
                {SERVICE_INCLUDES.map((service) => (
                  <label key={service} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.includedServices[service] || false}
                      onChange={(e) => setForm({
                        ...form,
                        includedServices: { ...form.includedServices, [service]: e.target.checked }
                      })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-800 font-medium">{service}</span>
                  </label>
                ))}
              </div>

              {/* Excludes */}
              <div className="p-6 space-y-4 bg-red-50 border-l-2 border-red-200">
                {SERVICE_EXCLUDES.map((service) => (
                  <label key={service} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.excludedServices[service] || false}
                      onChange={(e) => setForm({
                        ...form,
                        excludedServices: { ...form.excludedServices, [service]: e.target.checked }
                      })}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-800 font-medium">{service}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Amount, Advance, Balance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-medium text-black text-sm">Total Amount (QAR)</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block font-medium text-black text-sm">Advance</label>
              <input
                type="number"
                step="0.01"
                value={form.advance}
                onChange={(e) => setForm({ ...form, advance: e.target.value })}
                className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block font-medium text-black text-sm">Balance</label>
              <input
                type="text"
                readOnly
                value={balance}
                className="text-sm w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-2 outline-none font-normal bg-green-50 text-green-700"
              />
            </div>
          </div>

          {/* Update Button */}
          <div className="text-center">
            <button
              onClick={handleUpdate}
              className="w-full text-sm bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] hover:from-[#3a586d] hover:to-[#54738a] text-white px-4 py-2 rounded-xl shadow-lg transform transition duration-200"
            >
              Update Quotation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}