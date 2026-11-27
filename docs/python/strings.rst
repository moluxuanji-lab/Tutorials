Python 字符串
================

.. meta::
   :group: 核心语法
   :summary: 掌握字符串的创建、转义、索引切片、不可变性与三种格式化方式，熟练使用常用方法、编解码和多行字符串。

字符串是 Python 中最常用的数据类型之一。文本、日志、配置、网页内容，最终都以字符串的形式进入程序。Python 的字符串功能密集，切片、格式化、查找替换、编解码都有现成方法，熟练之后可以用很短的代码完成大量文本处理工作。

本章按照菜鸟教程字符串章节的主线展开，从创建与转义讲到格式化与常用方法，最后给出可以直接运行的练习。

一、创建与转义
----------------

字符串可以用单引号或双引号包裹，两者完全等价。内容里出现双引号时用单引号包裹，出现单引号时用双引号包裹，就能少写转义。两种引号都有时，再用反斜杠转义。

转义字符
~~~~~~~~

反斜杠 ``\`` 用来表示无法直接写出的字符。常用的转义序列包括 ``\n``（换行）、``\t``（制表符）、``\\``（反斜杠本身）和 ``\'``（单引号）。``repr()`` 会把字符串还原成带转义的形式，适合检查隐藏字符。

原始字符串
~~~~~~~~~~

在字符串前加 ``r`` 得到原始字符串，其中的反斜杠不再表示转义。写 Windows 路径和正则表达式时，原始字符串可以省去大量双反斜杠。

.. code-block:: python

   single = 'Python'
   double = "Python"
   quote = '他说："你好"'
   apostrophe = "It's easy"
   escaped = 'It\'s easy'
   path = r"C:\Users\python"
   tabbed = "姓名\t年龄"
   newline = "第一行\n第二行"

   print(single, double)
   print(quote)
   print(apostrophe)
   print(escaped)
   print(path)
   print(repr(tabbed))
   print(newline)
   print("长度：", len(newline))

输出结果：

.. code-block:: text

   Python Python
   他说："你好"
   It's easy
   It's easy
   C:\Users\python
   '姓名\t年龄'
   第一行
   第二行
   长度： 7

``newline`` 由“第一行”、一个换行符和“第二行”组成，一共 7 个字符。原始字符串 ``r"C:\Users\python"`` 中的 ``\U`` 不会被当作转义序列，因此可以原样输出路径。

二、索引与切片
----------------

字符串是字符序列，可以用下标访问单个字符。下标从 0 开始，``-1`` 表示最后一个字符。方括号里用冒号可以截取一段，完整写法是 ``[start:stop:step]``，包含 ``start``、不包含 ``stop``。

切片不会因为下标越界而报错，但用下标访问不存在的字符会抛出 ``IndexError``。下面的代码把两种行为放在一起演示：

.. code-block:: python

   text = "Python"
   print("原字符串：", text)
   print("第一个字符：", text[0])
   print("最后一个字符：", text[-1])
   print("前三个：", text[:3])
   print("从第 2 个到末尾：", text[2:])
   print("步长为 2：", text[::2])
   print("反转：", text[::-1])

   try:
       print(text[10])
   except IndexError as error:
       print("越界访问：", type(error).__name__, "-", error)

输出结果：

.. code-block:: text

   原字符串： Python
   第一个字符： P
   最后一个字符： n
   前三个： Pyt
   从第 2 个到末尾： thon
   步长为 2： Pto
   反转： nohtyP
   越界访问： IndexError - string index out of range

最后一个例子里的 ``text[10]`` 已经超出长度，解释器抛出 ``IndexError``，错误信息是 ``string index out of range``。切片 ``text[10:20]`` 则只会返回空字符串，不会报错。

三、不可变性
--------------

字符串是不可变对象：创建之后，字符内容不能原地修改。所有看起来像修改的方法，比如 ``upper()``、``replace()``，都会返回一个新字符串，原字符串保持不变。

