/* src/components/Templates/BookingConfirmation.jsx */
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CompanyLogo from "../../assets/images/logo-quotation.webp";
import IAMLogo from "../../assets/images/iam.webp";
import IAMXLogo from "../../assets/images/iamx.webp";
import ISOLogo from "../../assets/images/iso.webp";
import PCGLogo from "../../assets/images/pcg.webp";
import TrustedLogo from "../../assets/images/trusted.webp";

const CERTIFICATION_LOGOS = [IAMLogo, IAMXLogo, ISOLogo, PCGLogo, TrustedLogo];

const BookingConfirmation = forwardRef(
  (
    {
      booking = null,
      quotation = null,
      clientName = "Customer",
      moveType = "Local Move",
      contactNumber = "Not provided",
      origin = "Not specified",
      destination = "Not specified",
    },
    ref
  ) => {
    const componentRef = useRef();

    if (!booking) {
      return null;
    }

    const formatTime = (timeStr) => {
      if (!timeStr) return "—";
      return timeStr.slice(0, 5);
    };

    const today = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'long', year: 'numeric' });

    // Exposed methods via ref
    useImperativeHandle(ref, () => ({
      downloadPdf: async () => {
        try {
          const canvas = await html2canvas(componentRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
          });

          const imgWidth = 210;
          const pageHeight = 297;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;

          const pdf = new jsPDF("p", "mm", "a4");
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            pdf.addPage();
            pdf.addImage(imgData, "JPEG", 0, heightLeft - imgHeight, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          pdf.save(`WorkOrder_${booking.booking_id || "Confirmation"}.pdf`);
        } catch (err) {
          console.error("PDF download failed:", err);
        }
      },
    }));

    return (
      <div
        ref={componentRef}
        style={{
          width: "210mm",
          margin: "0 auto",
          background: "white",
          padding: "10mm",
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#555",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "25px", borderBottom: "1px solid #eee", paddingBottom: "15px" }}>
          <div>
            <img src={CompanyLogo} alt="Almas Movers" style={{ height: "70px", marginBottom: "8px" }} />
            <div style={{ fontSize: "9pt", color: "#555", lineHeight: "1.4" }}>
              P.O. Box 24665, Doha, Qatar<br />
              Freight@almasint.com | +974 5013 6999
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h1 style={{ fontSize: "24pt", color: "#b71c1c", margin: "0 0 10px 0", textTransform: "uppercase" }}>Work Order</h1>
            <div style={{ fontSize: "10pt" }}>
              <p style={{ margin: "2px 0" }}><strong>Order No:</strong> {booking.booking_id || "TBA"}</p>
              <p style={{ margin: "2px 0" }}><strong>Date:</strong> {today}</p>
              <p style={{ margin: "2px 0" }}><strong>Status:</strong> {(booking.status || "confirmed").toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div style={{ flex: 1, background: "#f8f9fa", borderRadius: "6px", borderLeft: "4px solid #003087", padding: "12px 15px" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "10pt", color: "#003087", textTransform: "uppercase" }}>Client Details</h3>
            <div style={{ fontSize: "10pt" }}>
              <p style={{ margin: "3px 0" }}><strong>Name:</strong> {clientName}</p>
              <p style={{ margin: "3px 0" }}><strong>Phone:</strong> {contactNumber}</p>
            </div>
          </div>
          <div style={{ flex: 1, background: "#f8f9fa", borderRadius: "6px", borderLeft: "4px solid #003087", padding: "12px 15px" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "10pt", color: "#003087", textTransform: "uppercase" }}>Move Details</h3>
            <div style={{ fontSize: "10pt" }}>
              <p style={{ margin: "3px 0" }}><strong>Service:</strong> {moveType}</p>
              <p style={{ margin: "3px 0" }}><strong>Origin:</strong> {origin}</p>
              <p style={{ margin: "3px 0" }}><strong>Destination:</strong> {destination}</p>
              <p style={{ margin: "3px 0" }}><strong>Move Date:</strong> {booking.move_date || "—"}</p>
            </div>
          </div>
        </div>

        {/* Schedule & Supervisor */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div style={{ flex: 1, background: "#f8f9fa", borderRadius: "6px", borderLeft: "4px solid #003087", padding: "12px 15px" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "10pt", color: "#003087", textTransform: "uppercase" }}>Move Schedule</h3>
            <div style={{ fontSize: "10pt" }}>
              <p style={{ margin: "3px 0" }}><strong>Start Time:</strong> {booking.start_time ? formatTime(booking.start_time) : "—"}</p>
              <p style={{ margin: "3px 0" }}><strong>Est. End Time:</strong> {booking.estimated_end_time ? formatTime(booking.estimated_end_time) : "—"}</p>
            </div>
          </div>
          <div style={{ flex: 1, background: "#f8f9fa", borderRadius: "6px", borderLeft: "4px solid #456475", padding: "12px 15px" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "10pt", color: "#003087", textTransform: "uppercase" }}>Supervisor</h3>
            <div style={{ fontSize: "10pt" }}>
              <p style={{ margin: "3px 0" }}><strong>Name:</strong> {booking.supervisor_name || "N/A"}</p>
              <p style={{ margin: "3px 0" }}><strong>Phone:</strong> {booking.supervisor?.phone_number || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Resources Tables */}
        <div style={{ marginTop: "10px" }}>
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: "#003087", fontSize: "11pt", marginBottom: "8px", paddingBottom: "3px" }}>Assigned Manpower</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
                <thead><tr style={{ background: "#f1f5f8", color: "#003087" }}>
                  <th style={{ textAlign: "left", padding: "8px", border: "1px solid #ddd" }}>Staff Member</th>
                  <th style={{ textAlign: "left", padding: "8px", border: "1px solid #ddd" }}>Qty</th>
                </tr></thead>
                <tbody>
                  {booking.labours?.length > 0 ? booking.labours.map((l, i) => (
                    <tr key={i}><td style={{ padding: "8px", border: "1px solid #ddd" }}>{l.staff_member_name || l.name || "—"}</td><td style={{ padding: "8px", border: "1px solid #ddd" }}>{l.quantity || 1}</td></tr>
                  )) : <tr><td colSpan="2" style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>No manpower assigned</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: "#003087", fontSize: "11pt", marginBottom: "8px", paddingBottom: "3px" }}>Trucks Required</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
                <thead><tr style={{ background: "#f1f5f8", color: "#003087" }}>
                  <th style={{ textAlign: "left", padding: "8px", border: "1px solid #ddd" }}>Truck Type</th>
                  <th style={{ textAlign: "left", padding: "8px", border: "1px solid #ddd" }}>Qty</th>
                </tr></thead>
                <tbody>
                  {booking.trucks?.length > 0 ? booking.trucks.map((t, i) => (
                    <tr key={i}><td style={{ padding: "8px", border: "1px solid #ddd" }}>{t.truck_type_name || "N/A"}</td><td style={{ padding: "8px", border: "1px solid #ddd" }}>{t.quantity || 1}</td></tr>
                  )) : <tr><td colSpan="2" style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>No trucks assigned</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ color: "#003087", fontSize: "11pt", marginBottom: "8px", paddingBottom: "3px" }}>Packing Materials</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
              <thead><tr style={{ background: "#f1f5f8", color: "#003087" }}>
                <th style={{ textAlign: "left", padding: "8px", border: "1px solid #ddd" }}>Material</th>
                <th style={{ textAlign: "left", padding: "8px", border: "1px solid #ddd" }}>Quantity</th>
              </tr></thead>
              <tbody>
                {booking.materials?.length > 0 ? booking.materials.map((m, i) => (
                  <tr key={i}><td style={{ padding: "8px", border: "1px solid #ddd" }}>{m.material_name || "N/A"}</td><td style={{ padding: "8px", border: "1px solid #ddd" }}>{m.quantity || 1}</td></tr>
                )) : <tr><td colSpan="2" style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>No materials assigned</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "40px", marginTop: "40px", paddingTop: "20px" }}>
          {CERTIFICATION_LOGOS.map((logo, i) => (
            <img key={i} src={logo} alt="cert" style={{ height: "30px", opacity: 0.8 }} />
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: "8pt", color: "#999", marginTop: "10px" }}>
          ALMAS MOVERS INTERNATIONAL - Operation Department
        </div>
      </div>
    );
  }
);

export default BookingConfirmation;
