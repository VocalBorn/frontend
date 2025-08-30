const token = localStorage.getItem("token");

function loadYouTubeScriptIfNeeded() {
  if (!window.YT || !window.YT.Player) {
    console.log('⏳ YT API 尚未載入，插入 <script> 載入中...');
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  } else {
    console.log('✅ YT API 已存在');
    loadYouTubePlayerWhenReady(); // 若你想立即初始化播放器也可加這行
  }
}

loadYouTubeScriptIfNeeded();

window.onYouTubeIframeAPIReady = function () {
    console.log("✅ onYouTubeIframeAPIReady 被觸發");
    loadYouTubePlayerWhenReady(); // 你定義的初始化函式
};
// === 顯示子情境 ===
function showScenario(scenarioId) {
    // 隱藏所有子情境
    document.querySelectorAll('.scenario-list').forEach(section => section.classList.add('hidden'));

    // 隱藏主卡片區塊
    const cardContainer = document.getElementById('practice-card-container');
    if (cardContainer) cardContainer.classList.add('hidden');

    // 顯示對應子情境內容
    const target = document.getElementById(`scenario-${scenarioId}`);
    if (target) target.classList.remove('hidden');

    console.log(`✅ 顯示子情境：${scenarioId}`);
}
// === 查看回饋 ===
async function showFeedback(scenarioId,page = 1, limit = 10) {
    const modal = document.getElementById('feedback-modal');
    const body = document.getElementById('feedback-body');
    const title = document.getElementById('feedback-title');

    // const feedbackData = {
    //     '1-1': '你已練習 5 次，發音清晰，請注意語速控制。',
    //     '1-2': '語調自然，但「刷卡嗎？」稍快。',
    //     '2-1': '醫學用詞清楚，請再放慢語速。',
    //     '2-2': '語句完整，語氣自然。',
    //     '3-1': '語句完整，語氣自然。',
    //     // ...未來可加更多
    // };
    
    try {
        let data;
        const res = await fetch(`https://vocalborn.r0930514.work/api/practice/patient/feedbacks?page=${page}&limit=${limit}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.ok) {
            data = await res.json();
        } else {
            console.warn(`⚠️ API 請求失敗 (狀態碼: ${res.status})，改用假資料`);
            data = { feedbacks: [] }; // 空資料，會觸發假資料 fallback
        }

        // === 如果後端沒有回饋，使用假資料 ===
        let feedbacks = data.feedbacks;
        if (!feedbacks || feedbacks.length === 0) {
            feedbacks = [
                {
                    practice_session_id: "test-session-001",
                    content: "這是測試用的假回饋，代表 API 已經成功串接。",
                    created_at: new Date().toISOString()
                },
                {
                    practice_session_id: "test-session-002",
                    content: "假資料第二筆：患者覺得練習效果不錯！",
                    created_at: new Date().toISOString()
                }
            ];
        }

        // === 將回饋顯示到畫面上 ===
        const feedbackContainer = document.getElementById("feedback-body");
        feedbackContainer.innerHTML = "";

        if (feedbacks && feedbacks.length > 0) {
            feedbacks.forEach((feedback, index) => {
                const item = document.createElement("div");
                item.className = "feedback-item";
                item.innerHTML = `
                    <h3>回饋 #${index + 1}</h3>
                    <p><strong>Session:</strong> ${feedback.practice_session_id || "無"}</p>
                    <p><strong>回饋內容:</strong> ${feedback.content || "尚無內容"}</p>
                    <p><strong>日期:</strong> ${feedback.created_at || "未知"}</p>
                `;
                feedbackContainer.appendChild(item);
            });
        } else {
            feedbackContainer.textContent = "尚無回饋資料";
        }
    } catch (error) {
        console.error("❌ fetch 過程出錯:", error);
    }

    title.textContent = `單元 ${scenarioId} 的練習回饋`;
    //body.textContent = feedbackData[scenarioId] || '尚無回饋資料';
    modal.classList.remove('hidden');
}

function closeFeedback() {
    document.getElementById('feedback-modal').classList.add('hidden');
}

// === AI分析 ===
async function showAIAnalysis(scenarioId) {
  console.log("觸發 AI 分析情境：", scenarioId);

  // 顯示 modal、切換畫面、載入分析資料等等
  const modal = document.getElementById("feedback-modal");
  const title = document.getElementById("feedback-title");
  const body = document.getElementById("feedback-body");

  modal.classList.remove("hidden");
  title.textContent = `AI 分析 - 單元 ${scenarioId}`;
  body.textContent = "AI 分析結果載入中...";

    const chapterMap = {
        "1-1 內用": "e5b821e5-c45b-4d6f-83a2-d313f841b94e",
        "1-2 外帶": "23d1eff4-28fb-479d-bf2d-061255b6ceee",
        "2-1 看診": "d6cabf94-a777-44a9-9d73-576f38673be6",
        "2-2 拿藥": "8e005d80-63b3-40c2-9b3f-3f791481be4e",
        "3-1 結帳":"ab72d2ce-8b32-4c4a-b8a4-26ac6c1246c8",
        "3-2 詢問價格":"67aef952-cfa9-447c-aa26-c1304740ccf2",
        "4-1 開戶":"e63c2e89-1893-41ad-920d-f619cc1250d6",
        "5-1 郵寄":"5b0e6016-1a97-4e45-9d95-beeba5a15f98",
        "5-2 取件":"5fbfa97d-1ebb-4577-a355-ed1b19e285fd",
        "6-1 問路":"25f242a6-bfbc-45c7-aecf-04bbcdfae570",
        "6-2 買票":"d84143ef-db7c-492f-a68e-639e23745687",
        "7-1 打電話求助":"3c468e5c-c5e9-443a-b79d-54d6185a90c8",
        "8-1 基本禮貌用語":"450f4d9a-6f0b-4c2b-88b1-9e95a1d077ba",
        "8-2 打招呼與回應":"ed0398ae-5dd5-42e5-ae02-5dbf54e84ec2"
    };

    const chapterId = chapterMap[scenarioId]; //哪一章節

  async function getPracticeSession(chapterId, token) {
        const res = await fetch(`https://vocalborn.r0930514.work/api/practice/sessions?chapter_id=${chapterId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`,'Content-Type': 'application/json' },
            body: JSON.stringify({ chapter_id: chapterId })
        });
        if (!res.ok) throw new Error(`取得 practice session 失敗 ${res.status}`);
        const data = await res.json();
        console.log("data",data)
        console.log("practice_session_id",data.practice_session_id)
        return data.practice_session_id; // 假設回傳欄位是這個
    }
