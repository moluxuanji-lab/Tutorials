Python 正则表达式
==================

.. meta::
   :group: 标准库与实战
   :summary: 从 re 模块的核心函数讲起，掌握元字符、字符类、分组、量词与编译标志，并用正则完成手机号、邮箱、日期的校验和日志解析、批量替换等实战任务。

正则表达式是一套描述“文本模式”的小语言：用少量符号概括一大类字符串，再让引擎去文本里把它们找出来。它的价值在于把“逐字符判断”变成“声明规则”，一行模式往往能替代几十行 ``if`` 与 ``startswith``。

Python 的标准库 ``re`` 模块是这套能力的入口。它支持 Perl 风格的正则语法，提供匹配、查找、替换、分割四类操作，返回的 ``Match`` 对象还能读出分组、位置等细节。这一章从最常用的几个函数讲起，逐步过渡到元字符、分组与编译标志，最后用几段完整脚本收尾。

一、re 模块：从一次匹配开始
---------------------------

``re.search()`` 是最常用的入口：它在整段文本里扫描，返回第一个匹配到的 ``Match`` 对象；找不到时返回 ``None``，所以调用 ``.group()`` 之前最好先判断结果是否为空。

模式串建议一律写成原始字符串，例如 ``r"\d{4}"``。正则里的反斜杠本身有含义，普通字符串会先做一次转义，写出 ``"\\d{4}"`` 才能得到同样的效果，而原始字符串让反斜杠原样传给正则引擎，可读性高很多。

.. code-block:: python

   import re

   text = "订单 A1024 已于 2026-11-27 发货，金额 268 元"

   date = re.search(r"\d{4}-\d{2}-\d{2}", text)
   amount = re.search(r"\d+", text)
   code = re.search(r"[A-Z]\d{4}", text)

   print("日期：", date.group())
   print("第一个数字串：", amount.group())
   print("编号：", code.group())
   print("是否匹配到编号：", code is not None)

输出结果：

.. code-block:: text

   日期： 2026-11-27
   第一个数字串： 1024
   编号： A1024
   是否匹配到编号： True

``\d`` 表示一个数字，``{4}`` 表示前面的元素重复四次，两者拼起来就是“四位数字”。``group()`` 不带参数时返回整个匹配到的文本，``match.group(0)`` 与它等价。如果改用 ``re.search(r"\d{5}", text)``，结果会是 ``None``，此时 ``.group()`` 会抛出 ``AttributeError``，先判断再取值是更稳妥的写法。

二、match、search 与 fullmatch
------------------------------

三个函数的名字很像，区别只在“从哪里开始、到哪里结束”：

* ``re.match()`` 只从字符串开头尝试匹配，开头对不上就返回 ``None``。
* ``re.search()`` 扫描整段文本，任何位置匹配到都算成功。
* ``re.fullmatch()`` 要求整个字符串完全匹配，多一个字符都不行。

.. code-block:: python

   import re

   pattern = r"\d{3}"

   print("match：", re.match(pattern, "abc123"))
   print("search：", re.search(pattern, "abc123").group())
   print("fullmatch：", re.fullmatch(pattern, "abc123"))

   print("match 从头匹配：", re.match(pattern, "123abc").group())
   print("fullmatch 完全匹配：", re.fullmatch(pattern, "123").group())

输出结果：

.. code-block:: text

   match： None
   search： 123
   fullmatch： None
   match 从头匹配： 123
   fullmatch 完全匹配： 123

做格式校验时应该用 ``fullmatch()``，或者给 ``match()`` 的模式加上 ``^`` 与 ``$``。只写 ``re.match(r"\d{3}", "123abc")`` 会成功，因为它只要求开头三位是数字，后面的 ``abc`` 根本不参与判断，这是校验类代码最常见的漏洞。

三、findall 与 finditer
-----------------------

``search()`` 只找第一个结果，想拿到全部匹配要用 ``findall()`` 或 ``finditer()``。前者直接返回字符串列表，适合快速统计；后者返回迭代器，每次产出一个 ``Match`` 对象，能读到位置和分组。

.. code-block:: python

   import re

   text = "a1 b22 c333 d4444"

   print("findall：", re.findall(r"[a-z]\d+", text))

   for match in re.finditer(r"[a-z](\d+)", text):
       print("整体：", match.group(0), "数字：", match.group(1), "位置：", match.span())

   print("带多个分组：", re.findall(r"([a-z])(\d+)", text))

