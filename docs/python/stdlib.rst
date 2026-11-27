Python 标准库概览
==================

.. meta::
   :group: 标准库与实战
   :summary: 认识 Python 标准库的组织方式与浏览方法，掌握 os、sys、math、random、datetime、collections、itertools、functools、pathlib、logging、statistics、hashlib、base64、uuid、time 十五个常用模块的基本用法。

Python 常被称为“自带电池”的语言，一个重要原因就是它附带了规模庞大的标准库。安装解释器时，几百个模块已经就绪，不需要额外下载就能完成文件处理、文本解析、日期计算、数据统计、日志记录等工作。标准库的接口稳定、跨平台，并且随语言同步演进，写脚本时最应该先翻的就是这本“手册”。

标准库的模块按用途分组：文本处理、数据类型、数学与统计、文件与目录、数据持久化、压缩与归档、加密与摘要、操作系统接口、并发、网络与进程间通信、开发工具等。官方文档 `Python 标准库 <https://docs.python.org/zh-cn/3/library/index.html>`_ 就是按这套分组编排的，遇到不熟悉的模块先去那里查，通常比搜索二手文章更准确。

一、标准库的意义与浏览方式
--------------------------

标准库的价值体现在三个方面：一是省去重复造轮子，路径拼接、日期格式化、日志分级这些琐事都有现成实现；二是行为可预期，标准库遵循统一的风格和异常约定，读别人的代码时不需要重新适应；三是减少对外部依赖的担忧，能用标准库解决的需求就不必引入第三方包，部署时少一层风险。

浏览方式
~~~~~~~~

想快速了解本机装了哪些模块，可以在命令行执行 ``python -m pydoc -b``，浏览器会打开一个按字母排序的模块索引；也可以在交互式解释器里执行 ``help("modules")``，直接列出全部模块名。这两者都会把第三方包一并列出，标准库模块可以用 ``sys.stdlib_module_names`` 过滤。

进入具体模块后，``dir(module)`` 列出它的公开名字，``help(module.function)`` 显示函数的签名和文档字符串。标准库源码位于 Python 安装目录的 ``Lib`` 子目录，读一读实现往往比看文档更能理解边界情况。

本章按用途挑出十五个最常用的模块，每个模块配一段可以直接运行的短示例。示例都刻意避开了当前时间、随机数和本机路径，保证每次运行的结果一致，方便对照输出。

二、os：操作系统接口
--------------------

``os`` 封装了操作系统提供的接口：环境变量、进程信息、目录操作、路径处理都在这里。路径相关的函数集中在 ``os.path`` 子模块，它会根据当前平台自动选择分隔符，所以拼接路径应该用 ``os.path.join()``，而不是手写斜杠。

.. code-block:: python

   import os

   os.makedirs("demo_os/2026", exist_ok=True)
   with open(os.path.join("demo_os", "2026", "a.txt"), "w", encoding="utf-8") as file:
       file.write("hello")

   print("目录内容：", sorted(os.listdir("demo_os/2026")))
   print("路径拼接：", os.path.join("demo_os", "2026", "a.txt").replace(os.sep, "/"))
   print("文件大小：", os.path.getsize(os.path.join("demo_os", "2026", "a.txt")))

   os.remove(os.path.join("demo_os", "2026", "a.txt"))
   os.rmdir("demo_os/2026")
   os.rmdir("demo_os")

输出结果：

.. code-block:: text

   目录内容： ['a.txt']
   路径拼接： demo_os/2026/a.txt
   文件大小： 5

``os.makedirs()`` 的 ``exist_ok=True`` 让目录已存在时不再抛异常，脚本可以重复执行。``os.listdir()`` 返回的顺序由文件系统决定，所以示例套了一层 ``sorted()``；``os.path.getsize()`` 以字节为单位，写入的 ``hello`` 正好是 5 个字节。示例结尾把创建的文件和目录删掉，保证下一段代码不受影响。

三、sys：解释器信息
-------------------

``sys`` 提供解释器自身的信息和运行时开关：``sys.argv`` 是命令行参数，``sys.path`` 是模块搜索路径，``sys.exit()`` 用来带状态码退出程序。写命令行工具时，这几个名字几乎一定会用到。

.. code-block:: python

   import sys

   print("主版本：", sys.version_info.major)
   print("次版本：", sys.version_info.minor)
   print("整数上限：", sys.maxsize)
   print("默认编码：", sys.getdefaultencoding())
   print("浮点精度位数：", sys.float_info.dig)

