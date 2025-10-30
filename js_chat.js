/**
 * VocalBorn 聊天系統管理器
 * 負責 WebSocket 連線、訊息發送/接收、聊天室管理
 */

/**
 * 時區轉換工具函數
 * 將 API 回傳的無時區 UTC 時間標記為 UTC,讓瀏覽器自動轉換為本地時區
 */
function convertUTCToTaipei(utcTimestamp) {
  if (!utcTimestamp) return null;

  // 檢查時間字符串是否已包含時區信息
  const hasTimezone = utcTimestamp.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(utcTimestamp);

  if (hasTimezone) {
    // 如果已有時區標記,直接返回
    return utcTimestamp;
  } else {
    // 如果沒有時區標記,加上 'Z' 標記為 UTC 時間
    // 瀏覽器會自動將其轉換為本地時區進行顯示
    return utcTimestamp + 'Z';
  }
}

class ChatManager {
  constructor() {
    this.ws = null;
    this.currentRoomId = null;
    this.currentUserId = null;
    this.token = null;
    this.rooms = [];
    this.messages = [];
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.typingTimer = null;
    this.isConnected = false;
    this.isTyping = false;

    // 事件處理器
    this.eventHandlers = {
      onConnectionChange: null,
      onNewMessage: null,
      onMessageStatusUpdate: null,
      onTypingStatusChange: null,
      onRoomsUpdate: null,
      onError: null
    };
  }

  /**
   * 初始化聊天管理器
   * @param {string} token - JWT Token
   * @param {string} userId - 當前用戶 ID
   */
  async init(token, userId) {
    this.token = token;
    this.currentUserId = userId;

    try {
      // 載入聊天室列表
      await this.loadRooms();
      return true;
    } catch (error) {
      console.error('初始化聊天管理器失敗:', error);
      this._triggerError('初始化失敗: ' + error.message);
      return false;
    }
  }

  /**
   * 註冊事件處理器
   * @param {string} event - 事件名稱
   * @param {Function} handler - 處理函數
   */
  on(event, handler) {
    if (this.eventHandlers.hasOwnProperty('on' + event.charAt(0).toUpperCase() + event.slice(1))) {
      this.eventHandlers['on' + event.charAt(0).toUpperCase() + event.slice(1)] = handler;
    }
  }

  /**
   * 載入聊天室列表
   */
  async loadRooms() {
    try {
      const response = await fetch(CONFIG.getChatApiUrl('/rooms'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '載入聊天室列表失敗');
      }

      const data = await response.json();

      // 轉換聊天室時間欄位為台北時區
      this.rooms = (data.rooms || []).map(room => ({
        ...room,
        created_at: convertUTCToTaipei(room.created_at),
        updated_at: convertUTCToTaipei(room.updated_at),
        last_message_at: convertUTCToTaipei(room.last_message_at)
      }));

      // 觸發聊天室更新事件
      if (this.eventHandlers.onRoomsUpdate) {
        this.eventHandlers.onRoomsUpdate(this.rooms);
      }

      return this.rooms;
    } catch (error) {
      console.error('載入聊天室失敗:', error);
      throw error;
    }
  }

  /**
   * 建立或取得聊天室 (患者端使用)
   * @param {string} therapistId - 治療師 ID
   */
  async createRoom(therapistId) {
    try {
      const response = await fetch(CONFIG.getChatApiUrl('/rooms'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          therapist_id: therapistId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '建立聊天室失敗');
      }

      const room = await response.json();

      // 轉換聊天室時間欄位為台北時區
      const convertedRoom = {
        ...room,
        created_at: convertUTCToTaipei(room.created_at),
        updated_at: convertUTCToTaipei(room.updated_at),
        last_message_at: convertUTCToTaipei(room.last_message_at)
      };

      // 更新聊天室列表
      const existingIndex = this.rooms.findIndex(r => r.room_id === convertedRoom.room_id);
      if (existingIndex >= 0) {
        this.rooms[existingIndex] = convertedRoom;
      } else {
        this.rooms.unshift(convertedRoom);
      }

      // 觸發聊天室更新事件
      if (this.eventHandlers.onRoomsUpdate) {
        this.eventHandlers.onRoomsUpdate(this.rooms);
      }

      return convertedRoom;
    } catch (error) {
      console.error('建立聊天室失敗:', error);
      throw error;
    }
  }

