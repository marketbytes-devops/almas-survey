// src/components/Templates/QuotationLocalMove.jsx
import Logo from '../../assets/images/logo-quotation.webp';

const QuotationLocalMove = ({ 
  quotation = {}, 
  survey = {}, 
  name = "—", 
  phone = "—", 
  email = "—", 
  service = "—", 
  movingTo = "—", 
  moveDate = "—", 
  totalAmount = 0, 
  advance = 0, 
  balance = 0,
  baseAmount = 0,
  additionalChargesTotal = 0,
  additionalCharges = []
}) => {
  const date = quotation?.date || new Date().toLocaleDateString('en-GB');

  // SAFE number conversion
  const safeFixed = (val) => (parseFloat(val) || 0).toFixed(2);

  // Calculate total volume for display
  const totalVolume = survey?.articles?.reduce((sum, a) => 
    sum + parseFloat(a.volume || 0) * (a.quantity || 0), 0
  )?.toFixed(2) || "0.00";

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 print:p-8 print:max-w-none">
      {/* Header Section */}
      <div className="border-b-2 border-gray-300 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <img src={Logo} alt="Almas Movers" className="h-16 mb-2" />
            <p className="text-sm text-gray-600">
              Almas Movers International<br />
              freight@almasintl.com | +974 5013 6999
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-[#314a8a] mb-2">QUOTATION</h1>
            <div className="text-sm space-y-1">
              <p><strong>Quotation #:</strong> {quotation?.quotation_id || "—"}</p>
              <p><strong>Serial No:</strong> {quotation?.serial_no || "—"}</p>
              <p><strong>Date:</strong> {date}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Client & Moving Details */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="border border-gray-200 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-[#314a8a] border-b pb-2">CLIENT INFORMATION</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Mobile:</strong> {phone}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Service Type:</strong> {service}</p>
          </div>
        </div>

        <div className="border border-gray-200 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-[#314a8a] border-b pb-2">MOVING DETAILS</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Moving From:</strong> {survey?.origin_address || "—"}</p>
            <p><strong>Moving To:</strong> {movingTo}</p>
            <p><strong>Date of Move:</strong> {moveDate}</p>
            <p><strong>Total Volume:</strong> {totalVolume} CBM</p>
          </div>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="border border-gray-200 p-6 rounded-lg mb-6">
        <h3 className="font-bold text-lg mb-4 text-[#314a8a] border-b pb-2">QUOTATION BREAKDOWN</h3>
        
        <div className="space-y-3 mb-4">
          {/* Base Amount */}
          <div className="flex justify-between items-center py-2 border-b">
            <div>
              <span className="font-medium">Base Amount (Volume Pricing)</span>
              <div className="text-xs text-gray-600">{totalVolume} CBM</div>
            </div>
            <span className="font-bold text-blue-700">{safeFixed(baseAmount)} QAR</span>
          </div>

          {/* Additional Services */}
          {additionalChargesTotal > 0 && (
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <span className="font-medium">Additional Services</span>
                <div className="text-xs text-gray-600">{additionalCharges.length} service(s)</div>
              </div>
              <span className="font-bold text-purple-700">+ {safeFixed(additionalChargesTotal)} QAR</span>
            </div>
          )}

          {/* Additional Services Details */}
          {additionalCharges.map((charge, index) => {
            const quantity = charge.per_unit_quantity || 1;
            const subtotal = charge.price_per_unit * quantity;
            return (
              <div key={index} className="flex justify-between items-center py-1 text-sm ml-4">
                <div>
                  <span className="text-gray-600">• {charge.service?.name}: </span>
                  <span className="text-xs text-gray-500">
                    {charge.price_per_unit} {charge.currency_name || 'QAR'} × {quantity}
                  </span>
                </div>
                <span className="text-purple-600">{safeFixed(subtotal)} {charge.currency_name || 'QAR'}</span>
              </div>
            );
          })}

          {/* Total Amount */}
          <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 mt-2">
            <span className="text-lg font-bold">Total Quotation Amount</span>
            <span className="text-2xl font-bold text-green-600">{safeFixed(totalAmount)} QAR</span>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-6 rounded-lg mb-6">
        <h3 className="font-bold text-lg mb-4 text-[#314a8a] text-center">PAYMENT SUMMARY</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 text-sm mb-1">Total Amount</p>
            <p className="font-bold text-2xl text-blue-700">{safeFixed(totalAmount)} QAR</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 text-sm mb-1">Advance Payment</p>
            <p className="font-bold text-xl text-orange-600">{safeFixed(advance)} QAR</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 text-sm mb-1">Balance Due</p>
            <p className="font-bold text-2xl text-green-600">{safeFixed(balance)} QAR</p>
          </div>
        </div>
      </div>

      {/* Services Include/Exclude */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="border border-gray-200 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-green-700 border-b pb-2">SERVICES INCLUDED</h3>
          <ul className="space-y-2 text-sm">
            {(quotation.included_services_names || []).map((service, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>{service}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-gray-200 p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-3 text-red-700 border-b pb-2">SERVICES EXCLUDED</h3>
          <ul className="space-y-2 text-sm">
            {(quotation.excluded_services_names || []).map((service, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span>{service}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Terms & Footer */}
      <div className="border-t-2 border-gray-300 pt-6">
        <div className="text-center mb-6">
          <h4 className="font-bold text-lg mb-2 text-[#314a8a]">TERMS & CONDITIONS</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• This quotation is valid for 30 days from the date of issue</p>
            <p>• Prices are subject to change based on actual requirements</p>
            <p>• Advance payment required to confirm booking</p>
            <p>• Balance payment due upon completion of services</p>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600 border-t pt-4">
          <p className="font-bold">Thank you for choosing Almas Movers International</p>
          <p>Email: freight@almasintl.com | Phone: +974 5013 6999</p>
          <p className="text-xs mt-2">www.almasmovers.com</p>
        </div>
      </div>
    </div>
  );
};

export default QuotationLocalMove;