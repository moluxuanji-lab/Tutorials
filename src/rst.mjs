// 一个面向本教程站点的轻量 reStructuredText 渲染器。
// 支持的语法：章节标题、段落、项目符号/编号列表、code-block、csv-table、
// note/tip/warning/important、meta、toctree、literal block（段落以 :: 结尾）、
// 行内 ``code``、**粗体**、*斜体*、`文字 <链接>`_ 以及裸链接。
// 代码块语言：powershell / bash / python / cmake / cpp / json / text。

import { escapeHtml, highlight, normalizeLang } from './highlight.mjs';

const PUNCT = new Set(['=', '-', '~', '^', '"', "'", '`', '#', '*', '+']);
const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

function isHeadingUnderline(line) {
  const t = line.trim();
  if (t.length < 3) return false;
  const ch = t[0];
  if (!PUNCT.has(ch)) return false;
  for (let i = 0; i < t.length; i += 1) if (t[i] !== ch) return false;
  return true;
}

function isListLine(line) {
  return /^\s*([*+\-]|\d+\.|#\.)\s+\S/.test(line);
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------- 行内标记

export function inline(text) {
  const stash = [];
  const save = (html) => {
    stash.push(html);
    return '\u0000' + (stash.length - 1) + '\u0000';
  };

  let s = escapeHtml(text);

  s = s.replace(/``([\s\S]+?)``/g, (_, code) => save('<code>' + code.trim() + '</code>'));
  s = s.replace(/`([^`\u0000]+?)\s*&lt;([^&]+?)&gt;`_/g, (_, label, url) =>
    save('<a href="' + url.trim() + '" target="_blank" rel="noopener">' + label.trim() + '</a>')
  );
  s = s.replace(/\*\*([^*\u0000]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s（(，。、；：])\*([^*\u0000\s][^*\u0000]*?)\*/g, (_, pre, body) => pre + '<em>' + body + '</em>');
  s = s.replace(/(https?:\/\/[^\s&lt;&quot;）)]+)/g, (url) =>
    save('<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>')
  );
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => stash[Number(i)]);
  return s;
}

// ---------------------------------------------------------------- 代码块

export function renderCode(code, lang, opts = {}) {
  const language = normalizeLang(lang);
  const highlighted = highlight(code, language);
  const label = { powershell: 'PowerShell', bash: 'Shell', python: 'Python', text: '输出', cmake: 'CMake', cpp: 'C++', c: 'C', json: 'JSON' }[language] || language || 'code';
  let inner = highlighted;
  if (opts.linenos) {
    inner = highlighted
      .split('\n')
      .map((line) => '<span class="code-line">' + (line || ' ') + '</span>')
      .join('');
  }
  const caption = opts.caption ? '<figcaption class="codeblock__caption">' + inline(opts.caption) + '</figcaption>' : '';
  return (
    '<figure class="codeblock" data-lang="' +
    language +
    '">' +
    caption +
    '<div class="codeblock__bar"><span class="codeblock__lang">' +
    escapeHtml(label) +
    '</span><button class="codeblock__copy" type="button" aria-label="复制代码">' +
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>' +
    '<span>复制</span></button></div>' +
    '<pre class="' +
    (opts.linenos ? 'has-linenos' : '') +
    '"><code class="language-' +
    language +
    '">' +
    inner +
    '</code></pre></figure>'
  );
}

// ---------------------------------------------------------------- 工具

function collectIndented(lines, start) {
  let j = start;
  while (j < lines.length && !lines[j].trim()) j += 1;
  let indent = -1;
  const body = [];
  let pending = 0;
  let k = j;
  for (; k < lines.length; k += 1) {
    const line = lines[k];
    if (!line.trim()) {
      pending += 1;
      continue;
    }
    const ind = line.match(/^\s*/)[0].length;
    if (indent === -1) indent = ind;
    if (ind < indent) break;
    for (let b = 0; b < pending; b += 1) body.push('');
    pending = 0;
    body.push(line.slice(indent));
  }
  return { body, next: k };
}

function splitOptions(body) {
  const opts = {};
  let i = 0;
  while (i < body.length) {
    const m = /^:([\w-]+):\s*(.*)$/.exec(body[i]);
    if (!m) break;
    opts[m[1]] = m[2].trim();
    i += 1;
  }
  while (i < body.length && !body[i].trim()) i += 1;
  return { opts, content: body.slice(i) };
}

function parseCsvLine(line) {
  const cells = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

function renderTable(headerCells, rows, opts) {
  const thead =
    headerCells.length > 0
      ? '<thead><tr>' + headerCells.map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead>'
      : '';
  const tbody =
    '<tbody>' +
    rows
      .filter((r) => r.some((c) => c !== ''))
      .map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>')
      .join('') +
    '</tbody>';
  const caption = opts.caption ? '<caption>' + inline(opts.caption) + '</caption>' : '';
  return '<div class="table-wrap"><table>' + caption + thead + tbody + '</table></div>';
}

const ADMONITIONS = {
  note: { label: '说明', cls: 'admonition--note', icon: 'info' },
  tip: { label: '提示', cls: 'admonition--tip', icon: 'bulb' },
  warning: { label: '注意', cls: 'admonition--warning', icon: 'alert' },
  danger: { label: '警告', cls: 'admonition--warning', icon: 'alert' },
  important: { label: '重要', cls: 'admonition--important', icon: 'star' },
  caution: { label: '注意', cls: 'admonition--warning', icon: 'alert' },
};

const ICONS = {
  info: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/></svg>',
  alert: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z"/><path d="M12 10v4M12 17h.01"/></svg>',
  star: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/></svg>',
};

// ---------------------------------------------------------------- 主解析器

export function parseRst(source, { slug = '', chapter = 0 } = {}) {
  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
  const state = {
    title: '',
    levelChars: [],
    headings: [],
    headingCount: 0,
    meta: {},
    toctree: [],
    codeCount: 0,
  };

  const blocks = parseBlocks(lines, state, { allowHeadings: true, depth: 0 });

  return {
    slug,
    chapter,
    title: state.title,
    meta: state.meta,
    headings: state.headings,
    toctree: state.toctree,
    codeCount: state.codeCount,
    html: blocks.join('\n'),
    text: stripTags(blocks.join(' ')),
  };
}

function parseBlocks(lines, state, opts) {
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    // ---- 章节标题
    if (opts.allowHeadings && !/^\s/.test(line)) {
      const under = lines[i + 1] || '';
      if (isHeadingUnderline(under) && !/^\s*\.\./.test(line)) {
        const ch = under.trim()[0];
        let level = state.levelChars.indexOf(ch);
        if (level === -1) {
          state.levelChars.push(ch);
          level = state.levelChars.length - 1;
        }
        const text = line.trim();
        i += 2;
        if (level === 0) {
          if (!state.title) state.title = text;
          continue;
        }
        const id = 'sec-' + (state.headingCount += 1);
        const tag = HEADING_TAGS[Math.min(level, 5)];
        state.headings.push({ level: level + 1, text, id });
        out.push('<' + tag + ' id="' + id + '" class="doc-heading">' + inline(text) + '</' + tag + '>');
        continue;
      }
    }

    // ---- 指令
    const dm = /^\.\.\s+([\w-]+)::\s*(.*)$/.exec(line);
    if (dm) {
      const name = dm[1].toLowerCase();
      const arg = dm[2].trim();
      const { body, next } = collectIndented(lines, i + 1);
      i = next;
      out.push(renderDirective(name, arg, body, state));
      continue;
    }

    // ---- 注释（.. 开头但非指令）
    if (/^\.\.(\s|$)/.test(line)) {
      const { next } = collectIndented(lines, i + 1);
      i = next;
      continue;
    }

    // ---- 列表
    if (isListLine(line)) {
      const { html, next } = parseList(lines, i, state);
      out.push(html);
      i = next;
      continue;
    }

    // ---- 段落（保持中文换行拼接）
    const para = [];
    let j = i;
    while (j < lines.length) {
      const cur = lines[j];
      if (!cur.trim()) break;
      if (/^\.\.\s+/.test(cur)) break;
      if (j > i && isListLine(cur)) break;
      if (opts.allowHeadings && j + 1 < lines.length && isHeadingUnderline(lines[j + 1]) && !/^\s/.test(cur)) break;
      if (isHeadingUnderline(cur) && para.length > 0) break;
      para.push(cur.trim());
      j += 1;
    }
    if (j === i) {
      // 兜底，避免死循环
      i += 1;
      continue;
    }

    let text = para.join(' ');
    let isLiteral = false;
    if (/::\s*$/.test(text)) {
      isLiteral = true;
      text = text.replace(/::\s*$/, ':');
    }
    if (text.trim()) out.push('<p>' + inline(text) + '</p>');

    if (isLiteral) {
      const { body, next } = collectIndented(lines, j);
      if (body.length) {
        out.push(renderCode(body.join('\n').replace(/\s+$/, ''), 'text'));
        state.codeCount += 1;
      }
      i = next;
    } else {
      i = j;
    }
  }

  return out;
}

function parseList(lines, start, state) {
  const first = /^(\s*)([*+\-]|\d+\.|#\.)\s+(.*)$/.exec(lines[start]);
  const baseIndent = first[1].length;
  const ordered = /^\d/.test(first[2]) || first[2] === '#.';
  const items = [];
  let j = start;

  while (j < lines.length) {
    const cur = lines[j];
    if (!cur.trim()) {
      let k = j + 1;
      while (k < lines.length && !lines[k].trim()) k += 1;
      const look = /^(\s*)([*+\-]|\d+\.|#\.)\s+/.exec(lines[k] || '');
      if (look && look[1].length === baseIndent) {
        j = k;
        continue;
      }
      break;
    }
    const m = /^(\s*)([*+\-]|\d+\.|#\.)\s+(.*)$/.exec(cur);
    if (!m || m[1].length !== baseIndent) break;
    const itemOrdered = /^\d/.test(m[2]) || m[2] === '#.';
    if (itemOrdered !== ordered) break;

    const itemIndent = baseIndent + m[2].length + 1;
    const itemLines = [m[3]];
    j += 1;
    let pending = 0;
    while (j < lines.length) {
      const cur2 = lines[j];
      if (!cur2.trim()) {
        pending += 1;
        j += 1;
        continue;
      }
      const ind = cur2.match(/^\s*/)[0].length;
      if (ind <= baseIndent) break;
      for (let b = 0; b < pending; b += 1) itemLines.push('');
      pending = 0;
      itemLines.push(cur2.slice(Math.min(ind, itemIndent)));
      j += 1;
    }
    items.push(itemLines);
  }

  const tag = ordered ? 'ol' : 'ul';
  const html =
    '<' +
    tag +
    '>' +
    items
      .map((itemLines) => '<li>' + parseBlocks(itemLines, state, { allowHeadings: false, depth: (0 || 0) + 1 }).join('') + '</li>')
      .join('') +
    '</' +
    tag +
    '>';

  return { html, next: j };
}

function renderDirective(name, arg, body, state) {
  // ---- 代码
  if (name === 'code-block' || name === 'sourcecode' || name === 'code') {
    const { opts, content } = splitOptions(body);
    const lang = arg || opts.language || opts.lang || 'text';
    state.codeCount += 1;
    return renderCode(content.join('\n').replace(/\s+$/, ''), lang, {
      linenos: 'linenos' in opts,
      caption: opts.caption,
    });
  }

  // ---- 表格
  if (name === 'csv-table') {
    const { opts, content } = splitOptions(body);
    const header = opts.header ? parseCsvLine(opts.header) : [];
    const rows = content
      .filter((l) => l.trim() && !/^:[\w-]+:/.test(l))
      .map(parseCsvLine);
    return renderTable(header, rows, { caption: arg || opts.caption });
  }

  // ---- 文档元信息
  if (name === 'meta') {
    const { opts } = splitOptions(body);
    Object.assign(state.meta, opts);
    return '';
  }

  // ---- 目录树
  if (name === 'toctree') {
    word: {
      const entries = body
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith(':') && !l.startsWith('..'));
      for (const entry of entries) state.toctree.push(entry.replace(/\.rst$/, ''));
    }
    return '';
  }

  // ---- 提示框
  if (ADMONITIONS[name]) {
    const conf = ADMONITIONS[name];
    let { content } = splitOptions(body);
    let title = arg;
    const inner = parseBlocks(content, state, { allowHeadings: false, depth: 0 }).join('');
    return (
      '<div class="admonition ' +
      conf.cls +
      '"><div class="admonition__icon">' +
      ICONS[conf.icon] +
      '</div><div class="admonition__body">' +
      '<p class="admonition__title">' +
      escapeHtml(title || conf.label) +
      '</p>' +
      inner +
      '</div></div>'
    );
  }

  // ---- 图片：静态站点不需要，直接忽略
  if (name === 'image' || name === 'figure') return '';

  // ---- 未知指令：保留其正文，避免内容丢失
  const { content } = splitOptions(body);
  if (!content.length) return '';
  return parseBlocks(content, state, { allowHeadings: false, depth: 0 }).join('');
}
