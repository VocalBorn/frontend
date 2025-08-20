let map;
// 顯示提示訊息到 #locationMessage，如果不存在則使用 alert
function showMessage(msg) {
    const msgDiv = document.getElementById('locationMessage');
    if (msgDiv) {
        msgDiv.textContent = msg;
    } else {
        alert(msg);
    }
}
// 獲取位置（location-terms 頁面）
document.addEventListener('DOMContentLoaded', () => {
    if (location.hash === '#location-terms') {
        getLocation();
    }
});
// === 地理定位 ===
const CATEGORY_MAP = {
    'school': '學校',
    'university': '學校',
    'college': '學校',
    'kindergarten': '學校',
    'hospital': '醫療',
    'clinic': '醫療',
    'doctors': '醫療',
    'pharmacy': '醫療',
    'bank': '銀行',
    'atm': '銀行',
    'restaurant': '餐廳',
    'cafe': '餐廳',
    'fast_food': '餐廳',
    'supermarket': '購物',
    'convenience': '購物',
    'mall': '購物',
    'department_store': '購物',
    'post_office': '郵局',
    'library': '圖書',
    'bus_station': '交通',
    'parking': '交通',
    'police': '政府',
    'fire_station': '政府',
};

// 推薦語句對應表
const phrasesMap = {
    '學校': ['請問圖書館在哪裡？', '這裡有語言學習課程嗎？'],
    '醫療': ['請問急診室在哪裡？', '我需要預約醫生嗎？'],
    '銀行': ['請問可以兌換外幣嗎？', '這裡有自動櫃員機嗎？'],
    '餐廳': ['請問有推薦的招牌菜嗎？', '這裡可以外帶嗎？'],
    '購物': ['請問哪裡有結帳櫃檯？', '這裡有生鮮食品區嗎？'],
    '其他': ['請問最近的公車站牌在哪裡？', '這裡有無障礙設施嗎？'],
    '郵局': ['請問郵局的營業時間？', '這裡可以寄包裹嗎？'],
    '圖書': ['這裡有開放的閱讀區嗎？', '請問借書流程是什麼？'],
    '交通': ['最近的公車站在哪裡？', '這裡有停車場嗎？'],
    '政府': ['請問警察局在哪裡？', '這裡有消防局嗎？']
};

// 新增 placeKeywordMap，包含品牌與機構名稱及對應語句
const placeKeywordMap = {
    '麥當勞': ['請問最近有什麼新品嗎？', '可以加點薯條嗎？'],
    '星巴克': ['請問有抹茶拿鐵嗎？', '可以用環保杯嗎？'],
    '全家': ['請問有熱咖啡嗎？', '這裡有販售便當嗎？'],
    '7-11': ['我要繳費', '請問廁所在哪？'],
    '警察局': ['我要報案', '可以補辦身分證嗎？'],
    '消防局': ['請問消防演練時間？', '這裡有滅火器嗎？'],
    '大學': ['請問圖書館開放時間？', '這裡有學生餐廳嗎？'],
    '醫院': ['我要掛急診', '可以查詢醫生門診時間嗎？'],
    '台灣大哥大': ['我要辦理手機方案', '這裡有促銷活動嗎？'],
    '遠傳': ['請問有手機租借嗎？', '這裡可以繳費嗎？'],
    '統一超商': ['請問有飲料促銷嗎？', '這裡可以買零食嗎？'],
    '家樂福': ['請問生鮮區在哪？', '這裡有停車優惠嗎？'],
    '愛買': ['請問會員卡怎麼用？', '這裡有嬰兒推車租借嗎？'],
    '台北車站': ['請問行李寄放在哪？', '這裡有免費Wi-Fi嗎？'],
    '高鐵站': ['我要購買車票', '請問候車室在哪？'],
    '捷運站': ['請問換乘資訊？', '這裡有無障礙電梯嗎？'],
    '郵局': ['我要寄包裹', '這裡可以買郵票嗎？'],
    '圖書館': ['請問借書流程是？', '這裡有免費電腦使用嗎？'],
    '市政府': ['請問市民服務櫃檯在哪？', '這裡有活動公告嗎？'],
    '鄉公所': ['我要申請戶籍謄本', '這裡有諮詢服務嗎？'],
    '診所': ['請問可以預約嗎？', '這裡有急診服務嗎？'],
    '藥局': ['請問止痛藥在哪？', '這個藥會不會有副作用？'],
    '牙醫診所': ['我要預約洗牙', '這裡有牙齒矯正服務嗎？'],
    '速食店': ['請問有素食餐點嗎？', '這裡可以外帶嗎？'],
    '咖啡廳': ['請問有免費插座嗎？', '這裡有甜點推薦嗎？'],
    '停車場': ['請問月租費用？', '這裡有電動車充電站嗎？'],
    '銀行': ['我要辦理匯款', '這裡可以開戶嗎？'],
    '公車站': ['請問下一班公車時間？', '這裡有電子看板嗎？'],
};

