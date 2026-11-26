// 静态站点构建器：docs/*.rst -> dist/*.html
// 零第三方依赖，直接 `node src/build.mjs`。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRst, inline, renderCode } from './rst.mjs';
import { highlight } from './highlight.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs');
const distDir = path.join(root, 'dist');
const assetsDir = path.join(root, 'src', 'assets');

const GROUP_ORDER = ['入门', '核心概念', '常用操作', '进阶'];
const SITE_NAME = 'PowerShell 教程';
const SITE_DESC =
  '面向中文开发者的 PowerShell 结构化教程：从核心概念、Cmdlet、管道与过滤，到脚本编写与远程运维，配套可复制示例与现代化阅读体验。';

const escapeAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const stripTags = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

// ------------------------------------------------------------------ 读取文档

const indexSrc = fs.readFileSync(path.join(docsDir, 'index.rst'), 'utf8');
const indexDoc = parseRst(indexSrc, { slug: 'index', chapter: 0 });
const order = indexDoc.toctree.length
  ? indexDoc.toctree
  : fs
      .readdirSync(docsDir)
      .filter((f) => f.endsWith('.rst') && f !== 'index.rst')
      .map((f) => f.replace(/\.rst$/, ''));

const chapters = order.map((slug, i) => {
  const file = path.join(docsDir, slug + '.rst');
  if (!fs.existsSync(file)) throw new Error('缺少文档：' + file);
  const doc = parseRst(fs.readFileSync(file, 'utf8'), { slug, chapter: i + 1 });
  doc.group = doc.meta.group || '进阶';
  doc.summary = doc.meta.summary || '';
  doc.url = slug + '.html';
  return doc;
});

const totalCode = chapters.reduce((n, c) => n + c.codeCount, 0);
const totalMinutes = chapters.reduce((n, c) => n + Math.max(1, Math.round(c.text.length / 380)), 0);

// ------------------------------------------------------------------ 导航

function sidebarHtml(activeSlug) {
  const groups = GROUP_ORDER.map((g) => ({
    name: g,
    items: chapters.filter((c) => c.group === g),
  })).filter((g) => g.items.length);

  return groups
    .map(
      (g) =>
        '<div class="side-group"><p class="side-label">' +
        escapeAttr(g.name) +
        '</p><ul class="side-list">' +
        g.items
          .map(
            (c) =>
              '<li><a class="side-link' +
              (c.slug === activeSlug ? ' is-active' : '') +
              '" href="' +
              c.url +
              '"><span class="side-num">' +
              String(c.chapter).padStart(2, '0') +
              '</span><span class="side-text">' +
              inline(c.title) +
              '</span></a></li>'
          )
          .join('') +
        '</ul></div>'
    )
    .join('');
}

function tocHtml(doc) {
  const items = doc.headings.filter((h) => h.level <= 3);
  if (!items.length) return '';
  return (
    '<aside class="toc" aria-label="本页目录"><div class="toc-inner"><p class="toc-title">本页目录</p><nav class="toc-nav">' +
    items
      .map(
        (h) =>
          '<a class="toc-link toc-link--h' +
          h.level +
          '" href="#' +
          h.id +
          '">' +
          inline(h.text) +
          '</a>'
      )
      .join('') +
    '</nav></div></aside>'
  );
}

const ICON_SEARCH =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/></svg>';
const ICON_SUN =
  '<svg class="icon-sun" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></svg>';
const ICON_MOON =
  '<svg class="icon-moon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20.5 14.4A8.6 8.6 0 0 1 9.6 3.5a8.6 8.6 0 1 0 10.9 10.9Z"/></svg>';
const ICON_ARROW =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5"/></svg>';

