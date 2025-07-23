// === 顯示子情境 ===
function showScenario(scenarioId) {
    const cardContainer = document.getElementById('practice-card-container');
    const allScenarios = document.querySelectorAll('.scenario-list');
    const targetSection = document.getElementById(`scenario-${scenarioId}`);
    if (cardContainer) cardContainer.classList.add('hidden');
    allScenarios.forEach(section => section.classList.add('hidden'));
    if (targetSection) targetSection.classList.remove('hidden');
    log(`顯示子情境：${scenarioId}`);
}

// === 返回章節列表 ===
function goBackToChapterList() {
    const cardContainer = document.getElementById('practice-card-container');
    const videoSection = document.getElementById('practice-video-section');
    if (cardContainer) {
        cardContainer.classList.remove('hidden');
        cardContainer.classList.remove('card-grid');
        cardContainer.classList.add('card-flex');
    }
    document.querySelectorAll('.scenario-list').forEach(s => s.classList.add('hidden'));
    if (videoSection) videoSection.classList.add('practice-hidden');
    log('返回章節列表');
}

// === 綁定影片播放按鈕 ===
function bindPracticeVideoButtons() {
    const youtubePlayer = document.getElementById('youtube-player');
    const videoSection = document.getElementById('practice-video-section');
    const cardContainer = document.getElementById('practice-card-container');
    const backButton = document.getElementById('practice-back-button');

    if (!youtubePlayer || !videoSection || !cardContainer || !backButton) {
        log('❌ 缺少必要 DOM 元素', 'error');
        return;
    }

    document.querySelectorAll('.practice-button').forEach(button => {
        button.addEventListener('click', () => {
            const youtubeId = button.getAttribute('data-youtube');
            const scenarioId = button.getAttribute('data-scenario'); // 讀取 data-scenario
            setupScriptButtons(scenarioId); // 顯示腳本按鈕
            if (youtubeId) {
                cardContainer.classList.add('practice-hidden');
                document.querySelectorAll('.scenario-list').forEach(s => s.classList.add('hidden'));
                youtubePlayer.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
                videoSection.classList.remove('practice-hidden');
                log(`▶️ 播放影片：${youtubeId}`);
            } else {
                log('❌ 缺少 data-youtube 屬性', 'error');
            }
        });
    });
}

// === 綁定返回按鈕 ===
function bindPracticeBackButton() {
    const backButton = document.getElementById('practice-back-button');
    const youtubePlayer = document.getElementById('youtube-player'); // ✅ 改成 iframe
    const videoSection = document.getElementById('practice-video-section');
    const cardContainer = document.getElementById('practice-card-container');

    if (!backButton || !youtubePlayer || !videoSection || !cardContainer) {
        log('❌ 找不到返回按鈕或影片區塊元素', 'warn');
        return;
    }

    backButton.addEventListener('click', () => {
        // ✅ 停止 YouTube 播放（清空 src）
        youtubePlayer.src = '';

        // 隱藏影片區塊
        videoSection.classList.add('practice-hidden');

        // 顯示章節列表（主卡片區）
        cardContainer.classList.remove('hidden');
        cardContainer.classList.remove('card-grid');
        cardContainer.classList.add('card-flex');

        // ✅ 清除所有子情境（避免殘留）
        document.querySelectorAll('.scenario-list').forEach(s => s.classList.add('hidden'));

        log('🔙 返回章節選單');
    });
}

const audioChunks = new Map(); // 每句話對應一段錄音
let mediaRecorder = null;