function getLocation() {
    log('開始獲取位置');
    // showMessage('🔍 正在定位中...');  // 移除非錯誤用途的提示
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                log('定位成功');
                // showMessage('✅ 定位成功，載入地圖與附近地點...');  // 移除非錯誤用途的提示
                 // 顯示經緯度在頁面元素中
                const currentLocation = document.getElementById('currentLocation');
                if (currentLocation) {
                    currentLocation.textContent = `目前位置：緯度 ${lat.toFixed(4)}, 經度 ${lon.toFixed(4)}`;
                }
                // 在 recommendedTermsList 上方新增 loadingNearby 提示
                const recommendedList = document.getElementById('recommendedTermsList');
                if (recommendedList) {
                    let loadingElem = document.getElementById('loadingNearby');
                    if (!loadingElem) {
                        loadingElem = document.createElement('p');
                        loadingElem.id = 'loadingNearby';
                        loadingElem.textContent = '加載附近地點中...';
                        recommendedList.parentNode.insertBefore(loadingElem, recommendedList);
                    }
                }
                initializeMap(lat, lon);
                fetchNearbyPlaces(lat, lon);
            },
            (error) => {
                const messages = {
                    1: '用戶拒絕了定位請求',
                    2: '位置信息不可用',
                    3: '請求超時，請重試',
                    0: '發生未知錯誤'
                };
                const message = messages[error.code] || '發生未知錯誤';
                log(`定位錯誤: ${message}`, 'error');
                showMessage(message);
                initializeDefaultMap();
            }
        );
    } else {
        log('瀏覽器不支持定位', 'error');
        showMessage('瀏覽器不支持定位');
        initializeDefaultMap();
    }
}

