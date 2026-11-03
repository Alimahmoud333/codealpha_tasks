import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage, getFieldErrors } from "../../api/axios.js";
import Button from "../../components/common/Button.jsx";
import { TextField } from "../../components/common/Field.jsx";
import APP_ROUTES from "../../constants/appRoutes.js";
import useAuth from "../../hooks/useAuth.js";
import useToast from "../../hooks/useToast.js";
import { hasErrors, validateRegister } from "../../utils/validation.js";

export default function RegisterPage() {
  const { register, submitting } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || APP_ROUTES.SHOP;

  const [values, setValues] = useState({ username: "", name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  const setField = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const clientErrors = validateRegister(values);
    setErrors(clientErrors);
    if (hasErrors(clientErrors)) return;

    try {
      await register({
        username: values.username.trim(),
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      toast.success("Your account has been created.");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrors(getFieldErrors(error)); // e.g. "This email is already registered."
      setFormError(getApiErrorMessage(error, "Could not create your account."));
    }
  };

  return (
    <div className="container auth">
      <div className="auth__panel">
        <h1 className="page__title">Create your account</h1>
        <p className="page__lead">It takes less than a minute.</p>

        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="error-box" role="alert">
              {formError}
            </p>
          )}
          <TextField label="Full name" autoComplete="name" value={values.name} onChange={setField("name")} error={errors.name} />
          <TextField
            label="Username"
            autoComplete="username"
            autoCapitalize="none"
            value={values.username}
            onChange={setField("username")}
            error={errors.username}
            hint="3–30 characters: letters, numbers and underscores."
          />
          <TextField label="Email" type="email" autoComplete="email" value={values.email} onChange={setField("email")} error={errors.email} />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={setField("password")}
            error={errors.password}
            hint="At least 8 characters, with a letter and a number."
          />
          <TextField label="Confirm password" type="password" autoComplete="new-password" value={values.confirmPassword} onChange={setField("confirmPassword")} error={errors.confirmPassword} />
          <Button type="submit" loading={submitting}>
            Create account
          </Button>
        </form>

        <p className="auth__switch">
          Already registered? <Link to={APP_ROUTES.LOGIN} state={location.state}>Log in</Link>
        </p>
      </div>

      <aside className="auth__aside">
        <h2>Why create an account?</h2>
        <ul>
          <li>Check out without re-typing your details next time.</li>
          <li>Follow your orders from pending to delivered.</li>
          <li>Keep your cart across devices.</li>
        </ul>
      </aside>
    </div>
  );
}
