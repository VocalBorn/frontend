
// 日誌工具，加入時間戳以便除錯
const log = (message, level = 'info') => {
    const timestamp = new Date().toISOString();
    console[level](`[語聲聚來] [${timestamp}] ${message}`);
};

log('scripts.js 開始執行');

// 單一 DOMContentLoaded 事件監聽器，避免重複
document.addEventListener('DOMContentLoaded', () => {
    // 初始化姓名顯示
    const registeredUser = localStorage.getItem('registeredUser');
    let currentUsername = '這裡是使用者的名字'; // 預設姓名
    if (registeredUser) {
        try {
            const user = JSON.parse(registeredUser);
            currentUsername = user.username || user.account || currentUsername;
        } catch (error) {
            log('解析用戶資料時出錯: ' + error, 'error');
        }
    }

    // 更新姓名顯示，檢查元素是否存在
    const usernameElements = {
        'welcome-username': document.getElementById('welcome-username'),
        'settings-username': document.getElementById('settings-username'),
        'profile-username': document.getElementById('profile-username')
    };
    Object.entries(usernameElements).forEach(([id, element]) => {
        if (element) {
            element.textContent = currentUsername;
        } else {
            log(`找不到 ID 為 ${id} 的元素，無法更新姓名`, 'warn');
        }
    });

    // 初始化姓名編輯輸入框
    const nameInput = document.getElementById('nameInput');
    if (nameInput) {
        nameInput.value = currentUsername;
    }
    // 初始化今日學習進度條（例如：60% 完成）
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
    // ✅ 這裡可根據實際數據換算百分比，例如：
    const completed = 3; // 假設今天已完成 3 次
    const target = 5;    // 今日目標 5 次
    const percent = Math.min((completed / target) * 100, 100);
    progressFill.style.width = percent + '%';
    log(`已設定進度條寬度為 ${percent.toFixed(1)}%`);
}

    // === 登入/註冊處理 ===
    const loginPage = document.getElementById('login');
    const registerPage = document.getElementById('register');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const registerForm = document.getElementById('registerForm');
    const main = document.getElementById('main');
    const loginForm = document.getElementById('loginForm');

    if (loginPage && registerPage && main) {
        // 初始化頁面可見性
        registerPage.style.display = 'none';
        main.style.display = 'none';

        // 顯示註冊頁面
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (event) => {
                event.preventDefault();
                loginPage.style.display = 'none';
                registerPage.style.display = 'block';
                log('顯示註冊頁面');
            });
        }

        // 顯示登入頁面
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (event) => {
                event.preventDefault();
                registerPage.style.display = 'none';
                loginPage.style.display = 'block';
                log('顯示登入頁面');
            });
        }

        // 登入表單提交
        if (loginForm) {
            loginForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const account = document.getElementById('loginAccount')?.value?.trim();
                const password = document.getElementById('loginPassword')?.value?.trim();

                if (!account || !password) {
                    showMessage('請輸入帳號和密碼');
                    return;
                }

                const registeredUser = localStorage.getItem('registeredUser');
                if (registeredUser) {
                    try {
                        const user = JSON.parse(registeredUser);
                        if (user.account === account && user.password === password) {
                            loginPage.style.display = 'none';
                            main.style.display = 'block';
                            log('登入成功');
                            switchPage('home');
                            // 更新姓名顯示
                            const currentUsername = user.username || user.account || '這裡是使用者的名字';
                            Object.entries(usernameElements).forEach(([id, element]) => {
                                if (element) {
                                    element.textContent = currentUsername;
                                }
                            });
                            // 更新姓名編輯輸入框
                            if (nameInput) {
                                nameInput.value = currentUsername;
                            }
                        } else {
                            showMessage('帳號或密碼錯誤');
                        }
                    } catch (error) {
                        showMessage('無效的用戶資料');
                        log('解析用戶資料時出錯: ' + error, 'error');
                    }
                } else {
                    showMessage('請先註冊帳號');
                }
            });
        }

        // 註冊表單提交
        if (registerForm) {
            registerForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const account = document.getElementById('registerAccount')?.value?.trim();
                const password = document.getElementById('registerPassword')?.value?.trim();
                const usernameInput = document.getElementById('registerUsername');
                const username = usernameInput ? usernameInput.value.trim() : '';

                if (!account || !password) {
                    showMessage('請輸入帳號和密碼');
                    return;
                }

                // 基本驗證（可根據需要擴展）
                if (account.length < 3 || password.length < 6) {
                    showMessage('帳號需至少3個字元，密碼需至少6個字元');
                    return;
                }

                // 如果有姓名輸入框且為必填，檢查是否為空
                if (usernameInput && usernameInput.hasAttribute('required') && !username) {
                    showMessage('請輸入姓名');
                    return;
                }

                // 儲存帳號、密碼和姓名
                const user = { account, password, username };
                localStorage.setItem('registeredUser', JSON.stringify(user));
                showMessage('註冊成功，請登入！');
                registerPage.style.display = 'none';
                loginPage.style.display = 'block';
                log('註冊成功');
            });
        }
        // 切換「我是患者 / 我是治療師」角色按鈕功能
         const tabButtons = document.querySelectorAll('.tab-btn');
            const roleInput = document.getElementById('userRole');

            if (!tabButtons.length || !roleInput) {
                console.warn("按鈕或隱藏欄位抓不到！");
                return;
            }

            tabButtons.forEach(btn => {
                btn.addEventListener('click', function () {
                tabButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                roleInput.value = this.dataset.role;
                console.log("已選擇身份為：" + roleInput.value);
                });
            });

        // 密碼顯示/隱藏切換
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const input = toggle.parentElement.querySelector('input');
                if (input) {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);
                    toggle.classList.toggle('fa-eye');
                    toggle.classList.toggle('fa-eye-slash');
                }
            });
        });

        // 忘記密碼連結
        const forgotPassword = document.getElementById('forgotPassword');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', (e) => {
                e.preventDefault();
                showMessage('密碼重置功能即將推出');
            });
        }
        } else {
            log('未找到登入/註冊頁面，跳過相關邏輯', 'warn');
        }
});

    // === 導航 ===
    let chartInstance = null;
    const navLinks = document.querySelectorAll('.nav-link');
    log(`找到 ${navLinks.length} 個 .nav-link 元素`);

    if (navLinks.length === 0) {
        log('未找到任何 .nav-link 元素，請檢查 HTML 結構', 'error');
    }else {
    const switchPage = (target) => {
        log(`切換到頁面: ${target}`);

        navLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-target="${target}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        document.querySelectorAll('.main-content-page').forEach(page => {
            page.classList.remove('active');
            page.classList.add('hidden');
        });

        const targetId = target === 'settings' ? 'settings-page' : `${target}-content`;
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
            targetContent.classList.add('active');
            targetContent.classList.remove('hidden');
        } else {
            log(`找不到 ID 為 ${targetId} 的元素`, 'error');
        }

        location.hash = `#${target}`;

        if (target === 'progress' && typeof Chart !== 'undefined') {
            // const ctx = document.getElementById('progressChart')?.getContext('2d');
            // if (ctx) {
            //     if (chartInstance) {
            //         chartInstance.destroy();
            //     }
            //     chartInstance = new Chart(ctx, {
            //         type: 'line',
            //         data: {
            //             labels: ['第1天', '第5天', '第10天', '第15天'],
            //             datasets: [{
            //                 label: '練習完成次數',
            //                 data: [2, 5, 8, 12],
            //                 borderColor: '#479ac7',
            //                 backgroundColor: 'rgba(71, 154, 199, 0.2)',
            //                 fill: true,
            //                 tension: 0.4
            //             }]
            //         },
            //         options: {
            //             responsive: true,
            //             scales: {
            //                 y: { beginAtZero: true, title: { display: true, text: '完成次數' } },
            //                 x: { title: { display: true, text: '日期' } }
            //             }
            //         }
            //     });
            // } else {
            //     log('找不到 progressChart 元素', 'error');
            // }
        }

        if (target === 'location-terms') {
            getLocation();
        }
    };

    // 將這些事件綁定放進這裡
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const target = link.getAttribute('data-target');
            log(`點擊了側邊欄選項: ${target}`);
            switchPage(target);
        });
    });
}

    // 統一的 switchPage 函數
    const switchPage = (target) => {
        log(`切換到頁面: ${target}`);

        // 更新側邊欄導航的 active 狀態
        navLinks.forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-target="${target}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // 隱藏所有頁面
        document.querySelectorAll('.main-content-page').forEach(page => {
            page.classList.remove('active');
            page.classList.add('hidden');
        });

        // 顯示目標頁面
        const targetId = target === 'settings' ? 'settings-page' : `${target}-content`;
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
            targetContent.classList.add('active');
            targetContent.classList.remove('hidden');
        } else {
            log(`找不到 ID 為 ${targetId} 的元素`, 'error');
        }

        // 更新 URL hash
        location.hash = `#${target}`;

        // 當離開情境練習頁面時，重置所有練習狀態
        if (target !== 'practice') {
            resetPracticeState();
        }

        // 特定頁面的初始化邏輯
        if (target === 'location-terms') {
            getLocation();
        }

        if (target === 'edit-name') {
            const nameInput = document.getElementById('nameInput');
            if (nameInput) {
                const currentUsername = usernameElements['profile-username']?.textContent || '這裡是使用者的名字';
                nameInput.value = currentUsername;
                nameInput.focus();
            }
        }

        if (target === 'change-password') {
            const current = document.getElementById('currentPassword');
            if (current) current.focus();
        }
    };

    // 重置情境練習狀態
    function resetPracticeState() {
        // 清空句子卡片容器
        const videoScriptButtons = document.getElementById('video-script-buttons');
        if (videoScriptButtons) {
            videoScriptButtons.innerHTML = '';
            log('已清空句子卡片');
        }

        // 隱藏影片播放區域
        const videoSection = document.getElementById('practice-video-section');
        if (videoSection) {
            videoSection.classList.add('practice-hidden');
            log('已隱藏影片區域');
        }

        // 隱藏所有單元列表
        document.querySelectorAll('.scenario-list').forEach(s => s.classList.add('hidden'));

        // 顯示主章節列表
        const cardContainer = document.getElementById('practice-card-container');
        if (cardContainer) {
            cardContainer.classList.remove('hidden');
            cardContainer.classList.remove('card-grid');
            cardContainer.classList.add('card-flex');
        }

        // 顯示英雄區
        const heroSection = document.querySelector('#practice-content .hero-section');
        if (heroSection) {
            heroSection.classList.remove('hidden');
        }

        // 停止 YouTube 播放
        if (window.ytPlayer && typeof window.ytPlayer.stopVideo === 'function') {
            try {
                window.ytPlayer.stopVideo();
                log('已停止 YouTube 播放');
            } catch (e) {
                log('停止 YouTube 播放時出錯: ' + e, 'warn');
            }
        }

        // 重置全域變數，允許下次重新載入
        window._alreadyFetching = false;
        window._alreadyFetchingDetail = false;

        log('✅ 情境練習狀態已重置');
    }

    // 將 switchPage 暴露到全局作用域，使 HTML 的 onclick 可以訪問
    window.switchPage = switchPage;

    // 綁定導航事件
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const target = link.getAttribute('data-target');
            log(`點擊了側邊欄選項: ${target}`);
            switchPage(target);
        });
    });
 
    // === 側邊欄切換 ===
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const hamburger = document.querySelector('.hamburger');
    const overlay = document.querySelector('.overlay');

    if (hamburger && sidebar && mainContent && overlay) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            overlay.classList.toggle('active');
            hamburger.classList.toggle('active');
            const icon = hamburger.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
            overlay.classList.remove('active');
            hamburger.classList.remove('active');
            const icon = hamburger.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        });

        // 防抖處理螢幕大小調整
        const debounce = (func, wait) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(...args), wait);
            };
        };

        const handleResize = () => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('collapsed');
                mainContent.classList.remove('expanded');
                overlay.classList.remove('active');
                hamburger.classList.remove('active');
                const icon = hamburger.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            } else {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
                overlay.classList.remove('active');
                hamburger.classList.remove('active');
                const icon = hamburger.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            }
        };

        window.addEventListener('resize', debounce(handleResize, 100));
        handleResize();
    } else {
        log('找不到漢堡選單、側邊欄、主內容或遮罩層元素', 'error');
    }

    // 移除 loading 動畫
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }

   // === 初始頁面載入（使用 hash 模式） ===
    const validPaths = ['home', 'progress', 'practice', 'location-terms', 'daily-terms','instant-messaging-terms', 'settings', 'profile', 'notification', 'help', 'about', 'edit-name', 'edit-gender', 'change-password', 'how-to-change-password', 'tutorial'];
    const path = location.hash.replace('#', '') || 'home';  // ✅ 使用 hash
    if (validPaths.includes(path)) {
        log(`初始頁面: ${path}`);
        switchPage(path);
    } else {
        log(`無效的初始路徑: ${path}，顯示 404 頁面`, 'warn');
        switchPage('404');
    }

    // === hash 變化時切換頁面 ===
    window.addEventListener('hashchange', () => {
        const validPaths = ['home', 'progress', 'practice', 'location-terms', 'daily-terms','instant-messaging-terms', 'settings', 'profile', 'notification', 'help', 'about', 'edit-name', 'edit-gender', 'change-password', 'how-to-change-password', 'tutorial'];
        const path = location.hash.replace('#', '') || 'home';
        if (validPaths.includes(path)) {
            log(`偵測到 hash 改變: ${path}`);
            switchPage(path);
        } else {
            log(`無效的 hash: ${path}，顯示 404 頁面`, 'warn');
            switchPage('404');
        }
    });


    // === 每日詞彙（含 localStorage、滑鼠/觸控拖曳、長按啟用） ===
    const inputField = document.getElementById('dailyTermInput');
    const addButton = document.getElementById('addDailyTermButton');
    const termsList = document.getElementById('dailyTermsList');

    // ----- 工具函式：儲存/載入/更新順序 -----
    function saveTerms(terms) {
    localStorage.setItem('dailyTerms', JSON.stringify(terms));
    }

    function loadTerms() {
    return JSON.parse(localStorage.getItem('dailyTerms') || '[]');
    }

    function updateOrder() {
    const newOrder = [...termsList.querySelectorAll('.term-item .term-text span')]
        .map(span => span.textContent);
    saveTerms(newOrder);
    }

    // 根據指標 Y 座標找出應插入的目標元素（容器中最接近且在下方的元素）
    function getDragAfterElement(container, y) {
    const items = [...container.querySelectorAll('.term-item:not(.dragging)')];
    return items.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - (box.top + box.height / 2);
        if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
        } else {
        return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // ----- 建立單一句子項目 -----
    function createTermItem(termText) {
    const termItem = document.createElement('div');
    termItem.classList.add('term-item');
    termItem.setAttribute('draggable', 'false'); // 預設不能拖曳（長按後才啟用）

    termItem.innerHTML = `
        <div class="term-text">
        <span>${termText}</span>
        </div>
        <button class="delete-term-button" title="刪除">
        <i class="fa-solid fa-trash"></i>
        </button>
    `;

    // --- 播放（點整行）---
    termItem.addEventListener('click', () => {
        // 若處於拖曳準備/拖曳中，不觸發播放
        if (termItem.classList.contains('drag-ready') || termItem.classList.contains('dragging')) return;
        speechSynthesis.speak(new SpeechSynthesisUtterance(termText));
    });

    // --- 刪除 ---
    termItem.querySelector('.delete-term-button').addEventListener('click', (e) => {
        e.stopPropagation();
        termItem.remove();
        const terms = loadTerms().filter(t => t !== termText);
        saveTerms(terms);
    });

    // --- 滑鼠：長按 1 秒啟用原生拖曳 ---
    let pressTimer;
    termItem.addEventListener('mousedown', () => {
        pressTimer = setTimeout(() => {
        termItem.setAttribute('draggable', 'true');
        termItem.classList.add('drag-ready');
        }, 1000);
    });
    termItem.addEventListener('mouseup', () => clearTimeout(pressTimer));
    termItem.addEventListener('mouseleave', () => clearTimeout(pressTimer));

    // 原生 drag 事件（滑鼠）
    termItem.addEventListener('dragstart', (e) => {
        termItem.classList.add('dragging');
        // 提升拖曳影像可見度（可省略）
        if (e.dataTransfer && e.target) {
        e.dataTransfer.setData('text/plain', termText);
        }
    });

    termItem.addEventListener('dragend', () => {
        termItem.classList.remove('dragging', 'drag-ready');
        termItem.setAttribute('draggable', 'false'); // 拖完關閉拖曳
        updateOrder();
    });

    // --- 觸控：長按 1 秒進入「手動拖曳」模式（不靠原生 drag）---
    let touchLongPressTimer;
    let draggingByTouch = false;

    termItem.addEventListener('touchstart', (e) => {
        // 若有多指觸控，忽略
        if (e.touches.length !== 1) return;
        touchLongPressTimer = setTimeout(() => {
        draggingByTouch = true;
        termItem.classList.add('dragging');
        }, 1000);
    }, { passive: true });

    termItem.addEventListener('touchmove', (e) => {
        if (!draggingByTouch) return;
        const touch = e.touches[0];
        e.preventDefault(); // 防止頁面捲動
        const afterElement = getDragAfterElement(termsList, touch.clientY);
        if (!afterElement) {
        termsList.appendChild(termItem);
        } else {
        termsList.insertBefore(termItem, afterElement);
        }
    }, { passive: false });

    termItem.addEventListener('touchend', () => {
        clearTimeout(touchLongPressTimer);
        if (draggingByTouch) {
        draggingByTouch = false;
        termItem.classList.remove('dragging');
        updateOrder();
        }
    });

    termItem.addEventListener('touchcancel', () => {
        clearTimeout(touchLongPressTimer);
        if (draggingByTouch) {
        draggingByTouch = false;
        termItem.classList.remove('dragging');
        }
    });

    return termItem;
    }

    // ----- 初始化與事件繫結 -----
    if (inputField && addButton && termsList) {
    // 初始載入（從 localStorage 還原）
    loadTerms().forEach(termText => {
        termsList.appendChild(createTermItem(termText));
    });

    // 新增句子
    addButton.addEventListener('click', () => {
        const termText = inputField.value.trim();
        if (!termText) {
        showMessage('請輸入詞彙');
        return;
        }

        // 避免重複（可選）
        const current = loadTerms();
        if (current.includes(termText)) {
        showMessage('這個詞彙已存在');
        return;
        }

        termsList.appendChild(createTermItem(termText));
        current.push(termText);
        saveTerms(current);
        inputField.value = '';
    });

    // 容器：原生拖曳（滑鼠）時決定插入位置
    termsList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dragging = document.querySelector('.term-item.dragging');
        if (!dragging) return;
        const afterElement = getDragAfterElement(termsList, e.clientY);
        if (!afterElement) {
        termsList.appendChild(dragging);
        } else {
        termsList.insertBefore(dragging, afterElement);
        }
    });
    }




