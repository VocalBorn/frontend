//建立配對
document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".page-section");
  const links = document.querySelectorAll(".nav-link");

  const openBtn = document.getElementById("open-token-section");
  const modal = document.getElementById("token-modal");
  const closeBtn = document.getElementById("close-token");
  const backBtn = document.getElementById("back-btn");
  const qrImage = document.getElementById("qr-image");
  const qrLink = document.getElementById("qr-link");

  // 📄 切換到指定 section
  function showSection(id) {
    sections.forEach(sec => {
      if (sec.id === id) {
        sec.classList.add("active");
      } else {
        sec.classList.remove("active");
      }
    });
  }

  // 📄 側邊欄或 header 上的切換按鈕
  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.getAttribute("data-target");
      showSection(target);
    });
  });

  // 📡 從後端產生 token
  async function fetchTokenAndShowQR() {
    const token = localStorage.getItem("token"); // 登入時存下來的token

    if (!token) {
      alert("請先登入");
      return;
    }

    try {
      const res = await fetch("https://api-vocalborn.r0930514.work/pairing/generate-token", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})  // 加上這行，傳空的 JSON 物件
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert(errorText);
        console.error("❌ 後端錯誤訊息:", errorText);
        throw new Error("後端產生 token 失敗");
      }
      

      const data = await res.json();

      // ⬇⬇⬇ 使用 qr_data 作為 QRCode 的內容
      const url = data.qr_data;

      const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      qrImage.src = qrSrc;
      qrLink.textContent = url;
      qrLink.href = url;
      qrLink.target = "_blank";

      modal.classList.remove("hidden");
    } catch (err) {
      alert("無法產生配對 QR Code，請稍後再試");
    }
  }

  // ✨ 點【建立配對】 => 打開 modal 並生成 QR
  openBtn.addEventListener("click", fetchTokenAndShowQR);

  // ✨ 關閉 modal 的幾種方式
  [closeBtn, backBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        modal.classList.add("hidden");
        clearQRCode();
      });
    }
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
      clearQRCode();
    }
  });

  // 📄 清空 QRCode
  function clearQRCode() {
    qrImage.src = "";
    qrLink.textContent = "";
    qrLink.href = "";
  }
});

//查看已配對病患資料
document.addEventListener("DOMContentLoaded", function () {
  const pairedCountElement = document.getElementById("paired-count");
    const viewPatBtn = document.getElementById("view-pat-btn");
    const patientListSection = document.getElementById("patient-list");
    const patientDetailSection = document.getElementById("patient-detail");
    const patientListContainer = patientListSection.querySelector(".widget-card");
    const backToHomeBtn = document.getElementById("back-to-home");
    const backToListBtn = document.getElementById("back-to-list");
    const backToHomeBtnn = document.getElementById("back-btn");

    // ✅ 綁定「查看紀錄」按鈕
    const viewLogBtn = document.getElementById("view-log-btn");
    const logDetailSection = document.getElementById("log-detail");

    const patientIdField = document.getElementById("patient-id");
    const patientNameField = document.getElementById("patient-name-field");
    const patientAgeField = document.getElementById("patient-age");
    const patientGenderField = document.getElementById("patient-gender");
    const patientDiagnosisField = document.getElementById("patient-diagnosis");
    const patientNotesField = document.getElementById("patient-notes");

    let patients = []; //病患人數
    

    // ✅ 切換顯示區塊（修正 active 類別問題）
    function showSection(sectionToShow) {
        document.querySelectorAll(".page-section").forEach(sec => {
            sec.classList.remove("active");
            sec.style.display = "none";
        });

        sectionToShow.classList.add("active");
        sectionToShow.style.display = "block";
    }

    // ✅ 點擊首頁的「查看病患」→ 進入病患列表
    fetchPatientList(); //先抓資料讀取已配對多少人（換成真資料後要改）
    viewPatBtn.addEventListener("click", async () => {
        showSection(patientListSection);
    });

    // ✅ 點擊首頁的「查看紀錄」→ 進入紀錄顯示頁面
    viewLogBtn.addEventListener("click", () => {
        showSection(logDetailSection);
        renderLogPatients(); // <-- 這是你要顯示「今日病患練習進度」的函數（下面會給）
    });

    // ✅ 從 API 抓取病患資料
    async function fetchPatientList() {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("https://api-vocalborn.r0930514.work/therapist/my-clients", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            
            if (response.ok) {
                patients = await response.json();
            }

            if (!patients || patients.length === 0) {
                patients = [
                    {
                        client_id: "TEST-001",
                        client_info: {
                            name: "（假資料）王小明",
                            age: 10,
                            gender: "男",
                            diagnosis: "語言發展遲緩",
                            notes: "這是測試假資料"
                        }
                    },
                    {
                        client_id: "TEST-002",
                        client_info: {
                            name: "（假資料）李小美",
                            age: 8,
                            gender: "女",
                            diagnosis: "構音障礙",
                            notes: "每週 2 次治療"
                        }
                    }
                ];
            }
            pairedCountElement.textContent = "目前配對："+patients.length+"位";
            renderPatientList(patients);
        } catch (error) {
            console.error("無法取得病患列表", error);
        }
        
    }

    //目前已配對幾位病患
    pairedCountElement.textContent = "目前配對："+(patients.length)+"位";

    // ✅ 渲染病患列表
    function renderPatientList(patients) {
        // 先清掉舊的卡片（保留返回按鈕）
        patientListContainer.querySelectorAll(".patient-card").forEach(card => card.remove());

        patients.forEach(item => {
            const client = item.client_info || {};
            const card = document.createElement("div");
            card.classList.add("patient-card");
            card.textContent = client.name || `病患 (${item.client_id})`;

            // ✅ 點擊卡片 → 顯示詳細資料
            card.addEventListener("click", () => showPatientDetail(item));
            patientListContainer.insertBefore(card, backToHomeBtn);
        });
    }

    // ✅ 顯示詳細資料
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

    // ✅ 返回按鈕
    backToHomeBtn.addEventListener("click", () => {
        showSection(document.getElementById("home"));
    });

    //病患練習進度的返回按鈕
    backToHomeBtnn.addEventListener("click", () => {
        showSection(document.getElementById("home"));
    });

    backToListBtn.addEventListener("click", () => {
        showSection(patientListSection);
    });

    // 預設顯示首頁
    showSection(document.getElementById("home"));
});
