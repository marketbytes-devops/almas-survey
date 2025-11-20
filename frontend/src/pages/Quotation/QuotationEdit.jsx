import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSignature, FaEye, FaPlus } from "react-icons/fa";
import { Country, State, City } from "country-state-city";
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
    pricingCity: "",
  });

  const [destinationCity, setDestinationCity] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    serialNo: "",
    date: today,
    client: "",
    mobile: "",
    email: "",
    serviceRequired: "",
    movingFrom: "",
    movingTo: "",
    moveDate: today,
    jobType: "Local",
    rooms: [],
    includedServices: SERVICE_INCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {}),
    excludedServices: SERVICE_EXCLUDES.reduce((acc, item) => ({ ...acc, [item]: false }), {}),
    amount: "",
    advance: "",
  });

  const getQatarCities = () => {
    const qatar = Country.getAllCountries().find(c => c.name === "Qatar");
    if (!qatar) return [];
    return City.getCitiesOfCountry(qatar.isoCode) || [];
  };

  useEffect(() => {
    const fetchLivePricing = async () => {
      if (!destinationCity) {
        setPricingRanges([]);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.append("pricing_city", destinationCity);
        params.append("move_type", "1"); // Assuming 1 is local move type ID

        const res = await apiClient.get(`/price/active/?${params}`);
        const liveRates = res.data.map((item) => ({
          min: parseFloat(item.min_volume),
          max: parseFloat(item.max_volume),
          rate: parseFloat(item.rate),
          rateType: item.rate_type,
        }));
        setPricingRanges(liveRates);
        setPriceError("");
      } catch (err) {
        console.error("Failed to fetch pricing:", err);
        setPriceError(
          `No pricing found for ${destinationCity}. Please contact administrator.`
        );
        setPricingRanges([]);
      }
    };

    fetchLivePricing();
  }, [destinationCity]);

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

  // Auto-calculate amount based on destination city pricing
  useEffect(() => {
    if (!totalVolume || totalVolume <= 0 || pricingRanges.length === 0 || !destinationCity) {
      setForm((prev) => ({ ...prev, amount: "" }));
      setCalculationDetails({
        range: "",
        rateType: "",
        rateValue: 0,
        formula: "",
        pricingCity: ""
      });
      return;
    }

    const volume = parseFloat(totalVolume);
    const range = pricingRanges.find((r) => volume >= r.min && volume <= r.max);

    if (!range) {
      setPriceError(`No pricing range found for volume ${volume} CBM in ${destinationCity}`);
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
      pricingCity: destinationCity
    });
    setPriceError("");
  }, [totalVolume, pricingRanges, destinationCity]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const surveyRes = await apiClient.get(`/surveys/${id}/`);
        const s = surveyRes.data;
        setSurvey(s);

        const destCity = s.destination_addresses?.[0]?.city || "";
        setDestinationCity(destCity);

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
        console.error(err);
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
    if (priceError) return alert(priceError);

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
              <h3 className="font-medium">Digital Signature</h3>
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

      <div className="mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-8 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-medium">Edit Quotation</h2>
          <button onClick={() => navigate(-1)} className="text-4xl hover:opacity-80">×</button>
        </div>

        {message && <div className="m-6 p-4 bg-green-100 text-green-700 rounded-lg text-center font-medium">{message}</div>}
        {error && <div className="m-6 p-4 bg-red-100 text-red-700 rounded-lg text-center">{error}</div>}

        <div className="p-8 space-y-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Pricing Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Destination City
                </label>
                <input
                  type="text"
                  value={destinationCity || "Not specified"}
                  readOnly
                  className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value="Qatar"
                  readOnly
                  className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium"
                />
              </div>
            </div>
            {destinationCity && (
              <p className="text-xs text-blue-600 mt-2">
                Pricing is calculated based on rates for {destinationCity}, Qatar
              </p>
            )}
          </div>

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
            { label: "Moving To", value: form.movingTo },
            { label: "Date of Move", value: form.moveDate },
          ].map((item) => (
            <div key={item.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{item.label}</label>
              <input type="text" value={item.value} readOnly className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50" />
            </div>
          ))}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
            <h3 className="text-xl font-medium text-center mb-4">Quotation Amount</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Total Volume</p>
                <div className="text-2xl font-medium text-green-600">
                  {totalVolume} <span className="text-lg">CBM</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Pricing Location</p>
                <div className="text-lg font-medium text-blue-600">
                  {destinationCity || "Not specified"}
                </div>
              </div>
            </div>

            {priceError ? (
              <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 text-center text-red-700 font-medium">
                {priceError}
              </div>
            ) : (
              <>
                {calculationDetails.range && (
                  <div className="bg-white rounded-lg p-4 mb-4 text-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div><strong>Range:</strong> {calculationDetails.range}</div>
                    <div><strong>Type:</strong> {calculationDetails.rateType}</div>
                    <div><strong>Rate:</strong> {calculationDetails.rateValue} QAR</div>
                    <div><strong>City:</strong> {calculationDetails.pricingCity}</div>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-5xl font-medium text-[#4c7085]">{form.amount || "0.00"} <span className="text-3xl">QAR</span></p>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 border-2 border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 text-center text-lg font-medium">
              Service Includes
            </div>
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 text-center text-lg font-medium">
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
              <input type="text" readOnly value={balance ? `${balance} QAR` : ""} className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-green-50 font-medium text-green-700" />
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-1">Digital Signature</h3>

            <div className="bg-gray-50 p-6 rounded-lg border text-center">
              {hasSignature ? (
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 md:gap-0">
                  <div className="text-center md:text-left">
                    <p className="font-medium text-green-700">Digitally Signed</p>
                    <p className="text-sm text-gray-600">Customer signature is attached</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">

                    <button
                      onClick={viewSignature}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
                    >
                      <FaEye /> View
                    </button>

                    <button
                      onClick={openSignatureModal}
                      disabled={isSignatureUploading}
                      className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white text-sm rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-60"
                    >
                      <FaPlus /> Change
                    </button>

                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <p className="text-gray-600 mb-4">No signature uploaded yet</p>

                  <button
                    onClick={openSignatureModal}
                    className="px-8 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-red-700"
                  >
                    <FaSignature className="inline" /> Add Digital Signature
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleUpdate}
              disabled={!form.amount || priceError}
              className={`w-full max-w-md mx-auto py-2 px-4 text-sm font-medium rounded-lg shadow-lg transition transform ${!form.amount || priceError
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:from-[#3a586d] hover:to-[#54738a] hover:scale-105"
                }`}
            >
              UPDATE QUOTATION
            </button>
            {priceError && (
              <p className="mt-4 text-sm text-red-600">
                Cannot update: {priceError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}