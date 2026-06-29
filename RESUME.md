# RESUME.md — 回声编辑部

## 当前状态

项目已完成从旧单点工具命名到 **Echo Editorial / 回声编辑部** 的迁移。

新的产品定位：

> 一间本地优先的 AI 编辑室，把短视频素材变成可判断、可改写、可审稿、可包装、可复盘的内容资产。

## 当前已具备的能力

| 阶段 | 能力 | 主要文件 |
|---|---|---|
| 输入 | 抖音链接、本地 MP4、手动文案 | `public/index.html`, `public/js/main.js` |
| 提取 | 页面描述提取、视频下载、音频抽取 | `server.js` |
| 转写 | faster-whisper 逐字稿 | `transcribe.py` |
| 改写 | 小红书 / 抖音精选双风格 prompt | `server.js` |
| 配音 | edge-tts 中文 MP3 | `tts.py` |
| 成片 | Pexels 配图 + ffmpeg 竖屏 MP4 | `services/imageSearch.js`, `server.js` |

## 重要文档

- `PROJECT_CHARTER.md` — 产品北极星，定义“AI 编辑室 / 编辑 OS”方向。
- `README.md` — GitHub 首页说明。
- `docs/index.html` — GitHub Pages 落地页。
- `CLAUDE.md` — 给 Claude Code / Codex 的本地协作说明。

## 近期工程任务

GitHub 上 `claude-code` 标签的 issues 负责工程侧：

- 统一工程侧命名与元信息。
- 移除硬编码 `FFMPEG_PATH` / `PYTHON_PATH`。
- 拆分过大的 `server.js`。
- 增加真实 `check/test` 命令。
- 增强 CI 和服务启动冒烟测试。
- 梳理 API Key 本地存储和日志安全。

## 近期品牌任务

GitHub 上 `codex-brand` 标签的 issues 负责：

- README 的产品叙事。
- GitHub Pages 落地页。
- 本地应用 UI 的外在一致性。

## 启动

```bash
npm install
pip install edge-tts faster-whisper
cp .env.example .env
npm start
```

打开：

```text
http://localhost:3000
```

## 设计原则

- 明亮、清新、有效率、有秩序。
- 像现代编辑部和创作者工作台，不像机器、炼金室、黑夜、赛博、旧像素游戏或杂乱工具箱。
- 对外表达围绕“选题、初稿、审稿、包装、复盘”。
- 当前代码仍是内容生成管线，产品方向是编辑 OS。