输出结果：

.. code-block:: text

   findall： ['a1', 'b22', 'c333', 'd4444']
   整体： a1 数字： 1 位置： (0, 2)
   整体： b22 数字： 22 位置： (3, 6)
   整体： c333 数字： 333 位置： (7, 11)
   整体： d4444 数字： 4444 位置： (12, 17)
   带多个分组： [('a', '1'), ('b', '22'), ('c', '333'), ('d', '4444')]

``findall()`` 的返回值会随分组数量变化：没有分组时返回匹配到的整段文本；有一个分组时只返回分组内容；有多个分组时返回元组列表。``finditer()`` 不受这个规则影响，始终能通过 ``group(n)`` 精确取值，需要位置信息时只能用它。

四、分组与命名分组
------------------

圆括号除了改变优先级，还会“捕获”括号内的内容。``group(1)``、``group(2)`` 按左括号出现的顺序编号，给括号加上 ``?P<name>`` 前缀则可以用名字取值，日志解析这类场景用命名分组可读性最好。

.. code-block:: python

   import re

   line = "2026-11-27 08:30:00 ERROR 数据库连接超时"
   pattern = (
       r"(?P<date>\d{4}-\d{2}-\d{2}) "
       r"(?P<time>\d{2}:\d{2}:\d{2}) "
       r"(?P<level>[A-Z]+) "
       r"(?P<message>.+)"
   )

   match = re.match(pattern, line)

   print("整体：", match.group(0))
   print("日期：", match.group("date"))
   print("时间：", match.group(2))
   print("级别：", match.group("level"))
   print("全部捕获：", match.groups())
   print("命名映射：", match.groupdict())

输出结果：

.. code-block:: text

   整体： 2026-11-27 08:30:00 ERROR 数据库连接超时
   日期： 2026-11-27
   时间： 08:30:00
   级别： ERROR
   全部捕获： ('2026-11-27', '08:30:00', 'ERROR', '数据库连接超时')
   命名映射： {'date': '2026-11-27', 'time': '08:30:00', 'level': 'ERROR', 'message': '数据库连接超时'}

``groups()`` 按编号顺序返回元组，``groupdict()`` 返回名字到内容的字典，二者都不包含 ``group(0)``。如果某个分组没有参与匹配，它在 ``groups()`` 里的位置是 ``None``。

不需要保留内容时用非捕获分组 ``(?:...)``，它只分组不编号。``(ab)+`` 会重复匹配，但分组只保留最后一次捕获的 ``ab``，``re.findall(r"(ab)+", "ababab")`` 因此只得到两个 ``ab``；换成 ``(?:ab)+`` 后没有捕获组，``findall()`` 返回整段 ``ababab``。本章后面出现的 ``(?:\.\d+)?``、``(?:\d{1,3}){3}`` 都是这个写法，它们只负责把多个元素捆成一个整体，不占用分组编号。

五、compile 预编译
------------------

同一个模式在循环里反复使用时，应该先用 ``re.compile()`` 编译成 ``Pattern`` 对象。``re`` 模块内部有缓存，重复调用 ``re.search()`` 不会真的重复编译，但显式编译更清晰，也方便把模式、标志位集中在一处管理。

.. code-block:: python

   import re

   word = re.compile(r"\bpython\b", re.IGNORECASE)

   print("原始模式：", word.pattern)
   print("是否忽略大小写：", bool(word.flags & re.IGNORECASE))
   print("分组数量：", word.groups)

   text = "Python is great, pythonic style also counts"
   print("全部匹配：", word.findall(text))
   print("替换结果：", word.sub("Python", text))
   print("匹配次数：", len(word.findall(text)))

输出结果：

.. code-block:: text

   原始模式： \bpython\b
   是否忽略大小写： True
   分组数量： 0
   全部匹配： ['Python']
   替换结果： Python is great, pythonic style also counts
   匹配次数： 1

``\b`` 是单词边界，``\bpython\b`` 要求 ``python`` 前后都不是单词字符。文本开头的 ``Python`` 右侧是空格，符合条件；``pythonic`` 里的 ``python`` 后面紧跟 ``i``，仍属于同一个单词，没有边界，因此被排除——这正是 ``\b`` 想要的效果。``word.pattern`` 原样返回模式串，``word.groups`` 是捕获分组数量，这里没有括号所以是 0。