  /**
   * 建立或取得聊天室 (治療師端使用)
   * @param {string} clientId - 患者 ID
   */
  async createRoomWithClient(clientId) {
    try {
      const response = await fetch(CONFIG.getChatApiUrl('/rooms'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '建立聊天室失敗');
      }

      const room = await response.json();

      // 轉換聊天室時間欄位為台北時區
      const convertedRoom = {
        ...room,
        created_at: convertUTCToTaipei(room.created_at),
        updated_at: convertUTCToTaipei(room.updated_at),
        last_message_at: convertUTCToTaipei(room.last_message_at)
      };

      // 更新聊天室列表
      const existingIndex = this.rooms.findIndex(r => r.room_id === convertedRoom.room_id);
      if (existingIndex >= 0) {
        this.rooms[existingIndex] = convertedRoom;
      } else {
        this.rooms.unshift(convertedRoom);
      }

      // 觸發聊天室更新事件
      if (this.eventHandlers.onRoomsUpdate) {
        this.eventHandlers.onRoomsUpdate(this.rooms);
      }

      return convertedRoom;
    } catch (error) {
      console.error('建立聊天室失敗:', error);
      throw error;
    }
  }

  /**
   * 連接到指定聊天室
   * @param {string} roomId - 聊天室 ID
   */
  async connectToRoom(roomId) {
    // 如果已連接到同一個聊天室，不重複連接
    if (this.currentRoomId === roomId && this.isConnected) {
      return;
    }

    // 如果已連接到其他聊天室，先斷開
    if (this.ws) {
      this.disconnect();
    }

    this.currentRoomId = roomId;

    try {
      // 載入聊天室歷史訊息
      await this.loadMessages(roomId);

      // 建立 WebSocket 連線
      this._connectWebSocket(roomId);
    } catch (error) {
      console.error('連接聊天室失敗:', error);
      this._triggerError('連接聊天室失敗: ' + error.message);
    }
  }

