document.addEventListener("DOMContentLoaded", () => {
  const homeSection = document.getElementById("home");
  const logDetailSection = document.getElementById("log-detail");
  const logDetailDetailSection = document.getElementById("log-detail-detail");

  const btnViewLog = document.getElementById("view-log-btn");
  const btnBackToHome = document.getElementById("back-btn");
  const btnBackToLog = document.getElementById("back-to-log");
  const btnSubmitDetails = document.getElementById("submit-details");
  const detailContainer = document.getElementById("detail-container");

  const patientsProgress = [
    {
      name: "病患 A",
      progress: "5/5",
      chapter: "第 3 章 xxx",
      status: "completed",
      statusText: "✅ 已完成",
      details: [
        {
          sentence: "這是小節 1 的語句內容。",
          audio: "audio/sample1.mp3",
          qualified: true,
          suggestion: "發音標準，持續保持。"
        },
        {
          sentence: "這是小節 2 的語句內容。",
          audio: "audio/sample2.mp3",
          qualified: false,
          suggestion: "注意語調和重音。"
        },
        {
          sentence: "這是小節 3 的語句內容。",
          audio: "",
          qualified: false,
          suggestion: "建議多練習此段落。"
        }
      ]
    },
    {
      name: "病患 B",
      progress: "2/5",
      chapter: "第 2 章 xxx",
      status: "in-progress",
      statusText: "⏳ 進行中",
      details: [
        {
          sentence: "小節 1 的句子內容。",
          audio: "audio/sample3.mp3",
          qualified: true,
          suggestion: "發音良好。"
        },
        {
          sentence: "小節 2 的句子內容。",
          audio: "",
          qualified: false,
          suggestion: "加強口腔運動。"
        }
      ]
    }
  ];

  function switchPage(showSectionId) {
    document.querySelectorAll(".page-section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(showSectionId).classList.add("active");
  }

  function enableSubmit() {
    btnSubmitDetails.disabled = false;
  }

  function renderPatientsProgress(data) {
    const container = document.getElementById("patients-container");
    container.innerHTML = "";
    data.forEach((patient, index) => {
      const card = document.createElement("div");
      card.className = "patient-card";
      card.dataset.index = index;

      card.innerHTML = `
        <div class="patient-name">${patient.name}</div>
        <div class="patient-chapter">章節：${patient.chapter}</div>
        <div class="patient-progress">進度：${patient.progress}</div>
        <div class="patient-status ${patient.status}">${patient.statusText}</div>
      `;
      container.appendChild(card);
    });
  }

  function renderPatientDetails(patient) {
    const title = document.getElementById("detail-patient-name");
    title.textContent = `${patient.name} - ${patient.chapter}`;
    detailContainer.innerHTML = "";
    btnSubmitDetails.disabled = true;

    patient.details.forEach((detail, idx) => {
      const item = document.createElement("div");
      item.className = "patient-card";
      item.innerHTML = `
        <div class="patient-name">${idx + 1}. ${detail.sentence || ""}</div>
        <div class="patient-progress">
          <button class="play-audio-btn" data-audio="${detail.audio || ''}">🔊</button>
        </div>
        <div class="patient-status">
          <button class="toggle-qualified-btn">${detail.qualified ? '✅' : '❌'}</button>
        </div>
        <div class="patient-suggestion">
          <input type="text" class="suggestion-input" value="${detail.suggestion ? detail.suggestion.replace(/"/g, "&quot;") : ''}" />
        </div>
      `;
      detailContainer.appendChild(item);
    });

    detailContainer.querySelectorAll(".play-audio-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const audioSrc = btn.dataset.audio;
        if (!audioSrc) return alert("沒有音訊檔案");
        const audio = new Audio(audioSrc);
        detailContainer.querySelectorAll(".play-audio-btn").forEach(b => b.classList.remove("playing"));
        btn.classList.add("playing");
        audio.play();
        audio.addEventListener("ended", () => btn.classList.remove("playing"));
      });
    });

    detailContainer.querySelectorAll(".toggle-qualified-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.textContent === '✅') {
    btn.textContent = '❌';
    btn.classList.add("rejected");
  } else {
    btn.textContent = '✅';
    btn.classList.remove("rejected");
  }enableSubmit();
      });
    });

    detailContainer.querySelectorAll(".suggestion-input").forEach(input => {
      input.addEventListener("input", enableSubmit);
    });
  }

  btnViewLog.addEventListener("click", () => {
    renderPatientsProgress(patientsProgress);
    switchPage("log-detail");
  });

  btnBackToHome.addEventListener("click", () => switchPage("home"));
  btnBackToLog.addEventListener("click", () => switchPage("log-detail"));

  document.getElementById("patients-container").addEventListener("click", e => {
    const card = e.target.closest(".patient-card");
    if (card) {
      const index = card.dataset.index;
      if (index !== undefined) {
        renderPatientDetails(patientsProgress[index]);
        switchPage("log-detail-detail");
      }
    }
  });

  btnSubmitDetails.addEventListener("click", () => {
    btnSubmitDetails.disabled = true;
    const patientName = document.getElementById("detail-patient-name").textContent;
    const patient = patientsProgress.find(p => `${p.name} - ${p.chapter}` === patientName);
    if (!patient) return alert("找不到病患資料");

    const detailCards = detailContainer.querySelectorAll(".patient-card");
    detailCards.forEach((card, idx) => {
      const toggleBtn = card.querySelector(".toggle-qualified-btn");
      const suggestionInput = card.querySelector(".suggestion-input");
      patient.details[idx].qualified = toggleBtn.textContent === '✅';
      patient.details[idx].suggestion = suggestionInput.value.trim();
    });
    alert("已成功提交！");
  });
});
