/** MyEdgeStyle 新标签页，配置来自 chrome.storage.local */

const DEFAULT_CONFIG = {
  useDefaultNewTab: false,
  showTime: true,
  time24: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  showWeather: true,
  weatherApiKey: '',
  weatherCityId: 'nanjing',
  wallpaperIndex: 0,
  wallpaperUrl: '',
  glassOpacity: 0.35,
  showGlass: true,
  showPlaceholder: true,
  searchEngine: 'bing',
  aiApiUrl: 'https://api.openai.com/v1/chat/completions',
  aiApiKeyCipher: '',
  aiApiKeyIv: '',
  aiModel: ''
};

const AI_SECRET_DB = 'myedgestyle-secrets';
const AI_SECRET_STORE = 'secrets';
const AI_SECRET_KEY_ID = 'ai-api-key';

const SEARCH_ENGINES = {
  bing: { url: 'https://www.bing.com/search?q=', placeholder: '在 Bing 上搜索...' },
  google: { url: 'https://www.google.com/search?q=', placeholder: '在 Google 上搜索...' },
  baidu: { url: 'https://www.baidu.com/s?wd=', placeholder: '在百度上搜索...' }
};

const WEATHER_CITIES = {
  nanjing: { name: '南京', lat: 32.06, lon: 118.80, timezone: 'Asia/Shanghai' },
  beijing: { name: '北京', lat: 39.90, lon: 116.41, timezone: 'Asia/Shanghai' },
  shanghai: { name: '上海', lat: 31.23, lon: 121.47, timezone: 'Asia/Shanghai' },
  guangzhou: { name: '广州', lat: 23.13, lon: 113.26, timezone: 'Asia/Shanghai' },
  shenzhen: { name: '深圳', lat: 22.55, lon: 114.06, timezone: 'Asia/Shanghai' },
  hangzhou: { name: '杭州', lat: 30.25, lon: 120.17, timezone: 'Asia/Shanghai' },
  chengdu: { name: '成都', lat: 30.67, lon: 104.06, timezone: 'Asia/Shanghai' },
  wuhan: { name: '武汉', lat: 30.59, lon: 114.31, timezone: 'Asia/Shanghai' },
  xian: { name: '西安', lat: 34.27, lon: 108.94, timezone: 'Asia/Shanghai' }
};

const WALLPAPER_PRESETS = [
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1920',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920'
];

let config = { ...DEFAULT_CONFIG };

function getStorage() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['newtab', 'useDefaultNewTab'], (data) => {
        const newtab = data.newtab || {};
        config = { ...DEFAULT_CONFIG, ...data, ...newtab };
        if (config.newtab) Object.assign(config, config.newtab);
        resolve(config);
      });
    } else {
      resolve(config);
    }
  });
}

function maybeRedirect() {
  if (config.useDefaultNewTab) {
    try {
      window.location.href = 'edge://newtab';
    } catch (_) { }
  }
}