输出结果：

.. code-block:: text

   主版本： 3
   次版本： 13
   整数上限： 9223372036854775807
   默认编码： utf-8
   浮点精度位数： 15

``sys.version_info`` 是一个具名元组，可以直接按 ``major``、``minor`` 取值，做版本兼容判断时比解析字符串可靠。``sys.maxsize`` 是当前平台上列表、字符串等容器能容纳的最大长度，64 位系统上是 ``2 ** 63 - 1``。``sys.float_info.dig`` 表示双精度浮点能保证的有效十进制位数，也就是常见的 15 位。

四、math：数学函数
------------------

``math`` 面向浮点数，提供三角函数、对数、取整、最大公约数等常用计算。它不处理复数，复数要用 ``cmath``；整数的高精度运算则交给内置的 ``pow()`` 和 ``int``。

.. code-block:: python

   import math

   print("圆周率：", round(math.pi, 6))
   print("平方根：", math.sqrt(2))
   print("斜边：", math.hypot(3, 4))
   print("最大公约数：", math.gcd(48, 18))
   print("向上取整：", math.ceil(3.2), "向下取整：", math.floor(-2.5))
   print("近似相等：", math.isclose(0.1 + 0.2, 0.3))

输出结果：

.. code-block:: text

   圆周率： 3.141593
   平方根： 1.4142135623730951
   斜边： 5.0
   最大公约数： 6
   向上取整： 4 向下取整： -3
   近似相等： True

``math.hypot(3, 4)`` 直接算出直角三角形的斜边，比手写平方和再开方更稳，也不容易溢出。``math.floor(-2.5)`` 得到 ``-3``，方向是向负无穷取整，和内置的 ``round()`` 四舍五入不是一回事。比较两个浮点数是否相等不要用 ``==``，``math.isclose()`` 会按相对误差判断，能避开 ``0.1 + 0.2`` 这类二进制误差。

五、random：伪随机数
--------------------

``random`` 生成的是伪随机数，由内部状态决定，适合抽奖、打乱顺序、模拟数据这类场景。只要在开头调用 ``random.seed()`` 固定种子，同一段程序每次运行的结果就完全一致，这一点在测试和教学里非常重要。涉及密码、令牌时必须改用 ``secrets`` 模块。

.. code-block:: python

   import random

   random.seed(2026)

   words = ["alpha", "beta", "gamma", "delta", "epsilon"]
   random.shuffle(words)
   print("打乱顺序：", words)

   print("随机小数：", random.random())
   print("随机整数：", random.randint(1, 100))
   print("随机选择：", random.choice(["rock", "paper", "scissors"]))
   print("抽样五个：", random.sample(range(1, 50), 5))

输出结果：

.. code-block:: text

   打乱顺序： ['beta', 'epsilon', 'delta', 'gamma', 'alpha']
   随机小数： 0.8841197954362969
   随机整数： 77
   随机选择： scissors
   抽样五个： [36, 27, 37, 47, 32]

``random.random()`` 返回 ``[0.0, 1.0)`` 区间的小数，``randint(a, b)`` 两端的整数都能取到。``random.sample()`` 不放回抽样，结果不会重复；``random.shuffle()`` 就地打乱列表并返回 ``None``，所以不能写 ``words = random.shuffle(words)``。去掉 ``seed()`` 之后每次结果都不同，这正是它不适合做安全随机源的原因。

六、datetime：日期与时间
------------------------

``datetime`` 提供 ``date``、``time``、``datetime``、``timedelta`` 四个核心类型，覆盖日期运算、格式化和解析。两个 ``date`` 相减得到 ``timedelta``，加上 ``timedelta`` 就能得到新日期，闰年、月末天数都由库负责。

.. code-block:: python

   from datetime import date, datetime, timedelta

   today = date(2026, 11, 27)
   print("日期：", today.isoformat())
   print("格式化：", today.strftime("%Y年%m月%d日"))
   print("45 天后：", today + timedelta(days=45))
   print("距元旦：", (date(2027, 1, 1) - today).days, "天")
   print("带时间：", datetime(2026, 11, 27, 9, 30, 15).strftime("%Y-%m-%d %H:%M:%S"))

输出结果：

.. code-block:: text

   日期： 2026-11-27
   格式化： 2026年11月27日
   45 天后： 2027-01-11
   距元旦： 35 天
   带时间： 2026-11-27 09:30:15

