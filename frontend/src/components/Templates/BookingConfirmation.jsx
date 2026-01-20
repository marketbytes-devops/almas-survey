/* src/components/Templates/BookingConfirmation.jsx */
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CompanyLogo from "../../assets/images/logo-quotation.webp";
import Logo1 from "../../assets/images/bg-auth.JPG";
import ProfileIcon from "../../assets/images/profile-icon.png";

const CERTIFICATION_LOGOS = [Logo1, ProfileIcon];

const BookingConfirmation = forwardRef(
  (
    {
      booking = null,
      clientName = "Customer",
      moveType = "Local Move",
      contactNumber = "Not provided",
      origin = "Not specified",
      destination = "Not specified",
    },
    ref
  ) => {
    const componentRef = useRef();

    // Guard clause
    if (!booking) {
      return null;
    }

    const formatTime = (timeStr) => {
      if (!timeStr) return "—";
      return timeStr.slice(0, 5);
    };

    const today = new Date().toLocaleDateString("en-GB");

    const companyAddress = "P.O. Box 24665, Doha, Qatar";

    // Full printable content (this gets captured by html2canvas)
    const PrintableContent = () => (
      <div
        ref={componentRef}
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "white",
          padding: "40px",
          fontFamily: "Arial, sans-serif",
          color: "#757575",
          width: "794px", // A4 width in pixels
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <img
            src={CompanyLogo}
            alt="ALMAS MOVERS"
            style={{ maxWidth: "250px", marginBottom: "20px" }}
          />
          <h1
            style={{
              fontSize: "32pt",
              fontWeight: "bold",
              color: "#4c7085",
              margin: "10px 0",
            }}
          >
            Booking Confirmation
          </h1>
          <div
            style={{
              width: "120px",
              height: "4px",
              background: "linear-gradient(to right, #4c7085, #6b8ca3)",
              margin: "15px auto",
            }}
          ></div>
          <p style={{ fontSize: "16pt", color: "#666" }}>
            <strong>Booking ID:</strong> {booking.booking_id || "TBA"}
          </p>
          <p style={{ fontSize: "12pt", color: "#888", marginTop: "10px" }}>
            Generated on: {today}
          </p>
        </div>

        {/* Client & Move Info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "30px",
            marginBottom: "40px",
            background: "#f9f9f9",
            padding: "25px",
            borderRadius: "12px",
            border: "1px solid #ddd",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "16pt",
                fontWeight: "bold",
                color: "#4c7085",
                marginBottom: "15px",
              }}
            >
              Client Details
            </h2>
            <p style={{ margin: "8px 0" }}>
              <strong>Name:</strong> {clientName}
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>Contact:</strong> {contactNumber}
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>Move Type:</strong> {moveType}
            </p>
          </div>
          <div>
            <h2
              style={{
                fontSize: "16pt",
                fontWeight: "bold",
                color: "#4c7085",
                marginBottom: "15px",
              }}
            >
              Move Schedule
            </h2>
            <p style={{ margin: "8px 0" }}>
              <strong>Move Date:</strong> {booking.move_date || "—"}
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>Start Time:</strong>{" "}
              {booking.start_time ? formatTime(booking.start_time) : "—"}
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>Est. End Time:</strong>{" "}
              {booking.estimated_end_time
                ? formatTime(booking.estimated_end_time)
                : "—"}
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>From → To:</strong> {origin} → {destination}
            </p>
          </div>
        </div>

        {/* Supervisor */}
        {booking.supervisor_name && (
          <div
            style={{
              marginBottom: "40px",
              background: "#e3f2fd",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #90caf9",
            }}
          >
            <h2
              style={{
                fontSize: "16pt",
                fontWeight: "bold",
                color: "#4c7085",
                marginBottom: "10px",
              }}
            >
              Assigned Supervisor
            </h2>
            <p style={{ fontSize: "14pt", fontWeight: "500" }}>
              {booking.supervisor_name}
            </p>
          </div>
        )}

        {/* Labours Table */}
        {/* Labours Table - Updated (Labour Type removed) */}
        {booking.labours?.length > 0 && (
          <div style={{ marginBottom: "30px" }}>
            <h2
              style={{
                fontSize: "18pt",
                fontWeight: "bold",
                color: "#4c7085",
                marginBottom: "15px",
                borderBottom: "2px solid #4c7085",
                paddingBottom: "8px",
              }}
            >
              Assigned Labours / Manpower
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "linear-gradient(to right, #4c7085, #6b8ca3)",
                    color: "white",
                  }}
                >
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontSize: "11pt",
                    }}
                  >
                    Staff Member
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      fontSize: "11pt",
                    }}
                  >
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {booking.labours.map((labour, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid #ddd",
                      backgroundColor: i % 2 === 0 ? "#f9f9f9" : "white",
                    }}
                  >
                    <td style={{ padding: "10px", fontWeight: "500" }}>
                      {labour.staff_member_name ||
                        labour.name ||
                        "Unnamed Staff"}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {labour.quantity || 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Trucks Table */}
        {booking.trucks?.length > 0 && (
          <div style={{ marginBottom: "30px" }}>
            <h2
              style={{
                fontSize: "18pt",
                fontWeight: "bold",
                color: "#4c7085",
                marginBottom: "15px",
                borderBottom: "2px solid #4c7085",
                paddingBottom: "8px",
              }}
            >
              Trucks Required
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "linear-gradient(to right, #4c7085, #6b8ca3)",
                    color: "white",
                  }}
                >
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontSize: "11pt",
                    }}
                  >
                    Truck Type
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      fontSize: "11pt",
                    }}
                  >
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {booking.trucks.map((truck, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid #ddd",
                      backgroundColor: i % 2 === 0 ? "#f9f9f9" : "white",
                    }}
                  >
                    <td style={{ padding: "10px", fontWeight: "500" }}>
                      {truck.truck_type_name}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {truck.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Materials Table */}
        {booking.materials?.length > 0 && (
          <div style={{ marginBottom: "30px" }}>
            <h2
              style={{
                fontSize: "18pt",
                fontWeight: "bold",
                color: "#4c7085",
                marginBottom: "15px",
                borderBottom: "2px solid #4c7085",
                paddingBottom: "8px",
              }}
            >
              Packing Materials
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "linear-gradient(to right, #4c7085, #6b8ca3)",
                    color: "white",
                  }}
                >
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      fontSize: "11pt",
                    }}
                  >
                    Material
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      fontSize: "11pt",
                    }}
                  >
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {booking.materials.map((mat, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid #ddd",
                      backgroundColor: i % 2 === 0 ? "#f9f9f9" : "white",
                    }}
                  >
                    <td style={{ padding: "10px", fontWeight: "500" }}>
                      {mat.material_name}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      {mat.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notes */}
        {booking.notes && (
          <div style={{ marginBottom: "40px" }}>
            <h2
              style={{
                fontSize: "18pt",
                fontWeight: "bold",
                color: "#4c7085",
                marginBottom: "15px",
                borderBottom: "2px solid #4c7085",
                paddingBottom: "8px",
              }}
            >
              Internal Notes
            </h2>
            <div
              style={{
                background: "#f9f9f9",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #ddd",
              }}
            >
              <p style={{ whiteSpace: "pre-wrap" }}>{booking.notes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "60px",
            paddingTop: "30px",
            borderTop: "2px solid #ddd",
          }}
        >
          <p style={{ fontSize: "14pt", color: "#4c7085", fontWeight: "bold" }}>
            Thank you for choosing Almas Movers International
          </p>
          <p style={{ color: "#666", marginTop: "10px" }}>
            Your move is in safe hands.
          </p>
          <p style={{ fontSize: "10pt", color: "#888", marginTop: "20px" }}>
            For any queries, contact your assigned supervisor.
          </p>
        </div>

        {/* Certifications */}
        <div
          style={{
            marginTop: "40px",
            textAlign: "center",
            fontSize: "9pt",
            color: "#555",
          }}
        >
          <p style={{ margin: "5px 0", fontWeight: "bold" }}>
            Almas Movers Services
          </p>
          <p style={{ margin: "3px 0" }}>{companyAddress}</p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "15px",
              marginTop: "15px",
            }}
          >
            {CERTIFICATION_LOGOS.map((logo, i) => (
              <img
                key={i}
                src={logo}
                alt={`Certification ${i + 1}`}
                style={{ maxHeight: "40px", maxWidth: "120px" }}
              />
            ))}
          </div>
        </div>
      </div>
    );

    // PDF Generation Function (reusable)
    const generatePdf = async () => {
      if (!componentRef.current) throw new Error("Component ref not ready");

      const canvas = await html2canvas(componentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgWidth = 210; // A4 width mm
      const pageHeight = 297; // A4 height mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        pdf.addPage();
        pdf.addImage(
          imgData,
          "JPEG",
          0,
          heightLeft - imgHeight,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      return pdf;
    };

    // Exposed methods via ref
    useImperativeHandle(ref, () => ({
      downloadPdf: async () => {
        try {
          const pdf = await generatePdf();
          pdf.save(`Booking_${booking.booking_id || "Confirmation"}.pdf`);
        } catch (err) {
          console.error("PDF download failed:", err);
          alert("Failed to download PDF.");
        }
      },

      handleShareSupervisorWhatsApp: async () => {
        try {
          const pdf = await generatePdf();

          // Download PDF for manual attachment
          pdf.save(`Booking_${booking.booking_id || "Confirmation"}.pdf`);

          // WhatsApp message
          const supervisorPhone = booking.supervisor?.phone_number || "";

          const message =
            `Booking Confirmation - ${booking.booking_id || "TBA"}\n` +
            `Move Date: ${booking.move_date || "N/A"}\n` +
            `Start Time: ${booking.start_time ? formatTime(booking.start_time) : "N/A"
            }\n` +
            `Supervisor: ${booking.supervisor_name || "N/A"}`;

          const whatsappUrl = `https://wa.me/${supervisorPhone.replace(
            /\+/g,
            ""
          )}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, "_blank");

          alert(
            "PDF downloaded! WhatsApp opened — attach the PDF manually before sending."
          );
        } catch (err) {
          console.error("WhatsApp share failed:", err);
          alert("Failed to prepare WhatsApp share.");
        }
      },
    }));

    return <PrintableContent />;
  }
);

export default BookingConfirmation;
