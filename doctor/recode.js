document.addEventListener("DOMContentLoaded", () => {
  const homeSection = document.getElementById("home");
  const logDetailSection = document.getElementById("log-detail");
  const logDetailDetailSection = document.getElementById("log-detail-detail");

  const btnViewLog = document.getElementById("view-log-btn");
  const btnBackToHome = document.getElementById("back-btn");
  const btnBackToLog = document.getElementById("back-to-log");
  const btnSubmitDetails = document.getElementById("submit-details");
  const detailContainer = document.getElementById("detail-container");

  let patientsProgress = []; // 全域存放病患資料
  const USE_API = true;
  const token = localStorage.getItem("token");

  function switchPage(showSectionId) {
    document.querySelectorAll(".page-section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(showSectionId).classList.add("active");
  }

  function enableSubmit() {
    btnSubmitDetails.disabled = false;
  }

  // 取得病患總覽
  async function fetchPatientsOverview() {
    if (!USE_API) return; // TODO: 可放假資料
    try {
      const res = await fetch("https://vocalborn.r0930514.work/api/practice/therapist/patients/overview", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      console.log("總覽資料：", data);

      patientsProgress = data.patients_overview.map(p => ({
        id: p.patient_id,
        name: p.patient_name,
        progress: `${p.completed_practice_sessions}/${p.total_practice_sessions}`,
        status: p.total_pending_feedback > 0 ? "in-progress" : "completed",
        statusText: p.total_pending_feedback > 0 ? "⏳ 待回饋" : "✅ 已完成",
        session_progress: p.session_progress || [],
        details: []
      }));

      renderPatientsProgress();
    } catch (err) {
      console.error("取得總覽失敗：", err);
      alert("無法取得病患總覽");
    }
  }

  function renderPatientsProgress() {
    const container = document.getElementById("patients-container");
    container.innerHTML = "";
    patientsProgress.forEach((patient, index) => {
      const card = document.createElement("div");
      card.className = "patient-card";
      card.dataset.index = index;
      card.innerHTML = `
        <div class="patient-name">${patient.name}</div>
        <div class="patient-progress">進度：${patient.progress}</div>
        <div class="patient-status ${patient.status}">${patient.statusText}</div>
      `;
      container.appendChild(card);
    });
  }

  // 取得病患詳細紀錄
  async function fetchPatientPractice(index) {
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

      const session = data.practice_sessions[0]; // 只取第一個會話
      const records = session.practice_records || [];

      patientsProgress[index].details = records.map(r => ({
        chapter_id: r.chapter_id,
        practice_session_id: session.practice_session_id,
        sentence: r.sentence_content || "",
        audio: r.audio_stream_url || "",
        qualified: false,
        suggestion: ""
      }));

      patientsProgress[index].practice_session_id = session.practice_session_id;
      patientsProgress[index].chapter_id = session.chapter_id;
      patientsProgress[index].chapter_name = session.chapter_name;

      renderPatientDetails(patientsProgress[index]);
      switchPage("log-detail-detail");
    } catch (err) {
      console.error("取得病患詳細資料失敗：", err);
      alert("無法取得詳細資料");
    }
  }

  function renderPatientDetails(patient) {
    const title = document.getElementById("detail-patient-name");
    title.textContent = `${patient.name} - ${patient.chapter_name || ""}`;
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

    // 綁定事件
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
        }
        enableSubmit();
      });
    });

    detailContainer.querySelectorAll(".suggestion-input").forEach(input => {
      input.addEventListener("input", enableSubmit);
    });
  }

  // ====== 綁定按鈕 ======
  btnViewLog.addEventListener("click", async () => {
    await fetchPatientsOverview();
    switchPage("log-detail");
  });

  btnBackToHome.addEventListener("click", () => switchPage("home"));
  btnBackToLog.addEventListener("click", () => switchPage("log-detail"));

  document.getElementById("patients-container").addEventListener("click", e => {
    const card = e.target.closest(".patient-card");
    if (card) {
      const index = card.dataset.index;
      if (index !== undefined) {
        fetchPatientPractice(index);
      }
    }
  });

  btnSubmitDetails.addEventListener("click", async () => {
    btnSubmitDetails.disabled = true;

    const patientName = document.getElementById("detail-patient-name").textContent;
    const patient = patientsProgress.find(p => `${p.name} - ${p.chapter_name}` === patientName);
    if (!patient) return alert("找不到病患資料");

    const detailCards = detailContainer.querySelectorAll(".patient-card");
    detailCards.forEach((card, idx) => {
      const toggleBtn = card.querySelector(".toggle-qualified-btn");
      const suggestionInput = card.querySelector(".suggestion-input");
      patient.details[idx].qualified = toggleBtn.textContent === '✅';
      patient.details[idx].suggestion = suggestionInput.value.trim();
    });

  //   const practice_session_id = patient.practice_session_id;
  //   if (!practice_session_id) {
  //     alert("缺少 practice_session_id，無法提交");
  //     btnSubmitDetails.disabled = false;
  //     return;
  //   }

  //   try {
  //     // ---------------- 取得回饋 GET ----------------
  //     let res = await fetch(`https://vocalborn.r0930514.work/api/practice/therapist/session/${practice_session_id}/feedback`, {
  //       method: "GET",
  //       headers: { "Authorization": `Bearer ${token}` }
  //     });

  //     let feedbackData = [];
  //     if (res.ok) {
  //       feedbackData = await res.json();
  //       console.log("取得回饋 GET 成功：", feedbackData);
  //     }
      

  //     // ---------------- 如果沒有回饋就 POST ----------------
  //     if (!feedbackData || feedbackData.length === 0) {
  //       const postPayload = {
  //         practice_session_id,
  //         patient_id: patient.patient_id,
  //         chapter_id: patient.chapter_id,
  //         content: patient.content?.trim() || "無回饋"
  //       };

  //       res = await fetch(`https://vocalborn.r0930514.work/api/practice/therapist/session/${practice_session_id}/feedback`, {
  //         method: "POST",
  //         headers: {
  //           "Authorization": `Bearer ${token}`,
  //           "Content-Type": "application/json"
  //         },
  //         body: JSON.stringify(postPayload)
  //       });

  //       if (!res.ok) {
  //         const errText = await res.text();
  //         throw new Error(`提交失敗：${res.status} - ${errText}`);
  //       }
  //       feedbackData = await res.json();
  //       console.log("回饋 POST 成功：", feedbackData);
  //     }

  //     // ---------------- 更新回饋 PUT ----------------
  //     for (let idx = 0; idx < patient.details.length; idx++) {
  //       const card = detailCards[idx];
  //       const suggestionInput = card.querySelector(".suggestion-input");
  //       const putPayload = { content: suggestionInput.value.trim() };

  //       res = await fetch(`https://vocalborn.r0930514.work/api/practice/therapist/session/${practice_session_id}/feedback`, {
  //         method: "PUT",
  //         headers: {
  //           "Authorization": `Bearer ${token}`,
  //           "Content-Type": "application/json"
  //         },
  //         body: JSON.stringify(putPayload)
  //       });

  //       if (!res.ok) {
  //         const errText = await res.text();
  //         throw new Error(`更新失敗：${res.status} - ${errText}`);
  //       }

  //       const updateResult = await res.json();
  //       console.log("更新回饋 PUT 成功：", updateResult);
  //     }

  //     alert("回饋已成功提交並更新！");
  //   } catch (err) {
  //     console.error("操作失敗：", err);
  //     alert("回饋操作失敗");
  //   } finally {
  //     btnSubmitDetails.disabled = false;
  //   }
   });

});