function formatTime(date, use24, tz) {
  const opts = { timeZone: tz || config.timezone, hour12: !use24 };
  const time = date.toLocaleTimeString('zh-CN', { ...opts, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = date.toLocaleDateString('zh-CN', { timeZone: tz || config.timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return { time, dateStr };
}

function renderTime() {
  const el = document.getElementById('widget-time');
  if (!el || !config.showTime) {
    if (el) el.hidden = true;
    return;
  }
  el.hidden = false;
  let main = el.querySelector('.time-main');
  let dateEl = el.querySelector('.time-date');
  if (!main) {
    main = document.createElement('p');
    main.className = 'time-main';
    el.appendChild(main);
    dateEl = document.createElement('p');
    dateEl.className = 'time-date';
    el.appendChild(dateEl);
  }
  const { time, dateStr } = formatTime(new Date(), config.time24, config.timezone);
  main.textContent = time;
  dateEl.textContent = dateStr;
}

function initTime() {
  renderTime();
  setInterval(renderTime, 1000);
}

function initSearch() {
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  if (!form || !input) return;
  const engine = SEARCH_ENGINES[config.searchEngine] || SEARCH_ENGINES.bing;
  input.placeholder = engine.placeholder;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (input.value || '').trim();
    if (!q) return;
    const base = engine.url;
    window.location.href = base + encodeURIComponent(q);
  });
}

function getWeatherCity() {
  const id = config.weatherCityId || 'nanjing';
  return WEATHER_CITIES[id] || WEATHER_CITIES.nanjing;
}

async function fetchWeather() {
  const city = getWeatherCity();
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(city.timezone)}`;
    const res = await fetch(url);
    const data = await res.json();
    return { current: data.current, cityName: city.name };
  } catch (e) {
    return null;
  }
}

function weatherCodeToText(code) {
  const map = { 0: '晴', 1: '大部晴朗', 2: '少云', 3: '多云', 45: '雾', 48: '雾', 51: '毛毛雨', 61: '雨', 63: '雨', 80: '阵雨', 95: '雷暴' };
  return map[code] || '未知';
}

async function renderWeather() {
  const el = document.getElementById('widget-weather');
  if (!el || !config.showWeather) {
    if (el) el.hidden = true;
    return;
  }
  el.hidden = false;
  const result = await fetchWeather();
  if (!result || !result.current) {
    el.innerHTML = '<span class="desc">天气获取失败</span>';
    return;
  }
  const { current, cityName } = result;
  const temp = Math.round(current.temperature_2m);
  const desc = weatherCodeToText(current.weather_code);
  el.innerHTML = `
    <span class="temp">${temp}°C</span>
    <span class="desc">${desc}</span>
    <span class="location">${cityName}</span>
  `;
}

function getWallpaperUrl() {
  if (config.wallpaperResolvedUrl && String(config.wallpaperResolvedUrl).trim()) {
    return config.wallpaperResolvedUrl;
  }
  if (config.wallpaperUrl && config.wallpaperUrl.trim()) return config.wallpaperUrl.trim();
  const idx = Math.max(0, (config.wallpaperIndex ?? 0) % WALLPAPER_PRESETS.length);
  return WALLPAPER_PRESETS[idx];
}

function applyWallpaper() {
  const el = document.getElementById('wallpaper');
  if (!el) return;
  const url = getWallpaperUrl();
  if (url) {
    el.style.backgroundImage = `url(${url})`;
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

function ensureWallpaperCache() {
  const url = getWallpaperUrl();
  if (!url) return;
  if (config.wallpaperResolvedUrl === url && config.wallpaperUpdatedAt) {
    return;
  }
  config.wallpaperResolvedUrl = url;
  config.wallpaperUpdatedAt = Date.now();
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const newtab = { ...config };
    delete newtab.useDefaultNewTab;
    delete newtab.aiApiKey;
    chrome.storage.local.set({ newtab }, () => { });
  }
}

function saveNewtabConfig(updates) {
  Object.assign(config, updates);
  const newtab = { ...config };
  delete newtab.useDefaultNewTab;
  delete newtab.aiApiKey;
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ newtab }, () => { });
  }
}

function applyGlass() {
  const topEl = document.getElementById('glass-top');
  const bottomEl = document.getElementById('glass-bottom');
  const opacity = config.showGlass ? (config.glassOpacity ?? 0.35) : 0;
  const bg = `rgba(0,0,0,${opacity})`;
  if (topEl) {
    topEl.style.background = bg;
    topEl.hidden = opacity === 0;
  }
  if (bottomEl) {
    bottomEl.style.background = bg;
    bottomEl.hidden = opacity === 0;
  }
}

function updatePlaceholder() {
  const ph = document.getElementById('placeholder');
  if (!ph) return;
  const hasWidget = config.showTime || config.showWeather;
  ph.classList.toggle('placeholder', true);
  if (hasWidget) ph.style.display = 'none';
  else ph.style.display = '';
}

const FAVORITES_GROUP_NAMES = {
  'Bookmarks Bar': '收藏夹栏',
  'Other Bookmarks': '其他收藏夹',
  'Mobile Bookmarks': '移动设备收藏夹',
  '书签栏': '收藏夹栏'
};

function flattenNodeToItems(node, pathPrefix = '', rootTitle = '') {
  const list = [];
  const currentPath = node.title ? (pathPrefix ? `${pathPrefix}/${node.title}` : node.title) : pathPrefix;
  const root = rootTitle || node.title || '';
  if (node.url) {
    list.push({
      title: node.title || node.url,
      url: node.url,
      folderPath: pathPrefix || '',
      rootTitle: root
    });
  }
  if (node.children && node.children.length) {
    for (const child of node.children) {
      list.push(...flattenNodeToItems(child, currentPath, root));
    }
  }
  return list;
}

function getBookmarksGroupedByRoot() {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.bookmarks?.getTree) {
      resolve([]);
      return;
    }
    chrome.bookmarks.getTree((tree) => {
      const root = tree && tree[0];
      if (!root || !root.children || !root.children.length) {
        resolve([]);
        return;
      }
      const groups = [];
      for (const node of root.children) {
        const name = FAVORITES_GROUP_NAMES[node.title] || node.title || '收藏';
        const items = flattenNodeToItems(node, '', node.title);
        if (items.length) groups.push({ name, rootTitle: node.title, items });
      }
      resolve(groups);
    });
  });
}

function matchBookmark(item, query) {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  const title = (item.title || '').toLowerCase();
  const url = (item.url || '').toLowerCase();
  return title.includes(q) || url.includes(q);
}

function buildUncategorizedAndFolders(groups, query) {
  const rootNameMap = {};
  for (const g of groups) rootNameMap[g.rootTitle] = g.name;

  const uncategorized = [];
  const byFolder = new Map();
  for (const g of groups) {
    for (const item of g.items) {
      if (query && query.trim() && !matchBookmark(item, query)) continue;
      const inSubfolder = item.folderPath && item.folderPath.includes('/');
      if (!inSubfolder && (item.folderPath === item.rootTitle || !item.folderPath)) {
        uncategorized.push(item);
      } else {
        const displayPath = item.folderPath
          ? item.folderPath.replace(item.rootTitle, rootNameMap[item.rootTitle] || item.rootTitle)
          : (rootNameMap[item.rootTitle] || item.rootTitle);
        if (!byFolder.has(displayPath)) byFolder.set(displayPath, []);
        byFolder.get(displayPath).push(item);
      }
    }
  }
  const sections = [];
  if (uncategorized.length) sections.push({ name: '未分类', items: uncategorized });
  const sortedPaths = [...byFolder.keys()].sort();
  for (const path of sortedPaths) sections.push({ name: path, items: byFolder.get(path) });
  return sections;
}

function createFavoriteItemEl(item, useNavCard = false) {
  const a = document.createElement('a');
  const title = item.title || item.url;
  const initial = title.trim().charAt(0).toUpperCase();
  if (useNavCard) {
    a.className = 'nav-card';
    a.href = item.url;
    a.title = item.url;
    const iconWrap = document.createElement('span');
    iconWrap.className = 'nav-card-icon';
    const faviconUrl = getFaviconUrl(item.url, 32);
    if (faviconUrl) {
      const img = document.createElement('img');
      img.className = 'nav-card-icon-img';
      img.src = faviconUrl;
      img.alt = '';
      const fallback = document.createElement('span');
      fallback.className = 'nav-card-icon-fallback';
      fallback.textContent = initial;
      fallback.hidden = true;
      img.onerror = () => {
        if (!img.dataset.fallbackTried) {
          const next = getFallbackFaviconUrl(item.url, 32);
          if (next) {
            img.dataset.fallbackTried = '1';
            img.src = next;
            return;
          }
        }
        img.hidden = true;
        fallback.hidden = false;
      };
      iconWrap.appendChild(img);
      iconWrap.appendChild(fallback);
    } else {
      const fallback = document.createElement('span');
      fallback.className = 'nav-card-icon-fallback';
      fallback.textContent = initial;
      iconWrap.appendChild(fallback);
    }
    const titleEl = document.createElement('span');
    titleEl.className = 'nav-card-title';
    titleEl.textContent = title;
    a.appendChild(iconWrap);
    a.appendChild(titleEl);
  } else {
    a.className = 'favorite-item';
    a.href = item.url;
    a.title = item.folderPath ? `${title}\n${item.folderPath}` : title;
    const icon = document.createElement('span');
    icon.className = 'favorite-icon';
    icon.textContent = initial;
    const textWrap = document.createElement('span');
    textWrap.className = 'favorite-text';
    textWrap.textContent = title;
    a.appendChild(icon);
    a.appendChild(textWrap);
    if (item.folderPath) {
      const folder = document.createElement('span');
      folder.className = 'favorite-folder';
      folder.textContent = ` · ${item.folderPath}`;
      a.appendChild(folder);
    }
  }
  return a;
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function getFaviconUrl(pageUrl, size) {
  if (!pageUrl || typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.getURL) return '';
  try {
    new URL(pageUrl);
  } catch (_) {
    return '';
  }
  const base = chrome.runtime.getURL('/_favicon/');
  const url = new URL(base);
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', String(size || 32));
  return url.toString();
}

function getFallbackFaviconUrl(pageUrl, size) {
  try {
    const host = new URL(pageUrl).hostname;
    if (!host) return '';
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size || 32}`;
  } catch (_) {
    return '';
  }
}

