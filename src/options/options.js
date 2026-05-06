/**
 * MyEdgeStyle 选项页：新标签页组件、壁纸、毛玻璃
 */

const DEFAULT = {
  useDefaultNewTab: false,
  searchEngine: 'bing',
  showTime: true,
  time24: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  showWeather: true,
  weatherCityId: 'nanjing',
  weatherApiKey: '',
  wallpaperIndex: 0,
  wallpaperUrl: '',
  glassOpacity: 0.35,
  showGlass: true,
  devPorts: []
};

const DEFAULT_DEV_PORTS = [
  { name: 'Vite', url: 'http://localhost:5173', desc: '前端开发服务' },
  { name: 'React', url: 'http://localhost:3000', desc: '常见前端服务' },
  { name: 'API', url: 'http://localhost:8080', desc: '后端接口服务' },
  { name: 'Storybook', url: 'http://localhost:6006', desc: '组件开发' },
  { name: 'Docs', url: 'http://localhost:4321', desc: '本地文档站点' }
];

function $(id) {
  return document.getElementById(id);
}

function loadOptions() {
  chrome.storage.local.get(['newtab', 'useDefaultNewTab'], (data) => {
    const newtab = { ...DEFAULT, ...data.newtab };
    $('useDefaultNewTab').checked = !!data.useDefaultNewTab;
    $('searchEngine').value = newtab.searchEngine || 'bing';
    $('showTime').checked = newtab.showTime !== false;
    $('showWeather').checked = newtab.showWeather !== false;
    $('weatherCityId').value = newtab.weatherCityId || 'nanjing';
    $('time24').checked = newtab.time24 !== false;
    $('time12').checked = newtab.time24 === false;
    $('wallpaperUrl').value = newtab.wallpaperUrl || '';
    $('showGlass').checked = newtab.showGlass !== false;
    const pct = Math.round((newtab.glassOpacity ?? 0.35) * 100);
    $('glassOpacity').value = pct;
    $('glassOpacityValue').textContent = pct + '%';
    $('devPorts').value = formatDevPorts(newtab.devPorts);
    fillTimezoneSelect(newtab.timezone);
  });
}

function getDefaultDevPorts() {
  return DEFAULT_DEV_PORTS.map((item) => ({ ...item }));
}

function formatDevPorts(devPorts) {
  const ports = Array.isArray(devPorts) && devPorts.length ? devPorts : DEFAULT_DEV_PORTS;
  return ports.map((item) => {
    const parts = [item.name || '', item.url || '', item.desc || ''].map((value) => String(value).trim());
    return parts.join(' | ');
  }).join('\n');
}

function parseDevPorts(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((part) => part.trim());
      const name = parts[0] || '';
      const url = parts[1] || '';
      const desc = parts.slice(2).join(' | ');
      if (!name || !url) return null;
      return { name, url, desc };
    })
    .filter(Boolean);
}

function fillTimezoneSelect(selected) {
  const sel = $('timezone');
  if (!sel) return;
  let zones = [];
  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      zones = Intl.supportedValuesOf('timeZone');
    }
  } catch (_) {}
  if (!zones.length) {
    zones = ['Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Tokyo', 'America/New_York', 'Europe/London', 'UTC'];
  }
  zones.sort();
  sel.innerHTML = zones.map(z => `<option value="${z}" ${z === selected ? 'selected' : ''}>${z}</option>`).join('');
}

function saveOptions() {
  chrome.storage.local.get(['newtab'], (data) => {
    const existing = data.newtab || {};
    const newtab = {
      ...existing,
      useDefaultNewTab: $('useDefaultNewTab').checked,
      searchEngine: $('searchEngine').value || 'bing',
      showTime: $('showTime').checked,
      showWeather: $('showWeather').checked,
      weatherCityId: $('weatherCityId').value || 'nanjing',
      time24: $('time24').checked,
      timezone: $('timezone').value,
      wallpaperUrl: $('wallpaperUrl').value.trim(),
      showGlass: $('showGlass').checked,
      glassOpacity: parseInt($('glassOpacity').value, 10) / 100,
      devPorts: parseDevPorts($('devPorts').value)
    };
    chrome.storage.local.set({
      useDefaultNewTab: newtab.useDefaultNewTab,
      newtab: newtab
    }, () => {
      const status = $('status');
      status.textContent = '已保存';
      setTimeout(() => { status.textContent = ''; }, 2000);
    });
  });
}

function clearWallpaperCache() {
  chrome.storage.local.get(['newtab'], (data) => {
    const newtab = data.newtab || {};
    delete newtab.wallpaperResolvedUrl;
    delete newtab.wallpaperUpdatedAt;
    chrome.storage.local.set({ newtab }, () => {
      const status = $('status');
      status.textContent = '已清除壁纸缓存';
      setTimeout(() => { status.textContent = ''; }, 2000);
    });
  });
}

$('glassOpacity').addEventListener('input', () => {
  $('glassOpacityValue').textContent = $('glassOpacity').value + '%';
});

$('save').addEventListener('click', saveOptions);
$('clearWallpaperCache').addEventListener('click', clearWallpaperCache);
$('resetDevPorts').addEventListener('click', () => {
  $('devPorts').value = formatDevPorts(getDefaultDevPorts());
});

loadOptions();