function headerHtml(activeSlug) {
  const navLinks = [
    ['tutorial', '入门'],
    ['core', '核心概念'],
    ['filesystem', '常用操作'],
    ['practice', '实战'],
  ];
  return (
    '<header class="site-header"><div class="header-inner">' +
    '<button class="icon-btn menu-btn" type="button" aria-label="打开目录" data-menu-toggle>' +
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
    '</button>' +
    '<a class="brand" href="index.html" aria-label="PowerShell 教程首页">' +
    '<span class="brand-mark"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 7 4 5-4 5M12 17h7"/></svg></span>' +
    '<span class="brand-text">PowerShell<span class="brand-sub">教程</span></span>' +
    '<span class="brand-badge">v7.4</span>' +
    '</a>' +
    '<nav class="header-nav">' +
    navLinks
      .map(
        ([slug, label]) =>
          '<a href="' +
          chapters.find((c) => c.slug === slug).url +
          '"' +
          (slug === activeSlug ? ' class="is-active"' : '') +
          '>' +
          label +
          '</a>'
      )
      .join('') +
    '</nav>' +
    '<div class="header-actions">' +
    '<button class="search-trigger" type="button" data-open-search>' +
    ICON_SEARCH +
    '<span class="search-trigger__text">搜索教程</span><kbd class="search-trigger__kbd">Ctrl K</kbd>' +
    '</button>' +
    '<button class="icon-btn theme-btn" type="button" aria-label="切换主题" data-theme-toggle>' +
    ICON_SUN +
    ICON_MOON +
    '</button></div></div>' +
    '<div class="scroll-progress" aria-hidden="true"><span class="scroll-progress__bar"></span></div>' +
    '</header>'
  );
}

function searchModalHtml() {
  return (
    '<div class="search-modal" id="search-modal" hidden>' +
    '<div class="search-backdrop" data-close-search></div>' +
    '<div class="search-panel" role="dialog" aria-modal="true" aria-label="搜索教程">' +
    '<div class="search-field">' +
    ICON_SEARCH +
    '<input id="search-input" type="search" placeholder="搜索命令、概念或章节，例如 Get-Process" autocomplete="off" spellcheck="false" aria-label="搜索教程">' +
    '<kbd>Esc</kbd></div>' +
    '<div class="search-results" id="search-results"><div class="search-empty"><p>输入关键词开始搜索</p><span>试试 “管道” 、 “作用域” 或 “Get-Service”</span></div></div>' +
    '<div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>↵</kbd> 打开</span><span><kbd>Esc</kbd> 关闭</span><span class="search-foot__brand">PowerShell 教程</span></div>' +
    '</div></div>'
  );
}

function footerHtml() {
  return (
    '<footer class="site-footer"><div class="site-footer__inner">' +
    '<div class="site-footer__brand"><span class="brand-mark brand-mark--sm"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 7 4 5-4 5M12 17h7"/></svg></span>PowerShell 教程</div>' +
    '<p class="site-footer__note">内容整理自菜鸟教程 PowerShell 系列教程，以 reStructuredText 编写，静态构建发布。</p>' +
    '<div class="site-footer__links"><a href="index.html">首页</a><a href="' +
    chapters[0].url +
    '">开始学习</a><a href="' +
    chapters[chapters.length - 1].url +
    '">实战应用</a></div>' +
    '</div></footer>'
  );
}

function shell({ title, description, bodyClass, pageSlug, content, sidebar, toc }) {
  return (
    '<!DOCTYPE html>\n<html lang="zh-CN" data-theme="light">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' +
    escapeAttr(title) +
    '</title>\n<meta name="description" content="' +
    escapeAttr(description) +
    '">\n<meta name="color-scheme" content="light dark">\n' +
    '<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">\n' +
    '<link rel="stylesheet" href="assets/style.css">\n' +
    '<script>(function(){try{var t=localStorage.getItem("pst-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>\n' +
    '</head>\n<body class="' +
    bodyClass +
    '" data-page="' +
    escapeAttr(pageSlug) +
    '">\n' +
    headerHtml(pageSlug) +
    '<div class="drawer-backdrop" data-menu-close></div>\n' +
    '<div class="layout">\n' +
    '<aside class="sidebar" id="sidebar">\n<div class="sidebar-inner">' +
    sidebar +
    '</div></aside>\n' +
    '<main class="main" id="main">\n' +
    content +
    footerHtml() +
    '\n</main>\n' +
    (toc || '') +
    '</div>\n' +
    searchModalHtml() +
    '\n<script src="assets/app.js" defer></script>\n</body>\n</html>\n'
  );
}

// ------------------------------------------------------------------ 章节页

