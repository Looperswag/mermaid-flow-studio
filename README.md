![20260312161532](https://github.com/user-attachments/assets/43feb474-9552-43ee-a22a-ecc119d62c06)

# Mermaid Flow Studio

面向 macOS 的**本地离线** Mermaid `flowchart` 流程图工具：左侧写代码、右侧**实时**出图，支持配色 / 方向 / 自由布局定制，并可导出图片。所有渲染都在本地完成，不联网、不上传。

## ✨ 亮点

- **实时预览** —— 编辑或粘贴代码即自动渲染（防抖），无需手动点按钮；`Render` 仍可随时立即触发。
- **随窗口自适应** —— 缩放窗口或拖动分栏时，`Fit` 模式下流程图自动重新适配画板。
- **全局主题 + 深色模式** —— 顶栏 `Theme` 一键切换 浅色 / 深色 / 跟随系统，并可选 翡翠 / 海港 / 赤陶 / 石墨 多套强调色，整套界面联动换色（偏好本地记忆）。
- **多套配色 + 四向布局** —— 一键切换图表配色方案与上 / 下 / 左 / 右方向，不改动源码。
- **固定 / 自由布局** —— 自由模式下可拖动节点、就地编辑节点文字，连线自动跟随。
- **键盘快捷键** —— `⌘↵` 渲染、`⌘ +/-` 缩放、`⌘0` 原始比例、`⌘⇧0` 适配、`⌘E` 导出、`⌘O` 打开、`⌘N` 新建。
- **按文件记忆** —— 每个 Mermaid 文件单独记住配色、方向、布局模式与自由布局下的节点位置。
- **一键导出** —— 导出 PNG / JPG，可选背景与清晰度；可打包为 macOS `.dmg`。
- **安全优先** —— Mermaid `strict` 渲染 + DOMPurify 净化 + 生产环境 CSP + Electron 沙箱，安全地渲染外部 `.mmd` 文件。

## 🚀 快速开始

启动后左侧是 `Mermaid input` 源码区，右侧是预览区，默认已载入一个示例。直接在左侧编辑或粘贴代码，右侧会**自动更新**。

## 📖 操作指南

### 1. 编写或打开内容

- 在左侧 `Mermaid input` 中直接编写、粘贴流程图源码（当前面向 `flowchart` 类型）。
- 或点击 `Open` 打开本地 `.mmd` / `.mermaid` / `.txt` 文件。

### 2. 实时渲染

- 编辑 / 粘贴后会**自动防抖渲染**，所见即所得。
- 想立即重渲染可点击 `Render`，或按 `Cmd/Ctrl + Enter`。
- 语法有误时会提示错误，并保留上一次成功的预览，不会白屏。

### 3. 调整展示方式（右侧工具栏）

- `Palette`：切换配色方案，不改变流程图内容。
- `Direction`：切换方向 —— `Down`（向下）/ `Up`（向上）/ `Left`（朝左）/ `Right`（朝右）。
- `Layout mode`：
  - `Fixed`：固定布局，保持 Mermaid 自动排版。
  - `Free`：自由布局，可手动调整节点位置。

### 4. 自由模式微调

- 点击节点即可拖动其位置，连线会跟随更新。
- 选中节点后，在 `Free mode editor` 中修改节点文字。
- 配色、方向、布局模式与自由布局的节点位置会**按文件记住**，下次打开自动恢复。

### 5. 缩放与适配

- `Zoom in` / `Zoom out`：放大 / 缩小。
- `100%`：恢复原始比例。
- `Fit to view`：让流程图充满画板，并**随窗口自适应**。

### 6. 导出图片

- 点击 `Export`，选择格式（`PNG` / `JPG`）、背景与清晰度后导出。

## 💾 安装（使用打包好的 .dmg）

1. 前往 [Releases 页面](https://github.com/Looperswag/mermaid-flow-studio/releases)，下载最新的 `Mermaid Flow Studio-<版本>-arm64.dmg`（Apple Silicon）。
2. 打开 dmg，将 `Mermaid Flow Studio.app` 拖到 `Applications`。
3. 首次启动若被 macOS 拦截，请右键应用选择 `打开`，确认一次后即可正常使用。

## 🛠 本地开发

```bash
npm install
npm run dev
```

> 仓库内置了一份 Node 运行时，如需使用可先执行：
> `export PATH="$PWD/.tools/node-v24.14.0-darwin-arm64/bin:$PATH"`

## ✅ 测试与构建

```bash
npm test          # 单元 / 组件测试（Vitest）
npm run build     # 类型检查 + 生产构建
npm run test:e2e  # 端到端测试（Playwright，会自动构建并起预览服务）
```

## 📦 打包

```bash
npm run package
```

打包产物默认输出到 `release/` 目录（macOS `.dmg`）。

## 🧱 技术栈

Electron · React 19 · Vite · TypeScript · Mermaid 11 · DOMPurify。渲染与定制逻辑拆分为聚焦的模块，预览管线为 `渲染 → 应用配色/方向 → 交互式布局 → 净化 → 注入`。

## 🔐 安全

- Mermaid 以 `securityLevel: 'strict'` 渲染，标签使用原生 SVG `<text>`（不含 HTML），并禁用 click/href 回调。
- 注入前用 DOMPurify 对最终 SVG 再做一次净化（剥离 `<script>` / 事件处理器 / `javascript:`）。
- 生产构建注入严格 Content-Security-Policy；Electron 窗口开启 `sandbox`，预览仅通过受限的 `contextBridge` 与主进程通信。