想改变一个字符串，只能重新赋值，用新字符串覆盖原来的名字。下面的代码先验证方法不会改变原值，再尝试直接给下标赋值并捕获异常：

.. code-block:: python

   text = "hello"
   print("原值：", text)
   print("upper 结果：", text.upper())
   print("原值仍是：", text)

   try:
       text[0] = "H"
   except TypeError as error:
       print("直接修改：", type(error).__name__)
       print("错误信息：", error)

   text = "H" + text[1:]
   print("重新赋值后：", text)

输出结果：

.. code-block:: text

   原值： hello
   upper 结果： HELLO
   原值仍是： hello
   直接修改： TypeError
   错误信息： 'str' object does not support item assignment
   重新赋值后： Hello

不可变带来的好处是字符串可以安全地共享和作为字典的键。代价是频繁拼接会不断创建新对象，大量文本拼接时通常先把片段放进列表，最后用 ``join()`` 一次性合并。

四、拼接与重复
----------------

加号 ``+`` 用于拼接两个字符串，乘号 ``*`` 用于把字符串重复若干次。``+=`` 会把右边的字符串接到原字符串后面，但本质上仍然是创建新字符串。

``join()`` 是拼接大量字符串的推荐方式：它用一个分隔符把序列中的元素连接起来，只需要分配一次内存。注意序列里的元素必须都是字符串，混入数字要先转换。

.. code-block:: python

   first = "Py"
   second = "thon"
   message = "Hello"

   print(first + second)
   print(first * 3)
   print("-" * 10)
   print(message + ", world")

   message += "!"
   print(message)

   words = ["Python", "is", "fun"]
   print(" ".join(words))
   print(len(words[0] + words[1]))

输出结果：

.. code-block:: text

   Python
   PyPyPy
   ----------
   Hello, world
   Hello!
   Python is fun
   8

``"-" * 10`` 得到十个连字符，常用来画分隔线。``len(words[0] + words[1])`` 计算的是拼接后 ``"Pythonis"`` 的长度，结果是 8。

五、% 格式化
--------------

百分号格式化是 Python 早期就有的写法，用 ``%`` 占位，再用元组或字典提供值。常见占位符有 ``%s``（字符串）、``%d``（整数）、``%f``（浮点数），可以在百分号后加宽度、精度和对齐方式。

这种写法在维护老代码时经常遇到，新代码通常优先使用 f-string。下面的示例覆盖字符串、整数、浮点数、百分号、宽度、补零和科学计数法：

.. code-block:: python

   name = "小明"
   age = 18
   score = 92.5

   print("我叫 %s，今年 %d 岁。" % (name, age))
   print("分数：%.2f" % score)
   print("百分比：%d%%" % 96)
   print("宽度对齐：[%10s]" % "Tom")
   print("左对齐：[%-10s]" % "Tom")
   print("补零：%05d" % 42)
   print("科学计数：%e" % 12345.678)

输出结果：

.. code-block:: text

   我叫 小明，今年 18 岁。
   分数：92.50
   百分比：96%
   宽度对齐：[       Tom]
   左对齐：[Tom       ]
   补零：00042
   科学计数：1.234568e+04

``%%`` 表示输出一个普通的百分号。``%10s`` 表示总宽度为 10、默认右对齐，``%-10s`` 改成左对齐，``%05d`` 则在左侧补零到 5 位。

六、format() 方法
-------------------

``str.format()`` 用花括号占位，比 ``%`` 更灵活：既能按位置引用，也能按名字引用，还能在占位符里直接写格式说明符。

不带编号的 ``{}`` 按参数顺序依次替换，带编号的 ``{0}``、``{1}`` 可以重复使用同一个参数，带名字的 ``{name}`` 则配合关键字参数使用。冒号后面的部分控制对齐、宽度、精度和进制。

