// 轻量语法高亮器：按行处理，覆盖本教程站使用的 powershell / bash / python / cmake / cpp / json / 纯文本。

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

// ---- CMake：控制命令、条件运算符与关键字参数

const CMAKE_KEYWORDS =
  'if|elseif|else|endif|foreach|endforeach|while|endwhile|function|endfunction|macro|endmacro|block|endblock|break|continue|return|' +
  'AND|OR|NOT|STREQUAL|MATCHES|LESS|GREATER|EQUAL|LESS_EQUAL|GREATER_EQUAL|STRLESS|STRGREATER|IN_LIST|DEFINED|EXISTS|IS_DIRECTORY|IS_ABSOLUTE|COMMAND|TARGET|VERSION_LESS|VERSION_GREATER|VERSION_EQUAL|VERSION_LESS_EQUAL|VERSION_GREATER_EQUAL|ON|OFF|TRUE|FALSE|YES|NO|' +
  'PUBLIC|PRIVATE|INTERFACE|STATIC|SHARED|MODULE|OBJECT|ALIAS|IMPORTED|GLOBAL|EXCLUDE_FROM_ALL|REQUIRED|OPTIONAL|COMPONENTS|CONFIG|NO_MODULE|CACHE|FORCE|INTERNAL|VERSION|LANGUAGES|DESCRIPTION|HOMEPAGE_URL|ALL|DEPENDS|COMMAND|OUTPUT|BYPRODUCTS|WORKING_DIRECTORY|COMMENT|VERBATIM|USES_TERMINAL|POST_BUILD|PRE_BUILD|PRE_LINK|PARENT_SCOPE|SYSTEM|BEFORE|AFTER|PROPERTIES|FILES|DIRECTORY|TARGETS|EXPORT|NAMESPACE|DESTINATION|PERMISSIONS|CONFIGURATIONS|COMPONENT|CXX|CUDA|Fortran|ASM|CSharp|Swift|MACOSX_BUNDLE|INCLUDES|OUTPUT_NAME|HEADERS|PROGRAMS|LIBRARY|RUNTIME|NAMELINK_SKIP|PATHS|HINTS|PATH_SUFFIXES|NO_DEFAULT_PATH|REGEX|PATTERN|EXCLUDE';

// if() 等条件里直接写变量名，这些平台变量单独标成变量色
const CMAKE_COND_VARS = 'WIN32|UNIX|APPLE|MSVC|MSYS|MINGW|CYGWIN|ANDROID|IOS|MSVC_IDE|XCODE|BORLAND|WATCOM';

const CMAKE_RE = new RegExp(
  [
    '(#[^\\n]*)', // 1 comment
    '("(?:[^"\\\\]|\\\\[\\s\\S])*")', // 2 string
    '(\\$(?:ENV|CACHE)?\\{[^}]*\\})', // 3 variable
    '(\\$<[^>]*>)', // 4 generator expression
    '(\\b(?:' + CMAKE_KEYWORDS + ')\\b)', // 5 keyword
    '(\\b(?:' + CMAKE_COND_VARS + ')\\b)', // 6 platform variable
    '([A-Za-z_][A-Za-z0-9_]*(?=\\s*\\())', // 7 command
    '([A-Za-z_][A-Za-z0-9_]*::[A-Za-z0-9_]+)', // 8 namespaced target
    '(\\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\\b)', // 9 ALL_CAPS variable name
    '(\\b\\d+(?:\\.\\d+)*\\b)', // 10 number
  ].join('|'),
  'g'
);

const CMAKE_CLASS = [
  'tok-comment',
  'tok-string',
  'tok-var',
  'tok-op',
  'tok-keyword',
  'tok-param',
  'tok-cmdlet',
  'tok-type',
  'tok-param',
  'tok-num',
];

// ---- C / C++

const CPP_KEYWORDS =
  'alignas|alignof|auto|bool|break|case|catch|char|class|const|constexpr|consteval|constinit|const_cast|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|throw|true|try|typedef|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while|import|module|concept|requires|override|final';

const CPP_TYPES =
  'std|size_t|ptrdiff_t|max_align_t|nullptr_t|bool|int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|string|string_view|vector|map|set|unordered_map|unordered_set|array|list|deque|pair|tuple|optional|variant|function|shared_ptr|unique_ptr|weak_ptr|ostream|istream|stringstream|istringstream|ostringstream|cout|cerr|clog|cin|endl|filesystem|thread|mutex|atomic|chrono|exception|runtime_error|logic_error|iterator|const_iterator|reverse_iterator|allocator|less|hash|numeric_limits|initializer_list|complex|valarray|bitset|regex|locale|fstream|ifstream|ofstream|sstream|iomanip|limits|typeinfo|typeindex|char8_t|char16_t|char32_t|u8string|u16string|u32string|wstring|wstring_view';

