// 静态站点构建器：docs/<course>/*.rst -> dist/<course>/*.html，站点根为教程库首页
// 零第三方依赖，直接 `node src/build.mjs`。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRst, inline } from './rst.mjs';
import { highlight } from './highlight.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs');
const distDir = path.join(root, 'dist');
const assetsDir = path.join(root, 'src', 'assets');

const cfg = JSON.parse(fs.readFileSync(path.join(docsDir, 'courses.json'), 'utf8'));
const SITE = cfg.site;

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

// ------------------------------------------------------------------ 读取课程

function loadCourse(meta) {
  const dir = path.join(docsDir, meta.slug);
  const indexDoc = parseRst(fs.readFileSync(path.join(dir, 'index.rst'), 'utf8'), { slug: 'index', chapter: 0 });
  const order = indexDoc.toctree.length
    ? indexDoc.toctree
    : fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.rst') && f !== 'index.rst')
        .map((f) => f.replace(/\.rst$/, ''));

  const chapters = order.map((slug, i) => {
    const file = path.join(dir, slug + '.rst');
    if (!fs.existsSync(file)) throw new Error('缺少文档：' + file);
    const doc = parseRst(fs.readFileSync(file, 'utf8'), { slug, chapter: i + 1 });
    doc.group = doc.meta.group || '进阶';
    doc.summary = doc.meta.summary || '';
    doc.url = slug + '.html';
    doc.path = meta.slug + '/' + doc.url;
    return doc;
  });

  const groups = [...new Set([...(meta.groups || []), ...chapters.map((c) => c.group)])];
  return {
    ...meta,
    index: indexDoc,
    chapters,
    groups,
    href: meta.slug + '/index.html',
    codeCount: chapters.reduce((n, c) => n + c.codeCount, 0),
    minutes: chapters.reduce((n, c) => n + Math.max(1, Math.round(c.text.length / 380)), 0),
  };
}

const allCourses = cfg.courses.map(loadCourse);

const totals = {
  courses: allCourses.length,
  chapters: allCourses.reduce((n, c) => n + c.chapters.length, 0),
  code: allCourses.reduce((n, c) => n + c.codeCount, 0),
  minutes: allCourses.reduce((n, c) => n + c.minutes, 0),
};

// ------------------------------------------------------------------ 导航

const ICON_SEARCH =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/></svg>';
const ICON_SUN =
  '<svg class="icon-sun" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></svg>';
const ICON_MOON =
  '<svg class="icon-moon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20.5 14.4A8.6 8.6 0 0 1 9.6 3.5a8.6 8.6 0 1 0 10.9 10.9Z"/></svg>';
const ICON_ARROW =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5"/></svg>';
const ICON_MARK =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 7 4 5-4 5M12 17h7"/></svg>';

function headerHtml(course, activeSlug) {
  const brandHref = course ? '../index.html' : 'index.html';
  const nav = course
    ? [
        ['index.html', '课程首页', activeSlug === 'index'],
        ['../index.html', '全部教程', false],
        [course.chapters[course.chapters.length - 1].url, '实战应用', activeSlug === course.chapters[course.chapters.length - 1].slug],
      ]
    : [
        ['#courses', '全部课程', false],
        ['#upcoming', '即将上线', false],
      ];

  return (
    '<header class="site-header"><div class="header-inner">' +
    (course
      ? '<button class="icon-btn menu-btn" type="button" aria-label="打开目录" data-menu-toggle>' +
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
        '</button>'
      : '') +
    '<a class="brand" href="' +
    brandHref +
    '" aria-label="' +
    escapeAttr(SITE.title) +
    ' 首页">' +
    '<span class="brand-mark">' +
    ICON_MARK +
    '</span>' +
    '<span class="brand-text">' +
    escapeAttr(SITE.name) +
    '<span class="brand-sub">' +
    escapeAttr(SITE.sub) +
    '</span></span>' +
    (course ? '<span class="brand-badge">' + escapeAttr(course.mark) + '</span>' : '') +
    '</a>' +
    '<nav class="header-nav">' +
    nav
      .map(([href, label, active]) => '<a href="' + href + '"' + (active ? ' class="is-active"' : '') + '>' + label + '</a>')
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
    '<input id="search-input" type="search" placeholder="搜索命令、概念或章节，例如 print" autocomplete="off" spellcheck="false" aria-label="搜索教程">' +
    '<kbd>Esc</kbd></div>' +
    '<div class="search-results" id="search-results"><div class="search-empty"><p>输入关键词开始搜索</p><span>试试 “列表” 、 “生成器” 或 “Get-Process”</span></div></div>' +
    '<div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>↵</kbd> 打开</span><span><kbd>Esc</kbd> 关闭</span><span class="search-foot__brand">' +
    escapeAttr(SITE.name) +
    ' ' +
    escapeAttr(SITE.sub) +
    '</span></div>' +
    '</div></div>'
  );
}

