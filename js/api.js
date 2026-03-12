const API_BASE_URL = 'http://localhost:5000/api';
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
}

async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        let response = await fetch(url, config);

        if (response.status === 401) {
            const originalRequest = config;

            // Handle refresh logic
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                logout();
                throw new Error("Session expired. Please login again.");
            }

            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(newToken => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
                    return fetch(url, originalRequest).then(res => res.json());
                }).catch(err => {
                    throw err;
                });
            }

            isRefreshing = true;

            try {
                const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: refreshToken })
                });

                if (!refreshRes.ok) {
                    throw new Error('Refresh failed');
                }

                const refreshData = await refreshRes.json();
                localStorage.setItem('token', refreshData.token);
                if (refreshData.refreshToken) {
                    localStorage.setItem('refreshToken', refreshData.refreshToken);
                }

                originalRequest.headers['Authorization'] = `Bearer ${refreshData.token}`;
                processQueue(null, refreshData.token);

                // Retry original request
                response = await fetch(url, originalRequest);
            } catch (err) {
                processQueue(err, null);
                logout();
                throw new Error("Session expired. Please login again.");
            } finally {
                isRefreshing = false;
            }
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error('Network error: Please ensure the backend server is running on port 5000 and CORS is enabled.');
        }
        throw error;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    const inPagesDir = window.location.pathname.includes('/pages/');
    window.location.href = inPagesDir ? '../index.html' : 'index.html';
}

function isLoggedIn() {
    return !!localStorage.getItem('token');
}

function getUser() {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
}
