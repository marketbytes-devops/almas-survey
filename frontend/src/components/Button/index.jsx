import PropTypes from 'prop-types';

const Button = ({ onClick, children, className, disabled }) => {
  const handleClick = (e) => {
    console.log("Button clicked:", { disabled, children }); 
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-gradient-to-r from-[#4c7085] to-[#6b8ca3] text-white text-sm py-2 px-3 rounded opacity-100 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-100'
      } ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

Button.defaultProps = {
  onClick: () => {},
  className: '',
  disabled: false,
};

export default Button;