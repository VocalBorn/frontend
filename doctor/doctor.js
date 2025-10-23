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

  // ==================== 初始執行 ====================
  // 這段代碼已經在上面的 links.forEach 中處理過了（第 45-51 行）
  // 不需要重複綁定

  //showSection("home");
});

// 登出函數（全局）
function logout() {
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
  window.location.href = "../index.html"; // 這裡換成實際的登入頁
}

// ========================================
// 治療師端聊天系統整合
// ========================================
console.log('🏥 治療師端聊天系統代碼已載入');

let chatManager = null;
let currentChatUserId = null;
let chatSystemInitializing = false; // 防止重複初始化

// 初始化聊天系統
async function initChatSystem() {
    // 如果正在初始化或已經初始化完成，直接返回
    if (chatSystemInitializing) {
        console.log('聊天系統正在初始化中，跳過重複請求');
        return;
    }

    if (chatManager) {
        console.log('聊天系統已初始化，跳過重複初始化');
        return;
    }

    chatSystemInitializing = true;
    console.log('開始初始化聊天系統...');

    const token = localStorage.getItem("token");

    if (!token) {
        console.error('未找到 token，無法初始化聊天系統');
        chatSystemInitializing = false;
        return;
    }

    try {
        // 取得當前治療師 ID
        const userProfile = await fetchTherapistProfile();
        if (!userProfile || !userProfile.user_id) {
            console.error('無法取得治療師資料');
            chatSystemInitializing = false;
            return;
        }

        currentChatUserId = userProfile.user_id;
        console.log('當前治療師 ID:', currentChatUserId);

        // 檢查 ChatManager 是否可用
        if (typeof ChatManager === 'undefined') {
            console.error('❌ ChatManager 類別未定義！請檢查 js_chat.js 是否正確載入');
            chatSystemInitializing = false;
            return;
        }

        // 創建聊天管理器實例
        console.log('正在創建 ChatManager 實例...');
        chatManager = new ChatManager();
        console.log('ChatManager 實例創建成功');

        // 註冊事件處理器
        chatManager.on('connectionChange', handleConnectionChange);
        chatManager.on('newMessage', handleNewMessage);
        chatManager.on('messageStatusUpdate', handleMessageStatusUpdate);
        chatManager.on('typingStatusChange', handleTypingStatusChange);
        chatManager.on('roomsUpdate', handleRoomsUpdate);
        chatManager.on('error', handleChatError);
        console.log('事件處理器註冊完成');

        // 初始化聊天管理器
        const success = await chatManager.init(token, currentChatUserId);

        if (success) {
            console.log('✅ 聊天系統初始化成功');
            setupChatUI();
        } else {
            console.error('❌ 聊天系統初始化失敗');
            chatManager = null; // 重置以便下次重試
        }
    } catch (error) {
        console.error('❌ 初始化聊天系統失敗:', error);
        chatManager = null; // 重置以便下次重試
    } finally {
        chatSystemInitializing = false;
    }
}

// 取得治療師資料
async function fetchTherapistProfile() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch('https://vocalborn.r0930514.work/api/user/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('取得治療師資料失敗');
        }

        return await response.json();
    } catch (error) {
        console.error('取得治療師資料失敗:', error);
        return null;
    }
}

// 追蹤是否已設定 UI 事件（避免重複綁定）
let chatUIEventsSetup = false;

// 設定聊天 UI 事件
function setupChatUI() {
    // 如果已經設定過，不重複設定
    if (chatUIEventsSetup) {
        console.log('聊天 UI 事件已設定，跳過重複設定');
        return;
    }

    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const refreshRoomsBtn = document.getElementById("refreshRoomsBtn");
    const loadMoreBtn = document.getElementById("loadMoreBtn");

    // 發送訊息
    if (sendButton) {
        sendButton.addEventListener("click", handleSendMessage);
    }

    // Enter 鍵發送訊息
    if (chatInput) {
        chatInput.addEventListener("keypress", handleChatInputKeypress);
        chatInput.addEventListener("input", handleChatInputChange);
    }

    // 重新整理聊天室列表
    if (refreshRoomsBtn) {
        refreshRoomsBtn.addEventListener("click", handleRefreshRooms);
    }

    // 載入更多訊息
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", handleLoadMoreMessages);
    }

    // 標記為已設定
    chatUIEventsSetup = true;
    console.log('聊天 UI 事件設定完成');
}

