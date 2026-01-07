import React, { forwardRef, useImperativeHandle } from "react";
import CompanyLogo from "../../assets/images/logo-quotation.webp";
import Logo1 from "../../assets/images/bg-auth.webp";
import ProfileIcon from "../../assets/images/profile-icon.png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
 

if (false) {
  console.log(html2canvas);
  console.log(jsPDF);
}
 
const CERTIFICATION_LOGOS = [Logo1, ProfileIcon];
 
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
    paymentTerms = [],
    quoteNotes = [],
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
 
  const generateHtmlContent = () => {
    const customerName = name || "Valued Customer";
    const rate = Number(finalAmount || totalAmount || 0).toFixed(2) + " " + currency;
    const serviceType = service || "Local Move";
    const commodity = "Used Household goods";
    const origin = survey?.origin_city || survey?.origin_address || "Doha Qatar";
    const destination = movingTo || "Doha Qatar";
 
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
 
    const paymentTermsHtml = `
      <p style="font-size:11pt; margin:12px 0 18px 0; line-height:1.4;">
        <strong>Payment Terms:</strong> 20% advance payment upon work confirmation, the full payment required at the day of work completion. Payment may be made in any of the following ways.
      </p>
     
      <div style="margin-left: 20px; font-size:10.5pt; line-height:1.6;">
        <strong>A.</strong> Cash / Cheque (ALMAS MOVERS SERVICES)<br>
        <strong>B.</strong> Wire / Telegraphic transfer<br>
        <strong>C.</strong> LPO – From approved companies<br>
        <strong>D.</strong> Card payment (*2.50% Surcharge apply)
      </div>
    `;
 
    const generalTermsHtml = quoteNotes.length > 0
      ? quoteNotes
          .filter(note => note.is_active)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(note => `
            <div style="margin:12px 0; font-size:10.5pt;">
              ${note.title ? `<strong>${note.title}</strong><br>` : ''}
              <span style="white-space: pre-line;">${note.content || note.text || ""}</span>
            </div>
          `)
          .join('')
      : '<p style="font-style: italic; color:#555;">General terms and conditions apply as per company policy.</p>';
 
    return `
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
                  <td style="text-align:right;padding:10px 0;">${totalPrice}</td>
              </tr>
              <tr>
                  <td style="padding:5px 0;">Advance:</td>
                  <td style="text-align:right;padding:5px 0;">${advanceAmt}</td>
              </tr>
              <tr>
                  <td style="padding:5px 0;">Balance:</td>
                  <td style="text-align:right;padding:5px 0;">${balanceAmt}</td>
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
 
          <!-- Insurance heading with NO border -->
          <h3 class="section-title no-border-title">Insurance :-</h3>
          <p>Comprehensive transit insurance is available upon request at an additional cost. Basic carrier liability is included in the quoted price. Please contact us for detailed insurance options and pricing.</p>
      </div>
 
      <div style="page-break-before: always;"></div>
 
      <h3 class="section-title">PAYMENT TERMS</h3>
      ${paymentTermsHtml}
 
      <h3 class="section-title">GENERAL TERMS</h3>
      <div style="margin-bottom: 40px; font-size:10.5pt; line-height:1.5;">
        ${generalTermsHtml}
      </div>
 
      <div style="margin-top: 60px; text-align: center; page-break-inside: avoid;">
        <p style="font-weight: bold; font-size: 12pt; margin-bottom: 60px;">Acceptance of Quotation</p>
       
        <p style="margin: 40px 0 10px 0; font-weight: bold;">${customerName}</p>
       
        ${currentSignature
          ? `<img src="${currentSignature}" alt="Customer Signature" style="max-width: 340px; max-height: 140px; margin: 15px 0;" />`
          : '<p style="color:#777; font-style:italic; margin:20px 0;">(Signature pending)</p>'
        }
 
        <p style="margin-top: 30px; font-size:10pt;">Date: ${today}</p>
      </div>
    `;
  };
 
  const getStyles = () => `
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
    .section-title {
      font-size: 13pt;
      color: #003087;
      margin: 35px 0 15px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 6px;
      font-weight: bold;
    }
    .no-border-title {
      border-bottom: none !important;  /* Remove line under Insurance heading */
    }
    .bullet-list { padding-left: 20px; margin-bottom: 20px; }
    .bullet-list li { margin-bottom: 5px; }
  `;
 
  useImperativeHandle(ref, () => ({
    printNow: () => {
      const printContent = generateHtmlContent();
      const printWindow = window.open("", "", "height=800,width=1200");
      printWindow.document.write("<html><head><title>Quotation Print</title>");
      printWindow.document.write("<style>");
      printWindow.document.write(getStyles());
      printWindow.document.write("</style></head><body>");
      printWindow.document.write(printContent);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 800);
    },
 
    downloadPdf: async () => {
      try {
        const printContent = generateHtmlContent();
        const element = document.createElement('div');
        element.innerHTML = `<style>${getStyles()}</style>${printContent}`;
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        element.style.top = '0';
        element.style.width = '794px';
        element.style.height = 'auto';
        document.body.appendChild(element);
 
        await new Promise(resolve => setTimeout(resolve, 800));
 
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
          backgroundColor: '#ffffff',
          width: 794,
          height: element.scrollHeight + 200,
        });
 
        document.body.removeChild(element);
 
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
 
        const pdf = new jsPDF('p', 'mm', 'a4');
        let position = 0;
 
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
 
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
 
        pdf.save(`Quotation_${quoteNumber}.pdf`);
      } catch (error) {
        console.error('PDF generation failed:', error);
        alert('Failed to generate PDF. Check console for details.');
      }
    }
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
      <div style={{ display: 'none' }}>
        {/* Placeholder */}
      </div>
    </div>
  );
});
 
export default QuotationLocalMove;