/**
 * VocalBorn API 配置檔案
 * 集中管理所有 API 端點和 WebSocket URL
 */

const GLOBAL_ENV =
  (typeof window !== 'undefined' && window.__ENV__) ||
  (typeof globalThis !== 'undefined' && globalThis.__ENV__) ||
  {};

const PROCESS_ENV =
  (typeof process !== 'undefined' && process.env) ? process.env : {};

const INJECTED_ENV = {
  ENV: GLOBAL_ENV.APP_ENV || PROCESS_ENV.APP_ENV || PROCESS_ENV.NODE_ENV || 'production',
  API_BASE_URL: GLOBAL_ENV.API_BASE_URL || PROCESS_ENV.API_BASE_URL || PROCESS_ENV.VITE_API_BASE_URL || '',
  WS_URL: GLOBAL_ENV.WS_URL || PROCESS_ENV.WS_URL || PROCESS_ENV.VITE_WS_URL || ''
};

const DEFAULT_PROD_API_BASE_URL =
  (typeof window !== 'undefined')
    ? `${window.location.origin}/api`
    : 'http://localhost:8000/api';

const DEFAULT_PROD_WS_URL =
  (typeof window !== 'undefined')
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api`
    : 'ws://localhost:8000/api';

const DEFAULT_DEV_API_BASE_URL = 'http://localhost:8000/api';
const DEFAULT_DEV_WS_URL = 'ws://localhost:8000/api';

const CONFIG = {
  // 環境配置 (可切換為 'development' 或 'production')
  ENV: INJECTED_ENV.ENV,

  // API 配置
  API: {
    // 生產環境
    production: {
      BASE_URL: DEFAULT_PROD_API_BASE_URL,
      WS_URL: DEFAULT_PROD_WS_URL
    },
    // 開發環境
    development: {
      BASE_URL: DEFAULT_DEV_API_BASE_URL,
      WS_URL: DEFAULT_DEV_WS_URL
    }
  },

  // 聊天系統配置
  CHAT: {
    MESSAGE_LIMIT: 50,              // 每次載入的訊息數量
    TYPING_TIMEOUT: 3000,           // 輸入狀態超時 (毫秒)
    RECONNECT_MAX_ATTEMPTS: 5,      // WebSocket 最大重連次數
    RECONNECT_BASE_DELAY: 1000,     // 重連基礎延遲 (毫秒)
    RECONNECT_MAX_DELAY: 30000,     // 重連最大延遲 (毫秒)
    TOKEN_REFRESH_INTERVAL: 1800000 // Token 刷新間隔 (30分鐘)
  },

  /**
   * 取得當前環境的 API Base URL
   * @returns {string} API Base URL
   */
  getApiBaseUrl() {
    if (INJECTED_ENV.API_BASE_URL) {
      return INJECTED_ENV.API_BASE_URL;
    }
    return (this.API[this.ENV] || this.API.production).BASE_URL;
  },

  /**
   * 取得當前環境的 WebSocket URL
   * @returns {string} WebSocket URL
   */
  getWsUrl() {
    if (INJECTED_ENV.WS_URL) {
      return INJECTED_ENV.WS_URL;
    }
    return (this.API[this.ENV] || this.API.production).WS_URL;
  },

  /**
   * 取得聊天 REST API 完整 URL
   * @param {string} endpoint - API 端點路徑 (例如: '/rooms', '/rooms/123/messages')
   * @returns {string} 完整 API URL
   */
  getChatApiUrl(endpoint) {
    return `${this.getApiBaseUrl()}/chat${endpoint}`;
  },

  /**
   * 取得 WebSocket 連線 URL
   * @param {string} roomId - 聊天室 ID
   * @param {string} token - JWT Token
   * @returns {string} WebSocket 連線 URL
   */
  getChatWsUrl(roomId, token) {
    return `${this.getWsUrl()}/chat/ws/${roomId}?token=${token}`;
  },

  /**
   * 取得通用 API URL
   * @param {string} endpoint - API 端點路徑
   * @returns {string} 完整 API URL
   */
  getApiUrl(endpoint) {
    return `${this.getApiBaseUrl()}${endpoint}`;
  }
};

// 導出配置對象
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
