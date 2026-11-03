/* variant: primary | secondary | ghost | danger. `loading` disables the button and announces it as busy. */
export default function Button({ variant = "primary", loading = false, disabled = false, children, className = "", type = "button", ...rest }) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {children}
    </button>
  );
}
