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

    // === 初始化性別顯示（放在這裡） ===
    const gender = localStorage.getItem('userGender');
    const select = document.getElementById('genderSelect');
    if (gender && select) {
        select.value = gender;
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

    // 綁定個人檔案選項事件
    const profileOptions = document.querySelectorAll('.profile-option');
    profileOptions.forEach(option => {
        option.addEventListener('click', () => {
            const target = option.getAttribute('data-target');
            log(`點擊了個人檔案選項: ${target}`);
            switchPage(target);
        });
    });

    // 綁定返回按鈕
    const backToProfileBtn = document.getElementById('backToProfile');
    if (backToProfileBtn) {
        backToProfileBtn.addEventListener('click', () => {
            switchPage('profile');
            log('返回個人檔案頁面');
        });
    }
    const backToProfileFromPassword = document.getElementById('backToProfileFromPassword');
    if (backToProfileFromPassword) {
        backToProfileFromPassword.addEventListener('click', () => {
            switchPage('profile');
        });
    }
    const helpHowToItem = document.getElementById('how-to-change-password-item');
    if (helpHowToItem) {
    helpHowToItem.addEventListener('click', () => {
        switchPage('how-to-change-password');
    });
    }

    const backToHelpFromHowTo = document.getElementById('backToHelpFromHowTo');
    if (backToHelpFromHowTo) {
    backToHelpFromHowTo.addEventListener('click', () => {
        switchPage('help');
    });
    }

    const tutorialItem = document.getElementById('tutorial-item');
    if (tutorialItem) {
    tutorialItem.addEventListener('click', () => {
        switchPage('tutorial');
    });
    }

    const backToHelpFromTutorial = document.getElementById('backToHelpFromTutorial');
    if (backToHelpFromTutorial) {
    backToHelpFromTutorial.addEventListener('click', () => {
        switchPage('help');
    });
    }


 
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

    // === 設定頁面 ===
    const settingsButtons = {
    showProfile: 'profile',
    showSetting: 'settings',
    showNotification: 'notification',
    backToSettingfromNotify: 'settings',
    showHelp: 'help',
    backToSettingfromHelp: 'settings',
    showAbout: 'about',
    backToSettingfromAbout: 'settings',
    editName: 'edit-name',                  // 切換到編輯姓名
    backToProfile: 'profile',               // 編輯頁返回
    changePassword: 'change-password' ,
    backToProfileFromPassword: 'profile',      // ✅ 新增：切換到變更密碼
    editGender: 'edit-gender', // ← 修正這行，對應性別頁
    backToProfileFromGender: 'profile' // ← 新增這行
    };
    
    Object.entries(settingsButtons).forEach(([id, target]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => switchPage(target));
        }
    });
    
    // === 姓名編輯功能 ===
    function saveName() {
        const nameInput = document.getElementById('nameInput');
        const newName = nameInput?.value.trim();

        if (!nameInput || newName === '') {
            showMessage('請輸入有效的姓名！');
            log('姓名輸入為空或找不到 nameInput 元素', 'warn');
            return;
        }

        // 更新 localStorage
        const registeredUser = localStorage.getItem('registeredUser');
        if (registeredUser) {
            try {
                const user = JSON.parse(registeredUser);
                user.username = newName;
                localStorage.setItem('registeredUser', JSON.stringify(user));
                log('姓名已儲存到 localStorage');
            } catch (error) {
                log('更新 localStorage 時出錯: ' + error, 'error');
                showMessage('儲存姓名時發生錯誤，請重試');
                return;
            }
        } else {
            log('未找到用戶資料，無法儲存姓名', 'warn');
            showMessage('請先登入再修改姓名');
            return;
        }

        // 更新顯示
        const usernameElements = {
            'profile-username': document.getElementById('profile-username'),
            'settings-username': document.getElementById('settings-username'),
            'welcome-username': document.getElementById('welcome-username')
        };
        Object.entries(usernameElements).forEach(([id, element]) => {
            if (element) {
                element.textContent = newName;
            } else {
                log(`找不到 ID 為 ${id} 的元素，無法更新姓名`, 'warn');
            }
        });

        showMessage('姓名已更新！');
        log(`姓名已更新為: ${newName}`);
        switchPage('profile'); // 儲存後返回個人檔案頁面
    }
    function saveGender() {
    const selectedGender = document.getElementById('genderSelect').value;
    localStorage.setItem('userGender', selectedGender);
    alert('性別已儲存：' + selectedGender);
    switchPage('profile');
    }
    function signInToday() {
    const today = new Date().toLocaleDateString();
    const signedIn = localStorage.getItem('signedInDate');

    if (signedIn === today) {
        alert("您今天已經簽到過囉！");
    } else {
        localStorage.setItem('signedInDate', today);
        alert("✅ 簽到成功，太棒了！");
        // 可選：執行畫面更新或動畫
    }
}
    // 通知切換
    const notifyToggle = document.getElementById('notifyToggle');
    if (notifyToggle) {
        notifyToggle.addEventListener('change', () => {
            log(`通知：${notifyToggle.checked ? '開啟' : '關閉'}`);
        });
    }

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

// === 全域函數 ===
function logout() {
    localStorage.removeItem('registeredUser');
    showMessage('您已登出');
    window.location.href = 'index.html';
}

function savechange() {
    saveName();
    showMessage('已儲存變更');
}

function submitPasswordChange() {
    const currentPassword = document.getElementById('currentPassword')?.value.trim();
    const newPassword = document.getElementById('newPassword')?.value.trim();
    const confirmPassword = document.getElementById('confirmPassword')?.value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage('請完整填寫所有欄位');
        return;
    }

    const stored = localStorage.getItem('registeredUser');
    if (!stored) {
        showMessage('請先登入');
        return;
    }

    try {
        const user = JSON.parse(stored);
        if (user.password !== currentPassword) {
            showMessage('目前密碼不正確');
            return;
        }

        if (newPassword.length < 6) {
            showMessage('新密碼長度需至少 6 字元');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('新密碼與確認密碼不一致');
            return;
        }

        user.password = newPassword;
        localStorage.setItem('registeredUser', JSON.stringify(user));
        showMessage('密碼已成功更新');
        log('密碼變更成功');
        switchPage('profile');
    } catch (error) {
        log('密碼變更錯誤：' + error, 'error');
        showMessage('更新失敗，請重試');
    }
}

