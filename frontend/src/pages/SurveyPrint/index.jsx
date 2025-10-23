import React, { useRef } from "react";
import { Country, State, City } from "country-state-city";

const SurveyPrint = ({ survey }) => {
  const contentRef = useRef(null);

  if (!survey) {
    return <div className="text-center py-4 text-red-500">No survey data available.</div>;
  }

  // ADDED: Helper function to format status display
  const formatStatus = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
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

  const getCityName = (countryCode, stateCode, cityName) => {
    if (!countryCode || !stateCode || !cityName) return "Not filled";
    return cityName;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not filled";
    return new Date(dateString).toLocaleDateString('en-GB').split('/').reverse().join('/');
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Not filled";
    return timeString.slice(0, 5);
  };

  const formatBoolean = (value) => (value ? "Yes" : "No");

  const getCustomerData = (field) => {
    const fieldMap = {
      full_name: 'full_name',
      mobile_number: 'phone_number', 
      email: 'email',
      salutation: 'salutation'
    };
    
    const surveyField = fieldMap[field] || field;
    
    const surveyValue = survey[surveyField];
    if (surveyValue !== null && surveyValue !== undefined && surveyValue !== '') {
      return surveyValue;
    }
    
    const enquiryField = field === 'full_name' ? 'fullName' : 
                        field === 'mobile_number' ? 'phoneNumber' : 
                        field === 'email' ? 'email' : field;
    
    const enquiryValue = survey.enquiry?.[enquiryField];
    if (enquiryValue !== null && enquiryValue !== undefined && enquiryValue !== '') {
      return enquiryValue;
    }
    
    return "Not filled";
  };

  const calculateTotalCost = () => {
    if (!survey.articles?.length) return [];
    const costByCurrency = survey.articles.reduce((acc, article) => {
      if (article.amount && article.currency_code) {
        acc[article.currency_code] = (acc[article.currency_code] || 0) + parseFloat(article.amount);
      }
      return acc;
    }, {});
    return Object.entries(costByCurrency).map(([currency, total]) => ({
      currency,
      total: total.toFixed(2),
    }));
  };

  const totalCosts = calculateTotalCost();

  return (
    <div className="print-container" ref={contentRef}>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 0.5cm 0.5cm 0.5cm 0.5cm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }

          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 10pt;
            color: #000;
            line-height: 1.3;
            margin: 0;
            padding: 0;
            background: white;
          }

          .print-container {
            max-width: 19.05cm !important;
            margin: 0 auto;
            padding: 0;
          }

          .print-header {
            text-align: center;
            padding-bottom: 12px;
            margin-bottom: 20px;
            page-break-after: avoid;
          }

          .print-header h1 {
            font-size: 16pt;
            color: #4c7085;
            margin: 0 0 8px 0;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .print-header .subtitle {
            font-size: 11pt;
            margin: 0;
            font-weight: 500;
            color: #333;
          }

          .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .section h3 {
            font-size: 12pt;
            color: #4c7085;
            padding-bottom: 6px;
            margin: 15px 0 10px 0;
            font-weight: bold;
            page-break-after: avoid;
          }

          .section h4 {
            font-size: 11pt;
            color: #333;
            margin: 12px 0 8px 0;
            font-weight: 600;
            page-break-after: avoid;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 9pt;
            page-break-inside: auto;
          }

          th, td {
            border: 1px solid #000;
            padding: 6px 4px;
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
            white-space: nowrap !important;
          }

          th {
            background-color: #e8f0f2 !important;
            font-weight: bold;
            color: #000;
            font-size: 9pt;
          }

          .field-col { width: 30%; }
          .value-col { width: 70%; }
          .articles-col { font-size: 8pt; }

          .total-row {
            background-color: #f0f8ff !important;
            font-weight: bold;
            font-size: 10pt !important;
          }

          .no-break { page-break-inside: avoid; }
          .page-break { page-break-before: always; }

          .no-print { display: none !important; }

          @media screen {
            .print-container {
              padding: 20px;
              max-width: 21cm;
              margin: 0 auto;
              background: #fff;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
          }
        `}
      </style>

      <div className="print-header">
        <h1>SURVEY REPORT</h1>
        <p className="subtitle">
          <strong>{survey.survey_id}</strong> | {survey.service_type_display || survey.service_type_name || 'N/A'}
          {totalCosts.length > 0 && (
            <span> | Total: {totalCosts.map(c => `${c.total} ${c.currency}`).join(', ')}</span>
          )}
        </p>
      </div>

      <div className="space-y-4">
        <div className="section no-break">
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
              <tr><td className="font-medium">Salutation</td><td>{getCustomerData('salutation')}</td></tr>
              <tr><td className="font-medium">Full Name</td><td><strong>{getCustomerData('full_name')}</strong></td></tr>
              <tr><td className="font-medium">Mobile Number</td><td><strong>{getCustomerData('mobile_number')}</strong></td></tr>
              <tr><td className="font-medium">Email</td><td>{getCustomerData('email')}</td></tr>
              <tr><td className="font-medium">Address</td><td>{survey.address || "Not filled"}</td></tr>
              <tr><td className="font-medium">Company</td><td>{survey.company || "Not filled"}</td></tr>
              <tr><td className="font-medium">Is Military</td><td>{formatBoolean(survey.is_military)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="section no-break">
          <h3>2. Survey Details</h3>
          <table>
            <thead>
              <tr><th className="field-col">Field</th><th className="value-col">Value</th></tr>
            </thead>
            <tbody>
              <tr><td className="font-medium">Service Type</td><td>{survey.service_type_display || survey.service_type_name || "Not filled"}</td></tr>
              <tr><td className="font-medium">Goods Type</td><td>{survey.goods_type || "Not filled"}</td></tr>
              <tr><td className="font-medium">Status</td><td>{formatStatus(survey.status)}</td></tr> {/* MODIFIED */}
              <tr><td className="font-medium">Survey Date</td><td>{formatDate(survey.survey_date)}</td></tr>
              <tr><td className="font-medium">Survey Start Time</td><td>{formatTime(survey.survey_start_time)}</td></tr>
              <tr><td className="font-medium">Survey End Time</td><td>{formatTime(survey.survey_end_time)}</td></tr>
              <tr><td className="font-medium">Work Description</td><td>{survey.work_description || "Not filled"}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="section no-break">
          <h3>3. Origin Address</h3>
          <table>
            <thead>
              <tr><th className="field-col">Field</th><th className="value-col">Value</th></tr>
            </thead>
            <tbody>
              <tr><td className="font-medium">Same as Customer Address</td><td>{formatBoolean(survey.same_as_customer_address)}</td></tr>
              <tr><td className="font-medium">Address</td><td>{survey.origin_address || "Not filled"}</td></tr>
              <tr><td className="font-medium">City</td><td>{getCityName(survey.origin_country, survey.origin_state, survey.origin_city)}</td></tr>
              <tr><td className="font-medium">Country</td><td>{getCountryName(survey.origin_country)}</td></tr>
              <tr><td className="font-medium">State</td><td>{getStateName(survey.origin_country, survey.origin_state)}</td></tr>
              <tr><td className="font-medium">ZIP</td><td>{survey.origin_zip || "Not filled"}</td></tr>
              <tr><td className="font-medium">POD/POL</td><td>{survey.pod_pol || "Not filled"}</td></tr>
              <tr><td className="font-medium">Floor</td><td>{survey.origin_floor ? `${formatBoolean(survey.origin_floor)} ${survey.origin_floor_notes || ''}` : "Not filled"}</td></tr>
              <tr><td className="font-medium">Lift</td><td>{formatBoolean(survey.origin_lift)} {survey.origin_lift_notes || ''}</td></tr>
              <tr><td className="font-medium">Parking</td><td>{formatBoolean(survey.origin_parking)} {survey.origin_parking_notes || ''}</td></tr>
              <tr><td className="font-medium">Storage</td><td>{formatBoolean(survey.origin_storage)} {survey.origin_storage_notes || ''}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="section">
          <h3>4. Destination Address{survey.destination_addresses?.length > 1 ? 'es' : ''}</h3>
          {survey.destination_addresses?.length > 0 ? (
            survey.destination_addresses.map((addr, index) => (
              <div key={index} className="no-break">
                <h4>Address {index + 1}</h4>
                <table>
                  <thead>
                    <tr><th className="field-col">Field</th><th className="value-col">Value</th></tr>
                  </thead>
                  <tbody>
                    <tr><td className="font-medium">Address</td><td>{addr.address || "Not filled"}</td></tr>
                    <tr><td className="font-medium">City</td><td>{getCityName(addr.country, addr.state, addr.city)}</td></tr>
                    <tr><td className="font-medium">Country</td><td>{getCountryName(addr.country)}</td></tr>
                    <tr><td className="font-medium">State</td><td>{getStateName(addr.country, addr.state)}</td></tr>
                    <tr><td className="font-medium">ZIP</td><td>{addr.zip || "Not filled"}</td></tr>
                    <tr><td className="font-medium">POE</td><td>{addr.poe || "Not filled"}</td></tr>
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <table>
              <tbody><tr><td className="font-medium">No destination addresses</td></tr></tbody>
            </table>
          )}
        </div>

        <div className="section no-break">
          <h3>5. Move Details</h3>
          <table>
            <thead>
              <tr><th className="field-col">Field</th><th className="value-col">Value</th></tr>
            </thead>
            <tbody>
              <tr><td className="font-medium">Packing Date From</td><td>{formatDate(survey.packing_date_from)}</td></tr>
              <tr><td className="font-medium">Packing Date To</td><td>{formatDate(survey.packing_date_to)}</td></tr>
              <tr><td className="font-medium">Loading Date</td><td>{formatDate(survey.loading_date)}</td></tr>
              <tr><td className="font-medium">ETA</td><td>{formatDate(survey.eta)}</td></tr>
              <tr><td className="font-medium">ETD</td><td>{formatDate(survey.etd)}</td></tr>
              <tr><td className="font-medium">Est. Delivery Date</td><td>{formatDate(survey.est_delivery_date)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="section no-break">
          <h3>6. Storage Details</h3>
          <table>
            <thead>
              <tr><th className="field-col">Field</th><th className="value-col">Value</th></tr>
            </thead>
            <tbody>
              <tr><td className="font-medium">Start Date</td><td>{formatDate(survey.storage_start_date)}</td></tr>
              <tr><td className="font-medium">Frequency</td><td>{survey.storage_frequency || "Not filled"}</td></tr>
              <tr><td className="font-medium">Duration</td><td>{survey.storage_duration || "Not filled"}</td></tr>
              <tr><td className="font-medium">Storage Mode</td><td>{survey.storage_mode || "Not filled"}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="section no-break">
          <h3>7. Vehicle Details</h3>
          <table>
            <thead>
              <tr><th className="field-col">Field</th><th className="value-col">Value</th></tr>
            </thead>
            <tbody>
              <tr><td className="font-medium">Include Vehicle</td><td>{formatBoolean(survey.include_vehicle)}</td></tr>
              <tr><td className="font-medium">Cost Together</td><td>{formatBoolean(survey.cost_together_vehicle)}</td></tr>
            </tbody>
          </table>
          {survey.vehicles?.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th style={{width: '20%'}}>Vehicle Type</th>
                  <th style={{width: '15%'}}>Make</th>
                  <th style={{width: '15%'}}>Model</th>
                  <th style={{width: '10%'}}>Insurance</th>
                  <th style={{width: '40%'}}>Remark</th>
                </tr>
              </thead>
              <tbody>
                {survey.vehicles.map((v, i) => (
                  <tr key={i}>
                    <td>{v.vehicle_type_name || "-"}</td>
                    <td>{v.make || "-"}</td>
                    <td>{v.model || "-"}</td>
                    <td>{formatBoolean(v.insurance)}</td>
                    <td>{v.remark || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="section no-break">
          <h3>8. Pet Details</h3>
          <table>
            <thead>
              <tr><th className="field-col">Field</th><th className="value-col">Value</th></tr>
            </thead>
            <tbody>
              <tr><td className="font-medium">Include Pet</td><td>{formatBoolean(survey.include_pet)}</td></tr>
              <tr><td className="font-medium">Cost Together</td><td>{formatBoolean(survey.cost_together_pet)}</td></tr>
              <tr><td className="font-medium">Number of Pets</td><td>{survey.pets?.length || 0}</td></tr>
            </tbody>
          </table>
          {survey.pets?.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th style={{width: '12%'}}>Name</th>
                  <th style={{width: '12%'}}>Type</th>
                  <th style={{width: '12%'}}>Breed</th>
                  <th style={{width: '8%'}}>Age</th>
                  <th style={{width: '8%'}}>Weight</th>
                  <th style={{width: '12%'}}>Special Care</th>
                  <th style={{width: '12%'}}>Vaccination</th>
                </tr>
              </thead>
              <tbody>
                {survey.pets.map((pet, i) => (
                  <tr key={i}>
                    <td>{pet.pet_name || "-"}</td>
                    <td>{pet.pet_type_name || "-"}</td>
                    <td>{pet.breed || "-"}</td>
                    <td>{pet.age || "-"}</td>
                    <td>{pet.weight || "-"}</td>
                    <td>{pet.special_care || "-"}</td>
                    <td>{pet.vaccination_status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {survey.articles?.length > 0 && (
          <div className="section">
            <h3>9. Articles ({survey.articles.length})</h3>
            <table>
              <thead>
                <tr>
                  <th style={{width: '8%'}}>Room</th>
                  <th style={{width: '12%'}}>Item</th>
                  <th style={{width: '5%'}}>Qty</th>
                  <th style={{width: '8%'}}>Volume</th>
                  <th style={{width: '8%'}}>Weight</th>
                  <th style={{width: '10%'}}>Handyman</th>
                  <th style={{width: '12%'}}>Packing</th>
                  <th style={{width: '8%'}}>Amount</th>
                  <th style={{width: '29%'}}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {survey.articles.map((article, i) => (
                  <tr key={i}>
                    <td className="articles-col">{article.room_name || "-"}</td>
                    <td className="articles-col">{article.item_name || "-"}</td>
                    <td className="articles-col">{article.quantity || "-"}</td>
                    <td className="articles-col">{article.volume || "-"} {article.volume_unit_name || ""}</td>
                    <td className="articles-col">{article.weight || "-"} {article.weight_unit_name || ""}</td>
                    <td className="articles-col">{article.handyman_name || "-"}</td>
                    <td className="articles-col">{article.packing_option_name || "-"}</td>
                    <td className="articles-col">{article.amount || "-"} {article.currency_code || ""}</td>
                    <td className="articles-col">{article.remarks || "-"}</td>
                  </tr>
                ))}
                {totalCosts.length > 0 && (
                  <tr className="total-row">
                    <td colSpan="7"><strong>Total</strong></td>
                    <td colSpan="2">
                      <strong>{totalCosts.map(c => `${c.total} ${c.currency}`).join(', ')}</strong>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 10. SERVICE DETAILS */}
        <div className="section no-break">
          <h3>10. Service Details</h3>
          <table>
            <thead>
              <tr>
                <th style={{width: '25%'}}>Service</th>
                <th style={{width: '15%'}}>Status</th>
                <th style={{width: '60%'}}>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="font-medium">Owner Packed</td><td>{formatBoolean(survey.general_owner_packed)}</td><td>{survey.general_owner_packed_notes || "-"}</td></tr>
              <tr><td className="font-medium">Restriction</td><td>{formatBoolean(survey.general_restriction)}</td><td>{survey.general_restriction_notes || "-"}</td></tr>
              <tr><td className="font-medium">Handyman</td><td>{formatBoolean(survey.general_handyman)}</td><td>{survey.general_handyman_notes || "-"}</td></tr>
              <tr><td className="font-medium">Insurance</td><td>{formatBoolean(survey.general_insurance)}</td><td>{survey.general_insurance_notes || "-"}</td></tr>
              <tr><td className="font-medium">Origin Floor</td><td>{formatBoolean(survey.origin_floor)}</td><td>{survey.origin_floor_notes || "-"}</td></tr>
              <tr><td className="font-medium">Origin Lift</td><td>{formatBoolean(survey.origin_lift)}</td><td>{survey.origin_lift_notes || "-"}</td></tr>
              <tr><td className="font-medium">Origin Parking</td><td>{formatBoolean(survey.origin_parking)}</td><td>{survey.origin_parking_notes || "-"}</td></tr>
              <tr><td className="font-medium">Origin Storage</td><td>{formatBoolean(survey.origin_storage)}</td><td>{survey.origin_storage_notes || "-"}</td></tr>
              <tr><td className="font-medium">Destination Floor</td><td>{formatBoolean(survey.destination_floor)}</td><td>{survey.destination_floor_notes || "-"}</td></tr>
              <tr><td className="font-medium">Destination Lift</td><td>{formatBoolean(survey.destination_lift)}</td><td>{survey.destination_lift_notes || "-"}</td></tr>
              <tr><td className="font-medium">Destination Parking</td><td>{formatBoolean(survey.destination_parking)}</td><td>{survey.destination_parking_notes || "-"}</td></tr>
            </tbody>
          </table>
        </div>

        {/* 11. TRANSPORT MODE */}
        <div className="section no-break">
          <h3>11. Transport Mode</h3>
          <table>
            <thead>
              <tr><th className="field-col">Field</th><th className="value-col">Value</th></tr>
            </thead>
            <tbody>
              <tr><td className="font-medium">Transport Mode</td><td>{survey.transport_mode || "Not filled"}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SCREEN ONLY - HIDDEN ON PRINT */}
      <div className="mt-6 flex justify-center no-print">
        <button
          onClick={() => window.print()}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          🖨️ Print Survey Report
        </button>
      </div>
    </div>
  );
};

export default SurveyPrint;