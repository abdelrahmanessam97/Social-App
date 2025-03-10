import bcrypt from "bcrypt";

export const Compare = async ({ key, hashedKey }) => {
  return bcrypt.compare(key, hashedKey);
};
