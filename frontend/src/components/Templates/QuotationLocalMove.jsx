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
    surveyRemarks = [],
    currentSignature,
    selectedServices = [], // Selected additional services
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
    const quoteNumber = quotation?.quotation_id || "AMS/2600001";

    // Formatting helpers
    const formatCurrency = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const todayFormatted = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

    // Move Details
    const serviceType = service || "Local Move";
    const origin = survey?.origin_city || survey?.origin_address || "Doha, Qatar";
    const destination = movingTo || "Doha, Qatar";
    const volume = survey?.total_volume_cbm ? `${survey.total_volume_cbm} CBM` : "TBA";

    const totalPrice = formatCurrency(totalAmount);
    const advanceAmt = formatCurrency(advance);
    const balanceAmt = formatCurrency(balance);
    const finalAmt = formatCurrency(finalAmount || totalAmount);

    let breakdownRows = "";

    if (baseAmount > 0) {
      breakdownRows += `
            <tr>
              <td class="label">${service || "Moving Charges"}:</td>
              <td class="value">${formatCurrency(baseAmount)}</td>
            </tr>`;
    }

    // 2. Additional Charges
    if (additionalCharges?.length > 0) {
      breakdownRows += additionalCharges
        .map((charge) => {
          const qty = charge.quantity || 1;
          const total = Number(charge.price_per_unit * qty);
          return `
            <tr>
              <td class="label">${charge.service_name || "Additional Service"}:</td>
              <td class="value">${formatCurrency(total)}</td>
            </tr>`;
        })
        .join("");
    }

    // Lists
    const inclusionsHTML = (includedServices || []).map(item => `<li><span class="check-icon">✓</span> ${item}</li>`).join("");
    const exclusionsHTML = (excludedServices || []).map(item => `<li><span class="cross-icon">✗</span> ${item}</li>`).join("");

    // Payment Terms (Active Only)
    const paymentTermsHTML = paymentTerms.length > 0
      ? paymentTerms
        .filter(t => t.is_active)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(t => `
            <div class="term-item">
                <div class="term-title">${t.name}</div>
                <div class="term-desc">${t.description || ''}</div>
            </div>`)
        .join("")
      : `<div>Standard Payment Terms Apply</div>`;

    // Notes
    const notesHTML = quoteNotes.length > 0
      ? quoteNotes
        .filter(n => n.is_active)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(n => `<div class="note-item">${n.content}</div>`)
        .join("")
      : "";

    // Survey Remarks
    const surveyRemarksHTML = surveyRemarks.length > 0
      ? surveyRemarks
        .filter(r => r.is_active)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(r => `<div class="remark-item">${r.description}</div>`)
        .join("")
      : "";

    // Selected Services HTML Logic (Updated to match Service Includes Design)
    let selectedServicesSection = "";
    if (Array.isArray(selectedServices) && selectedServices.length > 0) {
      const servicesListHTML = selectedServices.map(service =>
        `<li><span class="check-icon">✓</span> ${service}</li>`
      ).join("");

      selectedServicesSection = `
        <section class="selected-services-section">
            <div class="scope-container">
                <div class="scope-header">
                    <div class="header-col include-header" style="width: 100%;">Selected Services</div>
                </div>
                <div class="scope-body">
                    <div class="body-col include-body" style="width: 100%;">
                        <ul class="scope-list">
                            ${servicesListHTML}
                        </ul>
                    </div>
                </div>
            </div>
        </section>`;
    }

    return `
      <div class="page-container">
        <!-- HEADER -->
        <header class="header">
            <div class="brand-col">
                <img src="${CompanyLogo}" alt="Almas Movers" class="logo"/>
                <div class="company-address">
                    P.O. Box 24665, Doha, Qatar<br>
                    Freight@almasint.com | +974 5013 6999
                </div>
            </div>
            <div class="meta-col">
                <h1 class="doc-title">QUOTATION</h1>
                <table class="meta-table">
                    <tr><th>Quote No:</th><td>${quoteNumber}</td></tr>
                    <tr><th>Date:</th><td>${todayFormatted}</td></tr>
                    <tr><th>Valid Until:</th><td>30 Days</td></tr>
                </table>
            </div>
        </header>

        <!-- INFO GRID -->
        <section class="info-section">
            <div class="info-box client-box">
                <h3>CLIENT DETAILS</h3>
                <div class="content">
                    <p><strong>Name:</strong> ${customerName}</p>
                    <p><strong>Phone:</strong> ${phone || "N/A"}</p>
                    <p><strong>Email:</strong> ${email || "N/A"}</p>
                </div>
            </div>
            <div class="info-box move-box">
                <h3>MOVE DETAILS</h3>
                <div class="content">
                    <p><strong>Service:</strong> ${serviceType}</p>
                    <p><strong>Origin:</strong> ${origin}</p>
                    <p><strong>Destination:</strong> ${destination}</p>
                    <p><strong>Est. Volume:</strong> ${volume}</p>
                    <p><strong>Move Date:</strong> ${moveDate || "TBA"}</p>
                </div>
            </div>
        </section>

        <!-- PRICING BREAKDOWN (Simplified) -->
        <section class="pricing-section">
            <div class="breakdown-container">
                <h3 class="breakdown-title">Breakdown of Charges (All prices in QAR)</h3>
                <table class="summary-table">
                    ${breakdownRows}
                    ${discount > 0 ? `
                    <tr>
                        <td class="label">Discount:</td>
                        <td class="value text-red">-${formatCurrency(discount)}</td>
                    </tr>` : ''}
                    
                    <tr class="total-row">
                        <td class="label">Lump sum moving charges:</td>
                        <td class="value">${finalAmt}</td>
                    </tr>
                    <tr>
                        <td class="label">Advance:</td>
                        <td class="value">${advanceAmt}</td>
                    </tr>
                    <tr>
                        <td class="label">Balance:</td>
                        <td class="value">${balanceAmt}</td>
                    </tr>
                </table>
            </div>
        </section>

        <!-- SELECTED SERVICES SECTION -->
        ${selectedServicesSection}

        <!-- PAGE BREAK IF NEEDED FOR LONG CONTENT -->
        <!-- <div class="page-break"></div> -->

        <!-- SERVICE SCOPE (INCLUDES / EXCLUDES) -->
        <section class="service-scope-section">
            <div class="scope-container">
                <!-- Headers -->
                <div class="scope-header">
                    <div class="header-col include-header">Service Includes</div>
                    <div class="header-col exclude-header">Service Excludes</div>
                </div>
                <!-- Content -->
                <div class="scope-body">
                    <div class="body-col include-body">
                        <ul class="scope-list">
                            ${inclusionsHTML || "<li><span class='check-icon'>✓</span> Standard Packing</li><li><span class='check-icon'>✓</span> Transport</li>"}
                        </ul>
                    </div>
                    <div class="body-col exclude-body">
                        <ul class="scope-list">
                            ${exclusionsHTML || "<li><span class='cross-icon'>✗</span> Customs Duties</li><li><span class='cross-icon'>✗</span> Storage</li>"}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- PAGE BREAK FOR PAGE 2 -->
        <div class="page-break"></div>

        <!-- TERMS & NOTES -->
         <section class="terms-section" style="margin-top: 20px;">
            <div class="terms-box">
                <h3>PAYMENT TERMS</h3>
                <div class="text-content">
                    ${paymentTermsHTML}
                </div>
            </div>
            
            ${(survey?.surveyRemarksHTML) ? `
            <div class="terms-box" style="margin-top: 15px;">
                <h3>SURVEY REMARKS</h3>
                <div class="text-content">
                    ${surveyRemarksHTML}
                </div>
            </div>` : ''}

            ${notesHTML ? `
            <div class="terms-box" style="margin-top: 15px;">
                <h3>IMPORTANT NOTES</h3>
                <div class="text-content">${notesHTML}</div>
            </div>
            ` : ''}
            
             <div class="terms-box" style="margin-top: 15px;">
                <h3>INSURANCE</h3>
                <div class="text-content">
                    <p>Comprehensive transit insurance is available upon request. Standard liability is limited as per terms.</p>
                </div>
            </div>
        </section>

        <!-- FOOTER & SIGNATURE -->
        <footer class="footer-section">
            <div class="signature-block">
                <div class="sign-box client-sign">
                     <p><strong>Accepted By (Client):</strong></p>
                     <div class="sign-area">
                        ${currentSignature ? `<img src="${currentSignature}" class="signature-img" />` : ''}
                     </div>
                     <div class="sign-line"></div>
                     <p class="sign-name">${customerName}</p>
                     <p class="sign-date">Date: ${todayFormatted}</p>
                </div>
                <div class="sign-box company-sign">
                     <p><strong>For Almas Movers:</strong></p>
                     <div class="sign-area">
                        <!-- Company Stamp/Sign could go here -->
                     </div>
                     <div class="sign-line"></div>
                     <p class="sign-name">Authorized Signatory</p>
                     <p class="sign-date">Date: ${todayFormatted}</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>Thank you for choosing Almas Movers International. We look forward to serving you.</p>
            </div>
        </footer>
      </div>
    `;
  };

  const getStyles = () => `
    @page { size: A4; margin: 0; }
    body { 
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
        color: #333; 
        background: #fff; 
        margin: 0; 
        padding: 0; 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact;
    }
    
    .page-container {
        width: 210mm;
        min-height: 297mm;
        padding: 12mm 15mm;
        margin: 0 auto;
        box-sizing: border-box;
        position: relative;
    }

    /* HEADER */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: 15px;
        margin-bottom: 25px;
    }
    .logo { height: 70px; width: auto; margin-bottom: 8px; }
    .company-address { font-size: 9pt; color: #555; line-height: 1.4; }
    .doc-title { font-size: 24pt; color: #003087; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; text-align: right; }
    .meta-table { float: right; font-size: 10pt; }
    .meta-table th { text-align: right; padding-right: 10px; color: #666; font-weight: 600; }
    .meta-table td { text-align: right; font-weight: bold; color: #333; }

    /* INFO GRID */
    .info-section {
        display: flex;
        gap: 20px;
        margin-bottom: 30px;
    }
    .info-box {
        flex: 1;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 4px solid #003087;
        padding: 12px 15px;
    }
    .info-box h3 {
        margin: 0 0 10px 0;
        font-size: 10pt;
        color: #003087;
        text-transform: uppercase;
        padding-bottom: 5px;
    }
    .info-box .content p { margin: 3px 0; font-size: 10pt; }
    .info-box .content strong { color: #555; min-width: 70px; display: inline-block; }

    /* TABLE (Simplistic Layout) */
    .pricing-section { margin-bottom: 30px; display: flex; justify-content: center; }
    .breakdown-container { width: 60%; }
    .breakdown-title { 
        text-align: start; 
        color: #003087; 
        font-size: 11pt; 
        margin-bottom: 10px; 
    }
    .summary-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
    .summary-table td { padding: 4px 0; vertical-align: top; }
    .summary-table .label { text-align: left; color: #333; }
    .summary-table .value { text-align: right; font-weight: bold; color: #333; }
    
    .total-row .label { font-weight: bold; color: #000; font-size: 11pt; padding-top: 10px; }
    .total-row .value { font-weight: bold; color: #000; font-size: 11pt; padding-top: 10px; }
    .text-red { color: #d32f2f; }

    /* SELECTED SERVICES (New Design) */
    .selected-services-section { margin-bottom: 20px; }
    .selected-services-section .header-col { text-align: left; padding-left: 20px; }

    .section-header { 
        font-size: 12pt; 
        color: #4c7085; 
        font-weight: bold; 
        margin-bottom: 12px; 
        padding-bottom: 5px;
    }
    .services-list { display: flex; flex-direction: column; gap: 10px; }
    
    /* Removed unused box styles */

    /* PAGE BREAK */
    .page-break { page-break-before: always; height: 15px; display: block; }

    /* SERVICE SCOPE (NEW DESIGN) */
    .service-scope-section { margin-bottom: 30px; }
    .scope-container { 
        border-radius: 8px; 
        overflow: hidden; 
        border: 1px solid #ddd;
    }
    .scope-header { display: flex; text-align: center; font-weight: white; }
    .header-col { flex: 1; padding: 10px; font-weight: bold; color: white; font-size: 11pt; }
    .include-header { background-color: #456475; } /* Slate Blue */
    .exclude-header { background-color: #b71c1c; } /* Dark Red */
    
    .scope-body { display: flex; }
    .body-col { flex: 1; padding: 15px 20px; }
    .include-body { background-color: #f1f5f8; } /* Light Blue Grey */
    .exclude-body { background-color: #fdf2f2; } /* Light Red */
    
    .scope-list { list-style: none; padding: 0; margin: 0; font-size: 10pt; }
    .scope-list li { margin-bottom: 8px; display: flex; align-items: flex-start; }
    
    .check-icon { 
        color: #456475; 
        margin-right: 10px; 
        font-weight: bold; 
        font-size: 12pt;
    }
    .cross-icon { 
        color: #b71c1c; 
        margin-right: 10px; 
        font-weight: bold;
        font-size: 12pt;
    }

    /* NOTES & TERMS */
    .terms-section { margin-bottom: 30px; page-break-inside: avoid; }
    .terms-box h3 { font-size: 10pt; background: #eee; padding: 6px 10px; margin: 0; font-weight: bold; color: #333; }
    .terms-box .text-content { padding: 10px; border: 1px solid #eee; border-top: none; font-size: 9pt; color: #555; }
    .term-item { margin-bottom: 12px; }
    .term-title { font-weight: bold; color: #333; margin-bottom: 3px; }
    .term-desc { color: #444; line-height: 1.4; }
    .note-item { margin-bottom: 6px; }
    .remark-item { margin-bottom: 6px; }

    /* FOOTER */
    .footer-section { margin-top: auto; page-break-inside: avoid; }
    .signature-block { display: flex; justify-content: space-between; margin-bottom: 20px; margin-top: 30px; }
    .sign-box { width: 45%; }
    .sign-area { height: 80px; display: flex; align-items: flex-end; justify-content: center; }
    .signature-img { max-height: 70px; max-width: 100%; }
    .sign-line { border-bottom: 1px solid #333; margin-top: 5px; margin-bottom: 5px; }
    .sign-name, .sign-date { font-size: 9pt; margin: 2px 0; color: #555; }
    .footer-bottom { text-align: center; font-size: 8pt; color: #999; border-top: 1px solid #eee; padding-top: 10px; }

    @media print {
        body { margin: 0; -webkit-print-color-adjust: exact; }
        .page-container { width: 100%; margin: 0; padding: 10mm; }
    }
  `;

  useImperativeHandle(ref, () => ({
    printNow: () => {
      const printContent = generateHtmlContent();
      const printWindow = window.open("", "", "height=800,width=1200");
      if (printWindow) {
        printWindow.document.write("<html><head><title>Quotation Print</title>");
        printWindow.document.write(`<style>${getStyles()}</style>`);
        printWindow.document.write("</head><body>");
        printWindow.document.write(printContent);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        // Wait for images to load ideally, but simple timeout works for now
        setTimeout(() => {
          printWindow.print();
          // printWindow.close(); // Optional, some users prefer to keep it open
        }, 800);
      }
    },

    downloadPdf: async () => {
      try {
        const printContent = generateHtmlContent();
        // Create a temporary container for html2canvas
        const container = document.createElement('div');
        container.innerHTML = `<style>${getStyles()}</style>${printContent}`;
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '210mm'; // Enforce A4 width
        container.style.background = '#fff';
        document.body.appendChild(container);

        // Wait for rendering
        await new Promise(r => setTimeout(r, 1000));

        const canvas = await html2canvas(container, {
          scale: 2, // Higher quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        document.body.removeChild(container);

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }

        pdf.save(`Quotation_${quoteNumber}.pdf`);
      } catch (error) {
        console.error('PDF Export Error:', error);
        alert('Failed to export PDF.');
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
      </div>
    </div>
  );
});

export default QuotationLocalMove;