<p align="center">
  <img src="whale-demo.gif" alt="回声编辑部 Echo Editorial demo" width="800">
</p>

<h1 align="center">回声编辑部 · Echo Editorial</h1>
<h3 align="center">把短视频的回声，整理成新的稿、新的声音、新的视频。</h3>

<p align="center">
  <a href="https://rookage.github.io/whale/">项目主页</a>
  ·
  <a href="#快速开始">快速开始</a>
  ·
  <a href="#技术栈">技术栈</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Node.js-20%2B-brightgreen" alt="Node">
  <img src="https://img.shields.io/badge/Python-3.12%2B-blue" alt="Python">
  <img src="https://img.shields.io/badge/AI-DeepSeek-blueviolet" alt="DeepSeek">
  <img src="https://img.shields.io/badge/ASR-faster--whisper-ff69b4" alt="faster-whisper">
  <img src="https://img.shields.io/badge/TTS-edge--tts-9cf" alt="edge-tts">
</p>

---

## 它是什么

回声编辑部是一个面向内容创作者的短视频再创作工作台。

你给它一个抖音链接、一段视频，或者一段手动粘贴的文案；它会帮你提取内容、生成逐字稿、改写成适合发布的平台文案，再继续生成配音和竖屏视频。

它不是简单的“搬运工具”。更准确地说，它像一个小编辑部：先听见原视频里的回声，再把它整理成你的表达。

## 适合谁

- 想把短视频内容改写成小红书笔记、抖音精选稿的创作者
- 想快速从视频里提取观点、结构和口播稿的人
- 想把一段内容继续做成配音、竖屏视频的人
- 想研究 AI 内容工作流，但不想从零拼工具链的人

## 工作流

| 阶段 | 做什么 | 说明 |
|---|---|---|
| 1. 提取 | 从抖音链接提取描述或下载视频 | Puppeteer（浏览器自动化工具）负责打开页面并提取信息 |
| 2. 转写 | 从视频声音生成逐字稿 | ASR（Automatic Speech Recognition，语音识别）由 faster-whisper 完成 |
| 3. 改写 | 生成小红书或抖音精选文案 | DeepSeek API（AI 模型接口）负责文本改写 |
| 4. 配音 | 把文案变成中文语音 | TTS（Text-to-Speech，文字转语音）由 edge-tts 完成 |
| 5. 成片 | 生成 1080x1920 竖屏视频 | ffmpeg（音视频处理工具）合成配图、音频和视频 |

## 当前能力

- 支持抖音链接粘贴，自动清理分享文案里的真实链接
- 支持快速提取视频描述
- 支持下载视频并生成完整逐字稿
- 支持上传本地 MP4 生成逐字稿
- 支持小红书、抖音精选两种改写风格
- 支持 6 种中文 TTS 配音
- 支持按文案搜索配图并合成竖屏视频
- 支持本地保存 API Key（接口密钥）配置

## 快速开始

```bash
git clone https://github.com/Rookage/whale.git
cd whale

npm install
pip install edge-tts faster-whisper

cp .env.example .env
npm start
```

启动后打开：

```text
http://localhost:3000
```

你至少需要配置：

```env
DEEPSEEK_API_KEY=sk-your-key-here
```

如果要生成带配图的视频，可以额外配置：

```env
PEXELS_API_KEY=your-pexels-key-here
```

## 本地与隐私

这是一个 local-first（本地优先）的工具。视频、音频、配置文件默认保存在你自己的机器上。

需要注意：

- DeepSeek API Key 会保存在本地 `config.json`
- `config.json` 已加入 `.gitignore`，不会被正常提交到 GitHub
- AI 改写会调用 DeepSeek API（第三方 AI 接口）
- 图片搜索会调用 Pexels API（图库接口）
- TTS 配音会使用 edge-tts（微软语音服务的非官方封装）

## 技术栈

| 层 | 技术 |
|---|---|
| 服务端 | Node.js + Express（Web 服务框架） |
| 前端 | 原生 HTML / CSS / JavaScript |
| 页面提取 | Puppeteer（浏览器自动化） |
| 语音识别 | faster-whisper（Whisper 模型的高性能实现） |
| AI 改写 | DeepSeek API |
| 语音合成 | edge-tts |
| 图片搜索 | Pexels API |
| 视频合成 | ffmpeg |
| 自动检查 | GitHub Actions CI（持续集成，自动跑检查） |

## 项目状态

回声编辑部还在整理和升级中。当前重点是把原本的 WHALE 工具，统一成一个更完整的内容工作台：

- 工程侧：拆分服务模块、补测试、增强 CI、移除本机硬编码路径
- 产品侧：增加稿件历史、多版本生成、编辑部模板和稿件评分
- 品牌侧：统一 README、GitHub Pages 落地页和对外表达

相关计划已经整理在 GitHub Issues（问题单）里。

## License

MIT

---

<p align="center">
  <sub>Built by <a href="https://github.com/Rookage">Rookage</a>. Refined as Echo Editorial.</sub>
</p>
