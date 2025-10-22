import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import apiClient from "../../api/apiClient";
import Button from "../../components/Button";
import { useState, useEffect } from "react";
import Loading from "../../components/Loading";

const SurveyView = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/surveys/?survey_id=${surveyId}`);
        if (response.data.length > 0) {
          setSurvey(response.data[0]);
        } else {
          setError("Survey not found.");
        }
      } catch (err) {
        setError("Failed to fetch survey data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSurvey();
  }, [surveyId]);

  if (loading) {
    return <div className="text-center py-4"><Loading/></div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        {error}
        <div className="mt-4">
          <Button
            onClick={() => navigate("/survey/survey-summary")}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Back to Surveys
          </Button>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-4 text-red-500">
        No survey data available.
        <div className="mt-4">
          <Button
            onClick={() => navigate("/survey/survey-summary")}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Back to Surveys
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "Not filled");
  const formatTime = (time) => (time ? new Date(`1970-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Not filled");
  const formatBoolean = (value) => (value ? "Yes" : "No");
  const formatValue = (value) => (value || value === false ? value.toString() : "Not filled");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto p-4 bg-white rounded-lg shadow-md"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Survey Details - {survey.survey_id}</h2>
        <Button
          onClick={() => navigate("/survey/survey-summary")}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <FaTimes size={20} />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Customer Details */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-2">Customer Details</h3>
          <table className="min-w-full border-collapse border border-gray-200">
            <tbody>
              <tr>
                <td className="border px-4 py-2 font-medium">Customer Type</td>
                <td className="border px-4 py-2">{formatValue(survey.customer_type_name)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Salutation</td>
                <td className="border px-4 py-2">{formatValue(survey.salutation)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Full Name</td>
                <td className="border px-4 py-2">{formatValue(survey.full_name)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Mobile Number</td>
                <td className="border px-4 py-2">{formatValue(survey.mobile_number)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Email</td>
                <td className="border px-4 py-2">{formatValue(survey.email)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Address</td>
                <td className="border px-4 py-2">{formatValue(survey.address)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Company</td>
                <td className="border px-4 py-2">{formatValue(survey.company)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Is Military</td>
                <td className="border px-4 py-2">{formatBoolean(survey.is_military)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Survey Details */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-2">Survey Details</h3>
          <table className="min-w-full border-collapse border border-gray-200">
            <tbody>
              <tr>
                <td className="border px-4 py-2 font-medium">Survey ID</td>
                <td className="border px-4 py-2">{formatValue(survey.survey_id)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Service Type</td>
                <td className="border px-4 py-2">{formatValue(survey.service_type_name)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Goods Type</td>
                <td className="border px-4 py-2">{formatValue(survey.goods_type)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Status</td>
                <td className="border px-4 py-2">{formatValue(survey.status)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Survey Date</td>
                <td className="border px-4 py-2">{formatDate(survey.survey_date)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Survey Start Time</td>
                <td className="border px-4 py-2">{formatTime(survey.survey_start_time)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Survey End Time</td>
                <td className="border px-4 py-2">{formatTime(survey.survey_end_time)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Work Description</td>
                <td className="border px-4 py-2">{formatValue(survey.work_description)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Include Vehicle</td>
                <td className="border px-4 py-2">{formatBoolean(survey.include_vehicle)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Include Pet</td>
                <td className="border px-4 py-2">{formatBoolean(survey.include_pet)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Cost Together (Vehicle)</td>
                <td className="border px-4 py-2">{formatBoolean(survey.cost_together_vehicle)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Cost Together (Pet)</td>
                <td className="border px-4 py-2">{formatBoolean(survey.cost_together_pet)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Origin Address */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-2">Origin Address</h3>
          <table className="min-w-full border-collapse border border-gray-200">
            <tbody>
              <tr>
                <td className="border px-4 py-2 font-medium">Same as Customer Address</td>
                <td className="border px-4 py-2">{formatBoolean(survey.same_as_customer_address)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Address</td>
                <td className="border px-4 py-2">{formatValue(survey.origin_address)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">City</td>
                <td className="border px-4 py-2">{formatValue(survey.origin_city)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Country</td>
                <td className="border px-4 py-2">{formatValue(survey.origin_country)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">State</td>
                <td className="border px-4 py-2">{formatValue(survey.origin_state)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">ZIP</td>
                <td className="border px-4 py-2">{formatValue(survey.origin_zip)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">POD/POL</td>
                <td className="border px-4 py-2">{formatValue(survey.pod_pol)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Destination Addresses */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-2">Destination Addresses</h3>
          {survey.destination_addresses && survey.destination_addresses.length > 0 ? (
            survey.destination_addresses.map((addr, index) => (
              <div key={index} className="mb-4">
                <h4 className="text-sm font-medium text-gray-700">Address {index + 1}</h4>
                <table className="min-w-full border-collapse border border-gray-200">
                  <tbody>
                    <tr>
                      <td className="border px-4 py-2 font-medium">Address</td>
                      <td className="border px-4 py-2">{formatValue(addr.address)}</td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2 font-medium">City</td>
                      <td className="border px-4 py-2">{formatValue(addr.city)}</td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2 font-medium">Country</td>
                      <td className="border px-4 py-2">{formatValue(addr.country)}</td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2 font-medium">State</td>
                      <td className="border px-4 py-2">{formatValue(addr.state)}</td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2 font-medium">ZIP</td>
                      <td className="border px-4 py-2">{formatValue(addr.zip)}</td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2 font-medium">POE</td>
                      <td className="border px-4 py-2">{formatValue(addr.poe)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p>Not filled</p>
          )}
        </div>

        {/* Move Details */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-2">Move Details</h3>
          <table className="min-w-full border-collapse border border-gray-200">
            <tbody>
              <tr>
                <td className="border px-4 py-2 font-medium">Packing Date From</td>
                <td className="border px-4 py-2">{formatDate(survey.packing_date_from)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Packing Date To</td>
                <td className="border px-4 py-2">{formatDate(survey.packing_date_to)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Loading Date</td>
                <td className="border px-4 py-2">{formatDate(survey.loading_date)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">ETA</td>
                <td className="border px-4 py-2">{formatDate(survey.eta)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">ETD</td>
                <td className="border px-4 py-2">{formatDate(survey.etd)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Est. Delivery Date</td>
                <td className="border px-4 py-2">{formatDate(survey.est_delivery_date)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Storage Details */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-2">Storage Details</h3>
          <table className="min-w-full border-collapse border border-gray-200">
            <tbody>
              <tr>
                <td className="border px-4 py-2 font-medium">Start Date</td>
                <td className="border px-4 py-2">{formatDate(survey.storage_start_date)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Frequency</td>
                <td className="border px-4 py-2">{formatValue(survey.storage_frequency)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Duration</td>
                <td className="border px-4 py-2">{formatValue(survey.storage_duration)}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Storage Mode</td>
                <td className="border px-4 py-2">{formatValue(survey.storage_mode)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Articles */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-2">Articles</h3>
          {survey.articles && survey.articles.length > 0 ? (
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Room</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Volume</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Weight</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Handyman</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Packing Option</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {survey.articles.map((article, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2">{formatValue(article.room_name)}</td>
                    <td className="border px-4 py-2">{formatValue(article.item_name)}</td>
                    <td className="border px-4 py-2">{formatValue(article.quantity)}</td>
                    <td className="border px-4 py-2">{formatValue(article.volume)} {formatValue(article.volume_unit_name)}</td>
                    <td className="border px-4 py-2">{formatValue(article.weight)} {formatValue(article.weight_unit_name)}</td>
                    <td className="border px-4 py-2">{formatValue(article.handyman_name)}</td>
                    <td className="border px-4 py-2">{formatValue(article.packing_option_name)}</td>
                    <td className="border px-4 py-2">{formatValue(article.amount)} {formatValue(article.currency_code)}</td>
                    <td className="border px-4 py-2">{formatValue(article.remarks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Not filled</p>
          )}
        </div>

        {/* Vehicles */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-2">Vehicles</h3>
          {survey.vehicles && survey.vehicles.length > 0 ? (
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Vehicle Type</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Make</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Model</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Insurance</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Remark</th>
                </tr>
              </thead>
              <tbody>
                {survey.vehicles.map((vehicle, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2">{formatValue(vehicle.vehicle_type_name)}</td>
                    <td className="border px-4 py-2">{formatValue(vehicle.make)}</td>
                    <td className="border px-4 py-2">{formatValue(vehicle.model)}</td>
                    <td className="border px-4 py-2">{formatBoolean(vehicle.insurance)}</td>
                    <td className="border px-4 py-2">{formatValue(vehicle.remark)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Not filled</p>
          )}
        </div>

        {/* Pets */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-2">Pets</h3>
          {survey.pets && survey.pets.length > 0 ? (
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Pet Name</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Pet Type</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Breed</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Age</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Weight</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Special Care</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Transport Requirements</th>
                  <th className="border px-4 py-2 text-left text-xs font-medium text-gray-500">Vaccination Status</th>
                </tr>
              </thead>
              <tbody>
                {survey.pets.map((pet, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2">{formatValue(pet.pet_name)}</td>
                    <td className="border px-4 py-2">{formatValue(pet.pet_type_name)}</td>
                    <td className="border px-4 py-2">{formatValue(pet.breed)}</td>
                    <td className="border px-4 py-2">{formatValue(pet.age)}</td>
                    <td className="border px-4 py-2">{formatValue(pet.weight)}</td>
                    <td className="border px-4 py-2">{formatValue(pet.special_care)}</td>
                    <td className="border px-4 py-2">{formatValue(pet.transport_requirements)}</td>
                    <td className="border px-4 py-2">{formatValue(pet.vaccination_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Not filled</p>
          )}
        </div>

        {/* Service Details */}
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-2">Service Details</h3>
          <table className="min-w-full border-collapse border border-gray-200">
            <tbody>
              <tr>
                <td className="border px-4 py-2 font-medium">Owner Packed</td>
                <td className="border px-4 py-2">{formatBoolean(survey.general_owner_packed)} {survey.general_owner_packed_notes && `(${survey.general_owner_packed_notes})`}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Restriction</td>
                <td className="border px-4 py-2">{formatBoolean(survey.general_restriction)} {survey.general_restriction_notes && `(${survey.general_restriction_notes})`}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Handyman</td>
                <td className="border px-4 py-2">{formatBoolean(survey.general_handyman)} {survey.general_handyman_notes && `(${survey.general_handyman_notes})`}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Insurance</td>
                <td className="border px-4 py-2">{formatBoolean(survey.general_insurance)} {survey.general_insurance_notes && `(${survey.general_insurance_notes})`}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Origin Floor</td>
                <td className="border px-4 py-2">{formatBoolean(survey.origin_floor)} {survey.origin_floor_notes && `(${survey.origin_floor_notes})`}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Origin Lift</td>
                <td className="border px-4 py-2">{formatBoolean(survey.origin_lift)} {survey.origin_lift_notes && `(${survey.origin_lift_notes})`}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Origin Parking</td>
                <td className="border px-4 py-2">{formatBoolean(survey.origin_parking)} {survey.origin_parking_notes && `(${survey.origin_parking_notes})`}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Origin Storage</td>
                <td className="border px-4 py-2">{formatBoolean(survey.origin_storage)} {survey.origin_storage_notes && `(${survey.origin_storage_notes})`}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Destination Floor</td>
                <td className="border px-4 py-2">{formatBoolean(survey.destination_floor)} {survey.destination_floor_notes && `(${survey.destination_floor_notes})`}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Destination Lift</td>
                <td className="border px-4 py-2">{formatBoolean(survey.destination_lift)} {survey.destination_lift_notes && `(${survey.destination_lift_notes})`}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Destination Parking</td>
                <td className="border px-4 py-2">{formatBoolean(survey.destination_parking)} {survey.destination_parking_notes && `(${survey.destination_parking_notes})`}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={() => navigate("/survey/survey-summary")}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Back to Surveys
        </Button>
      </div>
    </motion.div>
  );
};

export default SurveyView;