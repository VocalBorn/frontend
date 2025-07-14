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