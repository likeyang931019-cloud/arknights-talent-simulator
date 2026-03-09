# GitHub Actions 桌面版构建 - 完整操作指南

## 🎯 目标
通过 GitHub Actions 自动构建明日方舟天赋模拟器的桌面安装包。

---

## 📋 操作清单（按顺序执行）

### 步骤 1: 创建 GitHub 仓库（2分钟）

**你需要操作：**

1. 打开 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `arknights-talent-simulator`（或其他你喜欢的名字）
   - **Description**: 明日方舟天赋养成模拟器
   - **Visibility**: 选择 Public（免费）或 Private（私有）
   - ✅ 勾选 "Add a README file"
3. 点击 **Create repository**

---

### 步骤 2: 推送代码到 GitHub（1分钟）

**你需要操作：**

在你的本地项目目录（`/workspace/projects`）运行：

```bash
# 1. 初始化 Git（如果还没初始化）
git init

# 2. 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/arknights-talent-simulator.git

# 3. 添加所有文件
git add .

# 4. 提交
git commit -m "feat: 初始版本 + 桌面版支持"

# 5. 推送到 GitHub
git branch -M main
git push -u origin main
```

**完成后：** 刷新 GitHub 页面，应该能看到所有代码已上传。

---

### 步骤 3: 触发自动构建（1分钟）

**有两种方式触发构建：**

#### 方式 A: 自动触发（推荐）
每次推送代码到 `main` 分支时，GitHub Actions 会自动运行构建。

#### 方式 B: 手动触发
1. 打开 GitHub 仓库页面
2. 点击顶部 **Actions** 标签
3. 在左侧选择 **Build Desktop App**
4. 点击右侧 **Run workflow** 按钮
   - 可以选择是否勾选 "创建发布版本"
5. 点击绿色 **Run workflow** 按钮

---

### 步骤 4: 等待构建完成（5-10分钟）

**这是自动的，你只需要等待：**

1. 在 Actions 页面可以看到构建进度
2. 会同时构建 4 个版本：
   - 🪟 Windows
   - 🍎 macOS (Intel)
   - 🍎 macOS (Apple Silicon)  
   - 🐧 Linux

**构建状态说明：**
- 🟡 黄色 = 进行中
- 🟢 绿色 = 成功
- 🔴 红色 = 失败

---

### 步骤 5: 下载安装包（1分钟）

**构建成功后，有两种方式获取安装包：**

#### 方式 A: 从 Artifacts 下载（每次构建都有）

1. 在 Actions 页面，点击完成的构建任务
2. 页面底部 **Artifacts** 区域
3. 下载对应平台的压缩包：
   - `Windows-build` - Windows 安装包
   - `macOS-Intel-build` - Intel Mac
   - `macOS-Apple-Silicon-build` - M1/M2/M3 Mac
   - `Linux-build` - Linux AppImage

#### 方式 B: 从 Releases 下载（更正式）

1. 在仓库页面点击右侧 **Releases**
2. 找到最新版本
3. 在 Assets 区域下载对应平台的安装包

---

## 📦 安装包说明

| 平台 | 文件名后缀 | 安装方式 |
|------|-----------|---------|
| Windows | `.msi` | 双击安装，按向导操作 |
| macOS Intel | `.dmg` | 打开 DMG，拖拽到 Applications |
| macOS Apple Silicon | `.dmg` | 打开 DMG，拖拽到 Applications |
| Linux | `.AppImage` | 右键 → 属性 → 允许执行 → 双击运行 |
| Linux | `.deb` | `sudo dpkg -i xxx.deb` |

---

## 🚀 发布新版本

当你想发布新版本时：

```bash
# 1. 更新版本号（修改 package.json 中的 version）
# 2. 提交并推送
git add .
git commit -m "release: v1.1.0"
git push

# 3. 创建标签（触发 Release 构建）
git tag v1.1.0
git push origin v1.1.0
```

推送标签后，GitHub Actions 会自动创建 Release 并上传安装包！

---

## ❓ 常见问题

### Q1: 构建失败了怎么办？
- 点击失败的任务，查看日志
- 常见问题：网络超时，重新运行通常可以解决

### Q2: 如何只构建特定平台？
- 编辑 `.github/workflows/build-desktop.yml`
- 删除不需要的 platform 条目

### Q3: 如何修改应用信息？
- 应用名称：`src-tauri/tauri.conf.json` 中的 `productName`
- 版本号：`package.json` 中的 `version`
- 图标：`src-tauri/icons/icon.png`（替换后重新运行 `pnpm tauri icon`）

### Q4: 如何更新代码后重新构建？
```bash
git add .
git commit -m "fix: 修复某某问题"
git push
```
推送后自动触发构建。

---

## 🎉 完成！

按照以上步骤，你就可以：
1. ✅ 获得 Windows 安装包
2. ✅ 获得 macOS 安装包（双架构）
3. ✅ 获得 Linux 安装包
4. ✅ 可以持续更新和发布新版本

有任何问题随时问我！
