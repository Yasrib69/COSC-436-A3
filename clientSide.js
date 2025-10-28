// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const helpBtn = document.getElementById('helpBtn');
    const helpOverlay = document.getElementById('helpOverlay');
    const helpClose = document.getElementById('helpClose');
  
    const signupFormDiv = document.getElementById('signupForm');
    const loginFormDiv = document.getElementById('loginForm');
    const formSignup = document.getElementById('formSignup');
    const formLogin = document.getElementById('formLogin');
  
    const authArea = document.getElementById('authArea');
    const appArea = document.getElementById('appArea');
    const yourScreenName = document.getElementById('yourScreenName');
  
    helpBtn.addEventListener('click', () => helpOverlay.style.display = 'block');
    helpClose.addEventListener('click', () => helpOverlay.style.display = 'none');
  
    signupBtn.addEventListener('click', () => {
      signupFormDiv.style.display = 'block';
      loginFormDiv.style.display = 'none';
      console.log("hello world");
    });
  
    loginBtn.addEventListener('click', () => {
      loginFormDiv.style.display = 'block';
      signupFormDiv.style.display = 'none';
    });
  
    logoutBtn.addEventListener('click', async () => {
      const res = await fetch('logout.php', { method: 'POST' });
      const j = await res.json();
      console.log("in logout");
      if (j.success) {
        authArea.style.display = 'block';
        appArea.style.display = 'none';
        logoutBtn.style.display = 'none';
        signupBtn.style.display = loginBtn.style.display = 'inline-block';
      }
      console.log(j.message);
    });
  
    formSignup.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(formSignup);
      const payload = Object.fromEntries(fd.entries());
      const res = await fetch('signup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      const errorsDiv = document.getElementById('signupErrors');
      errorsDiv.innerHTML = '';
      if (json.success) {
        // logged in automatically
        onLoginSuccess(json.screenName);
      } else {
        if (json.errors) {
          for (const k in json.errors) {
            const p = document.createElement('p');
            p.textContent = json.errors[k];
            p.style.color = 'red';
            errorsDiv.appendChild(p);
          }
        } else {
          errorsDiv.textContent = json.message || 'Signup failed';
          errorsDiv.style.color = 'red';
        }
      }
    });
  
    formLogin.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      console.log("testing ");
      const fd = new FormData(formLogin);
      const payload = Object.fromEntries(fd.entries());
      const res = await fetch('login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      const errorsDiv = document.getElementById('loginErrors');
      errorsDiv.innerHTML = '';
      if (json.success) {
        onLoginSuccess(json.screenName);
      } else {
        if (json.errors) {
          for (const k in json.errors) {
            const p = document.createElement('p');
            p.textContent = json.errors[k];
            p.style.color = 'red';
            errorsDiv.appendChild(p);
          }
        } else {
          errorsDiv.textContent = json.message || 'Login failed';
          errorsDiv.style.color = 'red';
        }
      }
    });
  
    function onLoginSuccess(screenName) {
      // show app area, hide auth area
      authArea.style.display = 'none';
      appArea.style.display = 'block';
      signupBtn.style.display = loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      yourScreenName.textContent = screenName;
      // TODO: fetch available rooms and set up websockets
      // fetch('php/api/get_rooms.php')...
    }
  });
  