function footerHtml(course) {
  const links = course
    ? [
        ['../index.html', '教程库首页'],
        ['index.html', '课程首页'],
        [course.chapters[course.chapters.length - 1].url, '实战应用'],
      ]
    : [
        ['#courses', '全部课程'],
        ...(allCourses.length ? [[allCourses[0].href, allCourses[0].title]] : []),
        ['#upcoming', '即将上线'],
      ];
  return (
    '<footer class="site-footer"><div class="site-footer__inner">' +
    '<div class="site-footer__brand"><span class="brand-mark brand-mark--sm">' +
    ICON_MARK +
    '</span>' +
    escapeAttr(SITE.name) +
    ' ' +
    escapeAttr(SITE.sub) +
    '</div>' +
    '<p class="site-footer__note">' +
    (course
      ? '内容整理自菜鸟教程 ' + escapeAttr(course.title) + ' 系列教程，以 reStructuredText 编写，静态构建发布。'
      : '以 reStructuredText 编写，静态构建发布，课程持续更新中。') +
    '</p>' +
    '<div class="site-footer__links">' +
    links.map(([href, label]) => '<a href="' + href + '">' + escapeAttr(label) + '</a>').join('') +
    '</div></div></footer>'
  );
}

function shell({ title, description, bodyClass, pageSlug, content, sidebar, toc, base, course, activeSlug }) {
  const p = base || '';
  return (
    '<!DOCTYPE html>\n<html lang="zh-CN" data-theme="light">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' +
    escapeAttr(title) +
    '</title>\n<meta name="description" content="' +
    escapeAttr(description) +
    '">\n<meta name="color-scheme" content="light dark">\n' +
    '<link rel="icon" href="' +
    p +
    'assets/favicon.svg" type="image/svg+xml">\n' +
    '<link rel="stylesheet" href="' +
    p +
    'assets/style.css">\n' +
    '<script>(function(){try{var t=localStorage.getItem("pst-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>\n' +
    '</head>\n<body class="' +
    bodyClass +
    '" data-page="' +
    escapeAttr(pageSlug) +
    '" data-base="' +
    p +
    '">\n' +
    headerHtml(course || null, activeSlug || '') +
    '<div class="drawer-backdrop" data-menu-close></div>\n' +
    '<div class="layout">\n' +
    (sidebar ? '<aside class="sidebar" id="sidebar">\n<div class="sidebar-inner">' + sidebar + '</div></aside>\n' : '') +
    '<main class="main" id="main">\n' +
    content +
    footerHtml(course || null) +
    '\n</main>\n' +
    (toc || '') +
    '</div>\n' +
    searchModalHtml() +
    '\n<script src="' +
    p +
    'assets/app.js" defer></script>\n</body>\n</html>\n'
  );
}

// ------------------------------------------------------------------ 侧边栏

