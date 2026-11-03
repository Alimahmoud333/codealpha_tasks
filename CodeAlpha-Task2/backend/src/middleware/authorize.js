import AppError from "../utils/AppError.js";

/* Role check. Must run AFTER `authenticate`. Example: authorize("admin") */
export default function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, "You do not have permission to perform this action."));
    }
    next();
  };
}
