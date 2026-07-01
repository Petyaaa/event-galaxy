export async function api(endpoint, options = {}) {
  const path = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = data.error ?? {};
    const message = error.message || data.message || "Something went wrong";
    const thrown = new Error(message);
    thrown.code = error.code;
    thrown.details = error.details;
    throw thrown;
  }

  return data.data ?? data;
}

export const authApi = {
  login: (body) =>
    api("/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body) =>
    api("/register", {
      method: "POST",
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        displayName: body.displayName ?? body.name,
      }),
    }),
};

export const eventsApi = {
  getAll: () => api("/events"),

  getById: (id) => api(`/events/${id}`),

  register: (id) =>
    api(`/events/${id}/registrations`, {
      method: "POST",
    }),

  cancel: (registrationId) =>
    api(`/registrations/${registrationId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason: "Cancelled from UI" }),
    }),
};

export const meApi = {
  registrations: () => api("/users/me/registrations"),
};
