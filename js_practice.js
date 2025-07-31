window.onYouTubeIframeAPIReady = function () {
    console.log("✅ onYouTubeIframeAPIReady 被觸發");
    loadYouTubePlayerWhenReady(); // 你定義的初始化函式
};
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
// === 查看回饋 ===
function showFeedback(scenarioId) {
    const modal = document.getElementById('feedback-modal');
    const body = document.getElementById('feedback-body');
    const title = document.getElementById('feedback-title');

    const feedbackData = {
        '1-1': '你已練習 5 次，發音清晰，請注意語速控制。',
        '1-2': '語調自然，但「刷卡嗎？」稍快。',
        '2-1': '醫學用詞清楚，請再放慢語速。',
        '2-2': '語句完整，語氣自然。',
        '3-1': '語句完整，語氣自然。',
        // ...未來可加更多
    };

    title.textContent = `單元 ${scenarioId} 的練習回饋`;
    body.textContent = feedbackData[scenarioId] || '尚無回饋資料';
    modal.classList.remove('hidden');
}

function closeFeedback() {
    document.getElementById('feedback-modal').classList.add('hidden');
}

// === AI分析 ===
function showAIAnalysis(scenarioId) {
  console.log("觸發 AI 分析情境：", scenarioId);

  // 顯示 modal、切換畫面、載入分析資料等等
  const modal = document.getElementById("feedback-modal");
  const title = document.getElementById("feedback-title");
  const body = document.getElementById("feedback-body");

  modal.classList.remove("hidden");
  title.textContent = `AI 分析 - 情境 ${scenarioId}`;
  body.textContent = "AI 分析結果載入中...";

  // 🧠 模擬 API 載入（或串接實際分析 API）
  setTimeout(() => {
    body.innerHTML = `
      <p>這是 <strong>${scenarioId}</strong> 的 AI 分析結果範例。</p>
      <ul>
        <li>語速適中</li>
        <li>句子完整率 92%</li>
        <li>聲音辨識準確率 87%</li>
      </ul>
    `;
  }, 1000);
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
        let youtubeId = '';
        button.addEventListener('click', () => {
        const youtubeId = button.getAttribute('data-youtube');
        const scenarioId = button.getAttribute('data-scenario');

        currentVideoId = youtubeId;

        console.log("🟢 點擊到開始練習按鈕");
        console.log("🎥 影片 ID:", youtubeId);
        console.log("📘 情境 ID:", scenarioId);

        // ✅ 顯示影片播放區
        document.getElementById('practice-video-section').classList.remove('practice-hidden');

        // ✅ 隱藏章節入口區塊
        document.getElementById('practice-card-container').classList.add('hidden');

        // ✅ 隱藏所有章節子選單（scenario-xxx）
        document.querySelectorAll('.scenario-list').forEach(s => s.classList.add('hidden'));

        // ✅ 等待 iframe 出現後再初始化 ytPlayer
        setTimeout(() => {
            if (!ytPlayerReady) {
                console.log("🕐 等待 YT Player 初始化...");
                loadYouTubePlayerWhenReady(); // 若你還沒建，這裡會建
            }

            // 等 ytPlayer 完成初始化
            const waitUntilReady = setInterval(() => {
                if (ytPlayerReady && ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
                    clearInterval(waitUntilReady);
                    console.log('🎞 準備載入影片', { ytPlayer, youtubeId });

                    ytPlayer.loadVideoById(youtubeId);
                    setupScriptButtons(scenarioId);
                }
            }, 100);
        }, 300); // 延遲 300ms 確保 iframe 顯示出來
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


function playSegment(start, end) {
  if (!ytPlayerReady || !ytPlayer || typeof ytPlayer.seekTo !== 'function') {
    log('❌ ytPlayer 尚未準備好或功能無效', 'error');
    return;
  }

  console.log(`🎬 播放影片區間：${start}s ~ ${end}s`);

  ytPlayer.seekTo(start, true); // ✅ 第二參數 true 代表精確跳轉
  ytPlayer.playVideo();

  if (stopTimeout) clearTimeout(stopTimeout);
  stopTimeout = setTimeout(() => {
    ytPlayer.pauseVideo();
    console.log("⏹ 已自動暫停影片");
  }, (end - start) * 1000);
}

// === IndexedDB 暫存函式 ===
function saveRecordingToIndexedDB(key, blob) {
  const request = indexedDB.open('VocalbornDB', 1);
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore('recordings');
  };
  request.onsuccess = (event) => {
    const db = event.target.result;
    const tx = db.transaction('recordings', 'readwrite');
    const store = tx.objectStore('recordings');
    store.put(blob, key);
    console.log('✅ 已暫存錄音', key);
  };
}

function setupScriptButtons(scenarioId) {
    const scriptData = {
        '1-1': [
            { start: 5, end: 9, text: '請問2位內用有位置嗎？' },
            { start: 10, end: 14, text: '有菜單嗎？' },
            { start: 15, end: 19, text: '有什麼推薦的嗎？' },
            { start: 20, end: 24, text: '好的謝謝你，那我想一下' },
            { start: 25, end: 29, text: '不好意思　可以幫我點餐嗎？' },
        ],
        '1-2': [
            { start: 5, end: 9, text: '請問可以外帶嗎？' },
            { start: 10, end: 14,text: '我要一份漢堡，謝謝。' },
            { start: 15, end: 19, text: '請問要等多久？' },
            { start: 20, end: 24, text: '有餐具嗎？' },
            { start: 25, end: 29, text: '可以給我一個袋子嗎？' }
        ],
        '3-1': [
            { start: 5, end: 9, text: '請問可以刷卡嗎？' },
            { start: 10, end: 14, text: '這個有折扣嗎？' },
            { start: 15, end: 19, text: '我想用行動支付。' },
            { start: 25, end: 29, end: 24, text: '我需要明細，謝謝。' }
        ],
        '3-2': [
            { start: 5, end: 9, text: '這個多少錢？' },
            { start: 10, end: 14, text: '第二件有優惠嗎？' },
            { start: 15, end: 19, text: '有我的尺寸嗎？' },
            { start: 20, end: 24, text: '有其他款式可以選嗎？' },
            { start: 25, end: 29, text: '這裡有賣漢堡嗎？' }
        ],
        '4-1': [
            { start: 5, end: 9, text: '你好，我想開一個帳戶。' },
            { start: 10, end: 14, text: '請問要準備哪些資料？' },
            { start: 15, end: 19, text: '我要開的是儲蓄帳戶。' },
            { start: 20, end: 24, text: '我可以申請提款卡嗎？' }
        ],
        '5-1': [
            { start: 5, end: 9, text: '我想寄這個包裹。' },
            { start: 10, end: 14, text: '請問有快遞服務嗎？' },
            { start: 15, end: 19, text: '最快可以多久送達？' },
            { start: 20, end: 24, text: '這個寄到台北要多少錢？' }
        ],
        '5-2': [
            { start: 5, end: 9, text: '我來領包裹，這是通知單。' },
            { start: 10, end: 14, text: '需要出示身分證嗎？' },
            { start: 15, end: 19, text: '請問可以幫我拆開確認嗎？' },
        ],
        '6-1': [
            { start: 5, end: 9, text: '不好意思，請問車站怎麼走？' },
            { start: 10, end: 14, text: '走路大概要多久？' },
            { start: 15, end: 19, text: '請問這附近有廁所嗎？' }
        ],
        '6-2': [
            { start: 5, end: 9, text: '我要一張到高雄的車票。' },
            { start: 10, end: 14, text: '請問有學生票嗎？' },
            { start: 15, end: 19, text: '我要買今天下午三點的票。' },
            { start: 20, end: 24, text: '請問有沒有對號座？' }
        ],
        '7-1': [
            { start: 5, end: 9, text: '可以幫助我嗎？我遇到了一些狀況' },
            { start: 10, end: 14, text: '我在大安森林公園，腳扭到了。' },
            { start: 15, end: 19, text: '可以派救護車嗎？' },
            { start: 20, end: 24, text: '我大概二十歲，穿著藍色外套。' }
        ],
        '8-1': [
            { start: 5, end: 9, text: '請幫我一下，謝謝！' },
            { start: 10, end: 14, text: '不好意思，請問洗手間在哪？' },
            { start: 15, end: 19, text: '對不起，我不是故意的。' },
            { start: 20, end: 24, text: '沒關係，謝謝你的理解。' },
            { start: 25, end: 29, text: '真的非常感謝你。' }
        ],
        '8-2': [
            { start: 5, end: 9, text: '你好！今天過得怎麼樣？' },
            { start: 10, end: 14, text: '早安，祝你有美好的一天！' },
            { start: 15, end: 19, text: '晚安，明天見～' },
            { start: 20, end: 24, text: '再見，路上小心。' },
            { start: 25, end: 29, text: '嗨！好久不見！' }
        ]
    };

    const container = document.getElementById('video-script-buttons');
    container.innerHTML = '';

    const lines = scriptData[scenarioId] || [];
    lines.forEach((line) => {
        
        if (typeof line.start !== 'number' || typeof line.end !== 'number') {
            console.warn(`⚠️ 無效播放範圍：${JSON.stringify(line)}`);
            return; // 跳過這句，因為沒有明確的播放區間
        }
        const start = line.start;
        const end = line.end;
        const sentenceBlock = document.createElement('div');
        sentenceBlock.className = 'sentence-control';
        sentenceBlock.setAttribute('data-start', start);
        sentenceBlock.setAttribute('data-end', end);


        sentenceBlock.addEventListener('click', () => {
            playSegment(start, end);
            });

        const timeLabel = document.createElement('span');
        timeLabel.innerHTML = `<b>${formatTime(line.start)} ~ ${formatTime(line.end)}</b> - ${line.text}`;

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

            const sentenceId = `${scenarioId}-${start}-${end}`;
            const key = `recording-${sentenceId}`;

            // ✅ 先暫存到 IndexedDB
            saveRecordingToIndexedDB(key, blob);

            // ✅ 立即當作上傳成功處理
            sentenceBlock.classList.add('uploaded'); // 套用句子樣式
            localStorage.setItem(`uploaded-${sentenceId}`, 'true');
            alert('✅ 上傳成功（已儲存）');


            /*const formData = new FormData();
            formData.append('file', blob, `recording-${scenarioId}-${line.start}-${line.end}.webm`);

            fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })
            .then(res => res.ok ? res.text() : Promise.reject(res))
            .then(msg => {
                alert('✅ 上傳成功');
                console.log(msg);

                const sentenceId = `${scenarioId}-${start}-${end}`;

                // ✅ 儲存狀態
                localStorage.setItem(`uploaded-${sentenceId}`, 'true');

                // ✅ 加上顏色樣式
                sentenceBlock.classList.add('uploaded');
            })
            .catch(async err => {
                console.error('❌ 上傳失敗', err);
                let text = '❌ 上傳失敗';
                try {
                    const msg = await err.text?.();
                    if (msg) text += `：${msg}`;
                } catch (e) {}
                alert(text);
            });*/
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
            log('✅ 情境練習模組初始化完成');
        } else {
            log('❌ 尚未載入情境練習 DOM 元素，稍後再初始化', 'warn');
        }
    }, 200); // 等 DOM 有機會渲染
});
window.ytPlayer = null;
let currentVideoId = '';
let stopTimeout = null;
let ytPlayerReady = false;
function loadYouTubePlayerWhenReady() {
  //const script = document.createElement('script');
  //script.src = 'https://www.youtube.com/iframe_api';
  //document.head.appendChild(script);

  const waitForYT = setInterval(() => {
    if (window.YT && window.YT.Player) {
      clearInterval(waitForYT);
      console.log('✅ YT.Player 已載入，初始化播放器');

      window.ytPlayer = new YT.Player('youtube-player', {
        height: '400',
        width: '100%',
        videoId: '',
        playerVars: { controls: 1, rel: 0 },
        events: {
          'onReady': () => {
            ytPlayerReady = true;
            console.log('🎬 ytPlayer 初始化完成！開始綁定事件...');

            // ✅ ✅ ✅ 綁定在這裡
            bindPracticeVideoButtons();
            bindPracticeBackButton();

            log('✅ 情境練習模組初始化完成（YT onReady）');
          }
        }
      });
    }
  }, 100);
}

// ✅ DOM 渲染完成後啟動 YT 載入程序
document.addEventListener('DOMContentLoaded', () => {
  loadYouTubePlayerWhenReady();
});
// === 將函式掛到全域供 HTML 呼叫 ===
window.showScenario = showScenario;
window.goBackToChapterList = goBackToChapterList;
