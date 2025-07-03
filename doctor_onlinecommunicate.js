document.addEventListener("DOMContentLoaded", () => {
  const dashboard = document.querySelector(".therapist-dashboard");
  const mainPages = document.querySelectorAll(".main-content-page");
  const navLinks = document.querySelectorAll(".nav-link");

  function showPage(targetId) {
    dashboard.style.display = "none";
    mainPages.forEach(p => {
      p.style.display = "none";
      p.classList.remove("active");
    });

    if (targetId === "home") {
      dashboard.style.display = "block";
    } else {
      const targetPage = document.getElementById(targetId);
      if (targetPage) {
        targetPage.style.display = "block";
        targetPage.classList.add("active");
      }
    }
  }

  showPage("home");

  navLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.getAttribute("data-target");
      showPage(target);
    });
  });
});


// 溝通頁面功能
document.addEventListener("DOMContentLoaded", function() {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatMessages = document.getElementById("chatMessages");

    // 發送訊息的函數
    function sendMessage(message) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", "user-message");

        // 設定時間為 data-time 屬性（供 CSS 顯示）
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageElement.setAttribute("data-time", timeString);

        // 設定訊息內容
        const messageText = document.createElement("span");
        messageText.textContent = message;
        messageElement.appendChild(messageText);

        // 將訊息加入畫面
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 發送按鈕事件
    sendButton.addEventListener("click", function() {
        const userMessage = chatInput.value.trim();

        if (userMessage) {
            sendMessage(userMessage);
            chatInput.value = ""; // 清空輸入框
        }
    });

    // 按下 Enter 發送訊息
    chatInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter" && chatInput.value.trim() !== "") {
            sendButton.click();
        }
    });
});
