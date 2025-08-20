(function () {
  // ---- 依賴：外部工具（有就用，沒有就備援） ----
  const log = window.log || ((msg, level = 'info') => {
    const ts = new Date().toISOString();
    (console[level] || console.log)(`[settings] [${ts}] ${msg}`);
  });

  const showMessage = window.showMessage || function (message) {
    // 簡易 toast 備援
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

  // 用現有的 switchPage；若沒定義就提供最小版
  const switchPage =
    window.switchPage ||
    function (target) {
      const targetId = target === 'settings' ? 'settings-page' : `${target}-content`;
      document.querySelectorAll('.main-content-page').forEach((p) => p.classList.add('hidden'));
      document.getElementById(targetId)?.classList.remove('hidden');
      location.hash = `#${target}`;
    };

  // ===== 將原本分散的功能搬進來，並掛到 window（保持 HTML onclick 可用） =====

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
      switchPage('profile');
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
    switchPage('profile');
  }

  function submitPasswordChange() {
    const currentPassword = document.getElementById('currentPassword')?.value.trim();
    const newPassword = document.getElementById('newPassword')?.value.trim();
    const confirmPassword = document.getElementById('confirmPassword')?.value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage('請完整填寫所有欄位');
      return;
    }

    const stored = localStorage.getItem('registeredUser');
    if (!stored) {
      showMessage('請先登入');
      return;
    }

    try {
      const user = JSON.parse(stored);
      if (user.password !== currentPassword) {
        showMessage('目前密碼不正確');
        return;
      }
      if (newPassword.length < 6) {
        showMessage('新密碼長度需至少 6 字元');
        return;
      }
      if (newPassword !== confirmPassword) {
        showMessage('新密碼與確認密碼不一致');
        return;
      }

      user.password = newPassword;
      localStorage.setItem('registeredUser', JSON.stringify(user));
      showMessage('密碼已成功更新');
      log('密碼變更成功');
      switchPage('profile');
    } catch (error) {
      log('密碼變更錯誤：' + error, 'error');
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

  // ===== 綁定設定頁導覽按鈕（ID 必須與 HTML 相同）=====
  function bindSettingsButtons() {
    const settingsButtons = {
      showProfile: 'profile',
      showSetting: 'settings',
      showNotification: 'notification',
      backToSettingfromNotify: 'settings',
      showHelp: 'help',
      backToSettingfromHelp: 'settings',
      showAbout: 'about',
      backToSettingfromAbout: 'settings',
      'edit-name': 'edit-name',                    
      backToProfile: 'profile',
      'change-password': 'change-password',        
      backToProfileFromPassword: 'profile',
      editGender: 'edit-gender',
      backToProfileFromGender: 'profile',
      'how-to-change-password-item': 'how-to-change-password', 
      'tutorial-item': 'tutorial',                              
      backToHelpFromHowTo: 'help',
      backToHelpFromTutorial: 'help',
    };

    Object.entries(settingsButtons).forEach(([id, target]) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => switchPage(target));
    });
  }

  // ===== 通知切換 =====
  function bindNotificationToggle() {
    const notifyToggle = document.getElementById('notifyToggle');
    if (!notifyToggle) return;
    notifyToggle.addEventListener('change', () => {
      log(`通知：${notifyToggle.checked ? '開啟' : '關閉'}`);
      // 可選：localStorage.setItem('notifyDaily', JSON.stringify(!!notifyToggle.checked));
    });
  }

  // ===== 聊天輸入 Enter 發送（你原本的段落）=====
  function bindChatEnterToSend() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    if (!chatInput || !sendButton) return;

    chatInput.addEventListener('keypress', function (event) {
      if (event.key === 'Enter' && chatInput.value.trim() !== '') {
        sendButton.click();
      }
    });
  }

  function init() {
    // 綁定設定頁導航與動作
    bindSettingsButtons();
    bindNotificationToggle();
    bindChatEnterToSend();

    // 將需要給 HTML onclick 用的函數掛到全域
    window.saveName = saveName;
    window.saveGender = saveGender;
    window.submitPasswordChange = submitPasswordChange;
    window.logout = logout;
    window.savechange = savechange;

    log('js_setting 初始化完成');
  }

  // 自動在 DOM 準備好時初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