``isoformat()`` 输出 ``YYYY-MM-DD``，是日志和接口里最通用的日期写法。``strftime()`` 把日期转成自定义格式的字符串，``strptime()`` 则做反向解析。``date(2026, 11, 27).weekday()`` 返回 0 到 6，周一为 0，所以这天是星期五，值为 4。示例使用固定日期而不是 ``date.today()``，输出才不会随运行时间变化。

七、collections：专用容器
--------------------------

``collections`` 在 list、dict、tuple 之外补充了几种针对性更强的容器：``Counter`` 计数、``defaultdict`` 带默认值的字典、``deque`` 双端队列、``namedtuple`` 带字段名的元组。它们都是标准容器的子类或轻量替代，接口风格保持一致。

.. code-block:: python

   from collections import Counter, defaultdict, deque, namedtuple

   counts = Counter("banana")
   print("计数：", counts)
   print("最常见：", counts.most_common(2))

   letters = defaultdict(int)
   for char in "hello":
       letters[char] += 1
   print("默认字典：", dict(letters))

   queue = deque([1, 2, 3])
   queue.appendleft(0)
   queue.append(4)
   print("双端队列：", list(queue), "左端弹出：", queue.popleft())

   Point = namedtuple("Point", "x y")
   point = Point(3, 4)
   print("命名元组：", point, point.x + point.y)

输出结果：

.. code-block:: text

   计数： Counter({'a': 3, 'n': 2, 'b': 1})
   最常见： [('a', 3), ('n', 2)]
   默认字典： {'h': 1, 'e': 1, 'l': 2, 'o': 1}
   双端队列： [0, 1, 2, 3, 4] 左端弹出： 0
   命名元组： Point(x=3, y=4) 7

``Counter`` 是 dict 的子类，元素作键、次数作值，``most_common(n)`` 按次数降序返回前 n 项，次数相同时保持首次出现的顺序。``defaultdict(int)`` 在访问不存在的键时自动写入 ``0``，省掉了 ``if key not in mapping`` 的判断。``deque`` 从两端增删都是 O(1)，实现队列比列表的 ``pop(0)`` 更高效。``namedtuple`` 生成的类可以用属性访问字段，同时仍然支持下标和解包。

八、itertools：迭代器工具
--------------------------

``itertools`` 里的函数都返回惰性迭代器，只在需要时计算下一个元素，因此可以处理无限序列或超大文件。常见的有 ``count`` 计数、``islice`` 切片、``chain`` 串联、``groupby`` 分组、``combinations`` 组合、``product`` 笛卡尔积、``accumulate`` 累计。

.. code-block:: python

   from itertools import accumulate, chain, combinations, count, groupby, islice, product

   print("无限计数：", list(islice(count(10, 5), 5)))
   print("串联：", list(chain([1, 2], ["a", "b"])))
   print("分组：", [(key, len(list(group))) for key, group in groupby("aabbbcca")])
   print("组合：", list(combinations([1, 2, 3], 2)))
   print("笛卡尔积：", list(product("ab", [1, 2])))
   print("累计求和：", list(accumulate([1, 2, 3, 4])))

输出结果：

.. code-block:: text

   无限计数： [10, 15, 20, 25, 30]
   串联： [1, 2, 'a', 'b']
   分组： [('a', 2), ('b', 3), ('c', 2), ('a', 1)]
   组合： [(1, 2), (1, 3), (2, 3)]
   笛卡尔积： [('a', 1), ('a', 2), ('b', 1), ('b', 2)]
   累计求和： [1, 3, 6, 10]

``count(10, 5)`` 是无限递增序列，必须用 ``islice`` 截断后才能转成列表，否则程序会一直算下去。``groupby`` 只合并相邻的相同元素，输入没有排序时同一分组可能出现多次，示例里的 ``a`` 就出现了两段。``combinations`` 不考虑顺序，``permutations`` 则把顺序也算作不同结果。

九、functools：函数工具
------------------------

``functools`` 面向高阶函数：``reduce`` 把二元函数累积作用到序列上，``partial`` 固定部分参数生成新函数，``lru_cache`` 为纯函数加缓存，``wraps`` 在写装饰器时保留原函数的元信息。

