export const validation = (schema) => {
  return async (req, res, next) => {
    let inputData = { ...req.body, ...req.params, ...req.query };

    const result = schema.validate(inputData, { abortEarly: false });

    if (result?.error) {
      return res.status(400).json({ message: "validation Error", error: result?.error.details });
    }

    next();
  };
};