// === 輔助函式 ===
function showMessage(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #333;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s;
  `;

  setTimeout(() => (toast.style.opacity = "1"), 10);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

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
  // 設定頁面 ➝ 個人檔案
  document.getElementById("showProfile").addEventListener("click", () => {
    switchSettingPage("profile-content");
  });

  // 個人檔案 ➝ 返回設定
  document.getElementById("showSetting").addEventListener("click", () => {
    switchSettingPage("settings-page");
  });

  // 個人檔案 ➝ 編輯姓名
  document.getElementById("edit-name").addEventListener("click", () => {
    switchSettingPage("edit-name-content");
  });

  // 姓名 ➝ 返回
  document
    .getElementById("backToProfile")
    .addEventListener("click", () => switchSettingPage("profile-content"));

  // 個人檔案 ➝ 性別
  document.getElementById("editGender").addEventListener("click", () => {
    switchSettingPage("edit-gender-content");
  });

  // 性別 ➝ 返回
  document
    .getElementById("backToProfileFromGender")
    .addEventListener("click", () => switchSettingPage("profile-content"));

  // 個人檔案 ➝ 密碼
  document
    .getElementById("change-password")
    .addEventListener("click", () => switchSettingPage("change-password-content"));

  // 密碼 ➝ 返回
  document
    .getElementById("backToProfileFromPassword")
    .addEventListener("click", () => switchSettingPage("profile-content"));

  // 設定 ➝ 通知
  document
    .getElementById("showNotification")
    .addEventListener("click", () => switchSettingPage("notification-content"));

  document
    .getElementById("backToSettingfromNotify")
    .addEventListener("click", () => switchSettingPage("settings-page"));

  // 設定 ➝ 幫助
  document.getElementById("showHelp").addEventListener("click", () => {
    switchSettingPage("help-content");
  });

  document
    .getElementById("backToSettingfromHelp")
    .addEventListener("click", () => switchSettingPage("settings-page"));

  // 幫助 ➝ 如何改密碼
  document
    .getElementById("how-to-change-password-item")
    .addEventListener("click", () => switchSettingPage("how-to-change-password-content"));
  document
    .getElementById("backToHelpFromHowTo")
    .addEventListener("click", () => switchSettingPage("help-content"));

  // 幫助 ➝ 使用教學
  document
    .getElementById("tutorial-item")
    .addEventListener("click", () => switchSettingPage("tutorial-content"));
  document
    .getElementById("backToHelpFromTutorial")
    .addEventListener("click", () => switchSettingPage("help-content"));

  // 設定 ➝ 關於
  document.getElementById("showAbout").addEventListener("click", () => {
    switchSettingPage("about-content");
  });

  document
    .getElementById("backToSettingfromAbout")
    .addEventListener("click", () => switchSettingPage("settings-page"));
});

// === 操作函式 ===
function saveName() {
  const newName = document.getElementById("nameInput").value.trim();
  if (!newName) return showMessage("姓名不可為空");
  document.querySelector(".username").textContent = newName;
  showMessage("姓名已更新");
  switchSettingPage("profile-content");
}

function saveGender() {
  const gender = document.getElementById("genderSelect").value;
  showMessage("性別已更新：" + gender);
  switchSettingPage("profile-content");
}

function submitPasswordChange() {
  const current = document.getElementById("currentPassword").value;
  const newPwd = document.getElementById("newPassword").value;
  const confirm = document.getElementById("confirmPassword").value;

  if (!current || !newPwd || !confirm) {
    return showMessage("請完整填寫所有欄位");
  }
  if (newPwd !== confirm) {
    return showMessage("新密碼與確認密碼不一致");
  }
  if (newPwd.length < 6) {
    return showMessage("密碼至少需要 6 個字元");
  }

  showMessage("密碼變更成功");
  switchSettingPage("profile-content");
}

function logout() {
  showMessage("已登出");
  // TODO: 這裡可以補上 API 或清除 localStorage
}