function renderFavoritesNav(groups, query) {
  const content = document.getElementById('favorites-nav-content');
  if (!content) return;
  const sections = buildUncategorizedAndFolders(groups, query);
  content.innerHTML = '';
  if (!sections.length) {
    content.textContent = query ? '无匹配收藏' : '暂无收藏内容';
    return;
  }
  for (const s of sections) {
    const section = document.createElement('div');
    section.className = 'favorites-group';
    section.innerHTML = `<div class="favorites-group-title">${escapeHtml(s.name)}</div>`;
    const list = document.createElement('div');
    list.className = 'favorites-group-list';
    for (const item of s.items) {
      list.appendChild(createFavoriteItemEl(item, true));
    }
    section.appendChild(list);
    content.appendChild(section);
  }
}

const VIEW_ORDER = ['home', 'favorites', 'ai'];
let currentViewId = 'home';
let aiMode = 'chat';
let aiChatHistory = [];

function isFormTarget(target) {
  const tag = target?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable;
}

function setAiConfigStatus(text) {
  const status = document.getElementById('ai-config-status');
  if (!status) return;
  status.textContent = text || '';
  if (text) {
    setTimeout(() => {
      if (status.textContent === text) status.textContent = '';
    }, 1800);
  }
}

function hasAiApiKeyStored() {
  return !!(config.aiApiKeyCipher && config.aiApiKeyIv);
}

