import React, { forwardRef, useImperativeHandle } from "react";
import CompanyLogo from "../../assets/images/logo-quotation.webp";

const QuotationLocalMove = forwardRef((props, ref) => {
  const {
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
    insurancePlans = [],
    paymentTerms = [],
    quoteNotes = [],
    generalTerms = quoteNotes,
    currentSignature,
  } = props;

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, "-");

  const quoteNumber = quotation?.quotation_id || "AMS/2600001";
  const currency = "QAR";

  const companyContact = {
    person: "Muhammad Kp",
    email: "Freight@almasint.com",
    mobile: "0097450136999",
  };

  const companyAddress = "P.O. Box 24665, Doha, Qatar";

  useImperativeHandle(ref, () => ({
    printNow: () => {
      const customerName = name || "Valued Customer";
      const rate = Number(finalAmount || totalAmount || 0).toFixed(2) + " " + currency;
      const serviceType = service || "Local Move";
      const commodity = "Used Household goods";
      const origin = survey?.origin_city || survey?.origin_address || "Doha Qatar";
      const destination = movingTo || "Doha Qatar";

      const lumpSum = Number(baseAmount || totalAmount || 0).toFixed(2);

      let additionalLines = "";
      if (additionalCharges?.length > 0) {
        additionalLines = additionalCharges
          .map((charge) => {
            const quantity = charge.quantity || 1;
            const subtotal = Number(charge.price_per_unit * quantity).toFixed(2);
            return `<tr><td style="padding:5px 0;">${charge.service_name || "Additional Service"}:</td><td style="text-align:right;padding:5px 0;">${subtotal}</td></tr>`;
          })
          .join("");
      }

      const totalPrice = Number(totalAmount || 0).toFixed(2);
      const advanceAmt = Number(advance || 0).toFixed(2);
      const balanceAmt = Number(balance || 0).toFixed(2);
      const discountRow = discount > 0 ? `<tr><td style="padding:5px 0;">Discount:</td><td style="text-align:right;padding:5px 0;">-${Number(discount).toFixed(2)}</td></tr>` : "";

      const includeBullets = (includedServices || []).map((s) => `<li>${s}</li>`).join("");
      const excludeBullets = (excludedServices || []).map((s) => `<li>${s}</li>`).join("");

      const noteText = `Survey Remarks<br>${survey?.work_description || "Add Remark"}<br>Move date : ${moveDate || "TBA"} Required time for moving : 1 day. Working time : 8 AM to 7 PM (Max till 9 PM From Sunday to Saturday ) We assuming normal good access at destination office building ,please note any special requirement at origin & destination building which shall arranged by you (i.e. gate pass , parking permit ) NO HIDDEN FEE'S - You may please read below our service inclusion and exclusion.`;

      const insuranceText = (insurancePlans || []).length > 0
        ? (insurancePlans || []).map(plan => `${plan?.name || "N/A"}<br>${(plan?.description || "").replace(/\n/g, "<br>")}`).join("<br><br>")
        : "Comprehensive transit insurance is available upon request at an additional cost. Basic carrier liability is included in the quoted price. Please contact us for detailed insurance options and pricing.";

      const paymentText = (paymentTerms || []).length > 0
        ? (paymentTerms || []).map(term => `${term?.name || "N/A"}<br>${(term?.description || "").replace(/\n/g, "<br>")}`).join("<br><br>")
        : "20% advance payment upon work confirmation, the full payment required at the day of work completion.";

      const generalTermsHtml = (generalTerms || []).length > 0
        ? (generalTerms || []).map(note => `<li>${note?.content || note}</li>`).join("")
        : `<li>This quotation is valid for 60 days from the date mentioned above</li>
             <li>Prices are subject to change based on actual volume and additional services required</li>
             <li>Customer must provide accurate inventory and access information</li>`;

      const signatureSection = currentSignature
        ? `<img src="${currentSignature}" alt="Signature" style="max-height:80px;width:auto;" />`
        : "";

      const printContent = `
        <div class="header-container">
            <div class="logo-section">
                 <img src="${CompanyLogo}" alt="ALMAS MOVERS" />
            </div>
            <div class="details-section">
                <strong>Quote No :</strong> ${quoteNumber}<br>
                <strong>Date :</strong> ${today}<br>
                <strong>Contact Person :</strong> ${companyContact.person}<br>
                <strong>Email :</strong> <a href="mailto:${companyContact.email}">${companyContact.email}</a><br>
                <strong>Mobile No :</strong> ${companyContact.mobile}
            </div>
        </div>

        <h1 class="rate-title">Your Rate is ${rate}</h1>

        <p>Dear ${customerName},</p>
        <p class="intro-text">
            Thank you for the opportunity to quote for your planned relocation, please note, our rates are valid for 60 days from date of quotation. You may confirm acceptance of our offer by signing and returning a copy of this document email. If the signed acceptance has not been received at the time of booking, it will be understood that you have read and accepted our quotation and related terms and conditions. Please do not hesitate to contact us should you have any questions or require additional information.
        </p>

        <div class="service-box">
            <table style="width:100%">
                <tr>
                    <td><strong>Service Type :</strong> ${serviceType}</td>
                    <td><strong>Commodity :</strong> ${commodity}</td>
                </tr>
                <tr>
                    <td><strong>Origin :</strong> ${origin}</td>
                    <td><strong>Destination :</strong> ${destination}</td>
                </tr>
            </table>
        </div>

        <div class="breakdown-section">
            <h3 class="breakdown-title">Breakdown of Charges (All prices in ${currency})</h3>
            <table class="charges-table">
                ${additionalLines}
                ${discountRow}
                <tr style="font-weight:bold;">
                    <td style="padding:10px 0;">Total Price:</td>
                    <td style="text-align:right;padding:10px 0;">:${totalPrice}</td>
                </tr>
                <tr>
                    <td style="padding:5px 0;">Advance:</td>
                    <td style="text-align:right;padding:5px 0;">:${advanceAmt}</td>
                </tr>
                <tr>
                    <td style="padding:5px 0;">Balance:</td>
                    <td style="text-align:right;padding:5px 0;">:${balanceAmt}</td>
                </tr>
            </table>
        </div>



        <div style="page-break-before: always;"></div>

        <div class="section">
            <h3 class="section-title">Service Includes :-</h3>
            <ul class="bullet-list">${includeBullets || "<li>Professional packing of household items</li><li>Loading and unloading services</li>"}</ul>
            
            <h3 class="section-title">Service Excludes :-</h3>
            <ul class="bullet-list">${excludeBullets || "<li>Storage charges beyond agreed period</li><li>Customs duties and taxes</li>"}</ul>

            <h3 class="section-title">Note :-</h3>
            <div style="border:1px solid #ddd; padding:10px; border-radius:8px; margin-bottom:20px;">
                 <strong>Survey Remarks</strong>
                 <p>${survey?.work_description || ""}</p>
                 <div style="background:#f9f9f9; padding:10px; font-size:10px; margin-top:10px; border-radius:4px;">
                    Move date : ${moveDate || "TBA"} Required time for moving : 1 day. Working time : 8 AM to 7 PM (Max till 9 PM From Sunday to Saturday )
                 </div>
            </div>

            <h3 class="section-title">Insurance :-</h3>
            <p>${insuranceText}</p>
        </div>

        <div class="footer-center" style="position:fixed; bottom:0; width:100%;">
             <strong>Almas Movers Services</strong><br>
             Address xx xx x xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx<br>
             <div style="margin-top:10px; font-size: 10px;">IAM RPP SIAMX ISO Company Green Accredited</div>
        </div>
      `;

      const printWindow = window.open("", "", "height=800,width=1200");
      printWindow.document.write("<html><head><title>Quotation Print</title>");
      printWindow.document.write("<style>");
      printWindow.document.write(`
        @page { size: A4; margin: 1cm; }
        body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #333; }
        .header-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .logo-section img { max-width: 250px; height: auto; }
        .details-section { text-align: right; font-size: 10pt; line-height: 1.6; color: #003087; font-weight: bold;}
        .details-section strong { color: #333; } 
        .rate-title { text-align: center; color: #666; font-size: 20pt; margin: 20px 0; font-weight:normal; }
        .intro-text { font-size: 9pt; text-align: justify; margin-bottom: 20px; }
        .service-box { border: 2px solid #5aa5d6; border-radius: 15px; padding: 15px 30px; margin: 20px 0; }
        .service-box td { padding: 8px 0; font-size: 11pt; color: #333; }
        .breakdown-title { text-align: center; color: #003087; font-size: 12pt; margin-bottom: 15px; }
        .charges-table { width: 60%; margin: 0 auto; font-size: 10pt; }
        .footer-center { text-align: center; font-size: 10pt; color: #003087; margin-top: 50px; }
        .section-title { font-size: 12pt; color: #333; margin-top: 20px; margin-bottom: 10px; font-weight: bold; }
        .bullet-list { padding-left: 20px; margin-bottom: 20px; }
        .bullet-list li { margin-bottom: 5px; }
      `);
      printWindow.document.write("</style></head><body>");
      printWindow.document.write(printContent);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    },
  }));

  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      fontSize: "11pt",
      color: "#000",
      lineHeight: "1.4",
      backgroundColor: "#fff",
      padding: "40px",
      maxWidth: "210mm",
      margin: "0 auto"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
        <div>
          <img src={CompanyLogo} alt="Almas Movers" style={{ maxWidth: "250px" }} />
        </div>
        <div style={{ textAlign: "right", fontSize: "10pt", lineHeight: "1.6" }}>
          <div style={{ fontWeight: "bold", color: "#003087" }}>Quote No : {quoteNumber}</div>
          <div style={{ fontWeight: "bold", color: "#003087" }}>Date : {today}</div>
          <div style={{ fontWeight: "bold", color: "#003087" }}>Contact Person : {companyContact.person}</div>
          <div style={{ fontWeight: "bold", color: "#003087" }}>Email : <span style={{ textDecoration: "underline" }}>{companyContact.email}</span></div>
          <div style={{ fontWeight: "bold", color: "#003087" }}>Mobile No : {companyContact.mobile}</div>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: "22pt", color: "#7f7f7f", margin: "20px 0" }}>
        Your Rate is {Number(finalAmount || totalAmount).toFixed(2)} {currency}
      </div>

      <p style={{ fontWeight: "bold", marginBottom: "10px" }}>Dear {name || "Valued Customer"}</p>
      <p style={{ fontSize: "9pt", textAlign: "justify", marginBottom: "25px" }}>
        Thank you for the opportunity to quote for your planned relocation, please note, our rates are valid for 60 days from date of quotation. You may confirm acceptance of our offer by signing and returning a copy of this document email. If the signed acceptance has not been received at the time of booking, it will be understood that you have read and accepted our quotation and related terms and conditions. Please do not hesitate to contact us should you have any questions or require additional information.
      </p>

      {/* Service Box */}
      <div style={{
        border: "2px solid #5aa5d6",
        borderRadius: "15px",
        padding: "20px 40px",
        margin: "20px 0",
        display: "flex",
        justifyContent: "space-between"
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: "10px" }}><strong>Service Type :</strong> {service || "Local Move"}</div>
          <div><strong>Origin :</strong> {survey?.origin_city || "Doha Qatar"}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: "10px" }}><strong>Commodity :</strong> Used Household goods</div>
          <div><strong>Destination :</strong> {movingTo || "Doha Qatar"}</div>
        </div>
      </div>

      <div style={{ textAlign: "center", color: "#003087", fontSize: "12pt", fontWeight: "bold", marginBottom: "15px" }}>
        Breakdown of Charges (All prices in {currency} )
      </div>

      <table style={{ width: "60%", margin: "0 auto", fontSize: "11pt", borderCollapse: "collapse" }}>
        <tbody>
          {additionalCharges?.map((charge, i) => (
            <tr key={i}>
              <td style={{ padding: "5px 0" }}>{charge.service_name}:</td>
              <td style={{ textAlign: "right", padding: "5px 0" }}>
                {Number(charge.price_per_unit * (charge.quantity || 1)).toFixed(2)}
              </td>
            </tr>
          ))}
          {discount > 0 && (
            <tr>
              <td style={{ padding: "5px 0" }}>Discount:</td>
              <td style={{ textAlign: "right", padding: "5px 0" }}>-{Number(discount).toFixed(2)}</td>
            </tr>
          )}
          <tr>
            <td style={{ padding: "5px 0", fontWeight: "bold" }}>Total Price</td>
            <td style={{ textAlign: "right", padding: "5px 0", fontWeight: "bold" }}>:{Number(totalAmount).toFixed(2)}</td>
          </tr>
          <tr>
            <td style={{ padding: "5px 0", fontWeight: "bold" }}>Advance</td>
            <td style={{ textAlign: "right", padding: "5px 0", fontWeight: "bold" }}>:{Number(advance).toFixed(2)}</td>
          </tr>
          <tr>
            <td style={{ padding: "5px 0", fontWeight: "bold" }}>Balance</td>
            <td style={{ textAlign: "right", padding: "5px 0", fontWeight: "bold" }}>:{Number(balance).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: "center", marginTop: "50px", color: "#003087", fontWeight: "bold" }}>
        Almas Movers Services<br />
        <span style={{ color: "#000", fontWeight: "normal" }}>Address xx xx x xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</span>
        <div style={{ marginTop: "10px", fontSize: "10px", color: "#666" }}>
          IAM RPP SIAMX ISO Company Green Accredited
        </div>
      </div>

    </div>
  );
});

export default QuotationLocalMove;