# Echo Editorial / 回声编辑部

回声编辑部是一间本地优先的 AI 编辑室，把短视频素材变成可判断、可改写、可审稿、可包装、可复盘的内容资产。

请优先阅读：

1. `PROJECT_CHARTER.md` — 产品北极星
2. `README.md` — 对外说明
3. `server.js` — 当前后端主入口
4. `public/` — 本地应用 UI

## 当前产品方向

不要把项目继续理解成旧的单点文案工具。现阶段代码仍保留提取、转写、改写、配音、视频生成管线，但产品方向已经升级为：

```text
素材 -> 选题 -> 初稿 -> 审稿 -> 包装 -> 发布准备 -> 复盘
```

## 启动

```bash
npm install
pip install edge-tts faster-whisper
cp .env.example .env
npm start
```

打开 `http://localhost:3000`。

## 主要文件

- `server.js` — Express 后端，当前仍包含路由、提取、ASR、改写、TTS、视频生成等逻辑。
- `public/index.html` — 本地编辑室 UI。
- `public/js/main.js` — 前端交互和 API 调用。
- `public/css/style.css` — 当前视觉系统。
- `services/imageSearch.js` — 文案生成图片关键词并搜索/下载 Pexels 图片。
- `transcribe.py` — faster-whisper ASR。
- `tts.py` — edge-tts 语音生成。
- `docs/index.html` — GitHub Pages 落地页。

## API

| 接口 | 方法 | 说明 |
|---|---|---|
| `/api/config` | GET/POST | 本地 API Key 配置 |
| `/api/extract` | POST | 提取抖音视频描述 |
| `/api/transcript` | POST | 下载视频并生成逐字稿 |
| `/api/upload` | POST | 上传 MP4 并生成逐字稿 |
| `/api/rewrite` | POST | AI 改写，style: `xhs` / `douyin` |
| `/api/tts` | POST | 生成 MP3 配音 |
| `/api/video/generate` | POST | 生成竖屏 MP4 |
| `/api/clear-cache` | POST | 清除缓存 |

## 协作边界

- 工程重构按 GitHub 上 `claude-code` 标签 issue 执行。
- 品牌、README、落地页和视觉系统按 `codex-brand` 标签 issue 执行。
- 不要重新引入旧像素游戏风、历史命名或与“回声编辑部”不一致的视觉语言。

## 已知工程债

- `server.js` 过大，需要拆分 route/service/config/utils。
- `FFMPEG_PATH`、`PYTHON_PATH` 需要环境变量化和启动检测。
- `npm test` 仍只是占位级别，需要真实 check/test。
- CI 需要从语法检查扩展到服务启动冒烟测试。
