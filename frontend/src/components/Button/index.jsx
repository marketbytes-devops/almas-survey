import PropTypes from 'prop-types';

const Button = ({ onClick, children, className, disabled, type = "button" }) => {
  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      className={`btn-primary text-sm py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-md active:opacity-90'
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
  onClick: () => { },
  className: '',
  disabled: false,
};

export default Button;