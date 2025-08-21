// js_setting.js

// === 輔助函式 ===
(function () {
  // ---- 外部工具（有就用，沒有就備援） ----
  const log = window.log || ((msg, level = 'info') => {
    const ts = new Date().toISOString();
    (console[level] || console.log)(`[settings] [${ts}] ${msg}`);
  });

  const showMessage = window.showMessage || function (message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    toast.style.cssText = `
      position: fixed; bottom: 20px; right: 20px;
      background-color: #333; color: #fff;
      padding: 10px 20px; border-radius: 5px;
      z-index: 1000; opacity: 0; transition: opacity .3s;
    `;
    requestAnimationFrame(() => (toast.style.opacity = '1'));
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
    log(`顯示訊息: ${message}`);
  };

// === 切換頁面 ===
function switchSettingPage(showId, hideIds = []) {
  document.querySelectorAll(".main-content-page").forEach((page) => {
    if (page.id === showId) {
      page.classList.remove("hidden");
      page.classList.add("active");
    } else {
      page.classList.add("hidden");
      page.classList.remove("active");
    }
  });
}

// === 綁定事件 ===
document.addEventListener("DOMContentLoaded", () => {
  const el = (id) => document.getElementById(id);

  el("showProfile")?.addEventListener("click", () => {
    switchSettingPage("profile-content");
  });

  el("showSetting")?.addEventListener("click", () => {
    switchSettingPage("settings-page");
  });

  el("edit-name")?.addEventListener("click", () => {
    switchSettingPage("edit-name-content");
  });

  el("backToProfile")?.addEventListener("click", () => {
    switchSettingPage("profile-content");
  });

  el("editGender")?.addEventListener("click", () => {
    switchSettingPage("edit-gender-content");
  });

  el("backToProfileFromGender")?.addEventListener("click", () => {
    switchSettingPage("profile-content");
  });

  el("change-password")?.addEventListener("click", () => {
    switchSettingPage("change-password-content");
  });

  el("backToProfileFromPassword")?.addEventListener("click", () => {
    switchSettingPage("profile-content");
  });

  el("showNotification")?.addEventListener("click", () => {
    switchSettingPage("notification-content");
  });

  el("backToSettingfromNotify")?.addEventListener("click", () => {
    switchSettingPage("settings-page");
  });

  el("showHelp")?.addEventListener("click", () => {
    switchSettingPage("help-content");
  });

  el("backToSettingfromHelp")?.addEventListener("click", () => {
    switchSettingPage("settings-page");
  });

  el("how-to-change-password-item")?.addEventListener("click", () => {
    switchSettingPage("how-to-change-password-content");
  });

  el("backToHelpFromHowTo")?.addEventListener("click", () => {
    switchSettingPage("help-content");
  });

  el("tutorial-item")?.addEventListener("click", () => {
    switchSettingPage("tutorial-content");
  });

  el("backToHelpFromTutorial")?.addEventListener("click", () => {
    switchSettingPage("help-content");
  });

  el("showAbout")?.addEventListener("click", () => {
    switchSettingPage("about-content");
  });

  el("backToSettingfromAbout")?.addEventListener("click", () => {
    switchSettingPage("settings-page");
  });
});

// === 操作函式 ===
 function saveName() {
    const nameInput = document.getElementById('nameInput');
    const newName = nameInput?.value.trim();
    if (!nameInput || !newName) {
      showMessage('請輸入有效的姓名！');
      log('姓名輸入為空或找不到 nameInput 元素', 'warn');
      return;
    }

    const stored = localStorage.getItem('registeredUser');
    if (!stored) {
      showMessage('請先登入再修改姓名');
      return;
    }

    try {
      const user = JSON.parse(stored);
      user.username = newName;
      localStorage.setItem('registeredUser', JSON.stringify(user));
      ['profile-username', 'settings-username', 'welcome-username'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = newName;
      });
      const nameOnSettings = document.querySelector('#settings-page .username');
      if (nameOnSettings) nameOnSettings.textContent = newName;

      showMessage('姓名已更新！');
      switchSettingPage('profile-content');
    } catch (e) {
      log('更新 localStorage 時出錯: ' + e, 'error');
      showMessage('儲存姓名時發生錯誤，請重試');
    }
  }

  function saveGender() {
    const select = document.getElementById('genderSelect');
    const val = select?.value;
    if (!val) {
      showMessage('請選擇性別');
      return;
    }
    localStorage.setItem('userGender', val);
    showMessage('性別已儲存：' + val);
    switchSettingPage('profile-content');
}

 function submitPasswordChange() {
    const current = document.getElementById('currentPassword')?.value.trim();
    const next = document.getElementById('newPassword')?.value.trim();
    const confirm = document.getElementById('confirmPassword')?.value.trim();

    if (!current || !next || !confirm) return showMessage('請完整填寫所有欄位');

    const stored = localStorage.getItem('registeredUser');
    if (!stored) return showMessage('請先登入');

    try {
      const user = JSON.parse(stored);
      if (user.password !== current) return showMessage('目前密碼不正確');
      if (next.length < 6) return showMessage('新密碼長度需至少 6 字元');
      if (next !== confirm) return showMessage('新密碼與確認密碼不一致');

      user.password = next;
      localStorage.setItem('registeredUser', JSON.stringify(user));
      showMessage('密碼已成功更新');
      switchSettingPage('profile-content');
    } catch (e) {
      log('密碼變更錯誤：' + e, 'error');
      showMessage('更新失敗，請重試');
    }
  }

  function logout() {
    localStorage.removeItem('registeredUser');
    showMessage('您已登出');
    window.location.href = 'index.html';
  }

  function savechange() {
    saveName();
    showMessage('已儲存變更');
  }
  window.saveName = saveName;
  window.saveGender = saveGender;
  window.submitPasswordChange = submitPasswordChange;
  window.logout = logout;
  window.savechange = savechange;
})();