.. code-block:: python

   from functools import lru_cache, partial, reduce

   numbers = [1, 2, 3, 4, 5]
   print("累乘：", reduce(lambda a, b: a * b, numbers))

   add = partial(lambda a, b: a + b, 10)
   print("固定第一个参数：", add(5))

   @lru_cache(maxsize=None)
   def fib(n):
       return n if n < 2 else fib(n - 1) + fib(n - 2)

   print("斐波那契：", fib(20))
   print("缓存信息：", fib.cache_info())

输出结果：

.. code-block:: text

   累乘： 120
   固定第一个参数： 15
   斐波那契： 6765
   缓存信息： CacheInfo(hits=18, misses=21, maxsize=None, currsize=21)

``reduce`` 在没有初始值时会拿序列的前两个元素先算一次，空序列则会抛 ``TypeError``，需要初始值时显式传第三个参数。``partial`` 适合把配置项提前绑定，例如给日志函数固定级别。``lru_cache`` 用参数做键缓存返回值，``cache_info()`` 里的 ``hits`` 是命中次数、``misses`` 是未命中次数，递归计算斐波那契时能把指数级调用降到线性。

十、pathlib：面向对象的路径
----------------------------

``pathlib`` 用 ``Path`` 对象替代字符串拼接路径，``/`` 运算符负责连接各级目录，``.name``、``.suffix``、``.stem``、``.parent`` 直接取路径的组成部分。它比 ``os.path`` 更直观，也是新代码推荐的方式。

.. code-block:: python

   from pathlib import Path

   path = Path("data") / "2026" / "report.csv"
   print("文件名：", path.name)
   print("后缀：", path.suffix, "主干：", path.stem)
   print("分段：", path.parts)
   print("换成 JSON：", path.with_suffix(".json").as_posix())

输出结果：

.. code-block:: text

   文件名： report.csv
   后缀： .csv 主干： report
   分段： ('data', '2026', 'report.csv')
   换成 JSON： data/2026/report.json

``parts`` 把路径拆成元组，不受平台分隔符影响；``as_posix()`` 统一用正斜杠输出，写进配置文件或网址时不会出现反斜杠。``with_suffix()`` 只替换最后一个后缀，``with_name()`` 则替换整个文件名。``Path`` 还提供 ``read_text()``、``write_text()``、``mkdir()``、``glob()`` 等方法，读写小文件时一行就能完成。

十一、logging：日志记录
------------------------

``logging`` 比 ``print`` 更适合正式程序：它按级别过滤、按模块命名、可以同时输出到控制台和文件，还能通过配置统一调整格式。默认情况下日志写到标准错误，示例显式指定 ``stream=sys.stdout``，方便和输出结果对照。

.. code-block:: python

   import logging
   import sys

   logging.basicConfig(
       level=logging.INFO,
       format="%(levelname)s %(name)s: %(message)s",
       stream=sys.stdout,
       force=True,
   )
   logger = logging.getLogger("report")

   logger.info("开始处理 3 条记录")
   logger.warning("第 2 条记录缺少字段，已跳过")
   logger.info("处理完成")

输出结果：

.. code-block:: text

   INFO report: 开始处理 3 条记录
   WARNING report: 第 2 条记录缺少字段，已跳过
   INFO report: 处理完成

``level=logging.INFO`` 表示 INFO 及以上级别才会输出，``debug()`` 的调用会被直接丢弃。``%(name)s`` 取的是 ``getLogger("report")`` 传入的名字，大型项目通常按模块名建 logger，方便单独开关某个模块的日志。``force=True`` 会移除已有处理器再重新配置，避免在交互式环境里重复添加处理器导致一行日志打印多次。

十二、statistics：统计计算
---------------------------

``statistics`` 用纯 Python 实现了均值、中位数、众数、方差、标准差、分位数等常见统计量，输入可以是列表、元组或任何可迭代对象。数据量不大时它足够方便，数据量达到百万级则应换成 NumPy。

.. code-block:: python

   from statistics import mean, median, mode, pstdev, quantiles

   scores = [78, 85, 92, 85, 96, 88, 73, 90]
   print("平均分：", mean(scores))
   print("中位数：", median(scores))
   print("众数：", mode(scores))
   print("总体标准差：", round(pstdev(scores), 3))
   print("四分位数：", quantiles(scores, n=4))

输出结果：

.. code-block:: text

   平均分： 85.875
   中位数： 86.5
   众数： 85
   总体标准差： 6.99
   四分位数： [79.75, 86.5, 91.5]

