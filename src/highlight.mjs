// 轻量语法高亮器：按行处理，覆盖本教程站使用的 powershell / bash / 纯文本。

const PS_KEYWORDS =
  'if|elseif|else|switch|foreach|for|while|do|until|try|catch|finally|throw|return|function|param|begin|process|end|filter|class|enum|using|trap|exit|break|continue|in|default';

const PS_OPERATORS = new Set(
  'eq ne lt gt le ge and or not like notlike match notmatch contains notcontains in notreplace replace split join is isnot as f xor'.split(
    ' '
  )
);

const PS_RE = new RegExp(
  [
    '(#[^\\n]*)', // 1 comment
    '("(?:[^"`]|`[\\s\\S])*")', // 2 double string
    "('(?:[^']|'')*')", // 3 single string
    '(\\$(?:env:[A-Za-z_]\\w*|[A-Za-z_]\\w*|[_?$^]))', // 4 variable
    '(-[A-Za-z][\\w-]*)', // 5 parameter / operator
    '(\\b\\d+(?:\\.\\d+)?(?:[KMGTP]B)?\\b)', // 6 number
    '(\\[[A-Za-z_][\\w.\\[\\]]*\\])', // 7 type
    '([A-Za-z_][\\w]*-[A-Za-z][\\w]*)', // 8 cmdlet
    '(\\b(?:' + PS_KEYWORDS + ')\\b)', // 9 keyword
  ].join('|'),
  'g'
);

const SH_RE =
  /(#[^\n]*)|("(?:[^"\\]|\\.)*")|('(?:[^']*)')|(\$\{[^}]+\}|\$\w+)|(-{1,2}[A-Za-z][\w-]*)|(\b(?:if|then|else|elif|fi|for|while|do|done|case|esac|function|in|sudo|apt|dnf|yum|brew|wget|dpkg|pacman|pwsh|powershell|install|remove|update|uninstall)\b)/g;

const SH_CLASS = ['tok-comment', 'tok-string', 'tok-string', 'tok-var', 'tok-param', 'tok-keyword'];

const PS_CLASS = [
  'tok-comment',
  'tok-string',
  'tok-string',
  'tok-var',
  'tok-param',
  'tok-num',
  'tok-type',
  'tok-cmdlet',
  'tok-keyword',
];

export function escapeHtml(input) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tokenize(line, re, classes) {
  re.lastIndex = 0;
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out += escapeHtml(line.slice(last, m.index));
    let groupIndex = 0;
    for (let i = 1; i < m.length; i += 1) {
      if (m[i] !== undefined) {
        groupIndex = i - 1;
        break;
      }
    }
    let cls = classes[groupIndex] || '';
    if (cls === 'tok-param' && PS_OPERATORS.has(m[0].slice(1).toLowerCase())) {
      cls = 'tok-op';
    }
    out += '<span class="' + cls + '">' + escapeHtml(m[0]) + '</span>';
    last = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex += 1;
  }
  if (last < line.length) out += escapeHtml(line.slice(last));
  return out;
}

function highlightPowerShell(code) {
  return code
    .split('\n')
    .map((line) => tokenize(line, PS_RE, PS_CLASS))
    .join('\n');
}

function highlightBash(code) {
  return code
    .split('\n')
    .map((line) => tokenize(line, SH_RE, SH_CLASS))
    .join('\n');
}

export function highlight(code, lang = 'text') {
  const l = String(lang || 'text').toLowerCase();
  if (l === 'powershell' || l === 'ps1' || l === 'pwsh' || l === 'ps') return highlightPowerShell(code);
  if (l === 'bash' || l === 'sh' || l === 'shell' || l === 'console') return highlightBash(code);
  return escapeHtml(code);
}

export function normalizeLang(lang) {
  const l = String(lang || 'text').toLowerCase();
  if (['powershell', 'ps1', 'pwsh', 'ps'].includes(l)) return 'powershell';
  if (['bash', 'sh', 'shell', 'console'].includes(l)) return 'bash';
  if (['text', 'output', 'plain'].includes(l)) return 'text';
  return l;
}
