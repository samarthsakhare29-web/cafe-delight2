document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-btn');
            const spinner = btn.querySelector('.fa-spinner');

            // UI Loading state
            btn.disabled = true;
            spinner.style.display = 'inline-block';

            try {
                const data = await apiFetch('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                // Save token and user info
                localStorage.setItem('token', data.token);
                if (data.refreshToken) {
                    localStorage.setItem('refreshToken', data.refreshToken);
                }
                localStorage.setItem('user', JSON.stringify(data.user || data));

                Toast.success('Login successful!');
                window.location.href = '../index.html';

            } catch (error) {
                Toast.error(error.message || 'Failed to login');
            } finally {
                btn.disabled = false;
                spinner.style.display = 'none';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('register-btn');
            const spinner = btn.querySelector('.fa-spinner');

            // UI Loading state
            btn.disabled = true;
            spinner.style.display = 'inline-block';

            try {
                const data = await apiFetch('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password })
                });

                // Assuming backend auto-logs in, but if not we can redirect to login
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    if (data.refreshToken) {
                        localStorage.setItem('refreshToken', data.refreshToken);
                    }
                    localStorage.setItem('user', JSON.stringify(data.user || data));
                    window.location.href = '../index.html';
                } else {
                    Toast.success('Registration successful! Please log in.');
                    setTimeout(() => window.location.href = 'login.html', 1500);
                }

            } catch (error) {
                Toast.error(error.message || 'Failed to register');
            } finally {
                btn.disabled = false;
                spinner.style.display = 'none';
            }
        });
    }
});