function renderChapter(doc, prev, next) {
  const minutes = Math.max(1, Math.round(doc.text.length / 380));
  const toc = tocHtml(doc);

  const pagerParts = [];
  if (prev)
    pagerParts.push(
      '<a class="pager-link pager-link--prev" href="' +
        prev.url +
        '"><span class="pager-dir">← 上一章</span><span class="pager-title">' +
        inline(prev.title) +
        '</span></a>'
    );
  else pagerParts.push('<span class="pager-link pager-link--empty"></span>');
  if (next)
    pagerParts.push(
      '<a class="pager-link pager-link--next" href="' +
        next.url +
        '"><span class="pager-dir">下一章 →</span><span class="pager-title">' +
        inline(next.title) +
        '</span></a>'
    );
  else pagerParts.push('<span class="pager-link pager-link--empty"></span>');

  const content =
    '<article class="doc">' +
    '<nav class="breadcrumb" aria-label="面包屑"><a href="index.html">教程</a><span>/</span><span>' +
    escapeAttr(doc.group) +
    '</span></nav>' +
    '<h1 class="doc-title">' +
    inline(doc.title) +
    '</h1>' +
    (doc.summary ? '<p class="doc-lead">' + inline(doc.summary) + '</p>' : '') +
    '<div class="doc-meta"><span>第 ' +
    String(doc.chapter).padStart(2, '0') +
    ' 章</span><span class="doc-meta__dot"></span><span>约 ' +
    minutes +
    ' 分钟</span><span class="doc-meta__dot"></span><span>共 ' +
    chapters.length +
    ' 章</span></div>' +
    '<div class="doc-body">' +
    doc.html +
    '</div>' +
    '<nav class="pager" aria-label="翻页">' +
    pagerParts.join('') +
    '</nav>' +
    '</article>';

  return shell({
    title: doc.title + ' · ' + SITE_NAME,
    description: doc.summary || SITE_DESC,
    bodyClass: 'page-doc',
    pageSlug: doc.slug,
    content,
    sidebar: sidebarHtml(doc.slug),
    toc,
  });
}

// ------------------------------------------------------------------ 首页

function chapterCards() {
  return GROUP_ORDER.map((g) => {
    const items = chapters.filter((c) => c.group === g);
    if (!items.length) return '';
    return (
      '<section class="catalog-group"><div class="catalog-group__head"><span class="catalog-group__index">' +
      String(items[0].chapter).padStart(2, '0') +
      '</span><h3>' +
      escapeAttr(g) +
      '</h3><span class="catalog-group__line"></span><span class="catalog-group__count">' +
      items.length +
      ' 章</span></div><div class="chapter-grid">' +
      items
        .map(
          (c) =>
            '<a class="chapter-card" href="' +
            c.url +
            '"><div class="chapter-card__top"><span class="chapter-card__num">' +
            String(c.chapter).padStart(2, '0') +
            '</span><span class="chapter-card__arrow">' +
            ICON_ARROW +
            '</span></div><h4 class="chapter-card__title">' +
            inline(c.title) +
            '</h4><p class="chapter-card__desc">' +
            escapeAttr(c.summary) +
            '</p></a>'
        )
        .join('') +
      '</div></section>'
    );
  }).join('');
}

