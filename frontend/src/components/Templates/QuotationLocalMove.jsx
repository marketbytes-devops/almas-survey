// src/components/Templates/QuotationLocalMove.jsx
import { CheckCircle } from 'lucide-react';
import Logo from '../../assets/images/logo-quotation.webp';

const QuotationLocalMove = ({ 
  quotation = {}, 
  survey = {}, 
  name = "—", 
  phone = "—", 
  email = "—", 
  service = "—", 
  buildingFrom = "—", 
  movingTo = "—", 
  moveDate = "—", 
  totalAmount = 0, 
  advance = 0, 
  balance = 0 
}) => {
  const date = quotation?.date || new Date().toLocaleDateString('en-GB');

  // SAFE number conversion — never crashes
  const safeFixed = (val) => (parseFloat(val) || 0).toFixed(2);

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 print:p-0">
      <div className="bg-white border-b-4 border-gray-800 pb-6">
        <div className="flex justify-between items-start">
          <img src={Logo} alt="Almas Movers" className="h-20" />
          <div className="text-right text-sm">
            <p><strong>Quote #</strong> {quotation?.quotation_id || "—"}</p>
            <p><strong>Date:</strong> {date}</p>
          </div>
        </div>

        <div className="text-center my-8">
          <h1 className="text-4xl font-bold text-[#314a8a]">QUOTATION</h1>
        </div>

        <div className="bg-[#314a8a] text-white text-center py-6 text-3xl font-bold rounded-lg">
          Total Amount: {safeFixed(totalAmount)} QAR
        </div>
      </div>

      <div className="my-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4 underline">Client Information</h3>
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Mobile:</strong> {phone}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Service:</strong> {service}</p>
          </div>
          <div>
            <h3 className="font-bold text-xl mb-4 underline">Moving Details</h3>
            <p><strong>Moving From:</strong> {survey?.origin_address || "—"}</p>
            <p><strong>Building:</strong> {buildingFrom}</p>
            <p><strong>Moving To:</strong> {movingTo}</p>
            <p><strong>Move Date:</strong> {moveDate}</p>
          </div>
        </div>

        <div className="bg-gray-100 p-6 rounded-lg">
          <h3 className="text-2xl font-bold text-center mb-4">Payment Summary</h3>
          <div className="grid grid-cols-3 text-center text-lg">
            <div className="border-r">
              <p className="text-gray-600">Total</p>
              <p className="font-bold text-2xl">{safeFixed(totalAmount)} QAR</p>
            </div>
            <div className="border-r">
              <p className="text-gray-600">Advance</p>
              <p className="font-bold text-xl">{safeFixed(advance)} QAR</p>
            </div>
            <div>
              <p className="text-gray-600">Balance</p>
              <p className="font-bold text-green-600 text-2xl">{safeFixed(balance)} QAR</p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600 mt-10">
          <p>Thank you for choosing Almas Movers International</p>
          <p className="font-bold mt-2">freight@almasintl.com | +974 5013 6999</p>
        </div>
      </div>
    </div>
  );
};

export default QuotationLocalMove;