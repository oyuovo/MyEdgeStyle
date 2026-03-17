/**
 * MyEdgeStyle 新标签页：时间、天气、壁纸、毛玻璃
 * 配置从 chrome.storage.local 读取
 */

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
  searchEngine: 'bing'
};

// 搜索引擎：默认 Bing，用户可在扩展设置中切换
const SEARCH_ENGINES = {
  bing: { url: 'https://www.bing.com/search?q=', placeholder: '在 Bing 上搜索...' },
  google: { url: 'https://www.google.com/search?q=', placeholder: '在 Google 上搜索...' },
  baidu: { url: 'https://www.baidu.com/s?wd=', placeholder: '在百度上搜索...' }
};

// 天气地区（Open-Meteo 用经纬度），默认南京
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

// ---------- 默认新标签页重定向 ----------
function maybeRedirect() {
  if (config.useDefaultNewTab) {
    try {
      window.location.href = 'edge://newtab';
    } catch (_) {}
  }
}

// ---------- 时间组件 ----------
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

// ---------- 搜索 ----------
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

// ---------- 天气组件（Open-Meteo 免 key）----------
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

// ---------- 壁纸 ----------
function getWallpaperUrl() {
  // 优先使用已缓存的解析后 URL
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

// 保证壁纸解析结果写入本地缓存，避免每次重新计算
function ensureWallpaperCache() {
  const url = getWallpaperUrl();
  if (!url) return;
  // 若已存在缓存则不重复写入
  if (config.wallpaperResolvedUrl === url && config.wallpaperUpdatedAt) {
    return;
  }
  config.wallpaperResolvedUrl = url;
  config.wallpaperUpdatedAt = Date.now();
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const newtab = { ...config };
    delete newtab.useDefaultNewTab;
    chrome.storage.local.set({ newtab }, () => {});
  }
}

function saveNewtabConfig(updates) {
  Object.assign(config, updates);
  const newtab = { ...config };
  delete newtab.useDefaultNewTab;
  chrome.storage?.local?.set({ newtab }, () => {});
}

// ---------- 毛玻璃镶边 ----------
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

// ---------- 占位与可见性 ----------
function updatePlaceholder() {
  const ph = document.getElementById('placeholder');
  if (!ph) return;
  const hasWidget = config.showTime || config.showWeather;
  ph.classList.toggle('placeholder', true);
  if (hasWidget) ph.style.display = 'none';
  else ph.style.display = '';
}

// ---------- 收藏夹 ----------
function flattenBookmarks(nodes, pathPrefix = '') {
  const list = [];
  for (const node of nodes) {
    const currentPath = node.title ? (pathPrefix ? `${pathPrefix}/${node.title}` : node.title) : pathPrefix;
    if (node.url) {
      list.push({
        title: node.title || node.url,
        url: node.url,
        folderPath: pathPrefix || ''
      });
    }
    if (node.children && node.children.length) {
      list.push(...flattenBookmarks(node.children, currentPath));
    }
  }
  return list;
}

function renderFavoritesList(items) {
  const scroller = document.getElementById('favorites-scroller');
  if (!scroller) return;
  if (!items.length) {
    scroller.textContent = '暂无收藏内容';
    return;
  }
  const maxItems = 50;
  const sliced = items.slice(0, maxItems);
  scroller.innerHTML = '';
  for (const item of sliced) {
    const a = document.createElement('a');
    a.className = 'favorite-item';
    a.href = item.url;
    a.title = item.folderPath ? `${item.title}\n${item.folderPath}` : item.title;
    const icon = document.createElement('span');
    icon.className = 'favorite-icon';
    icon.textContent = (item.title || item.url).trim().charAt(0).toUpperCase();
    const textWrap = document.createElement('span');
    textWrap.className = 'favorite-text';
    textWrap.textContent = item.title || item.url;
    a.appendChild(icon);
    a.appendChild(textWrap);
    if (item.folderPath) {
      const folder = document.createElement('span');
      folder.className = 'favorite-folder';
      folder.textContent = ` · ${item.folderPath}`;
      a.appendChild(folder);
    }
    scroller.appendChild(a);
  }
}

let favoritesLoaded = false;

function initFavorites() {
  const toggle = document.getElementById('favorites-toggle');
  const panel = document.getElementById('favorites-panel');
  if (!toggle || !panel || !chrome?.bookmarks) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    const next = !expanded;
    toggle.setAttribute('aria-expanded', String(next));
    panel.hidden = !next;
    if (next && !favoritesLoaded) {
      chrome.bookmarks.getTree((tree) => {
        const items = flattenBookmarks(tree || []);
        renderFavoritesList(items);
        favoritesLoaded = true;
      });
    }
  });
}

// ---------- 初始化 ----------
async function init() {
  await getStorage();
  maybeRedirect();
  ensureWallpaperCache();
  applyWallpaper();
  applyGlass();
  initTime();
  initSearch();
  await renderWeather();
  updatePlaceholder();
  initFavorites();
}

init();
