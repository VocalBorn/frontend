let currentYear, currentMonth;
//簽到
async function signInToday() {
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const btn = document.getElementById("sign-in-btn");
  const status = document.getElementById("sign-in-status");

  try {
    const res = await fetch(CONFIG.getApiUrl("/checkin/daily"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log("✅ 簽到成功:", data);

      // ✅ 紀錄 localStorage
      const signedDates = JSON.parse(localStorage.getItem("signedDates")) || {};
      signedDates[key] = true;
      localStorage.setItem("signedDates", JSON.stringify(signedDates));

      document.getElementById("sign-in-card").classList.add("hidden");
      document.getElementById("calendar-container").classList.remove("hidden");
      renderCalendar();

      // ✅ 彈窗提示
      showSignInPopup("簽到成功！");
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.warn(`⚠️ 簽到失敗: ${res.status}`, errorData);

      if (res.status === 400 || res.status === 409) {
        status.textContent = "✅ 今日已簽到，明天再來！";
        btn.disabled = true;
        btn.textContent = "已簽到";
      } else if (res.status === 401) {
        alert("⚠️ 請先登入再簽到！");
      } else {
        alert("❌ 簽到失敗，請稍後再試！");
      }
    }
  } catch (err) {
    console.error("❌ 簽到過程出錯:", err);
    alert("❌ 網路錯誤，請稍後再試！");
  }
}

// ✅ 查詢今日是否已簽到
async function checkTodaySignIn() {
  const btn = document.getElementById("sign-in-btn");
  const status = document.getElementById("sign-in-status");

  try {
    const res = await fetch(CONFIG.getApiUrl("/checkin/status"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log("📌 簽到狀態:", data);

      if (data.has_checked_in_today) {
        const checkinDate = new Date(data.checkin_time);
        const formatted = checkinDate.toLocaleString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });

        //status.textContent = `✅ 今日已簽到（時間：${formatted}）`;
        btn.disabled = true;
        btn.textContent = "已簽到";
      } else {
        status.textContent = "📅 完成今日簽到，保持學習習慣";
        btn.disabled = false;
        btn.textContent = "立即簽到";
      }
    } else if (res.status === 401) {
      status.textContent = "⚠️ 請先登入後才能簽到";
      btn.disabled = true;
    } else {
      console.warn(`⚠️ 查詢簽到狀態失敗: ${res.status}`);
    }
  } catch (err) {
    console.error("❌ 查詢簽到狀態錯誤:", err);
  }
}

