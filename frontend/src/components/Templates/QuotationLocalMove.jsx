import React from "react";
import { Package, MapPin, Calendar, Clock, FileText } from "lucide-react";

const QuotationLocalMove = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg">
      {/* Header */}
      <div className="bg-[#000080] text-white px-8 py-6">
        <div className="flex items-center justify-center mb-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold">ALMAS</h1>
            <h2 className="text-xl">MOVERS</h2>
            <p className="text-sm text-yellow-400">INTERNATIONAL</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b-4 border-[#000080]">
        <h2 className="text-2xl font-semibold text-right px-8 py-4 text-[#000080]">
          Local Move Quotation
        </h2>
      </div>

      {/* Main Content */}
      <div className="px-8 py-6">
        {/* Top Info Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <InfoField label="To" value="AUSTIN" />
            <InfoField label="From" value="MUHAMMAD" />
            <InfoField label="Attention" value="Mr SHAHID FOYJL" />
            <InfoField label="Subject" value="DOMESTIC MOVE" />
          </div>
          <div className="space-y-3">
            <InfoField label="Date" value="04-11-2025" />
            <InfoField label="Reference No:" value="QFAM-317-2025-RE" />
            <InfoField label="Commodity" value="HOUSEHOLD GOODS" />
            <InfoField label="Service" value="DOOR TO DOOR" />
          </div>
        </div>

        {/* Intro Paragraph */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm leading-relaxed text-gray-700">
          <p>
            Dear Sir/Madam,<br />
            Thank you for the opportunity to quote, please note, our rates are valid for 30 days from date of
            quotation. You may confirm acceptance of our offer by signing and returning a copy of this
            document email. If the signed acceptance has not been received or if we require additional information,
            understood that you have read and accepted our quotation and related terms and conditions,
            please do not hesitate to contact us should you have any questions or require additional information.
          </p>
        </div>

        {/* Origin / Destination */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#000080] text-white p-3 rounded">
              <h3 className="font-semibold mb-1">Origin</h3>
              <p className="text-sm">AL MUNTAZAH, DOHA - QATAR</p>
            </div>
            <div className="bg-[#000080] text-white p-3 rounded">
              <h3 className="font-semibold mb-1">Destination</h3>
              <p className="text-sm">BARWA COMMERCIAL AVENUE, DOHA - QATAR</p>
            </div>
          </div>
        </div>

        {/* Rates Table */}
        <div className="bg-[#000080] text-white px-4 py-2 font-semibold mb-2">
          Rates
        </div>
        <table className="w-full border-collapse mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm">Code No.</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm">Mode</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm">Scope of Service</th>
              <th className="border border-gray-300 px-4 py-2 text-right text-sm">Our Price (QR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-3 text-sm">1</td>
              <td className="border border-gray-300 px-4 py-3 text-sm">LAND</td>
              <td className="border border-gray-300 px-4 py-3 text-sm">LUMP SUM OFFICE MOVING CHARGES</td>
              <td className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">2300.00</td>
            </tr>
          </tbody>
        </table>

        {/* Move Details */}
        <div className="space-y-3 mb-6 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p><span className="font-semibold">Move date:</span> TBC</p>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p><span className="font-semibold">Required time for moving:</span> 1 Day</p>
          </div>
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              <span className="font-semibold">Working time:</span> 8 Am to 8 Pm (Max till 9 PM From Sunday to Saturday)
              <br />
              We assuming normal good access at destination office building, please note any special
              requirement at origin & destination building which shall arranged by you (i.e: gate pass,
              parking permit)
            </p>
          </div>
        </div>

        {/* Includes / Excludes */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="bg-[#000080] text-white px-4 py-2 font-semibold mb-2">
              SERVICE INCLUDES
            </div>
            <ul className="space-y-2 text-sm">
              <ServiceItem text="Packing Service" />
              <ServiceItem text="Customer packed boxes collection" />
              <ServiceItem text="Miscellaneous items packing" />
              <ServiceItem text="Furniture dismantle if needed packing" />
              <ServiceItem text="Loading" />
              <ServiceItem text="Transportation" />
              <ServiceItem text="Unloading, unpacking" />
              <ServiceItem text="Furniture assembly" />
              <ServiceItem text="Debris removal on same day" />
            </ul>
          </div>
          <div>
            <div className="bg-[#000080] text-white px-4 py-2 font-semibold mb-2">
              SERVICE EXCLUDES
            </div>
            <ul className="space-y-2 text-sm">
              <ServiceItem text="Insurance" />
              <ServiceItem text="Storage" />
              <ServiceItem text="Cleaning service, plumbing service, electrical works if any" highlight />
              <ServiceItem text="Chandelier removal / installation, Plan soil removal, Wall installation" highlight />
            </ul>
          </div>
        </div>

        {/* Insurance */}
        <div className="bg-[#000080] text-white px-4 py-2 font-semibold mb-2">
          Insurance :
        </div>
        <div className="bg-gray-50 p-4 rounded mb-6 text-sm text-gray-700">
          <p>
            All shipments are not included transit insurance. If required full cover transit insurance can be
            arranged at 2.50 % of the replacement value with/without deductibles (subject to acceptance from
            the insurance company). Minimum QAR. 500/-. If require please help to fill attached value
            inventory form in order to provide the applicable insurance premium.
          </p>
        </div>

        {/* Payment Terms */}
        <div className="bg-[#000080] text-white px-4 py-2 font-semibold mb-2">
          Payment Terms
        </div>
        <div className="bg-gray-50 p-4 rounded mb-6 text-sm text-gray-700">
          <p className="mb-3">
            <span className="font-semibold">Payment Terms:</span> 50% advance payment upon work confirmation, the full payment required at the
            day of work completion. Payment may be made in any of the following ways.
          </p>
          <div className="space-y-1">
            <p>A. Cash / Cheque (ALMAS MOVERS SERVICES)</p>
            <p>B. Wire / Telegraphic transfer</p>
            <p>C. LPO - From approved companies</p>
          </div>
        </div>

        {/* NOTE */}
        <div className="bg-[#000080] text-white px-4 py-2 font-semibold mb-2">
          NOTE
        </div>
        <ul className="space-y-2 mb-8 text-sm text-gray-700">
          <ServiceItem text="CARRY WITH YOU CURRENCY, JEWELLERY& VALUABLE PAPERS AND KEYS TO CABINET& ALCOHOL. ALMAS MOVERS CANNOT ACCEPT LIABILITY FOR ARTICLES OF EXTRA ORDINARY VALUE" />
          <ServiceItem text="ALL PACKING MATERIALS BELONGS TO THE COMPANY" />
          <ServiceItem text="ADVANCE AMOUNT WILL NOT BE REFUNDABLE IF INFORMATION FOR CANCELLATION OF THE JOB IS NOT RECEIVED BEFORE 48 HOURS" />
        </ul>

        {/* Signature */}
        <div className="border-t-2 border-dashed border-gray-400 my-8"></div>
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Client Signature:</label>
            <div className="border-b-2 border-gray-300 h-16"></div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date:</label>
            <div className="border-b-2 border-gray-300 h-16"></div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 mb-4">
          <p className="mb-2">Al Mas Movers Int'l Doha - Qatar</p>
          <p className="mb-2">
            t: (+974) 4435 5663 | t: (+974) 5017 5777 | e: info@almasintl.com | w:{' '}
            <a href="http://www.almasintl.com" className="text-blue-600 hover:underline">
              www.almasintl.com
            </a>
          </p>
        </div>

        <div className="flex justify-center items-center gap-4 flex-wrap pb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-[#000080]" />
          </div>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-[#000080]" />
          </div>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-[#000080]" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- Helper Components ---------- */
const InfoField = ({ label, value }) => (
  <div className="flex items-start gap-2">
    <span className="font-semibold text-[#000080] text-sm min-w-24">{label}:</span>
    <span className="text-gray-700 text-sm">{value}</span>
  </div>
);

const ServiceItem = ({ text, highlight }) => (
  <li className="flex items-start gap-2">
    <span className="text-[#000080] mt-0.5">Bullet</span>
    <span className={highlight ? "bg-yellow-200" : ""}>{text}</span>
  </li>
);

export default QuotationLocalMove;