.. code-block:: python

   print("{} 今年 {} 岁".format("小明", 18))
   print("{0} 和 {1}，{0} 先来".format("A", "B"))
   print("{name} 的分数是 {score}".format(name="小明", score=92.5))
   print("[{:>8}]".format("Tom"))
   print("[{:<8}]".format("Tom"))
   print("[{:^8}]".format("Tom"))
   print("{:.2f}".format(3.14159))
   print("{:,}".format(1234567))
   print("{:b}".format(10))

输出结果：

.. code-block:: text

   小明 今年 18 岁
   A 和 B，A 先来
   小明 的分数是 92.5
   [     Tom]
   [Tom     ]
   [  Tom   ]
   3.14
   1,234,567
   1010

``:>8``、``:<8``、``:^8`` 分别表示右对齐、左对齐和居中对齐，数字 8 是总宽度。``:,`` 给数字加千位分隔符，``:b`` 输出二进制。

七、f-string 与格式说明符
---------------------------

f-string 在字符串前加 ``f``，直接用花括号嵌入变量或表达式，是 Python 3.6 之后最推荐的格式化方式。它的可读性最好，执行速度也通常快于 ``%`` 和 ``format()``。

花括号里可以写任意表达式，冒号后面同样可以接格式说明符。调试时还可以在变量名后加 ``=``，f-string 会自动输出“变量名=值”的形式，省去手写标签。

.. code-block:: python

   name = "小明"
   score = 92.456
   ratio = 0.875
   count = 42
   word = "Tom"

   print(f"{name} 的分数是 {score:.2f}")
   print(f"百分比：{ratio:.1%}")
   print(f"补零：{count:05d}")
   print(f"千分位：{1234567:,}")
   print(f"十六进制：{255:#x}")
   print(f"右对齐：[{word:>6}]")
   print(f"表达式：{2 + 3 * 4}")
   print(f"调试写法：{count=}")

输出结果：

.. code-block:: text

   小明 的分数是 92.46
   百分比：87.5%
   补零：00042
   千分位：1,234,567
   十六进制：0xff
   右对齐：[   Tom]
   表达式：14
   调试写法：count=42

常见格式说明符
~~~~~~~~~~~~~~

.. csv-table::
   :header: "说明符", "含义", "示例"

   "``:.2f``", "保留两位小数", "``92.46``"
   "``:.1%``", "百分比，保留一位小数", "``87.5%``"
   "``:05d``", "宽度 5，左侧补零", "``00042``"
   "``:,``", "千位分隔符", "``1,234,567``"
   "``:#x``", "十六进制，带前缀", "``0xff``"
   "``:>6``", "右对齐，宽度 6", "``   Tom``"

格式说明符可以组合使用，例如 ``{:>10,.2f}`` 表示右对齐、宽度 10、带千位分隔符并保留两位小数。写的时候按“填充对齐、宽度、逗号、精度、类型”的顺序排列即可。

八、常用方法（一）：清理与大小写
----------------------------------

字符串方法都返回新字符串，不会修改原对象。``strip()`` 去掉首尾空白，``lstrip()`` 只去左边，``rstrip()`` 只去右边；不带参数时去除空格、制表符和换行符，传入字符集合时则去掉这些字符。

``lower()`` 和 ``upper()`` 转换大小写，``title()`` 把每个单词的首字母大写。处理用户输入时，通常先 ``strip()`` 再统一大小写，避免因为多余空格或大小写差异导致比较失败。

.. code-block:: python

   text = "  Python Tutorial  "
   print("原字符串：[{}]".format(text))
   print("strip：[{}]".format(text.strip()))
   print("lstrip：[{}]".format(text.lstrip()))
   print("rstrip：[{}]".format(text.rstrip()))
   print("lower：", text.strip().lower())
   print("upper：", text.strip().upper())
   print("title：", "hello world".title())
   print("replace：", "banana".replace("a", "o"))
   print("replace 限次：", "banana".replace("a", "o", 2))
   print("去掉指定字符：", "***hi***".strip("*"))

