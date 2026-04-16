/**
 * 醫生端聊天系統
 * 用於初始化和管理與病患的即時通訊
 */

// 全局變數
let chatManager = null;
let currentChatUserId = null;
let chatSystemInitializing = false;
let chatUIEventsSetup = false;
let patients = []; // 已配對的病患列表

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
        // 取得當前用戶 ID (從 token 或 API)
        const userProfile = await fetchUserProfile();
        if (!userProfile || !userProfile.user_id) {
            console.error('無法取得用戶資料');
            chatSystemInitializing = false;
            return;
        }

        currentChatUserId = userProfile.user_id;
        console.log('🆔 當前用戶 ID:', currentChatUserId);
        console.log('🆔 完整用戶資料:', userProfile);

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

// 取得用戶資料
async function fetchUserProfile() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(CONFIG.getApiUrl('/user/profile'), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('取得用戶資料失敗');
        }

        return await response.json();
    } catch (error) {
        console.error('取得用戶資料失敗:', error);
        return null;
    }
}

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

// 醫生端：獲取已配對的病患列表
async function fetchPairedPatients() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error('未找到 token，無法獲取已配對病患');
        return [];
    }

    try {
        const response = await fetch(CONFIG.getApiUrl("/therapist/my-clients"), {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            patients = data || [];
            console.log('已獲取配對病患列表:', patients);
            return patients;
        } else {
            console.error('獲取配對病患失敗:', response.statusText);
            return [];
        }
    } catch (error) {
        console.error('無法取得病患列表', error);
        return [];
    }
}

// 處理聊天室更新
async function handleRoomsUpdate(rooms) {
    // 整合病患列表和聊天室列表
    await fetchPairedPatients();
    const mergedList = await mergePairedPatientsWithRooms(rooms, patients);
    renderRoomsList(mergedList);
}

// 合併已配對病患和聊天室列表
async function mergePairedPatientsWithRooms(rooms, patientsList) {
    if (!patientsList || patientsList.length === 0) {
        // 如果沒有病患資料，只返回聊天室列表（標記為已有聊天室）
        return rooms.map(room => ({
            ...room,
            hasRoom: true
        }));
    }

    const mergedList = [];
    const processedRoomPatientIds = new Set();

    // 先處理已有聊天室的病患
    rooms.forEach(room => {
        mergedList.push({
            ...room,
            hasRoom: true,
            client_id: room.client_id,
            client_name: room.client_name
        });
        if (room.client_id) {
            processedRoomPatientIds.add(room.client_id);
        }
    });

    // 再處理已配對但未建立聊天室的病患
    patientsList.forEach(patient => {
        const clientId = patient.client_id;
        const clientInfo = patient.client_info || {};
        if (!processedRoomPatientIds.has(clientId)) {
            mergedList.push({
                client_id: clientId,
                client_name: clientInfo.name || `病患 ${clientId}`,
                hasRoom: false,
                // 保留原始資料以供使用
                rawPatientData: patient
            });
        }
    });

    return mergedList;
}

// 處理錯誤
function handleChatError(message) {
    console.error('聊天錯誤:', message);
    alert(message);
}