function sidebarHtml(course, activeSlug) {
  const groups = course.groups
    .map((name) => ({ name, items: course.chapters.filter((c) => c.group === name) }))
    .filter((g) => g.items.length);

  const switcher =
    '<div class="side-course">' +
    '<a class="side-back" href="../index.html">← 全部教程</a>' +
    '<a class="side-course__card" href="index.html">' +
    '<span class="side-course__mark" style="background:linear-gradient(135deg,' +
    escapeAttr(course.cover.from) +
    ',' +
    escapeAttr(course.cover.to) +
    ')">' +
    escapeAttr(course.mark) +
    '</span>' +
    '<span class="side-course__meta"><span class="side-course__name">' +
    escapeAttr(course.title) +
    '</span><span class="side-course__desc">' +
    course.chapters.length +
    ' 章 · ' +
    escapeAttr(course.level) +
    '</span></span></a></div>';

  const others = allCourses.filter((c) => c.slug !== course.slug);
  const othersHtml = others.length
    ? '<div class="side-group"><p class="side-label">其他教程</p><ul class="side-list">' +
      others
        .map(
          (c) =>
            '<li><a class="side-link" href="../' +
            c.slug +
            '/index.html"><span class="side-num">' +
            escapeAttr(c.mark) +
            '</span><span class="side-text">' +
            escapeAttr(c.title) +
            '</span></a></li>'
        )
        .join('') +
      '</ul></div>'
    : '';

  return (
    switcher +
    groups
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
      .join('') +
    othersHtml
  );
}

function tocHtml(doc) {
  const items = doc.headings.filter((h) => h.level <= 3);
  if (!items.length) return '';
  return (
    '<aside class="toc" aria-label="本页目录"><div class="toc-inner"><p class="toc-title">本页目录</p><nav class="toc-nav">' +
    items
      .map((h) => '<a class="toc-link toc-link--h' + h.level + '" href="#' + h.id + '">' + inline(h.text) + '</a>')
      .join('') +
    '</nav></div></aside>'
  );
}

// ------------------------------------------------------------------ 章节页

function renderChapter(course, doc, prev, next) {
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
    '<nav class="breadcrumb" aria-label="面包屑"><a href="../index.html">教程库</a><span>/</span><a href="index.html">' +
    escapeAttr(course.title) +
    '</a><span>/</span><span>' +
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
    course.chapters.length +
    ' 章</span></div>' +
    '<div class="doc-body">' +
    doc.html +
    '</div>' +
    '<nav class="pager" aria-label="翻页">' +
    pagerParts.join('') +
    '</nav>' +
    '</article>';

  return shell({
    title: doc.title + ' · ' + course.title,
    description: doc.summary || course.description,
    bodyClass: 'page-doc',
    pageSlug: doc.slug,
    content,
    sidebar: sidebarHtml(course, doc.slug),
    toc,
    base: '../',
    course,
    activeSlug: doc.slug,
  });
}

// ------------------------------------------------------------------ 课程首页

function courseCards(course) {
  return course.groups
    .map((g) => {
      const items = course.chapters.filter((c) => c.group === g);
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
    })
    .join('');
}

function heroTitleHtml(hero) {
  if (!hero.accent || !hero.title.includes(hero.accent)) return escapeAttr(hero.title);
  const [before, after] = hero.title.split(hero.accent);
  return escapeAttr(before) + '<span class="hero__grad">' + escapeAttr(hero.accent) + '</span>' + escapeAttr(after);
}

