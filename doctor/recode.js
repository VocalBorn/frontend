document.addEventListener("DOMContentLoaded", () => {
  const homeSection = document.getElementById("home");
  const logDetailSection = document.getElementById("log-detail");
  const sessionListSection = document.getElementById("session-list");
  const logDetailDetailSection = document.getElementById("log-detail-detail");

  const btnViewLog = document.getElementById("view-log-btn");
  const btnBackToHome = document.getElementById("back-btn");
  const btnBackToLogFromSession = document.getElementById("back-to-log-from-session");
  const btnBackToSession = document.getElementById("back-to-session");
  const btnSubmitDetails = document.getElementById("submit-details");
  const detailContainer = document.getElementById("detail-container");
  const sessionsContainer = document.getElementById("sessions-container");

  let patientsProgress = []; // 全域存放病患資料
  let currentPatientIndex = null; // 當前選擇的病患索引
  const token = localStorage.getItem("token");

  // 底部統一回饋 input
  let feedbackInput = document.getElementById("feedback-input");
  if (!feedbackInput) {
    feedbackInput = document.createElement("textarea");
    feedbackInput.id = "feedback-input";
    feedbackInput.placeholder = "請在此輸入整體回饋...";
    feedbackInput.style.width = "100%";
    feedbackInput.style.marginTop = "10px";
    detailContainer.parentElement.appendChild(feedbackInput);
  }

  async function fetchPatientsOverview() {
    try {
      const res = await fetch("https://vocalborn.r0930514.work/api/practice/therapist/patients/overview", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`API 錯誤: ${res.status} - ${res.statusText}`);
      }

      const data = await res.json();

      if (!data.patients_overview || data.patients_overview.length === 0) {
        alert("目前沒有病患資料");
        return;
      }

      patientsProgress = data.patients_overview.map(p => {
        let status = "";
        let statusText = "";

        if (p.session_progress && p.session_progress.length > 0) {
          status = "practicing";
          statusText = "🎯 正在練習";
        } else if (p.total_pending_feedback > 0) {
          status = "in-progress";
          statusText = "⏳ 待回饋";
        } else {
          status = "completed";
          statusText = "✅ 已回饋";
        }

        return {
          id: p.patient_id,
          name: p.patient_name,
          progress: `${p.completed_practice_sessions}/${p.total_practice_sessions}`,
          status,
          statusText,
          session_progress: p.session_progress || [],
          details: []
        };
      });

      renderPatientsProgress();
    } catch (err) {
      console.error("取得總覽失敗：", err);
      alert(`無法取得病患總覽: ${err.message}`);
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

  function renderSessionsList(patientIndex) {
    const patient = patientsProgress[patientIndex];
    if (!patient) {
      alert("找不到病患資料");
      return;
    }

    currentPatientIndex = patientIndex;
    const sessionNameEl = document.getElementById("session-patient-name");
    sessionNameEl.textContent = `${patient.name} - 選擇練習會話`;

    sessionsContainer.innerHTML = "";

    if (!patient.session_progress || patient.session_progress.length === 0) {
      sessionsContainer.innerHTML = "<p>此病患目前沒有任何練習會話</p>";
      return;
    }

    patient.session_progress.forEach((session, index) => {
      const sessionCard = document.createElement("div");
      sessionCard.className = "patient-card";
      sessionCard.dataset.sessionIndex = index;
      sessionCard.innerHTML = `
        <div class="patient-name">會話 ${index + 1}: ${session.chapter_name || "未命名章節"}</div>
        <div class="patient-progress">練習時間: ${new Date(session.created_at).toLocaleString('zh-TW')}</div>
        <div class="patient-status ${session.has_feedback ? 'completed' : 'in-progress'}">
          ${session.has_feedback ? '✅ 已回饋' : '⏳ 待回饋'}
        </div>
      `;
      sessionsContainer.appendChild(sessionCard);
    });
  }

  async function fetchPatientPractice(patientIndex, sessionIndex) {
    try {
      const patient = patientsProgress[patientIndex];
      if (!patient) {
        throw new Error("找不到病患資料");
      }

      const session = patient.session_progress[sessionIndex];
      if (!session) {
        throw new Error("找不到會話資料");
      }

      const patientId = patient.id;
      const sessionId = session.practice_session_id;

      if (!sessionId) {
        throw new Error("會話 ID 不存在");
      }

      const res = await fetch(`https://vocalborn.r0930514.work/api/practice/therapist/patients/${patientId}/practices?practice_session_id=${sessionId}&pending_feedback_only=false`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`API 錯誤: ${res.status} - ${res.statusText}`);
      }

      const data = await res.json();

      if (!data.practice_sessions || data.practice_sessions.length === 0) {
        throw new Error("找不到任何練習會話");
      }

      const sessionData = data.practice_sessions[0];
      const records = sessionData.practice_records || [];

      if (records.length === 0) {
        throw new Error("此會話沒有練習紀錄");
      }

      patientsProgress[patientIndex].details = records.map(r => ({
        chapter_id: r.chapter_id,
        practice_session_id: sessionData.practice_session_id,
        sentence_id: r.sentence_id,
        sentence: r.sentence_content || "",
        audio: r.audio_stream_url || "",
        qualified: false,
        suggestion: ""
      }));

      patientsProgress[patientIndex].practice_session_id = sessionData.practice_session_id;
      patientsProgress[patientIndex].chapter_id = sessionData.chapter_id;
      patientsProgress[patientIndex].chapter_name = sessionData.chapter_name;

      renderPatientDetails(patientsProgress[patientIndex]);
      switchPage("log-detail-detail");
    } catch (err) {
      console.error("取得病患詳細資料失敗：", err);
      alert(`無法取得詳細資料: ${err.message}`);
    }
  }

  async function renderPatientDetails(patient) {
  const title = document.getElementById("detail-patient-name");
  title.textContent = `${patient.name} - ${patient.chapter_name || ""}`;
  detailContainer.innerHTML = "";
  feedbackInput.value = "";

  patient.details.forEach((detail, idx) => {
  const item = document.createElement("div");
  item.className = "patient-card";
  item.innerHTML = `
    <div class="patient-name">${idx + 1}. ${detail.sentence || ""}</div>

    <div class="patient-progress">
      <div class="audio-header" style="display: flex; align-items: center; gap: 10px;">
        <h3>患者音訊</h3>
        <button class="play-audio-btn" data-audio="${detail.audio || ''}">🔊</button>
      </div>
    </div>

    <div class="patient-status">
      <label>🤖 AI 回饋</label>
      <div class="ai-feedback-display" data-sentence-id="${detail.sentence_id}"></div>
    </div>

    <!-- 彈出視窗 (不用 id，改用 class) -->
    <div class="ai-feedback-modal">
      <div class="modal-content">
        <span class="close-btn">&times;</span>
        <h3>AI 回饋內容</h3>
        <div class="ai-feedback-display" data-sentence-id="${detail.sentence_id}"></div>
      </div>
    </div>
  `;
  detailContainer.appendChild(item);
});

// 綁定所有 AI 回饋框和對應的 modal
document.addEventListener("click", (e) => {
  // 點擊顯示彈窗
  if (e.target.classList.contains("ai-feedback-display")) {
    const modal = e.target.closest(".patient-card").querySelector(".ai-feedback-modal");
    modal.style.display = "flex";
  }

  // 點擊關閉按鈕
  if (e.target.classList.contains("close-btn")) {
    const modal = e.target.closest(".ai-feedback-modal");
    modal.style.display = "none";
  }

  // 點擊背景關閉
  if (e.target.classList.contains("ai-feedback-modal")) {
    e.target.style.display = "none";
  }
});


  // 音訊播放功能
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

  try {
    if (!patient.practice_session_id) {
      throw new Error("缺少練習會話 ID");
    }

    const res = await fetch(`https://vocalborn.r0930514.work/api/ai-analysis/results/${patient.practice_session_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AI 回饋抓取失敗: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    console.log('AI 回饋資料:', data);

    if (!data.results || data.results.length === 0) {
      throw new Error("沒有可用的 AI 回饋資料");
    }

    data.results.forEach(result => {
      const feedbackEls = detailContainer.querySelectorAll(
        `.ai-feedback-display[data-sentence-id="${result.sentence_id}"]`
      );

      feedbackEls.forEach((el) => {
        el.textContent =
          result.analysis_result?.suggestions || "尚無 AI 回饋";
      });
    });
  } catch (err) {
    console.error("AI 回饋載入錯誤:", err);
    detailContainer.querySelectorAll(".ai-feedback-display").forEach(el => {
      el.textContent = `AI 回饋載入失敗: ${err.message}`;
    });
  }
}

  function switchPage(showSectionId) {
    document.querySelectorAll(".page-section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(showSectionId).classList.add("active");
  }

  // ===== 綁定按鈕 =====
  btnViewLog.addEventListener("click", async () => {
    await fetchPatientsOverview();
    switchPage("log-detail");
  });

  btnBackToHome.addEventListener("click", () => switchPage("home"));

  btnBackToLogFromSession.addEventListener("click", () => switchPage("log-detail"));

  btnBackToSession.addEventListener("click", () => {
    if (currentPatientIndex !== null) {
      renderSessionsList(currentPatientIndex);
      switchPage("session-list");
    } else {
      switchPage("log-detail");
    }
  });

  // 點擊病患卡片 -> 顯示會話列表
  document.getElementById("patients-container").addEventListener("click", e => {
    const card = e.target.closest(".patient-card");
    if (card) {
      const index = card.dataset.index;
      if (index !== undefined) {
        renderSessionsList(index);
        switchPage("session-list");
      }
    }
  });

  // 點擊會話卡片 -> 顯示詳細資料
  sessionsContainer.addEventListener("click", e => {
    const card = e.target.closest(".patient-card");
    if (card) {
      const sessionIndex = card.dataset.sessionIndex;
      if (sessionIndex !== undefined && currentPatientIndex !== null) {
        fetchPatientPractice(currentPatientIndex, parseInt(sessionIndex));
      }
    }
  });

  btnSubmitDetails.addEventListener("click", async() => {
    const patientName = document.getElementById("detail-patient-name").textContent;
    const patient = patientsProgress.find(p => `${p.name} - ${p.chapter_name}` === patientName);
    if (!patient) return alert("找不到病患資料");

    const detailCards = detailContainer.querySelectorAll(".patient-card");
    detailCards.forEach((card, idx) => {
      const toggleBtn = card.querySelector(".toggle-qualified-btn");
      //patient.details[idx].qualified = toggleBtn.textContent === '✅';
      patient.details[idx].suggestion = feedbackInput.value.trim();
    });

    const practice_session_id = patient.practice_session_id;
    if (!practice_session_id) {
      alert("缺少 practice_session_id，無法提交");
      btnSubmitDetails.disabled = false;
      return;
    }

    try {
      // ---------------- 取得回饋 GET ----------------
      let res = await fetch(`https://vocalborn.r0930514.work/api/practice/therapist/session/${practice_session_id}/feedback`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      let feedbackData = [];
      if (res.ok) {
        feedbackData = await res.json();
        console.log("取得回饋 GET 成功：", feedbackData);
      }
      

      // ---------------- 如果沒有回饋就 POST ----------------
      if (!feedbackData || feedbackData.length === 0) {
        const postPayload = {
          practice_session_id,
          patient_id: patient.patient_id,
          chapter_id: patient.chapter_id,
          content: patient.content?.trim() || "無回饋"
        };

        res = await fetch(`https://vocalborn.r0930514.work/api/practice/therapist/session/${practice_session_id}/feedback`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(postPayload)
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`提交失敗：${res.status} - ${errText}`);
        }
        feedbackData = await res.json();
        console.log("回饋 POST 成功：", feedbackData);
      }

      // ---------------- 更新回饋 PUT ----------------
      
        //const card = detailCards[idx];
        //const suggestionInput = card.querySelector(".feedback-input");
        const putPayload = { content: feedbackInput.value.trim() };

        res = await fetch(`https://vocalborn.r0930514.work/api/practice/therapist/session/${practice_session_id}/feedback`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(putPayload)
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`更新失敗：${res.status} - ${errText}`);
        }

        const updateResult = await res.json();
        console.log("更新回饋 PUT 成功：", updateResult);
      

      alert("回饋已成功提交！");
    } catch (err) {
      console.error("操作失敗：", err);
      alert("回饋操作失敗");
    } finally {
      btnSubmitDetails.disabled = false;
    }


    // const overallFeedback = feedbackInput.value.trim();
    // console.log("病患：", patient.name, "完成狀態：", patient.details.map(d => d.qualified), "整體回饋：", overallFeedback);
    // alert("已成功提交整體回饋！");
    // feedbackInput.value = "";
  });
});
