/* PowerShell 教程 · 交互脚本（无依赖） */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  /* ---------------------------------------------------------------- 主题 */

  var THEME_KEY = 'pst-theme';
  try {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
  } catch (e) {}

  doc.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {}
    });
  });

  /* ---------------------------------------------------------------- 移动端目录 */

  var body = doc.body;
  var menuToggle = doc.querySelector('[data-menu-toggle]');
  function closeMenu() {
    body.classList.remove('menu-open');
  }
  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      body.classList.toggle('menu-open');
    });
  }
  doc.querySelectorAll('[data-menu-close], .sidebar a').forEach(function (el) {
    el.addEventListener('click', closeMenu);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 960) closeMenu();
  });

  /* ---------------------------------------------------------------- 复制代码 */

  doc.addEventListener('click', function (event) {
    var btn = event.target.closest('.codeblock__copy');
    if (!btn) return;
    var block = btn.closest('.codeblock');
    var code = block ? block.querySelector('pre') : null;
    if (!code) return;
    var text = code.innerText.replace(/\u00a0/g, ' ');
    var done = function () {
      var label = btn.querySelector('span');
      btn.classList.add('is-done');
      if (label) label.textContent = '已复制';
      setTimeout(function () {
        btn.classList.remove('is-done');
        if (label) label.textContent = '复制';
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  });

  function fallbackCopy(text, done) {
    var area = doc.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    doc.body.appendChild(area);
    area.select();
    try {
      doc.execCommand('copy');
      done();
    } catch (e) {}
    doc.body.removeChild(area);
  }

  /* ---------------------------------------------------------------- 阅读进度 */

  var progressBar = doc.querySelector('.scroll-progress__bar');
  var ticking = false;

  function updateProgress() {
    var scrollTop = window.scrollY || doc.documentElement.scrollTop;
    var height = doc.documentElement.scrollHeight - window.innerHeight;
    var ratio = height > 0 ? Math.min(1, Math.max(0, scrollTop / height)) : 0;
    if (progressBar) progressBar.style.width = (ratio * 100).toFixed(2) + '%';
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateProgress);
      }
    },
    { passive: true }
  );
  updateProgress();

  /* ---------------------------------------------------------------- 目录高亮 */

  var tocLinks = Array.prototype.slice.call(doc.querySelectorAll('.toc-link'));
  var headings = tocLinks
    .map(function (link) {
      var id = link.getAttribute('href').slice(1);
      var el = doc.getElementById(id);
      return el ? { el: el, link: link } : null;
    })
    .filter(Boolean);

  function spy() {
    if (!headings.length) return;
    var line = (parseInt(getComputedStyle(root).getPropertyValue('--header-h'), 10) || 62) + 90;
    var current = headings[0];
    for (var i = 0; i < headings.length; i += 1) {
      if (headings[i].el.getBoundingClientRect().top <= line) current = headings[i];
      else break;
    }
    var atBottom = window.innerHeight + window.scrollY >= doc.documentElement.scrollHeight - 4;
    if (atBottom) current = headings[headings.length - 1];
    headings.forEach(function (item) {
      item.link.classList.toggle('is-active', item === current);
    });
  }

  if (headings.length) {
    let spying = false;
    window.addEventListener(
      'scroll',
      function () {
        if (spying) return;
        spying = true;
        window.requestAnimationFrame(function () {
          spy();
          spying = false;
        });
      },
      { passive: true }
    );
    spy();
  }

  /* ---------------------------------------------------------------- 搜索 */

  var modal = doc.getElementById('search-modal');
  var input = doc.getElementById('search-input');
  var resultsEl = doc.getElementById('search-results');
  var indexData = null;
  var indexPromise = null;
  var current = [];
  var activeIndex = -1;
  var lastQuery = '';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var base = body.getAttribute('data-base') || '';

  function link(record) {
    return base + record.u + record.hash;
  }

  function loadIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = fetch(base + 'assets/search-index.json')
      .then(function (res) { return res.json(); })
      .then(function (pages) {
        var flat = [];
        pages.forEach(function (page) {
          flat.push({
            u: page.u,
            page: page.t,
            course: page.c,
            group: page.g,
            num: page.n,
            hash: '',
            title: page.t,
            text: page.sections.map(function (s) { return s.s + ' ' + s.x; }).join(' ')
          });
          page.sections.forEach(function (section) {
            if (section.h) {
              flat.push({
                u: page.u,
                page: page.t,
                course: page.c,
                group: page.g,
                num: page.n,
                hash: section.h,
                title: section.s,
                text: section.x
              });
            }
          });
        });
        indexData = pages;
        return flat;
      });
    return indexPromise;
  }

  function terms(query) {
    return query
      .toLowerCase()
      .split(/\s+/)
      .map(function (t) { return t.trim(); })
      .filter(Boolean);
  }

  function score(record, ts) {
    var title = record.title.toLowerCase();
    var page = record.page.toLowerCase();
    var text = record.text.toLowerCase();
    var total = 0;
    for (var i = 0; i < ts.length; i += 1) {
      var t = ts[i];
      if (title.indexOf(t) !== -1) total += 70;
      if (page.indexOf(t) !== -1) total += 26;
      var at = text.indexOf(t);
      if (at !== -1) {
        total += 14;
        if (at < 120) total += 6;
      }
    }
    return total;
  }

  function snippet(text, ts, max) {
    if (!text) return '';
    var lower = text.toLowerCase();
    var at = -1;
    for (var i = 0; i < ts.length; i += 1) {
      var p = lower.indexOf(ts[i]);
      if (p !== -1 && (at === -1 || p < at)) at = p;
    }
    var start = Math.max(0, at - 34);
    var chunk = text.slice(start, start + (max || 120));
    if (start > 0) chunk = '…' + chunk;
    if (start + (max || 120) < text.length) chunk += '…';
    var html = esc(chunk);
    ts.forEach(function (t) {
      if (!t) return;
      var safe = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp('(' + safe + ')', 'gi'), '<mark>$1</mark>');
    });
    return html;
  }

  function markTitle(title, ts) {
    var html = esc(title);
    ts.forEach(function (t) {
      if (!t) return;
      var safe = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp('(' + safe + ')', 'gi'), '<mark>$1</mark>');
    });
    return html;
  }

  function renderList(list, ts) {
    current = list;
    activeIndex = list.length ? 0 : -1;
    if (!list.length) {
      resultsEl.innerHTML =
        '<div class="search-empty"><p>没有找到相关内容</p><span>换个关键词试试，例如 “管道”、“Cmdlet” 或 “执行策略”</span></div>';
      return;
    }
    resultsEl.innerHTML = list
      .map(function (r, i) {
        var meta = [];
        if (r.course) meta.push('<b>' + esc(r.course) + '</b>');
        meta.push('<span>' + String(r.num).padStart(2, '0') + '</span>');
        meta.push('<span>' + esc(r.group) + '</span>');
        meta.push('<span>' + esc(r.page) + '</span>');
        return (
          '<a class="search-result' + (i === 0 ? ' is-selected' : '') + '" href="' + link(r) + '" data-index="' + i + '">' +
          '<div class="search-result__meta">' + meta.join('<span>·</span>') + '</div>' +
          '<div class="search-result__title">' + markTitle(r.title, ts) + '</div>' +
          (r.text ? '<div class="search-result__snippet">' + snippet(r.text, ts) + '</div>' : '') +
          '</a>'
        );
      })
      .join('');
    resultsEl.scrollTop = 0;
  }

  function defaultList() {
    if (!indexData) return [];
    return indexData.slice(0, 7).map(function (page) {
      return {
        u: page.u,
        page: page.t,
        course: page.c,
        group: page.g,
        num: page.n,
        hash: '',
        title: page.t,
        text: page.sections.length > 1 ? page.sections[1].s : ''
      };
    });
  }

  function runSearch() {
    var q = input.value.trim();
    lastQuery = q;
    if (!q) {
      if (!indexData) {
        resultsEl.innerHTML = '<div class="search-empty"><p>正在载入索引…</p></div>';
        loadIndex().then(runSearch);
        return;
      }
      renderList(defaultList(), []);
      return;
    }
    if (!indexPromise) {
      resultsEl.innerHTML = '<div class="search-empty"><p>正在载入索引…</p></div>';
      loadIndex().then(runSearch);
      return;
    }
    var ts = terms(q);
    var pool = [];
    indexData.forEach(function (page) {
      pool.push({
        u: page.u,
        page: page.t,
        course: page.c,
        group: page.g,
        num: page.n,
        hash: '',
        title: page.t,
        text: page.sections.map(function (s) { return s.s + ' ' + s.x; }).join(' ')
      });
      page.sections.forEach(function (section) {
        if (!section.h) return;
        pool.push({
          u: page.u,
          page: page.t,
          course: page.c,
          group: page.g,
          num: page.n,
          hash: section.h,
          title: section.s,
          text: section.x
        });
      });
    });
    var scored = pool
      .map(function (record) {
        return { record: record, value: score(record, ts) };
      })
      .filter(function (item) { return item.value > 0; })
      .sort(function (a, b) { return b.value - a.value || a.record.num - b.record.num; })
      .slice(0, 30)
      .map(function (item) { return item.record; });
    renderList(scored, ts);
  }

  function openSearch() {
    if (!modal) return;
    modal.hidden = false;
    body.classList.add('no-scroll');
    if (input) {
      input.value = '';
      input.focus();
    }
    resultsEl.innerHTML = '<div class="search-empty"><p>正在载入索引…</p></div>';
    loadIndex()
      .then(runSearch)
      .catch(function () {
        resultsEl.innerHTML =
          '<div class="search-empty"><p>搜索索引加载失败</p><span>请刷新页面后重试</span></div>';
      });
  }

  function closeSearch() {
    if (!modal) return;
    modal.hidden = true;
    body.classList.remove('no-scroll');
  }

  doc.querySelectorAll('[data-open-search]').forEach(function (btn) {
    btn.addEventListener('click', openSearch);
  });
  doc.querySelectorAll('[data-close-search]').forEach(function (el) {
    el.addEventListener('click', closeSearch);
  });

  if (input) {
    input.addEventListener('input', runSearch);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!current.length) return;
        var delta = event.key === 'ArrowDown' ? 1 : -1;
        activeIndex = (activeIndex + delta + current.length) % current.length;
        var nodes = resultsEl.querySelectorAll('.search-result');
        Array.prototype.forEach.call(nodes, function (node, i) {
          node.classList.toggle('is-selected', i === activeIndex);
        });
        var sel = nodes[activeIndex];
        if (sel) {
          sel.scrollIntoView({ block: 'nearest' });
        }
      } else if (event.key === 'Enter') {
        var pick = current[activeIndex] || current[0];
        if (pick) {
          event.preventDefault();
          window.location.href = link(pick);
        }
      }
    });
  }

  if (resultsEl) {
    resultsEl.addEventListener('mousemove', function (event) {
      var row = event.target.closest('.search-result');
      if (!row) return;
      var idx = Number(row.getAttribute('data-index'));
      if (idx === activeIndex) return;
      activeIndex = idx;
      Array.prototype.forEach.call(resultsEl.querySelectorAll('.search-result'), function (node, i) {
        node.classList.toggle('is-selected', i === activeIndex);
      });
    });
  }

  doc.addEventListener('keydown', function (event) {
    var tag = (event.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || event.target.isContentEditable;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (modal && modal.hidden) openSearch();
      else closeSearch();
      return;
    }
    if (event.key === 'Escape' && modal && !modal.hidden) {
      closeSearch();
      return;
    }
    if (event.key === '/' && !typing && (!modal || modal.hidden)) {
      event.preventDefault();
      openSearch();
    }
  });

  /* ---------------------------------------------------------------- 锚点滚动修正 */

  window.addEventListener('load', function () {
    if (window.location.hash) {
      var target = doc.getElementById(window.location.hash.slice(1));
      if (target) {
        setTimeout(function () {
          target.scrollIntoView({ block: 'start' });
        }, 40);
      }
    }
  });
})();
