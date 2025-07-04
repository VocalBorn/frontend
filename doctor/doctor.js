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

  // 🔗 建立配對 - 產生 Token
  function generateToken() {
    return Math.random().toString(36).substring(2, 10);
  }

  // 📄 顯示 QRCode
  function showQRCode(token) {
    const url = `https://example.com/pair?token=${token}`; // ⬅ 改成你後端的配對URL
    const qrSrc = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(url)}`;

    qrImage.src = qrSrc;
    qrLink.textContent = url;
    qrLink.href = url;
    qrLink.target = "_blank";
  }

  // ✨ 點【建立配對】 => 打開 modal 並生成 QR
  openBtn.addEventListener("click", () => {
    const token = generateToken();
    showQRCode(token);
    modal.classList.remove("hidden");
  });

  // ✨ 關閉 modal 的幾種方式
  [closeBtn, backBtn].forEach(btn => {
    btn.addEventListener("click", () => {
      modal.classList.add("hidden");
      clearQRCode();
    });
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
