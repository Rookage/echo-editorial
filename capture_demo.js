const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sampleSource = `今天这条视频很适合做成小红书笔记。核心信息是：短视频素材如果只停留在下载和搬运，会很快失去价值；真正值得沉淀的是选题判断、标题结构、口播节奏和复盘数据。`;

const sampleResult = `标题：
别再只会搬运短视频了，这样改才像一个内容编辑部

正文：
很多人做内容，卡住的不是灵感，而是整理。

一条短视频看完觉得有价值，但接下来要手抄、改写、配音、找图、剪成竖屏视频。步骤一多，创作热情就被耗掉了。

回声编辑部想解决的不是“抓一个链接”，而是把素材送进一间 AI 编辑室：

1. 先判断素材值不值得做
2. 再整理成第一版稿件
3. 接着按平台语气改写
4. 最后配音、包装、生成视频

真正重要的不是生成一次，而是让每次创作都能沉淀成自己的方法。`;

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  const outDir = path.join(__dirname, 'demo');
  fs.mkdirSync(outDir, { recursive: true });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
  await page.screenshot({ path: path.join(outDir, '01-home.png'), fullPage: true });
  console.log('1/3 Home captured');

  await page.click('#toggleManualBtn');
  await page.type('#manualInput', sampleSource, { delay: 1 });
  await page.screenshot({ path: path.join(outDir, '02-input.png'), fullPage: true });
  console.log('2/3 Input captured');

  await page.evaluate(({ source, result }) => {
    const show = (id) => document.getElementById(id)?.classList.remove('hidden');
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    show('textCard');
    show('resultCard');
    setText('textSource', '手动粘贴');
    setText('textDisplay', source);
    setText('resultTitle', '小红书风格文案');
    setText('resultContent', result);
    setText('extractSpeech', '素材已经整理成可继续编辑的文本。');
    setText('rewriteSpeech', '这版更像发布稿，可以继续审稿和包装。');

    document.querySelectorAll('.pipeline-stage').forEach((stage) => {
      stage.classList.remove('active', 'done');
      if (['input', 'extract'].includes(stage.dataset.stage)) stage.classList.add('done');
      if (stage.dataset.stage === 'rewrite') stage.classList.add('active');
    });
  }, { source: sampleSource, result: sampleResult });

  await page.screenshot({ path: path.join(outDir, '03-result.png'), fullPage: true });
  console.log('3/3 Result captured');

  await browser.close();
  console.log('Done');
})();
