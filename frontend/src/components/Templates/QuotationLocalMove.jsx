import { FileText, Ship, MapPin, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

const QuotationLocalMove = () => {
  return (
    <div className="max-w-5xl mx-auto bg-white shadow-lg">
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
              <Ship className="w-10 h-10 text-blue-900" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-blue-900">ALMAS</h1>
              <p className="text-lg font-semibold text-blue-900">MOVERS INTL</p>
            </div>
          </div>
          <div className="text-right space-y-1 text-sm">
            <p><span className="font-semibold">Quote #</span> D-A</p>
            <p><span className="font-semibold">REF #</span></p>
            <p><span className="font-semibold">Date:</span> November 11, 2025</p>
            <p className="text-xs text-gray-600 mt-2">Contact Person:</p>
            <p className="text-xs text-gray-600">Email:</p>
            <p className="text-xs text-gray-600">Office #:</p>
          </div>
        </div>

        <div className="bg-[#314a8a] text-white px-6 py-4 rounded text-center text-sm font-semibold">
          Your Rate is $950.00 USD
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        <div>
          <p className="font-semibold text-black mb-1">Dear Muhammad KP from Almas,</p>
          <p className="font-semibold text-black mb-3">Prepared by Muhammad KP</p>
          <p className="text-black text-sm leading-relaxed">
            Thank you for your rate request. Our rate is based on the Density Factor of <span className="font-semibold">6.5/LBS-Cuft</span>, valid for <span className="font-semibold">30 days</span>.
          </p>
        </div>

        <div className="border-3rounded-3xl p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-black mb-4 text-center underline">Shipment Information</h3>
              <div className="space-y-3">
                <InfoRow label="Shipment Type:" value="FCL 1x20'" />
                <InfoRow label="Volume:" value="30.00" />
                <InfoRow label="Based In:" value="CBM" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-4 text-center underline">Service Location</h3>
              <div className="space-y-3">
                <InfoRow label="Destination City:" value="Doha" />
                <InfoRow label="County/Province:" value="" />
                <InfoRow label="POE/Term:" value="Hamad Port" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-center text-black mb-4">Breakdown of Charges ( All Prices In USD )</h3>
          <div className="p-6">
            <p className="font-semibold text-black mb-4">Services Required: Standard Destination Service</p>
            <div className="space-y-2 text-sm">
              <ChargeRow label="Customs Clearance:" value="$75.00" />
              <ChargeRow label="Container Haulage:" value="$200.00" />
              <ChargeRow label="Destination Service:" value="$675.00" />
            </div>
            <div className="pt-3 mt-3">
              <div className="flex justify-between items-center font-semibold text-black">
                <span>Total Rate:</span>
                <span>$950.00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="font-semibold text-black mb-3">Additional Charges</h3>
          <div className="space-y-2">
            <ChargeRow label="DTHC (FCL 1x20'):" value="$475.00" />
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-black">
            <p className="font-semibold text-black mb-1">Important Notice:</p>
            <p className="italic">
              PLEASE PREPAY DTHC/D.O CHARGES AT ORIGIN. PLEASE NOTE AN ADMIN CHARGES APPLICABLE USD 50.00 IF DTHC/D.O CHARGES NOT PREPAID AT ORIGIN.
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-black mb-4">Optional Charges (If Required)</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 text-sm">
              <ChargeRow label="Storage per Day:" value="$20.70" />
              <ChargeRow label="Long Walk:" value="$100.00" />
              <ChargeRow label="Shuttle Service:" value="$350.00" />
              <ChargeRow label="Baby Grand Piano:" value="$100.00" />
              <ChargeRow label="Car:" value="$200.00" />
            </div>
            <div className="space-y-2 text-sm">
              <ChargeRow label="Warehouse Handling:" value="$210.00" />
              <ChargeRow label="Over 2nd Floor:" value="$100.00" />
              <ChargeRow label="Upright Piano:" value="$95.00" />
              <ChargeRow label="Grand Piano:" value="$150.00" />
              <ChargeRow label="Motorbike:" value="$250.00" />
            </div>
          </div>
          <ChargeRow label="Delivery Via Warehouse:" value="$300.00" customClass="mt-4" />
        </div>

        <div className="bg-[#314a8a] text-white px-4 py-3 font-semibold text-center text-sm rounded">
          Service Includes
        </div>
        <ul className="space-y-2 text-sm text-black">
          <ServiceItem text="Import custom clearance" />
          <ServiceItem text="Import bayan fee (Bill of entry)" />
          <ServiceItem text="Import documentation" />
          <ServiceItem text="Container inspection fee" />
          <ServiceItem text="Container haulage charges" />
          <ServiceItem text="Deliver to the residence in Doha city limit" />
          <ServiceItem text="Unloading up to 2nd floor, Unwrapping the furniture's" />
          <ServiceItem text="Reassembly of normal furniture" />
          <ServiceItem text="Debris removal in same day" />
        </ul>

        <div className="bg-[#314a8a] text-white px-4 py-3 font-semibold text-center text-sm rounded">
          Service Excludes
        </div>
        <ul className="space-y-2 text-sm text-black">
          <ServiceItem text="Custom duty / taxes, Inspection (if any)" />
          <ServiceItem text="Port storage, Container demurrage if any" />
          <ServiceItem text="Unpacking of the boxes to flat surface" />
          <ServiceItem text="Split delivery / Shuttle service" />
          <ServiceItem text="Drilling work, plumbing, wall hanging, curtain installation" />
          <ServiceItem text="Exchange BL fee, Bank charges ($50.00)" />
          <ServiceItem text="Curtain installation $10/curtain" />
          <ServiceItem text="TV mounting $30.00/TV" />
          <ServiceItem text="Photos /Wall Frames /Paintings/Mirror installation $70.00 (Up to 10 hangings)" />
          <ServiceItem text="Wall shelves /Rack/Wall Cabinet if any $10/Unit" />
          <ServiceItem text="If a car is inside the container, the shipment subject to port dues $450.00/20.DV and $600.00/40.DV" />
        </ul>

        <div className="bg-[#314a8a] text-white px-4 py-3 font-semibold text-center text-sm rounded">
          Comments
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-black mb-2">Payment Terms :-</h4>
            <p className="text-sm text-black">Payment required prior to arrange the delivery.</p>
          </div>

          <div>
            <h4 className="font-semibold text-black mb-2">Document Required for Household goods :-</h4>
            <ul className="space-y-1 text-sm text-black">
              <ServiceItem text="OBL/Telex release" />
              <ServiceItem text="Passport copy (Scan copy)" />
              <ServiceItem text="Qatar ID copy (Scan copy)" />
              <ServiceItem text="Packing list in English (Scan copy)" />
              <ServiceItem text="Personal authorization letter (we will provide you the draft)" />
              <ServiceItem text="Letter from the Ministry of foreign affairs (for clearance diplomatic shipment)" />
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-black mb-2">Documents required for Vehicle:-</h4>
            <ul className="space-y-1 text-sm text-black">
              <ServiceItem text="Registration certificate / Proof of ownership" />
              <ServiceItem text="Invoice copy (If available) / Vehicle value" />
              <ServiceItem text="Personal authorization letter (we will provide you the draft)" />
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-black mb-2">Vehicle specific information:</h4>
            <p className="text-sm text-black">
              Vehicle must be in GCC standard – left-hand drive. Auto mobile should be not more than 5 years old, unless special approval
              obtained from transportation department prior to import the car. The owner of the vehicle must be a resident in Qatar prior to
              registration of the vehicle. 5% custom duty charged based on depreciated value of the vehicle.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-black mb-2">Prohibited items:-</h4>
            <ul className="space-y-1 text-sm text-black">
              <ServiceItem text="Alcohol, Surveillance Camera, Explosive and explosive items, including firearms, ammunitions, other flammable items" />
              <ServiceItem text="Idols, Pornographic materials, Politically subversive materials, Ivory, Narcotic drugs, Pork products, Weapons, Handcuffs" />
              <ServiceItem text="Any security related equipment's / Surveillances Camera's (Do not bring without MOI approval)" />
              <ServiceItem text="Sharp items with a blade longer than 6 cm" />
              <ServiceItem text="Medicines Or any medicine supplies (Do not load any medicines with cargo even with a doctors prescriptions)" />
              <ServiceItem text="Do not pack any gambling games (Poker games / gambling items)" />
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-black mb-2">Restricted / dutiable items:-</h4>
            <ul className="space-y-1 text-sm text-black">
              <ServiceItem text="Cigarettes (free import up to 400)" />
              <ServiceItem text="Firearms (special permission from the Ministry of Defense in Qatar is required)" />
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-black mb-2">Consignment Instruction (AWB/MBL/HBL):-</h4>
            <div className="text-sm text-black space-y-1">
              <p><span className="font-semibold">Shipper:</span> Actual as per the passport & origin address</p>
              <p><span className="font-semibold">Consignee:</span> Actual as per the passport & destination address</p>
              <p><span className="font-semibold">Notify:</span> AL MAS MOVERS SERVICES, DOHA, QATAR, freight@almasintl.com, +974 5013 6999</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded text-sm text-black leading-relaxed">
            <p>
              The personal and household items brought into the country by the nationals residing abroad or the foreigners coming for the first
              time for residence in the State shall be exempted from customs duties, subject to the conditions and restrictions determined
              prescribed by the General Manager. To be exempted from customs taxes duties are the personal effects and gifts in possession of
              passengers provided that such items are not of a commercial nature and shall be conforming to the conditions and controls
              prescribed by the Rules of implementation.
            </p>
          </div>
        </div>

        <div className="border-t-2 border-gray-300 pt-6 mt-6">
          <div className="bg-gray-50 p-4 rounded text-center text-sm">
            <p className="font-semibold text-black mb-2">For any further assistance/clarification, please contact Mr Muhammad</p>
            <div className="space-y-1 text-black">
              <p><span className="font-semibold">Email:</span> freight@almasintl.com</p>
              <p><span className="font-semibold">Tel:</span> 00974 5013 6999</p>
              <p><span className="font-semibold">Whatsapp:</span> 00974 5013 6999</p>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              Subject to our Terms and Conditions of Business available on Request
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pure JavaScript — No TypeScript types
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="font-semibold text-black">{label}</span>
    <span className="text-black">{value}</span>
  </div>
);

const ChargeRow = ({ label, value, customClass }) => (
  <div className={`flex justify-between items-center font-semibold text-black ${customClass || ''}`}>
    <span>{label}</span>
    <span className="text-right">{value}</span>
  </div>
);

const ServiceItem = ({ text }) => (
  <li className="flex items-start gap-2">
    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
    <span>{text}</span>
  </li>
);

export default QuotationLocalMove;