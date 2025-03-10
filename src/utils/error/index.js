export const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => {
      next(err);
    });
  };
};

export const globalErrorHandler = (err, req, res, next) => {
  if (process.env.MODE === "DEV") {
    return res.status(err["cause"] || 500).json({ message: err.message, stack: err.stack, error: err });
  }

  return res.status(err["cause"] || 500).json({ message: err.message });
};
