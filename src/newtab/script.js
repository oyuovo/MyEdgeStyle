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
  aiModel: '',
  devPorts: []
};

const AI_SECRET_DB = 'myedgestyle-secrets';
const AI_SECRET_STORE = 'secrets';
const AI_SECRET_KEY_ID = 'ai-api-key';
const PENDING_AI_REQUEST_KEY = 'pendingAiRequest';

const DEFAULT_DEV_PORTS = [
  { name: 'Vite', url: 'http://localhost:5173', desc: '前端开发服务' },
  { name: 'React', url: 'http://localhost:3000', desc: '常见前端服务' },
  { name: 'API', url: 'http://localhost:8080', desc: '后端接口服务' },
  { name: 'Storybook', url: 'http://localhost:6006', desc: '组件开发' },
  { name: 'Docs', url: 'http://localhost:4321', desc: '本地文档站点' }
];

const AI_MODE_CONFIG = {
  chat: {
    label: '问答',
    welcome: '这里是独立的问答对话。配置 API 地址、Key 和模型后，可以直接进行常规问答。',
    placeholder: '输入问题，Enter 发送，Shift+Enter 换行',
    submit: '发送',
    temperature: 0.7,
    systemPrompt: '你是一个简洁可靠的中文 AI 助手，回答要准确、清楚，必要时给出可执行步骤。'
  },
  naming: {
    label: '命名简称',
    welcome: '输入中文业务名词或技术名词后，会生成英文全称、简称和代码命名建议。',
    placeholder: '输入中文名词，例如：用户权限分组',
    submit: '生成',
    temperature: 0.2,
    systemPrompt: [
      '你是面向软件开发团队的中英命名助手。',
      '用户会输入中文业务名词或技术名词。',
      '请输出简洁、规范、可直接用于代码的英文命名建议。',
      '固定包含：英文全称、推荐简称、camelCase、PascalCase、snake_case、适用说明。',
      '优先使用开发者常见缩写，避免生僻词。'
    ].join('\n')
  },
  error: {
    label: '报错解释',
    welcome: '粘贴报错、堆栈或日志，我会说明可能原因、定位步骤和优先修复建议。',
    placeholder: '粘贴错误信息、堆栈或日志...',
    submit: '解释',
    temperature: 0.2,
    systemPrompt: [
      '你是资深软件调试助手。',
      '用户会提供错误日志、堆栈、异常信息或运行现象。',
      '请用中文输出：问题含义、最可能原因、排查步骤、建议修复、需要补充的信息。',
      '如果信息不足，明确说明假设，不要编造不存在的上下文。'
    ].join('\n')
  },
  commit: {
    label: 'Commit',
    welcome: '粘贴改动摘要或 diff，我会生成清晰的 Git commit message。',
    placeholder: '粘贴变更摘要或 diff...',
    submit: '生成',
    temperature: 0.25,
    systemPrompt: [
      '你是代码仓库提交信息助手。',
      '请根据用户提供的变更生成简洁、准确的 Git commit message。',
      '优先输出 Conventional Commits 风格：type(scope): summary。',
      '如有必要，再给 2-4 条正文要点。不要夸张，不要虚构未提到的改动。'
    ].join('\n')
  },
  regex: {
    label: 'Regex',
    welcome: '描述要匹配或替换的文本规则，我会给出正则、示例和注意事项。',
    placeholder: '描述正则需求，或粘贴样例文本...',
    submit: '生成',
    temperature: 0.2,
    systemPrompt: [
      '你是正则表达式助手。',
      '请根据用户需求输出可用的正则表达式、适用语言或引擎、示例匹配、边界条件。',
      '如果需要替换，也给出 replacement。优先解释清楚转义差异。'
    ].join('\n')
  },
  sql: {
    label: 'SQL',
    welcome: '粘贴 SQL 或描述查询需求，我会解释、优化或生成查询。',
    placeholder: '粘贴 SQL，或描述查询/优化需求...',
    submit: '分析',
    temperature: 0.25,
    systemPrompt: [
      '你是数据库与 SQL 助手。',
      '请根据用户输入解释 SQL、发现风险、给出优化建议或生成查询。',
      '输出时说明适用数据库方言假设，关注索引、过滤条件、JOIN、分页和数据安全。'
    ].join('\n')
  },
  api: {
    label: 'API 分析',
    welcome: '粘贴接口响应、请求体或类型结构，我会总结字段、风险和前端使用建议。',
    placeholder: '粘贴 JSON、接口响应、请求体或类型定义...',
    submit: '分析',
    temperature: 0.25,
    systemPrompt: [
      '你是 API 结构分析助手。',
      '请根据用户提供的 JSON、响应体、请求体或类型定义，输出字段含义推断、数据结构摘要、前端渲染/校验建议、潜在风险。',
      '不要泄露或复述敏感 token；如果看到疑似密钥，只提醒用户处理。'
    ].join('\n')
  }
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

const WEATHER_CACHE_KEY = 'newtabWeatherCache';
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;

const WALLPAPER_PRESETS = [
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&auto=format&fit=crop&q=80'
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
      window.location.replace('edge://newtab');
      return true;
    } catch (_) { }
  }
  return false;
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

