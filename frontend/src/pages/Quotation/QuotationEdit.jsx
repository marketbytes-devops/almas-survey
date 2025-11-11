import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSignature, FaEye, FaPlus } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";
import SignatureModal from "../../components/SignatureModal/SignatureModal";

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
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = new Date().toISOString().split("T")[0];

  // === PRICING RANGES ===
  const [pricingRanges, setPricingRanges] = useState([]);

  useEffect(() => {
    const fetchLivePricing = async () => {
      try {
        const res = await apiClient.get("/api/price/active/");
        const liveRates = res.data.map((item) => ({
          min: parseFloat(item.min_volume),
          max: parseFloat(item.max_volume),
          rate: parseFloat(item.rate),
          type: item.rate_type,
        }));
        setPricingRanges(liveRates);
      } catch (err) {
        console.log("Using backup rates");
        setPricingRanges([
          { min: 0.01, max: 10.00, rate: 625.00, type: "variable" },
          { min: 10.01, max: 20.00, rate: 625.00, type: "flat" },
          { min: 20.01, max: 30.00, rate: 675.00, type: "flat" },
          { min: 30.01, max: 40.00, rate: 775.00, type: "flat" },
          { min: 40.01, max: 50.00, rate: 825.00, type: "flat" },
          { min: 50.01, max: 60.00, rate: 875.00, type: "flat" },
          { min: 60.01, max: 70.00, rate: 925.00, type: "flat" },
        ]);
      }
    };
    fetchLivePricing();
  }, []);

  // === FORM STATE ===
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
    pricingMode: "variable",
    amount: "",
    advance: "",
    includedServices: SERVICE_INCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {}),
    excludedServices: SERVICE_EXCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {}),
  });

  // === LOAD DATA ===
  useEffect(() => {
    const loadData = async () => {
      try {
        const surveyRes = await apiClient.get(`/surveys/${id}/`);
        const s = surveyRes.data;
        setSurvey(s);

        const checkRes = await apiClient.get(`/quotation-create/check/?survey_id=${id}`);
        if (!checkRes.data.exists) {
          setError("No quotation found for this survey.");
          setLoading(false);
          return;
        }

        const qRes = await apiClient.get(`/quotation-create/${checkRes.data.quotation_id}/`);
        const q = qRes.data;
        setQuotation(q);

        const rooms = (s.articles || []).map((a) => {
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

        const includedObj = SERVICE_INCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {});
        const excludedObj = SERVICE_EXCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {});

        (q.included_services || []).forEach((service) => {
          if (SERVICE_INCLUDES.includes(service)) includedObj[service] = true;
        });
        (q.excluded_services || []).forEach((service) => {
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
          pricingMode: q.pricing_mode || "variable",
          amount: q.amount != null ? q.amount.toString() : "",
          advance: q.advance != null ? q.advance.toString() : "",
          includedServices: includedObj,
          excludedServices: excludedObj,
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

  // === TOTAL VOLUME ===
  const totalVolume = form.rooms
    .reduce((sum, r) => sum + (parseFloat(r.volume) || 0) * (r.qty || 0), 0)
    .toFixed(2);

  // === AUTO-CALCULATE AMOUNT ===
  useEffect(() => {
    if (!totalVolume || totalVolume <= 0) return;
    const volume = parseFloat(totalVolume);
    const applicableRange = pricingRanges.find((r) => volume >= r.min && volume <= r.max);
    if (!applicableRange) {
      setForm((prev) => ({ ...prev, amount: "" }));
      return;
    }
    let calculated = 0;
    if (form.pricingMode === "variable") {
      calculated = applicableRange.rate * volume;
    } else {
      calculated = applicableRange.rate;
    }
    setForm((prev) => ({ ...prev, amount: calculated.toFixed(2) }));
  }, [totalVolume, form.pricingMode, pricingRanges]);

  // === BALANCE ===
  const balance = form.amount && form.advance
    ? (parseFloat(form.amount) - parseFloat(form.advance)).toFixed(2)
    : "";

  // === UPDATE HANDLER ===
  const handleUpdate = async () => {
    if (!form.amount) {
      alert("Amount is required.");
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
      included_services: Object.keys(form.includedServices).filter((k) => form.includedServices[k]),
      excluded_services: Object.keys(form.excludedServices).filter((k) => form.excludedServices[k]),
      pricing_mode: form.pricingMode,
    };

    try {
      await apiClient.patch(`/quotation-create/${quotation.quotation_id}/`, payload);
      setMessage("Quotation updated successfully!");
      setTimeout(() => {
        setMessage("");
        navigate("/quotation-list"); // Redirect after success
      }, 1500);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})[0] ||
        "Update failed.";
      setError("Error: " + msg);
      setTimeout(() => setError(""), 3000);
    }
  };

  // Open signature upload modal (for adding/updating)
  const openSignatureUploadModal = () => {
    setIsSignatureModalOpen(true);
  };

  // View signature
  const viewSignature = async () => {
    if (!survey) return;
    
    try {
      const signatureRes = await apiClient.get(`/surveys/${survey.survey_id}/signature/`);
      setCurrentSignature(signatureRes.data.signature_url);
      setIsSignatureViewModalOpen(true);
    } catch (err) {
      setError("Failed to load signature");
    }
  };

  // Handle signature save from modal
  const handleSignatureSave = async (file) => {
    if (!survey || !file) return;
    
    const formData = new FormData();
    formData.append("signature", file);
    setIsSignatureUploading(true);
    
    try {
      await apiClient.post(
        `/surveys/${survey.survey_id}/upload-signature/`, 
        formData, 
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setMessage("Digital signature updated successfully");
      // Re-check signature existence
      await checkSignatureExists(survey.survey_id);
    } catch (err) {
      setError("Signature upload failed.");
    } finally {
      setIsSignatureUploading(false);
      setIsSignatureModalOpen(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  if (error) return <div className="text-center text-red-600 p-5">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-auto">
      <div className="max-w-full mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-6 flex justify-between items-center">
          <h2 className="text-lg font-light">Edit Quotation</h2>
          <button onClick={() => navigate(-1)} className="text-3xl hover:opacity-80 transition">×</button>
        </div>

        <div className="p-6 space-y-8">

          {/* 1. Quotation No & Date → 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quotation No.</label>
              <input
                type="text"
                value={form.serialNo}
                onChange={(e) => setForm({ ...form, serialNo: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#4c7085] focus:ring-1 focus:ring-[#4c7085]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#4c7085] focus:ring-1 focus:ring-[#4c7085]"
              />
            </div>
          </div>

          {/* 2. Client Info → 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input type="text" value={form.client} readOnly className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input type="text" value={form.mobile} readOnly className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} readOnly className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50" />
            </div>
          </div>

          {/* 3. Moving Details → 2 Columns */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Required</label>
                <input type="text" value={form.serviceRequired} readOnly className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moving From</label>
                <input type="text" value={form.movingFrom} readOnly className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building / Floor</label>
                <input type="text" value={form.buildingFrom} readOnly className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moving To</label>
                <input type="text" value={form.movingTo} readOnly className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Move</label>
                <input type="date" value={form.moveDate} readOnly className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kind of Job</label>
                <input type="text" value={form.jobType} readOnly className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50" />
              </div>
            </div>
          </div>

          {/* 4. Items & Volume */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Items & Volume</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Room</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Item</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase">Qty</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 uppercase">Volume (cbm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {form.rooms.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-2 text-sm">{row.room}</td>
                      <td className="px-4 py-2 text-sm">{row.item}</td>
                      <td className="px-4 py-2 text-sm text-center">{row.qty}</td>
                      <td className="px-4 py-2 text-sm text-center">{row.volume}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-right text-lg font-bold text-[#4c7085]">
              Total Volume: {totalVolume} CBM
            </div>
          </div>

          {/* 5. Pricing Mode */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-xl border border-blue-200">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Pricing Mode</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricingMode"
                  value="variable"
                  checked={form.pricingMode === "variable"}
                  onChange={(e) => setForm({ ...form, pricingMode: e.target.value })}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-sm font-medium">Variable (Rate × Volume)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricingMode"
                  value="fixed"
                  checked={form.pricingMode === "fixed"}
                  onChange={(e) => setForm({ ...form, pricingMode: e.target.value })}
                  className="w-5 h-5 text-purple-600"
                />
                <span className="text-sm font-medium">Fixed (Flat Rate)</span>
              </label>
            </div>
            <div className="mt-4 text-center text-2xl font-medium text-[#4c7085]">
              Total Amount: <span className="text-3xl">{form.amount || "0.00"}</span> QAR
            </div>
            <p className="text-center text-xs text-gray-600 mt-1">
              {form.pricingMode === "variable"
                ? `Calculation: ${form.amount} = Rate × ${totalVolume} CBM`
                : `Flat Rate applied for volume ${totalVolume} CBM`}
            </p>
          </div>

          {/* 6. Includes / Excludes → 2 Columns */}
          <div className="rounded-xl overflow-hidden border border-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 text-white font-bold text-base">
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 py-3 text-center">SERVICE INCLUDES</div>
              <div className="bg-gradient-to-r from-red-600 to-red-700 py-3 text-center">SERVICE EXCLUDES</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 bg-gray-50">
              <div className="p-5 space-y-3">
                {SERVICE_INCLUDES.map((service) => (
                  <label key={service} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.includedServices[service] || false}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          includedServices: { ...form.includedServices, [service]: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-800">{service}</span>
                  </label>
                ))}
              </div>
              <div className="p-5 space-y-3 bg-red-50 border-t md:border-t-0 md:border-l border-red-200">
                {SERVICE_EXCLUDES.map((service) => (
                  <label key={service} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.excludedServices[service] || false}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          excludedServices: { ...form.excludedServices, [service]: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-red-600 rounded"
                    />
                    <span className="text-sm text-gray-800">{service}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 7. Advance & Balance → 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Advance</label>
              <input
                type="number"
                step="0.01"
                value={form.advance}
                onChange={(e) => setForm({ ...form, advance: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#4c7085] focus:ring-1 focus:ring-[#4c7085]"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
              <input
                type="text"
                readOnly
                value={balance}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-green-50 text-green-700 font-medium"
              />
            </div>
          </div>

          {/* 8. Update Button */}
          <div className="pt-4 text-center">
            <button
              onClick={handleUpdate}
              className="w-full max-w-xs mx-auto bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] hover:from-[#3a586d] hover:to-[#54738a] text-white font-normal py-2 px-4 rounded-lg transform transition hover:scale-105 text-sm"
            >
              UPDATE QUOTATION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}