// 渲染聊天室列表（混合顯示已有聊天室和已配對病患）
function renderRoomsList(mergedList) {
    const roomsList = document.getElementById("chatRoomsList");
    if (!roomsList) return;

    if (mergedList.length === 0) {
        roomsList.innerHTML = `
            <div class="chat-rooms-empty">
                <i class="fas fa-inbox"></i>
                <p>目前沒有配對病患</p>
            </div>
        `;
        return;
    }

    roomsList.innerHTML = mergedList.map(item => {
        const patientName = item.client_name || '未知病患';

        if (item.hasRoom) {
            // 已有聊天室的病患
            const lastMessageTime = item.last_message_at ? formatTime(item.last_message_at) : '';
            const unreadBadge = item.unread_count > 0 ? `<span class="unread-badge">${item.unread_count}</span>` : '';

            return `
                <div class="chat-room-item ${chatManager && chatManager.currentRoomId === item.room_id ? 'active' : ''}"
                     data-room-id="${item.room_id}"
                     onclick="selectChatRoom('${item.room_id}')">
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
        } else {
            // 已配對但未建立聊天室的病患
            return `
                <div class="chat-room-item paired-only"
                     data-client-id="${item.client_id}">
                    <div class="room-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="room-info">
                        <div class="room-name">${patientName}</div>
                    </div>
                    <button class="start-chat-btn" onclick="handleCreateRoomWithPatient('${item.client_id}'); event.stopPropagation();">開始對話</button>
                </div>
            `;
        }
    }).join('');
}

// 醫生端：建立與病患的聊天室
async function handleCreateRoomWithPatient(clientId) {
    if (!chatManager) {
        alert('聊天系統尚未初始化');
        return;
    }

    try {
        console.log(`開始建立與病患 ${clientId} 的聊天室...`);
        const room = await chatManager.createRoomWithClient(clientId);
        console.log('聊天室建立成功:', room);

        // 自動選擇新建立的聊天室
        if (room && room.room_id) {
            await selectChatRoom(room.room_id);
        }
    } catch (error) {
        console.error('建立聊天室失敗:', error);
        alert('建立聊天室失敗，請稍後再試');
    }
}

// 選擇聊天室
async function selectChatRoom(roomId) {
    if (!chatManager) {
        console.error('chatManager 未初始化');
        return;
    }

    try {
        console.log('選擇聊天室:', roomId);

        // 連接到聊天室
        await chatManager.connectToRoom(roomId);

        // 更新 UI
        const chatEmptyState = document.getElementById("chatEmptyState");
        const chatActiveContainer = document.getElementById("chatActiveContainer");

        if (chatEmptyState) chatEmptyState.style.display = 'none';
        if (chatActiveContainer) chatActiveContainer.style.display = 'flex';

        // 更新聊天室標題
        const room = chatManager.getCurrentRoom();
        const chatRoomName = document.getElementById("chatRoomName");
        if (chatRoomName && room) {
            chatRoomName.textContent = room.client_name || '未知病患';
        }

        // 渲染訊息
        renderMessages(chatManager.getMessages());

        // 檢查是否有更多訊息
        const loadMoreContainer = document.getElementById("loadMoreContainer");
        if (loadMoreContainer) {
            loadMoreContainer.style.display = chatManager.getMessages().length >= CONFIG.CHAT.MESSAGE_LIMIT ? 'block' : 'none';
        }

        // 更新聊天室列表選中狀態
        document.querySelectorAll('.chat-room-item').forEach(item => {
            item.classList.toggle('active', item.dataset.roomId === roomId);
        });
    } catch (error) {
        console.error('選擇聊天室失敗:', error);
        alert('載入聊天室失敗');
    }
}

// 渲染所有訊息
function renderMessages(messages) {
    const messagesContainer = document.getElementById("chatMessages");
    if (!messagesContainer) return;

    messagesContainer.innerHTML = messages.map(message => renderMessageHTML(message)).join('');
    scrollToBottom();
}

// 渲染單條訊息
function renderMessage(message) {
    const messagesContainer = document.getElementById("chatMessages");
    if (!messagesContainer) return;

    // 檢查訊息是否已存在（避免重複）
    if (document.querySelector(`[data-message-id="${message.message_id}"]`)) {
        return;
    }

    messagesContainer.insertAdjacentHTML('beforeend', renderMessageHTML(message));
}

// 生成訊息 HTML
function renderMessageHTML(message) {
    const isSent = message.sender_id === currentChatUserId;
    const messageClass = isSent ? 'message-sent' : 'message-received';
    const statusIcon = isSent ? getStatusIcon(message.status) : '';
    const time = formatTime(message.created_at);

    return `
        <div class="chat-message ${messageClass}" data-message-id="${message.message_id}">
            <div class="message-bubble">
                <div class="message-content">${escapeHtml(message.content)}</div>
                <div class="message-meta">
                    <span class="message-time">${time}</span>
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
            return '<i class="fas fa-check-double" style="color: #4a90e2;"></i>';
        default:
            return '';
    }
}

// 格式化時間
function formatTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // 如果是今天
    if (diff < 86400000 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // 如果是昨天
    if (diff < 172800000 && date.getDate() === now.getDate() - 1) {
        return '昨天 ' + date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // 其他
    return date.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }) + ' ' +
           date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// HTML 轉義
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 滾動到底部
function scrollToBottom() {
    const messagesContainer = document.getElementById("chatMessagesContainer");
    if (messagesContainer) {
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }
}

// 播放通知音效
function playNotificationSound() {
    // 可選：播放音效
    // const audio = new Audio('/sounds/notification.mp3');
    // audio.play().catch(err => console.log('無法播放通知音效:', err));
}

// 當切換到線上溝通頁面時，初始化聊天系統
document.addEventListener('DOMContentLoaded', () => {
    // 監聽導航連結點擊
    const instantMessagingLink = document.querySelector('[data-target="instant-messaging"]');
    if (instantMessagingLink) {
        instantMessagingLink.addEventListener('click', () => {
            console.log('切換到線上溝通頁面，開始初始化聊天系統...');
            // 延遲一點以確保頁面已切換
            setTimeout(() => {
                initChatSystem();
            }, 100);
        });
    }
});
