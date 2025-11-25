import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Country, City } from "country-state-city";
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
  const [destinationCity, setDestinationCity] = useState("");

  // Dynamic Includes & Excludes
  const [dynamicIncludes, setDynamicIncludes] = useState([]);
  const [dynamicExcludes, setDynamicExcludes] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [form, setForm] = useState({
    serialNo: "1001",
    date: today,
    client: "",
    mobile: "",
    email: "",
    serviceRequired: "",
    movingFrom: "",
    movingTo: "",
    moveDate: today,
    jobType: "Local",
    amount: "",
    advance: "",
    includedServices: {},   // will be filled dynamically
    excludedServices: {},   // will be filled dynamically
  });

  // Fetch survey data
  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await apiClient.get(`/surveys/${id}/`);
        const s = res.data;
        setSurvey(s);

        const destCity = s.destination_addresses?.[0]?.city || "";
        setDestinationCity(destCity);

        const get = (primary, fallback) => primary ?? fallback ?? "—";
        setForm((prev) => ({
          ...prev,
          client: get(s.full_name, s.enquiry?.fullName),
          mobile: get(s.phone_number, s.enquiry?.phoneNumber),
          email: get(s.email, s.enquiry?.email),
          serviceRequired:
            SERVICE_TYPE_DISPLAY[s.service_type] ||
            SERVICE_TYPE_DISPLAY[s.enquiry?.serviceType] ||
            "—",
          movingFrom: get(s.origin_address),
          movingTo: s.destination_addresses?.[0]?.address || "—",
          moveDate: s.packing_date_from || today,
          jobType: s.service_type === "localMove" ? "Local" : "International",
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

  // Fetch pricing
  useEffect(() => {
    const fetchLivePricing = async () => {
      if (!destinationCity) {
        setPricingRanges([]);
        return;
      }
      try {
        const params = new URLSearchParams();
        params.append("pricing_city", destinationCity);
        params.append("move_type", "1");
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
        setPriceError(`No pricing found for ${destinationCity}. Please contact administrator.`);
        setPricingRanges([]);
      }
    };
    fetchLivePricing();
  }, [destinationCity]);

  // Fetch dynamic Includes & Excludes based on city
// Fetch ALL Includes & Excludes (Global — appears in every quote)
  useEffect(() => {
    const fetchIncludesExcludes = async () => {
      try {
        setLoadingServices(true);

        const [includeRes, excludeRes] = await Promise.all([
          apiClient.get("/inclusion-exclusion/?type=include"),
          apiClient.get("/inclusion-exclusion/?type=exclude"),
        ]);

        setDynamicIncludes(includeRes.data);
        setDynamicExcludes(excludeRes.data);
      } catch (err) {
        console.error("Failed to load includes/excludes:", err);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchIncludesExcludes();
  }, []); // ← No dependency on city → loads once

  // Update form when dynamic services load
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      includedServices: dynamicIncludes.reduce((acc, item) => ({
        ...acc,
        [item.id]: prev.includedServices[item.id] || false,
      }), {}),
      excludedServices: dynamicExcludes.reduce((acc, item) => ({
        ...acc,
        [item.id]: prev.excludedServices[item.id] || false,
      }), {}),
    }));
  }, [dynamicIncludes, dynamicExcludes]);

  const totalVolume =
    survey?.articles
      ?.reduce((sum, a) => sum + parseFloat(a.volume || 0) * (a.quantity || 0), 0)
      ?.toFixed(2) || "0.00";

  useEffect(() => {
    if (!totalVolume || totalVolume <= 0 || pricingRanges.length === 0) {
      setForm((prev) => ({ ...prev, amount: "" }));
      return;
    }

    const volume = parseFloat(totalVolume);
    const applicableRange = pricingRanges.find((r) => volume >= r.min && volume <= r.max);

    if (!applicableRange) {
      setPriceError(`No pricing range found for volume ${volume} CBM in ${destinationCity}.`);
      setForm((prev) => ({ ...prev, amount: "" }));
      return;
    }

    const calculatedAmount =
      applicableRange.rateType === "flat"
        ? applicableRange.rate
        : applicableRange.rate * volume;

    setForm((prev) => ({ ...prev, amount: calculatedAmount.toFixed(2) }));
    setPriceError("");
  }, [totalVolume, pricingRanges, destinationCity]);

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
      setSurvey((prev) => ({ ...prev, signature_uploaded: true }));
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
      included_services: Object.keys(form.includedServices).filter((k) => form.includedServices[k]),
      excluded_services: Object.keys(form.excludedServices).filter((k) => form.excludedServices[k]),
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
    <div className="bg-gray-50 min-h-screen">
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSave}
        customerName={form.client}
      />

      <div className="mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-2 px-8 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-medium">Create Quotation</h2>
          <button onClick={() => navigate(-1)} className="text-4xl hover:opacity-80">×</button>
        </div>

        {message && <div className="m-6 p-4 bg-green-100 text-green-700 rounded-lg text-center font-medium">{message}</div>}
        {error && <div className="m-6 p-4 bg-red-100 text-red-700 rounded-lg text-center">{error}</div>}

        <div className="p-8 space-y-8">
          {/* Pricing Location Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Pricing Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">Destination City</label>
                <input type="text" value={destinationCity || "Not specified"} readOnly className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">Country</label>
                <input type="text" value="Qatar" readOnly className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-900 font-medium" />
              </div>
            </div>
          </div>

          {/* Form fields... (serial no, date, client, etc.) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quotation No.</label>
              <input type="text" value={form.serialNo} onChange={(e) => setForm({ ...form, serialNo: e.target.value })} className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {["Client Name", "Mobile", "Email"].map((label, i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type="text" value={[form.client, form.mobile, form.email][i]} readOnly className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50" />
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

          {/* Volume and Pricing */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
            <h3 className="text-xl font-medium text-center mb-4">Quotation Amount</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Total Volume</p>
                <div className="text-2xl font-medium text-green-600">{totalVolume} <span className="text-lg">CBM</span></div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Pricing Location</p>
                <div className="text-lg font-medium text-blue-600">{destinationCity || "Not specified"}</div>
              </div>
            </div>
            {priceError ? (
              <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 text-center text-red-700 font-medium">{priceError}</div>
            ) : (
              <div className="text-center">
                <p className="text-5xl font-medium text-[#4c7085]">{form.amount || "0.00"} <span className="text-3xl">QAR</span></p>
              </div>
            )}
          </div>

          {/* DYNAMIC Includes / Excludes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 border-2 border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 text-center text-lg font-medium">Service Includes</div>
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 text-center text-lg font-medium">Service Excludes</div>

            <div className="p-6 space-y-4 bg-gray-50 max-h-96 overflow-y-auto">
              {loadingServices ? (
                <p className="text-center text-gray-500">Loading services...</p>
              ) : dynamicIncludes.length === 0 ? (
                <p className="text-center text-gray-500">No included services defined for {destinationCity}</p>
              ) : (
                dynamicIncludes.map((service) => (
                  <label key={service.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.includedServices[service.id] || false}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          includedServices: { ...form.includedServices, [service.id]: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-800">• {service.text}</span>
                  </label>
                ))
              )}
            </div>

            <div className="p-6 space-y-4 bg-red-50 border-l-2 border-red-200 max-h-96 overflow-y-auto">
              {loadingServices ? (
                <p className="text-center text-gray-500">Loading...</p>
              ) : dynamicExcludes.length === 0 ? (
                <p className="text-center text-gray-500">No excluded services defined</p>
              ) : (
                dynamicExcludes.map((service) => (
                  <label key={service.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.excludedServices[service.id] || false}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          excludedServices: { ...form.excludedServices, [service.id]: e.target.checked },
                        })
                      }
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-gray-800">• {service.text}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block font-medium">Total Amount</label>
              <input type="text" readOnly value={form.amount ? `${form.amount} QAR` : ""} className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50" />
            </div>
            <div>
              <label className="block font-medium">Advance</label>
              <input
                type="number"
                step="0.01"
                value={form.advance}
                onChange={(e) => setForm({ ...form, advance: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block font-medium">Balance</label>
              <input
                type="text"
                readOnly
                value={form.amount && form.advance ? `${(parseFloat(form.amount) - parseFloat(form.advance)).toFixed(2)} QAR` : ""}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-green-50 font-medium text-green-700"
              />
            </div>
          </div>

          {/* Digital Signature & Create Button */}
          <div>
            <h3 className="font-medium mb-1">Digital Signature</h3>
            <div className="bg-gray-50 p-6 rounded-lg border text-center">
              {survey?.signature_uploaded ? (
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                  <div className="text-center md:text-left">
                    <p className="font-medium text-green-700">Digitally Signed</p>
                    <p className="text-sm text-gray-600">Customer signature is attached</p>
                  </div>
                  <button onClick={openSignatureModal} className="px-4 py-2 bg-green-600 text-white rounded-lg">Change</button>
                </div>
              ) : (
                <button onClick={openSignatureModal} className="px-8 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Add Digital Signature
                </button>
              )}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleCreate}
              disabled={!form.amount || priceError}
              className={`w-full max-w-md mx-auto py-3 px-6 text-lg font-medium rounded-lg shadow-lg transition transform ${
                !form.amount || priceError
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white hover:from-[#3a586d] hover:to-[#54738a] hover:scale-105"
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