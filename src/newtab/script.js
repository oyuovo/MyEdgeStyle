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
  searchEngine: 'bing'
};

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
    } catch (_) {}
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
    chrome.storage.local.set({ newtab }, () => {});
  }
}

function saveNewtabConfig(updates) {
  Object.assign(config, updates);
  const newtab = { ...config };
  delete newtab.useDefaultNewTab;
  chrome.storage?.local?.set({ newtab }, () => {});
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
    if (!chrome?.bookmarks?.getTree) {
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

let favoritesData = null;

function ensureFavoritesData() {
  return favoritesData
    ? Promise.resolve(favoritesData)
    : getBookmarksGroupedByRoot().then((groups) => {
        favoritesData = groups;
        return groups;
      });
}

function initFavorites() {
  const navSearch = document.getElementById('favorites-nav-search');
  const tabHome = document.getElementById('tab-home');
  const tabFavorites = document.getElementById('tab-favorites');
  const viewHome = document.getElementById('view-home');
  const viewFavorites = document.getElementById('view-favorites');

  function applyFilterNav() {
    const q = navSearch ? navSearch.value : '';
    if (favoritesData) renderFavoritesNav(favoritesData, q);
  }

  if (tabHome && tabFavorites && viewHome && viewFavorites) {
    tabHome.addEventListener('click', () => {
      tabHome.classList.add('active');
      tabHome.setAttribute('aria-selected', 'true');
      tabFavorites.classList.remove('active');
      tabFavorites.setAttribute('aria-selected', 'false');
      viewHome.classList.remove('hidden');
      viewFavorites.classList.add('hidden');
    });
    tabFavorites.addEventListener('click', () => {
      tabFavorites.classList.add('active');
      tabFavorites.setAttribute('aria-selected', 'true');
      tabHome.classList.remove('active');
      tabHome.setAttribute('aria-selected', 'false');
      viewHome.classList.add('hidden');
      viewFavorites.classList.remove('hidden');
      ensureFavoritesData().then((groups) => {
        renderFavoritesNav(groups, navSearch ? navSearch.value : '');
      });
    });
  }

  if (navSearch) {
    navSearch.addEventListener('input', () => {
      if (favoritesData) applyFilterNav();
    });
  }
}

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
