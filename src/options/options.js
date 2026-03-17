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
  showGlass: true
};

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
    fillTimezoneSelect(newtab.timezone);
  });
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
      glassOpacity: parseInt($('glassOpacity').value, 10) / 100
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

loadOptions();
