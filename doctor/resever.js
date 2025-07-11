document.addEventListener("DOMContentLoaded", () => {
  const btnViewSch = document.querySelector(".view-sch-btn");
  const btnBackSch = document.getElementById("back-to-home-from-sch");
  const scheduleSection = document.getElementById("schedule-section");
  const homeSection = document.getElementById("home");

  const events = [
    { date: "2025-07-05", title: "語療 A" },
    { date: "2025-07-12", title: "語療 B" },
    { date: "2025-07-21", title: "語療 C" },
  ];

  const todos = [
    "病患 X 請求 7/10 下午 3:00",
    "病患 Y 請求 7/11 上午 9:00",
    "病患 Z 請求 7/12 下午 2:30",
  ];

  let currentYear, currentMonth;

  btnViewSch.addEventListener("click", () => {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    renderCalendar(currentYear, currentMonth);
    renderTodo();
    homeSection.classList.remove("active");
    scheduleSection.classList.add("active");
  });

  btnBackSch.addEventListener("click", () => {
    scheduleSection.classList.remove("active");
    homeSection.classList.add("active");
  });

  function renderCalendar(year, month) {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  const header = document.createElement("div");
  header.className = "calendar-header";
  header.style.gridColumn = "span 7";

  header.innerHTML = `
    <span>
      <button id="prev-month">&lt;</button>
      <strong>${year} 年 ${month + 1} 月</strong>
      <button id="next-month">&gt;</button>
    </span>
  `;
  cal.appendChild(header);

  document.getElementById("prev-month")?.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
  });

  document.getElementById("next-month")?.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    cal.appendChild(document.createElement("div"));
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  for (let day = 1; day <= daysInMonth; day++) {
    const div = document.createElement("div");
    div.className = "calendar-day";
    div.textContent = day;

    const dateStr = `${year}-${month}-${day}`;
    if (dateStr === todayStr) div.classList.add("today");

    const event = events.find(e => e.date === `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    if (event) {
      div.classList.add("has-event");
      div.title = event.title;
    }

    cal.appendChild(div);
  }
}


  function renderTodo() {
    const todoContainer = document.getElementById("todo-list");
    todoContainer.innerHTML = "";

    todos.forEach((t, idx) => {
      const div = document.createElement("div");
      div.className = "todo-item";

      div.innerHTML = `
        <div>${t}</div>
        <div class="todo-actions">
          <select id="decision-${idx}">
            <option value="">請選擇</option>
            <option value="accept">✅ 同意</option>
            <option value="reject">❌ 拒絕</option>
          </select>
          <input id="reason-${idx}" type="text" placeholder="說明原因...">
          <button id="submit-${idx}" class="submit-btn">提交</button>
        </div>
      `;

      todoContainer.appendChild(div);

      div.querySelector(`#submit-${idx}`).addEventListener("click", () => {
        const decision = div.querySelector(`#decision-${idx}`).value;
        const reason = div.querySelector(`#reason-${idx}`).value.trim();

        if (!decision) {
          alert("請先選擇同意或拒絕");
          return;
        }

        console.log(`代辦提交：
請求：${t}
決定：${decision}
原因：${reason}`);

        alert(`已提交\n請求：${t}\n決定：${decision}\n原因：${reason}`);

        div.querySelector(`#decision-${idx}`).disabled = true;
        div.querySelector(`#reason-${idx}`).disabled = true;
        div.querySelector(`#submit-${idx}`).disabled = true;
        div.style.opacity = "0.6";
      });
    });
  }
});
