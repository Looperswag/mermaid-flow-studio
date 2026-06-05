# Mermaid Flow Studio

一个面向 macOS 的本地 Mermaid `flowchart` 流程图工具，支持编辑、预览、自由调整布局，并导出图片。

## 操作流程

### 1. 打开应用

- 启动应用后，左侧是 Mermaid 源码编辑区，右侧是流程图预览区。
- 如果只是想快速体验，可以直接使用默认示例。

### 2. 打开或编写 Mermaid 内容

- 点击 `Open` 打开本地 Mermaid 文件。
- 或者直接在左侧 `Mermaid input` 中编写、粘贴流程图源码。
- 当前主要面向 `flowchart` 类型流程图。

### 3. 渲染流程图

- 点击 `Render`。
- 渲染成功后，右侧会显示 SVG 预览。

### 4. 调整展示方式

右侧工具栏支持以下操作：

- `Palette`：切换不同配色方案，不改变流程图内容。
- `Direction`：切换四个方向。
  - `Down`：垂直向下
  - `Up`：垂直向上
  - `Left`：水平朝左
  - `Right`：水平朝右
- `Layout mode`：
  - `Fixed`：固定布局，保持 Mermaid 自动排版结果
  - `Free`：自由布局，可手动调整节点位置

### 5. 在 Free 模式下微调流程图

- 点击节点后可以直接拖动节点位置。
- 选中节点后，可以在 `Free mode editor` 中修改节点文字。
- 节点移动后，连线会跟随更新。
- 同一个 Mermaid 文件会记住你上次使用的：
  - 配色方案
  - 方向
  - 固定 / 自由模式
  - 自由布局下的节点位置

### 6. 调整预览比例

- `Zoom out`：缩小
- `Zoom in`：放大
- `100%`：恢复原始比例
- `Fit to view`：让当前流程图尽量充满右侧展示画板

### 7. 导出图片

- 点击 `Export`
- 选择导出格式、背景和质量
- 当前支持导出：
  - `PNG`
  - `JPG`

## 功能说明

- 本地离线渲染 Mermaid `flowchart`
- 聊天式双栏编辑界面
- 多套流程图配色方案
- 四方向旋转展示
- 固定布局与自由布局切换
- 自由模式下节点拖拽与节点文字修改
- 按文件记住展示配置和自由布局
- SVG 预览、缩放和适配画板
- 导出 PNG / JPG 图片
- 支持打包为 macOS `.dmg`

## 安装与使用

如果你使用已经打包好的 `.dmg`：

1. 打开 `.dmg`
2. 将 `Mermaid Flow Studio.app` 拖到 `Applications`
3. 第一次启动时，如果 macOS 阻止打开，请右键应用并选择 `打开`
4. 确认一次系统提示后，后续可正常启动

## 本地开发

项目默认使用仓库内置的 Node 运行时：

```bash
export PATH="$PWD/.tools/node-v24.14.0-darwin-arm64/bin:$PATH"
npm install
npm run dev
```

## 测试与构建

```bash
export PATH="$PWD/.tools/node-v24.14.0-darwin-arm64/bin:$PATH"
npm test
npm run build
npm run test:e2e
```

## 打包

```bash
export PATH="$PWD/.tools/node-v24.14.0-darwin-arm64/bin:$PATH"
npm run package
```

打包产物默认输出到 `release/` 目录。
