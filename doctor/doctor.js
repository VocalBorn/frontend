document.addEventListener("DOMContentLoaded", () => {
  // ==================== 共用 DOM 變數 ====================
  const sections = document.querySelectorAll(".page-section");
  const links = document.querySelectorAll(".nav-link");

  const token = localStorage.getItem("token");

  // 🔙 共用的顯示區塊切換
  function showSection(idOrElement) {
    const targetId = typeof idOrElement === "string" ? idOrElement : idOrElement.id;

    // 強制刷新（只針對特定頁面）
    if (["home"].includes(targetId)) {
      location.reload(); // 直接整個網頁刷新
      return;
    }

    sections.forEach(sec => {
      sec.classList.toggle("active", sec.id === targetId);
      sec.style.display = sec.id === targetId ? "block" : "none";
    });
  }

  // 定義 attachWidgetCardEvents
function attachWidgetCardEvents() {
  const cards = document.querySelectorAll(".widget-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      console.log("卡片被點擊:", card.dataset.index || card.dataset.patient);
      // 可以在這裡加入你想做的事情，例如切換頁面或顯示病患詳細資料
    });
  });
}
// 切換頁面
function switchPage(showSectionId) {
  document.querySelectorAll(".page-section").forEach(sec => sec.classList.remove("active"));
  const target = document.getElementById(showSectionId);
  if (target) target.classList.add("active");
}

  // 顯示首頁，隱藏其他 section
  function showHome() {
    showSection("home");
  }
  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.getAttribute("data-target");
      showSection(target);
    });
  });

  // ==================== 功能 1：建立配對（QR Code） ====================
  const openBtn = document.getElementById("open-token-section");
  const modal = document.getElementById("token-modal");
  const closeBtn = document.getElementById("close-token");
  const backBtn = document.getElementById("back-btn");
  const qrImage = document.getElementById("qr-image");
  const qrLink = document.getElementById("qr-link");

  async function fetchTokenAndShowQR() {
    if (!token) {
      alert("請先登入");
      return;
    }
    try {
      const res = await fetch("https://vocalborn.r0930514.work/api/pairing/generate-token", {
        method: "POST",
        headers: { 
          "Authorization": "Bearer " + token, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({})
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert(errorText);
        throw new Error("後端產生 token 失敗");
      }

      const data = await res.json();
      const url = data.qr_data;
      const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      qrImage.src=qrSrc;
      qrLink.textContent = url;
      qrLink.href = url;
      modal.classList.remove("hidden");
      modal.style.display = "flex";
    } catch {
      alert("無法產生配對 QR Code，請稍後再試");
    }
  }

  openBtn.addEventListener("click", fetchTokenAndShowQR);
  closeBtn.addEventListener("click", () => {
     modal.classList.add("hidden");
    modal.style.display = "none";
    clearQRCode();
    showHome();
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
      clearQRCode();
    }
    function clearQRCode() {
    qrImage.src = "";
    qrLink.textContent = "";
    qrLink.href = "";
    }
  });

  // ==================== 功能 2：查看已配對病患 ====================
  const pairedCountElement = document.getElementById("paired-count");
  const viewPatBtn = document.getElementById("view-pat-btn");
  const patientListSection = document.getElementById("patient-list");
  const patientDetailSection = document.getElementById("patient-detail");
  const patientListContainer = patientListSection.querySelector(".widget-card");
  const backToHomeBtn = document.getElementById("back-to-home");
  const backToListBtn = document.getElementById("back-to-list");

  const patientIdField = document.getElementById("patient-id");
  const patientNameField = document.getElementById("patient-name-field");
  const patientAgeField = document.getElementById("patient-age");
  const patientGenderField = document.getElementById("patient-gender");
  const patientDiagnosisField = document.getElementById("patient-diagnosis");
  const patientNotesField = document.getElementById("patient-notes");

  let patients = [];

  async function fetchPatientList() {
    try {
      const response = await fetch("https://vocalborn.r0930514.work/api/therapist/my-clients", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        patients = await response.json();
      }

      if (!patients || patients.length === 0) {
        patients = [
          { client_id: "TEST-001", client_info: { name: "（假資料）王小明", age: 10, gender: "男", diagnosis: "語言發展遲緩", notes: "這是測試假資料" } },
          { client_id: "TEST-002", client_info: { name: "（假資料）李小美", age: 8, gender: "女", diagnosis: "構音障礙", notes: "每週 2 次治療" } }
        ];
      }
      pairedCountElement.textContent = `目前配對：${patients.length} 位`;
      renderPatientList();
    } catch (error) {
      console.error("無法取得病患列表", error);
    }
  }

  function renderPatientList() {
    patientListContainer.querySelectorAll(".patient-card").forEach(card => card.remove());
    patients.forEach(item => {
      const client = item.client_info || {};
      const card = document.createElement("div");
      card.classList.add("patient-card");
      card.textContent = client.name || `病患 (${item.client_id})`;
      card.addEventListener("click", () => showPatientDetail(item));
      patientListContainer.insertBefore(card, backToHomeBtn);
    });
  }

  function showPatientDetail(item) {
    const client = item.client_info || {};
    patientIdField.value = item.client_id || "未提供";
    patientNameField.value = client.name || "未提供";
    patientAgeField.value = client.age || "未提供";
    patientGenderField.value = client.gender || "未提供";
    patientDiagnosisField.value = client.diagnosis || "未提供";
    patientNotesField.value = client.notes || "未提供";
    showSection(patientDetailSection);
  }

  viewPatBtn.addEventListener("click", () => showSection(patientListSection));
  backToHomeBtn.addEventListener("click", () => showSection("home"));
  backToListBtn.addEventListener("click", () => showSection(patientListSection));

  // ==================== 功能 3：查看練習紀錄 ====================
    
  const USE_API = true; // ← true 用 API，false 用假資料

  const homeSection = document.getElementById("home");
  const logDetailSection = document.getElementById("log-detail");
  const logDetailDetailSection = document.getElementById("log-detail-detail");

  const btnViewLog = document.getElementById("view-log-btn");
  const btnBackToHome = document.getElementById("back-btn");
  const btnBackToLog = document.getElementById("back-to-log");
  const btnSubmitDetails = document.getElementById("submit-details");
  const detailContainer = document.getElementById("detail-container");

  let patientsProgress = []; // 儲存病患總覽資料
  let currentPatientIndex = null;

  // 假資料
  // const mockPatients = [
  //   {
  //     name: "病患 A",
  //     progress: "5/5",
  //     chapter: "第 3 章 ",
  //     status: "completed",
  //     statusText: "✅ 已完成",
  //     details: [
  //       {
  //         sentence: "我想要點餐",
  //         audio: "audio/sample1.mp3",
  //         qualified: true,
  //         suggestion: "發音標準，持續保持。"
  //       },
  //       {
  //         sentence: "這是小節 2 的語句內容。",
  //         audio: "audio/sample2.mp3",
  //         qualified: false,
  //         suggestion: "注意語調和重音。"
  //       },
  //       {
  //         sentence: "這是小節 3 的語句內容。",
  //         audio: "",
  //         qualified: false,
  //         suggestion: "建議多練習此段落。"
  //       }
  //     ]
  //   },
  //   {
  //     name: "病患 B",
  //     progress: "2/5",
  //     chapter: "第 2 章 xxx",
  //     status: "in-progress",
  //     statusText: "⏳ 進行中",
  //     details: [
  //       {
  //         sentence: "小節 1 的句子內容。",
  //         audio: "audio/sample3.mp3",
  //         qualified: true,
  //         suggestion: "發音良好。"
  //       },
  //       {
  //         sentence: "小節 2 的句子內容。",
  //         audio: "",
  //         qualified: false,
  //         suggestion: "加強口腔運動。"
  //       }
  //     ]
  //   }
  // ];

  // 取得病患總覽（API 或假資料）
  async function fetchPatientsOverview() {
    // if (!USE_API) {
    //   patientsProgress = mockPatients;
    //   renderPatientsProgress(patientsProgress);
    //   switchPage("log-detail");
    //   return;
    // }
    let practiceSessionId = null;
    try {
      const res = await fetch("https://vocalborn.r0930514.work/api/practice/therapist/patients/overview?skip=0&limit=20", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      console.log("API 總覽資料：", data);

      const patient = data.patients_overview[0]; // 先取第一個病患
      if (patient.session_progress.length > 0) {
        practiceSessionId = patient.session_progress[0].practice_session_id;
      }
      console.log(practiceSessionId);

      // 假設 API 回傳格式需要轉換
      patientsProgress = (data.patients_overview || []).map(p => {
          const isCompleted = p.completed_practice_sessions === p.total_practice_sessions;
          const firstProgress = (p.session_progress && p.session_progress.length > 0) 
          ? p.session_progress[0] 
          : null;
          return {
            name: p.patient_name,
            progress: `${p.completed_practice_sessions}/${p.total_practice_sessions}`,
            chapter: firstProgress ? firstProgress.chapter_name : "",
            status: isCompleted ? "completed" : "in-progress",
            statusText: isCompleted ? "✅ 已完成" : "⏳ 進行中",
            id: p.patient_id,
            lastPractice: p.last_practice_date,
            pendingFeedback: p.total_pending_feedback,
            session_progress: p.session_progress,
            details: []
          };
        });

    } catch (err) {
      console.error("取得病患總覽失敗：", err);
      alert("無法取得病患資料，改用假資料。");
      patientsProgress = mockPatients;
      
    }
    renderPatientsProgress(patientsProgress);
    attachWidgetCardEvents();
    switchPage("log-detail");
    return practiceSessionId;
  }
    // ================== 渲染病患卡片 ==================
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

        // 🔥 點擊卡片 → 呼叫 fetchPatientPractice()
        card.addEventListener("click", () => {
          fetchPatientPractice(index);
        });
        container.appendChild(card);
      });
    }


