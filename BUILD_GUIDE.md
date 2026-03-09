# 获取桌面版安装包

## 快速开始

### 方法一：GitHub Actions（无需配置环境，推荐）

1. **Fork 或推送代码到 GitHub 仓库**
2. **进入 Actions 页面**，找到 "Build Desktop App" 工作流
3. **点击 "Run workflow"** 触发构建
4. **等待 5-10 分钟**后，在 Releases 页面下载安装包

### 方法二：本地构建

#### macOS / Windows
直接运行：
```bash
./build-desktop.sh
```

#### Linux (Ubuntu/Debian)
先安装依赖，再运行构建：
```bash
# 1. 安装系统依赖
sudo apt update
sudo apt install -y libgtk-3-dev libwebkit2gtk-4.1-dev libsoup-3.0-dev libappindicator3-dev librsvg2-dev patchelf pkg-config

# 2. 运行构建脚本
./build-desktop.sh
```

#### Linux (Fedora)
```bash
sudo dnf install gtk3-devel webkit2gtk4.1-devel libsoup3-devel libappindicator-gtk3-devel librsvg2-devel patchelf pkg-config
./build-desktop.sh
```

## 构建输出位置

构建完成后，安装包位于：

```
src-tauri/target/release/bundle/
├── dmg/          # macOS (.dmg)
├── msi/          # Windows (.msi)
├── appimage/     # Linux (.AppImage)
└── deb/          # Linux (.deb)
```

## 分发应用

构建好的安装包可以直接分发给其他用户：

- **Windows 用户**：下载 `.msi` 文件，双击安装
- **macOS 用户**：下载 `.dmg` 文件，拖拽到 Applications 文件夹
- **Linux 用户**：下载 `.AppImage` 文件，赋予执行权限后运行

## 注意事项

1. macOS 构建需要 Xcode 命令行工具（首次运行会自动提示安装）
2. Windows 构建需要 Microsoft Visual C++ 生成工具
3. Linux 构建需要安装 GTK 和 WebKit 开发库