// 查詢簽到歷史紀錄 (支援分頁)
async function getCheckinHistory(limit = 30, page = 0) {
  try {
    const offset = page * limit;
    const res = await fetch(CONFIG.getApiUrl(`/checkin/history?limit=${limit}&offset=${offset}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log("📌 簽到歷史紀錄:", data);
    } else if (res.status === 401) {
      historyContainer.innerHTML = "<p>⚠️ 請先登入後才能查詢簽到紀錄</p>";
    } else {
      console.warn(`⚠️ 查詢失敗: ${res.status}`);
    }
  } catch (err) {
    console.error("❌ 查詢過程出錯:", err);
  }

}

// 查詢簽到統計資料
async function getCheckinStatistics() {
  try {
    const res = await fetch(CONFIG.getApiUrl("/checkin/statistics"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log("📊 簽到統計資料:", data);
        const signInDays = data.total_checkin_days || 1; // 後端回傳簽到天數

        // 找到段落標籤並更新內容
        const heroParagraph = document.querySelector('.hero-content p');
        heroParagraph.textContent = `今天是您語言治療的第 ${signInDays} 天，讓我們繼續努力吧！`;

    } else {
      console.warn(`⚠️ 查詢失敗: ${res.status}`);
    }
  } catch (err) {
    console.error("❌ 查詢過程出錯:", err);
  }
}

function initCalendar() {
  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();

  populateYearMonthSelect();
  renderCalendar();
}

function populateYearMonthSelect() {
  const yearSelect = document.getElementById("year-select");
  const monthSelect = document.getElementById("month-select");

  yearSelect.innerHTML = '';
  monthSelect.innerHTML = '';

  const thisYear = new Date().getFullYear();
  for (let y = thisYear - 3; y <= thisYear + 2; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y + " 年";
    if (y === currentYear) option.selected = true;
    yearSelect.appendChild(option);
  }

  const monthNames = ["1 月", "2 月", "3 月", "4 月", "5 月", "6 月", "7 月", "8 月", "9 月", "10 月", "11 月", "12 月"];
  for (let m = 0; m < 12; m++) {
    const option = document.createElement("option");
    option.value = m;
    option.textContent = monthNames[m];
    if (m === currentMonth) option.selected = true;
    monthSelect.appendChild(option);
  }
}

function updateCalendarFromSelect() {
  currentYear = parseInt(document.getElementById("year-select").value);
  currentMonth = parseInt(document.getElementById("month-select").value);
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const signedDates = JSON.parse(localStorage.getItem("signedDates")) || {};

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const div = document.createElement("div");
    div.classList.add("day");

    if (signedDates[dateStr]) {
      div.classList.add("signed");
      div.innerHTML = `<div>${day}</div>`;
    } else {
      div.classList.add("unsigned");
      div.innerHTML = `<div>${day}</div>`;
    }

    grid.appendChild(div);
  }
}

// 初始渲染
document.addEventListener("DOMContentLoaded", () => {
  initCalendar();
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const signedDates = JSON.parse(localStorage.getItem("signedDates")) || {};

  if (signedDates[key]) {
    document.getElementById("sign-in-card").classList.add("hidden");
    document.getElementById("calendar-container").classList.remove("hidden");
  }

  renderCalendar();
});

function showSignInPopup(message) {
  const popup = document.getElementById("sign-in-popup");
  popup.querySelector(".popup-message").innerText = message;
  popup.classList.remove("hidden");
}

function closePopup() {
  document.getElementById("sign-in-popup").classList.add("hidden");
}

// 取得近期練習統計
async function getRecentPracticeProgress(days = 7) {
  try {
    const res = await fetch(CONFIG.getApiUrl(`/practice/progress/recent?days=${days}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log("📊 近期練習統計:", data);

    } else {
      console.warn(`⚠️ API 請求失敗: ${res.status}`);
    }
  } catch (err) {
    console.error("❌ 取得練習統計錯誤:", err);
  }
}
// 取得所有練習會話數量統計
async function getTotalPracticeSessions() {
  try {
    const res = await fetch(CONFIG.getApiUrl("/practice/progress/total-sessions"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log("📊 總練習會話數統計:", data);

    } else {
      const errText = await res.text();
      console.warn(`⚠️ API 請求失敗: ${res.status}`, errText);
    }
  } catch (err) {
    console.error("❌ 取得統計錯誤:", err);
  }
}
// 取得課程進度統計
async function getCourseProgress() {
  try {
    const res = await fetch(CONFIG.getApiUrl("/practice/progress/courses"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log("📚 課程進度統計:", data);
    } else {
      const errText = await res.text();
      console.warn(`⚠️ API 請求失敗: ${res.status}`, errText);
    }
  } catch (err) {
    console.error("❌ 取得課程進度錯誤:", err);
  }
}
//查詢使用者進度總覽
async function getProgressOverview(recentDays = 7) {
  try {
    const res = await fetch(CONFIG.getApiUrl(`/practice/progress/overview?recent_days=${recentDays}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log("📊 完整進度總覽:", data);
    } else {
      const errText = await res.text();
      console.warn(`⚠️ API 請求失敗: ${res.status}`, errText);
    }
  } catch (err) {
    console.error("❌ 取得完整進度總覽錯誤:", err);
  }
}


// 頁面載入時自動檢查
document.addEventListener("DOMContentLoaded", () => {
  checkTodaySignIn();
  getCheckinHistory()
  getCheckinStatistics()
  getRecentPracticeProgress()
  getTotalPracticeSessions()
  getCourseProgress()
  getProgressOverview()
});