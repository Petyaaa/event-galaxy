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

const dateTimeSchema = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), "Expected an ISO date-time string.")
  .transform((value) => new Date(value));

const optionalText = (max = 240) =>
  z
    .union([z.string().trim().max(max), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === null || value === "") return null;
      return value;
    });

const tagSchema = z.string().trim().min(1).max(32);

export const eventCreateSchema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(12).max(2000),
  startsAt: dateTimeSchema,
  endsAt: dateTimeSchema.optional().nullable(),
  capacity: z.number().int().min(1).max(10000),
  locationText: optionalText(160),
  meetingUrl: optionalText(300),
  tags: z.array(tagSchema).max(12).default([]),
  terminal: optionalText(80),
  prepNote: optionalText(500),
});

export const eventUpdateSchema = eventCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one event field is required.",
);

export const eventCancelSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const registrationCreateSchema = z.object({
  crewCode: optionalText(80),
});

export const registrationCancelSchema = z.object({
  reason: z.string().trim().min(3).max(500).optional(),
});

export const eventListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  tag: z.string().trim().max(32).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED", "ARCHIVED"]).optional(),
  mine: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
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

export function readSearchParams(request, schema) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  return parseJson(schema, params);
}