const CPP_RE = new RegExp(
  [
    '(\\/\\/[^\\n]*)', // 1 line comment
    '(^[ \\t]*#[ \\t]*define[ \\t]+[A-Za-z_][A-Za-z0-9_]*)', // 2 macro definition
    '(^[ \\t]*#[ \\t]*[A-Za-z]+)', // 3 preprocessor directive
    '("(?:[^"\\\\]|\\\\[\\s\\S])*")', // 4 string
    ("('(?:[^'\\\\]|\\\\[\\s\\S])*')"), // 5 char
    '(\\b(?:' + CPP_KEYWORDS + ')\\b)', // 6 keyword
    '(\\b(?:' + CPP_TYPES + ')\\b)', // 7 common type / std name
    '(\\b[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)+\\b)', // 8 CamelCase class name
    '(\\b[A-Z][A-Z0-9_]{2,}\\b)', // 9 macro / constant
    '([A-Za-z_][A-Za-z0-9_]*(?=\\s*\\())', // 10 function call
    '(\\b\\d+(?:\\.\\d+)?(?:[fFuUlL]*)\\b)', // 11 number
  ].join('|'),
  'g'
);

const CPP_CLASS = [
  'tok-comment',
  'tok-param',
  'tok-param',
  'tok-string',
  'tok-string',
  'tok-keyword',
  'tok-type',
  'tok-type',
  'tok-param',
  'tok-cmdlet',
  'tok-num',
];

// ---- JSON

const JSON_RE =
  /("(?:[^"\\]|\\.)*")(?=\s*:)|("(?:[^"\\]|\\.)*")|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\b(?:true|false|null)\b)/g;

const JSON_CLASS = ['tok-param', 'tok-string', 'tok-num', 'tok-keyword'];

// ---- Python：关键字、内置函数 / 类型、字符串前缀、三引号与装饰器

const PY_KEYWORDS = new Set(
  'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'.split(
    ' '
  )
);

const PY_BUILTINS = new Set(
  (
    'abs aiter all anext any ascii bin bool breakpoint bytearray bytes callable chr classmethod compile complex ' +
    'delattr dict dir divmod enumerate eval exec filter float format frozenset getattr globals hasattr hash help hex ' +
    'id input int isinstance issubclass iter len list locals map max memoryview min next object oct open ord pow print ' +
    'property range repr reversed round set setattr slice sorted staticmethod str sum super tuple type vars zip ' +
    'Exception ValueError TypeError KeyError IndexError StopIteration AttributeError ImportError RuntimeError ' +
    'ZeroDivisionError FileNotFoundError FileExistsError OSError NameError OverflowError NotImplementedError ' +
    'UnicodeDecodeError UnicodeEncodeError SystemExit KeyboardInterrupt ArithmeticError LookupError GeneratorExit'
  ).split(' ')
);

function pySpan(cls, text) {
  return '<span class="' + cls + '">' + escapeHtml(text) + '</span>';
}

