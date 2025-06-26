let csrfToken = '';

async function fetchCsrfToken() {
  try {
    const res = await fetch('http://localhost:3001/v1/csrf/token', {
      credentials: 'include',
    });
    const data = await res.json();
    csrfToken = data.csrfToken;

    console.log('CSRF token:', csrfToken);
  } catch (err) {
    console.error('Failed to get CSRF token:', err);
  }
}

fetchCsrfToken();

document
  .getElementById('registerForm')
  .addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('http://localhost:3001/v3/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await res.json();
      const msg = document.getElementById('registerMessage');
      if (res.ok) {
        msg.textContent = result.message || 'Registration successful.';
        msg.className = 'message success';
        e.target.reset();
      } else {
        msg.textContent = result.message || 'Registration failed.';
        msg.className = 'message error';
      }
    } catch (err) {
      console.error(err);
      document.getElementById('registerMessage').textContent =
        'Registration error.';
      document.getElementById('registerMessage').className = 'message error';
    }
  });

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('http://localhost:3001/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'csrf-token': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result = await res.json();
    const msg = document.getElementById('loginMessage');
    if (res.ok && result.access_token && result.refresh_token) {
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('refresh_token', result.refresh_token);
      msg.textContent = 'Login successful.';
      msg.className = 'message success';
      e.target.reset();
    } else {
      msg.textContent = result.message || 'Login failed.';
      msg.className = 'message error';
    }
  } catch (err) {
    console.error(err);
    document.getElementById('loginMessage').textContent = 'Login error.';
    document.getElementById('loginMessage').className = 'message error';
  }
});
