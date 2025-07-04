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

document.addEventListener("DOMContentLoaded", function () {
  const patientList = document.getElementById("patientList");
  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const sendButton = document.getElementById("sendButton");

  const chats = {
    patient1: [],
    patient2: [],
    patient3: []
  };

  let currentPatient = "patient1";

  function renderMessages() {
    chatMessages.innerHTML = "";
    chats[currentPatient].forEach(({ text, time, sender }) => {
      const msg = document.createElement("div");
      msg.className = "message " + (sender === "user" ? "user-message" : "bot");
      msg.setAttribute("data-time", time);
      msg.textContent = text;
      chatMessages.appendChild(msg);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendMessage(text) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    chats[currentPatient].push({ text, time: timeString, sender: "user" });
    renderMessages();

    setTimeout(() => {
      chats[currentPatient].push({ text: "收到您的訊息:「" + text + "」", time: getTime(), sender: "bot" });
      renderMessages();
    }, 1000);
  }

  function getTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  sendButton.addEventListener("click", () => {
    const msg = chatInput.value.trim();
    if (msg) {
      sendMessage(msg);
      chatInput.value = "";
    }
  });

  chatInput.addEventListener("keypress", e => {
    if (e.key === "Enter" && chatInput.value.trim()) {
      sendButton.click();
    }
  });

  patientList.addEventListener("click", e => {
    const li = e.target.closest("li");
    if (!li) return;

    document.querySelectorAll("#patientList li").forEach(el => el.classList.remove("active"));
    li.classList.add("active");
    currentPatient = li.getAttribute("data-patient");
    renderMessages();
  });

  renderMessages();
});

const chatPatientNameEl = document.getElementById("chatPatientName");

// 選擇患者並載入對話訊息
async function selectPatient(patientId) {
  if (activePatientId === patientId) return;

  activePatientId = patientId;
  highlightActivePatient();

  // 找到患者物件，顯示名字
  const patient = patients.find(p => p.id == patientId);
  chatPatientNameEl.textContent = patient ? patient.name : "患者";

  chatMessagesEl.innerHTML = '<p style="color:#999; text-align:center;">載入中...</p>';

  // 從後端拉取該患者對話訊息
  const res = await fetch(`/api/chat?patientId=${patientId}`);
  const chatData = await res.json();

  renderChatMessages(chatData);
}

// 渲染訊息，記得帶 .from-me 或 .from-them 類別
function renderChatMessages(messages) {
  chatMessagesEl.innerHTML = '';

  messages.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(msg.from === 'me' ? 'from-me' : 'from-them');
    msgDiv.textContent = msg.content;

    // 可加時間
    const timeSpan = document.createElement('span');
    timeSpan.textContent = msg.time;
    timeSpan.style.fontSize = '0.75rem';
    timeSpan.style.color = '#999';
    timeSpan.style.marginLeft = '8px';

    msgDiv.appendChild(timeSpan);
    chatMessagesEl.appendChild(msgDiv);
  });

  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}