// 取得病患詳細紀錄
function renderPatientDetails(patient) {
    const container = document.getElementById("patient-details");
    const title = document.getElementById("detail-patient-name");
    title.textContent = `${patient.name} - ${patient.chapter_name || "未指定章節"}`;
    if (!container) return;

    // 先清空內容
    container.innerHTML = "";

    // 基本資訊
    const basicInfo = document.createElement("div");
    basicInfo.innerHTML = `
        <h3>病患: ${patient.name || "未知"}</h3>
        <p>ID: ${patient.id}</p>
    `;
    container.appendChild(basicInfo);

    // session_id (方便追蹤)
    if (patient.practice_session_id) {
        const sessionInfo = document.createElement("p");
        sessionInfo.textContent = `當前會話 ID: ${patient.practice_session_id}`;
        container.appendChild(sessionInfo);
    }

    // 練習紀錄
    if (patient.details && patient.details.length > 0) {
        const practiceList = document.createElement("ul");

        patient.details.forEach(detail => {
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>句子:</strong> ${detail.sentence} <br>
                <strong>音檔:</strong> ${detail.audio ? `<audio controls src="${detail.audio}"></audio>` : "無"} <br>
                <strong>是否完成:</strong> ${detail.qualified ? "✅" : "❌"} <br>
                <strong>建議:</strong> ${detail.suggestion || "無"}
            `;
            practiceList.appendChild(li);
        });

        container.appendChild(practiceList);
    } else {
        const noData = document.createElement("p");
        noData.textContent = "沒有練習紀錄。";
        container.appendChild(noData);
    }
}

async function fetchPatientPractice(index) {
  if (!USE_API) {
    renderPatientDetails(patientsProgress[index]);
    switchPage("log-detail-detail");
    return;
  }

  try {
    const patientId = patientsProgress[index].id;
    const sessionId = patientsProgress[index].session_progress[0]?.practice_session_id;
    const res = await fetch(`https://vocalborn.r0930514.work/api/practice/therapist/patients/${patientId}/practices?practice_session_id=${sessionId}&pending_feedback_only=false`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    console.log("API 詳細資料：", data);

    if (!data.practice_sessions || data.practice_sessions.length === 0) {
      throw new Error("找不到任何練習會話");
    }

    const session = data.practice_sessions[0]; // 目前只處理第一個會話
    const records = session.practice_records || [];

    patientsProgress[index].details = records.map(r => ({
      practice_id: r.practice_id,
      practice_session_id: session.practice_session_id,
      sentence: typeof r.sentence === "string" 
      ? r.sentence 
      : (r.sentence?.sentence_content || ""),
      audio: r.audio_url || "",
      qualified: r.completed,
      suggestion: r.feedback || ""
    }));

      // 額外存放 session_id 與章節資訊，方便後續使用
    patientsProgress[index].practice_session_id = session.practice_session_id;
    patientsProgress[index].chapter_id = session.chapter_id;
    patientsProgress[index].chapter_name = session.chapter_name;


    renderPatientDetails(patientsProgress[index]);
    switchPage("log-detail-detail");
  } catch (err) {
    console.error("取得病患詳細資料失敗：", err);
    if (!window.alertedOnce) { //讓alert只跳一次
      alert("無法取得詳細資料，改用假資料。");
      window.alertedOnce = true;
    }
    renderPatientDetails(patientsProgress[index]);
    switchPage("log-detail-detail");
  }
}

async function submitFeedback(index) {
  btnSubmitDetails.disabled = true;
  const patient = patientsProgress[index];

  const detailCards = detailContainer.querySelectorAll(".patient-card");
  detailCards.forEach((card, idx) => {
    const toggleBtn = card.querySelector(".toggle-qualified-btn");
    const suggestionInput = card.querySelector(".suggestion-input");
    if (!patient.details[idx]) patient.details[idx] = {};
    patient.details[idx].qualified = toggleBtn.textContent === '✅';
    patient.details[idx].suggestion = suggestionInput.value.trim();
  });

  if (!USE_API) {
    console.log("假資料已更新：", patient);
    alert("回饋已儲存（假資料模式）！");
    return;
  }

  try {
    const practice_session_id = patient.practice_session_id;
    if (!practice_session_id) throw new Error("缺少 practice_session_id，無法提交");

    const payload = Array.isArray(patient.details) ? patient.details.map(d => ({
      practice_id: d.practice_id,
      feedback: d.suggestion,
      completed: d.qualified
    })) : [];

    const res = await fetch(`https://vocalborn.r0930514.work/api/practice/therapist/session/${practice_session_id}/feedback`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error("提交失敗: " + errText);
    }

    const result = await res.json().catch(() => ({}));
    console.log("回饋 API 回傳：", result);
    alert("回饋已成功提交！");
  } catch (err) {
    console.error("提交失敗：", err);
    alert("回饋提交失敗");
  }
}

  // 綁定事件
  // 註: 「今日練習」相關功能已移至 recode.js 處理,避免重複綁定
  // btnViewLog.addEventListener("click", fetchPatientsOverview);
  // btnBackToHome.addEventListener("click", () => switchPage("home"));
  // btnBackToLog.addEventListener("click", () => switchPage("log-detail"));

  // document.getElementById("patients-container").addEventListener("click", e => {
  //   const card = e.target.closest(".patient-card");
  //   if (card) {
  //     const index = card.dataset.index;
  //     if (index !== undefined) {
  //       currentPatientIndex = index;
  //       fetchPatientPractice(index);
  //     }
  //   }
  // });

  fetchPatientList();
});

  // ==================== 初始執行 ====================
  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.getAttribute("data-target");
      showSection(target);
    });
  });
  
  //showSection("home");

  function logout() {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    window.location.href = "../index.html"; // 這裡換成實際的登入頁
   }

