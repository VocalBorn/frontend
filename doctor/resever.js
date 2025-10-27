document.addEventListener("DOMContentLoaded", () => {
  const btnViewSch = document.querySelector(".view-sch-btn");
  const btnBackSch = document.getElementById("back-to-home-from-sch");
  const scheduleSection = document.getElementById("schedule-section");
  const homeSection = document.getElementById("home");

  const modal = document.getElementById("schedule-modal");
  const modalTitle = document.getElementById("modal-title");
  const timeline = document.getElementById("timeline");
  const closeModalBtn = document.getElementById("close-modal-btn");

  // 取消同意 Modal 元素
  const cancelModal = document.getElementById("cancel-approval-modal");
  const cancelModalTitle = document.getElementById("cancel-modal-title");
  const cancelPatientInfo = document.getElementById("cancel-patient-info");
  const cancelReasonInput = document.getElementById("cancel-reason");
  const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
  const cancelCancelBtn = document.getElementById("cancel-cancel-btn");

  const todos = [
    "病患 X 請求 2025-11-15 下午 3:00",
    "病患 Y 請求 2025-11-26 上午 9:00",
    "病患 Z 請求 2025-12-12 下午 2:30",
  ];

  let currentYear, currentMonth;

  // 已同意日期和取消原因，從 localStorage 拿
  let approvedDates = JSON.parse(localStorage.getItem("approvedDates") || "[]");
  let cancelReasons = JSON.parse(localStorage.getItem("cancelReasons") || "{}");

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

  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  cancelCancelBtn.addEventListener("click", () => {
    cancelModal.style.display = "none";
    cancelReasonInput.value = "";
  });

  // 儲存當前取消的日期（全域）
  let cancelDate = "";
  let cancelTodoText = "";

  confirmCancelBtn.addEventListener("click", () => {
    const reason = cancelReasonInput.value.trim();
    if (!reason) {
      alert("請輸入取消同意的原因");
      return;
    }

    // 存取消原因
    cancelReasons[cancelDate] = reason;
    localStorage.setItem("cancelReasons", JSON.stringify(cancelReasons));

    // 從已同意日期移除
    approvedDates = approvedDates.filter(date => date !== cancelDate);
    localStorage.setItem("approvedDates", JSON.stringify(approvedDates));

    // 代辦請求直接移除該日期的項目
    const todoContainer = document.getElementById("todo-list");
    const items = todoContainer.querySelectorAll(".todo-item");
    items.forEach(item => {
      if (item.textContent.includes(cancelDate)) {
        todoContainer.removeChild(item);
      }
    });

    // 重畫日曆和待辦，確保狀態正確
    renderCalendar(currentYear, currentMonth);
    renderTodo();

    // 關閉取消同意 Modal 並清空輸入
    cancelModal.style.display = "none";
    cancelReasonInput.value = "";
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

    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    weekDays.forEach(w => {
      const wd = document.createElement("div");
      wd.className = "calendar-weekday";
      wd.textContent = w;
      cal.appendChild(wd);
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
      const fullDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      if (dateStr === todayStr) div.classList.add("today");

      // 只有同意的日期才有特效
      if (approvedDates.includes(fullDateStr)) {
        div.classList.add("approved");
        div.style.backgroundColor = "#bfdbfe";
      }

      div.addEventListener("click", () => {
        if (div.classList.contains("approved")) {
          modalTitle.textContent = `當日行程 - ${fullDateStr}`;
          renderTimeline(fullDateStr);
          modal.style.display = "block";
        }
      });

      cal.appendChild(div);
    }
  }

  function renderTodo() {
    const todoContainer = document.getElementById("todo-list");
    todoContainer.innerHTML = "";

    todos.forEach((t, idx) => {
      // 如果該日期已被取消同意且已被移除，不要再顯示
      const dateMatch = t.match(/\d{4}-\d{2}-\d{2}/);
      if (dateMatch) {
        const dateStr = dateMatch[0];
        if (!approvedDates.includes(dateStr) && cancelReasons[dateStr]) {
          // 已取消同意並有原因，不顯示這筆待辦
          return;
        }
      }

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

      // 如果該日期已同意，設定成已提交狀態並顯示取消提交按鈕
      if (dateMatch && approvedDates.includes(dateMatch[0])) {
        div.querySelector(`#decision-${idx}`).value = "accept";
        div.querySelector(`#decision-${idx}`).disabled = true;
        div.querySelector(`#reason-${idx}`).disabled = true;
        div.querySelector(`#submit-${idx}`).disabled = true;
        div.style.opacity = "0.6";

        // 取消同意按鈕
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "取消同意";
        cancelBtn.className = "cancel-submit-btn";
        cancelBtn.style.marginLeft = "8px";
        div.querySelector(".todo-actions").appendChild(cancelBtn);

        cancelBtn.addEventListener("click", () => {
          cancelDate = dateMatch[0];
          cancelTodoText = t;
          cancelModalTitle.textContent = `取消同意原因 - ${cancelDate}`;
          cancelPatientInfo.textContent = cancelTodoText;
          cancelReasonInput.value = "";
          cancelModal.style.display = "block";
        });

      } else {
        // 新增提交按鈕事件
        div.querySelector(`#submit-${idx}`).addEventListener("click", () => {
          const decision = div.querySelector(`#decision-${idx}`).value;
          const reason = div.querySelector(`#reason-${idx}`).value.trim();

          if (!decision) {
            alert("請先選擇同意或拒絕");
            return;
          }

          alert(`已提交\n請求：${t}\n決定：${decision}\n原因：${reason}`);

          div.querySelector(`#decision-${idx}`).disabled = true;
          div.querySelector(`#reason-${idx}`).disabled = true;
          div.querySelector(`#submit-${idx}`).disabled = true;
          div.style.opacity = "0.6";

          if (decision === "accept") {
            const dateMatch = t.match(/\d{4}-\d{2}-\d{2}/);
            if (dateMatch) {
              const approvedDate = dateMatch[0];
              if (!approvedDates.includes(approvedDate)) {
                approvedDates.push(approvedDate);
                localStorage.setItem("approvedDates", JSON.stringify(approvedDates));
              }
              renderCalendar(currentYear, currentMonth);
              renderTodo();
            }
          }
        });
      }
    });
  }

  function renderTimeline(dateStr) {
    timeline.innerHTML = "";
    const matchedTodos = todos.filter(t => t.includes(dateStr));

    if (matchedTodos.length === 0) {
      timeline.innerHTML = "<p style='text-align:center; color:#888;'>尚無安排</p>";
      return;
    }

    matchedTodos.forEach(t => {
      const timeMatch = t.match(/(\d{4}-\d{2}-\d{2})\s+(上午|下午)\s+(\d{1,2}):(\d{2})/);
      let timeStr = "未知";

      if (timeMatch) {
        const period = timeMatch[2];
        let hour = parseInt(timeMatch[3], 10);
        const minute = timeMatch[4];

        if (period === "下午" && hour < 12) hour += 12;
        if (period === "上午" && hour === 12) hour = 0;

        timeStr = `${String(hour).padStart(2, "0")}:${minute}`;
      }

      const nameMatch = t.match(/病患\s(\S)/);
      const name = nameMatch ? nameMatch[1] : "未知";

      const item = document.createElement("div");
      item.className = "timeline-item";
      item.innerHTML = `
        <div class="timeline-time">${timeStr}</div>
        <div class="timeline-text">病患 ${name}</div>
      `;
      timeline.appendChild(item);
    });
  }
});