六、元字符速查
--------------

正则的“魔法”几乎全部来自下面这些符号。它们单独出现时各有含义，放进方括号里则会变成普通字符：

.. csv-table::
   :header: "元字符", "含义", "示例"

   "``.``", "匹配除换行符以外的任意单个字符", "``a.c`` 可匹配 ``abc``、``a c``"
   "``^``", "匹配字符串或行的开头", "``^Python`` 只匹配开头的 Python"
   "``$``", "匹配字符串或行的结尾", "``end$`` 只匹配结尾的 end"
   "``*``", "前一个元素重复 0 次或多次", "``ab*c`` 可匹配 ``ac``、``abc``"
   "``+``", "前一个元素重复 1 次或多次", "``ab+c`` 不匹配 ``ac``"
   "``?``", "前一个元素重复 0 次或 1 次", "``colou?r`` 匹配两种拼写"
   "``{m,n}``", "前一个元素重复 m 到 n 次", "``\d{2,4}`` 匹配 2 到 4 位数字"
   "``[]``", "字符集合，匹配其中任意一个字符", "``[aeiou]`` 匹配任意元音"
   "``|``", "或，左右两侧任选其一", "``cat|dog`` 匹配 cat 或 dog"
   "``()``", "分组并捕获，可配合量词使用", "``(ab)+`` 匹配连续的 ab"
   "``\``", "转义，把元字符还原成字面字符", "``\.`` 匹配真正的句点"

这些符号在方括号内部会失去特殊含义：``[.]`` 匹配句点，``[$]`` 匹配美元符号，``[+*?]`` 匹配三个运算符字符。反过来，方括号里要表示“非”得用 ``^``，并且必须写在最前面，例如 ``[^0-9]`` 表示“不是数字的字符”。

七、字符类：``\d``、``\w``、``\s``
-----------------------------------

最常用的三个字符类各有大小写两个版本：小写匹配“是”，大写匹配“不是”。它们都受 ``re.UNICODE`` 影响，在 Python 3 里默认识别 Unicode，所以 ``\w`` 能匹配汉字。

.. code-block:: python

   import re

   text = "ID: A-1024, 价格 268.50, 库存 12 件"

   print("数字：", re.findall(r"\d+", text))
   print("单词字符：", re.findall(r"\w+", text))
   print("带符号的数值：", re.findall(r"-?\d+(?:\.\d+)?", text))
   print("非数字片段：", re.findall(r"\D+", "a1b2c3"))
   print("空白数量：", len(re.findall(r"\s", text)))

   print("十六进制：", re.findall(r"[0-9A-F]{2}", "颜色 #FF8800"))

输出结果：

.. code-block:: text

   数字： ['1024', '268', '50', '12']
   单词字符： ['ID', 'A', '1024', '价格', '268', '50', '库存', '12', '件']
   带符号的数值： ['-1024', '268.50', '12']
   非数字片段： ['a', 'b', 'c']
   空白数量： 6
   十六进制： ['FF', '88', '00']

``\d`` 只认数字，遇到小数点就断开，所以 ``268.50`` 会被拆成 ``268`` 和 ``50``；加上 ``(?:\.\d+)?`` 这个可选的小数部分后，才能整体取出 ``268.50``。``\w`` 包含字母、数字、下划线和汉字，因此“价格”“库存”也会出现在结果里，想只匹配 ASCII 单词可以给模式加 ``re.ASCII`` 标志。``\D`` 是 ``\d`` 的补集，得到的正是被数字隔开的那些片段。

八、量词、贪婪与懒惰
--------------------

默认情况下，``*``、``+``、``{m,n}`` 都是贪婪的：在能让整体匹配成功的前提下，它们会尽可能多吞字符。在量词后面加一个 ``?`` 就变成懒惰模式，改为尽可能少吞。

.. code-block:: python

   import re

   html = "<b>加粗</b><i>斜体</i>"

   print("贪婪：", re.findall(r"<.+>", html))
   print("懒惰：", re.findall(r"<.+?>", html))

   text = "编号 1001，数量 25，单价 9.9"
   print("贪婪数字：", re.search(r"\d.+\d", text).group())
   print("懒惰数字：", re.search(r"\d.+?\d", text).group())

