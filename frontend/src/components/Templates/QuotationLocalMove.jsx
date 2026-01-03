import React from "react";

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
  baseAmount,
  additionalChargesTotal,
  additionalCharges,
  includedServices,
  excludedServices,
}) {
  const totalVolume = survey?.articles?.reduce(
    (sum, a) => sum + parseFloat(a.volume || 0) * (a.quantity || 0),
    0
  )?.toFixed(2) || "0.00";

  const currency = "QAR";

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        fontSize: "10pt",
        color: "#000",
        lineHeight: "1.4",
      }}
    >
      {/* Header Section */}
      <table style={{ width: "100%", marginBottom: "20px" }}>
        <tbody>
          <tr>
            <td>
              <h1 style={{ fontSize: "18pt", color: "#FFD700" }}>
                ALMAS MOVERS
              </h1>
            </td>
            <td style={{ textAlign: "right", fontSize: "9pt" }}>
              <p>
                <strong>Quote #</strong>{" "}
                {quotation?.quotation_id || "QUOT-4-20251127072253"}
              </p>
              <p>
                <strong>REF #</strong> {quotation?.serial_no || "1001"}
              </p>
              <p>
                <strong>Date:</strong> {quotation?.date || "2025-11-27"}
              </p>
              <p>
                <strong>Contact Person:</strong> {name}
              </p>
              <p>
                <strong>Email:</strong> {email}
              </p>
              <p>
                <strong>Office #:</strong> {phone}
              </p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Rate Header */}
      <div
        style={{
          backgroundColor: "darkblue",
          color: "white",
          textAlign: "center",
          padding: "8px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "14pt" }}>
          Your Rate is {totalAmount.toFixed(2)} {currency}
        </h2>
      </div>

      {/* Greeting Section */}
      <p>Dear {name},</p>
      <p>Prepared by Muhammad KP</p>
      <p>
        Thank you for your rate request. Our rate is based on the Density Factor
        of 6.5/LBS-Cuft, valid for 30 days.
      </p>

      {/* Shipment Information */}
      <div
        style={{
          border: "1px solid blue",
          borderRadius: "5px",
          padding: "10px",
          marginBottom: "20px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: "5px",
          }}
        >
          <tbody>
            <tr>
              <td style={{ width: "20%" }}>
                <strong>Shipment Type:</strong>
              </td>
              <td style={{ width: "30%" }}>{service}</td>
              <td style={{ width: "20%" }}>
                <strong>Destination City:</strong>
              </td>
              <td style={{ width: "30%" }}>{movingTo}</td>
            </tr>
            <tr>
              <td>
                <strong>Volume:</strong>
              </td>
              <td>{totalVolume}</td>
              <td>
                <strong>County/Province:</strong>
              </td>
              <td>{survey?.destination_addresses?.[0]?.province || ""}</td>
            </tr>
            <tr>
              <td>
                <strong>Based In:</strong>
              </td>
              <td>CBM</td>
              <td>
                <strong>POE/Term:</strong>
              </td>
              <td>{survey?.destination_addresses?.[0]?.term || ""}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Breakdown of Charges */}
      <h3 style={{ fontSize: "12pt", marginBottom: "5px" }}>
        Breakdown of Charges (All Prices In {currency})
      </h3>
      <p style={{ fontSize: "9pt", marginBottom: "10px" }}>
        Services Required: Standard Destination Service
      </p>

      <table
        style={{
          width: "50%",
          borderCollapse: "collapse",
          marginBottom: "10px",
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: "5px" }}>
              <strong>Base Amount (Volume Pricing):</strong>
            </td>
            <td style={{ padding: "5px", textAlign: "right" }}>
              {baseAmount.toFixed(2)}
            </td>
          </tr>

          {additionalCharges.map((charge) => {
            const quantity = charge.per_unit_quantity || 1;
            const subtotal = charge.price_per_unit * quantity;

            return (
              <tr key={charge.id}>
                <td style={{ padding: "5px" }}>
                  <strong>{charge.service.name}:</strong>
                </td>
                <td style={{ padding: "5px", textAlign: "right" }}>
                  {subtotal.toFixed(2)}
                </td>
              </tr>
            );
          })}

          <tr>
            <td style={{ padding: "5px" }}>
              <strong>Total Rate:</strong>
            </td>
            <td style={{ padding: "5px", textAlign: "right" }}>
              {totalAmount.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Advance and Balance */}
      <table
        style={{
          width: "50%",
          borderCollapse: "collapse",
          marginBottom: "20px",
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: "5px" }}>
              <strong>Advance:</strong>
            </td>
            <td style={{ padding: "5px", textAlign: "right" }}>
              {advance.toFixed(2)}
            </td>
          </tr>
          <tr>
            <td style={{ padding: "5px" }}>
              <strong>Balance:</strong>
            </td>
            <td style={{ padding: "5px", textAlign: "right" }}>
              {balance}
            </td>
          </tr>
        </tbody>
      </table>

      <p
        style={{
          fontSize: "9pt",
          textTransform: "uppercase",
          marginBottom: "20px",
        }}
      >
        PLEASE PREPAY DTHC/D.O CHARGES AT ORIGIN. PLEASE NOTE AN ADMIN CHARGES
        APPLICABLE {currency} 50.00 IF DTHC/D.O CHARGES NOT PREPAID AT ORIGIN.
      </p>

      {/* Page Break for Includes/Excludes */}
      <div style={{ pageBreakBefore: "always" }}></div>

      {/* Service Includes & Excludes */}
      <div style={{ pageBreakInside: "avoid" }}>
        {/* Service Includes */}
        <div
          style={{
            backgroundColor: "darkblue",
            color: "white",
            padding: "8px",
            marginBottom: "10px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "12pt" }}>Service Includes</h3>
        </div>
        <ul
          style={{
            listStyleType: "disc",
            paddingLeft: "20px",
            marginBottom: "20px",
            fontSize: "9pt",
          }}
        >
          {includedServices.length > 0 ? (
            includedServices.map((service, i) => (
              <li key={i}>{service}</li>
            ))
          ) : (
            <li>No services included</li>
          )}
        </ul>

        {/* Service Excludes */}
        <div
          style={{
            backgroundColor: "darkblue",
            color: "white",
            padding: "8px",
            marginBottom: "10px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "12pt" }}>Service Excludes</h3>
        </div>
        <ul
          style={{
            listStyleType: "disc",
            paddingLeft: "20px",
            marginBottom: "20px",
            fontSize: "9pt",
          }}
        >
          {excludedServices.length > 0 ? (
            excludedServices.map((service, i) => (
              <li key={i}>{service}</li>
            ))
          ) : (
            <li>No services excluded</li>
          )}
        </ul>

        {/* Comments */}

      </div>

      {/* Page Break for Detailed Information */}


      {/* Documents Required */}



      {/* Prohibited Items */}


      {/* Restricted Items */}

    </div>
  );
}