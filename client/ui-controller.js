// ui-controller.js
(function () {
  const $ = (id) => document.getElementById(id);

  // Expose one helper so other scripts can toggle UI easily
  window.setAuthed = function(on, screenName = '') {
    // header links
    $('signupBtn').classList.toggle('hide', on);
    $('loginBtn').classList.toggle('hide', on);
    $('authSep')?.classList?.toggle('hide', on);
    $('logoutBtn').classList.toggle('hide', !on);
    // areas
    $('authArea').style.display = on ? 'none' : '';
    $('appArea').style.display  = on ? 'grid' : 'none';
    if (screenName) $('yourScreenName').textContent = screenName;
  };

  // HELP overlay
  window.addEventListener('DOMContentLoaded', () => {
    const helpBtn   = $('helpBtn');
    const helpClose = $('helpClose');
    const overlay   = $('helpOverlay');
    if (helpBtn && overlay)  helpBtn.addEventListener('click', () => overlay.style.display = 'flex');
    if (helpClose && overlay) helpClose.addEventListener('click', () => overlay.style.display = 'none');

    // Open forms
    $('signupBtn')?.addEventListener('click', () => {
      $('signupForm').style.display = 'block';
      $('loginForm').style.display  = 'none';
    });
    $('loginBtn')?.addEventListener('click', () => {
      $('loginForm').style.display  = 'block';
      $('signupForm').style.display = 'none';
    });

    // Create-room overlay (optional)
    const roomOv = $('roomOverlay');
    $('createRoomBtn')?.addEventListener('click', () => roomOv && (roomOv.style.display = 'flex'));
    $('roomCancel')?.addEventListener('click', () => roomOv && (roomOv.style.display = 'none'));

    // Alias: some scripts bind #sendMessageBtn, forward to #sendBtn
    const alias = $('sendMessageBtn'), real = $('sendBtn');
    if (alias && real) alias.addEventListener('click', () => real.click());
  });

  // SIGNUP submit
  document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'formSignup') {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const res = await fetch('/server/signup.php', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) {
          setAuthed(true, data.screenName || data.screen_name || fd.get('screenName') || '');
          $('signupErrors').textContent = '';
          $('signupForm').style.display = 'none';
        } else {
          $('signupErrors').textContent = data.error || 'Signup failed.';
        }
      } catch (err) {
        $('signupErrors').textContent = 'Network error during signup.';
      }
    }
  });

  // LOGIN submit
  document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'formLogin') {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const res = await fetch('/server/login.php', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) {
          setAuthed(true, data.screenName || data.screen_name || '');
          $('loginErrors').textContent = '';
          $('loginForm').style.display = 'none';
        } else {
          $('loginErrors').textContent = data.error || 'Login failed.';
        }
      } catch (err) {
        $('loginErrors').textContent = 'Network error during login.';
      }
    }
  });

  // LOGOUT click
  $('logoutBtn')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/server/logout.php', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        // still force local UI to logged-out state
        console.warn('Logout error (forcing UI reset).');
      }
    } catch (_) {
      // ignore network error; reset UI anyway
    }
    setAuthed(false);
  });

})();
