document.addEventListener("DOMContentLoaded", () => {
  // ==================== 共用 DOM 變數 ====================
  const sections = document.querySelectorAll(".page-section");
  const links = document.querySelectorAll(".nav-link");

  const token = localStorage.getItem("token");

  // 🔙 共用的顯示區塊切換
  function showSection(idOrElement) {
    const targetId = typeof idOrElement === "string" ? idOrElement : idOrElement.id;
    sections.forEach(sec => {
      sec.classList.toggle("active", sec.id === targetId);
      sec.style.display = sec.id === targetId ? "block" : "none";
    });
  }
  // 顯示首頁，隱藏其他 section
  function showHome() {
    showSection("home");
  }
  // links.forEach(link => {
  //   link.addEventListener("click", e => {
  //     e.preventDefault();
  //     const target = link.getAttribute("data-target");
  //     showSection(target);
  //   });
  // });

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
  const viewLogBtn = document.getElementById("view-log-btn");
  const logDetailSection = document.getElementById("log-detail");
  const patientsContainer = document.getElementById("patients-container");

  viewLogBtn.addEventListener("click", () => {
    showSection(logDetailSection);
    patientsContainer.innerHTML = "<p>載入中...</p>";
    fetch("https://vocalborn.r0930514.work/api/practice/therapist/patients/overview?skip=0&limit=20", {
      method: "GET",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`))
      .then(data => {
        patientsContainer.innerHTML = "";
        if (!data.patients_overview || data.patients_overview.length === 0) {
          patientsContainer.innerHTML = "<p>目前沒有病患紀錄</p>";
          return;
        }
        data.patients_overview.forEach(patient => {
          const completionRate = patient.total_practice_sessions
            ? Math.round((patient.completed_practice_sessions / patient.total_practice_sessions) * 100)
            : 0;
          const lastDate = patient.last_practice_date
            ? new Date(patient.last_practice_date).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
            : "尚未練習";
          const card = document.createElement("div");
          card.classList.add("patient-progress-card");
          card.innerHTML = `
            <h4>${patient.patient_name || "未命名"}</h4>
            <p>📝 已完成：${patient.completed_practice_sessions} / ${patient.total_practice_sessions} 次</p>
            <p>📊 完成率：${completionRate}%</p>
            <p>⏰ 最後練習：${lastDate}</p>
            <p>💬 待回饋：${patient.total_pending_feedback} 筆</p>
          `;
          patientsContainer.appendChild(card);
        });
      })
      .catch(err => {
        console.error("取得病患練習資料失敗：", err);
        patientsContainer.innerHTML = "<p>載入失敗，請稍後再試。</p>";
      });
  });

  // ==================== 初始執行 ====================
  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.getAttribute("data-target");
      showSection(target);
    });
  });
  fetchPatientList();
  showSection("home");
});
