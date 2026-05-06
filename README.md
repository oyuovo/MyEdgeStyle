# MyEdgeStyle

Edge 扩展：自定义新标签页（时间、天气、壁纸、毛玻璃镶边、收藏导航、AI 助手）。

兼容 Chromium 系浏览器（Edge / Chrome），使用 Manifest V3。

---

## 功能概览

### 新标签页

- **首页**：时间（可开关，支持 12/24 小时制与时区）、天气（Open-Meteo 免 Key，多城市）、搜索框（Bing/Google/百度）、壁纸背景、顶部/底部毛玻璃镶边及透明度。配置可在扩展设置中保存。
- **收藏导航**：独立视图，以「未分类」与「各级文件夹」分区展示浏览器书签；顶部搜索框按标题与网址实时过滤；卡片展示网站图标（扩展 Favicon API，失败时回退至 Google 图标服务，再失败则显示首字母）。
- **开发端口**：独立视图，快速打开常用本地开发服务，例如 Vite、React、API、Storybook、Docs；端口入口可在设置页自定义。
- **AI 助手**：独立视图，可在首页通过顶部 tab、左右方向键或左右滑动切换进入；用户可自行配置 OpenAI 兼容的 API 地址、API Key 与模型，支持常规问答、命名简称、报错解释、Commit Message、Regex、SQL 和 API 结构分析。不同模式使用独立对话记录，可单独清除当前模式记录。API Key 使用 WebCrypto 加密保存，设置后不回显，后续只能重新输入覆盖。
- **右键菜单**：在网页选中文本后，可通过右键菜单把内容带入 AI 助手，用于总结、报错解释、命名建议或接口分析；打开后默认填入输入框，不会自动发送。
- **壁纸**：支持预设图与自定义 URL；解析后的壁纸 URL 写入本地缓存以加快再次打开速度；设置页提供「清除本地壁纸缓存」按钮，清除后下次打开重新加载。

### 扩展设置（选项页）

- 新标签页：是否使用 Edge 默认新标签页、默认搜索引擎。
- 组件显示：时间、天气开关；天气城市（南京、北京、上海等）。
- 时间格式：24/12 小时制、时区选择。
- 壁纸：自定义壁纸 URL、清除本地壁纸缓存。
- 本地开发端口：按「名称 | 地址 | 说明」维护常用 localhost 入口。
- 镶边毛玻璃：开关、透明度滑块。

### 弹窗与后台

- 点击扩展图标打开弹窗，提供「新标签页与扩展设置」入口。
- 后台 Service Worker 负责注册选中文本右键菜单。

---

## 安装（开发者）

1. 打开 Edge，地址栏输入 `edge://extensions/`。
2. 开启「开发人员模式」。
3. 点击「加载解压缩的扩展」，选择本仓库根目录 `MyEdgeStyle`。
4. 新开标签页即为自定义页；点击扩展图标可进入设置。

---

## 项目结构

```
MyEdgeStyle/
├── manifest.json           # MV3 清单
├── README.md
├── assets/
│   └── icons/              # 16.png, 48.png, 128.png
└── src/
    ├── newtab/             # 新标签页（首页 + 收藏导航 + AI 助手）
    │   ├── index.html
    │   ├── style.css
    │   └── script.js
    ├── options/            # 扩展设置页
    │   ├── options.html
    │   ├── options.css
    │   └── options.js
    ├── popup/              # 扩展图标弹窗
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.js
    └── background/
        └── service-worker.js
```

---

## 权限说明

| 权限 | 用途 |
|------|------|
| `storage` | 保存新标签页与壁纸缓存等配置（chrome.storage.local） |
| `bookmarks` | 收藏导航读取浏览器书签并分组展示 |
| `favicon` | 收藏导航卡片显示网站图标（失败时回退至公网图标服务） |
| `contextMenus` | 在网页选中文本后提供 AI 助手右键菜单 |
| `host_permissions` (`http/https`) | AI 助手请求用户自行配置的接口地址 |

---

## 数据与缓存

- **配置**：新标签页相关设置、壁纸选择、毛玻璃透明度、AI API 地址/模型等存于 `chrome.storage.local` 的 `newtab` 及顶层键；AI API Key 以 AES-GCM 密文保存，解密密钥为不可导出的 `CryptoKey` 并存于 IndexedDB。
- **壁纸缓存**：仅缓存「已解析的壁纸 URL」与时间戳，不存图片二进制；实际图片依赖浏览器 HTTP 缓存。在设置中清除壁纸缓存或清除浏览器缓存后，下次打开会重新加载图片。

---

## 天气与图标

- 天气默认使用 [Open-Meteo](https://open-meteo.com/) 免 Key API，默认城市南京，可在设置中切换城市。
- 收藏导航图标：优先使用扩展 Favicon API；在 Edge 上该 API 可能失败，此时自动使用 Google 的 favicon 服务；仍失败则显示书签标题首字母。

---

## 图标资源

`assets/icons/` 下需包含 16.png、48.png、128.png。当前为占位图，可替换为自有图标。

---

## 使用 Edge 默认新标签页

在扩展设置中勾选「使用 Edge 默认新标签页」并保存后，新开标签页会跳转到 `edge://newtab`。