function renderCourseHome(course) {
  const hero = course.hero;

  const heroHtml =
    '<section class="hero"><div class="hero__bg" aria-hidden="true"></div>' +
    '<div class="hero__inner">' +
    '<div class="hero__copy">' +
    '<span class="eyebrow"><span class="eyebrow__dot"></span>' +
    escapeAttr(course.tech) +
    ' · ' +
    escapeAttr(course.level) +
    '</span>' +
    '<h1 class="hero__title">' +
    heroTitleHtml(hero) +
    '</h1>' +
    '<p class="hero__lead">' +
    escapeAttr(hero.lead) +
    '</p>' +
    '<div class="hero__actions"><a class="btn btn--primary" href="' +
    course.chapters[0].url +
    '">开始学习 ' +
    ICON_ARROW +
    '</a><a class="btn btn--ghost" href="#catalog">浏览目录</a></div>' +
    '<dl class="hero__stats"><div><dt>' +
    course.chapters.length +
    '</dt><dd>章节课时</dd></div><div><dt>' +
    course.codeCount +
    '+</dt><dd>代码示例</dd></div><div><dt>' +
    course.minutes +
    '</dt><dd>分钟阅读</dd></div><div><dt>' +
    course.groups.length +
    '</dt><dd>学习阶段</dd></div></dl>' +
    '</div>' +
    '<div class="hero__panel"><div class="hero__code">' +
    '<div class="hero__code-bar"><span class="hero__code-dots"><i></i><i></i><i></i></span><span class="hero__code-title">' +
    escapeAttr(hero.codeTitle) +
    '</span></div>' +
    '<pre><code class="language-' +
    escapeAttr(hero.codeLang || 'text') +
    '">' +
    highlight(hero.code, hero.codeLang || 'text') +
    '</code></pre>' +
    '<div class="hero__code-foot"><span class="pulse"></span>' +
    escapeAttr(hero.codeFoot || '') +
    '</div>' +
    '</div>' +
    '<div class="hero__badge"><span class="hero__badge-k">' +
    escapeAttr(hero.badgeK) +
    '</span><span class="hero__badge-v">' +
    escapeAttr(hero.badgeV) +
    '</span></div>' +
    '</div></div></section>';

  const catalog =
    '<section class="catalog" id="catalog"><div class="catalog-head"><span class="section-kicker">Course map</span>' +
    '<h2>完整教程目录</h2><p>课程按学习路径组织：建议按顺序阅读，也可以直接跳到需要的章节。</p></div>' +
    courseCards(course) +
    '</section>';

  const intro = course.index.html
    ? '<section class="intro-panel"><div class="intro-panel__inner">' + course.index.html + '</div></section>'
    : '';

  return shell({
    title: course.title + ' 教程 · ' + SITE.title,
    description: course.description,
    bodyClass: 'page-home',
    pageSlug: 'index',
    content: heroHtml + catalog + intro,
    sidebar: sidebarHtml(course, 'index'),
    toc: '',
    base: '../',
    course,
    activeSlug: 'index',
  });
}

// ------------------------------------------------------------------ 教程库首页

function courseCardHtml(course, index) {
  return (
    '<a class="course-card" href="' +
    course.href +
    '">' +
    '<div class="course-card__cover" style="--cover-from:' +
    escapeAttr(course.cover.from) +
    ';--cover-to:' +
    escapeAttr(course.cover.to) +
    '">' +
    '<div class="course-card__cover-top"><span class="course-card__index">课程 ' +
    String(index + 1).padStart(2, '0') +
    '</span><span class="course-card__mark">' +
    escapeAttr(course.mark) +
    '</span></div>' +
    '<div class="course-card__cover-main"><span class="course-card__title">' +
    escapeAttr(course.title) +
    '</span><span class="course-card__sub">' +
    escapeAttr(course.subtitle) +
    '</span></div>' +
    '<div class="course-card__cover-foot"><span>' +
    escapeAttr(course.tech) +
    '</span><span>' +
    escapeAttr(course.level) +
    '</span></div>' +
    '</div>' +
    '<div class="course-card__body">' +
    '<p class="course-card__desc">' +
    escapeAttr(course.description) +
    '</p>' +
    '<div class="course-card__meta"><span>' +
    course.chapters.length +
    ' 章</span><span>' +
    course.groups.length +
    ' 个阶段</span><span>约 ' +
    course.minutes +
    ' 分钟</span><span>' +
    course.codeCount +
    ' 段示例</span></div>' +
    '<span class="course-card__cta">进入课程 ' +
    ICON_ARROW +
    '</span>' +
    '</div></a>'
  );
}

