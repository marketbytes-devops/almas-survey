import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const Modal = ({ isOpen, title, children, footer, className, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-0"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          onClick={onClose}
        />

        <motion.div
          className={`relative bg-white rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-lg z-10 overflow-hidden flex flex-col ${className || ""}`}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="p-6 pb-2 flex items-center justify-between">
            <h2 className="text-xl font-medium text-[#4c7085] tracking-tight">{title}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 pt-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-6 pt-2 bg-gray-50/50 flex justify-end gap-3">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    </>,
    document.body
  );
};

export default Modal;