function hasCryptoStorageSupport() {
  return !!(window.crypto?.subtle && window.indexedDB);
}

function openAiSecretDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('当前浏览器不支持 IndexedDB，无法安全保存 API Key。'));
      return;
    }
    const request = indexedDB.open(AI_SECRET_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AI_SECRET_STORE)) {
        db.createObjectStore(AI_SECRET_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('无法打开本地密钥库。'));
  });
}

function readSecretRecord(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AI_SECRET_STORE, 'readonly');
    const request = tx.objectStore(AI_SECRET_STORE).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('无法读取本地密钥。'));
  });
}

function writeSecretRecord(db, record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AI_SECRET_STORE, 'readwrite');
    tx.objectStore(AI_SECRET_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('无法写入本地密钥。'));
  });
}

async function getAiCryptoKey() {
  if (!hasCryptoStorageSupport()) {
    throw new Error('当前浏览器不支持 WebCrypto/IndexedDB，无法加密保存 API Key。');
  }
  const db = await openAiSecretDb();
  try {
    const record = await readSecretRecord(db, AI_SECRET_KEY_ID);
    if (record?.key) return record.key;
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    await writeSecretRecord(db, { id: AI_SECRET_KEY_ID, key });
    return key;
  } finally {
    db.close();
  }
}

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function encryptAiApiKey(apiKey) {
  const key = await getAiCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(apiKey);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    aiApiKeyCipher: bytesToBase64(new Uint8Array(cipher)),
    aiApiKeyIv: bytesToBase64(iv)
  };
}

async function decryptAiApiKey() {
  if (!hasAiApiKeyStored()) return '';
  try {
    const key = await getAiCryptoKey();
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(config.aiApiKeyIv) },
      key,
      base64ToBytes(config.aiApiKeyCipher)
    );
    return new TextDecoder().decode(plain);
  } catch (_) {
    throw new Error('API Key 无法解密，请重新设置。');
  }
}

async function migratePlainAiApiKey() {
  const legacyKey = (config.aiApiKey || '').trim();
  if (legacyKey) {
    try {
      const encrypted = await encryptAiApiKey(legacyKey);
      saveNewtabConfig({
        ...encrypted,
        aiApiKey: ''
      });
    } catch (err) {
      saveNewtabConfig({ aiApiKey: '' });
      throw err;
    }
  }
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.remove('aiApiKey', () => { });
  }
}

