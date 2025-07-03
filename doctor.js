document.getElementById('generate-token-btn').addEventListener('click', async () => {
  // 1. 向後端請求 token（模擬）
  const response = await fetch('/pairing/generate-token');
  const data = await response.json();
  const token = data.token; // 例如：abc123

  // 2. 顯示 QR Code
  const qrContainer = document.getElementById('qr-container');
  const qrImage = document.getElementById('qr-image');
  const qrLink = `https://你的前端網址/pair/${token}`;
  document.getElementById('qr-link').textContent = qrLink;

  // 使用套件生成 QR 圖
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrLink)}`;

  qrContainer.classList.remove('qr-hidden');
  qrContainer.classList.add('qr-visible');

  // 3. 等待配對成功（可透過輪詢）
  checkPairingStatus(token);
});

async function checkPairingStatus(token) {
  const statusText = document.getElementById('pair-status-text');

  const interval = setInterval(async () => {
    const res = await fetch(`/pairing/validate/${token}`);
    const result = await res.json();
    if (result.status === 'success') {
      statusText.textContent = '✅ 配對成功！';
      clearInterval(interval);
    } else if (result.status === 'expired') {
      statusText.textContent = '❌ Token 已過期，請重新產生';
      clearInterval(interval);
    } else {
      statusText.textContent = '等待病人配對中...';
    }
  }, 3000);
}

// 顯示配對 QR 區塊
  document.getElementById("open-token-section").addEventListener("click", () => {
    document.getElementById("token-section").classList.remove("qr-hidden");
    window.scrollTo({ top: document.getElementById("token-section").offsetTop - 60, behavior: "smooth" });
  });

  document.addEventListener("DOMContentLoaded", () => {
  const initialSection = document.getElementById("initial-section");
  const tokenSection = document.getElementById("token-section");
  const openTokenBtn = document.getElementById("open-token-section");
  const backBtn = document.getElementById("back-btn");
  const generateBtn = document.getElementById("generate-token-btn");
  const qrContainer = document.getElementById("qr-container");
  const qrImage = document.getElementById("qr-image");
  const qrLink = document.getElementById("qr-link");

  // 點擊「產生 QR Code」進入下一畫面
  openTokenBtn.addEventListener("click", () => {
    initialSection.classList.add("qr-hidden");
    tokenSection.classList.remove("qr-hidden");
    qrContainer.classList.add("qr-hidden"); // 一開始不顯示 QR Code
  });

  // 返回上一頁面
  backBtn.addEventListener("click", () => {
    tokenSection.classList.add("qr-hidden");
    initialSection.classList.remove("qr-hidden");
  });

  // 產生 QR Code 按鈕（範例：隨機 Token + 顯示 QR）
  generateBtn.addEventListener("click", () => {
    // 這裡假設生成一個隨機字串作為 Token
    const token = Math.random().toString(36).substring(2, 10);
    const url = `https://example.com/pair?token=${token}`;

    // 假設用 Google Chart API 產生 QR Code 圖片
    const qrSrc = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(url)}`;

    qrImage.src = qrSrc;
    qrLink.textContent = url;
    qrLink.href = url;
    qrLink.target = "_blank";

    qrContainer.classList.remove("qr-hidden");
  });
});