function readWeatherCache() {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve(null);
      return;
    }
    chrome.storage.local.get([WEATHER_CACHE_KEY], (data) => {
      resolve(data[WEATHER_CACHE_KEY] || null);
    });
  });
}

function writeWeatherCache(result) {
  if (typeof chrome === 'undefined' || !chrome.storage?.local || !result?.current) return;
  chrome.storage.local.set({
    [WEATHER_CACHE_KEY]: {
      cityId: config.weatherCityId || 'nanjing',
      fetchedAt: Date.now(),
      result
    }
  }, () => { });
}

function isUsableWeatherCache(cache) {
  return cache?.cityId === (config.weatherCityId || 'nanjing') && cache?.result?.current;
}

function isFreshWeatherCache(cache) {
  return isUsableWeatherCache(cache) && Date.now() - (cache.fetchedAt || 0) < WEATHER_CACHE_TTL_MS;
}

function weatherCodeToText(code) {
  const map = { 0: '晴', 1: '大部晴朗', 2: '少云', 3: '多云', 45: '雾', 48: '雾', 51: '毛毛雨', 61: '雨', 63: '雨', 80: '阵雨', 95: '雷暴' };
  return map[code] || '未知';
}

function renderWeatherResult(el, result) {
  const { current, cityName } = result;
  const temp = Math.round(current.temperature_2m);
  const desc = weatherCodeToText(current.weather_code);
  el.innerHTML = `
    <span class="temp">${temp}°C</span>
    <span class="desc">${desc}</span>
    <span class="location">${cityName}</span>
  `;
}

async function renderWeather() {
  const el = document.getElementById('widget-weather');
  if (!el || !config.showWeather) {
    if (el) el.hidden = true;
    return;
  }
  el.hidden = false;
  const cache = await readWeatherCache();
  if (isUsableWeatherCache(cache)) {
    renderWeatherResult(el, cache.result);
    if (isFreshWeatherCache(cache)) return;
  }
  const result = await fetchWeather();
  if (!result || !result.current) {
    if (!isUsableWeatherCache(cache)) {
      el.innerHTML = '<span class="desc">天气获取失败</span>';
    }
    return;
  }
  writeWeatherCache(result);
  renderWeatherResult(el, result);
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

function runWhenIdle(task) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(task, { timeout: 1200 });
    return;
  }
  setTimeout(task, 0);
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

function getDevPorts() {
  const ports = Array.isArray(config.devPorts) && config.devPorts.length ? config.devPorts : DEFAULT_DEV_PORTS;
  return ports
    .map((item) => {
      const name = String(item.name || '').trim();
      const url = String(item.url || '').trim();
      const desc = String(item.desc || '').trim();
      if (!name || !url) return null;
      return { name, url, desc };
    })
    .filter(Boolean);
}

function matchDevPort(item, query) {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  return [item.name, item.url, item.desc].some((value) => String(value || '').toLowerCase().includes(q));
}