function loadAiConfigFields() {
  const apiUrl = document.getElementById('ai-api-url');
  const apiKey = document.getElementById('ai-api-key');
  const model = document.getElementById('ai-model');
  if (apiUrl) apiUrl.value = config.aiApiUrl || DEFAULT_CONFIG.aiApiUrl;
  if (apiKey) {
    apiKey.value = '';
    apiKey.placeholder = hasAiApiKeyStored() ? '已安全保存，重新输入可覆盖' : '输入后加密保存，不回显';
  }
  if (model) model.value = config.aiModel || '';
}

async function saveAiConfigFromFields({ requireKey = false } = {}) {
  const apiUrl = document.getElementById('ai-api-url');
  const apiKey = document.getElementById('ai-api-key');
  const model = document.getElementById('ai-model');
  const keyValue = (apiKey?.value || '').trim();
  if (requireKey && !keyValue && !hasAiApiKeyStored()) {
    throw new Error('请先设置 API Key。');
  }
  const updates = {
    aiApiUrl: (apiUrl?.value || '').trim() || DEFAULT_CONFIG.aiApiUrl,
    aiModel: (model?.value || '').trim()
  };
  if (keyValue) {
    Object.assign(updates, await encryptAiApiKey(keyValue));
  }
  saveNewtabConfig(updates);
  if (apiKey) {
    apiKey.value = '';
    apiKey.placeholder = hasAiApiKeyStored() ? '已安全保存，重新输入可覆盖' : '输入后加密保存，不回显';
  }
  setAiConfigStatus('已保存');
}

function getAiRuntimeConfig() {
  const apiUrl = (document.getElementById('ai-api-url')?.value || config.aiApiUrl || '').trim();
  const model = (document.getElementById('ai-model')?.value || config.aiModel || '').trim();
  return { apiUrl, model };
}

function appendAiMessage(role, text) {
  const messages = document.getElementById('ai-messages');
  if (!messages) return null;
  const item = document.createElement('article');
  item.className = `ai-message ai-message-${role}`;
  const label = document.createElement('div');
  label.className = 'ai-message-label';
  label.textContent = role === 'user' ? '你' : (role === 'error' ? '错误' : 'AI');
  const body = document.createElement('div');
  body.className = 'ai-message-body';
  body.textContent = text;
  item.appendChild(label);
  item.appendChild(body);
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
  return body;
}

function renderAiWelcome() {
  const messages = document.getElementById('ai-messages');
  if (!messages || messages.children.length) return;
  appendAiMessage('assistant', '配置 API 地址、Key 和模型后，可以在这里直接问答；切到“命名简称”后，输入中文名词即可生成英文缩写和常用代码命名。');
}

function setAiMode(nextMode) {
  aiMode = nextMode === 'naming' ? 'naming' : 'chat';
  document.querySelectorAll('.ai-mode-btn').forEach((btn) => {
    const active = btn.dataset.aiMode === aiMode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  const input = document.getElementById('ai-input');
  const submit = document.getElementById('ai-submit');
  if (input) {
    input.placeholder = aiMode === 'naming'
      ? '输入中文名词，例如：用户权限分组'
      : '输入问题，Enter 发送，Shift+Enter 换行';
  }
  if (submit) submit.textContent = aiMode === 'naming' ? '生成' : '发送';
}

function getAiSystemPrompt() {
  if (aiMode === 'naming') {
    return [
      '你是面向软件开发团队的中英命名助手。',
      '用户会输入中文业务名词或技术名词。',
      '请输出简洁、规范、可直接用于代码的英文命名建议。',
      '固定包含：英文全称、推荐简称、camelCase、PascalCase、snake_case、适用说明。',
      '优先使用开发者常见缩写，避免生僻词。'
    ].join('\n');
  }
  return '你是一个简洁可靠的中文 AI 助手，回答要准确、清楚，必要时给出可执行步骤。';
}

function normalizeAiContent(data) {
  const choice = data?.choices?.[0];
  const content = choice?.message?.content ?? choice?.text ?? data?.output_text;
  if (Array.isArray(content)) {
    return content.map((part) => part.text || part.content || '').join('').trim();
  }
  return String(content || '').trim();
}

async function requestAiAnswer(userText) {
  const { apiUrl, model } = getAiRuntimeConfig();
  if (!apiUrl) throw new Error('请先配置 API 地址。');
  if (!model) throw new Error('请先配置模型名称。');
  const apiKey = await decryptAiApiKey();
  if (!apiKey) throw new Error('请先设置 API Key。');
  const messages = [
    { role: 'system', content: getAiSystemPrompt() }
  ];
  if (aiMode === 'chat' && aiChatHistory.length) {
    messages.push(...aiChatHistory.slice(-10));
  }
  messages.push({ role: 'user', content: userText });

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: aiMode === 'naming' ? 0.2 : 0.7
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`接口请求失败：${response.status} ${response.statusText}${detail ? `\n${detail.slice(0, 300)}` : ''}`);
  }
  const data = await response.json();
  const answer = normalizeAiContent(data);
  if (!answer) throw new Error('接口返回为空，请检查模型或接口格式是否兼容。');
  return answer;
}

