let map;
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
};

// 推薦語句對應表
const phrasesMap = {
     '學校': ['請問圖書館在哪裡？', '這裡有語言學習課程嗎？'],
    '醫療': ['請問急診室在哪裡？', '我需要預約醫生嗎？'],
    '銀行': ['請問可以兌換外幣嗎？', '這裡有自動櫃員機嗎？'],
    '餐廳': ['請問有推薦的招牌菜嗎？', '這裡可以外帶嗎？'],
    '購物': ['請問哪裡有結帳櫃檯？', '這裡有生鮮食品區嗎？'],
    '其他': ['請問最近的公車站牌在哪裡？', '這裡有無障礙設施嗎？']
};

function getLocation() {
    log('開始獲取位置');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                log('定位成功');
                 // 顯示經緯度在頁面元素中
                const currentLocation = document.getElementById('currentLocation');
                if (currentLocation) {
                    currentLocation.textContent = `目前位置：緯度 ${lat.toFixed(4)}, 經度 ${lon.toFixed(4)}`;
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
        });
}

function updateNearbyPlacesList(places) {
    const listContainer = document.getElementById('recommendedTermsList');
    if (!listContainer) {
        log('找不到 recommendedTermsList 元素', 'error');
        return;
    }

    // 初始化分類數據
    const categorized = {
        '學校': [], '醫療': [], '銀行': [], '購物': [], '餐廳': [], '其他': []
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
        listContainer.innerHTML += '<p>附近無地點</p>';
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

        const phrases = phrasesMap[category] || phrasesMap['其他'];
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