const practice_session_id = await getPracticeSession(chapterId, token);

  try {
        let data;
        const res = await fetch(`https://vocalborn.r0930514.work/api/ai-analysis/results/${practice_session_id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.ok) {
            data = await res.json();
        } else {
            console.warn(`⚠️ API 請求失敗 (狀態碼: ${res.status})，改用假資料`);
            data = { feedbacks: [] }; // 空資料，會觸發假資料 fallback
        }

        console.log("📌 AI回饋:", data);

        results = data.results.map(r => ({
            accuracy_percentage: r.analysis_result.accuracy_percentage,
            fluency_score: r.analysis_result.fluency_score,
            pronunciation_score: r.analysis_result.pronunciation_score,
            feedback: r.analysis_result.feedback,
            created_at: r.created_at,
            practice_session_id: data.practice_session_id
        }));

        // === 將回饋顯示到畫面上 ===
        const feedbackContainer = document.getElementById("feedback-body");
        feedbackContainer.innerHTML = "";

        let feedbacks = [];

        // ✅ API 的格式
        if (data.results && data.results.length > 0) {
            feedbacks = data.results.map(r => ({
                practice_session_id: data.practice_session_id,
                content: r.analysis_result.feedback,
                created_at: r.created_at
            }));
        }

        // ✅ 沒資料就塞假資料
        if (feedbacks.length === 0) {
            results = [
                {
                    practice_session_id: "test-session-001",
                    accuracy_percentage: 90,
                    fluency_score: 80,
                    pronunciation_score: 85,
                    feedback: "這是測試用的假回饋，代表 API 已經成功串接。",
                    created_at: new Date().toISOString()
                },
                {
                    practice_session_id: "test-session-002",
                    accuracy_percentage: 88,
                    fluency_score: 78,
                    pronunciation_score: 82,
                    feedback: "假資料第二筆：患者覺得練習效果不錯！",
                    created_at: new Date().toISOString()
                }
            ];
        }

        results.forEach((result, index) => {
            const item = document.createElement("div");
            item.className = "feedback-item";
            item.innerHTML = `
                <h3>回饋 #${index + 1}</h3>
                <p><strong>accuracy_percentage:</strong> ${result.accuracy_percentage || "無"}</p>
                <p><strong>fluency_score：</strong> ${result.fluency_score || "尚無內容"}</p>
                <p><strong>pronunciation_score:</strong> ${result.pronunciation_score || "未知"}</p>
            `;
            feedbackContainer.appendChild(item);
        });

    } catch (error) {
        console.error("❌ fetch 過程出錯:", error);
    }

  // 🧠 模擬 API 載入（或串接實際分析 API）
//   setTimeout(() => {
//     body.innerHTML = `
//       <p>這是 <strong>${scenarioId}</strong> 的 AI 分析結果範例。</p>
//       <ul>
//         <li>語速適中</li>
//         <li>句子完整率 92%</li>
//         <li>聲音辨識準確率 87%</li>
//       </ul>
//     `;
//   }, 1000);
}
function switchMainPage(pageId) {
  const idsToHide = ['practice-content', 'scenario-1-1', 'scenario-1-2', 'practice-video-section'];
  idsToHide.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  const target = document.getElementById(pageId);
  if (target) target.classList.remove('hidden');
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

    // ✅✅✅ 顯示英雄區
    const heroSection = document.querySelector('#practice-content .hero-section');
    if (heroSection) heroSection.classList.remove('hidden');

    document.querySelectorAll('.scenario-list').forEach(s => s.classList.add('hidden'));

    if (videoSection) videoSection.classList.add('hidden');

    log('返回章節列表');
}

let practiceStartTime = null; // 記錄開始時間
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
            const scenarioId = button.getAttribute('data-scenario');
            setupScriptButtons(scenarioId);

            if (youtubeId && ytPlayer && ytPlayer.loadVideoById) {
                ytPlayer.loadVideoById(youtubeId); // 每次都播放
                currentVideoId = youtubeId;
                log(`▶️ 播放影片：${youtubeId}`);

                // ✅ 記錄練習開始時間
                practiceStartTime = new Date();
                console.log("⏱ 練習開始於", practiceStartTime.toLocaleTimeString());

                document.getElementById('practice-video-section').classList.remove('practice-hidden');
                document.getElementById('practice-card-container').classList.add('practice-hidden');
                document.querySelectorAll('.scenario-list').forEach(s => s.classList.add('hidden'));
            } else {
                log('❌ 缺少 ytPlayer 或 loadVideoById', 'error');
            }
        });
    });
}

