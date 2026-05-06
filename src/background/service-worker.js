/**
 * MyEdgeStyle - Background Service Worker
 * 负责右键菜单，把选中文本带入新标签页 AI 助手。
 */

const PENDING_AI_REQUEST_KEY = 'pendingAiRequest';

const CONTEXT_MENU_ITEMS = [
  { id: 'myedgestyle-ai-chat', title: '用 AI 总结选中文本', aiMode: 'chat', prompt: '请总结下面这段内容，并提炼关键点：' },
  { id: 'myedgestyle-ai-error', title: '用 AI 解释报错/日志', aiMode: 'error', prompt: '请解释下面的报错或日志：' },
  { id: 'myedgestyle-ai-naming', title: '用 AI 生成命名建议', aiMode: 'naming', prompt: '请为下面的概念生成英文命名建议：' },
  { id: 'myedgestyle-ai-api', title: '用 AI 分析接口结构', aiMode: 'api', prompt: '请分析下面的接口结构或响应数据：' }
];

function setupContextMenus() {
  if (!chrome.contextMenus) return;
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'myedgestyle-ai-root',
      title: 'MyEdgeStyle AI 助手',
      contexts: ['selection']
    });
    for (const item of CONTEXT_MENU_ITEMS) {
      chrome.contextMenus.create({
        id: item.id,
        parentId: 'myedgestyle-ai-root',
        title: item.title,
        contexts: ['selection']
      });
    }
  });
}

function findMenuItem(menuItemId) {
  return CONTEXT_MENU_ITEMS.find((item) => item.id === menuItemId);
}

chrome.runtime.onInstalled.addListener(setupContextMenus);
chrome.runtime.onStartup.addListener(setupContextMenus);

chrome.contextMenus.onClicked.addListener((info) => {
  const item = findMenuItem(info.menuItemId);
  const selectionText = String(info.selectionText || '').trim();
  if (!item || !selectionText) return;

  chrome.storage.local.set({
    [PENDING_AI_REQUEST_KEY]: {
      text: `${item.prompt}\n\n${selectionText}`,
      aiMode: item.aiMode,
      createdAt: Date.now()
    }
  }, () => {
    const url = chrome.runtime.getURL(`src/newtab/index.html?view=ai&aiMode=${encodeURIComponent(item.aiMode)}`);
    chrome.tabs.create({ url });
  });
});
