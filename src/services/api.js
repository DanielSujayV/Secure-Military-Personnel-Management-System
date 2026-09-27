const API_BASE_URL = "http://localhost:8080/api";

const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;

        try {
            const errorData = await response.json();

            if (errorData.message) {
                message = errorData.message;
            } else if (errorData.error) {
                message = errorData.error;
            }
        } catch {
            // Response did not contain JSON.
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

export const api = {
    get: (endpoint) =>
        apiRequest(endpoint, {
            method: "GET",
        }),

    post: (endpoint, data) =>
        apiRequest(endpoint, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    put: (endpoint, data) =>
        apiRequest(endpoint, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (endpoint) =>
        apiRequest(endpoint, {
            method: "DELETE",
        }),
};