// 發送訊息處理函數
function handleSendMessage() {
    const chatInput = document.getElementById("chatInput");
    const message = chatInput.value.trim();
    if (message && chatManager) {
        const success = chatManager.sendMessage(message);
        if (success) {
            chatInput.value = "";
        }
    }
}

// Enter 鍵處理函數
function handleChatInputKeypress(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        document.getElementById("sendButton").click();
    }
}

// 輸入變化處理函數
function handleChatInputChange() {
    if (chatManager && chatManager.isConnected) {
        chatManager.startTyping();
    }
}

// 重新整理聊天室處理函數
async function handleRefreshRooms() {
    if (chatManager) {
        try {
            console.log('開始重新整理聊天室列表...');
            await chatManager.loadRooms();
            console.log('聊天室列表重新整理完成');
        } catch (error) {
            console.error('重新整理聊天室失敗:', error);
        }
    }
}

// 載入更多訊息處理函數
async function handleLoadMoreMessages() {
    if (chatManager && chatManager.currentRoomId) {
        try {
            const currentMessageCount = chatManager.getMessages().length;
            const result = await chatManager.loadMessages(
                chatManager.currentRoomId,
                CONFIG.CHAT.MESSAGE_LIMIT,
                currentMessageCount
            );

            // 重新渲染訊息
            renderMessages(chatManager.getMessages());

            // 如果沒有更多訊息，隱藏按鈕
            if (!result.hasMore) {
                document.getElementById("loadMoreContainer").style.display = 'none';
            }
        } catch (error) {
            console.error('載入更多訊息失敗:', error);
        }
    }
}

// 處理連線狀態變更
function handleConnectionChange(isConnected) {
    const statusElement = document.getElementById("chatConnectionStatus");
    const statusText = document.getElementById("connectionStatusText");
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");

    if (statusElement) {
        statusElement.className = isConnected ? 'chat-connection-status connected' : 'chat-connection-status disconnected';
    }

    if (statusText) {
        statusText.textContent = isConnected ? '已連線' : '未連線';
    }

    // 啟用/禁用輸入框
    if (chatInput) {
        chatInput.disabled = !isConnected;
    }

    if (sendButton) {
        sendButton.disabled = !isConnected;
    }
}

// 處理新訊息
function handleNewMessage(message) {
    renderMessage(message);
    scrollToBottom();

    // 播放通知音效（可選）
    if (message.sender_id !== currentChatUserId) {
        playNotificationSound();
    }
}

// 處理訊息狀態更新
function handleMessageStatusUpdate(messageId, status, timestamp) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        const statusElement = messageElement.querySelector('.message-status');
        if (statusElement) {
            statusElement.innerHTML = getStatusIcon(status);
        }
    }
}

// 處理輸入狀態變更
function handleTypingStatusChange(isTyping, userName) {
    const typingIndicator = document.getElementById("typingIndicator");
    if (typingIndicator) {
        typingIndicator.style.display = isTyping ? 'flex' : 'none';
        if (isTyping) {
            scrollToBottom();
        }
    }
}

// 處理聊天室更新
function handleRoomsUpdate(rooms) {
    renderRoomsList(rooms);
}

// 處理錯誤
function handleChatError(message) {
    console.error('聊天錯誤:', message);
    alert(message);
}

// 渲染聊天室列表
function renderRoomsList(rooms) {
    const roomsList = document.getElementById("chatRoomsList");
    if (!roomsList) return;

    if (rooms.length === 0) {
        roomsList.innerHTML = `
            <div class="chat-rooms-empty">
                <i class="fas fa-inbox"></i>
                <p>目前沒有聊天室</p>
            </div>
        `;
        return;
    }

    roomsList.innerHTML = rooms.map(room => {
        const patientName = room.client_name || '未知病患';
        const lastMessageTime = room.last_message_at ? formatTime(room.last_message_at) : '';
        const unreadBadge = room.unread_count > 0 ? `<span class="unread-badge">${room.unread_count}</span>` : '';

        return `
            <div class="chat-room-item ${chatManager.currentRoomId === room.room_id ? 'active' : ''}"
                 data-room-id="${room.room_id}"
                 onclick="selectChatRoom('${room.room_id}')">
                <div class="room-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="room-info">
                    <div class="room-name">${patientName}</div>
                    <div class="room-last-message">${lastMessageTime}</div>
                </div>
                ${unreadBadge}
            </div>
        `;
    }).join('');
}