function setupScriptButtons(scenarioId) {
    const scriptData = {
        '1-1': [
            { time: 5, text: '請問2位內用有位置嗎？' },
            { time: 10, text: '有菜單嗎？' },
            { time: 15, text: '有什麼推薦的嗎？' },
            { time: 20, text: '好的謝謝你，那我想一下' },
            { time: 25, text: '不好意思　可以幫我點餐嗎？' },
        ],
        '1-2': [
            { time: 5, text: '請問可以外帶嗎？' },
            { time: 10, text: '我要一份漢堡，謝謝。' },
            { time: 15, text: '請問要等多久？' },
            { time: 20, text: '有餐具嗎？' },
            { time: 25, text: '可以給我一個袋子嗎？' }
        ],
        '3-1': [
            { time: 5, text: '請問可以刷卡嗎？' },
            { time: 10, text: '這個有折扣嗎？' },
            { time: 15, text: '我想用行動支付。' },
            { time: 20, text: '我需要明細，謝謝。' }
        ],
        '3-2': [
            { time: 5, text: '這個多少錢？' },
            { time: 10, text: '第二件有優惠嗎？' },
            { time: 15, text: '有我的尺寸嗎？' },
            { time: 20, text: '有其他款式可以選嗎？' },
            { time: 25, text: '這裡有賣漢堡嗎？' }
        ],
        '4-1': [
            { time: 5, text: '你好，我想開一個帳戶。' },
            { time: 10, text: '請問要準備哪些資料？' },
            { time: 15, text: '我要開的是儲蓄帳戶。' },
            { time: 20, text: '我可以申請提款卡嗎？' }
        ],
        '5-1': [
            { time: 5, text: '我想寄這個包裹。' },
            { time: 10, text: '請問有快遞服務嗎？' },
            { time: 15, text: '最快可以多久送達？' },
            { time: 20, text: '這個寄到台北要多少錢？' }
        ],
        '5-2': [
            { time: 5, text: '我來領包裹，這是通知單。' },
            { time: 10, text: '需要出示身分證嗎？' },
            { time: 15, text: '請問可以幫我拆開確認嗎？' },
        ],
        '6-1': [
            { time: 5, text: '不好意思，請問車站怎麼走？' },
            { time: 10, text: '走路大概要多久？' },
            { time: 15, text: '請問這附近有廁所嗎？' }
        ],
        '6-2': [
            { time: 5, text: '我要一張到高雄的車票。' },
            { time: 10, text: '請問有學生票嗎？' },
            { time: 15, text: '我要買今天下午三點的票。' },
            { time: 20, text: '請問有沒有對號座？' }
        ],
        '7-1': [
            { time: 5, text: '可以幫助我嗎？我遇到了一些狀況' },
            { time: 10, text: '我在大安森林公園，腳扭到了。' },
            { time: 15, text: '可以派救護車嗎？' },
            { time: 20, text: '我大概二十歲，穿著藍色外套。' }
        ],
        '8-1': [
            { time: 5, text: '請幫我一下，謝謝！' },
            { time: 10, text: '不好意思，請問洗手間在哪？' },
            { time: 15, text: '對不起，我不是故意的。' },
            { time: 20, text: '沒關係，謝謝你的理解。' },
            { time: 25, text: '真的非常感謝你。' }
        ],
        '8-2': [
            { time: 5, text: '你好！今天過得怎麼樣？' },
            { time: 10, text: '早安，祝你有美好的一天！' },
            { time: 15, text: '晚安，明天見～' },
            { time: 20, text: '再見，路上小心。' },
            { time: 25, text: '嗨！好久不見！' }
        ]
    };

    const container = document.getElementById('video-script-buttons');
    container.innerHTML = '';

    const lines = scriptData[scenarioId] || [];
    lines.forEach((line) => {
        const sentenceBlock = document.createElement('div');
        sentenceBlock.className = 'sentence-control';
        sentenceBlock.setAttribute('data-start', line.time);

        sentenceBlock.addEventListener('click', () => {
            const player = document.getElementById('youtube-player');
            const baseId = player.src.split('/embed/')[1].split('?')[0];
            player.src = `https://www.youtube.com/embed/${baseId}?start=${line.time}&autoplay=1`;
        });

        const timeLabel = document.createElement('span');
        timeLabel.innerHTML = `<b>${formatTime(line.time)}</b> - ${line.text}`;

        const startBtn = document.createElement('button');
        startBtn.innerHTML = '🎙';
        startBtn.title = '開始錄音';
        startBtn.classList.add('record-btn');
        startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                alert('已有錄音進行中，請先停止');
                return;
            }
            navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                const chunks = [];
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = e => chunks.push(e.data);
                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    audioChunks.set(sentenceBlock, blob);
                    stream.getTracks().forEach(track => track.stop()); // 停止麥克風
                    startBtn.classList.remove('recording'); // 移除提示狀態
                };
                mediaRecorder.start();
                startBtn.classList.add('recording'); // 加上提示樣式
            }).catch(err => {
                alert('無法使用麥克風：' + err.message);
            });
        });

        const stopBtn = document.createElement('button');
        stopBtn.innerHTML = '🛑';
        stopBtn.title = '停止錄音';
        stopBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        });

        const playBtn = document.createElement('button');
        playBtn.innerHTML = '▶';
        playBtn.title = '播放錄音';
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const blob = audioChunks.get(sentenceBlock);
            if (!blob) {
                alert('尚未錄音');
                return;
            }
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
        });
        const uploadBtn = document.createElement('button');
        uploadBtn.innerHTML = '⇧';
        uploadBtn.title = '上傳錄音';
        uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const blob = audioChunks.get(sentenceBlock);
            if (!blob) {
                alert('尚未錄音');
                return;
            }

            const formData = new FormData();
            formData.append('file', blob, `recording-${scenarioId}-${line.time}.webm`);

            fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })
            .then(res => res.ok ? res.text() : Promise.reject(res))
            .then(msg => {
                alert('✅ 上傳成功');
                console.log(msg);
            })
            .catch(err => {
                console.error('❌ 上傳失敗', err);
                alert('❌ 上傳失敗，請稍後再試');
            });
        });

        sentenceBlock.appendChild(timeLabel);
        sentenceBlock.appendChild(startBtn);
        sentenceBlock.appendChild(stopBtn);
        sentenceBlock.appendChild(playBtn);
        sentenceBlock.appendChild(uploadBtn);


        container.appendChild(sentenceBlock);
    });
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}

// === 初始化情境練習模組 ===
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const backButton = document.getElementById('practice-back-button');
        if (backButton) {
            bindPracticeVideoButtons();
            bindPracticeBackButton();
            log('✅ 情境練習模組初始化完成');
        } else {
            log('❌ 尚未載入情境練習 DOM 元素，稍後再初始化', 'warn');
        }
    }, 200); // 等 DOM 有機會渲染
});

// === 將函式掛到全域供 HTML 呼叫 ===
window.showScenario = showScenario;
window.goBackToChapterList = goBackToChapterList;
