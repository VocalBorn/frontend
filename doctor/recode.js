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
    if (!USE_API) return;
    try {
      const res = await fetch("https://vocalborn.r0930514.work/api/practice/therapist/patients/overview", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

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

  async function fetchPatientPractice(index) {
    try {
      const patientId = patientsProgress[index].id;
      const sessionId = patientsProgress[index].session_progress[0]?.practice_session_id;
      const res = await fetch(`https://vocalborn.r0930514.work/api/practice/therapist/patients/${patientId}/practices?practice_session_id=${sessionId}&pending_feedback_only=false`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data.practice_sessions || data.practice_sessions.length === 0) {
        throw new Error("找不到任何練習會話");
      }

      const session = data.practice_sessions[0];
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
          <button class="toggle-qualified-btn">${detail.qualified ? '✅' : '❌'}</button>
        </div>
      `;
      detailContainer.appendChild(item);
    });

    // 音訊播放
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

    // 勾選完成狀態（無限制）
    detailContainer.querySelectorAll(".toggle-qualified-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        btn.textContent = btn.textContent === '✅' ? '❌' : '✅';
      });
    });
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

  btnSubmitDetails.addEventListener("click", async() => {
    const patientName = document.getElementById("detail-patient-name").textContent;
    const patient = patientsProgress.find(p => `${p.name} - ${p.chapter_name}` === patientName);
    if (!patient) return alert("找不到病患資料");

    const detailCards = detailContainer.querySelectorAll(".patient-card");
    detailCards.forEach((card, idx) => {
      const toggleBtn = card.querySelector(".toggle-qualified-btn");
      patient.details[idx].qualified = toggleBtn.textContent === '✅';
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
      

      alert("回饋已成功提交並更新！");
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
