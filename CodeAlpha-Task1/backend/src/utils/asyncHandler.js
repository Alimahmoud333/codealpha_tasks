/* Express 4 does not catch rejected promises, so async handlers are wrapped. */
export default function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
