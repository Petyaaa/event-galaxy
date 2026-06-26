const API_URL = "http://localhost:3001";

export async function api(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export const authApi = {
  login: (body) =>
    api("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body) =>
    api("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
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
    api(`/registrations/${registrationId}`, {
      method: "DELETE",
    }),
};

export const meApi = {
  registrations: () => api("/users/me/registrations"),
};