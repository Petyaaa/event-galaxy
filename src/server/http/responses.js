import { NextResponse } from "next/server";
import { ApiError } from "./errors";

export function requestId() {
  return crypto.randomUUID();
}

export function ok(data = {}, meta = {}, init = {}) {
  return NextResponse.json({ data, meta }, init);
}

export function created(data = {}, meta = {}) {
  return ok(data, meta, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(error, id = requestId()) {
  const normalized =
    error instanceof ApiError
      ? error
      : new ApiError("INTERNAL_ERROR", "An unexpected server error occurred.", 500);

  return NextResponse.json(
    {
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details ?? [],
      },
      requestId: id,
    },
    { status: normalized.status },
  );
}

export async function route(handler) {
  const id = requestId();
  try {
    return await handler(id);
  } catch (error) {
    console.error("api-error", { requestId: id, error });
    return fail(error, id);
  }
}