  /**
   * 載入聊天室訊息歷史
   * @param {string} roomId - 聊天室 ID
   * @param {number} limit - 訊息數量限制
   * @param {number} offset - 偏移量
   */
  async loadMessages(roomId, limit = CONFIG.CHAT.MESSAGE_LIMIT, offset = 0) {
    try {
      const url = CONFIG.getChatApiUrl(`/rooms/${roomId}/messages?limit=${limit}&offset=${offset}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '載入訊息失敗');
      }

      const data = await response.json();

      // 轉換訊息時間欄位為台北時區
      const convertedMessages = (data.messages || []).map(msg => ({
        ...msg,
        created_at: convertUTCToTaipei(msg.created_at),
        updated_at: convertUTCToTaipei(msg.updated_at),
        delivered_at: convertUTCToTaipei(msg.delivered_at),
        read_at: convertUTCToTaipei(msg.read_at)
      }));

      // 如果是初次載入，直接設定訊息
      if (offset === 0) {
        this.messages = convertedMessages;
      } else {
        // 如果是載入更多，加到前面
        this.messages = [...convertedMessages, ...this.messages];
      }

      return {
        messages: convertedMessages,
        hasMore: data.has_more || false,
        totalCount: data.total_count || 0
      };
    } catch (error) {
      console.error('載入訊息失敗:', error);
      throw error;
    }
  }

  /**
   * 建立 WebSocket 連線
   * @private
   */
  _connectWebSocket(roomId) {
    const wsUrl = CONFIG.getChatWsUrl(roomId, this.token);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket 連線已建立');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // 清除重連計時器
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // 觸發連線狀態變更事件
        if (this.eventHandlers.onConnectionChange) {
          this.eventHandlers.onConnectionChange(true);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._handleWebSocketMessage(data);
        } catch (error) {
          console.error('處理 WebSocket 訊息失敗:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket 錯誤:', error);
        this._triggerError('連線錯誤，請檢查網路狀態');
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket 連線已關閉:', event.code, event.reason);
        this.isConnected = false;

        // 觸發連線狀態變更事件
        if (this.eventHandlers.onConnectionChange) {
          this.eventHandlers.onConnectionChange(false);
        }

        // 如果不是正常關閉（code 1000），嘗試重連
        if (event.code !== 1000 && this.currentRoomId) {
          this._reconnect();
        }
      };
    } catch (error) {
      console.error('建立 WebSocket 連線失敗:', error);
      this._triggerError('建立連線失敗');
    }
  }

  /**
   * 處理 WebSocket 訊息
   * @private
   */
  _handleWebSocketMessage(data) {
    switch (data.type) {
      case 'connection_ack':
        console.log('連線確認:', data.message);
        break;

      case 'new_message':
        this._handleNewMessage(data.message);
        break;

      case 'message_delivered':
        this._handleMessageDelivered(data.message_id, data.delivered_at);
        break;

      case 'message_read':
        this._handleMessageRead(data.message_ids, data.read_at);
        break;

      case 'user_typing':
        this._handleUserTyping(true, data.user_name);
        break;

      case 'user_stop_typing':
        this._handleUserTyping(false, data.user_name);
        break;

      case 'error':
        console.error('WebSocket 錯誤:', data.message);
        this._triggerError(data.message);
        break;

      default:
        console.warn('未知的 WebSocket 訊息類型:', data.type);
    }
  }

  /**
   * 處理新訊息
   * @private
   */
  _handleNewMessage(message) {
    // 避免重複訊息
    const existingIndex = this.messages.findIndex(m => m.message_id === message.message_id);
    if (existingIndex >= 0) {
      return;
    }

    // 轉換訊息時間欄位為台北時區
    const convertedMessage = {
      ...message,
      created_at: convertUTCToTaipei(message.created_at),
      updated_at: convertUTCToTaipei(message.updated_at),
      delivered_at: convertUTCToTaipei(message.delivered_at),
      read_at: convertUTCToTaipei(message.read_at)
    };

    // 將新訊息加入列表
    this.messages.push(convertedMessage);

    // 觸發新訊息事件
    if (this.eventHandlers.onNewMessage) {
      this.eventHandlers.onNewMessage(convertedMessage);
    }

    // 如果不是自己發送的訊息，自動標記為已讀
    if (convertedMessage.sender_id !== this.currentUserId) {
      this.markAsRead([convertedMessage.message_id]);
    }

    // 更新聊天室列表中的最後訊息時間
    this._updateRoomLastMessage(convertedMessage);
  }

  /**
   * 處理訊息已送達
   * @private
   */
  _handleMessageDelivered(messageId, deliveredAt) {
    const message = this.messages.find(m => m.message_id === messageId);
    if (message) {
      message.status = 'delivered';
      // 轉換時間為台北時區
      message.delivered_at = convertUTCToTaipei(deliveredAt);

      // 觸發訊息狀態更新事件
      if (this.eventHandlers.onMessageStatusUpdate) {
        this.eventHandlers.onMessageStatusUpdate(messageId, 'delivered', message.delivered_at);
      }
    }
  }

  /**
   * 處理訊息已讀
   * @private
   */
  _handleMessageRead(messageIds, readAt) {
    // 轉換時間為台北時區
    const convertedReadAt = convertUTCToTaipei(readAt);

    messageIds.forEach(messageId => {
      const message = this.messages.find(m => m.message_id === messageId);
      if (message) {
        message.status = 'read';
        message.read_at = convertedReadAt;

        // 觸發訊息狀態更新事件
        if (this.eventHandlers.onMessageStatusUpdate) {
          this.eventHandlers.onMessageStatusUpdate(messageId, 'read', convertedReadAt);
        }
      }
    });
  }

  /**
   * 處理輸入狀態
   * @private
   */
  _handleUserTyping(isTyping, userName) {
    this.isTyping = isTyping;

    // 觸發輸入狀態變更事件
    if (this.eventHandlers.onTypingStatusChange) {
      this.eventHandlers.onTypingStatusChange(isTyping, userName);
    }
  }

  /**
   * 更新聊天室最後訊息
   * @private
   */
  _updateRoomLastMessage(message) {
    const room = this.rooms.find(r => r.room_id === message.room_id);
    if (room) {
      room.last_message_at = message.created_at;
      room.updated_at = message.created_at;

      // 如果訊息不是自己發送的，增加未讀數
      if (message.sender_id !== this.currentUserId) {
        room.unread_count = (room.unread_count || 0) + 1;
      }

      // 觸發聊天室更新事件
      if (this.eventHandlers.onRoomsUpdate) {
        this.eventHandlers.onRoomsUpdate(this.rooms);
      }
    }
  }

  /**
   * 發送訊息
   * @param {string} content - 訊息內容
   * @param {string} messageType - 訊息類型 (text/image/audio/file)
   */
  sendMessage(content, messageType = 'text') {
    if (!this.ws || !this.isConnected) {
      this._triggerError('未連接到聊天室');
      return false;
    }

    if (!content.trim()) {
      return false;
    }

    try {
      // 發送訊息到 WebSocket
      this.ws.send(JSON.stringify({
        type: 'send_message',
        content: content,
        message_type: messageType
      }));

      // 停止輸入狀態
      this.stopTyping();

      // 樂觀更新：立即在 UI 顯示訊息
      const tempMessage = {
        message_id: `temp-${Date.now()}`,
        room_id: this.currentRoomId,
        sender_id: this.currentUserId,
        sender_name: '我',
        content: content,
        message_type: messageType,
        status: 'sent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        delivered_at: null,
        read_at: null,
        file_url: null,
        file_size: null,
        file_name: null,
        is_deleted: false,
        _isOptimistic: true // 標記為樂觀更新
      };

      this.messages.push(tempMessage);

      // 觸發新訊息事件
      if (this.eventHandlers.onNewMessage) {
        this.eventHandlers.onNewMessage(tempMessage);
      }

      return true;
    } catch (error) {
      console.error('發送訊息失敗:', error);
      this._triggerError('發送訊息失敗');
      return false;
    }
  }

  /**
   * 標記訊息為已讀
   * @param {Array<string>} messageIds - 訊息 ID 陣列
   */
  markAsRead(messageIds) {
    if (!this.ws || !this.isConnected || !messageIds || messageIds.length === 0) {
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'mark_as_read',
        message_ids: messageIds
      }));

      // 更新本地聊天室未讀數
      const room = this.rooms.find(r => r.room_id === this.currentRoomId);
      if (room) {
        room.unread_count = Math.max(0, (room.unread_count || 0) - messageIds.length);

        // 觸發聊天室更新事件
        if (this.eventHandlers.onRoomsUpdate) {
          this.eventHandlers.onRoomsUpdate(this.rooms);
        }
      }
    } catch (error) {
      console.error('標記已讀失敗:', error);
    }
  }

  /**
   * 開始輸入
   */
  startTyping() {
    if (!this.ws || !this.isConnected) {
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'typing_start'
      }));

      // 清除之前的計時器
      if (this.typingTimer) {
        clearTimeout(this.typingTimer);
      }

      // 設定自動停止輸入計時器
      this.typingTimer = setTimeout(() => {
        this.stopTyping();
      }, CONFIG.CHAT.TYPING_TIMEOUT);
    } catch (error) {
      console.error('發送輸入狀態失敗:', error);
    }
  }

  /**
   * 停止輸入
   */
  stopTyping() {
    if (!this.ws || !this.isConnected) {
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'typing_stop'
      }));

      // 清除計時器
      if (this.typingTimer) {
        clearTimeout(this.typingTimer);
        this.typingTimer = null;
      }
    } catch (error) {
      console.error('發送停止輸入狀態失敗:', error);
    }
  }

  /**
   * 重新連線
   * @private
   */
  _reconnect() {
    if (this.reconnectAttempts >= CONFIG.CHAT.RECONNECT_MAX_ATTEMPTS) {
      console.error('達到最大重連次數，停止重連');
      this._triggerError('無法連線至伺服器，請重新整理頁面');
      return;
    }

    this.reconnectAttempts++;

    // 計算延遲時間（指數退避）
    const delay = Math.min(
      CONFIG.CHAT.RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts),
      CONFIG.CHAT.RECONNECT_MAX_DELAY
    );

    console.log(`嘗試重新連線... (第 ${this.reconnectAttempts} 次，延遲 ${delay}ms)`);

    this.reconnectTimer = setTimeout(() => {
      if (this.currentRoomId) {
        this._connectWebSocket(this.currentRoomId);
      }
    }, delay);
  }

  /**
   * 斷開連線
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, '正常關閉');
      this.ws = null;
    }

    this.isConnected = false;
    this.currentRoomId = null;

    // 清除計時器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
  }

  /**
   * 觸發錯誤事件
   * @private
   */
  _triggerError(message) {
    if (this.eventHandlers.onError) {
      this.eventHandlers.onError(message);
    }
  }

  /**
   * 取得當前聊天室資訊
   */
  getCurrentRoom() {
    return this.rooms.find(r => r.room_id === this.currentRoomId);
  }

  /**
   * 取得當前訊息列表
   */
  getMessages() {
    return this.messages;
  }

  /**
   * 取得聊天室列表
   */
  getRooms() {
    return this.rooms;
  }

  /**
   * 清理資源
   */
  destroy() {
    this.disconnect();
    this.rooms = [];
    this.messages = [];
    this.eventHandlers = {};
  }
}

// 導出 ChatManager 類別
// Node.js 環境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatManager;
}

// 瀏覽器環境 - 將 ChatManager 掛載到 window 全局對象
if (typeof window !== 'undefined') {
  window.ChatManager = ChatManager;
  console.log('✅ ChatManager 已載入並掛載到全局作用域');
}