function createDevPortCard(item) {
  const a = document.createElement('a');
  a.className = 'dev-port-card';
  a.href = item.url;
  a.title = item.url;
  const title = document.createElement('span');
  title.className = 'dev-port-title';
  title.textContent = item.name;
  const url = document.createElement('span');
  url.className = 'dev-port-url';
  url.textContent = item.url.replace(/^https?:\/\//, '');
  const desc = document.createElement('span');
  desc.className = 'dev-port-desc';
  desc.textContent = item.desc || '本地开发服务';
  a.appendChild(title);
  a.appendChild(url);
  a.appendChild(desc);
  return a;
}

function renderDevPorts() {
  const content = document.getElementById('dev-ports-content');
  const search = document.getElementById('dev-ports-search');
  if (!content) return;
  const q = search ? search.value : '';
  const items = getDevPorts().filter((item) => matchDevPort(item, q));
  content.innerHTML = '';
  if (!items.length) {
    content.textContent = q ? '无匹配端口' : '暂无本地端口配置';
    return;
  }
  for (const item of items) {
    content.appendChild(createDevPortCard(item));
  }
}

function initDevPorts() {
  const search = document.getElementById('dev-ports-search');
  const refresh = document.getElementById('dev-ports-refresh');
  if (search) {
    search.addEventListener('input', renderDevPorts);
  }
  if (refresh) {
    refresh.addEventListener('click', renderDevPorts);
  }
  renderDevPorts();
}

const VIEW_ORDER = ['home', 'favorites', 'ports', 'ai'];
let currentViewId = 'home';
let aiMode = 'chat';
const aiConversations = {};
for (const mode of Object.keys(AI_MODE_CONFIG)) {
  aiConversations[mode] = [];
}
let setActiveViewHandler = null;

function getKnownAiMode(mode) {
  return AI_MODE_CONFIG[mode] ? mode : 'chat';
}

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

function getAiConversation(mode = aiMode) {
  const knownMode = getKnownAiMode(mode);
  if (!aiConversations[knownMode]) aiConversations[knownMode] = [];
  return aiConversations[knownMode];
}

function getAiWelcomeText(mode = aiMode) {
  return AI_MODE_CONFIG[getKnownAiMode(mode)].welcome;
}

function createAiMessageElement(role, text) {
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
  return { item, body };
}

function appendAiMessageElement(role, text) {
  const messages = document.getElementById('ai-messages');
  if (!messages) return null;
  const { item, body } = createAiMessageElement(role, text);
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
  return body;
}

function renderAiMessages() {
  const messages = document.getElementById('ai-messages');
  if (!messages) return;
  messages.innerHTML = '';
  const conversation = getAiConversation();
  if (!conversation.length) {
    appendAiMessageElement('assistant', getAiWelcomeText());
    return;
  }
  conversation.forEach((message) => {
    appendAiMessageElement(message.role, message.text);
  });
}

function addAiConversationMessage(role, text, mode = aiMode) {
  const message = { role, text };
  getAiConversation(mode).push(message);
  const body = mode === aiMode ? appendAiMessageElement(role, text) : null;
  return { message, body };
}

function clearCurrentAiConversation() {
  getAiConversation().length = 0;
  renderAiMessages();
}

function setAiMode(nextMode) {
  aiMode = getKnownAiMode(nextMode);
  document.querySelectorAll('.ai-mode-btn').forEach((btn) => {
    const active = btn.dataset.aiMode === aiMode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  const input = document.getElementById('ai-input');
  const submit = document.getElementById('ai-submit');
  const modeConfig = AI_MODE_CONFIG[aiMode];
  if (input) {
    input.placeholder = modeConfig.placeholder;
  }
  if (submit) submit.textContent = modeConfig.submit;
  renderAiMessages();
}

function getAiSystemPrompt(mode = aiMode) {
  return AI_MODE_CONFIG[getKnownAiMode(mode)].systemPrompt;
}

function normalizeAiContent(data) {
  const choice = data?.choices?.[0];
  const content = choice?.message?.content ?? choice?.text ?? data?.output_text;
  if (Array.isArray(content)) {
    return content.map((part) => part.text || part.content || '').join('').trim();
  }
  return String(content || '').trim();
}

async function requestAiAnswer(userText, mode = aiMode) {
  const requestMode = getKnownAiMode(mode);
  const { apiUrl, model } = getAiRuntimeConfig();
  if (!apiUrl) throw new Error('请先配置 API 地址。');
  if (!model) throw new Error('请先配置模型名称。');
  const apiKey = await decryptAiApiKey();
  if (!apiKey) throw new Error('请先设置 API Key。');
  const messages = [
    { role: 'system', content: getAiSystemPrompt(requestMode) }
  ];
  if (requestMode === 'chat') {
    let history = getAiConversation('chat')
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({ role: message.role, content: message.text }));
    const last = history[history.length - 1];
    if (last?.role === 'user' && last.content === userText) {
      history = history.slice(0, -1);
    }
    messages.push(...history.slice(-10));
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
      temperature: AI_MODE_CONFIG[requestMode].temperature
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
  const clearBtn = document.getElementById('ai-clear-chat');

  loadAiConfigFields();
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

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearCurrentAiConversation();
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
      const requestMode = aiMode;
      submit.disabled = true;
      submit.textContent = '请求中';
      try {
        await saveAiConfigFromFields({ requireKey: true });
        addAiConversationMessage('user', text, requestMode);
        input.value = '';
        const pending = addAiConversationMessage('assistant', '思考中...', requestMode);
        const answer = await requestAiAnswer(text, requestMode);
        pending.message.text = answer;
        if (pending.body) pending.body.textContent = answer;
      } catch (err) {
        addAiConversationMessage('error', err?.message || '未知错误', requestMode);
      } finally {
        submit.disabled = false;
        submit.textContent = AI_MODE_CONFIG[aiMode].submit;
      }
    });
  }
}