// 選擇聊天室
async function selectChatRoom(roomId) {
    if (!chatManager) return;

    try {
        // 顯示載入狀態
        document.getElementById("chatEmptyState").style.display = 'none';
        document.getElementById("chatActiveContainer").style.display = 'flex';

        // 連接到聊天室
        await chatManager.connectToRoom(roomId);

        // 更新聊天室名稱
        const room = chatManager.getCurrentRoom();
        if (room) {
            const patientName = room.client_name || '病患';
            document.getElementById("chatRoomName").textContent = patientName;
        }

        // 渲染訊息
        renderMessages(chatManager.getMessages());

        // 更新聊天室列表選中狀態
        document.querySelectorAll('.chat-room-item').forEach(item => {
            item.classList.toggle('active', item.dataset.roomId === roomId);
        });

        // 滾動到底部
        scrollToBottom();
    } catch (error) {
        console.error('選擇聊天室失敗:', error);
        handleChatError('無法連接到聊天室');
    }
}

// 渲染所有訊息
function renderMessages(messages) {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    chatMessages.innerHTML = messages.map(msg => createMessageHTML(msg)).join('');

    // 標記未讀訊息為已讀
    const unreadMessages = messages.filter(m =>
        m.sender_id !== currentChatUserId && m.status !== 'read'
    );
    if (unreadMessages.length > 0) {
        chatManager.markAsRead(unreadMessages.map(m => m.message_id));
    }
}

// 渲染單一訊息
function renderMessage(message) {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    const messageHTML = createMessageHTML(message);
    chatMessages.insertAdjacentHTML('beforeend', messageHTML);
}

// 創建訊息 HTML
function createMessageHTML(message) {
    const isSent = message.sender_id === currentChatUserId;
    const messageClass = isSent ? 'message message-sent' : 'message message-received';
    const timeString = formatTime(message.created_at);
    const statusIcon = isSent ? getStatusIcon(message.status) : '';

    return `
        <div class="${messageClass}" data-message-id="${message.message_id}">
            <div class="message-bubble">
                <div class="message-content">${escapeHtml(message.content)}</div>
                <div class="message-meta">
                    <span class="message-time">${timeString}</span>
                    ${isSent ? `<span class="message-status">${statusIcon}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// 取得訊息狀態圖示
function getStatusIcon(status) {
    switch (status) {
        case 'sent':
            return '<i class="fas fa-check"></i>';
        case 'delivered':
            return '<i class="fas fa-check-double"></i>';
        case 'read':
            return '<i class="fas fa-check-double" style="color: #4396cd;"></i>';
        default:
            return '';
    }
}

// 格式化時間（僅顯示時間，避免跑版）
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 滾動到底部
function scrollToBottom() {
    const chatMessagesContainer = document.getElementById("chatMessagesContainer");
    if (chatMessagesContainer) {
        setTimeout(() => {
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }, 100);
    }
}

// 轉義 HTML 特殊字符
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 播放通知音效
function playNotificationSound() {
    // 可選：播放音效
    // const audio = new Audio('/path/to/notification.mp3');
    // audio.play().catch(e => console.log('無法播放音效:', e));
}

// 當切換到聊天頁面時初始化
document.addEventListener('DOMContentLoaded', () => {
    let lastPageState = false; // 追蹤上一次的頁面狀態

    // 監聽頁面切換到聊天室
    const instantMessagingSection = document.getElementById('instant-messaging');
    if (instantMessagingSection) {
        const observer = new MutationObserver(() => {
            const isActive = instantMessagingSection.classList.contains('active');

            // 只在狀態從 false 變為 true 時觸發（避免重複觸發）
            if (isActive && !lastPageState) {
                console.log('📱 切換到聊天頁面');
                lastPageState = true;

                // 切換到聊天頁面，初始化聊天系統
                if (!chatManager && !chatSystemInitializing) {
                    initChatSystem();
                }
            } else if (!isActive && lastPageState) {
                console.log('👋 離開聊天頁面');
                lastPageState = false;
            }
        });

        observer.observe(instantMessagingSection, {
            attributes: true,
            attributeFilter: ['class'] // 只監聽 class 屬性變化
        });

        console.log('🔍 已設定聊天頁面監聽器');
    }
});

