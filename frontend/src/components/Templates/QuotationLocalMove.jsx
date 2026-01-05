import React from "react";
// Import your logo (adjust path according to your project structure)
import CompanyLogo from "../../assets/images/logo-quotation.webp";  // ← Change path if needed

export default function QuotationLocalMove({
  quotation,
  survey,
  name,                    // customer name
  phone,
  email,
  service,                 // service type
  movingTo,
  moveDate,
  totalAmount,
  advance,
  balance,
  baseAmount,
  additionalChargesTotal,
  additionalCharges,
  includedServices,
  excludedServices,
}) {
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');

  const quoteNumber = quotation?.quotation_id || "AMS/2600001";
  const totalVolume = survey?.articles?.reduce(
    (sum, a) => sum + parseFloat(a.volume || 0) * (a.quantity || 0),
    0
  )?.toFixed(2) || "0.00";

  const currency = "QAR";

  // Company static contact details (you can later make them dynamic via API)
  const companyContact = {
    person: "Muhammad Kp",
    email: "Freight@almasint.com",
    mobile: "0097450136999"
  };

  return (
    <div
      style={{
        padding: "40px 30px",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11pt",
        color: "#000",
        lineHeight: "1.45",
        maxWidth: "210mm", // A4 width - good for printing
        margin: "0 auto",
        backgroundColor: "#fff",
      }}
    >
      {/* Header with Real Company Logo */}
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <img
          src={CompanyLogo}
          alt="ALMAS MOVERS"
          style={{
            maxWidth: "280px",     // ← adjust size as needed
            height: "auto",
            display: "block",
            margin: "0 auto 15px"
          }}
        />
      </div>

      {/* Quote Info */}
      <table style={{ width: "100%", marginBottom: "30px" }}>
        <tbody>
          <tr>
            <td style={{ width: "60%" }} />
            <td style={{ textAlign: "right", fontSize: "10pt" }}>
              <strong>Quote No:</strong> {quoteNumber}<br />
              <strong>Date:</strong> {today}<br />
              <strong>Contact Person:</strong> {companyContact.person}<br />
              <strong>Email:</strong> {companyContact.email}<br />
              <strong>Mobile No:</strong> {companyContact.mobile}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Prominent Rate Header */}
      <div
        style={{
          backgroundColor: "#003087", // dark blue - you can change to your brand color
          color: "white",
          textAlign: "center",
          padding: "14px",
          fontSize: "20pt",
          fontWeight: "bold",
          margin: "25px 0",
          borderRadius: "4px",
        }}
      >
        Your Rate is {Number(totalAmount).toFixed(2)} {currency}
      </div>

      {/* Greeting & Important Intro Text */}
      <p style={{ marginBottom: "8px", fontWeight: "bold" }}>
        Dear {name || "Customer"},
      </p>

      <p style={{ marginBottom: "20px", textAlign: "justify" }}>
        Thank you for the opportunity to quote for your planned relocation, please note, our rates are valid for <strong>60 days</strong> from date of quotation. 
        You may confirm acceptance of our offer by signing and returning a copy of this document via email. 
        If the signed acceptance has not been received at the time of booking, it will be understood that you have read and accepted our quotation and related terms and conditions. 
        Please do not hesitate to contact us should you have any questions or require additional information.
      </p>

      {/* Service Summary */}
      <table style={{ width: "100%", marginBottom: "30px", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ width: "20%", fontWeight: "bold", padding: "6px 0" }}>Service Type:</td>
            <td style={{ width: "30%" }}>{service || "Local Move"}</td>
            <td style={{ width: "20%", fontWeight: "bold", padding: "6px 0" }}>Commodity:</td>
            <td style={{ width: "30%" }}>Used Household goods</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold", padding: "6px 0" }}>Origin:</td>
            <td>{survey?.origin_address || "Doha, Qatar"}</td>
            <td style={{ fontWeight: "bold", padding: "6px 0" }}>Destination:</td>
            <td>{movingTo || survey?.destination_addresses?.[0]?.address || "Doha, Qatar"}</td>
          </tr>
        </tbody>
      </table>

      {/* Charges Breakdown */}
      <h3 style={{ fontSize: "13pt", margin: "25px 0 10px", color: "#003087" }}>
        Breakdown of Charges (All prices in {currency})
      </h3>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px" }}>
        <tbody>
          <tr style={{ borderBottom: "1px solid #aaa" }}>
            <td style={{ padding: "9px 6px", fontWeight: "bold" }}>Lump sum moving charges:</td>
            <td style={{ padding: "9px 6px", textAlign: "right", fontWeight: "bold" }}>
              {Number(baseAmount || totalAmount || 0).toFixed(2)}
            </td>
          </tr>

          {additionalCharges?.map((charge, index) => (
            <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px 6px" }}>{charge.service?.name || "Additional Service"}:</td>
              <td style={{ padding: "8px 6px", textAlign: "right" }}>
                {Number(charge.price_per_unit * (charge.quantity || 1)).toFixed(2)}
              </td>
            </tr>
          ))}

          <tr style={{ backgroundColor: "#f8f8f8", fontWeight: "bold" }}>
            <td style={{ padding: "10px 6px" }}>Total Price:</td>
            <td style={{ padding: "10px 6px", textAlign: "right" }}>
              {Number(totalAmount).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td style={{ padding: "9px 6px" }}>Advance:</td>
            <td style={{ padding: "9px 6px", textAlign: "right" }}>
              {Number(advance).toFixed(2)}
            </td>
          </tr>
          <tr style={{ fontWeight: "bold" }}>
            <td style={{ padding: "9px 6px" }}>Balance:</td>
            <td style={{ padding: "9px 6px", textAlign: "right" }}>
              {Number(balance).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Payment Terms - Very Important */}
      <div style={{ margin: "30px 0", lineHeight: "1.6" }}>
        <strong>PAYMENT TERMS :-</strong><br /><br />
        Payment Terms: 20% advance payment upon work confirmation, the full payment required at the day of work completion.<br /><br />
        Payment may be made in any of the following ways:<br /><br />
        A. Cash / Cheque (ALMAS MOVERS SERVICES)<br />
        B. Wire / Telegraphic transfer<br />
        C. LPO – From approved companies<br />
        D. Card payment (*2.50% Surcharge apply)
      </div>

      {/* Insurance */}
      <div style={{ margin: "25px 0" }}>
        <strong>Insurance :-</strong><br />
        Transit insurance coverage is available upon request at an additional cost. 
        Basic carrier liability is included up to a limited amount. 
        Please contact us for detailed coverage options and pricing.
      </div>

      {/* Includes / Excludes Side by Side */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "25px", margin: "35px 0" }}>
        <div style={{ flex: 1 }}>
          <div style={{ backgroundColor: "#003087", color: "white", padding: "10px", textAlign: "center", fontWeight: "bold" }}>
            Service Includes
          </div>
          <ul style={{ paddingLeft: "24px", marginTop: "12px", fontSize: "10.5pt" }}>
            {includedServices?.length > 0 ? (
              includedServices.map((item, i) => <li key={i} style={{ marginBottom: "6px" }}>{item}</li>)
            ) : (
              <>
                <li>Professional packing of all household items</li>
                <li>Loading and unloading</li>
                <li>Transportation</li>
                <li>Basic handling of furniture</li>
              </>
            )}
          </ul>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ backgroundColor: "#c8102e", color: "white", padding: "10px", textAlign: "center", fontWeight: "bold" }}>
            Service Excludes
          </div>
          <ul style={{ paddingLeft: "24px", marginTop: "12px", fontSize: "10.5pt" }}>
            {excludedServices?.length > 0 ? (
              excludedServices.map((item, i) => <li key={i} style={{ marginBottom: "6px" }}>{item}</li>)
            ) : (
              <>
                <li>Customs duties (if applicable)</li>
                <li>Storage beyond agreed period</li>
                <li>Packing materials not requested</li>
                <li>Any items not listed in survey</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Signature Area */}
      <div style={{ marginTop: "70px", borderTop: "1px solid #333", paddingTop: "25px" }}>
        <strong>Accepted by:</strong> _______________________________________ &nbsp;&nbsp;&nbsp;&nbsp;
        <strong>Date:</strong> ______________________
      </div>

      {/* Optional: Crew & Team Photos (last page) */}
      {/* Uncomment and add real images when ready */}
      {/* 
      <div style={{ pageBreakBefore: "always", marginTop: "80px", textAlign: "center" }}>
        <h3 style={{ color: "#003087", marginBottom: "25px" }}>Our Professional Team & Fleet</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", justifyContent: "center" }}>
          <img src="/assets/crew-1.jpg" alt="Team" style={{ width: "240px", height: "160px", objectFit: "cover", borderRadius: "6px" }} />
          <img src="/assets/truck-1.jpg" alt="Truck" style={{ width: "240px", height: "160px", objectFit: "cover", borderRadius: "6px" }} />
        </div>
      </div>
      */}
    </div>
  );
}