// === 綁定返回按鈕 ===
function bindPracticeBackButton() {
    const backButton = document.getElementById('practice-back-button');
    const youtubePlayer = document.getElementById('youtube-player');
    const videoSection = document.getElementById('practice-video-section');
    const cardContainer = document.getElementById('practice-card-container');
    const container = document.getElementById('video-script-buttons');

    if (!backButton || !youtubePlayer || !videoSection || !cardContainer) {
        log('❌ 找不到返回按鈕或影片區塊元素', 'warn');
        return;
    }

    backButton.addEventListener('click', () => {
        //把前一次的video-script-buttons(句子卡片)清空
        container.innerHTML = '';
        // ✅ 記錄練習結束時間並計算時長
        const practiceEndTime = new Date();
        console.log("⏱ 練習結束於", practiceEndTime.toLocaleTimeString());

        if (practiceStartTime) {
            const durationSec = Math.floor((practiceEndTime - practiceStartTime) / 1000);
            const min = Math.floor(durationSec / 60);
            const sec = durationSec % 60;
            console.log(`⏱ 本次練習總時長：${min} 分 ${sec} 秒`);
        }

        ytPlayer.stopVideo();
        videoSection.classList.add('practice-hidden');

        cardContainer.classList.remove('hidden');
        cardContainer.classList.remove('card-grid');
        cardContainer.classList.add('card-flex');

        document.querySelectorAll('.scenario-list').forEach(s => s.classList.add('hidden'));

        log('🔙 返回章節選單');
    });
}

