#!/bin/bash
# 桌面应用构建脚本
# 支持本地构建和 Docker 构建

set -e

echo "🎮 明日方舟天赋模拟器 - 桌面版构建脚本"
echo "=========================================="

# 检查命令
command -v pnpm >/dev/null 2>&1 || { echo "❌ 请先安装 pnpm: npm install -g pnpm"; exit 1; }

# 安装前端依赖
echo "📦 安装依赖..."
pnpm install

# 检查 Rust
if ! command -v rustc &> /dev/null; then
    echo "⚠️ 未检测到 Rust，尝试安装..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# 检查系统依赖 (Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🔧 检查 Linux 系统依赖..."
    if ! dpkg -l | grep -q libgtk-3-dev; then
        echo "⚠️ 缺少 GTK 开发库，尝试安装..."
        echo "请运行以下命令安装依赖："
        echo ""
        echo "  Ubuntu/Debian:"
        echo "    sudo apt update"
        echo "    sudo apt install -y libgtk-3-dev libwebkit2gtk-4.1-dev libsoup-3.0-dev libappindicator3-dev librsvg2-dev patchelf pkg-config"
        echo ""
        echo "  Fedora:"
        echo "    sudo dnf install gtk3-devel webkit2gtk4.1-devel libsoup3-devel libappindicator-gtk3-devel librsvg2-devel patchelf pkg-config"
        echo ""
        exit 1
    fi
fi

# 构建
echo "🔨 开始构建桌面应用..."
pnpm tauri build

echo ""
echo "✅ 构建完成！"
echo ""
echo "📁 安装包位置:"

# 显示构建结果
BUNDLE_DIR="src-tauri/target/release/bundle"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    find "$BUNDLE_DIR" -name "*.dmg" -o -name "*.app" 2>/dev/null | head -5
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    find "$BUNDLE_DIR" -name "*.msi" -o -name "*.exe" 2>/dev/null | head -5
else
    # Linux
    find "$BUNDLE_DIR" -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" 2>/dev/null | head -5
fi

echo ""
echo "🎉 可以直接分发这些文件给其他人使用！"
