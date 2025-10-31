// Top-level auth & app bootstrap (kept your patterns, just tidied)
document.addEventListener('DOMContentLoaded', () => {
  const signupBtn = document.getElementById('signupBtn');
  const loginBtn  = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const helpBtn   = document.getElementById('helpBtn');
  const helpOverlay = document.getElementById('helpOverlay');
  const helpClose   = document.getElementById('helpClose');

  const signupFormDiv = document.getElementById('signupForm');
  const loginFormDiv  = document.getElementById('loginForm');
  const formSignup = document.getElementById('formSignup');
  const formLogin  = document.getElementById('formLogin');

  const authArea = document.getElementById('authArea');
  const appArea  = document.getElementById('appArea');
  const yourScreenName = document.getElementById('yourScreenName');

  helpBtn.addEventListener('click', () => helpOverlay.style.display = 'block');
  helpClose.addEventListener('click', () => helpOverlay.style.display = 'none');

  signupBtn.addEventListener('click', () => {
    signupFormDiv.style.display = 'block';
    loginFormDiv.style.display  = 'none';
  });

  loginBtn.addEventListener('click', () => {
    loginFormDiv.style.display  = 'block';
    signupFormDiv.style.display = 'none';
  });

  logoutBtn.addEventListener('click', async () => {
    const res = await fetch('../server/logout.php', { method: 'POST' });
    const j = await res.json();
    if (j.success) {
      authArea.style.display = 'block';
      appArea.style.display  = 'none';
      logoutBtn.style.display = 'none';
      signupBtn.style.display = loginBtn.style.display = 'inline-block';
      document.getElementById('messages').innerHTML = '';
      document.getElementById('currentRoom').textContent = 'Not in a room';
      disconnectFromServer();
    }
  });

  formSignup.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(formSignup);
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch('../server/signup.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    const errorsDiv = document.getElementById('signupErrors');
    errorsDiv.innerHTML = '';
    if (json.success) {
      onLoginSuccess(json.screenName);
    } else {
      showErrors(errorsDiv, json);
    }
  });

  formLogin.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(formLogin);
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch('../server/login.php', {
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
      showErrors(errorsDiv, json);
    }
  });

  function onLoginSuccess(screenName) {
    authArea.style.display  = 'none';
    appArea.style.display   = 'block';
    signupBtn.style.display = loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    yourScreenName.textContent = screenName;
    initRoomHandler(screenName);
    connectToServer();
  }

  function showErrors(div, json) {
    if (json.errors) {
      for (const k in json.errors) {
        const p = document.createElement('p');
        p.textContent = json.errors[k];
        p.style.color = 'red';
        div.appendChild(p);
      }
    } else {
      div.textContent = json.message || 'Request failed';
      div.style.color = 'red';
    }
  }
});