function renderHome() {
  const heroCode = [
    '# 找出最耗 CPU 的 5 个进程',
    'Get-Process |',
    '    Sort-Object CPU -Descending |',
    '    Select-Object -First 5 Name, CPU',
    '',
    '# 只看正在运行的服务',
    'Get-Service | Where-Object Status -eq Running',
  ].join('\n');

  const hero =
    '<section class="hero"><div class="hero__bg" aria-hidden="true"></div>' +
    '<div class="hero__inner">' +
    '<div class="hero__copy">' +
    '<span class="eyebrow"><span class="eyebrow__dot"></span>中文结构化教程 · 全平台</span>' +
    '<h1 class="hero__title">把 PowerShell<br><span class="hero__grad">真正用起来</span></h1>' +
    '<p class="hero__lead">从对象管道、Cmdlet 到远程运维与自动化脚本，' +
    chapters.length +
    ' 个章节、' +
    totalCode +
    '+ 段可复制示例，带你系统掌握微软的自动化平台。</p>' +
    '<div class="hero__actions"><a class="btn btn--primary" href="' +
    chapters[0].url +
    '">开始学习 ' +
    ICON_ARROW +
    '</a><a class="btn btn--ghost" href="#catalog">浏览目录</a></div>' +
    '<dl class="hero__stats"><div><dt>' +
    chapters.length +
    '</dt><dd>章节课时</dd></div><div><dt>' +
    totalCode +
    '+</dt><dd>代码示例</dd></div><div><dt>' +
    totalMinutes +
    '</dt><dd>分钟阅读</dd></div><div><dt>4</dt><dd>学习阶段</dd></div></dl>' +
    '</div>' +
    '<div class="hero__panel"><div class="hero__code">' +
    '<div class="hero__code-bar"><span class="hero__code-dots"><i></i><i></i><i></i></span><span class="hero__code-title">pwsh — PowerShell 7.4</span></div>' +
    '<pre><code class="language-powershell">' +
    highlight(heroCode, 'powershell') +
    '</code></pre>' +
    '<div class="hero__code-foot"><span class="pulse"></span>对象管道已就绪</div>' +
    '</div>' +
    '<div class="hero__badge"><span class="hero__badge-k">Cmdlet</span><span class="hero__badge-v">动词-名词</span></div>' +
    '</div></div></section>';

  const catalog =
    '<section class="catalog" id="catalog"><div class="catalog-head"><span class="section-kicker">Course map</span>' +
    '<h2>完整教程目录</h2><p>按学习路径组织：先建立对象思维，再掌握常用操作，最后进入自动化与实战。</p></div>' +
    chapterCards() +
    '</section>';

  const intro = indexDoc.html
    ? '<section class="intro-panel"><div class="intro-panel__inner">' + indexDoc.html + '</div></section>'
    : '';

  const content = hero + catalog + intro;

  return shell({
    title: SITE_NAME + ' · 中文 PowerShell 结构化教程',
    description: SITE_DESC,
    bodyClass: 'page-home',
    pageSlug: 'index',
    content,
    sidebar: sidebarHtml('index'),
    toc: '',
  });
}

// ------------------------------------------------------------------ 搜索索引

function sectionize(doc) {
  const html = doc.html;
  const re = /<h([23]) id="(sec-\d+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  const marks = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    marks.push({ level: Number(m[1]), id: m[2], title: stripTags(m[3]), start: m.index, end: re.lastIndex });
  }
  const sections = [];
  if (marks.length === 0) {
    sections.push({ h: '', s: doc.title, x: doc.text.slice(0, 400) });
    return sections;
  }
  const introText = stripTags(html.slice(0, marks[0].start));
  if (introText) sections.push({ h: '', s: doc.title, x: introText.slice(0, 400) });
  marks.forEach((mark, idx) => {
    const end = idx + 1 < marks.length ? marks[idx + 1].start : html.length;
    const text = stripTags(html.slice(mark.end, end));
    sections.push({ h: '#' + mark.id, s: mark.title, x: text.slice(0, 900) });
  });
  return sections;
}

const searchIndex = chapters.map((c) => ({
  u: c.url,
  t: c.title,
  g: c.group,
  n: c.chapter,
  sections: sectionize(c),
}));

// ------------------------------------------------------------------ 输出

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.cpSync(assetsDir, path.join(distDir, 'assets'), { recursive: true });

chapters.forEach((doc, i) => {
  fs.writeFileSync(path.join(distDir, doc.url), renderChapter(doc, chapters[i - 1], chapters[i + 1]), 'utf8');
});
fs.writeFileSync(path.join(distDir, 'index.html'), renderHome(), 'utf8');
fs.writeFileSync(path.join(distDir, 'assets', 'search-index.json'), JSON.stringify(searchIndex), 'utf8');

const files = fs.readdirSync(distDir, { recursive: true }).filter((f) => fs.statSync(path.join(distDir, f)).isFile());
let bytes = 0;
files.forEach((f) => {
  bytes += fs.statSync(path.join(distDir, f)).size;
});

console.log(
  '构建完成：' +
    chapters.length +
    ' 个章节，' +
    (files.length + 1) +
    ' 个文件，' +
    (bytes / 1024).toFixed(1) +
    ' KB，代码示例 ' +
    totalCode +
    ' 段'
);