输出结果：

.. code-block:: text

   原字符串：[  Python Tutorial  ]
   strip：[Python Tutorial]
   lstrip：[Python Tutorial  ]
   rstrip：[  Python Tutorial]
   lower： python tutorial
   upper： PYTHON TUTORIAL
   title： Hello World
   replace： bonono
   replace 限次： bonona
   去掉指定字符： hi

``replace(old, new, count)`` 的第三个参数限制替换次数，省略时替换全部。``strip("*")`` 只去掉首尾的星号，中间的字符不受影响。

九、常用方法（二）：拆分、连接与查找
--------------------------------------

``split()`` 按分隔符把字符串拆成列表，``join()`` 则把列表连接成字符串，两者互为逆操作。查找类方法中，``find()`` 找不到时返回 ``-1``，``index()`` 找不到时抛出 ``ValueError``，这是它们最重要的区别。

``count()`` 统计子串出现次数，``startswith()`` 和 ``endswith()`` 判断前缀与后缀，``isdigit()`` 判断字符串是否全部由数字组成。``center()`` 把字符串居中并用指定字符填充，``zfill()`` 在左侧补零到指定宽度。

.. code-block:: python

   sentence = "apple,banana,cherry"
   parts = sentence.split(",")
   print("split：", parts)
   print("split 限次：", "a-b-c-d".split("-", 2))
   print("join：", "-".join(parts))
   print("find：", sentence.find("banana"))
   print("find 不存在：", sentence.find("grape"))
   print("index：", sentence.index("cherry"))
   print("count：", "banana".count("a"))
   print("startswith：", sentence.startswith("apple"))
   print("endswith：", sentence.endswith("cherry"))
   print("isdigit：", "12345".isdigit(), "12a".isdigit())
   print("center：[{}]".format("Hi".center(8, "*")))
   print("zfill：", "42".zfill(5))

   try:
       sentence.index("grape")
   except ValueError as error:
       print("index 找不到：", type(error).__name__, "-", error)

输出结果：

.. code-block:: text

   split： ['apple', 'banana', 'cherry']
   split 限次： ['a', 'b', 'c-d']
   join： apple-banana-cherry
   find： 6
   find 不存在： -1
   index： 13
   count： 3
   startswith： True
   endswith： True
   isdigit： True False
   center：[***Hi***]
   zfill： 00042
   index 找不到： ValueError - substring not found

``split("-", 2)`` 表示最多拆分两次，剩下的部分整体作为最后一个元素。``center(8, "*")`` 的总宽度是 8，``"Hi"`` 占两格，左右各补三个星号。

十、encode 与 decode
----------------------

Python 3 的 ``str`` 是 Unicode 文本，``bytes`` 是字节序列。字符串写入文件、发送网络请求之前要编码成字节，读取之后要解码回文本。``encode()`` 把 ``str`` 转成 ``bytes``，``decode()`` 把 ``bytes`` 转回 ``str``。

UTF-8 是跨平台场景的首选编码，一个汉字通常占 3 个字节。GBK 在中文 Windows 环境里仍然常见，一个汉字占 2 个字节。编码和解码必须使用同一套字符集，否则会出现乱码或 ``UnicodeDecodeError``。

.. code-block:: python

   text = "中文 Python"
   data = text.encode("utf-8")

   print("原字符串：", text)
   print("字符数：", len(text))
   print("UTF-8 字节：", data)
   print("字节数：", len(data))
   print("解码：", data.decode("utf-8"))
   print("GBK 字节数：", len(text.encode("gbk")))
   print("十六进制：", data.hex())
   print("ASCII 编码：", "ABC".encode("ascii"))

   try:
       "中文".encode("ascii")
   except UnicodeEncodeError as error:
       print("编码失败：", type(error).__name__)

