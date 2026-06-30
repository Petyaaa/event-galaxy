import { z } from "zod";
import { validationError } from "@/server/http/errors";

export const emailSchema = z.string().email().trim().toLowerCase();

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  displayName: z.string().min(2).max(80).trim(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const updateMeSchema = z.object({
  displayName: z.string().min(2).max(80).trim().optional(),
  interests: z.array(z.string().min(1).max(32)).max(12).optional(),
});

export function parseJson(schema, body) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw validationError(parsed.error.flatten());
  }
  return parsed.data;
}

export async function readJson(request, schema) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw validationError({ body: ["Expected a valid JSON request body."] });
  }
  return parseJson(schema, body);
}