// ========================================
// 即時溝通聊天系統整合
// ========================================
let chatManager = null;
let currentChatUserId = null;
let chatSystemInitializing = false; // 防止重複初始化

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

// 追蹤是否已設定 UI 事件（避免重複綁定）
let chatUIEventsSetup = false;

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

// 患者端：獲取已配對的治療師列表
let pairedTherapists = [];

async function fetchPairedTherapists() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error('未找到 token，無法獲取已配對治療師');
        return [];
    }

    try {
        const response = await fetch(CONFIG.getApiUrl("/pairing/my-therapists"), {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            pairedTherapists = data.therapists || [];
            console.log('已獲取配對治療師列表:', pairedTherapists);
            return pairedTherapists;
        } else {
            console.error('獲取配對治療師失敗:', response.statusText);
            return [];
        }
    } catch (error) {
        console.error('無法取得治療師列表', error);
        return [];
    }
}

// 處理聊天室更新
async function handleRoomsUpdate(rooms) {
    // 整合治療師列表和聊天室列表
    await fetchPairedTherapists();
    const mergedList = await mergePairedTherapistsWithRooms(rooms, pairedTherapists);
    renderRoomsList(mergedList);
}

// 合併已配對治療師和聊天室列表
async function mergePairedTherapistsWithRooms(rooms, therapists) {
    if (!therapists || therapists.length === 0) {
        // 如果沒有治療師資料，只返回聊天室列表（標記為已有聊天室）
        return rooms.map(room => ({
            ...room,
            hasRoom: true
        }));
    }

    const mergedList = [];
    const processedRoomTherapistIds = new Set();

    // 先處理已有聊天室的治療師
    rooms.forEach(room => {
        mergedList.push({
            ...room,
            hasRoom: true,
            therapist_id: room.therapist_id,
            therapist_name: room.therapist_name
        });
        if (room.therapist_id) {
            processedRoomTherapistIds.add(room.therapist_id);
        }
    });

    // 再處理已配對但未建立聊天室的治療師
    therapists.forEach(therapist => {
        if (!processedRoomTherapistIds.has(therapist.therapist_id)) {
            mergedList.push({
                therapist_id: therapist.therapist_id,
                therapist_name: therapist.therapist_name || '未知治療師',
                hasRoom: false,
                // 保留原始資料以供使用
                rawTherapistData: therapist
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

// 渲染聊天室列表（混合顯示已有聊天室和已配對治療師）
function renderRoomsList(mergedList) {
    const roomsList = document.getElementById("chatRoomsList");
    if (!roomsList) return;

    if (mergedList.length === 0) {
        roomsList.innerHTML = `
            <div class="chat-rooms-empty">
                <i class="fa-solid fa-inbox"></i>
                <p>目前沒有配對治療師</p>
            </div>
        `;
        return;
    }

    roomsList.innerHTML = mergedList.map(item => {
        const therapistName = item.therapist_name || '未知治療師';

        if (item.hasRoom) {
            // 已有聊天室的治療師
            const lastMessageTime = item.last_message_at ? formatTime(item.last_message_at) : '';
            const unreadBadge = item.unread_count > 0 ? `<span class="unread-badge">${item.unread_count}</span>` : '';

            return `
                <div class="chat-room-item ${chatManager && chatManager.currentRoomId === item.room_id ? 'active' : ''}"
                     data-room-id="${item.room_id}"
                     onclick="selectChatRoom('${item.room_id}')">
                    <div class="room-avatar">
                        <i class="fa-solid fa-user-doctor"></i>
                    </div>
                    <div class="room-info">
                        <div class="room-name">${therapistName}</div>
                        <div class="room-last-message">${lastMessageTime}</div>
                    </div>
                    ${unreadBadge}
                </div>
            `;
        } else {
            // 已配對但未建立聊天室的治療師
            return `
                <div class="chat-room-item paired-only"
                     data-therapist-id="${item.therapist_id}">
                    <div class="room-avatar">
                        <i class="fa-solid fa-user-doctor"></i>
                    </div>
                    <div class="room-info">
                        <div class="room-name">${therapistName}</div>
                    </div>
                    <button class="start-chat-btn" onclick="handleCreateRoomWithTherapist('${item.therapist_id}'); event.stopPropagation();">開始對話</button>
                </div>
            `;
        }
    }).join('');
}

// 選擇聊天室
async function selectChatRoom(roomId) {
    if (!chatManager) return;

    try {
        // 顯示載入狀態
        document.getElementById("chatEmptyState").style.display = 'none';
        document.getElementById("chatActiveContainer").style.display = 'flex';

        // 連接到聊天室
        await chatManager.connectToRoom(roomId);

        // 更新聊天室名稱
        const room = chatManager.getCurrentRoom();
        if (room) {
            const otherUserName = room.therapist_name || room.client_name || '聊天室';
            document.getElementById("chatRoomName").textContent = otherUserName;
        }

        // 渲染訊息
        renderMessages(chatManager.getMessages());

        // 更新聊天室列表選中狀態
        document.querySelectorAll('.chat-room-item').forEach(item => {
            item.classList.toggle('active', item.dataset.roomId === roomId);
        });

        // 滾動到底部
        scrollToBottom();
    } catch (error) {
        console.error('選擇聊天室失敗:', error);
        handleChatError('無法連接到聊天室');
    }
}

// 患者端建立聊天室（與治療師）
async function handleCreateRoomWithTherapist(therapistId) {
    if (!chatManager) {
        console.error('聊天管理器未初始化');
        alert('聊天系統尚未就緒，請稍後再試');
        return;
    }

    try {
        console.log('正在為治療師建立聊天室:', therapistId);

        // 顯示載入提示
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '建立中...';
        button.disabled = true;

        // 使用 ChatManager 的方法建立聊天室
        const room = await chatManager.createRoom(therapistId);

        console.log('聊天室建立成功:', room);

        // 建立成功後自動進入聊天室
        await selectChatRoom(room.room_id);

    } catch (error) {
        console.error('建立聊天室失敗:', error);
        alert('建立聊天室失敗: ' + (error.message || '未知錯誤'));

        // 恢復按鈕狀態
        if (event && event.target) {
            event.target.textContent = '開始對話';
            event.target.disabled = false;
        }
    }
}

// 渲染所有訊息
function renderMessages(messages) {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    chatMessages.innerHTML = messages.map(msg => createMessageHTML(msg)).join('');

    // 標記未讀訊息為已讀
    const unreadMessages = messages.filter(m =>
        m.sender_id !== currentChatUserId && m.status !== 'read'
    );
    if (unreadMessages.length > 0) {
        chatManager.markAsRead(unreadMessages.map(m => m.message_id));
    }
}

// 渲染單一訊息
function renderMessage(message) {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    const messageHTML = createMessageHTML(message);
    chatMessages.insertAdjacentHTML('beforeend', messageHTML);
}

// 創建訊息 HTML
function createMessageHTML(message) {
    const isSent = message.sender_id === currentChatUserId;
    const messageClass = isSent ? 'message message-sent' : 'message message-received';
    const timeString = formatTime(message.created_at);
    const statusIcon = isSent ? getStatusIcon(message.status) : '';

    // 調試日誌
    console.log('創建訊息:', {
        messageId: message.message_id,
        senderId: message.sender_id,
        currentUserId: currentChatUserId,
        isSent: isSent,
        messageClass: messageClass,
        content: message.content
    });

    return `
        <div class="${messageClass}" data-message-id="${message.message_id}">
            <div class="message-bubble">
                <div class="message-content">${escapeHtml(message.content)}</div>
                <div class="message-meta">
                    <span class="message-time">${timeString}</span>
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
            return '<i class="fa-solid fa-check"></i>';
        case 'delivered':
            return '<i class="fa-solid fa-check-double"></i>';
        case 'read':
            return '<i class="fa-solid fa-check-double" style="color: #4396cd;"></i>';
        default:
            return '';
    }
}

// 格式化時間（僅顯示時間，避免跑版）
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 滾動到底部
function scrollToBottom() {
    const chatMessagesContainer = document.getElementById("chatMessagesContainer");
    if (chatMessagesContainer) {
        setTimeout(() => {
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }, 100);
    }
}

// 轉義 HTML 特殊字符
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 播放通知音效
function playNotificationSound() {
    // 可選：播放音效
    // const audio = new Audio('/path/to/notification.mp3');
    // audio.play().catch(e => console.log('無法播放音效:', e));
}

// 當切換到聊天頁面時初始化
document.addEventListener('DOMContentLoaded', () => {
    let lastPageState = false; // 追蹤上一次的頁面狀態

    // 監聽頁面切換
    const observer = new MutationObserver(() => {
        const instantMessagingPage = document.getElementById('instant-messaging-terms-content');
        if (!instantMessagingPage) return;

        const isActive = instantMessagingPage.classList.contains('active');

        // 只在狀態從 false 變為 true 時觸發（避免重複觸發）
        if (isActive && !lastPageState) {
            console.log('📱 切換到聊天頁面');
            lastPageState = true;

            // 切換到聊天頁面，初始化聊天系統
            if (!chatManager && !chatSystemInitializing) {
                initChatSystem();
            }
        } else if (!isActive && lastPageState) {
            console.log('👋 離開聊天頁面');
            lastPageState = false;
        }
    });

    const instantMessagingPage = document.getElementById('instant-messaging-terms-content');
    if (instantMessagingPage) {
        observer.observe(instantMessagingPage, {
            attributes: true,
            attributeFilter: ['class'] // 只監聽 class 屬性變化
        });

        console.log('🔍 已設定聊天頁面監聽器');

        // 檢查頁面載入時是否已經在聊天頁面（例如重新整理頁面時）
        const isCurrentlyActive = instantMessagingPage.classList.contains('active');
        if (isCurrentlyActive) {
            console.log('📱 頁面載入時已在聊天頁面，初始化聊天系統');
            lastPageState = true;
            if (!chatManager && !chatSystemInitializing) {
                initChatSystem();
            }
        }
    }
});

// home的預約卡片功能
const bookBtn = document.getElementById("book-btn");
const cancelBtn = document.getElementById("cancel-btn");
const appointmentText = document.getElementById("appointment-text");

const popup = document.getElementById("appointment-popup");
const confirmBtn = document.getElementById("confirm-appointment");
const closePopupBtn = document.getElementById("close-popup");
const dateInput = document.getElementById("appointment-date");
const timeInput = document.getElementById("appointment-time");

// CSS: 讓換行生效
appointmentText.style.whiteSpace = "pre-line";

// 預約狀態
let appointmentStatus = "none"; // none, pending, confirmed

// 點擊預約 → 顯示彈窗
bookBtn.addEventListener("click", () => {
    popup.classList.remove("hidden");
});

// 關閉彈窗
closePopupBtn.addEventListener("click", () => {
    popup.classList.add("hidden");
});

// 確認預約
confirmBtn.addEventListener("click", () => {
    const date = dateInput.value;
    const time = timeInput.value;

    if (!date || !time) {
        alert("請選擇完整日期與時間");
        return;
    }

    // 設定為審核中
    appointmentStatus = "pending";
    appointmentText.textContent = `已發送預約：${date} ${time}\n預約進度：治療師審核中`;

    popup.classList.add("hidden");
    bookBtn.classList.add("hidden");
    cancelBtn.classList.remove("hidden");
});

// 取消預約 → 彈出確認
cancelBtn.addEventListener("click", () => {
    const confirmCancel = confirm("確定要取消預約嗎？");
    if (confirmCancel) {
        appointmentStatus = "none";
        appointmentText.textContent = "安排下次語言治療的時間，方便追蹤進度";
        cancelBtn.classList.add("hidden");
        bookBtn.classList.remove("hidden");
        dateInput.value = "";
        timeInput.value = "";
    }
});

// 範例：當治療師確認後，可手動或透過 API 更新
function confirmAppointment() {
    if (appointmentStatus === "pending") {
        appointmentStatus = "confirmed";
        appointmentText.textContent = `已確認預約：${dateInput.value} ${timeInput.value}\n預約進度：成功預約`;
    }
}


// === 進度追蹤圖卡及圖表 === //245-273, 294-324行暫時註解
document.querySelectorAll('.quick-stats .stat-number').forEach(el => {
    el.textContent = ''; // 清空
});
let progressChartInstance = null;

function drawProgressChart(labels, data) {
    const ctx = document.getElementById('progressChart').getContext('2d');

    if (progressChartInstance) {
        progressChartInstance.destroy(); // 銷毀舊圖
    }

    progressChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label:'完成次數', data, borderColor:'#479ac7', backgroundColor:'rgba(71, 154, 199, 0.2)', fill:true }] },
        options: { responsive:true, plugins:{legend:{display:false}}, scales:{x:{title:{display:true,text:'天數'}},y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,   // 刻度固定每格 1
                        precision: 0   // 移除小數點
                    }
                }}}
    });
}
async function fetchProgressData() {
    try {
        const res = await fetch(CONFIG.getApiUrl("/practice/progress/overview?recent_days=15"), {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`API 錯誤: ${res.status}, 訊息: ${errText}`);
        }

        const data = await res.json();
        console.log("📊 Progress Data:", data);

        // 先清空假資料
        document.querySelectorAll('.quick-stats .stat-number').forEach(el => el.textContent = '');

        // 更新卡片
        document.querySelector('.quick-stats .stat-card:nth-child(1) .stat-number')
            .textContent = data.course_progress.completed_courses; //已完成單元數
        document.querySelector('.quick-stats .stat-card:nth-child(2) .stat-number')
            .textContent = `${data.avg_accuracy_last_30_days ?? 0}%`; //平均準確率
        document.querySelector('.quick-stats .stat-card:nth-child(3) .stat-number')
            .textContent = (data.course_progress.total_courses)-(data.course_progress.completed_courses); //待完成單元數

        const completedCount = data.course_progress.completed_courses || 0;
        const accuracy = data.avg_accuracy_last_30_days || 0;

        // 抓取所有 title 和 description
        const titles = document.querySelectorAll('.achievement-title');
        const descriptions = document.querySelectorAll('.achievement-description');

        // ✅ 卡片 1：完成練習次數
        titles[0].textContent = `完成 ${completedCount} 次練習`;
        descriptions[0].textContent = `恭喜您完成了 ${completedCount} 次練習，繼續加油！`;

        // ✅ 卡片 2：達到準確率
        titles[1].textContent = `達到 ${accuracy}% 準確率`;
        descriptions[1].textContent = `您的平均準確率達到了 ${accuracy}% ，保持這個好成績！`;

        // 更新折線圖
        const totalDays = 7;
        const dailyStats = data.recent_practice.daily_stats || [];

        // 建立一個長度 15 的陣列，預設值都為 0
        const completedCounts = Array(totalDays).fill(0);

        // 將有紀錄的天數覆蓋進去
        dailyStats.forEach((item, index) => {
            completedCounts[index] = Math.round(item.completed_sessions || 0);
        });

        // 產生 1~15 天的標籤
        const labels = Array.from({ length: totalDays }, (_, i) => `第 ${i + 1} 天`);

        drawProgressChart(labels, completedCounts);

    } catch (err) {
        console.error('載入進度失敗:', err);
    }
}

// 確保 DOM 載入完成後抓進度
document.addEventListener('DOMContentLoaded', fetchProgressData);

