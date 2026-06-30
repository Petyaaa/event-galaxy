import bcrypt from "bcryptjs";

const PASSWORD_COST = 12;

export function hashPassword(password) {
  return bcrypt.hash(password, PASSWORD_COST);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