function initializeMap(lat, lon) {
    const mapContainer = document.getElementById('map');
    if (mapContainer && typeof L !== 'undefined') {

        if (map !== undefined) {
            map.remove();  // ✅ 避免重複初始化錯誤
        }

        map = L.map('map').setView([lat, lon], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        L.marker([lat, lon]).addTo(map).bindPopup('您在這裡').openPopup();
    } else {
        log('地圖容器或 Leaflet 未加載', 'error');
    }
}

function initializeDefaultMap() {
    const defaultLat = 25.0330; // 預設為台北
    const defaultLon = 121.5654;
    initializeMap(defaultLat, defaultLon);
    const currentLocation = document.getElementById('currentLocation');
    if (currentLocation) {
        currentLocation.textContent = '目前位置：無法獲取，顯示預設位置（台北）';
    }
}

function fetchNearbyPlaces(lat, lon) {
    // showMessage('📡 加載附近地點中...');  // 移除非錯誤用途的提示
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const query = `
        [out:json][timeout:25];
        (
            node["amenity"](around:500,${lat},${lon});
            way["amenity"](around:500,${lat},${lon});
            relation["amenity"](around:500,${lat},${lon});
        );
        out center;
    `;
    
    fetch(overpassUrl, { method: 'POST', body: query })
        .then(res => {
            if (!res.ok) throw new Error('Overpass API 請求失敗');
            return res.json();
        })
        .then(data => updateNearbyPlacesList(data.elements))
        .catch(err => {
           log('OSM 查詢失敗: ' + err, 'error');
            showMessage('無法獲取附近地點');
            // 移除 loadingNearby 提示
            const loadingElem = document.getElementById('loadingNearby');
            if (loadingElem) {
                loadingElem.remove();
            }
        });
}

function updateNearbyPlacesList(places) {
    const listContainer = document.getElementById('recommendedTermsList');
    if (!listContainer) {
        log('找不到 recommendedTermsList 元素', 'error');
        return;
    }

    // 移除 loadingNearby 提示
    const loadingElem = document.getElementById('loadingNearby');
    if (loadingElem) {
        loadingElem.remove();
    }

    // 初始化分類數據
    const categorized = {
        '學校': [], '醫療': [], '銀行': [], '購物': [], '餐廳': [], '其他': [],
        '郵局': [], '圖書': [], '交通': [], '政府': []
    };

    places.forEach(place => {
        const name = place.tags?.name;
        const type = place.tags?.amenity;
        if (!name || !type) return;
        const category = CATEGORY_MAP[type] || '其他';
        categorized[category].push({ name, category });
    });

    // 清空現有內容並添加標題
    listContainer.innerHTML = '<p><i class="fa-solid fa-map-location-dot"></i> 附近地點</p>';

    // 為每個分類創建可展開/收起的區塊
    Object.entries(categorized).forEach(([category, items]) => {
        if (items.length === 0) return; // 跳過無地點的分類

        // 創建分類標題
        const categoryDiv = document.createElement('div');
        categoryDiv.classList.add('place-category');

        const title = document.createElement('h4');
        title.classList.add('category-title');
        const iconClass = {
            '學校': 'fa-school',
            '醫療': 'fa-hospital',
            '銀行': 'fa-building-columns',
            '餐廳': 'fa-utensils',
            '購物': 'fa-shopping-cart',
            '郵局': 'fa-envelope',
            '圖書': 'fa-book',
            '交通': 'fa-bus',
            '政府': 'fa-landmark',
            '其他': 'fa-map-pin'
        }[category] || 'fa-map-pin';
        title.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${category} <i class="fa-solid fa-chevron-down toggle-icon"></i>`;
        categoryDiv.appendChild(title);

        // 創建地點列表（預設隱藏）
        const itemsList = document.createElement('div');
        itemsList.classList.add('category-items', 'hidden');
        items.forEach(item => {
            const button = createPlaceButton(item.name, item.category);
            itemsList.appendChild(button);
        });
        categoryDiv.appendChild(itemsList);

        // 點擊標題時展開/收起
        title.addEventListener('click', () => {
            const isHidden = itemsList.classList.contains('hidden');
            // 收起其他已展開的分類
            document.querySelectorAll('.category-items').forEach(list => {
                list.classList.add('hidden');
                const icon = list.previousElementSibling.querySelector('.toggle-icon');
                if (icon) {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            });
            // 展開或收起當前分類
            if (isHidden) {
                itemsList.classList.remove('hidden');
                title.querySelector('.toggle-icon').classList.remove('fa-chevron-down');
                title.querySelector('.toggle-icon').classList.add('fa-chevron-up');
                log(`展開分類: ${category}`);
            } else {
                itemsList.classList.add('hidden');
                title.querySelector('.toggle-icon').classList.remove('fa-chevron-up');
                title.querySelector('.toggle-icon').classList.add('fa-chevron-down');
                log(`收起分類: ${category}`);
            }
        });

        listContainer.appendChild(categoryDiv);
    });

    // 如果沒有任何地點，顯示提示
    if (Object.values(categorized).every(items => items.length === 0)) {
        showMessage('⚠️ 附近無可用地點');
        listContainer.innerHTML += '<p>附近無地點</p>';
    } else {
        // 移除非錯誤用途的提示
        // showMessage('✅ 附近地點已載入');
    }
}

function createPlaceButton(name, category) {
    const button = document.createElement('button');
    button.classList.add('place-button');
    button.innerHTML = `<span>${name}</span>`;
    button.addEventListener('click', () => {
        const termInput = document.getElementById('term');
        if (termInput) termInput.value = name;
        showSuggestedPhrases(name, category);
    });
    return button;
}

function showSuggestedPhrases(placeName, category) {
    log(`顯示 ${placeName} 的推薦語句`);
    const phraseContainer = document.getElementById('suggestedPhrases');
    const phraseButtons = document.getElementById('phraseButtons');
    const recommendedList = document.getElementById('recommendedTermsList');

    if (phraseContainer && phraseButtons && recommendedList) {
        phraseContainer.classList.remove('hidden');
        recommendedList.classList.add('hidden');
        phraseButtons.innerHTML = '';

        // 先比對 placeKeywordMap 中的關鍵字
        let matchedPhrases = null;
        for (const keyword in placeKeywordMap) {
            if (placeName.includes(keyword)) {
                matchedPhrases = placeKeywordMap[keyword];
                break;
            }
        }
        // 若無匹配，使用 category 對應的 phrasesMap
        const phrases = matchedPhrases || phrasesMap[category] || phrasesMap['其他'];

        phrases.forEach(phrase => {
            const btn = document.createElement('button');
            btn.classList.add('phrase-button');
            btn.innerHTML = `
                ${phrase}
                <i class="fa-solid fa-volume-up volume-icon"></i>
            `;
            btn.addEventListener('click', () => {
                let utterance = new SpeechSynthesisUtterance(phrase);
                speechSynthesis.speak(utterance);
            });
            phraseButtons.appendChild(btn);
        });

        // 綁定返回按鈕事件
        const backButton = document.getElementById('backButton');
        if (backButton) {
            backButton.replaceWith(backButton.cloneNode(true));
            const newBackButton = document.getElementById('backButton');
            newBackButton.addEventListener('click', () => {
                phraseContainer.classList.add('hidden');
                recommendedList.classList.remove('hidden');
                log('返回附近地點列表');
            });
        } else {
            log('找不到 backButton 按鈕', 'error');
        }
    } else {
        log('找不到推薦語句相關元素', 'error');
    }
}

// 分類篩選
const filter = document.getElementById('categoryFilter');
if (filter) {
    filter.addEventListener('change', () => {
        const selected = filter.value;
        document.querySelectorAll('.place-category').forEach(section => {
            const heading = section.querySelector('h4')?.textContent;
            section.style.display = (selected === '全部' || heading === selected) ? '' : 'none';
        });
    });
}