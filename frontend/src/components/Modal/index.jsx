import { motion } from "framer-motion";

const modalVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.5 },
};

const Modal = ({ isOpen, title, children, footer, className }) => {
  if (!isOpen) return null;

  return (
    <>
      <motion.div
        className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${className || ""}`}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-[90%] sm:max-w-md overflow-y-auto max-h-[90vh]">
          <h2 className="text-lg sm:text-xl font-semibold text-[#2d4a5e] mb-4 sm:mb-5">{title}</h2>
          <div className="mb-4 sm:mb-5">{children}</div>
          <div className="flex justify-end space-x-3">{footer}</div>
        </div>
      </motion.div>
      <motion.div
        className="fixed inset-0 backdrop-brightness-50 z-40"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={backdropVariants}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </>
  );
};

export default Modal;