``mean()`` 返回的结果可能是 ``int`` 也可能是 ``float``，取决于输入；``median()`` 在数据个数为偶数时取中间两个数的平均值，所以 8 个分数得到 ``86.5``。``pstdev()`` 计算总体标准差，分母是 n；``stdev()`` 计算样本标准差，分母是 n - 1，前者适合描述全部数据，后者适合从样本推断总体。``quantiles(data, n=4)`` 返回三个切点，把数据分成四段。

十三、hashlib：消息摘要
------------------------

``hashlib`` 提供 MD5、SHA-1、SHA-256 等哈希算法，用来校验文件完整性、生成内容指纹、给缓存做键。哈希是单向的，不能用来还原原文；MD5 和 SHA-1 已经不适合安全场景，新代码应优先选 SHA-256。

.. code-block:: python

   import hashlib

   text = "Python 标准库"
   data = text.encode("utf-8")

   print("MD5：", hashlib.md5(data).hexdigest())
   print("SHA-256：", hashlib.sha256(data).hexdigest())

   digest = hashlib.sha256()
   digest.update("Python ".encode("utf-8"))
   digest.update("标准库".encode("utf-8"))
   print("分块更新一致：", digest.hexdigest() == hashlib.sha256(data).hexdigest())

输出结果：

.. code-block:: text

   MD5： e411c8ba49be6f63007c9dc896d9e4c1
   SHA-256： e46e881963094d4dca65a0f91c61ca395e6b6972f6effbfb9a016074e986a949
   分块更新一致： True

``hexdigest()`` 返回十六进制字符串，``digest()`` 返回原始字节，写进数据库或 JSON 时用前者更方便。``update()`` 可以分多次喂数据，效果与一次性传入完整内容相同，读取大文件时可以边读边算，不必把整个文件载入内存。密码存储不要直接用一次哈希，标准库提供了 ``hashlib.pbkdf2_hmac()`` 和 ``scrypt()`` 这类带盐、可调迭代次数的函数。

十四、base64：编码转换
-----------------------

``base64`` 把任意字节转换成只含字母、数字和少量符号的文本，常用于在 JSON、邮件、网址中传输二进制数据。它只是编码不是加密，任何人都能还原，而且体积会比原始数据增大约三分之一。

.. code-block:: python

   import base64

   data = "Python 标准库".encode("utf-8")
   encoded = base64.b64encode(data)

   print("编码：", encoded)
   print("解码：", base64.b64decode(encoded).decode("utf-8"))
   print("URL 安全编码：", base64.urlsafe_b64encode(b"\xfb\xff"))

输出结果：

.. code-block:: text

   编码： b'UHl0aG9uIOagh+WHhuW6kw=='
   解码： Python 标准库
   URL 安全编码： b'-_8='

标准 Base64 的字母表里包含 ``+`` 和 ``/``，直接放进 URL 会被转义，``urlsafe_b64encode()`` 把它们换成 ``-`` 和 ``_``。编码前必须把字符串转成字节，编码后得到的是 ``bytes``，打印时会带 ``b''`` 前缀；要还原成文本，先 ``b64decode()`` 再 ``decode()``。

十五、uuid：唯一标识符
-----------------------

``uuid`` 生成 128 位的全局唯一标识符，常用于数据库主键、请求编号、会话标识。模块支持多种生成方式：``uuid1()`` 依赖时间和网卡地址，``uuid4()`` 使用随机数，``uuid5()`` 对命名空间和名字做哈希。示例只解析一个固定的 UUID 字符串，不涉及随机值。

.. code-block:: python

   import uuid

   fixed = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
   print("字符串：", fixed)
   print("十六进制：", fixed.hex)
   print("版本：", fixed.version)
   print("整数：", fixed.int)
   print("URN：", fixed.urn)

输出结果：

.. code-block:: text

   字符串： 6ba7b810-9dad-11d1-80b4-00c04fd430c8
   十六进制： 6ba7b8109dad11d180b400c04fd430c8
   版本： 1
   整数： 143098242404177361603877621312831893704
   URN： urn:uuid:6ba7b810-9dad-11d1-80b4-00c04fd430c8

UUID 的标准写法是 8-4-4-4-12 共 32 个十六进制数字，用连字符分成五段。``hex`` 去掉连字符，``int`` 转成 128 位整数，``urn`` 加上 ``urn:uuid:`` 前缀。示例里的字符串第三段以 ``1`` 开头、第四段以 ``8`` 开头，分别对应版本号和变体位，所以 ``version`` 是 1。需要新 ID 时调用 ``uuid.uuid4()``，它的随机性由操作系统提供，不需要自己播种。

