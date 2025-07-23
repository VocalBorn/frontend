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
            { time: 20, text: '好的謝謝你那我想一下' },
            { time: 25, text: '不好意思可以幫我點餐嗎？' },
        ],
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
