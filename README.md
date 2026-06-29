# Echo Editorial — 回声编辑部

[![CI](https://github.com/Rookage/echo-editorial/actions/workflows/ci.yml/badge.svg)](https://github.com/Rookage/echo-editorial/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-20%2B-brightgreen.svg)](./package.json)
[![Python](https://img.shields.io/badge/python-3.12%2B-blue.svg)](./transcribe.py)
[![Local-first](https://img.shields.io/badge/local--first-creator%20tool-8a63d2.svg)](#本地与隐私--local-and-privacy)

![Echo Editorial hero](docs/assets/echo-editorial-hero.png)

> **中文**：从一条短视频开始，完成选题、写稿、审稿、配音、成片与复盘。
> **English**: Start with one short video; turn it into topic judgment, draft, review, voiceover, vertical cut, and feedback.

**回声编辑部 / Echo Editorial** 是一间本地优先的 AI 编辑室。它把短视频素材变成可判断、可改写、可审稿、可包装、可复盘的内容资产。

当前代码已经跑通了内容生成管线：抖音链接或 MP4 输入，生成逐字稿、平台稿、中文配音和竖屏视频。下一步的产品方向不是继续堆按钮，而是把这条管线升级成真正的编辑工作流。

[GitHub Pages](https://rookage.github.io/echo-editorial/) · [Project Charter / 项目章程](./PROJECT_CHARTER.md) · [Issues](https://github.com/Rookage/echo-editorial/issues)

---

## 为什么需要它 / Why It Exists

做内容最累的地方，往往不是灵感，而是把灵感整理成可发布的作品。

- 一个短视频看完觉得有价值，但要手动暂停、手抄、整理。
- 抖音口播想转成小红书笔记，语气、结构、标题都要重写。
- 文案有了，还要配音、找图、剪成竖屏视频。
- AI 能帮忙，但每一步散在不同工具里，最后还是靠人来回搬运。
- 发布后表现好不好，也没有反馈回到下一次写稿里。

**回声编辑部解决的不是“抓一个链接”这么小的事，而是短视频素材到内容资产之间的编辑层。**
Echo Editorial is not a downloader or a one-shot rewriting button. It is the editorial layer between raw short-video material and publishable content assets.

---

## 从管道到编辑室 / From Pipeline to Editorial Room

当前底层能力是一条管线：

```text
抖音 URL / MP4 / 手动文案
  -> 提取 / 转写
  -> AI 改写
  -> TTS 配音
  -> 视频合成
```

但产品目标是一间编辑室：

```text
素材发现 -> 选题判断 -> 初稿生成 -> 审稿评分
  -> 多轮修改 -> 配音/字幕/视频包装 -> 发布准备 -> 数据回响
```

管道的本质是自动化。编辑室的本质是判断、分工、迭代和复盘。

---

## 四个编辑角色 / Four Editorial Roles

| 角色 / Role | 职能 / Function | 要回答的问题 / Question |
|---|---|---|
| 选题编辑 | 判断素材价值 | 这个视频值不值得做？适合哪个平台？ |
| 初稿编辑 | 生成第一版稿件 | 用什么角度、什么模板、什么语气？ |
| 审稿编辑 | 评分与修改建议 | 标题、开头、结构、口语感过关吗？ |
| 包装编辑 | 发布前多媒体包装 | 配音、字幕、封面、竖屏视频是否就绪？ |

现有界面里的角色元素不应该只是装饰。长期看，它们应该变成真实的 AI 编辑分工。

---

## 当前能力 / What Works Today

| 能力 | 说明 |
|---|---|
| 输入素材 | 支持抖音链接、本地 MP4、手动粘贴文案 |
| 内容提取 | 可提取页面描述，也可从视频声音生成逐字稿 |
| AI 改写 | 支持小红书、抖音精选两种方向 |
| 中文配音 | edge-tts 生成 MP3，支持语速调节 |
| 视频合成 | Pexels 配图 + ffmpeg 生成竖屏 MP4 |
| 本地配置 | DeepSeek / Pexels key 可保存在本地 |

ASR（Automatic Speech Recognition，语音识别）负责把声音转成文字。
TTS（Text-to-Speech，文字转语音）负责把文字转成配音。
CI（Continuous Integration，持续集成）负责在 GitHub 上自动检查代码。

---

## 真正的护城河 / The Real Moat

项目里最有价值的东西不是 ffmpeg、Puppeteer 或某个 API，而是 prompt 里的编辑方法论。

当前小红书 prompt 已经包含：

- CES 评分机制
- 标题公式
- 情绪钩子
- 去 AI 味规则
- 平台格式约束
- TTS 友好的口播规范

这些不应只是写死在代码里的 prompt。它们应该逐步产品化为模板系统：

- 用户可创建模板
- 模板可分享
- 模板可 fork（复制后改造）
- 模板可评分
- 不同行业有不同模板：母婴、科技、财经、探店、知识科普、情感、职场

模板系统不是多加几个选项，而是回声编辑部的平台化入口。

---

## 三层产品能力 / Three Product Layers

### 1. 内容生成管线

```text
提取 -> 转写 -> 改写 -> 配音 -> 视频
```

这是当前已有基础，让素材可以快速变成稿、声、片。

### 2. 编辑工作流

```text
选题 -> 初稿 -> 审稿 -> 修改 -> 包装 -> 发布准备
```

这是近期最重要的产品升级，让用户感觉自己在经营一间编辑室。

### 3. 创作者资产系统

```text
模板 -> 历史稿件 -> 个人风格 -> 发布数据 -> 复盘反馈
```

这是长期护城河，让工具逐渐理解创作者自己的表达方式。

---

## 快速开始 / Quick Start

```bash
git clone https://github.com/Rookage/echo-editorial.git
cd echo-editorial

npm install
pip install edge-tts faster-whisper

cp .env.example .env
npm start
```

打开：

```text
http://localhost:3000
```

至少需要：

```env
DEEPSEEK_API_KEY=sk-your-key-here
```

如果要生成带配图的视频，可以再配置：

```env
PEXELS_API_KEY=your-pexels-key-here
```

---

## 当前可信边界 / Current Boundaries

已具备：

- 抖音链接描述提取。
- 抖音视频下载后生成逐字稿。
- 本地 MP4 上传后生成逐字稿。
- 小红书 / 抖音精选双风格改写。
- 中文 TTS 配音与语速控制。
- Pexels 配图 + ffmpeg 竖屏视频生成。
- GitHub Pages 公开展示页。

仍在打磨：

- `server.js` 过大，路由、服务和配置需要拆分。
- `FFMPEG_PATH` 和 `PYTHON_PATH` 仍需彻底环境变量化。
- `npm test` 仍需替换为真实检查命令。
- CI 目前覆盖还偏基础。
- 视频生成仍偏 slideshow（幻灯片式视频），还不是完整分镜剪辑系统。

---

## 架构地图 / Architecture Map

```text
                    输入 / Inputs
        Douyin URL / shared text / local MP4 / manual copy
                         |
                         v
                  Web UI / public/
              index.html + css + main.js
                         |
                         v
                   API / server.js
        ┌────────────────┼─────────────────┐
        v                v                 v
   Extract / ASR       Rewrite          Voice / Video
   Puppeteer           DeepSeek         edge-tts + ffmpeg
   faster-whisper      prompts          Pexels images
        |                |                 |
        v                v                 v
   transcript text   platform copy      MP3 / vertical MP4
```

---

## 本地与隐私 / Local and Privacy

回声编辑部是 local-first（本地优先）的工具。视频、音频、图片、配置文件默认留在本机。

但它会调用外部服务：

| 服务 | 用途 | 说明 |
|---|---|---|
| DeepSeek API | 文案改写 | 原文会发送给 DeepSeek |
| Pexels API | 搜索配图 | 只发送图片搜索关键词 |
| edge-tts | 文字转语音 | 使用微软语音服务的非官方封装 |
| Douyin | 页面访问与视频获取 | 受平台限制和反爬变化影响 |

密钥说明：

- `DEEPSEEK_API_KEY` 和 `PEXELS_API_KEY` 可写入 `.env`。
- UI 保存的配置会写入本地 `config.json`。
- `.env` 和 `config.json` 都在 `.gitignore` 中，不应提交到 GitHub。

---

## 路线 / Roadmap

| 路线 | 终局 | 核心赌注 |
|---|---|---|
| A. 编辑 OS | 创作者的全流程内容工作台 | 多角色 AI 编辑 + 编辑方法论 |
| B. 模板生态 | 风格模板的 GitHub / Notion 模板市场 | 社区增长 + 模板资产 |
| C. 分发网络 | 多平台发布 + 数据回馈闭环 | 平台 API + 数据分析 |

建议顺序：

```text
先 A：编辑 OS
再 B：模板生态
最终 C：分发网络
```

---

## License

MIT

---

## 一句话 / One Line

**中文**：回声编辑部不是替你搬运一条视频，而是帮你把一条视频留下的回声，重新编辑成可发布、可复盘、可沉淀的内容资产。
**English**: Echo Editorial does not merely move a video around; it turns the echo it leaves behind into content assets that can be published, reviewed, and reused.