let aiAssistantInitialized = false;

function ensureAiAssistantInitialized() {
  if (aiAssistantInitialized) return;
  aiAssistantInitialized = true;
  initAiAssistant();
}

function openView(viewId) {
  if (setActiveViewHandler) {
    setActiveViewHandler(viewId);
  }
}

function readPendingAiRequest() {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      resolve(null);
      return;
    }
    chrome.storage.local.get([PENDING_AI_REQUEST_KEY], (data) => {
      resolve(data[PENDING_AI_REQUEST_KEY] || null);
    });
  });
}

function clearPendingAiRequest() {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.remove(PENDING_AI_REQUEST_KEY, () => { });
  }
}

async function handleLaunchParams() {
  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get('view');
  const requestedMode = params.get('aiMode');
  if (requestedView === 'ai') {
    openView('ai');
    ensureAiAssistantInitialized();
    const pending = await readPendingAiRequest();
    setAiMode(pending?.aiMode || requestedMode || 'chat');
    if (pending?.text && Date.now() - (pending.createdAt || 0) < 5 * 60 * 1000) {
      const input = document.getElementById('ai-input');
      if (input) {
        input.value = String(pending.text).slice(0, 12000);
        input.focus();
      }
      clearPendingAiRequest();
    }
  } else if (requestedView && VIEW_ORDER.includes(requestedView)) {
    openView(requestedView);
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
  const tabPorts = document.getElementById('tab-ports');
  const tabAi = document.getElementById('tab-ai');
  const viewHome = document.getElementById('view-home');
  const viewFavorites = document.getElementById('view-favorites');
  const viewPorts = document.getElementById('view-ports');
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
      { id: 'ports', tab: tabPorts, view: viewPorts },
      { id: 'ai', tab: tabAi, view: viewAi }
    ];
    entries.forEach((entry) => {
      const active = entry.id === currentViewId;
      entry.tab?.classList.toggle('active', active);
      entry.tab?.setAttribute('aria-selected', String(active));
      entry.view?.classList.toggle('hidden', !active);
    });
    if (currentViewId === 'ai') {
      ensureAiAssistantInitialized();
    } else if (currentViewId === 'ports') {
      renderDevPorts();
    }
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

  setActiveViewHandler = setActiveView;

  if (tabHome && tabFavorites && tabPorts && tabAi && viewHome && viewFavorites && viewPorts && viewAi) {
    tabHome.addEventListener('click', () => setActiveView('home'));
    tabFavorites.addEventListener('click', () => setActiveView('favorites'));
    tabPorts.addEventListener('click', () => setActiveView('ports'));
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
  if (maybeRedirect()) return;
  ensureWallpaperCache();
  applyWallpaper();
  applyGlass();
  initTime();
  initSearch();
  updatePlaceholder();
  initDevPorts();
  initFavorites();
  await handleLaunchParams();
  runWhenIdle(() => {
    migratePlainAiApiKey().catch(() => {
      delete config.aiApiKey;
    });
    renderWeather().catch(() => { });
  });
}

init();
