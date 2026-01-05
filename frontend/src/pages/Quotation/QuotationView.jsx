import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEye, FaPrint } from "react-icons/fa";
import apiClient from "../../api/apiClient";
import Loading from "../../components/Loading";

const SERVICE_TYPE_DISPLAY = {
  localMove: "Local Move",
  internationalMove: "International Move",
  carExport: "Car Import and Export",
  storageServices: "Storage Services",
  logistics: "Logistics",
};

export default function QuotationView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [currentSignature, setCurrentSignature] = useState(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [baseAmount, setBaseAmount] = useState(0);
  const [additionalChargesTotal, setAdditionalChargesTotal] = useState(0);
  const [pricingRanges, setPricingRanges] = useState([]);
  const [destinationCity, setDestinationCity] = useState("");
  const [includedServices, setIncludedServices] = useState([]);
  const [excludedServices, setExcludedServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [quoteNotes, setQuoteNotes] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [insurancePlans, setInsurancePlans] = useState([]);

  const safeParse = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const checkSignatureExists = async (quotationId) => {
    try {
      const signatureRes = await apiClient.get(`/quotation-create/${quotationId}/signature/`);
      setHasSignature(!!signatureRes.data.signature_url);
      setCurrentSignature(signatureRes.data.signature_url);
    } catch (err) {
      setHasSignature(false);
    }
  };

  const fetchServiceNames = async () => {
    if (!quotation) return;

    try {
      const includePromises = (quotation.included_services || []).map((id) =>
        apiClient.get(`/inclusion-exclusion/${id}/`).then((r) => r.data).catch(() => null)
      );
      const excludePromises = (quotation.excluded_services || []).map((id) =>
        apiClient.get(`/inclusion-exclusion/${id}/`).then((r) => r.data).catch(() => null)
      );

      const [includeResults, excludeResults] = await Promise.all([
        Promise.all(includePromises),
        Promise.all(excludePromises),
      ]);

      setIncludedServices(includeResults.filter((r) => r?.text).map((r) => r.text));
      setExcludedServices(excludeResults.filter((r) => r?.text).map((r) => r.text));
    } catch (err) {
      setIncludedServices([]);
      setExcludedServices([]);
    }
  };

  useEffect(() => {
    const fetchLivePricing = async () => {
      if (!destinationCity) return;
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
      } catch (err) {
        setPricingRanges([]);
      }
    };
    fetchLivePricing();
  }, [destinationCity]);

  useEffect(() => {
    if (!survey || !pricingRanges.length) return;
    const totalVolume =
      survey.articles?.reduce(
        (sum, a) => sum + parseFloat(a.volume || 0) * (a.quantity || 0),
        0
      ) || 0;

    if (totalVolume <= 0) {
      setBaseAmount(0);
      return;
    }

    const volume = parseFloat(totalVolume);
    const applicableRange = pricingRanges.find((r) => volume >= r.min && volume <= r.max);

    if (!applicableRange) {
      setBaseAmount(0);
      return;
    }

    const calculatedBaseAmount =
      applicableRange.rateType === "flat" ? applicableRange.rate : applicableRange.rate * volume;

    setBaseAmount(calculatedBaseAmount);
  }, [survey, pricingRanges]);

  useEffect(() => {
    fetchServiceNames();
  }, [quotation]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const quotRes = await apiClient.get(`/quotation-create/${id}/`);
        const quot = quotRes.data;
        setQuotation(quot);
        setAdditionalCharges(quot.additional_charges || []);
        if (quot.survey_id) {
          const surveyRes = await apiClient.get(`/surveys/${quot.survey_id}/`);
          const surveyData = surveyRes.data;
          setSurvey(surveyData);
          const destCity = surveyData.destination_addresses?.[0]?.city || "";
          setDestinationCity(destCity);
          await checkSignatureExists(quot.quotation_id);
        }
      } catch (err) {
        setError("Failed to load quotation.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchSelectedServices = async () => {
      if (!quotation?.selected_services || quotation.selected_services.length === 0) {
        setSelectedServices([]);
        return;
      }
      try {
        const promises = quotation.selected_services.map((id) =>
          apiClient.get(`/services/${id}/`).then((r) => r.data).catch(() => null)
        );
        const results = await Promise.all(promises);
        setSelectedServices(results.filter((s) => s?.name).map((s) => s.name));
      } catch (err) {
        setSelectedServices([]);
      }
    };
    fetchSelectedServices();
  }, [quotation]);

  useEffect(() => {
    const fetchPrintData = async () => {
      try {
        const [notesRes, termsRes, insRes] = await Promise.all([
          apiClient.get('/quote-notes/'),
          apiClient.get('/payment-terms/'),
          apiClient.get('/insurance-plans/')
        ]);
        setQuoteNotes(notesRes.data.filter(n => n.is_active));
        setPaymentTerms(termsRes.data.filter(t => t.is_active));
        setInsurancePlans(insRes.data.filter(i => i.is_active));
      } catch (err) {
        console.error("Failed to load print data");
      }
    };
    fetchPrintData();
  }, []);

  const viewSignature = async () => {
    if (!quotation) return;
    try {
      const signatureRes = await apiClient.get(`/quotation-create/${quotation.quotation_id}/signature/`);
      setCurrentSignature(signatureRes.data.signature_url);
      setIsSignatureModalOpen(true);
    } catch (err) {
      setError("Failed to load signature");
    }
  };

  const handlePrint = () => {
    const customerName = get(survey.full_name, survey.enquiry?.fullName);
    const rate = finalAmount.toFixed(2) + " QAR";
    const serviceType = service;
    const commodity = "Used Household goods";
    const countryMap = { QA: "Qatar" };
    const origin = survey.origin_city + " " + (countryMap[survey.origin_country] || survey.origin_country);
    const destination =
      survey.destination_addresses?.[0]?.city +
      " " +
      (countryMap[survey.destination_addresses?.[0]?.country] || survey.destination_addresses?.[0]?.country);
    const lumpSum = baseAmount.toFixed(2);
    let curtains = "00.00";
    let wall = "00.00";
    let otherAdditional = [];
    additionalCharges.forEach((charge) => {
      const sub = charge.total.toFixed(2);
      const nameLower = charge.service_name.toLowerCase();
      if (nameLower.includes("curtain")) {
        curtains = sub;
      } else if (nameLower.includes("wall")) {
        wall = sub;
      } else {
        otherAdditional.push(`${charge.service_name}: ${sub}`);
      }
    });
    const totalPrice = totalAmount.toFixed(2);
    const advanceAmt = advance.toFixed(2);
    const balanceAmt = balance.toFixed(2);
    const discountLine = discount > 0 ? `Discount: ${discount.toFixed(2)}<br>` : "";
    const includeBullets = includedServices.map((s) => `<li>${s}</li>`).join("");
    const excludeBullets = excludedServices.map((s) => `<li>${s}</li>`).join("");
    const moveDate = survey.packing_date_from || "TBA";
    const noteText = `Survey Remarks<br>${survey.work_description || "Add Remark"}<br>Move date : ${moveDate} Required time for moving : 1 day. Working time : 8 AM to 7 PM (Max till 9 PM From Sunday to Saturday ) We assuming normal good access at destination office building ,please note any special requirement at origin & destination building which shall arranged by you (i.e. gate pass , parking permit ) NO HIDDEN FEE'S - You may please read below our service inclusion and exclusion.`;
    const insuranceText = insurancePlans.map(plan => `${plan.name}<br>${plan.description.replace(/\n/g, '<br>')}<br>Type: ${plan.calculation_type_display}<br>Rate: ${plan.rate}%<br>Min Premium: QAR ${plan.minimum_premium}`).join('<br><br>');
    const paymentText = paymentTerms.map(term => `${term.name}<br>${term.description.replace(/\n/g, '<br>')}`).join('<br><br>');
    const generalTerms = quoteNotes.map(note => `<h3>${note.title}</h3><p>${note.content.replace(/\n/g, '<br>')}</p>`).join('');
    const sign = hasSignature ? `<img src="${currentSignature}" alt="Signature" style="width:200px;height:auto;" />` : "";
    const contactPerson = "Muhammad Kp";
    const email = "Freight@almasint.com";
    const mobile = "0097450136999";
    const address = "Almas Movers Services<br>Address xx xx x xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    const logoFooterText = "IAM RPP SIAMX ISO Company Green Accredited";

    const printContent = `
      <div class="content">
        <div class="section">
          <h1>ALMAS MOVERS INTERNATIONAL</h1>
          <div class="header">
            Quote No : ${quotation.quotation_id}<br>
            Date : ${quotation.date}<br>
            Contact Person : ${contactPerson}<br>
            Email : ${email}<br>
            Mobile No : ${mobile}
          </div>
          <h2>Your Rate is ${rate}</h2>
          <p>Dear ${customerName} (Customer name)</p>
          <p>Thank you for the opportunity to quote for your planned relocation, please note, our rates are valid for 60 days from date of quotation. You may confirm acceptance of our offer by signing and returning a copy of this document email. If the signed acceptance has not been received at the time of booking, it will be understood that you have read and accepted our quotation and related terms and conditions. Please do not hesitate to contact us should you have any questions or require additional information.</p>
          <div class="service-box">
            Service Type : ${serviceType} &nbsp;&nbsp;&nbsp;&nbsp; Commodity : ${commodity}<br>
            Origin : ${origin} &nbsp;&nbsp;&nbsp;&nbsp; Destination : ${destination}
          </div>
          <h3>Breakdown of Charges (All prices in QAR)</h3>
          <p>Lump sum moving charges: ${lumpSum}</p>
          <p>Curtains installation: ${curtains}</p>
          <p>Wall installation: ${wall}</p>
          ${otherAdditional.map((line) => `<p>${line}</p>`).join("")}
          ${discountLine}
          <p>Total Price : ${totalPrice}</p>
          <p>Advance : ${advanceAmt}</p>
          <p>Balance : ${balanceAmt}</p>
        </div>
        <div style="page-break-before: always;" class="section">
          <h3>Service Includes :-</h3>
          <ul>
            ${includeBullets}
          </ul>
          <h3>Service Excludes :-</h3>
          <ul>
            ${excludeBullets}
          </ul>
          <h3>Note :-</h3>
          <p>${noteText}</p>
          <h3>Insurance :-</h3>
          <p>${insuranceText}</p>
        </div>
        <div style="page-break-before: always;" class="section">
          <h3>PAYMENT TERMS :-</h3>
          <p>${paymentText}</p>
          <h3>General Terms</h3>
          ${generalTerms}
        </div>
        <div style="page-break-before: always;" class="section">
          <h3>Sign</h3>
          ${sign}
        </div>
      </div>
      <div class="footer">
        <p style="text-align:center;">${address}</p>
        <p style="text-align:center;">${logoFooterText}</p>
      </div>
    `;

    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow.document.write("<html><head><title>Quotation Print</title>");
    printWindow.document.write("<style>");
    printWindow.document.write("@page { size: A4; margin: 1cm 1cm 3cm 1cm; }");
    printWindow.document.write("body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; margin: 0; padding: 0; }");
    printWindow.document.write(".content { padding: 1cm 1cm 0 1cm; margin-bottom: 3cm; }");
    printWindow.document.write(".footer { position: fixed; bottom: 0; left: 0; width: 100%; height: 3cm; padding: 0 1cm; box-sizing: border-box; text-align: center; }");
    printWindow.document.write("h1 { color: #ff9900; font-size: 24pt; }");
    printWindow.document.write("h2 { font-size: 18pt; text-align: center; font-weight: bold; }");
    printWindow.document.write("h3 { font-size: 12pt; }");
    printWindow.document.write(".header { text-align: right; }");
    printWindow.document.write(".service-box { border: 2px solid #00aaff; border-radius: 10px; padding: 10px; }");
    printWindow.document.write("ul { list-style-type: disc; padding-left: 20px; }");
    printWindow.document.write("p { margin: 5px 0; }");
    printWindow.document.write("</style></head><body>");
    printWindow.document.write(printContent);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const get = (primary, fallback) => primary ?? fallback ?? "Not filled";

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loading /></div>;
  if (error) return <div className="text-center text-red-600 p-5">{error}</div>;
  if (!quotation || !survey) return null;

  const name = get(survey.full_name, survey.enquiry?.fullName);
  const phone = get(survey.phone_number, survey.enquiry?.phoneNumber);
  const email = get(survey.email, survey.enquiry?.email);
  const service = SERVICE_TYPE_DISPLAY[survey.service_type] || "Not filled";
  const movingTo = survey.destination_addresses?.[0]?.address || "Not filled";
  const moveDate = survey.packing_date_from || "Not filled";

  const totalAmount = safeParse(quotation?.amount);
  const discount = safeParse(quotation?.discount);
  const advance = safeParse(quotation?.advance);
  const finalAmount = safeParse(quotation?.final_amount);
  const balance = safeParse(quotation?.balance);

  return (
    <>
      {isSignatureModalOpen && currentSignature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium">Digital Signature</h3>
              <button onClick={() => setIsSignatureModalOpen(false)} className="text-3xl">×</button>
            </div>
            <img src={currentSignature} alt="Signature" className="w-full rounded-lg border" />
            <button
              onClick={() => setIsSignatureModalOpen(false)}
              className="mt-6 w-full bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-100 min-h-screen rounded-lg">
        <div className="bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white py-4 px-8 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
            >
              <FaArrowLeft className="w-5 h-5" />
              <span className="font-medium text-sm">Back</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
            >
              <FaPrint className="w-5 h-5" />
              <span className="font-medium text-sm">Print</span>
            </button>
            <h2 className="text-lg font-medium">Quotation Details</h2>
          </div>
        </div>

        <div className="p-4 space-y-10">
          <div className="bg-[#4c7085]/5 border border-[#4c7085]/30 rounded-xl p-6">
            <h3 className="text-lg font-medium text-[#4c7085] mb-4">Quotation Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#4c7085] mb-2">Quotation ID</label>
                <input
                  type="text"
                  value={quotation.quotation_id || "Not specified"}
                  readOnly
                  className="w-full rounded-lg border border-[#6b8ca3]/50 bg-white px-4 py-3 text-sm text-[#4c7085] font-medium cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4c7085] mb-2">Date</label>
                <input
                  type="text"
                  value={quotation.date || "Not specified"}
                  readOnly
                  className="w-full rounded-lg border border-[#6b8ca3]/50 bg-white px-4 py-3 text-sm text-[#4c7085] font-medium cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#4c7085] mb-2">Client Name</label>
              <input
                type="text"
                value={name}
                readOnly
                className="w-full rounded-lg border-2 border-[#4c7085] px-4 py-3 bg-gray-100 text-sm text-[#4c7085] font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4c7085] mb-2">Mobile</label>
              <input
                type="text"
                value={phone}
                readOnly
                className="w-full rounded-lg border-2 border-[#4c7085] px-4 py-3 bg-gray-100 text-sm text-[#4c7085] font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4c7085] mb-2">Email</label>
              <input
                type="text"
                value={email}
                readOnly
                className="w-full rounded-lg border-2 border-[#4c7085] px-4 py-3 bg-gray-100 text-sm text-[#4c7085] font-medium cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-6">
            {[
              { label: "Service Required", value: service },
              { label: "Moving From", value: get(survey.origin_address) },
              { label: "Moving To", value: movingTo },
              { label: "Date of Move", value: moveDate },
            ].map((item) => (
              <div key={item.label}>
                <label className="block text-sm font-medium text-[#4c7085] mb-2">{item.label}</label>
                <input
                  type="text"
                  value={item.value}
                  readOnly
                  className="w-full rounded-lg border-2 border-[#4c7085] px-4 py-3 bg-gray-100 text-sm text-[#4c7085] font-medium cursor-not-allowed"
                />
              </div>
            ))}
          </div>

          {additionalCharges.length > 0 && (
            <div className="bg-[#6b8ca3]/5 border-2 border-[#6b8ca3]/30 rounded-xl p-6">
              <h3 className="text-xl font-medium text-[#4c7085] mb-4">Additional Services</h3>
              <div className="space-y-4">
                {additionalCharges.map((charge, index) => {
                  const quantity = charge.quantity || 1;
                  const subtotal = charge.total;
                  return (
                    <div key={index} className="bg-white border border-[#4c7085]/20 rounded-lg p-5">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <div className="font-medium text-gray-800">{charge.service_name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {charge.price_per_unit} QAR × {quantity} unit(s)
                          </div>
                        </div>
                        <div className="text-right text-xl font-medium text-[#4c7085]">
                          {subtotal.toFixed(2)} QAR
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-[#4c7085]/10 to-[#6b8ca3]/10 border-2 border-[#4c7085]/30 rounded-xl p-4">
            <h3 className="text-2xl font-medium text-center text-[#4c7085] mb-8">Your Rate</h3>

            <div className="space-y-6 mb-8">
              {selectedServices.length > 0 ? (
                selectedServices.map((serviceName, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-6 shadow-md border border-[#4c7085]/20 flex items-center justify-between"
                  >
                    <div className="text-lg font-medium text-gray-800">{serviceName}</div>
                    <div className="w-8 h-8 rounded-full bg-[#4c7085] border-2 border-[#4c7085] flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 py-6">No additional services selected</p>
              )}
            </div>

            <div className="grid gap-6 bg-white p-4 rounded-2xl shadow-xl border border-[#4c7085]/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                  <label className="block text-sm font-medium text-[#4c7085]">Advance</label>
                  <p className="text-2xl font-medium text-[#4c7085] mt-2">
                    {advance.toFixed(2)} QAR
                  </p>
                </div>
                <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                  <label className="block text-sm font-medium text-[#4c7085]">Discount</label>
                  <p className="text-2xl font-medium text-[#4c7085] mt-2">
                    {discount.toFixed(2)} QAR
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                  <label className="block text-sm font-medium text-[#4c7085]">Total Amount</label>
                  <p className="text-2xl font-medium text-[#4c7085] mt-2">
                    {totalAmount.toFixed(2)} QAR
                  </p>
                </div>

                <div className="bg-[#4c7085]/5 p-5 rounded-lg text-center">
                  <label className="block text-sm font-medium text-[#4c7085]">Balance</label>
                  <p className="text-2xl font-medium text-indigo-700 mt-2">
                    {balance.toFixed(2)} QAR
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-2 border-[#4c7085]/30 rounded-xl overflow-hidden">
            <div className="bg-[#4c7085] text-white p-5 text-center font-medium text-lg">Service Includes</div>
            <div className="bg-red-700 text-white p-5 text-center font-medium text-lg">Service Excludes</div>

            <div className="p-4 bg-gray-100 max-h-96 overflow-y-auto space-y-4">
              {includedServices.length > 0 ? (
                includedServices.map((service, i) => (
                  <div key={`inc-${i}`} className="flex items-start space-x-4">
                    <span className="text-[#4c7085] mt-1 text-xl">✓</span>
                    <span className="text-base font-medium">{service}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No services included</p>
              )}
            </div>

            <div className="p-4 bg-red-50 max-h-96 overflow-y-auto space-y-4">
              {excludedServices.length > 0 ? (
                excludedServices.map((service, i) => (
                  <div key={`exc-${i}`} className="flex items-start space-x-4">
                    <span className="text-red-600 mt-1 text-xl">✕</span>
                    <span className="text-base font-medium">{service}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No services excluded</p>
              )}
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-xl border border-[#4c7085]/30">
            <h3 className="text-xl font-medium text-[#4c7085] mb-4">Digital Signature</h3>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              {hasSignature ? (
                <>
                  <div>
                    <p className="text-lg font-medium text-green-700">✓ Digitally Signed</p>
                    <p className="text-gray-700">Customer signature is attached</p>
                  </div>
                  <button
                    onClick={viewSignature}
                    className="px-8 py-2 bg-[#4c7085] hover:bg-[#6b8ca3] text-white rounded-lg flex items-center gap-2 text-sm font-medium"
                  >
                    <FaEye /> View Signature
                  </button>
                </>
              ) : (
                <div className="text-center w-full">
                  <p className="text-gray-700 mb-4">No signature uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}