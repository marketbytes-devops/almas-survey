import React, { useRef } from "react";
import { Country, State } from "country-state-city";

const SurveyPrint = ({ survey }) => {
  const contentRef = useRef(null);

  if (!survey) {
    return <div className="text-center py-4 text-red-500">No survey data available.</div>;
  }

  const formatStatus = (status) => {
    const statusMap = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return statusMap[status] || status || "Not filled";
  };

  const getCountryName = (countryCode) => {
    if (!countryCode) return "Not filled";
    try {
      const country = Country.getCountryByCode(countryCode);
      return country ? country.name : countryCode;
    } catch {
      return countryCode;
    }
  };

  const getStateName = (countryCode, stateCode) => {
    if (!countryCode || !stateCode) return "Not filled";
    try {
      const state = State.getStateByCodeAndCountry(stateCode, countryCode);
      return state ? state.name : stateCode;
    } catch {
      return stateCode;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not filled";
    return new Date(dateString).toLocaleDateString("en-GB").split("/").reverse().join("/");
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Not filled";
    return timeString.slice(0, 5);
  };

  const formatBoolean = (value) => (value ? "Yes" : "No");

  const formatVolume = (volume) => {
    if (!volume && volume !== 0) return "-";
    const num = parseFloat(volume);
    return num % 1 === 0 ? num.toString() : num.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  };

  const getCustomerData = (field) => {
    const fieldMap = {
      full_name: "full_name",
      mobile_number: "phone_number",
      email: "email",
      salutation: "salutation",
    };

    const surveyField = fieldMap[field] || field;
    const surveyValue = survey[surveyField];
    if (surveyValue !== null && surveyValue !== undefined && surveyValue !== "") {
      return surveyValue;
    }

    const enquiryField =
      field === "full_name"
        ? "fullName"
        : field === "mobile_number"
          ? "phoneNumber"
          : field === "email"
            ? "email"
            : field;

    const enquiryValue = survey.enquiry?.[enquiryField];
    if (enquiryValue !== null && enquiryValue !== undefined && enquiryValue !== "") {
      return enquiryValue;
    }

    return "Not filled";
  };

  const totalVolume = survey.articles
    ? survey.articles.reduce((total, a) => {
      const vol = parseFloat(a.volume) || 0;
      const qty = parseInt(a.quantity) || 1;
      return total + vol * qty;
    }, 0)
    : 0;

  return (
    <div className="print-container" ref={contentRef}>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 0.75cm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }

          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            color: #000;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            background: white;
          }

          .print-container {
            max-width: 19.05cm;
            margin: 0 auto;
          }

          .print-header {
            text-align: center;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }

          .print-header h1 {
            font-size: 18pt;
            color: #4c7085;
            margin: 0 0 8px 0;
            font-weight: bold;
          }

          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }

          .section h3 {
            font-size: 13pt;
            color: #4c7085;
            margin: 15px 0 10px 0;
            font-weight: bold;
            page-break-after: avoid;
          }

          .section h4 {
            font-size: 11pt;
            color: #333;
            margin: 12px 0 8px 0;
            font-weight: 600;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 9pt;
          }

          th, td {
            border: 1px solid #000;
            padding: 6px 4px;
            text-align: left;
            vertical-align: top;
          }

          th {
            background-color: #e8f0f2 !important;
            font-weight: bold;
          }

          .field-col { width: 30%; }
          .value-col { width: 70%; }

          .total-row {
            background-color: #4c7085 !important;
            color: white;
            font-weight: bold;
            font-size: 10pt;
          }

          .signature-section {
            margin-top: 40px;
            page-break-inside: avoid;
          }

          .signature-box {
            border: 1px solid #000;
            height: 100px;
            width: 300px;
            margin: 20px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9f9f9;
          }

          .signature-box img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }

          @media screen {
            .print-container {
              padding: 30px;
              background: #fff;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              margin: 20px auto;
            }
          }

          .no-print { display: none !important; }
        `}
      </style>

      <div className="print-header">
        <h1>SURVEY REPORT</h1>
        <p className="subtitle">
          <strong>{survey.survey_id}</strong> | {survey.service_type_display || survey.service_type_name || "N/A"}
          {survey.additional_services?.length > 0 && (
            <span> | Additional Services: {survey.additional_services.length}</span>
          )}
        </p>
      </div>

      <div className="space-y-4">
        <div className="section">
          <h3>1. Customer Details</h3>
          <table>
            <thead>
              <tr>
                <th className="field-col">Field</th>
                <th className="value-col">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="font-medium">Customer Type</td><td>{survey.customer_type_name || "Not filled"}</td></tr>
              <tr><td className="font-medium">Salutation</td><td>{getCustomerData("salutation")}</td></tr>
              <tr><td className="font-medium">Full Name</td><td><strong>{getCustomerData("full_name")}</strong></td></tr>
              <tr><td className="font-medium">Mobile Number</td><td><strong>{getCustomerData("mobile_number")}</strong></td></tr>
              <tr><td className="font-medium">Email</td><td>{getCustomerData("email")}</td></tr>
              <tr><td className="font-medium">Address</td><td>{survey.address || "Not filled"}</td></tr>
              <tr><td className="font-medium">Company</td><td>{survey.company || "Not filled"}</td></tr>
              <tr><td className="font-medium">Is Military</td><td>{formatBoolean(survey.is_military)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="section">
          <h3>2. Survey Details</h3>
          <table>
            <thead>
              <tr><th className="field-col">Field</th><th className="value-col">Value</th></tr>
            </thead>
            <tbody>
              <tr><td className="font-medium">Service Type</td><td>{survey.service_type_display || survey.service_type_name || "Not filled"}</td></tr>
              <tr><td className="font-medium">Goods Type</td><td>{survey.goods_type || "Not filled"}</td></tr>
              <tr><td className="font-medium">Status</td><td>{formatStatus(survey.status)}</td></tr>
              <tr><td className="font-medium">Survey Date</td><td>{formatDate(survey.survey_date)}</td></tr>
              <tr><td className="font-medium">Survey Start Time</td><td>{formatTime(survey.survey_start_time)}</td></tr>
              <tr><td className="font-medium">Survey End Time</td><td>{formatTime(survey.survey_end_time)}</td></tr>
              <tr><td className="font-medium">Work Description</td><td>{survey.work_description || "Not filled"}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="section">
          <h3>3. Origin Address</h3>
          <table>
            <thead>
              <tr><th className="field-col">Field</th><th className="value-col">Value</th></tr>
            </thead>
            <tbody>
              <tr><td className="font-medium">Same as Customer Address</td><td>{formatBoolean(survey.same_as_customer_address)}</td></tr>
              <tr><td className="font-medium">Address</td><td>{survey.origin_address || "Not filled"}</td></tr>
              <tr><td className="font-medium">City</td><td>{survey.origin_city || "Not filled"}</td></tr>
              <tr><td className="font-medium">Country</td><td>{getCountryName(survey.origin_country)}</td></tr>
              <tr><td className="font-medium">State</td><td>{getStateName(survey.origin_country, survey.origin_state)}</td></tr>
              <tr><td className="font-medium">ZIP</td><td>{survey.origin_zip || "Not filled"}</td></tr>
              <tr><td className="font-medium">POD/POL</td><td>{survey.pod_pol || "Not filled"}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="section">
          <h3>4. Destination Address{survey.destination_addresses?.length > 1 ? "es" : ""}</h3>
          {survey.destination_addresses?.length > 0 ? (
            survey.destination_addresses.map((addr, index) => (
              <div key={index} className="mb-4">
                <h4>Address {index + 1}</h4>
                <table>
                  <thead>
                    <tr><th className="field-col">Field</th><th className="value-col">Value</th></tr>
                  </thead>
                  <tbody>
                    <tr><td className="font-medium">Address</td><td>{addr.address || "Not filled"}</td></tr>
                    <tr><td className="font-medium">City</td><td>{addr.city || "Not filled"}</td></tr>
                    <tr><td className="font-medium">Country</td><td>{getCountryName(addr.country)}</td></tr>
                    <tr><td className="font-medium">State</td><td>{getStateName(addr.country, addr.state)}</td></tr>
                    <tr><td className="font-medium">ZIP</td><td>{addr.zip || "Not filled"}</td></tr>
                    <tr><td className="font-medium">POE</td><td>{addr.poe || "Not filled"}</td></tr>
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p>No destination addresses</p>
          )}
        </div>

        <div className="section">
          <h3>5. Articles ({survey.articles?.length || 0})</h3>
          {survey.articles?.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Volume</th>
                  <th>Crate Required</th>
                  <th>Moving Status</th>
                  <th>Photo</th>
                </tr>
              </thead>
              <tbody>
                {survey.articles.map((a, i) => (
                  <tr key={i}>
                    <td>{a.room_name || a.room || "-"}</td>
                    <td>{a.item_name || "-"}</td>
                    <td>{a.quantity || "-"}</td>
                    <td>{a.volume ? `${formatVolume(a.volume)} ${a.volume_unit_name || "m³"}` : "-"}</td>
                    <td>{formatBoolean(a.crate_required)}</td>
                    <td>{a.move_status === "not_moving" ? "Not Moving" : "Moving"}</td>
                    <td style={{ textAlign: "center" }}>
                      {a.photo ? (
                        <img
                          src={a.photo}
                          alt={a.item_name}
                          style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ddd" }}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan="3" style={{ textAlign: "right" }}>Total Volume:</td>
                  <td style={{ textAlign: "center" }}>{formatVolume(totalVolume)} m³</td>
                  <td colSpan="3"></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p>No articles added</p>
          )}
        </div>

        <div className="section">
          <h3>6. Vehicles ({survey.vehicles?.length || 0})</h3>
          {survey.vehicles?.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Insurance</th>
                </tr>
              </thead>
              <tbody>
                {survey.vehicles.map((v, i) => (
                  <tr key={i}>
                    <td>{v.vehicle_type_name || v.vehicle_type || "-"}</td>
                    <td>{v.make || "-"}</td>
                    <td>{v.model || "-"}</td>
                    <td>{formatBoolean(v.insurance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No vehicles added</p>
          )}
        </div>

        <div className="section">
          <h3>7. Additional Services</h3>
          {survey.additional_services?.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th style={{ width: "80px", textAlign: "center" }}>Qty</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {survey.additional_services.map((service, i) => (
                  <tr key={i}>
                    <td>{service.name || "Unknown Service"}</td>
                    <td style={{ textAlign: "center" }}>{service.quantity || 1}</td>
                    <td>{service.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No additional services selected</p>
          )}
        </div>

        <div className="signature-section">
          <h3>Customer Signature</h3>
          {survey.signature_uploaded && survey.signature_url ? (
            <div className="signature-box">
              <img src={survey.signature_url} alt="Customer Signature" />
            </div>
          ) : (
            <div className="signature-box">
              <p style={{ color: "#999", fontStyle: "italic" }}>No signature uploaded</p>
            </div>
          )}
          <p style={{ marginTop: "10px" }}>
            <strong>Name:</strong> {getCustomerData("full_name")} &nbsp;&nbsp;&nbsp;
            <strong>Date:</strong> {formatDate(survey.survey_date)}
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-center no-print">
        <button
          onClick={() => window.print()}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          Print Survey Report
        </button>
      </div>
    </div>
  );
};

export default SurveyPrint;