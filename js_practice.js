const token = localStorage.getItem("token");
let practice_session_id = localStorage.getItem("practice_session_id"); // 🔑 全域共用

async function getPracticeSession(chapterId, token) {
    if (practice_session_id) {
        return practice_session_id; // 直接用現有的，不要重建
    }

    const res = await fetch(CONFIG.getApiUrl(`/practice/sessions`), {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ chapter_id: chapterId })
    });

    if (!res.ok) throw new Error(`建立 practice session 失敗 ${res.status}`);
    const data = await res.json();
    practice_session_id = data.practice_session_id;
    localStorage.setItem("practice_session_id", practice_session_id);

    console.log("✅ 建立新的 practice session:", practice_session_id);
    return practice_session_id;
}

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
async function showFeedback(scenarioId, page = 1, limit = 10) {
    const modal = document.getElementById('feedback-modal');
    const feedbackContainer = document.getElementById('feedback-body');
    const title = document.getElementById('feedback-title');

    try {
        let data;
        const res = await fetch(CONFIG.getApiUrl(`/practice/patient/feedbacks?page=${page}&limit=${limit}`),
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (res.ok) {
            data = await res.json();
        } else {
            console.warn(`⚠️ API 請求失敗 (狀態碼: ${res.status})，改用空資料`);
            data = { feedbacks: [] };
        }

        // 取得所有回饋
        let feedbacks = data.feedbacks || [];

        // === 過濾：只顯示對應章節 (chapter_name 開頭等於 scenarioId) ===
        feedbacks = feedbacks.filter(fb => fb.chapter_name.startsWith(scenarioId));

        // 如果沒有回饋 → 顯示提示
        if (feedbacks.length === 0) {
            feedbackContainer.innerHTML = `<p>單元 ${scenarioId} 尚無回饋資料</p>`;
        } else {
            feedbacks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const latestFeedback = feedbacks[0];

            // 格式化時間顯示
            const formatDateTime = (dateString) => {
                const date = new Date(dateString);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}`;
            };

            // 更新標題，加入回饋時間
            const feedbackTime = formatDateTime(latestFeedback.created_at);
            title.textContent = `單元 ${scenarioId} 的練習回饋 (回饋時間: ${feedbackTime})`;

            feedbackContainer.innerHTML = "";

            // 建立回饋卡片
            const feedbackCard = document.createElement("div");
            feedbackCard.className = "therapist-feedback-card";

            // 治療師資訊區塊
            const therapistInfo = document.createElement("div");
            therapistInfo.className = "therapist-info";
            therapistInfo.innerHTML = `
                <div class="therapist-header">
                    <span class="therapist-icon">👨‍⚕️</span>
                    <div class="therapist-details">
                        <div class="therapist-name">${latestFeedback.therapist_name || "未知治療師"}</div>
                        <div class="feedback-date">${feedbackTime}</div>
                    </div>
                </div>
            `;
            feedbackCard.appendChild(therapistInfo);

            // 回饋內容區塊
            const feedbackContent = document.createElement("div");
            feedbackContent.className = "therapist-feedback-content";
            feedbackContent.textContent = latestFeedback.content || "尚無內容";
            feedbackCard.appendChild(feedbackContent);

            feedbackContainer.appendChild(feedbackCard);
        }

    } catch (error) {
        console.error("❌ fetch 過程出錯:", error);
        feedbackContainer.textContent = "載入回饋時發生錯誤";
    }

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

//   async function getPracticeSession(chapterId, token) {
//         const res = await fetch(CONFIG.getApiUrl(`/practice/sessions?chapter_id=${chapterId}`), {
//             method: 'POST',
//             headers: { 'Authorization': `Bearer ${token}`,'Content-Type': 'application/json' },
//             body: JSON.stringify({ chapter_id: chapterId })
//         });
//         if (!res.ok) throw new Error(`取得 practice session 失敗 ${res.status}`);
//         const data = await res.json();
//         console.log("data",data)
//         console.log("practice_session_id",data.practice_session_id)
//         return data.practice_session_id; // 假設回傳欄位是這個
//     }
// const practice_session_id = await getPracticeSession(chapterId, token);

    try {
            // === 第一步：查詢該章節的所有練習紀錄 ===
            const sessionsRes = await fetch(CONFIG.getApiUrl(`/practice/sessions?skip=0&limit=100&chapter_id=${chapterId}`), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!sessionsRes.ok) {
                throw new Error(`取得練習紀錄失敗 ${sessionsRes.status}`);
            }

            const sessionsData = await sessionsRes.json();
            console.log("📂 該章節的所有練習紀錄：", sessionsData);
            

            // === 第二步：抓出最新一筆練習（最後一次） ===
            if (!sessionsData || !sessionsData.practice_sessions || sessionsData.practice_sessions.length === 0) {
            body.textContent = "目前沒有可供分析的練習紀錄。";
            return;
            }

            // 從物件中取出練習列表
            const list = sessionsData.practice_sessions;
            // 過濾出已完成的練習
            const completedSessions = list.filter(s => s.session_status === "completed");

            if (completedSessions.length === 0) {
            body.textContent = "目前沒有已完成的練習紀錄。";
            return;
            }

            // 依 created_at 由新到舊排序
            const sortedSessions = completedSessions.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );

            // 抓出最新一筆
            const latestSession = sortedSessions[0];
            const practice_session_id = latestSession.practice_session_id;
            console.log("🆕 最新練習 session_id:", practice_session_id);

            // 格式化時間顯示
            const formatDateTime = (dateString) => {
                const date = new Date(dateString);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}`;
            };

            // 更新標題，加入練習時間
            const practiceTime = formatDateTime(latestSession.begin_time);
            title.textContent = `AI 分析 - 單元 ${scenarioId}`;

            let data;
            const res = await fetch(CONFIG.getApiUrl(`/ai-analysis/results/${practice_session_id}`), {
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
                data = { results: [] };
            }
            console.log("📌 AI回饋:", data);

            // === 將回饋顯示到畫面上 ===
            const feedbackContainer = document.getElementById("feedback-body");
            feedbackContainer.innerHTML = "";

            // 建立練習統計資訊區塊
            const practiceInfoDiv = document.createElement("div");
            practiceInfoDiv.className = "practice-session-info";

            const durationMin = Math.floor(latestSession.total_duration / 60);
            const durationSec = latestSession.total_duration % 60;
            const durationText = durationMin > 0
                ? `${durationMin} 分 ${durationSec} 秒`
                : `${durationSec} 秒`;

            practiceInfoDiv.innerHTML = `
                <h4>📊 本次練習統計</h4>
                <div class="practice-stats-grid">
                    
                    <div class="stat-item">
                        <span class="stat-label">練習時長</span>
                        <span class="stat-value">${durationText}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">完成進度</span>
                        <span class="stat-value">${latestSession.completed_sentences} / ${latestSession.total_sentences} 句</span>
                    </div>
                </div>
            `;
            feedbackContainer.appendChild(practiceInfoDiv);

            // 新增分隔線
            const separator = document.createElement("hr");
            separator.className = "analysis-separator";
            feedbackContainer.appendChild(separator);

            if (data.results && data.results.length > 0) {
                // 反轉順序，讓最早的分析顯示在最前面（建議1）
                const orderedResults = [...data.results].reverse();

                // 新增標題
                const suggestionsTitle = document.createElement("h4");
                suggestionsTitle.textContent = "💡 AI 分析建議";
                suggestionsTitle.style.marginTop = "20px";
                suggestionsTitle.style.marginBottom = "15px";
                feedbackContainer.appendChild(suggestionsTitle);

                orderedResults.forEach((r, index) => {
                    // 建立主容器
                    const suggestionCard = document.createElement("div");
                    suggestionCard.className = "suggestion-card";

                    // 建立標題區塊
                    const cardHeader = document.createElement("div");
                    cardHeader.className = "suggestion-card-header";
                    cardHeader.innerHTML = `
                        <span class="suggestion-number">建議 ${index + 1}</span>
                    `;
                    suggestionCard.appendChild(cardHeader);

                    // 顯示參考句子和使用者說的句子
                    if (r.analysis_result.similarity) {
                        const sentenceInfo = document.createElement("div");
                        sentenceInfo.className = "sentence-comparison";

                        // 計算相似度等級和顏色
                        const similarity = r.analysis_result.similarity.emb * 100;
                        let similarityClass = '';
                        let similarityLabel = '';
                        if (similarity >= 90) {
                            similarityClass = 'excellent';
                            similarityLabel = '優秀';
                        } else if (similarity >= 70) {
                            similarityClass = 'good';
                            similarityLabel = '良好';
                        } else if (similarity >= 50) {
                            similarityClass = 'fair';
                            similarityLabel = '尚可';
                        } else {
                            similarityClass = 'poor';
                            similarityLabel = '需加強';
                        }

                        sentenceInfo.innerHTML = `
                            <div class="sentence-row">
                                <span class="sentence-label">📝 參考句子：</span>
                                <span class="sentence-text">${r.analysis_result.similarity.txt_ref}</span>
                            </div>
                            <div class="sentence-row">
                                <span class="sentence-label">🎤 您說的是：</span>
                                <span class="sentence-text">${r.analysis_result.similarity.txt_sam}</span>
                            </div>
                            <div class="sentence-row">
                                <span class="sentence-label">📊 相似度：</span>
                                <span class="similarity-badge ${similarityClass}">${similarity.toFixed(1)}% - ${similarityLabel}</span>
                            </div>
                        `;
                        suggestionCard.appendChild(sentenceInfo);
                    }

                    // 建立建議內容
                    const suggestionContent = document.createElement("div");
                    suggestionContent.className = "suggestion-content";
                    suggestionContent.textContent = r.analysis_result.suggestions;
                    suggestionCard.appendChild(suggestionContent);

                    feedbackContainer.appendChild(suggestionCard);
                });
            } else {
                feedbackContainer.innerHTML += "<p>目前沒有 AI 建議結果</p>";
            }
            console.log("📌 AI 回饋已載入", data);

        } catch (error) {
            console.error("❌ fetch 過程出錯:", error);
            body.textContent = "❌ AI 分析失敗";
        }
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

// === 建立會話 ===
let isCreatingSession = false;

// 已建立的 session 會存到 localStorage，key 可以用 chapterName
async function createPracticeSession(chapterName) {
    if (isCreatingSession) {
        console.warn("⚠️ 已在建立中，忽略重複呼叫");
        return;
    }
    isCreatingSession = true;
    // 映射章節ID
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

    const chapterId = chapterMap[chapterName];

    if (!chapterId) {
        console.error("找不到對應的章節ID");
        return;
    }

    // 檢查 localStorage 是否已有 session
    const storedSessionId = localStorage.getItem(`practiceSession_${chapterName}`);

    if (storedSessionId) {
        // 詢問使用者是否延續
        const continueSession = confirm("是否要延續之前的練習？\n按下『好』延續，『取消』開始新的練習。");

        if (continueSession) {
            console.log("📌 已有會話，使用現有的 sessionId:", storedSessionId);
            practice_session_id = storedSessionId;
            return storedSessionId;
        } else {
            // 使用者選擇新練習 → 移除舊的 sessionId
            localStorage.removeItem(`practiceSession_${chapterName}`);
        }
    }

    // 沒有舊會話，或使用者選擇建立新會話 → 建立新會話
    try {
        const res = await fetch(CONFIG.getApiUrl(`/practice/sessions`), {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ chapter_id: chapterId })
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`練習會話建立失敗，狀態碼：${res.status}, 訊息：${errText}`);
        }

        const result = await res.json();
        practice_session_id = result.practice_session_id;

        // 儲存到 localStorage
        localStorage.setItem(`practiceSession_${chapterName}`, practice_session_id);

        console.log("✅ 新練習會話建立成功", practice_session_id);
        return practice_session_id;

    } catch (err) {
        console.error("❌ 練習會話建立失敗", err);
    } finally {
        isCreatingSession = false;
    }
}
    // === 完成會話 ===
    function completePracticeButton() {
        const btn = document.getElementById('practice-complete-button');
        btn.replaceWith(btn.cloneNode(true)); // 移除舊事件
        const newBtn = document.getElementById('practice-complete-button');

        newBtn.addEventListener('click', async () => {
            if (!practice_session_id) {
                alert("❌ 尚未建立練習會話");
                return;
            }

            try {
                const res = await fetch(CONFIG.getApiUrl(`/practice/sessions/${practice_session_id}/complete`),
                    {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${token}` },
                    }
                );
                if (!res.ok) throw new Error(`完成練習失敗 ${res.status}`);
                const data = await res.json();
                console.log("✅ 完成練習成功", data);
                alert("🎉 練習已完成！");
                //newBtn.textContent = "已完成 ✔️";
            } catch (err) {
                console.error(err);
                alert("❌ 完成練習失敗：" + err.message);
            }

            // //  觸發 AI 分析
            //     const triggerRes = await fetch(
            //         CONFIG.getApiUrl(`/ai-analysis/trigger/${practice_session_id}`),
            //         {
            //             method: "POST",
            //             headers: {
            //                 "Authorization": `Bearer ${token}`,
            //                 "Content-Type": "application/json"
            //             },
            //             body: JSON.stringify({})
            //         }
            //     );

                // if (!triggerRes.ok) {
                //     const errText = await triggerRes.text();
                //     throw new Error(`觸發 AI 分析失敗 ${triggerRes.status}, 訊息：${errText}`);}
                // const triggerData = await triggerRes.json();
                // console.log("⚡ AI 分析已觸發:", triggerData);

                // 3️⃣ 等待 AI 分析完成 (先等 3 秒，避免拿不到結果)
                await new Promise(resolve => setTimeout(resolve, 3000));
        });
    }   


async function setupScriptButtons(scenarioId,chapterName) {

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
    //practice_session_id = await getPracticeSession(chapterId, token);
    completePracticeButton();

    //取得語句列表
    const url = CONFIG.getApiUrl(`/situations/chapters/${chapterId}/sentences?skip=0&limit=50`);
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
        // 🔑 按時間順序排列
        lines.sort((a, b) => a.start_time - b.start_time);
        
        // 對每句話呼叫 detail API
        if (window._alreadyFetchingDetail) {
            console.log('已經在抓 detail，跳過');
            return;
        }
        window._alreadyFetchingDetail = true;
        //取得語句詳情
        for (const line of lines) {
            try {
                const resDetail = await fetch(CONFIG.getApiUrl(`/situations/sentence/${line.sentence_id}`), {
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

    // async function getPracticeSession(chapterId, token) {
    //         const res = await fetch(CONFIG.getApiUrl(`/practice/sessions?chapter_id=${chapterId}`), {
    //             method: 'POST',
    //             headers: { 'Authorization': `Bearer ${token}`,'Content-Type': 'application/json' },
    //             body: JSON.stringify({ chapter_id: chapterId })
    //         });
    //         if (!res.ok) throw new Error(`取得 practice session 失敗 ${res.status}`);
    //         const data = await res.json();
    //         console.log("data",data)
    //         console.log("practice_session_id",data.practice_session_id)
    //         return data.practice_session_id; // 假設回傳欄位是這個
    //     }

    lines.forEach((line) => {
        if (typeof line.start_time !== 'number' || typeof line.end_time !== 'number') {
            console.warn(`⚠️ 無效播放範圍：${JSON.stringify(line)}`);
            return; // 跳過這句，因為沒有明確的播放區間
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
        timeLabel.innerHTML = `<b>${formatVideoTime(line.start_time)} ~ ${formatVideoTime(line.end_time)}</b> - ${line.content}`;

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
                if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    mimeType = 'audio/mp4'; extension = 'm4a'; // 優先使用 m4a
                } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                    mimeType = 'audio/webm'; extension = 'webm';
                } else if (MediaRecorder.isTypeSupported('audio/wav')) {
                    mimeType = 'audio/wav'; extension = 'wav';
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

        // ⇧ 上傳錄音（FormData + audio_duration）
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

            try {
                // 1️⃣ 取得 practice_session_id
                const practice_session_id = await getPracticeSession(chapterId, token);
                const sentence_id = line.sentence_id;

                // 2️⃣ 取得音檔長度
                const audioUrl = URL.createObjectURL(saved.blob);
                const audioElement = new Audio(audioUrl);
                await new Promise((resolve, reject) => {
                    audioElement.addEventListener('loadedmetadata', () => resolve());
                    audioElement.addEventListener('error', () => reject("讀取音檔長度失敗"));
                });
                const durationSec = parseFloat(audioElement.duration.toFixed(1)); // float
                console.log("🎵 音檔長度:", durationSec);

                // 3️⃣ 建立 FormData
                const formData = new FormData();
                const payload = {
                    audio_duration: durationSec,       // float
                    };
                formData.append('audio_file', saved.blob, `recording.${saved.extension}`);
                formData.append('payload', JSON.stringify(payload));
                // 4️⃣ 上傳
                const res = await fetch(CONFIG.getApiUrl(`/practice/sessions/${practice_session_id}/recordings/${sentence_id}`),
                    {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }, // 不要自己設定 Content-Type
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


        try {
            const res = await fetch(CONFIG.getApiUrl(`/practice/sessions?skip=0&limit=100`),
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`取得練習會話列表失敗，狀態碼：${res.status}, 訊息：${errText}`);
            }

            const result = await res.json();
            console.log("✅ 取得練習會話列表成功", result);

        } catch (err) {
            console.error("❌ 取得練習會話列表失敗", err);
        }

        try {
            const res = await fetch(CONFIG.getApiUrl(`/practice/sessions/${practice_session_id}/recordings`),
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`取得錄音檔案資訊失敗，狀態碼：${res.status}, 訊息：${errText}`);
            }

            const recordings = await res.json();
            console.log("✅ 取得錄音檔案資訊成功", recordings);


        } catch (err) {
            console.error("❌ 取得錄音檔案資訊失敗", err);
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
        completePracticeButton(practice_session_id)
        // 🔑 無論成功或失敗都要清除 flag
        window._alreadyFetchingDetail = false;
        window._alreadyFetching = false;
}
// 格式化影片時間（秒數 → MM:SS）
function formatVideoTime(seconds) {
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
