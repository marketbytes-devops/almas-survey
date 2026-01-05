import React from "react";
import CompanyLogo from "../../assets/images/logo-quotation.webp";

export default function QuotationLocalMove({
  quotation,
  survey,
  name,
  phone,
  email,
  service,
  movingTo,
  moveDate,
  totalAmount,
  advance,
  balance,
  discount,
  finalAmount,
  baseAmount,
  additionalChargesTotal,
  additionalCharges,
  includedServices,
  excludedServices,
  notes,
  insurancePlans,
  generalTerms,
}) {
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');

  const quoteNumber = quotation?.quotation_id || "AMS/2600001";
  const currency = "QAR";

  const companyContact = {
    person: "Muhammad Kp",
    email: "Freight@almasint.com",
    mobile: "0097450136999"
  };

  const companyAddress = "P.O. Box 24665, Doha, Qatar";

  return (
    <div style={{
      fontFamily: "'Helvetica', 'Arial', sans-serif",
      fontSize: "11pt",
      color: "#000",
      lineHeight: "1.6",
      backgroundColor: "#fff",
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          html, body {
            height: auto;
            margin: 0;
            padding: 0;
          }
          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
            min-height: 257mm;
            position: relative;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
        }
        @media screen {
          .print-page {
            margin-bottom: 30px;
            padding-bottom: 30px;
            border-bottom: 2px dashed #ccc;
          }
        }
      `}} />

      <div className="print-page" style={{ padding: "20px 40px", maxWidth: "210mm", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src={CompanyLogo}
            alt="ALMAS MOVERS"
            style={{ maxWidth: "280px", height: "auto", display: "block", margin: "0 auto" }}
          />
        </div>

        <table style={{ width: "100%", marginBottom: "25px", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%" }}></td>
              <td style={{ textAlign: "right", fontSize: "10.5pt", verticalAlign: "top" }}>
                <strong>Quote No:</strong> {quoteNumber}<br />
                <strong>Date:</strong> {today}<br />
                <strong>Contact Person:</strong> {companyContact.person}<br />
                <strong>Email:</strong> {companyContact.email}<br />
                <strong>Mobile No:</strong> {companyContact.mobile}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{
          backgroundColor: "#003087",
          color: "#ffffff",
          textAlign: "center",
          padding: "20px",
          fontSize: "24pt",
          fontWeight: "bold",
          margin: "25px 0",
          borderRadius: "4px",
        }}>
          Your Rate is {Number(finalAmount || totalAmount).toFixed(2)} {currency}
        </div>

        <p style={{ marginBottom: "8px", fontWeight: "bold", fontSize: "11pt" }}>
          Dear {name || "Valued Customer"},
        </p>
        <p style={{ marginBottom: "25px", textAlign: "justify", fontSize: "10.5pt" }}>
          Thank you for the opportunity to quote for your planned relocation, please note, our rates are valid for <strong>60 days</strong> from date of quotation. 
          You may confirm acceptance of our offer by signing and returning a copy of this document email. If the signed acceptance has not been received at the time of booking, 
          it will be understood that you have read and accepted our quotation and related terms and conditions. Please do not hesitate to contact us should you have any questions 
          or require additional information.
        </p>

        <h3 style={{ fontSize: "13pt", margin: "30px 0 15px", fontWeight: "bold" }}>
          Breakdown of Charges (All prices in {currency})
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px 0", fontSize: "10.5pt" }}>Lump sum moving charges:</td>
              <td style={{ padding: "8px 0", textAlign: "right", fontSize: "10.5pt" }}>
                {Number(baseAmount || totalAmount || 0).toFixed(2)}
              </td>
            </tr>
            {additionalCharges?.map((charge, index) => {
              const quantity = charge.per_unit_quantity || 1;
              const subtotal = charge.price_per_unit * quantity;
              return (
                <tr key={index}>
                  <td style={{ padding: "8px 0", fontSize: "10.5pt" }}>
                    {charge.service?.name || "Additional Service"}:
                  </td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontSize: "10.5pt" }}>
                    {Number(subtotal).toFixed(2)}
                  </td>
                </tr>
              );
            })}
            <tr style={{ fontWeight: "bold", borderTop: "1px solid #000", borderBottom: "1px solid #000" }}>
              <td style={{ padding: "10px 0", fontSize: "11pt" }}>Total Price:</td>
              <td style={{ padding: "10px 0", textAlign: "right", fontSize: "11pt" }}>
                {Number(totalAmount).toFixed(2)}
              </td>
            </tr>
            {discount > 0 && (
              <tr>
                <td style={{ padding: "8px 0", fontSize: "10.5pt" }}>Discount:</td>
                <td style={{ padding: "8px 0", textAlign: "right", fontSize: "10.5pt" }}>
                  -{Number(discount).toFixed(2)}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: "8px 0", fontSize: "10.5pt" }}>Advance:</td>
              <td style={{ padding: "8px 0", textAlign: "right", fontSize: "10.5pt" }}>
                {Number(advance).toFixed(2)}
              </td>
            </tr>
            <tr style={{ fontWeight: "bold" }}>
              <td style={{ padding: "8px 0", fontSize: "11pt" }}>Balance:</td>
              <td style={{ padding: "8px 0", textAlign: "right", fontSize: "11pt" }}>
                {Number(balance).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ textAlign: "center", fontSize: "10pt", marginTop: "40px", color: "#555" }}>
          <strong>Almas Movers Services</strong><br />
          {companyAddress}
        </div>
      </div>

      <div className="print-page" style={{ padding: "20px 40px", maxWidth: "210mm", margin: "0 auto" }}>
        <h3 style={{ fontSize: "13pt", marginBottom: "15px", fontWeight: "bold" }}>
          Service Includes :-
        </h3>
        <ul style={{ paddingLeft: "20px", margin: "0 0 30px", fontSize: "10.5pt", listStyleType: "disc" }}>
          {includedServices?.length > 0 ? (
            includedServices.map((item, i) => (
              <li key={i} style={{ marginBottom: "6px" }}>{item}</li>
            ))
          ) : (
            <>
              <li>Professional packing of household items</li>
              <li>Loading and unloading services</li>
              <li>Transportation to destination</li>
            </>
          )}
        </ul>

        <h3 style={{ fontSize: "13pt", marginBottom: "15px", fontWeight: "bold" }}>
          Service Excludes :-
        </h3>
        <ul style={{ paddingLeft: "20px", margin: "0 0 30px", fontSize: "10.5pt", listStyleType: "disc" }}>
          {excludedServices?.length > 0 ? (
            excludedServices.map((item, i) => (
              <li key={i} style={{ marginBottom: "6px" }}>{item}</li>
            ))
          ) : (
            <>
              <li>Storage charges beyond agreed period</li>
              <li>Customs duties and taxes</li>
              <li>Items not disclosed during survey</li>
            </>
          )}
        </ul>

        {notes?.length > 0 && notes.map((note, idx) => (
          <div key={idx} style={{ marginBottom: "25px" }}>
            <h3 style={{ fontSize: "13pt", marginBottom: "10px", fontWeight: "bold" }}>
              {note.title} :-
            </h3>
            <p style={{ fontSize: "10.5pt", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
              {note.content}
            </p>
          </div>
        ))}

        {!notes?.length && (
          <div style={{ marginBottom: "25px" }}>
            <h3 style={{ fontSize: "13pt", marginBottom: "10px", fontWeight: "bold" }}>
              Note :-
            </h3>
            <p style={{ fontSize: "10.5pt", lineHeight: "1.6" }}>
              All items will be handled with professional care. Any damages must be reported within 24 hours of delivery. 
              The customer is responsible for providing accurate information about items requiring special handling.
            </p>
          </div>
        )}

        {insurancePlans?.length > 0 && (
          <div style={{ marginBottom: "25px" }}>
            <h3 style={{ fontSize: "13pt", marginBottom: "10px", fontWeight: "bold" }}>
              Insurance :-
            </h3>
            {insurancePlans.map((plan, idx) => (
              <div key={idx} style={{ marginBottom: "15px" }}>
                <p style={{ fontSize: "10.5pt", lineHeight: "1.6", fontWeight: "bold" }}>
                  {plan.name}
                </p>
                <p style={{ fontSize: "10.5pt", lineHeight: "1.6" }}>
                  {plan.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {!insurancePlans?.length && (
          <div style={{ marginBottom: "25px" }}>
            <h3 style={{ fontSize: "13pt", marginBottom: "10px", fontWeight: "bold" }}>
              Insurance :-
            </h3>
            <p style={{ fontSize: "10.5pt", lineHeight: "1.6" }}>
              Comprehensive transit insurance is available upon request at an additional cost. Basic carrier liability is included 
              in the quoted price. Please contact us for detailed insurance options and pricing.
            </p>
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: "10pt", marginTop: "40px", color: "#555" }}>
          <strong>Almas Movers Services</strong><br />
          {companyAddress}
        </div>
      </div>

      <div className="print-page" style={{ padding: "20px 40px", maxWidth: "210mm", margin: "0 auto", pageBreakAfter: "auto" }}>
        <h3 style={{ fontSize: "13pt", marginBottom: "15px", fontWeight: "bold" }}>
          PAYMENT TERMS :-
        </h3>
        <p style={{ fontSize: "10.5pt", marginBottom: "15px", lineHeight: "1.6" }}>
          <strong>Payment Terms:</strong> 20% advance payment upon work confirmation, the full payment required at the day of work completion. 
          Payment may be made in any of the following ways:
        </p>
        <ul style={{ paddingLeft: "20px", margin: "0 0 30px", fontSize: "10.5pt", listStyleType: "upper-alpha" }}>
          <li style={{ marginBottom: "8px" }}>Cash / Cheque (ALMAS MOVERS SERVICES)</li>
          <li style={{ marginBottom: "8px" }}>Wire / Telegraphic transfer</li>
          <li style={{ marginBottom: "8px" }}>LPO – From approved companies</li>
          <li style={{ marginBottom: "8px" }}>Card payment (* 2.50% Surcharge apply)</li>
        </ul>

        <h3 style={{ fontSize: "13pt", marginBottom: "15px", fontWeight: "bold" }}>
          General Terms
        </h3>
        {generalTerms?.length > 0 ? (
          <ul style={{ paddingLeft: "20px", margin: "0 0 30px", fontSize: "10.5pt", listStyleType: "disc" }}>
            {generalTerms.map((term, idx) => (
              <li key={idx} style={{ marginBottom: "6px" }}>{term.content}</li>
            ))}
          </ul>
        ) : (
          <ul style={{ paddingLeft: "20px", margin: "0 0 30px", fontSize: "10.5pt", listStyleType: "disc" }}>
            <li style={{ marginBottom: "6px" }}>This quotation is valid for 60 days from the date mentioned above</li>
            <li style={{ marginBottom: "6px" }}>Prices are subject to change based on actual volume and additional services required</li>
            <li style={{ marginBottom: "6px" }}>Customer must provide accurate inventory and access information</li>
            <li style={{ marginBottom: "6px" }}>Any changes to the scope of work may result in additional charges</li>
            <li style={{ marginBottom: "6px" }}>The company is not liable for delays caused by factors beyond our control</li>
          </ul>
        )}

        <div style={{ textAlign: "center", fontSize: "10pt", marginBottom: "40px", color: "#555" }}>
          <strong>Almas Movers Services</strong><br />
          {companyAddress}
        </div>

        <div style={{ marginTop: "40px", borderTop: "2px solid #000", paddingTop: "30px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ width: "45%", verticalAlign: "bottom" }}>
                  <strong>Customer Acceptance:</strong><br /><br />
                  <div style={{ borderBottom: "1px solid #000", width: "100%", marginBottom: "10px", paddingTop: "30px" }}></div>
                  <strong>Signature</strong><br /><br />
                  <strong>Date:</strong> _______________
                </td>
                <td style={{ width: "10%" }}></td>
                <td style={{ width: "45%", verticalAlign: "bottom", textAlign: "right" }}>
                  <strong>For ALMAS MOVERS SERVICES</strong><br /><br />
                  <div style={{ borderBottom: "1px solid #000", width: "100%", marginBottom: "10px", paddingTop: "30px" }}></div>
                  <strong>Authorized Signatory</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: "center", fontSize: "10pt", marginTop: "40px", color: "#555" }}>
          <strong>Almas Movers Services</strong><br />
          {companyAddress}
        </div>
      </div>
    </div>
  );
}