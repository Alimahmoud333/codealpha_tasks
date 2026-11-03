import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../api/axios.js";
import Button from "../../components/common/Button.jsx";
import { TextField } from "../../components/common/Field.jsx";
import APP_ROUTES from "../../constants/appRoutes.js";
import useAuth from "../../hooks/useAuth.js";
import { hasErrors, validateLogin } from "../../utils/validation.js";

export default function LoginPage() {
  const { login, submitting } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || APP_ROUTES.SHOP;

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  const setField = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const clientErrors = validateLogin(values);
    setErrors(clientErrors);
    if (hasErrors(clientErrors)) return;

    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Could not log you in."));
    }
  };

  return (
    <div className="container auth">
      <div className="auth__panel">
        <h1 className="page__title">Log in</h1>
        <p className="page__lead">Welcome back. Log in to see your cart and orders.</p>

        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="error-box" role="alert">
              {formError}
            </p>
          )}
          <TextField label="Email" type="email" autoComplete="email" value={values.email} onChange={setField("email")} error={errors.email} />
          <TextField label="Password" type="password" autoComplete="current-password" value={values.password} onChange={setField("password")} error={errors.password} />
          <Button type="submit" loading={submitting}>
            Log in
          </Button>
        </form>

        <p className="auth__switch">
          New here? <Link to={APP_ROUTES.REGISTER} state={location.state}>Create an account</Link>
        </p>
      </div>

      <aside className="auth__aside">
        <h2>Your account keeps things in one place</h2>
        <ul>
          <li>Your cart is saved on the server, so it follows you to any device.</li>
          <li>Every order is kept in your order history with its delivery status.</li>
        </ul>
      </aside>
    </div>
  );
}
