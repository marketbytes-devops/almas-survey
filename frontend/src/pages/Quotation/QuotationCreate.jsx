import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function QuotationCreate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSignatureUploading, setIsSignatureUploading] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [pricingRanges, setPricingRanges] = useState([]);
  const [priceError, setPriceError] = useState("");
  const [calculationDetails, setCalculationDetails] = useState({
    range: "",
    rateType: "",
    rateValue: 0,
    formula: ""
  });

  const [form, setForm] = useState({
    serialNo: "1001",
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
    amount: "",
    advance: "",
    includedServices: SERVICE_INCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {}),
    excludedServices: SERVICE_EXCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {}),
  });

  useEffect(() => {
    const fetchLivePricing = async () => {
      try {
        const res = await apiClient.get("/price/active/");
        const liveRates = res.data.map(item => ({
          min: parseFloat(item.min_volume),
          max: parseFloat(item.max_volume),
          rate: parseFloat(item.rate),
          rateType: item.rate_type 
        }));
        setPricingRanges(liveRates);
        setPriceError("");
      } catch (err) {
        console.error("Failed to fetch pricing:", err);
        setPriceError("Failed to load pricing data. Please contact administrator.");
        setPricingRanges([]);
      }
    };
    fetchLivePricing();
  }, []);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await apiClient.get(`/surveys/${id}/`);
        const s = res.data;
        setSurvey(s);

        const rooms = (s.articles || []).map(a => ({
          room: a.room_name || "—",
          item: a.item_name || "—",
          qty: a.quantity || 0,
          volume: parseFloat(a.volume || 0).toFixed(2),
        }));

        const get = (primary, fallback) => primary ?? fallback ?? "—";

        setForm(prev => ({
          ...prev,
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
        }));
      } catch (err) {
        setError("Failed to load survey data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [id, today]);

  const totalVolume = form.rooms
    .reduce((sum, r) => sum + (parseFloat(r.volume) || 0) * (r.qty || 0), 0)
    .toFixed(2);

  useEffect(() => {
    if (!totalVolume || totalVolume <= 0) {
      setForm(prev => ({ ...prev, amount: "" }));
      setPriceError("");
      setCalculationDetails({ range: "", rateType: "", rateValue: 0, formula: "" });
      return;
    }

    if (pricingRanges.length === 0) {
      setPriceError("No pricing data available. Please contact administrator.");
      setForm(prev => ({ ...prev, amount: "" }));
      return;
    }

    const volume = parseFloat(totalVolume);
    const applicableRange = pricingRanges.find(r => volume >= r.min && volume <= r.max);

    if (!applicableRange) {
      setPriceError(`No pricing range found for volume ${volume} CBM.`);
      setForm(prev => ({ ...prev, amount: "" }));
      setCalculationDetails({ range: "", rateType: "", rateValue: 0, formula: "" });
      return;
    }

    let calculatedAmount = 0;
    let formula = "";

    if (applicableRange.rateType === "flat") {
      calculatedAmount = applicableRange.rate;
      formula = `Flat Rate: ${applicableRange.rate.toFixed(2)} QAR`;
    } else {
      calculatedAmount = applicableRange.rate * volume;
      formula = `${calculatedAmount.toFixed(2)} = ${applicableRange.rate.toFixed(2)} × ${volume} CBM`;
    }

    setForm(prev => ({ ...prev, amount: calculatedAmount.toFixed(2) }));
    setPriceError("");
    setCalculationDetails({
      range: `${applicableRange.min.toFixed(2)}-${applicableRange.max.toFixed(2)} CBM`,
      rateType: applicableRange.rateType === "flat" ? "Fixed" : "Variable",
      rateValue: applicableRange.rate.toFixed(2),
      formula
    });

  }, [totalVolume, pricingRanges]);

  const openSignatureModal = () => setIsSignatureModalOpen(true);

  const handleSignatureSave = async (file) => {
    if (!survey || !file) return;
    const formData = new FormData();
    formData.append("signature", file);
    setIsSignatureUploading(true);

    try {
      await apiClient.post(`/surveys/${survey.survey_id}/upload-signature/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Digital signature uploaded successfully");
      setSurvey(prev => ({ ...prev, signature_uploaded: true }));
    } catch (err) {
      setError("Signature upload failed.");
    } finally {
      setIsSignatureUploading(false);
      setIsSignatureModalOpen(false);
    }
  };

  const handleCreate = async () => {
    if (!form.amount) return alert("Amount is not calculated.");
    if (priceError) return alert(priceError);

    const payload = {
      survey: parseInt(survey.id),
      serial_no: form.serialNo,
      date: form.date,
      amount: parseFloat(form.amount),
      advance: form.advance ? parseFloat(form.advance) : 0,
      included_services: Object.keys(form.includedServices).filter(k => form.includedServices[k]),
      excluded_services: Object.keys(form.excludedServices).filter(k => form.excludedServices[k]),
    };

    try {
      await apiClient.post("/quotation-create/", payload);
      alert("Quotation created successfully!");
      navigate("/quotation-list");
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Failed to create quotation."));
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  if (error) return <div className="text-center text-red-600 p-5">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen pt-4">
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
        customerName={form.client}
      />

      <div className="mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-6 sm:px-8 flex justify-between items-center">
          <h2 className="text-xl font-light">Create Quotation</h2>
          <button onClick={() => navigate(-1)} className="text-3xl sm:text-4xl hover:opacity-80">×</button>
        </div>
        {error && <div className="m-4 p-4 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
        {message && <div className="m-4 p-4 bg-green-100 text-green-700 rounded-lg text-sm">{message}</div>}

        <div className="p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quotation No.</label>
              <input
                type="text"
                value={form.serialNo}
                onChange={e => setForm({ ...form, serialNo: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {["Client Name", "Mobile", "Email"].map((label, i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="text"
                  value={[form.client, form.mobile, form.email][i]}
                  readOnly
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50"
                />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {[
              { label: "Service Required", value: form.serviceRequired },
              { label: "Moving From", value: form.movingFrom },
              { label: "Building / Floor", value: form.buildingFrom },
              { label: "Moving To", value: form.movingTo },
              { label: "Date of Move", value: form.moveDate },
            ].map((item, i) => (
              <div key={i} className="grid grid-cols-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
                <input
                  type="text"
                  value={item.value}
                  readOnly
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50"
                />
              </div>
            ))}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Items & Volume</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-300">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Room</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Item</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Qty</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Volume (cbm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {form.rooms.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-3">{row.room}</td>
                      <td className="px-4 py-3">{row.item}</td>
                      <td className="px-4 py-3 text-center">{row.qty}</td>
                      <td className="px-4 py-3 text-center">{row.volume}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-4 text-xl font-bold text-[#4c7085]">
              Total Volume: {totalVolume} CBM
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
            <h3 className="text-lg font-bold mb-4 text-center sm:text-left">Quotation Amount</h3>
            {priceError ? (
              <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 text-center">
                <p className="text-red-700 font-medium">{priceError}</p>
              </div>
            ) : (
              <>
                {calculationDetails.range && (
                  <div className="mb-4 p-4 bg-white rounded-lg border border-blue-300 text-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div><span className="text-gray-600">Range:</span> <strong>{calculationDetails.range}</strong></div>
                    <div><span className="text-gray-600">Type:</span> <strong>{calculationDetails.rateType}</strong></div>
                    <div><span className="text-gray-600">Rate:</span> <strong>{calculationDetails.rateValue} QAR</strong></div>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                  <div className="text-4xl font-bold text-[#4c7085]">
                    {form.amount || "0.00"} <span className="text-2xl">QAR</span>
                  </div>
                  {calculationDetails.formula && (
                    <p className="mt-3 text-sm bg-white rounded-lg py-2 px-4 inline-block">
                      <strong>Calculation:</strong> {calculationDetails.formula}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-2 border-gray-300 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 text-center font-bold text-lg">
              SERVICE INCLUDES
            </div>
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 text-center font-bold text-lg">
              SERVICE EXCLUDES
            </div>
            <div className="p-6 space-y-4 bg-gray-50">
              {SERVICE_INCLUDES.map((service) => (
                <label key={service} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.includedServices[service] || false}
                    onChange={(e) => setForm({
                      ...form,
                      includedServices: { ...form.includedServices, [service]: e.target.checked }
                    })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium">{service}</span>
                </label>
              ))}
            </div>
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
                    className="w-5 h-5 text-red-600 rounded"
                  />
                  <span className="text-sm font-medium">{service}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block font-medium text-sm">Total Amount</label>
              <input type="text" readOnly value={form.amount ? `${form.amount} QAR` : ""} className="w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-3 bg-blue-50 text-blue-700 font-bold" />
            </div>
            <div>
              <label className="block font-medium text-sm">Advance</label>
              <input type="number" step="0.01" value={form.advance} onChange={e => setForm({ ...form, advance: e.target.value })} className="w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block font-medium text-sm">Balance</label>
              <input type="text" readOnly value={form.amount && form.advance ? `${(parseFloat(form.amount) - parseFloat(form.advance)).toFixed(2)} QAR` : ""} className="w-full mt-1 border-2 border-gray-300 rounded-lg px-4 py-3 bg-green-50 text-green-700 font-bold" />
            </div>
          </div>
          <div className="border-t pt-6">
            <h3 className="font-medium text-lg mb-3">Digital Signature</h3>
            <div className="bg-gray-50 p-5 rounded-lg border flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600 text-center sm:text-left">
                {survey?.signature_uploaded ? "Signature uploaded." : "Add digital signature."}
              </p>
              <button
                onClick={openSignatureModal}
                disabled={isSignatureUploading || survey?.signature_uploaded}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  survey?.signature_uploaded || isSignatureUploading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {isSignatureUploading ? "Uploading..." : survey?.signature_uploaded ? "Uploaded" : "Sign Digital"}
              </button>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={handleCreate}
              disabled={!form.amount || priceError}
              className={`w-full mx-auto text-sm font-medium py-2 px-8 rounded-lg transition-all ${
                !form.amount || priceError
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] hover:from-[#3a586d] hover:to-[#54738a] text-white hover:scale-105"
              }`}
            >
              CREATE QUOTATION
            </button>
            {priceError && <p className="mt-4 text-sm text-red-600">Cannot create: {priceError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}