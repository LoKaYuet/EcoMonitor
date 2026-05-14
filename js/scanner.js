// good luck on cleaning up the codes
const videoBtn = document.getElementById('vid-btn');
const video = document.getElementById('video_window');
const loadCodeBtn = document.getElementById('scan-code-btn');
const submitCodeBtn = document.getElementById('submit-code-btn');
const $ = id => document.getElementById(id);
const current = localStorage.getItem('eco_current_user') || sessionStorage.getItem('eco_current_user');
const urlParams = new URLSearchParams(window.location.search);
const areaBonus = urlParams.get('areaBonus') === 'true';
document.addEventListener('DOMContentLoaded', function () {
  try {
    console.debug('Scanner page init');
    function loadUsers() {
      try { return JSON.parse(localStorage.getItem('eco_users') || '{}'); } catch (e) { return {}; }
    }
    function saveUsers(u) {
      try { localStorage.setItem('eco_users', JSON.stringify(u)); } catch (e) {}
    }

    const userNameEl = document.getElementById('user-name');
    const userPointsEl = document.getElementById('user-points');
    const msgArea = document.getElementById('msg-area');

    function showMsg(text, type) {
      if (!msgArea) return;
      msgArea.innerHTML = `<div class="msg ${type === 'error' ? 'error' : 'success'}">${escapeHtml(text)}</div>`;
      window.setTimeout(() => { if (msgArea) msgArea.innerHTML = ''; }, 3500);
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function loadCodeFromCam() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showMsg('Camera not supported', 'error');
        return;
      }
      const watchId = navigator.mediaDevices.getUserMedia({ video: true });
    }
    
    $('scan-code-btn').addEventListener('click', async (e) => {
      console.log(areaBonus);
      loadCodeFromCam();
    });

    $('loadCodeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      if ($('qr-code').value == 'test') {
        const users = loadUsers();
        users[current] = users[current] || {};
        if (areaBonus) {
          users[current].points = Number(users[current].points || 0) + 150;
          saveUsers(users);
          showMsg('Added 100 points + 50 Bonus points for being in a bonus area.', 'success');
          setTimeout(() => { window.opener.location.reload(true);window.close(); }, 800);
        } else {
          users[current].points = Number(users[current].points || 0) + 100;
          saveUsers(users);
          showMsg('Added 100 points to your account.', 'success');
          setTimeout(() => { window.opener.location.reload(true);window.close(); }, 800);
        }
      } else {
        showMsg("Invalid code.", "error");
      }
    });

  } catch (err) {
    console.error('Scanner init error', err);
  }
});