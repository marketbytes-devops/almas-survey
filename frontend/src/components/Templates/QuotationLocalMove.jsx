import React, { forwardRef, useImperativeHandle } from "react";
import CompanyLogo from "../../assets/images/logo-quotation.webp";
import IAMLogo from "../../assets/images/iam.webp";
import IAMXLogo from "../../assets/images/iamx.webp";
import ISOLogo from "../../assets/images/iso.webp";
import PCGLogo from "../../assets/images/pcg.webp";
import TrustedLogo from "../../assets/images/trusted.webp";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

if (false) {
    console.log(html2canvas);
    console.log(jsPDF);
}

const CERTIFICATION_LOGOS = [IAMLogo, IAMXLogo, ISOLogo, PCGLogo, TrustedLogo];

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
        surveySignature,
        selectedServices = [],
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

    const companyAddress = "CR No 72379, Doha, Qatar";

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
            <div class="summary-line">
              <span class="label">${service || "Moving Charges"}</span>
              <span class="value">${formatCurrency(baseAmount)}</span>
            </div>`;
        }

        // Additional Charges
        if (additionalCharges?.length > 0) {
            breakdownRows += additionalCharges
                .map((charge) => {
                    const qty = charge.quantity || 1;
                    const perUnitBase = parseFloat(charge.per_unit_quantity) || 1;
                    const price = parseFloat(charge.price_per_unit || 0);
                    const total = (price / perUnitBase) * qty;
                    return `
            <div class="summary-line">
              <span class="label">${charge.service_name || "Additional Service"} x ${qty}</span>
              <span class="value">${formatCurrency(total)}</span>
            </div>`;
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
                <div class="term-desc">${t.description || ''}</div>
            </div>`)
                .join("")
            : `<div>Standard Payment Terms Apply</div>`;

        // Survey Remarks
        const surveyRemarksHTML = surveyRemarks.length > 0
            ? surveyRemarks
                .filter(r => r.is_active)
                .map(r => `<div class="remark-item">${r.description}</div>`)
                .join("")
            : "";

        // Notes
        const notesHTML = quoteNotes.length > 0
            ? quoteNotes
                .filter(n => n.is_active)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map(n => `<div class="note-item">${n.content}</div>`)
                .join("")
            : "";

        // Selected Services HTML
        let selectedServicesSection = "";

        const certLogosHTML = CERTIFICATION_LOGOS.map(logo => `<img src="${logo}" class="footer-cert-logo" />`).join("");

        return `
      <div class="page-container">
        <table class="print-wrapper">
          <thead>
            <tr><td><div class="page-header-space"></div></td></tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="print-actual-content">
                    <!-- HEADER -->
                    <header class="header">
                        <div class="brand-col">
                            <img src="${CompanyLogo}" alt="Almas Movers" class="logo"/>
                            <div class="company-address">
                                CR No 72379, Doha, Qatar<br>
                                ${quotation?.created_by_email || "Freight@almasint.com"} | ${quotation?.created_by_phone ? '+' + quotation.created_by_phone : "+974 5013 6999"}
                            </div>
                        </div>
                        <div class="meta-col">
                            <h1 class="doc-title">QUOTATION</h1>
                            <div class="meta-details">
                                <p><strong>Quote No:</strong> ${quoteNumber}</p>
                                <p><strong>Date:</strong> ${todayFormatted}</p>
                                <p><strong>Valid Until:</strong> 30 Days</p>
                            </div>
                        </div>
                    </header>

                    <!-- RATE SECTION -->
                    <section class="rate-section">
                        <div class="info-box rate-box">
                            <h1 class="rate-display">Your Rate is ${finalAmt} ${currency}</h1>
                        </div>
                    </section>

                    <!-- WELCOME MESSAGE -->
                    <section class="welcome-section">
                        <div class="welcome-content">
                            <p><strong>Dear ${customerName},</strong></p>
                            <p>Thank you for the opportunity to quote for your planned relocation, please note, our rates are valid for 60 days from date of quotation. You may confirm acceptance of our offer by signing and returning a copy of this document email. If the signed acceptance has not been received at the time of booking, it will be understood that you have read and accepted our quotation and related terms and conditions. Please do not hesitate to contact us should you have any questions or require additional information.</p>
                        </div>
                    </section>

                    <!-- INFO GRID -->
                    <section class="info-section">
                        <div class="info-box client-box">
                            <h3>CLIENT DETAILS</h3>
                            <div class="content">
                                <p><strong>Name</strong> <span class="colon-separator">:</span> ${customerName}</p>
                                <p><strong>Phone</strong> <span class="colon-separator">:</span> ${phone || "N/A"}</p>
                                <p><strong>Email</strong> <span class="colon-separator">:</span> ${email || "N/A"}</p>
                            </div>
                        </div>
                        <div class="info-box move-box">
                            <h3>MOVE DETAILS</h3>
                            <div class="content">
                                <p><strong>Service</strong> <span class="colon-separator">:</span> ${serviceType}</p>
                                <p><strong>Origin</strong> <span class="colon-separator">:</span> ${origin}</p>
                                <p><strong>Destination</strong> <span class="colon-separator">:</span> ${destination}</p>
                                <p><strong>Commodity</strong> <span class="colon-separator">:</span> Used Household Goods</p>
                                <p><strong>Move Date</strong> <span class="colon-separator">:</span> ${moveDate || "TBA"}</p>
                            </div>
                        </div>
                    </section>

                    <!-- PRICING BREAKDOWN -->
                    <section class="pricing-section">
                        <div class="breakdown-container">
                            <h3 class="breakdown-title">Breakdown of Charges (All prices in QAR)</h3>
                            <div class="summary-content">
                                ${breakdownRows}
                                ${discount > 0 ? `
                                <div class="summary-line">
                                    <span class="label">Discount</span>
                                    <span class="value text-red">-${formatCurrency(discount)}</span>
                                </div>` : ''}
                                
                                <div class="summary-line total-line">
                                    <span class="label">Lump sum moving charges: </span>
                                    <span class="value">${finalAmt}</span>
                                </div>
                                <div class="summary-line">
                                    <span class="label">Advance</span>
                                    <span class="value">${advanceAmt}</span>
                                </div>
                                <div class="summary-line">
                                    <span class="label">Balance</span>
                                    <span class="value">${balanceAmt}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- REMARKS -->
                    ${surveyRemarksHTML ? `
                    <section class="remarks-section" style="margin-bottom: 30px;">
                        <div class="terms-box">
                            <h3>REMARKS</h3>
                            <div class="text-content">${surveyRemarksHTML}</div>
                        </div>
                    </section>` : ''}

                    <!-- SERVICE SCOPE (INCLUDES / EXCLUDES) -->
                    <section class="service-scope-section">
                        <div class="scope-container">
                            <div class="scope-header">
                                <div class="header-col include-header">Service Includes</div>
                                <div class="header-col exclude-header">Service Excludes</div>
                            </div>
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

                    <!-- TERMS & NOTES -->
                    <section class="terms-section" style="margin-top: 20px;">
                        <div class="terms-box"><h3>INSURANCE</h3><div class="text-content"><p>Comprehensive transit insurance is available upon request. Standard liability is limited as per terms.</p></div></div>
                        <div class="terms-box"><h3>PAYMENT TERMS</h3><div class="text-content">${paymentTermsHTML}</div></div>
                        ${notesHTML ? `<div class="terms-box"><h3>IMPORTANT NOTES</h3><div class="text-content">${notesHTML}</div></div>` : ''}
                    </section>

                    <!-- FOOTER -->
                    <footer class="footer-section">
                        <div class="signature-block">
                            <div class="sign-box client-sign">
                                <p><strong>Accepted By (Client):</strong></p>
                                <div class="sign-area">${surveySignature ? `<img src="${surveySignature}" class="signature-img" />` : ''}</div>
                                <div class="sign-line"></div>
                                <p class="sign-name">${customerName}</p>
                                <p class="sign-date">Date: ${todayFormatted}</p>
                            </div>
                            <div class="sign-box company-sign">
                                <p><strong>For Almas Movers:</strong></p>
                                <div class="sign-area">${currentSignature ? `<img src="${currentSignature}" class="signature-img" />` : ''}</div>
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
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>
                <div class="page-footer-space"></div>
                <div class="footer-certification-logos">
                    ${certLogosHTML}
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
    };

    const getStyles = () => `
    @page { size: A4; margin: 0; }
    body { 
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
        color: #757575; background: #fff; margin: 0; padding: 0; 
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    
    .page-container { width: 100%; margin: 0; position: relative; background: white; }
    .print-wrapper { width: 100%; border-collapse: collapse; }
    .page-header-space { height: 30px; width: 100%; }
    .page-footer-space { height: 80px; width: 100%; }

    .print-actual-content { padding: 0 10mm; }

    @media print {
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        .page-container { padding: 0; }
        /* Prevent browser from collapsing the header space */
        .page-header-space::after { content: ""; display: block; height: 1px; }
    }

    /* HEADER */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 15px; margin-bottom: 25px; page-break-inside: avoid; }
    .logo { height: 70px; width: auto; margin-bottom: 8px; }
    .company-address { font-size: 9pt; color: #555; line-height: 1.4; }
    .doc-title { font-size: 24pt; color: #003087; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; text-align: right; }
    .meta-details { float: right; text-align: left; }
    .meta-details p { margin: 2px 0; font-size: 10pt; }
    .meta-details strong { color: #666; margin-right: 5px; font-weight: 600; }

    .info-section { display: flex; gap: 20px; margin-bottom: 30px; page-break-inside: avoid; }
    .info-box { flex: 1; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #003087; padding: 12px 15px; page-break-inside: avoid; }
    .info-box h3 { margin: 0 0 10px 0; font-size: 10pt; color: #003087; text-transform: uppercase; }
    .info-box .content p { margin: 3px 0; font-size: 10pt; display: flex; align-items: flex-start; }
    .info-box .content strong { color: #555; display: inline-block; width: 85px; flex-shrink: 0; }
    .colon-separator { margin: 0 5px; color: #555; font-weight: bold; }

    .rate-section { margin-bottom: 25px; page-break-inside: avoid; }
    .rate-box { padding: 15px 25px !important; }
    .rate-display { font-size: 16pt; color: #757575; margin: 0; text-align: center; font-weight: bold; }
    
    .welcome-section { margin-bottom: 25px; page-break-inside: avoid; }
    .welcome-content { font-size: 11pt; color: #757575; line-height: 1.5; }
    .welcome-content p { margin-bottom: 8px; }
    .welcome-content strong { font-size: 12pt; color: #000; display: block; margin-bottom: 5px; }

    .pricing-section { margin-bottom: 45px; display: flex; justify-content: center; page-break-inside: avoid; }
    .breakdown-container { width: 55%; }
    .breakdown-title { color: #003087; font-size: 11pt; margin-bottom: 5px; padding-bottom: 5px; }
    .summary-content { font-size: 10pt; }
    .summary-line { padding: 1px 0; display: flex; justify-content: flex-start; align-items: center; }
    .summary-line .label { color: #757575; display: inline-block; width: 170px; white-space: nowrap; }
    .summary-line .value { font-weight: bold; color: #757575; flex: 1; text-align: right; }
    .total-line { font-weight: bold; color: #000 !important; font-size: 11pt; margin-top: 5px; padding-top: 5px; }
    .total-line .label, .total-line .value, .total-line .colon-separator { color: #000; }
    .text-red { color: #d32f2f !important; }

    .selected-services-section { margin-bottom: 20px; page-break-inside: avoid; }
    .service-scope-section { margin-bottom: 30px; page-break-inside: avoid; }
    .scope-container { border-radius: 8px; overflow: hidden; border: 1px solid #ddd; }
    .scope-header { display: flex; color: white; }
    .header-col { flex: 1; padding: 10px; font-weight: bold; font-size: 11pt; }
    .include-header { background-color: #456475; }
    .exclude-header { background-color: #b71c1c; }
    .scope-body { display: flex; }
    .body-col { flex: 1; padding: 15px 20px; }
    .include-body { background-color: #f1f5f8; }
    .exclude-body { background-color: #fdf2f2; }
    .scope-list { list-style: none; padding: 0; margin: 0; font-size: 10pt; }
    .scope-list li { margin-bottom: 8px; display: flex; align-items: flex-start; }
    .check-icon { color: #456475; margin-right: 10px; font-weight: bold; }
    .cross-icon { color: #b71c1c; margin-right: 10px; font-weight: bold; }

    .terms-section { margin-bottom: 30px; }
    .terms-box { page-break-inside: avoid; margin-bottom: 15px; }
    .terms-box h3 { font-size: 10pt; background: #eee; padding: 6px 10px; margin: 0; font-weight: bold; }
    .terms-box .text-content { padding: 10px; border: 1px solid #eee; border-top: none; font-size: 9pt; }
    .term-item { margin-bottom: 10px; }
    .term-title { font-weight: bold; }

    .footer-section { page-break-inside: avoid; margin-top: 30px; }
    .signature-block { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .sign-box { width: 45%; }
    .sign-area { height: 60px; display: flex; align-items: flex-end; justify-content: center; }
    .signature-img { max-height: 50px; }
    .sign-line { border-bottom: 1px solid #757575; margin: 5px 0; }
    .sign-name, .sign-date { font-size: 9pt; color: #555; }
    .footer-bottom { text-align: center; font-size: 8pt; color: #999; padding-top: 10px; }

    .footer-certification-logos {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 40px;
        padding: 10px 0;
        background: transparent;
    }
    .footer-cert-logo {
        height: 35px;
        width: auto;
        object-fit: contain;
    }
    
    @media print {
        .footer-certification-logos {
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            width: 100%;
        }
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
                setTimeout(() => {
                    printWindow.print();
                }, 800);
            }
        },

        downloadPdf: async () => {
            await this.getPdfBlob(); // Re-use the logic
        },

        getPdfBlob: async () => {
            try {
                const printContent = generateHtmlContent();
                const container = document.createElement('div');
                container.innerHTML = `<style>${getStyles()}</style>${printContent}`;
                container.style.position = 'fixed';
                container.style.left = '-9999px';
                container.style.top = '0';
                container.style.width = '210mm';
                container.style.background = '#fff';
                document.body.appendChild(container);

                await new Promise(r => setTimeout(r, 1000));

                const canvas = await html2canvas(container, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                document.body.removeChild(container);

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                const margin = 10;
                const contentWidth = pdfWidth - (margin * 2);
                const fullContentHeight = (canvas.height * contentWidth) / canvas.width;
                const pageContentHeight = pdfHeight - (margin * 2);

                let heightLeft = fullContentHeight;
                let position = margin;

                pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, fullContentHeight);
                heightLeft -= pageContentHeight;

                while (heightLeft > 0) {
                    pdf.addPage();
                    position = margin - (fullContentHeight - heightLeft);
                    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, fullContentHeight);
                    heightLeft -= pageContentHeight;
                }

                return pdf.output('blob');
            } catch (error) {
                console.error('PDF Blob Error:', error);
                return null;
            }
        },

        savePdf: async () => {
            const blob = await this.getPdfBlob();
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Quotation_${quoteNumber}.pdf`;
                link.click();
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