function initAiAssistant() {
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  const submit = document.getElementById('ai-submit');
  const saveBtn = document.getElementById('ai-save-config');

  loadAiConfigFields();
  renderAiWelcome();
  setAiMode('chat');

  document.querySelectorAll('.ai-mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => setAiMode(btn.dataset.aiMode));
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveAiConfigFromFields().catch((err) => {
        setAiConfigStatus(err?.message || '保存失败');
      });
    });
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form?.requestSubmit();
      }
    });
  }

  if (form && input && submit) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || submit.disabled) return;
      submit.disabled = true;
      submit.textContent = '请求中';
      try {
        await saveAiConfigFromFields({ requireKey: true });
        appendAiMessage('user', text);
        input.value = '';
        const pending = appendAiMessage('assistant', '思考中...');
        const answer = await requestAiAnswer(text);
        if (pending) pending.textContent = answer;
        if (aiMode === 'chat') {
          aiChatHistory.push({ role: 'user', content: text }, { role: 'assistant', content: answer });
          aiChatHistory = aiChatHistory.slice(-20);
        }
      } catch (err) {
        appendAiMessage('error', err?.message || '未知错误');
      } finally {
        submit.disabled = false;
        submit.textContent = aiMode === 'naming' ? '生成' : '发送';
      }
    });
  }
}

let favoritesData = null;
let currentFavoritesLoadId = 0;
let isFavoritesLoading = false;

function getFavoritesLoadingElements() {
  const overlay = document.getElementById('favorites-loading-overlay');
  const closeBtn = overlay ? overlay.querySelector('.favorites-loading-close') : null;
  return { overlay, closeBtn };
}

function showFavoritesLoading() {
  const { overlay } = getFavoritesLoadingElements();
  currentFavoritesLoadId += 1;
  const loadId = currentFavoritesLoadId;
  isFavoritesLoading = true;
  if (overlay) {
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
  }
  return loadId;
}

function hideFavoritesLoading() {
  const { overlay } = getFavoritesLoadingElements();
  isFavoritesLoading = false;
  if (overlay) {
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
  }
}

function cancelFavoritesLoading() {
  if (!isFavoritesLoading) return;
  currentFavoritesLoadId += 1;
  hideFavoritesLoading();
}

function ensureFavoritesData(loadId) {
  if (favoritesData) {
    return Promise.resolve(favoritesData);
  }
  const effectiveLoadId = loadId ?? currentFavoritesLoadId;
  return getBookmarksGroupedByRoot().then((groups) => {
    if (effectiveLoadId !== currentFavoritesLoadId) {
      return null;
    }
    favoritesData = groups;
    return groups;
  }).catch(() => {
    if (effectiveLoadId === currentFavoritesLoadId) {
      hideFavoritesLoading();
      const content = document.getElementById('favorites-nav-content');
      if (content) content.textContent = '无法加载收藏，请稍后重试。';
    }
    return null;
  });
}