function highlightPython(code) {
  const state = { triple: null };
  return code
    .split('\n')
    .map((line) => {
      let out = '';
      let i = 0;
      const n = line.length;
      while (i < n) {
        // 还在上一行开启的三引号字符串里
        if (state.triple) {
          const end = line.indexOf(state.triple, i);
          if (end === -1) {
            out += pySpan('tok-string', line.slice(i));
            break;
          }
          out += pySpan('tok-string', line.slice(i, end + 3));
          i = end + 3;
          state.triple = null;
          continue;
        }

        const rest = line.slice(i);

        // 字符串：支持 r / b / u / f 前缀与三引号
        const sm = /^([rRbBuUfF]{0,2})("""|'''|"|')/.exec(rest);
        if (sm) {
          const quote = sm[2];
          const isTriple = quote.length === 3;
          const start = i;
          i += sm[0].length;
          if (isTriple) {
            const end = line.indexOf(quote, i);
            if (end === -1) {
              out += pySpan('tok-string', line.slice(start));
              state.triple = quote;
              break;
            }
            out += pySpan('tok-string', line.slice(start, end + 3));
            i = end + 3;
          } else {
            while (i < n) {
              if (line[i] === '\\') {
                i += 2;
                continue;
              }
              if (line[i] === quote) {
                i += 1;
                break;
              }
              i += 1;
            }
            out += pySpan('tok-string', line.slice(start, Math.min(i, n)));
          }
          continue;
        }

        const ch = rest[0];

        if (ch === '#') {
          out += pySpan('tok-comment', rest);
          break;
        }

        if (ch === '@') {
          const dm = /^@[A-Za-z_][\w.]*/.exec(rest);
          if (dm) {
            out += pySpan('tok-param', dm[0]);
            i += dm[0].length;
            continue;
          }
          out += pySpan('tok-op', ch);
          i += 1;
          continue;
        }

        if (/[A-Za-z_]/.test(ch)) {
          const word = /^[A-Za-z_]\w*/.exec(rest)[0];
          const after = line.slice(i + word.length);
          if (PY_KEYWORDS.has(word)) out += pySpan('tok-keyword', word);
          else if (word === 'self' || word === 'cls') out += pySpan('tok-var', word);
          else if (PY_BUILTINS.has(word)) out += pySpan('tok-type', word);
          else if (/^\s*\(/.test(after)) out += pySpan('tok-cmdlet', word);
          else out += escapeHtml(word);
          i += word.length;
          continue;
        }

        if (/\d/.test(ch)) {
          const nm = /^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[jJ]?/.exec(rest);
          if (nm) {
            out += pySpan('tok-num', nm[0]);
            i += nm[0].length;
            continue;
          }
        }

        if (/[+\-*/%=<>!&|^~]/.test(ch)) {
          out += pySpan('tok-op', ch);
          i += 1;
          continue;
        }

        out += escapeHtml(ch);
        i += 1;
      }
      return out;
    })
    .join('\n');
}

export function escapeHtml(input) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 在字符串 / 注释等整段 token 内部，再给 ${VAR} 着一层变量色
function withVars(text) {
  return escapeHtml(text).replace(/(\$(?:ENV|CACHE)?\{[^}]*\})/g, '<span class="tok-var">$1</span>');
}

function tokenize(line, re, classes, decorate) {
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
    const inner = decorate ? decorate(groupIndex, m[0]) : null;
    out += inner !== null ? inner : '<span class="' + cls + '">' + escapeHtml(m[0]) + '</span>';
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

function highlightCMake(code) {
  return code
    .split('\n')
    .map((line) => tokenize(line, CMAKE_RE, CMAKE_CLASS, (group, text) => (group === 1 ? withVars(text) : null)))
    .join('\n');
}

// 块注释可能跨行，按行记录是否还在 /* ... */ 里
function highlightCpp(code) {
  let inBlockComment = false;
  return code
    .split('\n')
    .map((line) => {
      if (inBlockComment) {
        const end = line.indexOf('*/');
        if (end === -1) return '<span class="tok-comment">' + escapeHtml(line) + '</span>';
        inBlockComment = false;
        const head = '<span class="tok-comment">' + escapeHtml(line.slice(0, end + 2)) + '</span>';
        return head + tokenize(line.slice(end + 2), CPP_RE, CPP_CLASS);
      }
      // #include 后面的 <头文件> 按“类型”着色
      const inc = /^[ \t]*#[ \t]*include[ \t]*(.*)$/.exec(line);
      if (inc && !inc[1].includes('\\"')) {
        const target = inc[1].trim();
        if (/^<[^>]*>$/.test(target) || /^"[^"]*"$/.test(target)) {
          const at = line.indexOf(target);
          return (
            '<span class="tok-param">' + escapeHtml(line.slice(0, at)) + '</span>' +
            '<span class="' + (target[0] === '<' ? 'tok-type' : 'tok-string') + '">' + escapeHtml(target) + '</span>' +
            tokenize(line.slice(at + target.length), CPP_RE, CPP_CLASS)
          );
        }
      }
      const open = line.search(/\/\*/);
      const next = open === -1 ? -1 : line.indexOf('*/', open + 2);
      if (open !== -1 && next === -1) {
        inBlockComment = true;
        return tokenize(line.slice(0, open), CPP_RE, CPP_CLASS) + '<span class="tok-comment">' + escapeHtml(line.slice(open)) + '</span>';
      }
      if (open !== -1) {
        return (
          tokenize(line.slice(0, open), CPP_RE, CPP_CLASS) +
          '<span class="tok-comment">' + escapeHtml(line.slice(open, next + 2)) + '</span>' +
          tokenize(line.slice(next + 2), CPP_RE, CPP_CLASS)
        );
      }
      return tokenize(line, CPP_RE, CPP_CLASS);
    })
    .join('\n');
}

function highlightJson(code) {
  return code
    .split('\n')
    .map((line) => tokenize(line, JSON_RE, JSON_CLASS, (group, text) => (group <= 1 && text.includes('${') ? '<span class="' + JSON_CLASS[group] + '">' + withVars(text) + '</span>' : null)))
    .join('\n');
}

export function highlight(code, lang = 'text') {
  const l = normalizeLang(lang);
  if (l === 'powershell') return highlightPowerShell(code);
  if (l === 'bash') return highlightBash(code);
  if (l === 'python') return highlightPython(code);
  if (l === 'cmake') return highlightCMake(code);
  if (l === 'cpp' || l === 'c') return highlightCpp(code);
  if (l === 'json') return highlightJson(code);
  return escapeHtml(code);
}

export function normalizeLang(lang) {
  const l = String(lang || 'text').toLowerCase();
  if (['powershell', 'ps1', 'pwsh', 'ps'].includes(l)) return 'powershell';
  if (['bash', 'sh', 'shell', 'console'].includes(l)) return 'bash';
  if (['python', 'py', 'python3', 'py3'].includes(l)) return 'python';
  if (['text', 'output', 'plain'].includes(l)) return 'text';
  if (['cpp', 'c++', 'cxx', 'cc'].includes(l)) return 'cpp';
  if (l === 'c') return 'c';
  return l;
}
