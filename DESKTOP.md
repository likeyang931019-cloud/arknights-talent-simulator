# 明日方舟天赋模拟器 - 桌面版

基于 Tauri 构建的轻量级桌面应用，将 Web 模拟器打包为原生 PC 软件。

## 特性

- **轻量小巧** - 应用体积仅 ~5MB（对比 Electron 的 100MB+）
- **原生性能** - 使用系统 WebView，启动迅速
- **离线可用** - 无需联网即可使用
- **跨平台** - 支持 Windows、macOS、Linux

## 下载安装

### 自动构建版本
通过 GitHub Actions 自动构建，可在 [Releases](../../releases) 页面下载：

- **Windows**: `.msi` 安装程序
- **macOS**: `.dmg` 磁盘镜像（支持 Intel 和 Apple Silicon）
- **Linux**: `.AppImage` 可执行文件 或 `.deb` 安装包

## 本地开发

### 环境要求

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Rust](https://www.rust-lang.org/tools/install) 最新稳定版

### 系统依赖

**Windows**: 无需额外依赖

**macOS**: 无需额外依赖

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev libsoup-3.0-dev libappindicator3-dev librsvg2-dev patchelf
```

**Fedora**:
```bash
sudo dnf install gtk3-devel webkit2gtk4.1-devel libsoup3-devel libappindicator-gtk3-devel librsvg2-devel patchelf
```

### 安装和运行

```bash
# 安装依赖
pnpm install

# 开发模式（热重载）
pnpm tauri-dev

# 构建生产版本
pnpm tauri-build
```

构建完成后，安装包位于 `src-tauri/target/release/bundle/` 目录。

## 项目结构

```
├── src/                  # 前端源码
│   ├── index.html
│   ├── main.ts
│   ├── ui.ts
│   ├── gameLogic.ts
│   └── ...
├── src-tauri/            # Tauri 配置和 Rust 源码
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── icons/            # 应用图标
│   └── src/
│       └── main.rs       # Rust 入口
└── .github/
    └── workflows/
        └── build-desktop.yml  # 自动构建工作流
```

## 技术栈

- **前端**: Vite + TypeScript + Tailwind CSS
- **桌面框架**: Tauri (Rust + WebView2)
- **构建工具**: GitHub Actions

## 许可证

MIT License
