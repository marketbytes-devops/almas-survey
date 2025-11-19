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
  const [message, setMessage] = useState("");
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isSignatureViewModalOpen, setIsSignatureViewModalOpen] = useState(false);

  const [pricingRanges, setPricingRanges] = useState([]);
  const [priceError, setPriceError] = useState("");
  const [calculationDetails, setCalculationDetails] = useState({
    range: "",
    rateType: "",
    rateValue: 0,
    formula: "",
  });

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
    includedServices: SERVICE_INCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {}),
    excludedServices: SERVICE_EXCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {}),
    amount: "",
    advance: "",
  });

  // Fetch live pricing
  useEffect(() => {
    const fetchLivePricing = async () => {
      try {
        const res = await apiClient.get("/price/active/");
        const liveRates = res.data.map((item) => ({
          min: parseFloat(item.min_volume),
          max: parseFloat(item.max_volume),
          rate: parseFloat(item.rate),
          rateType: item.rate_type,
        }));
        setPricingRanges(liveRates);
      } catch (err) {
        setPriceError("Failed to load pricing data.");
      }
    };
    fetchLivePricing();
  }, []);

  // Check signature
  const checkSignatureExists = async (surveyId) => {
    try {
      const res = await apiClient.get(`/surveys/${surveyId}/signature/`);
      const url = res.data.signature_url;
      setHasSignature(!!url);
      setCurrentSignature(url);
    } catch {
      setHasSignature(false);
    }
  };

  // Calculate total volume
  const totalVolume = form.rooms
    .reduce((sum, r) => sum + (parseFloat(r.volume) || 0) * (r.qty || 0), 0)
    .toFixed(2);

  // Auto-calculate amount
  useEffect(() => {
    if (!totalVolume || totalVolume <= 0 || pricingRanges.length === 0) {
      setForm((prev) => ({ ...prev, amount: "" }));
      setCalculationDetails({ range: "", rateType: "", rateValue: 0, formula: "" });
      return;
    }

    const volume = parseFloat(totalVolume);
    const range = pricingRanges.find((r) => volume >= r.min && volume <= r.max);

    if (!range) {
      setPriceError(`No pricing range for ${volume} CBM`);
      setForm((prev) => ({ ...prev, amount: "" }));
      return;
    }

    let amount = 0;
    let formula = "";

    if (range.rateType === "flat") {
      amount = range.rate;
      formula = `Flat Rate: ${range.rate.toFixed(2)} QAR`;
    } else {
      amount = range.rate * volume;
      formula = `${amount.toFixed(2)} = ${range.rate} × ${volume} CBM`;
    }

    setForm((prev) => ({ ...prev, amount: amount.toFixed(2) }));
    setCalculationDetails({
      range: `${range.min}-${range.max} CBM`,
      rateType: range.rateType === "flat" ? "Fixed" : "Variable",
      rateValue: range.rate.toFixed(2),
      formula,
    });
    setPriceError("");
  }, [totalVolume, pricingRanges]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const surveyRes = await apiClient.get(`/surveys/${id}/`);
        const s = surveyRes.data;
        setSurvey(s);
        await checkSignatureExists(s.survey_id);

        const checkRes = await apiClient.get(`/quotation-create/check/?survey_id=${id}`);
        if (!checkRes.data.exists) {
          setError("No quotation found.");
          setLoading(false);
          return;
        }

        const qRes = await apiClient.get(`/quotation-create/${checkRes.data.quotation_id}/`);
        const q = qRes.data;
        setQuotation(q);

        const rooms = (s.articles || []).map((a) => ({
          room: a.room_name || "—",
          item: a.item_name || "—",
          qty: a.quantity || 0,
          volume: a.volume ? parseFloat(a.volume).toFixed(2) : "0.00",
        }));

        const get = (p, f) => p ?? f ?? "—";

        const included = SERVICE_INCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {});
        const excluded = SERVICE_EXCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {});

        (q.included_services || []).forEach((s) => SERVICE_INCLUDES.includes(s) && (included[s] = true));
        (q.excluded_services || []).forEach((s) => SERVICE_EXCLUDES.includes(s) && (excluded[s] = true));

        setForm({
          serialNo: q.serial_no || "",
          date: q.date || today,
          client: get(s.full_name, s.enquiry?.fullName),
          mobile: get(s.phone_number, s.enquiry?.phoneNumber),
          email: get(s.email, s.enquiry?.email),
          serviceRequired: SERVICE_TYPE_DISPLAY[s.service_type] || "—",
          movingFrom: get(s.origin_address),
          buildingFrom: [s.origin_floor ? "Floor" : "", s.origin_lift ? "Lift" : ""].filter(Boolean).join(" + ") || "—",
          movingTo: s.destination_addresses?.[0]?.address || "—",
          moveDate: s.packing_date_from || today,
          jobType: s.service_type === "localMove" ? "Local" : "International",
          rooms,
          includedServices: included,
          excludedServices: excluded,
          amount: q.amount?.toString() || "",
          advance: q.advance?.toString() || "",
        });
      } catch (err) {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, today]);

  const balance = form.amount && form.advance
    ? (parseFloat(form.amount) - parseFloat(form.advance)).toFixed(2)
    : "";

  const handleUpdate = async () => {
    if (!form.amount) return alert("Amount is required.");
    if (!quotation?.quotation_id) return alert("Quotation not found.");

    const payload = {
      serial_no: form.serialNo,
      date: form.date,
      amount: parseFloat(form.amount),
      advance: form.advance ? parseFloat(form.advance) : 0,
      included_services: Object.keys(form.includedServices).filter((k) => form.includedServices[k]),
      excluded_services: Object.keys(form.excludedServices).filter((k) => form.excludedServices[k]),
    };

    try {
      await apiClient.patch(`/quotation-create/${quotation.quotation_id}/`, payload);
      setMessage("Quotation updated successfully!");
      setTimeout(() => navigate("/quotation-list"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed.");
    }
  };

  const openSignatureModal = () => setIsSignatureModalOpen(true);
  const viewSignature = () => currentSignature && setIsSignatureViewModalOpen(true);

  const handleSignatureSave = async (file) => {
    if (!survey || !file) return;
    const formData = new FormData();
    formData.append("signature", file);
    setIsSignatureUploading(true);

    try {
      await apiClient.post(`/surveys/${survey.survey_id}/upload-signature/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Signature updated successfully!");
      await checkSignatureExists(survey.survey_id);
    } catch {
      setError("Signature upload failed.");
    } finally {
      setIsSignatureUploading(false);
      setIsSignatureModalOpen(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  if (error && !message) return <div className="text-center text-red-600 p-5">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
        customerName={form.client}
      />

      {isSignatureViewModalOpen && currentSignature && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Digital Signature</h3>
              <button onClick={() => setIsSignatureViewModalOpen(false)} className="text-3xl">×</button>
            </div>
            <img src={currentSignature} alt="Signature" className="w-full rounded-lg border" />
            <button
              onClick={() => setIsSignatureViewModalOpen(false)}
              className="mt-4 w-full bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-3 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto bg-white rounded-2xl shadow-xl overflow-hidden my-8">
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-8 flex justify-between items-center">
          <h2 className="text-2xl font-medium">Edit Quotation</h2>
          <button onClick={() => navigate(-1)} className="text-4xl hover:opacity-80">×</button>
        </div>

        {message && <div className="m-6 p-4 bg-green-100 text-green-700 rounded-lg text-center font-medium">{message}</div>}
        {error && <div className="m-6 p-4 bg-red-100 text-red-700 rounded-lg text-center">{error}</div>}

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quotation No.</label>
              <input type="text" value={form.serialNo} onChange={(e) => setForm({ ...form, serialNo: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {["Client Name", "Mobile", "Email"].map((label, i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="text" value={[form.client, form.mobile, form.email][i]} readOnly
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50" />
              </div>
            ))}
          </div>
          {[
            { label: "Service Required", value: form.serviceRequired },
            { label: "Moving From", value: form.movingFrom },
            { label: "Building / Floor", value: form.buildingFrom },
            { label: "Moving To", value: form.movingTo },
            { label: "Date of Move", value: form.moveDate },
          ].map((item) => (
            <div key={item.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
              <input type="text" value={item.value} readOnly className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50" />
            </div>
          ))}
          <div>
            <h3 className="text-lg font-bold mb-4">Items & Volume</h3>
            <div className="overflow-x-auto rounded-xl shadow-md border">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Room</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Item</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Qty</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Volume (CBM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {form.rooms.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-500">No items</td></tr>
                  ) : (
                    form.rooms.map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="px-6 py-4 text-sm">{r.room}</td>
                        <td className="px-6 py-4 text-sm">{r.item}</td>
                        <td className="px-6 py-4 text-center">{r.qty}</td>
                        <td className="px-6 py-4 text-center font-medium">{r.volume}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-4 text-xl font-bold text-[#4c7085]">
              Total Volume: {totalVolume} CBM
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
            <h3 className="text-xl font-bold text-center mb-4">Quotation Amount</h3>
            {priceError ? (
              <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 text-center text-red-700 font-medium">
                {priceError}
              </div>
            ) : (
              <>
                {calculationDetails.range && (
                  <div className="bg-white rounded-lg p-4 mb-4 text-sm grid grid-cols-3 gap-4">
                    <div><strong>Range:</strong> {calculationDetails.range}</div>
                    <div><strong>Type:</strong> {calculationDetails.rateType}</div>
                    <div><strong>Rate:</strong> {calculationDetails.rateValue} QAR</div>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-5xl font-bold text-[#4c7085]">{form.amount || "0.00"} <span className="text-3xl">QAR</span></p>
                  {calculationDetails.formula && (
                    <p className="mt-3 text-sm bg-white inline-block px-6 py-2 rounded-full">
                      {calculationDetails.formula}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 border-2 border-gray-300 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 text-center text-lg font-bold">
              Service Includes
            </div>
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 text-center text-lg font-bold">
              Service Excludes
            </div>
            <div className="p-6 space-y-4 bg-gray-50">
              {SERVICE_INCLUDES.map((s) => (
                <label key={s} className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={form.includedServices[s]} onChange={(e) =>
                    setForm({ ...form, includedServices: { ...form.includedServices, [s]: e.target.checked } })}
                    className="w-5 h-5 text-blue-600 rounded" />
                  <span className="text-sm font-medium">{s}</span>
                </label>
              ))}
            </div>
            <div className="p-6 space-y-4 bg-red-50 border-l-2 border-red-200">
              {SERVICE_EXCLUDES.map((s) => (
                <label key={s} className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={form.excludedServices[s]} onChange={(e) =>
                    setForm({ ...form, excludedServices: { ...form.excludedServices, [s]: e.target.checked } })}
                    className="w-5 h-5 text-red-600 rounded" />
                  <span className="text-sm font-medium">{s}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block font-medium">Total Amount</label>
              <input type="text" readOnly value={form.amount ? `${form.amount} QAR` : ""} className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50" />
            </div>
            <div>
              <label className="block font-medium">Advance</label>
              <input type="number" step="0.01" value={form.advance} onChange={(e) => setForm({ ...form, advance: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block font-medium">Balance</label>
              <input type="text" readOnly value={balance ? `${balance} QAR` : ""} className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-green-50 font-bold text-green-700" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Digital Signature</h3>
            <div className="bg-gray-50 p-6 rounded-xl border text-center">
              {hasSignature ? (
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <p className="font-bold text-green-700">Digitally Signed</p>
                    <p className="text-sm text-gray-600">Customer signature is attached</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={viewSignature} className="px-5 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
                      <FaEye /> View
                    </button>
                    <button onClick={openSignatureModal} disabled={isSignatureUploading}
                      className="px-5 py-3 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-60">
                      <FaPlus /> Change
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">No signature uploaded yet</p>
                  <button onClick={openSignatureModal} className="px-8 py-4 bg-red-600 text-white rounded-xl text-lg hover:bg-red-700">
                    <FaSignature className="inline mr-2" /> Add Digital Signature
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="text-center pt-6">
            <button
              onClick={handleUpdate}
              className="w-full max-w-md mx-auto py-4 px-8 bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-xl font-bold rounded-xl shadow-lg hover:from-[#3a586d] hover:to-[#54738a] transition transform hover:scale-105"
            >
              UPDATE QUOTATION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}