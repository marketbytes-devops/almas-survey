import React, { forwardRef, useImperativeHandle } from "react";
import QuotationLocalMove from "./QuotationLocalMove"; // Import your template

const QuotationPrintTrigger = forwardRef((props, ref) => {
  // Expose handlePrint to parent via ref
  useImperativeHandle(ref, () => ({
    handlePrint: () => {
      const printContent = `
        <html>
          <head>
            <title>Quotation - ${props.quotation?.quotation_id || "Print"}</title>
            <style>
              @page { size: A4; margin: 15mm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            </style>
          </head>
          <body>
            <div id="print-root"></div>
          </body>
        </html>
      `;

      const printWindow = window.open("", "", "height=800,width=1200");
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Render QuotationLocalMove into the new window
      const root = printWindow.document.getElementById("print-root");
      const component = (
        <QuotationLocalMove
          quotation={props.quotation}
          survey={props.survey}
          name={props.name}
          phone={props.phone}
          email={props.email}
          service={props.service}
          movingTo={props.movingTo}
          moveDate={props.moveDate}
          totalAmount={props.totalAmount}
          advance={props.advance}
          balance={props.balance}
          discount={props.discount}
          finalAmount={props.finalAmount}
          baseAmount={props.baseAmount}
          additionalChargesTotal={props.additionalChargesTotal}
          additionalCharges={props.additionalCharges}
          includedServices={props.includedServices}
          excludedServices={props.excludedServices}
          notes={props.notes}
          insurancePlans={props.insurancePlans}
          generalTerms={props.generalTerms}
        />
      );

      // Use ReactDOM to render into new window (requires ReactDOM from new window)
      const ReactDOM = printWindow.ReactDOM || window.ReactDOM; // Fallback if needed
      ReactDOM.render(component, root);

      setTimeout(() => {
        printWindow.print();
      }, 1000); // Give time for render
    },
  }));

  // This component renders nothing on screen
  return null;
});

export default QuotationPrintTrigger;