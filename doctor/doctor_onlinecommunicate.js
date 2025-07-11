document.addEventListener("DOMContentLoaded", function () {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatMessages = document.getElementById("chatMessages");

    // 生成時間字串
    function getTimeString() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // 建立訊息元素
    function createMessage(message, type = "user") {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");
        if (type === "user") {
            messageElement.classList.add("user-message");
        } else {
            messageElement.classList.add("bot");
        }

        messageElement.setAttribute("data-time", getTimeString());
        const messageText = document.createElement("span");
        messageText.textContent = message;
        messageElement.appendChild(messageText);

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 發送按鈕
    sendButton.addEventListener("click", function () {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        createMessage(userMessage, "user");
        chatInput.value = "";

        // 模擬醫生回覆
        setTimeout(() => {
            createMessage("收到您的訊息：「" + userMessage + "」", "bot");
        }, 1000);
    });

    // Enter 也能送出
    chatInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter" && chatInput.value.trim() !== "") {
            sendButton.click();
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const patients = document.querySelectorAll(".patient");
  const chatMessages = document.getElementById("chatMessages");

  function renderChat(patientName) {
    chatMessages.innerHTML = ""; // 清空舊訊息
    const msgs = chats[patientName] || [];
    msgs.forEach(({ from, text, time }) => {
      const div = document.createElement("div");
      div.classList.add("message");
      if (from === "me") {
        div.classList.add("from-me");
      } else {
        div.classList.add("bot");
      }
      div.setAttribute("data-time", time);
      div.textContent = text;
      chatMessages.appendChild(div);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight; // 滾到最底
  }

  patients.forEach(patient => {
    patient.addEventListener("click", () => {
      // 取消所有病患的 active
      patients.forEach(p => p.classList.remove("active-patient"));
      // 點擊的加上 active
      patient.classList.add("active-patient");

      // 讀病患名稱並顯示對話
      const name = patient.querySelector("p").textContent.trim();
      renderChat(name);
    });
  });
});x  