十六、time：时间处理
---------------------

``time`` 是最底层的时间模块，围绕“时间戳”和“时间元组”工作：``time.time()`` 取当前时间戳，``gmtime()``、``localtime()`` 把时间戳转成 ``struct_time``，``strftime()`` 格式化，``strptime()`` 解析。示例只用固定的时间戳，避免输出随运行时刻变化。

.. code-block:: python

   import time

   epoch = time.gmtime(0)
   print("时间元组：", tuple(epoch)[:6])
   print("格式化：", time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(86400)))
   print("可读形式：", time.asctime(epoch))
   parsed = time.strptime("2026-11-27", "%Y-%m-%d")
   print("一年中的第几天：", parsed.tm_yday, "星期：", parsed.tm_wday)

输出结果：

.. code-block:: text

   时间元组： (1970, 1, 1, 0, 0, 0)
   格式化： 1970-01-02 00:00:00
   可读形式： Thu Jan  1 00:00:00 1970
   一年中的第几天： 331 星期： 4

``gmtime()`` 返回 UTC 时间，``localtime()`` 返回本地时间，两者结果都是 ``struct_time``，字段包括年、月、日、时、分、秒、星期、一年中的第几天和夏令时标志。``time.gmtime(0)`` 对应 Unix 纪元 1970 年 1 月 1 日。``strptime()`` 的 ``tm_wday`` 同样以周一为 0。``time.time()`` 和 ``time.perf_counter()`` 每次调用都不同，适合计时，不适合写进需要逐字比对的示例。

十七、常用模块速查表
--------------------

.. csv-table::
   :header: "分类", "模块", "典型用途"

   "操作系统", "``os``、``sys``", "环境变量、目录操作、路径拼接、解释器信息"
   "数学与随机", "``math``、``random``", "取整、开方、三角函数、抽样与打乱"
   "日期时间", "``datetime``、``time``", "日期运算、格式化、时间戳转换"
   "容器扩展", "``collections``", "计数、默认字典、双端队列、命名元组"
   "迭代工具", "``itertools``、``functools``", "无限序列切片、组合、缓存、参数固定"
   "路径处理", "``pathlib``", "面向对象的路径拼接与文件读写"
   "运行支撑", "``logging``", "分级日志、多目标输出、统一格式"
   "数据计算", "``statistics``", "均值、中位数、标准差、分位数"
   "编码摘要", "``hashlib``、``base64``", "完整性校验、内容指纹、二进制转文本"
   "唯一标识", "``uuid``", "生成、解析固定格式的 128 位标识符"

十八、练习任务
--------------

任务：下面是一段简化的访问日志，每条记录包含路径、状态码和耗时。请用标准库统计访问次数最多的路径、列出所有异常请求、计算平均耗时，并把日期、记录数和总耗时拼成一行报表，最后给出报表的 SHA-256 摘要前 16 位。

.. code-block:: python

   import hashlib
   import statistics
   from collections import Counter
   from datetime import date

   records = [
       ("/index", 200, 0.12),
       ("/api/users", 200, 0.35),
       ("/api/users", 500, 0.80),
       ("/index", 200, 0.20),
       ("/login", 404, 0.05),
   ]

   paths = Counter(path for path, status, cost in records)
   print("访问最多的路径：", paths.most_common(1)[0])

   errors = [path for path, status, cost in records if status >= 400]
   print("异常请求：", errors)

   costs = [cost for path, status, cost in records]
   print("平均耗时：", round(statistics.mean(costs), 3), "秒")

   report = f"{date(2026, 11, 27).isoformat()}|{len(records)}|{sum(costs):.2f}"
   print("报表：", report)
   print("摘要：", hashlib.sha256(report.encode("utf-8")).hexdigest()[:16])

输出结果：

.. code-block:: text

   访问最多的路径： ('/index', 2)
   异常请求： ['/api/users', '/login']
   平均耗时： 0.304 秒
   报表： 2026-11-27|5|1.52
   摘要： 490ed4cc75a47629

这段代码把本章的几个模块串在了一起：``Counter`` 负责计数，列表推导式配合条件筛选异常请求，``statistics.mean()`` 算平均耗时，``datetime.date`` 提供固定日期，``hashlib`` 给报表生成摘要。可以试着把 ``records`` 换成自己的数据，或者把摘要长度改成 32 位，观察输出有什么变化。