输出结果：

.. code-block:: text

   贪婪： ['<b>加粗</b><i>斜体</i>']
   懒惰： ['<b>', '</b>', '<i>', '</i>']
   贪婪数字： 1001，数量 25，单价 9.9
   懒惰数字： 100

``<.+>`` 从第一个 ``<`` 一直吞到最后一个 ``>``，整段 HTML 被当成一个匹配；``<.+?>`` 每遇到一个 ``>`` 就收手，于是得到四个标签。解析 HTML 这类嵌套结构时应改用专门的解析器，正则只适合处理结构规整的短文本。

量词还有第三种写法 ``*+``、``++``、``?+``，称为占有量词，Python 3.11 起支持。它一旦吞下字符就不再回退，适合需要避免回溯爆炸的场合，代价是可能匹配不到本可以匹配的结果。

九、替换：sub 与 subn
---------------------

``re.sub()`` 把匹配到的部分替换成新文本，替换内容里可以用 ``\1``、``\g<name>`` 引用分组；``re.subn()`` 在替换的同时返回替换次数，适合做统计或校验。

.. code-block:: python

   import re

   text = "联系电话 138-0000-1111，备用 139-2222-3333"

   masked = re.sub(r"(\d{3})-\d{4}-(\d{4})", r"\1-****-\2", text)
   print("掩码：", masked)

   result, count = re.subn(r"\d", "#", "A1B2C3")
   print("替换结果：", result)
   print("替换次数：", count)

   def double(match):
       return str(int(match.group()) * 2)

   print("函数替换：", re.sub(r"\d+", double, "a1 b22 c333"))

输出结果：

.. code-block:: text

   掩码： 联系电话 138-****-1111，备用 139-****-3333
   替换结果： A#B#C#
   替换次数： 3
   函数替换： a2 b44 c666

替换字符串里的 ``\1`` 表示第一个分组，写成 ``\g<1>`` 也可以；如果分组后面紧跟数字，必须用 ``\g<1>0`` 这种形式，否则 ``\10`` 会被理解成第 10 个分组。传入函数时，函数收到的是 ``Match`` 对象，返回值会替换整个匹配，用来做数值加倍、大小写转换这类动态替换非常方便。

十、分割：split
---------------

``re.split()`` 按模式切分字符串，比 ``str.split()`` 灵活得多：分隔符可以是多个字符、可以是多种符号的集合，还能保留分隔符本身。

.. code-block:: python

   import re

   line = "苹果, 香蕉;  橙子|西瓜"

   print("多分隔符：", re.split(r"[,;|]\s*", line))
   print("限制次数：", re.split(r"\s+", "a  b   c d", maxsplit=2))
   print("保留分隔符：", re.split(r"(\s+)", "a  b"))

输出结果：

.. code-block:: text

   多分隔符： ['苹果', '香蕉', '橙子', '西瓜']
   限制次数： ['a', 'b', 'c d']
   保留分隔符： ['a', '  ', 'b']

``maxsplit`` 控制最多切几刀，剩下的部分原样保留；不指定时全部分割。如果分隔模式里带捕获分组，分组内容会作为独立元素插进结果列表，这个特性在需要保留分隔符时很有用，不需要时记得写成非捕获分组 ``(?:...)``。

十一、编译标志 flags
--------------------

标志位用来整体改变模式的解释方式，既可以在调用函数时以关键字参数传入，也可以在 ``re.compile()`` 时固定下来：

* ``re.IGNORECASE``（简写 ``re.I``）：忽略大小写。
* ``re.MULTILINE``（简写 ``re.M``）：让 ``^`` 与 ``$`` 匹配每一行的开头和结尾，而不只是整段文本的首尾。
* ``re.DOTALL``（简写 ``re.S``）：让 ``.`` 也能匹配换行符。
* ``re.VERBOSE``（简写 ``re.X``）：允许在模式里写空白和 ``#`` 注释，把长模式拆成多行。

多个标志用按位或 ``|`` 组合。

省略 ``MULTILINE`` 时，``^python$`` 只认“整段文本恰好是 python”，所以多行文本一行都匹配不上。同理，``.`` 默认不匹配换行，跨行匹配必须打开 ``DOTALL``。