function initFavorites() {
  const navSearch = document.getElementById('favorites-nav-search');
  const tabHome = document.getElementById('tab-home');
  const tabFavorites = document.getElementById('tab-favorites');
  const tabAi = document.getElementById('tab-ai');
  const viewHome = document.getElementById('view-home');
  const viewFavorites = document.getElementById('view-favorites');
  const viewAi = document.getElementById('view-ai');
  const { closeBtn } = getFavoritesLoadingElements();

  function applyFilterNav() {
    const q = navSearch ? navSearch.value : '';
    if (favoritesData) renderFavoritesNav(favoritesData, q);
  }

  function setActiveView(viewId) {
    currentViewId = VIEW_ORDER.includes(viewId) ? viewId : 'home';
    const entries = [
      { id: 'home', tab: tabHome, view: viewHome },
      { id: 'favorites', tab: tabFavorites, view: viewFavorites },
      { id: 'ai', tab: tabAi, view: viewAi }
    ];
    entries.forEach((entry) => {
      const active = entry.id === currentViewId;
      entry.tab?.classList.toggle('active', active);
      entry.tab?.setAttribute('aria-selected', String(active));
      entry.view?.classList.toggle('hidden', !active);
    });
    if (currentViewId !== 'favorites') {
      cancelFavoritesLoading();
      return;
    }
    const loadId = showFavoritesLoading();
    ensureFavoritesData(loadId).then((groups) => {
      if (!groups || loadId !== currentFavoritesLoadId) {
        return;
      }
      renderFavoritesNav(groups, navSearch ? navSearch.value : '');
      hideFavoritesLoading();
    });
  }

  if (tabHome && tabFavorites && tabAi && viewHome && viewFavorites && viewAi) {
    tabHome.addEventListener('click', () => setActiveView('home'));
    tabFavorites.addEventListener('click', () => setActiveView('favorites'));
    tabAi.addEventListener('click', () => setActiveView('ai'));

    document.addEventListener('keydown', (e) => {
      if (isFormTarget(e.target) || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      const index = VIEW_ORDER.indexOf(currentViewId);
      const delta = e.key === 'ArrowRight' ? 1 : -1;
      const next = VIEW_ORDER[(index + delta + VIEW_ORDER.length) % VIEW_ORDER.length];
      setActiveView(next);
    });

    let touchStartX = 0;
    document.getElementById('app')?.addEventListener('touchstart', (e) => {
      touchStartX = e.touches?.[0]?.clientX || 0;
    }, { passive: true });
    document.getElementById('app')?.addEventListener('touchend', (e) => {
      if (!touchStartX || isFormTarget(e.target)) return;
      const endX = e.changedTouches?.[0]?.clientX || 0;
      const distance = endX - touchStartX;
      if (Math.abs(distance) < 60) return;
      const index = VIEW_ORDER.indexOf(currentViewId);
      const delta = distance < 0 ? 1 : -1;
      const next = VIEW_ORDER[(index + delta + VIEW_ORDER.length) % VIEW_ORDER.length];
      setActiveView(next);
      touchStartX = 0;
    }, { passive: true });
  }

  if (tabHome && tabFavorites && !tabAi && viewHome && viewFavorites) {
    tabHome.addEventListener('click', () => {
      setActiveView('home');
    });
    tabFavorites.addEventListener('click', () => {
      currentViewId = 'favorites';
      tabFavorites.classList.add('active');
      tabFavorites.setAttribute('aria-selected', 'true');
      tabHome.classList.remove('active');
      tabHome.setAttribute('aria-selected', 'false');
      viewHome.classList.add('hidden');
      viewFavorites.classList.remove('hidden');
      const loadId = showFavoritesLoading();
      ensureFavoritesData(loadId).then((groups) => {
        if (!groups || loadId !== currentFavoritesLoadId) {
          return;
        }
        renderFavoritesNav(groups, navSearch ? navSearch.value : '');
        hideFavoritesLoading();
      });
    });
  }

  if (navSearch) {
    navSearch.addEventListener('input', () => {
      if (favoritesData) applyFilterNav();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      cancelFavoritesLoading();
    });
  }
}

async function init() {
  await getStorage();
  await migratePlainAiApiKey().catch(() => {
    delete config.aiApiKey;
  });
  maybeRedirect();
  ensureWallpaperCache();
  applyWallpaper();
  applyGlass();
  initTime();
  initSearch();
  await renderWeather();
  updatePlaceholder();
  initAiAssistant();
  initFavorites();
}

init();
