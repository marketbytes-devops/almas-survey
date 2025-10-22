import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { NavLink } from "react-router";

const Dropdown = ({ title, items, isOpen, toggleDropdown }) => {
  return (
    <div className="relative">
      <button
        className="flex items-center justify-between w-full px-4 py-3 text-sm sm:text-base font-medium text-[#2d4a5e] hover:bg-[#2d4a5e]/20 rounded"
        onClick={toggleDropdown}
      >
        {title}
        {isOpen ? (
          <FaChevronUp className="ml-2 w-4 h-4" />
        ) : (
          <FaChevronDown className="ml-2 w-4 h-4" />
        )}
      </button>
      {isOpen && (
        <ul className="mt-2 space-y-1 pl-4">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `block px-4 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white rounded"
                      : "text-[#2d4a5e] hover:bg-[#2d4a5e]/20"
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;