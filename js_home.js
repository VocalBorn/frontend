let currentYear, currentMonth;

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