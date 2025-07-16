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