.. code-block:: python

   import re

   text = "Python\npython\nPYTHON"

   print("默认：", re.findall(r"^python$", text))
   print("IGNORECASE：", re.findall(r"^python$", text, re.IGNORECASE))
   print("再加 MULTILINE：", re.findall(r"^python$", text, re.IGNORECASE | re.MULTILINE))

   paragraph = "第一行\n第二行\n第三行"
   print("默认点号：", re.findall(r"第一.*第三行", paragraph))
   print("DOTALL：", re.findall(r"第一.*第三行", paragraph, re.DOTALL))

   phone = re.compile(
       r"""
       ^1[3-9]\d      # 号段：1 开头，第二位 3 到 9
       \d{8}          # 后面再接 8 位数字
       $
       """,
       re.VERBOSE,
   )
   print("VERBOSE 接受合法号码：", bool(phone.match("13800001111")))
   print("VERBOSE 拒绝非法号码：", bool(phone.match("12800001111")))

输出结果：

.. code-block:: text

   默认： []
   IGNORECASE： []
   再加 MULTILINE： ['Python', 'python', 'PYTHON']
   默认点号： []
   DOTALL： ['第一行\n第二行\n第三行']
   VERBOSE 接受合法号码： True
   VERBOSE 拒绝非法号码： False

单独使用 ``IGNORECASE`` 时结果依然为空，因为它只解决大小写，不解决 ``^`` 与 ``$`` 的匹配范围：不放宽 ``MULTILINE`` 时，这两个锚点只认整段文本的首尾。两个标志叠加后，每一行的首尾都会参与判断，三种大小写写法全部命中。``VERBOSE`` 模式下空白会被忽略，想匹配真正的空格要写成 ``\ `` 或 ``[ ]``；``#`` 之后到行尾的内容全部是注释。

十二、常用校验：手机号、邮箱、日期
----------------------------------

正则最日常的用途是校验格式。校验类模式的共同点是“首尾都要卡死”，所以要么用 ``fullmatch()``，要么在模式里写 ``^`` 和 ``$``。

手机号与邮箱
~~~~~~~~~~~~

中国大陆手机号是 11 位，第一位固定为 1，第二位目前是 3 到 9。邮箱的完整规范非常复杂，实践里用一条够用的近似模式即可，真正投递成功与否只能靠发验证邮件确认。

.. code-block:: python

   import re

   PHONE = re.compile(r"^1[3-9]\d{9}$")
   EMAIL = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")

   for value in ["13800001111", "19912345678", "12345678901", "1380000111"]:
       print(f"手机号 {value}：", "通过" if PHONE.match(value) else "不通过")

   for value in ["dev@example.com", "user.name+tag@sub.example.cn", "dev@example", "@example.com"]:
       print(f"邮箱 {value}：", "通过" if EMAIL.match(value) else "不通过")

输出结果：

.. code-block:: text

   手机号 13800001111： 通过
   手机号 19912345678： 通过
   手机号 12345678901： 不通过
   手机号 1380000111： 不通过
   邮箱 dev@example.com： 通过
   邮箱 user.name+tag@sub.example.cn： 通过
   邮箱 dev@example： 不通过
   邮箱 @example.com： 不通过

``12345678901`` 的第二位是 2，不符合 ``[3-9]``；``1380000111`` 只有 10 位，被 ``\d{9}`` 挡下。邮箱模式里 ``[A-Za-z0-9.-]+`` 允许域名带点和连字符，``\.[A-Za-z]{2,}$`` 要求最后一段至少两个字母，所以 ``dev@example`` 缺少顶级域名会被拒绝。

日期
~~~~

只靠正则判断“年月日”只能保证形状正确，像 2 月 30 日这种不存在的日期它看不出来。稳妥的做法是先用正则卡格式，再交给 ``datetime.date`` 验证真实性。

.. code-block:: python

   import re
   from datetime import date

   DATE = re.compile(r"^(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})$")

   def check(value):
       match = DATE.match(value)
       if match is None:
           return "格式错误"
       try:
           date(int(match.group("year")), int(match.group("month")), int(match.group("day")))
       except ValueError:
           return "日期不存在"
       return "通过"

   for value in ["2026-11-27", "2026-02-30", "2026/11/27", "2026-13-01"]:
       print(value, check(value))

输出结果：

