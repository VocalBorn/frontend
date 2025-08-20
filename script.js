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
            const ctx = document.getElementById('progressChart')?.getContext('2d');
            if (ctx) {
                if (chartInstance) {
                    chartInstance.destroy();
                }
                chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['第1天', '第5天', '第10天', '第15天'],
                        datasets: [{
                            label: '練習完成次數',
                            data: [2, 5, 8, 12],
                            borderColor: '#479ac7',
                            backgroundColor: 'rgba(71, 154, 199, 0.2)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: { beginAtZero: true, title: { display: true, text: '完成次數' } },
                            x: { title: { display: true, text: '日期' } }
                        }
                    }
                });
            } else {
                log('找不到 progressChart 元素', 'error');
            }
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
    const switchPage = (target) => {
        // 渲染進度圖表
        if (target === 'progress' && typeof Chart !== 'undefined') {
            const ctx = document.getElementById('progressChart')?.getContext('2d');
            if (ctx) {
                if (chartInstance) {
                    chartInstance.destroy();
                }
                chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['第1天', '第5天', '第10天', '第15天'],
                        datasets: [{
                            label: '練習完成次數',
                            data: [2, 5, 8, 12],
                            borderColor: '#479ac7',
                            backgroundColor: 'rgba(71, 154, 199, 0.2)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: { beginAtZero: true, title: { display: true, text: '完成次數' } },
                            x: { title: { display: true, text: '日期' } }
                        }
                    }
                });
            } else {
                log('找不到 progressChart 元素', 'error');
            }
        }

        

        // 初始化姓名編輯頁面
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


    // === 每日詞彙 ===
    const inputField = document.getElementById('dailyTermInput');
    const addButton = document.getElementById('addDailyTermButton');
    const termsList = document.getElementById('dailyTermsList');

    if (inputField && addButton && termsList) {
        addButton.addEventListener('click', () => {
            const termText = inputField.value.trim();
            if (termText === '') {
                showMessage('請輸入詞彙');
                return;
            }

            const termItem = document.createElement('button');
            termItem.classList.add('term-item');
            termItem.innerHTML = `
                <div class="term-text">
                    <i class="fa-solid fa-volume-up play-icon"></i>
                    <span>${termText}</span>
                </div>
                <button class="delete-term-button">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;

            termItem.querySelector('.play-icon').addEventListener('click', (event) => {
                event.stopPropagation();
                let utterance = new SpeechSynthesisUtterance(termText);
                speechSynthesis.speak(utterance);
            });

            termItem.querySelector('.delete-term-button').addEventListener('click', (event) => {
                event.stopPropagation();
                termItem.remove();
            });

            termsList.appendChild(termItem);
            inputField.value = '';
        });

        const playButton = document.getElementById('playDailyTermButton');
        if (playButton) {
            playButton.addEventListener('click', () => {
                const termText = inputField.value.trim();
                if (termText === '') {
                    showMessage('請輸入詞彙');
                    return;
                }
                let utterance = new SpeechSynthesisUtterance(termText);
                speechSynthesis.speak(utterance);
            });
        }
    }

    // 即時溝通頁面功能
    document.addEventListener("DOMContentLoaded", function() {
    const chatInput = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendButton");
    const chatMessages = document.getElementById("chatMessages");

    // 發送訊息的函數
    function sendMessage(message) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message", "user-message");

        // 設置訊息內容
        const messageText = document.createElement("span");
        messageText.textContent = message;
        messageElement.appendChild(messageText);

        // 設置時間
        const timeElement = document.createElement("span");
        timeElement.classList.add("message-time");
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageElement.appendChild(timeElement);

        // 將訊息添加到訊息區域
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // 滾動至訊息區底部
    }

    // 監聽發送按鈕
    sendButton.addEventListener("click", function() {
        const userMessage = chatInput.value.trim();

        if (userMessage) {
            sendMessage(userMessage);
            chatInput.value = ""; // 清空輸入框
        }
    });

    // 監聽回車鍵發送訊息
    chatInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter" && chatInput.value.trim() !== "") {
            sendButton.click();
        }
    });

    // === 輔助函數 ===
    function showMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #333;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
        `;

        setTimeout(() => {
            toast.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        log(`顯示訊息: ${message}`);
    }
});