function renderLibrary() {
  const first = allCourses[0];
  const hero =
    '<section class="lib-hero"><div class="hero__bg" aria-hidden="true"></div>' +
    '<div class="lib-hero__inner">' +
    '<span class="eyebrow"><span class="eyebrow__dot"></span>中文技术教程库 · 持续更新</span>' +
    '<h1 class="lib-hero__title">系统化的<span class="hero__grad">中文技术教程</span></h1>' +
    '<p class="hero__lead">' +
    escapeAttr(SITE.description) +
    '</p>' +
    '<div class="hero__actions"><a class="btn btn--primary" href="#courses">浏览全部课程 ' +
    ICON_ARROW +
    '</a>' +
    (first ? '<a class="btn btn--ghost" href="' + first.href + '">从 ' + escapeAttr(first.title) + ' 开始</a>' : '') +
    '</div>' +
    '<dl class="hero__stats"><div><dt>' +
    totals.courses +
    '</dt><dd>门课程</dd></div><div><dt>' +
    totals.chapters +
    '</dt><dd>个章节</dd></div><div><dt>' +
    totals.code +
    '+</dt><dd>代码示例</dd></div><div><dt>' +
    totals.minutes +
    '</dt><dd>分钟阅读</dd></div></dl>' +
    '</div></section>';

  const coursesSection =
    '<section class="library" id="courses"><div class="library-head"><div><span class="section-kicker">Library</span>' +
    '<h2>全部课程</h2><p>每门课程都是一条独立的学习路径，从基础概念一路走到可以动手实践。</p></div>' +
    '<span class="library-count">' +
    totals.courses +
    ' 门课程 · ' +
    totals.chapters +
    ' 章</span></div>' +
    '<div class="course-list">' +
    allCourses.map(courseCardHtml).join('') +
    '</div></section>';

  const upcoming = (cfg.upcoming || []).length
    ? '<section class="library" id="upcoming"><div class="library-head"><div><span class="section-kicker">Roadmap</span>' +
      '<h2>即将上线</h2><p>更多课程正在整理，按计划陆续发布。</p></div></div>' +
      '<div class="upcoming-grid">' +
      cfg.upcoming
        .map(
          (u) =>
            '<article class="upcoming-card"><span class="upcoming-card__tag">' +
            escapeAttr(u.tag) +
            '</span><h3>' +
            escapeAttr(u.title) +
            '</h3><p>' +
            escapeAttr(u.desc) +
            '</p><span class="upcoming-card__state">筹备中</span></article>'
        )
        .join('') +
      '</div></section>'
    : '';

  return shell({
    title: SITE.title + ' · 系统化中文技术教程',
    description: SITE.description,
    bodyClass: 'page-library',
    pageSlug: 'library',
    content: hero + coursesSection + upcoming,
    sidebar: '',
    toc: '',
    base: '',
    course: null,
    activeSlug: '',
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

const searchIndex = [];
allCourses.forEach((course) => {
  course.chapters.forEach((c) => {
    searchIndex.push({
      u: c.path,
      t: c.title,
      c: course.title,
      g: c.group,
      n: c.chapter,
      sections: sectionize(c),
    });
  });
});

// ------------------------------------------------------------------ 输出

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.cpSync(assetsDir, path.join(distDir, 'assets'), { recursive: true });

allCourses.forEach((course) => {
  const outDir = path.join(distDir, course.slug);
  fs.mkdirSync(outDir, { recursive: true });
  course.chapters.forEach((doc, i) => {
    fs.writeFileSync(path.join(outDir, doc.url), renderChapter(course, doc, course.chapters[i - 1], course.chapters[i + 1]), 'utf8');
  });
  fs.writeFileSync(path.join(outDir, 'index.html'), renderCourseHome(course), 'utf8');
});
fs.writeFileSync(path.join(distDir, 'index.html'), renderLibrary(), 'utf8');
fs.writeFileSync(path.join(distDir, 'assets', 'search-index.json'), JSON.stringify(searchIndex), 'utf8');

const files = fs.readdirSync(distDir, { recursive: true }).filter((f) => fs.statSync(path.join(distDir, f)).isFile());
let bytes = 0;
files.forEach((f) => {
  bytes += fs.statSync(path.join(distDir, f)).size;
});

console.log(
  '构建完成：' +
    allCourses.length +
    ' 门课程，' +
    totals.chapters +
    ' 个章节，' +
    files.length +
    ' 个文件，' +
    (bytes / 1024).toFixed(1) +
    ' KB，代码示例 ' +
    totals.code +
    ' 段'
);