.. code-block:: text

   2026-11-27 通过
   2026-02-30 日期不存在
   2026/11/27 格式错误
   2026-13-01 日期不存在

``date()`` 构造函数会检查月份是否在 1 到 12 之间、当月是否有那一天，抛出的 ``ValueError`` 正好用来区分“格式对但日期错”。这种“正则管形状、业务代码管语义”的分工，比把所有规则塞进一条巨型正则更易维护。

十三、实战：日志解析与字段提取
------------------------------

把前面的零件拼起来，就能写一个小而实用的日志分析脚本：用命名分组拆出 IP、方法、路径和状态码，再筛出所有 4xx、5xx 请求，最后顺手把下划线命名转成驼峰。

.. code-block:: python

   import re

   LOG = re.compile(
       r'(?P<ip>\d{1,3}(?:\.\d{1,3}){3}) - - '
       r'"(?P<method>[A-Z]+) (?P<path>\S+) [^"]*" '
       r'(?P<status>\d{3})'
   )

   lines = [
       '10.0.0.1 - - "GET /index HTTP/1.1" 200',
       '10.0.0.2 - - "POST /api/login HTTP/1.1" 401',
       '10.0.0.1 - - "GET /missing HTTP/1.1" 404',
   ]

   records = [LOG.match(line) for line in lines]
   for record in records:
       print(record.group("ip"), record.group("method"), record.group("path"), record.group("status"))

   failed = [record.group("path") for record in records if int(record.group("status")) >= 400]
   print("失败接口：", failed)

   names = ["user_name", "order_id", "http_status_code"]
   print("驼峰命名：", [re.sub(r"_([a-z])", lambda m: m.group(1).upper(), name) for name in names])

输出结果：

.. code-block:: text

   10.0.0.1 GET /index 200
   10.0.0.2 POST /api/login 401
   10.0.0.1 GET /missing 404
   失败接口： ['/api/login', '/missing']
   驼峰命名： ['userName', 'orderId', 'httpStatusCode']

``(?:\d{1,3}){3}`` 把“点加分段”重复三次，再用 ``(?:\.\d{1,3}){3}`` 之外的写法拼出完整 IPv4，外层用命名分组一次性取出。``[^"]*`` 匹配引号内的协议部分，比 ``.*?`` 更稳，因为它遇到引号必然停下，不会误吞后面的内容。驼峰转换用 ``re.sub()`` 加函数替换，每次只处理一个 ``_字母``，逻辑比拆字符串再拼接更短。

十四、练习任务
--------------

任务 1：文本里有三种日期写法，请统一成 ``年-月-日``，月份和日期补足两位。

.. code-block:: python

   import re

   text = "开始 2026/03/05，结束 2026.11.27，备注 2026年12月01日"
   pattern = re.compile(r"(\d{4})[/.年](\d{1,2})[/.月](\d{1,2})日?")

   for match in pattern.finditer(text):
       year, month, day = match.groups()
       print(f"{year}-{int(month):02d}-{int(day):02d}")

输出结果：

.. code-block:: text

   2026-03-05
   2026-11-27
   2026-12-01

任务 2：把用户记录里的手机号中间四位和邮箱用户名做脱敏，保留首字符。

.. code-block:: python

   import re

   records = [
       "张三 13800001111 zhang@example.com",
       "李四 13912345678 li.si@corp.cn",
   ]

   def mask(text):
       text = re.sub(r"(?<=\d{3})\d{4}(?=\d{4})", "****", text)
       text = re.sub(r"([\w.+-])[\w.+-]*@", r"\1***@", text)
       return text

   for line in records:
       print(mask(line))

输出结果：

.. code-block:: text

   张三 138****1111 z***@example.com
   李四 139****5678 l***@corp.cn

任务 3：用正则实现一个极简模板引擎，把 ``{key}`` 替换成字典里对应的值，缺少的键保持原样。

.. code-block:: python

   import re

   template = "你好 {name}，你的订单 {order} 已发货，预计 {days} 天送达。"
   values = {"name": "小明", "order": "A1024"}

   def replace(match):
       return values.get(match.group(1), match.group(0))

   print(re.sub(r"\{(\w+)\}", replace, template))

输出结果：

.. code-block:: text

   你好 小明，你的订单 A1024 已发货，预计 {days} 天送达。
