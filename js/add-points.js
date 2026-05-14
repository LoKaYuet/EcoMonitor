document.addEventListener('DOMContentLoaded', function () {
  try {
    console.debug('Exchange page init');
    function loadUsers() {
      try { return JSON.parse(localStorage.getItem('eco_users') || '{}'); } catch (e) { return {}; }
    }
    function saveUsers(u) {
      try { localStorage.setItem('eco_users', JSON.stringify(u)); } catch (e) {}
    }
    // guild storage helpers (used to ensure guild points cannot be used for redemptions)
    function loadGuilds() {
      try { return JSON.parse(localStorage.getItem('eco_guilds') || '{}'); } catch (e) { return {}; }
    }
    function saveGuilds(g) {
      try { localStorage.setItem('eco_guilds', JSON.stringify(g)); } catch (e) {}
    }
    function loadRedemptions() {
      try { return JSON.parse(localStorage.getItem('eco_redemptions') || '[]'); } catch (e) { return []; }
    }
    function saveRedemptions(r) {
      try { localStorage.setItem('eco_redemptions', JSON.stringify(r)); } catch (e) {}
    }
    const current = localStorage.getItem('eco_current_user') || sessionStorage.getItem('eco_current_user');
    const userNameEl = document.getElementById('user-name');
    const userPointsEl = document.getElementById('user-points');
    const msgArea = document.getElementById('msg-area');
    const itemsGrid = document.getElementById('items-grid');
    const items = [
      { id: 'water-bottle', name: 'Water Bottle', cost: 1500, desc: 'Stainless steel reusable water bottle' },
      { id: 'tote-bag', name: 'Tote Bag', cost: 800, desc: 'Reusable fabric tote bag' },
      { id: 'voucher', name: 'HK$50 Voucher', cost: 3000, desc: 'Voucher for a collaborated shop' },
      { id: 'seedkit', name: 'Seed Kit', cost: 600, desc: 'Grow your own plants' },
      { id: 'guild-ticket', name: 'Guild Ticket', cost: 1000, desc: 'Allow user to create guild' }
    ];
    let areaBonus = false; //map.html
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function renderUser() {
      const users = loadUsers();
      if (current && users[current]) {
        const u = users[current];
        userNameEl.textContent = u.name || current;
        userPointsEl.textContent = (Number(u.points || 0)).toLocaleString() + ' pts';
      } else {
        userNameEl.innerHTML = '<a href="login.html">Sign in</a>';
        userPointsEl.textContent = '0 pts';
      }
    }
    function renderItems() {
      if (!itemsGrid) return;
      const users = loadUsers();
      const userPts = (current && users[current]) ? Number(users[current].points || 0) : 0;
      itemsGrid.innerHTML = items.map(it => {
        const disabled = userPts < it.cost || !current || !users[current];
        const btnLabel = disabled ? (current && users[current] ? 'Insufficient points' : 'Sign in to redeem') : 'Redeem';
        return `<div class="item" data-id="${escapeHtml(it.id)}">
          <h4>${escapeHtml(it.name)}</h4>
          <div class="muted small">${escapeHtml(it.desc)}</div>
          <div style="margin-top:10px;font-weight:700">${it.cost.toLocaleString()} pts</div>
          <div style="margin-top:10px;">
            <button class="cta" data-id="${escapeHtml(it.id)}" ${disabled ? 'disabled' : ''}>${escapeHtml(btnLabel)}</button>
          </div>
        </div>`;
      }).join('');
      // hook buttons
      Array.from(itemsGrid.querySelectorAll('button[data-id]')).forEach(b => {
        b.addEventListener('click', () => redeem(b.dataset.id));
      });
    }
    function showMsg(text, type) {
      if (!msgArea) return;
      msgArea.innerHTML = `<div class="msg ${type === 'error' ? 'error' : 'success'}">${escapeHtml(text)}</div>`;
      window.setTimeout(() => { if (msgArea) msgArea.innerHTML = ''; }, 3500);
    }
    function redeem(itemId) {
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      const users = loadUsers();
      if (!current || !users[current]) {
        showMsg('Sign in to redeem items.', 'error');
        renderItems();
        return;
      }
      const u = users[current];
      const pts = Number(u.points || 0);
      if (pts < item.cost) {
        // Do NOT allow spending guild points here. If the user's guild has points, inform the user,
        // but do not deduct from guild or allow redemption using guild funds.
        const guilds = loadGuilds();
        const gid = u && u.guild;
        const guildPts = gid && guilds[gid] ? Number(guilds[gid].points || 0) : 0;
        if (guildPts >= item.cost) {
          showMsg('Your guild has enough points but guild points cannot be used to redeem items. Redeem with your personal points or leave the guild.', 'error');
        } else {
          showMsg('Not enough points.', 'error');
        }
        renderItems();
        return;
      }
      // deduct points
      u.points = pts - item.cost;
      users[current] = u;
      saveUsers(users);
      // record redemption (demo)
      const redemptions = loadRedemptions();
      redemptions.unshift({ user: current, name: u.name || current, item: item.id, itemName: item.name, cost: item.cost, at: Date.now() });
      saveRedemptions(redemptions);
      showMsg(`Redeemed ${item.name}. ${item.cost.toLocaleString()} pts deducted.`, 'success');
      renderUser();
      renderItems();
      userInventory();
    }
    function userInventory() {
      const pastRedemptionsEl = document.getElementById('past-redemptions');
      if (!pastRedemptionsEl) return;
      
      const redemptions = loadRedemptions();
      const currentUserRedemptions = redemptions.filter(r => r.user === current);
      
      if (currentUserRedemptions.length === 0) {
        pastRedemptionsEl.innerHTML = '<p class="muted" style="margin-top:20px;">No past redemptions yet.</p>';
        return;
      }
      
      const html = `
        <div style="margin-top:12px;">
          ${currentUserRedemptions.map(r => `
            <div style="padding:10px; border-radius:8px; background:var(--card); margin-bottom:8px; display:flex;justify-content:space-between;align-items:center;">
              <div>
                <strong>${escapeHtml(r.itemName)}</strong>
                <div class="muted small">${new Date(r.at).toLocaleString()}</div>
              </div>
              <div style="text-align:right;font-weight:700;">${r.cost.toLocaleString()} pts</div>
            </div>
          `).join('')}
        </div>`;
      
      pastRedemptionsEl.innerHTML = html;
    }
    // initial render
    renderUser();
    renderItems();
    userInventory();
    // expose small API for debugging if needed
    window._exchangeDebug = { redeem, renderUser, renderItems, loadRedemptions, loadUsers };
    // hook the demo bonus button
    const bonusBtn = document.getElementById('bonus-btn');
    if (bonusBtn) {
      bonusBtn.addEventListener('click', function () {
        const users = loadUsers();
        if (!current || !users[current]) {
          showMsg('Sign in to receive points.', 'error');
          return;
        }
        // check areaBonus
        if (typeof checkUserInGreyArea === "function") {
          areaBonus = checkUserInGreyArea();
        }
        // add points
        users[current] = users[current] || {};
        if (areaBonus) {
          users[current].points = Number(users[current].points || 0) + 150;
          saveUsers(users);
          showMsg('Added 100 points + 50 Bonus points for being in a bonus area.', 'success');
        } else {
          users[current].points = Number(users[current].points || 0) + 100;
          saveUsers(users);
          showMsg('Added 100 points to your account.', 'success');
        }
        renderUser();
        renderItems();
        // brief visual feedback: disable for 0.01s
        console.log("added 1000pts");
        bonusBtn.disabled = true;
        setTimeout(() => { bonusBtn.disabled = false; }, 10);
      });
    }
    // hook the scanner button // no ai for this demo
    const scanWindowOpen = document.getElementById('scan-btn');
    if (scanWindowOpen) {
      scanWindowOpen.addEventListener('click', function () {
        const users = loadUsers();
        if (!current || !users[current]) {
          showMsg('Sign in to receive points.', 'error');
          return;
        }
        // check areaBonus
        if (typeof checkUserInGreyArea === "function") {
          areaBonus = checkUserInGreyArea();
        }
        window.open("scanner.html?areaBonus=" + encodeURIComponent(areaBonus), "popupWindow", "width=400,height=400")
      });
    }
  } catch (err) {
    console.error('Exchange init error', err);
  }
});