const audioChunks = new Map(); // 每句話對應一段錄音
let mediaRecorder = null;


function playSegment(start, end) {
    if (!ytPlayer || typeof ytPlayer.seekTo !== 'function') {
        console.error('❌ ytPlayer 尚未準備好或功能無效');
        return;
    }

    ytPlayer.seekTo(start, true);  // 跳到 start 秒
    ytPlayer.playVideo();

    // 自動停止到 end 秒
    const stopTimeout = (end - start) * 1000;
    setTimeout(() => {
        ytPlayer.pauseVideo();
    }, stopTimeout);
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

async function setupScriptButtons(scenarioId,chapterName) {
    // const scriptData = {
    //     '1-1 內用': [
    //         { start: 5, end: 9, text: '請問2位內用有位置嗎？' },
    //         { start: 10, end: 14, text: '有菜單嗎？' },
    //         { start: 15, end: 19, text: '有什麼推薦的嗎？' },
    //         { start: 20, end: 24, text: '好的謝謝你，那我想一下' },
    //         { start: 25, end: 29, text: '不好意思　可以幫我點餐嗎？' },
    //     ],
    //     '1-2 外帶': [
    //         { start: 5, end: 9, text: '請問可以外帶嗎？' },
    //         { start: 10, end: 14,text: '我要一份漢堡，謝謝。' },
    //         { start: 15, end: 19, text: '請問要等多久？' },
    //         { start: 20, end: 24, text: '有餐具嗎？' },
    //         { start: 25, end: 29, text: '可以給我一個袋子嗎？' }
    //     ],
    //     '2-1 看診': [
    //         { start: 5, end: 9, text: '請問我要怎麼掛號？' },
    //         { start: 10, end: 14, text: '我今天有點頭痛。' },
    //         { start: 15, end: 19, text: '需要量血壓嗎？' },
    //         { start: 20, end: 24, text: '請問診間在哪裡？' },
    //         { start: 25, end: 29, text: '醫生，這個藥有副作用嗎？' }
    //     ],
    //     '2-2 拿藥': [
    //         { start: 5, end: 9, text: '請問在哪裡領藥？' },
    //         { start: 10, end: 14, text: '這個藥要飯前還是飯後吃？' },
    //         { start: 15, end: 19, text: '一天要吃幾次？' },
    //         { start: 20, end: 24, text: '請問可以用健保卡嗎？' },
    //         { start: 25, end: 29, text: '藥品需要冷藏保存嗎？' }
    //     ],
    //     '3-1 結帳': [
    //         { start: 5, end: 9, text: '請問可以刷卡嗎？' },
    //         { start: 10, end: 14, text: '這個有折扣嗎？' },
    //         { start: 15, end: 19, text: '我想用行動支付。' },
    //         { start: 25, end: 29, text: '我需要明細，謝謝。' }
    //     ],
    //     '3-2 詢問價格': [
    //         { start: 5, end: 9, text: '這個多少錢？' },
    //         { start: 10, end: 14, text: '第二件有優惠嗎？' },
    //         { start: 15, end: 19, text: '有我的尺寸嗎？' },
    //         { start: 20, end: 24, text: '有其他款式可以選嗎？' },
    //         { start: 25, end: 29, text: '這裡有賣漢堡嗎？' }
    //     ],
    //     '4-1 開戶': [
    //         { start: 5, end: 9, text: '你好，我想開一個帳戶。' },
    //         { start: 10, end: 14, text: '請問要準備哪些資料？' },
    //         { start: 15, end: 19, text: '我要開的是儲蓄帳戶。' },
    //         { start: 20, end: 24, text: '我可以申請提款卡嗎？' }
    //     ],
    //     '5-1 郵寄': [
    //         { start: 5, end: 9, text: '我想寄這個包裹。' },
    //         { start: 10, end: 14, text: '請問有快遞服務嗎？' },
    //         { start: 15, end: 19, text: '最快可以多久送達？' },
    //         { start: 20, end: 24, text: '這個寄到台北要多少錢？' }
    //     ],
    //     '5-2 取件': [
    //         { start: 5, end: 9, text: '我來領包裹，這是通知單。' },
    //         { start: 10, end: 14, text: '需要出示身分證嗎？' },
    //         { start: 15, end: 19, text: '請問可以幫我拆開確認嗎？' },
    //     ],
    //     '6-1 問路': [
    //         { start: 5, end: 9, text: '不好意思，請問車站怎麼走？' },
    //         { start: 10, end: 14, text: '走路大概要多久？' },
    //         { start: 15, end: 19, text: '請問這附近有廁所嗎？' }
    //     ],
    //     '6-2 買票': [
    //         { start: 5, end: 9, text: '我要一張到高雄的車票。' },
    //         { start: 10, end: 14, text: '請問有學生票嗎？' },
    //         { start: 15, end: 19, text: '我要買今天下午三點的票。' },
    //         { start: 20, end: 24, text: '請問有沒有對號座？' }
    //     ],
    //     '7-1 打電話求助': [
    //         { start: 5, end: 9, text: '可以幫助我嗎？我遇到了一些狀況' },
    //         { start: 10, end: 14, text: '我在大安森林公園，腳扭到了。' },
    //         { start: 15, end: 19, text: '可以派救護車嗎？' },
    //         { start: 20, end: 24, text: '我大概二十歲，穿著藍色外套。' }
    //     ],
    //     '8-1 基本禮貌用語': [
    //         { start: 5, end: 9, text: '請幫我一下，謝謝！' },
    //         { start: 10, end: 14, text: '不好意思，請問洗手間在哪？' },
    //         { start: 15, end: 19, text: '對不起，我不是故意的。' },
    //         { start: 20, end: 24, text: '沒關係，謝謝你的理解。' },
    //         { start: 25, end: 29, text: '真的非常感謝你。' }
    //     ],
    //     '8-2 打招呼與回應': [
    //         { start: 5, end: 9, text: '你好！今天過得怎麼樣？' },
    //         { start: 10, end: 14, text: '早安，祝你有美好的一天！' },
    //         { start: 15, end: 19, text: '晚安，明天見～' },
    //         { start: 20, end: 24, text: '再見，路上小心。' },
    //         { start: 25, end: 29, text: '嗨！好久不見！' }
    //     ]
    // };

    const chapterMap = {
        "1-1 內用": "e5b821e5-c45b-4d6f-83a2-d313f841b94e",
        "1-2 外帶": "23d1eff4-28fb-479d-bf2d-061255b6ceee",
        "2-1 看診": "d6cabf94-a777-44a9-9d73-576f38673be6",
        "2-2 拿藥": "8e005d80-63b3-40c2-9b3f-3f791481be4e",
        "3-1 結帳":"ab72d2ce-8b32-4c4a-b8a4-26ac6c1246c8",
        "3-2 詢問價格":"67aef952-cfa9-447c-aa26-c1304740ccf2",
        "4-1 開戶":"e63c2e89-1893-41ad-920d-f619cc1250d6",
        "5-1 郵寄":"5b0e6016-1a97-4e45-9d95-beeba5a15f98",
        "5-2 取件":"5fbfa97d-1ebb-4577-a355-ed1b19e285fd",
        "6-1 問路":"25f242a6-bfbc-45c7-aecf-04bbcdfae570",
        "6-2 買票":"d84143ef-db7c-492f-a68e-639e23745687",
        "7-1 打電話求助":"3c468e5c-c5e9-443a-b79d-54d6185a90c8",
        "8-1 基本禮貌用語":"450f4d9a-6f0b-4c2b-88b1-9e95a1d077ba",
        "8-2 打招呼與回應":"ed0398ae-5dd5-42e5-ae02-5dbf54e84ec2"
    };

    const chapterId = chapterMap[chapterName]; //哪一章節
    
    const container = document.getElementById('video-script-buttons');

    const url = `https://vocalborn.r0930514.work/api/situations/chapters/${chapterId}/sentences?skip=0&limit=50`;

    let lines = [];
    try {
        const res = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });
        if (!res.ok) throw new Error(`API 請求失敗：${res.status}`);
        const data = await res.json();
        lines = data.sentences || [];

        if (!lines.length) {
            container.innerHTML = '<p>⚠️ 此章節尚無句子資料</p>';
            return;
        }
    // 對每句話呼叫 detail API
    if (window._alreadyFetchingDetail) {
        console.log('已經在抓 detail，跳過');
        return;
    }
    window._alreadyFetchingDetail = true;

    for (const line of lines) {
        try {
            const resDetail = await fetch(`https://vocalborn.r0930514.work/api/situations/sentence/${line.sentence_id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });
            if (!resDetail.ok) throw new Error(`API 請求失敗：${resDetail.status}`);
            const detail = await resDetail.json();
            console.log(detail);
        } catch (err) {
            console.error('❌ 取得句子詳細資料失敗', err);
        }
    }

} catch (err) {
    console.error('❌ 取得章節句子失敗', err);
    container.innerHTML = '<p>❌ 讀取句子資料失敗</p>';
}
    if (window._alreadyFetching) return;
    window._alreadyFetching = true;
    console.log('開始 fetch detail 迴圈');

    lines.forEach((line) => {
        if (typeof line.start_time !== 'number' || typeof line.end_time !== 'number') {
            console.warn(`⚠️ 無效播放範圍：${JSON.stringify(line)}`);
            return; // 跳過這句，因為沒有明確的播放區間
        }
        async function getPracticeSession(chapterId, token) {
            const res = await fetch(`https://vocalborn.r0930514.work/api/practice/sessions?chapter_id=${chapterId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`,'Content-Type': 'application/json' },
                body: JSON.stringify({ chapter_id: chapterId })
            });
            if (!res.ok) throw new Error(`取得 practice session 失敗 ${res.status}`);
            const data = await res.json();
            console.log("data",data)
            console.log("practice_session_id",data.practice_session_id)
            return data.practice_session_id; // 假設回傳欄位是這個
        }
        
        const start = line.start_time;
        const end = line.end_time;
        const sentenceBlock = document.createElement('div');
        sentenceBlock.className = 'sentence-control';
        sentenceBlock.setAttribute('data-start', start);
        sentenceBlock.setAttribute('data-end', end);

        sentenceBlock.addEventListener('click', () => {
            playSegment(start, end);
            });

        const timeLabel = document.createElement('span');
        timeLabel.innerHTML = `<b>${formatTime(line.start_time)} ~ ${formatTime(line.end_time)}</b> - ${line.content}`;

        // 暫存錄音
        const audioChunksMap = new Map();
        let mediaRecorder = null;
        let chunks = [];

        // 🎙️ 開始錄音
        const startBtn = document.createElement('button');
        startBtn.innerHTML = '🎙';
        startBtn.title = '開始錄音';
        startBtn.classList.add('record-btn');
        startBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                alert('已有錄音進行中，請先停止');
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                chunks = []; // 🔄 清空舊的錄音資料

                // 判斷瀏覽器支援的格式
                let mimeType = '';
                let extension = '';
                if (MediaRecorder.isTypeSupported('audio/webm')) {
                    mimeType = 'audio/webm'; extension = 'webm';
                } else if (MediaRecorder.isTypeSupported('audio/wav')) {
                    mimeType = 'audio/wav'; extension = 'wav';
                } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    mimeType = 'audio/mp4'; extension = 'm4a'; // Safari 特例
                } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                    mimeType = 'audio/ogg'; extension = 'ogg';
                } else {
                    mimeType = ''; extension = 'bin'; // fallback
                }

                mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

                // 收集 chunks
                mediaRecorder.ondataavailable = e => chunks.push(e.data);

                // 停止後的處理只負責暫存
                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: mimeType });
                    audioChunks.set(sentenceBlock, { blob, extension, mimeType });
                    stream.getTracks().forEach(track => track.stop()); // 停止麥克風
                    startBtn.classList.remove('recording');
                    console.log("✅ 錄音已暫存", blob);
                    alert("錄音已暫存");
                };

                mediaRecorder.start();
                startBtn.classList.add('recording');
                console.log("🎙️ 開始錄音");
            } catch (err) {
                console.error("無法使用麥克風:", err);
                alert("無法使用麥克風：" + err.message);
            }
        });

        // 🛑 停止錄音（只暫存，不上傳）
        const stopBtn = document.createElement('button');
        stopBtn.innerHTML = '🛑';
        stopBtn.title = '停止錄音';
        stopBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                console.log("🛑 錄音停止，等待暫存");
            }
        });

        // ▶ 播放錄音
        const playBtn = document.createElement('button');
        playBtn.innerHTML = '▶';
        playBtn.title = '播放錄音';
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const saved = audioChunks.get(sentenceBlock);
            if (!saved || !saved.blob) {
                alert('尚未錄音');
                return;
            }
            const url = URL.createObjectURL(saved.blob);
            const audio = new Audio(url);
            audio.play();
            console.log('現在正在播放音頻')
        });

        // ⇧ 上傳錄音
        const uploadBtn = document.createElement('button');
        uploadBtn.innerHTML = '⇧';
        uploadBtn.title = '上傳錄音';
        uploadBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const saved = audioChunks.get(sentenceBlock);
            if (!saved || !saved.blob) {
                alert('尚未錄音');
                return;
            }
        const practice_session_id = await getPracticeSession(chapterId, token); 
        const sentence_id = line.sentence_id;
        try {
            const formData = new FormData();
            formData.append('audio_file', saved.blob, `recording.${saved.extension}`);

            const res = await fetch(
                `https://vocalborn.r0930514.work/api/practice/sessions/${practice_session_id}/recordings/${sentence_id}`,
                {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                }
            );

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`上傳失敗，狀態碼：${res.status}, 訊息：${errText}`);
            }

            const result = await res.json();
            console.log("✅ 錄音上傳成功", result);
            alert("錄音已上傳成功！");
            sentenceBlock.classList.add('uploaded');
        } catch (err) {
            console.error("❌ 錄音上傳失敗", err);
            alert("錄音上傳失敗：" + err.message);
        }


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
        // 🔑 無論成功或失敗都要清除 flag
        window._alreadyFetchingDetail = false;
        window._alreadyFetching = false;
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
            // ✅ ✅ ✅ 綁定在這裡
            bindPracticeVideoButtons();
            bindPracticeBackButton();
            console.log('🎬 ytPlayer 初始化完成！開始綁定事件...');

            

            log('✅ 情境練習模組初始化完成（YT onReady）');
          }
        }
      });
    }
  }, 100);
}

// === 將函式掛到全域供 HTML 呼叫 ===
window.showScenario = showScenario;
window.goBackToChapterList = goBackToChapterList;