输出结果：

.. code-block:: text

   原字符串： 中文 Python
   字符数： 9
   UTF-8 字节： b'\xe4\xb8\xad\xe6\x96\x87 Python'
   字节数： 13
   解码： 中文 Python
   GBK 字节数： 11
   十六进制： e4b8ade6968720507974686f6e
   ASCII 编码： b'ABC'
   编码失败： UnicodeEncodeError

``bytes`` 的打印形式以 ``b`` 开头，非 ASCII 字节用 ``\x`` 十六进制表示。``hex()`` 把全部字节展开成连续的十六进制字符串，排查编码问题时非常直观。

十一、多行字符串
------------------

三个连续的单引号或双引号可以创建多行字符串，其中的换行会原样保留。三引号字符串常用于写说明文字、SQL 语句和 HTML 片段，也可以作为函数或模块的文档字符串。

需要注意，三引号内部的缩进也会成为字符串内容。如果代码本身有缩进，文本左侧会多出空格，可以用 ``textwrap.dedent()`` 去掉公共缩进，或者在书写时把内容顶格。

.. code-block:: python

   poem = """静夜思
   床前明月光，
   疑是地上霜。"""
   print(poem)
   print("行数：", len(poem.splitlines()))
   print("包含换行：", "\n" in poem)

   text = """第一行
   第二行
   第三行"""
   for number, line in enumerate(text.splitlines(), start=1):
       print(number, line)

   note = '''单引号也能创建
   多行字符串'''
   print(note.replace("\n", " / "))
   print("原始表示：", repr("a\nb"))

输出结果：

.. code-block:: text

   静夜思
   床前明月光，
   疑是地上霜。
   行数： 3
   包含换行： True
   1 第一行
   2 第二行
   3 第三行
   单引号也能创建 / 多行字符串
   原始表示： 'a\nb'

``splitlines()`` 按换行符拆分并去掉换行符，适合逐行处理文本。``repr("a\nb")`` 输出 ``'a\nb'``，其中 ``\n`` 是两个可见字符，而不是真正的换行。

练习任务
--------

任务 1：统计一段英文中每个单词出现的次数，按单词字母顺序输出，并打印单词总数。

.. code-block:: python

   text = "the quick brown fox jumps over the lazy dog the fox"
   words = text.split()
   counts = {}

   for word in words:
       counts[word] = counts.get(word, 0) + 1

   for word in sorted(counts):
       print(f"{word}: {counts[word]}")

   print("单词总数：", len(words))

输出结果：

.. code-block:: text

   brown: 1
   dog: 1
   fox: 2
   jumps: 1
   lazy: 1
   over: 1
   quick: 1
   the: 3
   单词总数： 11

任务 2：把逗号分隔的姓名列表清理干净，去掉首尾空格并统一成首字母大写，最后用斜杠连接输出。

.. code-block:: python

   raw = "  alice,BOB,  carol , dave  "
   names = [name.strip().capitalize() for name in raw.split(",")]

   print(names)
   print(" / ".join(names))

输出结果：

.. code-block:: text

   ['Alice', 'Bob', 'Carol', 'Dave']
   Alice / Bob / Carol / Dave

任务 3：写一个密码强度检查函数，依次判断长度、是否只有数字、是否包含大写字母和数字，并给出对应提示。

.. code-block:: python

   def check_password(password):
       if len(password) < 8:
           return "太短"
       if password.isdigit():
           return "只有数字"
       if not any(ch.isupper() for ch in password):
           return "缺少大写字母"
       if not any(ch.isdigit() for ch in password):
           return "缺少数字"
       return "合格"

   for password in ["12345678", "abcdefgh", "Abcdefg1", "Ab1"]:
       print(password, check_password(password))

输出结果：

.. code-block:: text

   12345678 只有数字
   abcdefgh 缺少大写字母
   Abcdefg1 合格
   Ab1 太短
