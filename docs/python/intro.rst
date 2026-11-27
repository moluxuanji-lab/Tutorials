Python 简介
============

.. meta::
   :group: 入门
   :summary: 认识 Python 的起源、设计哲学与语言特点，了解它的应用领域、Python 2 与 Python 3 的差异以及 CPython、PyPy 等主流实现。

Python 是一门解释型的通用编程语言，由荷兰程序员 Guido van Rossum 于 1989 年圣诞节期间开始设计，1991 年发布第一个公开版本 0.9.0。它诞生于荷兰国家数学与计算机科学研究中心（CWI），最初是作为 ABC 语言的继任者出现的：ABC 语法优雅，但封闭且不易扩展，Guido 希望做一门既好读、又能方便调用 C 代码的语言。

2001 年，Python 软件基金会（PSF）成立，负责管理语言版权与社区事务。此后 Python 进入高速发展期，逐渐成为数据分析、人工智能、自动化运维等领域的首选语言之一。它的名字与蟒蛇无关，来自 Guido 喜爱的英国喜剧团体 Monty Python。

一、Python 的起源
----------------

Python 的演进大致可以分为三个阶段。1991 年到 2000 年是起步期，语法和标准库逐步成型；2000 年发布的 Python 2.0 引入了列表推导式、循环垃圾回收和 Unicode 支持；2008 年发布的 Python 3.0 为了修正历史设计缺陷，选择不向后兼容。2020 年 1 月 1 日，Python 2.7 正式停止维护，社区全面转向 Python 3。

下面用字典记录几个关键版本，并按年份顺序输出：

.. code-block:: python

   milestones = {1991: "0.9.0", 2000: "2.0", 2008: "3.0", 2020: "3.9"}

   for year in sorted(milestones):
       print(f"{year} 年：Python {milestones[year]}")

输出结果：

.. code-block:: text

   1991 年：Python 0.9.0
   2000 年：Python 2.0
   2008 年：Python 3.0
   2020 年：Python 3.9

``sorted()`` 返回按键升序排列的列表，``f-string`` 负责把变量嵌入文本。字典本身在 Python 3.7 之后也保持插入顺序，但排序仍然要显式调用 ``sorted()``，不要依赖书写顺序。

二、设计哲学
------------

Python 的设计原则集中体现在 1999 年 Tim Peters 撰写的 PEP 20（The Zen of Python）中：优美胜于丑陋、明了胜于晦涩、简单胜于复杂、可读性很重要。在解释器里执行 ``import this`` 可以看到完整原文。

这些原则落到语言层面，表现为几条硬性约束：

* **缩进即语法**：用四个空格表示代码块，不再依赖花括号，强制所有人写出结构一致的代码。
* **显式优于隐式**：模块要 ``import``、类型转换要写 ``int()``，不鼓励难以追踪的魔法行为。
* **一种明显做法**：同一个需求尽量只保留一种惯用写法，降低阅读他人代码的成本。
* **错误不该被静默忽略**：异常必须显式捕获，``except`` 分支不允许留空。

四条核心原则可以这样打印出来：

.. code-block:: python

   principles = (
       "优美胜于丑陋",
       "明了胜于晦涩",
       "简单胜于复杂",
       "可读性很重要",
   )

   for index, text in enumerate(principles, start=1):
       print(f"原则 {index}：{text}")

输出结果：

.. code-block:: text

   原则 1：优美胜于丑陋
   原则 2：明了胜于晦涩
   原则 3：简单胜于复杂
   原则 4：可读性很重要

``enumerate()`` 的 ``start`` 参数决定编号从几开始，省略时默认从 0 开始。Python 里绝大多数“带下标的遍历”都应该用它，而不是手动维护一个计数器变量。

三、核心特点
------------

解释型执行
~~~~~~~~~~

Python 源码由解释器逐行读取、编译成字节码再交给虚拟机执行，没有独立的编译链接步骤，也不需要 ``main`` 函数作为入口。文件保存后直接用 ``python 文件名.py`` 就能运行，交互式解释器还支持边写边看结果，试验和调试的反馈周期非常短。

代价是启动和纯 Python 循环都比编译型语言慢。不过在多数业务场景里，真正耗时的部分可以交给 C 扩展处理，例如 NumPy 的矩阵运算底层就是编译好的机器码。

动态类型
~~~~~~~~

Python 的变量只是名字，本身不带类型；类型属于运行时创建的对象。同一个名字可以先指向整数，再指向字符串，最后指向列表：

.. code-block:: python

   value = 42
   print(type(value).__name__)

   value = "Python"
   print(type(value).__name__)

   value = [1, 2, 3]
   print(type(value).__name__, len(value))

输出结果：

.. code-block:: text

   int
   str
   list 3

这种灵活性让代码更短，但类型错误只有在真正执行到那一行时才会暴露：

.. code-block:: python

   try:
       total = 1 + "2"
   except TypeError:
       print("捕获到 TypeError：整数不能直接和字符串相加")

输出结果：

.. code-block:: text

   捕获到 TypeError：整数不能直接和字符串相加

大型项目通常会补充类型注解，并用 ``mypy`` 之类的工具做静态检查，在保留灵活性的同时把这类错误提前到编码阶段。

跨平台与生态
~~~~~~~~~~~~

同一份源码在 Windows、macOS、Linux 上基本可以原样运行，路径分隔符、换行符、进程模型等平台差异由标准库封装。标准库覆盖文件、网络、文本、并发、压缩等常见需求，PyPI 上的第三方包数量已经超过 50 万个，遇到问题时几乎总能找到现成的库。

四、优缺点对比
--------------

Python 的优势和局限，本质上是同一套设计取舍的两面：

.. csv-table::
   :header: "方面", "优势", "局限"

   "语法", "关键字少、强制缩进，可读性高，同样的逻辑行数更少", "缩进即语法，混用空格和制表符容易出错"
   "开发效率", "标准库齐全、第三方包丰富，原型可以很快跑起来", "包质量参差不齐，依赖管理需要额外工具"
   "类型系统", "动态类型加可选类型注解，写起来灵活", "类型错误要到运行时才暴露，大型项目需要静态检查兜底"
   "执行性能", "热点逻辑可以下沉到 C 扩展，NumPy 等库底层是编译代码", "纯 Python 循环比 C、Go、Rust 慢一到两个数量级"
   "并发模型", "``asyncio``、线程、多进程覆盖多种场景", "GIL 限制多线程的 CPU 并行能力"
   "跨平台", "同一份源码可以在 Windows、macOS、Linux 上运行", "涉及系统调用的部分仍需按平台分别处理"
   "部署分发", "源码即程序，虚拟环境可以隔离依赖", "目标机器需要安装解释器，打包成单个可执行文件较麻烦"

标准库齐全带来的直接好处是，几行代码就能完成常见的统计计算：

.. code-block:: python

   from statistics import mean, median

   scores = [92, 85, 78, 96, 88]
   print("平均分：", round(mean(scores), 2))
   print("中位数：", median(scores))
   print("最高分：", max(scores), "最低分：", min(scores))

输出结果：

.. code-block:: text

   平均分： 87.8
   中位数： 88
   最高分： 96 最低分： 78

在需要极致性能的场合，比如高频交易、游戏引擎、超低延迟服务，纯 Python 往往要让位给 C++、Go 或 Rust，常见的折中方案是用 Cython、C 扩展或 Rust 绑定把热点代码下沉，外层仍用 Python 组织业务逻辑。

五、应用领域
------------

* **Web 开发**：Django 提供全套组件，Flask 与 FastAPI 轻量灵活，适合从博客到微服务的各类后端。
* **数据分析**：pandas 处理表格、NumPy 做数值计算、Matplotlib 与 Seaborn 负责可视化。
* **人工智能**：PyTorch、TensorFlow、scikit-learn 覆盖深度学习与传统机器学习。
* **自动化运维**：批量改文件名、调用系统命令、编写定时巡检脚本，都是 Python 的强项。
* **网络爬虫**：requests、httpx 发送请求，BeautifulSoup、lxml 解析页面，Scrapy 组织完整抓取流程。
* **桌面工具**：Tkinter、PyQt、Dear PyGui 可以做出跨平台的图形界面程序。
* **科学计算**：SciPy 提供数值算法，SymPy 做符号推导，Astropy 服务天文计算。
* **嵌入式与教育**：MicroPython 让单片机也能运行 Python，语法简单也使它成为教学首选。

一个文本统计的例子
~~~~~~~~~~~~~~~~~~

统计词频是日常脚本里最常见的任务，标准库的 ``Counter`` 可以直接完成：

.. code-block:: python

   from collections import Counter

   text = "python is simple python is readable readable code wins"
   counts = Counter(text.split())

   for word, count in sorted(counts.items(), key=lambda item: (-item[1], item[0])):
       print(f"{word}: {count}")

输出结果：

.. code-block:: text

   is: 2
   python: 2
   readable: 2
   code: 1
   simple: 1
   wins: 1

排序键 ``(-item[1], item[0])`` 表示先按次数降序、次数相同时按单词升序，这样输出结果不会因为字典内部顺序而改变。``Counter`` 本质上是字典的子类，取值、遍历、合并的用法与普通字典一致。

六、Python 2 与 Python 3 的区别
--------------------------------

Python 3 不是 Python 2 的简单升级，而是一次不兼容的重构，核心目标有三个：把字符串统一为 Unicode、把“返回列表”的函数改成惰性迭代器、清理历史遗留的语法。2020 年 2.7 停止维护之后，新项目不应再使用 Python 2。

主要差异
~~~~~~~~

.. csv-table::
   :header: "主题", "Python 2", "Python 3"

   "输出", "``print`` 是语句，写作 ``print 'hi'``", "``print`` 是函数，必须写作 ``print('hi')``"
   "除法", "``/`` 对两个整数做整除，``7 / 2`` 得 ``3``", "``/`` 总是得到浮点数，整除改用 ``//``"
   "字符串", "``str`` 是字节串，另有 ``unicode`` 类型", "``str`` 就是 Unicode 文本，字节串单独用 ``bytes``"
   "迭代器", "``range()``、``map()``、``dict.keys()`` 返回列表", "这些函数返回惰性迭代器，需要列表时显式转换"
   "异常语法", "``except Exception, e:``", "``except Exception as e:``"
   "输入", "``raw_input()`` 读字符串，``input()`` 会求值", "``input()`` 直接读字符串"

除法与迭代器
~~~~~~~~~~~~

Python 3 的 ``/`` 总是返回浮点数，想得到整数商要用 ``//``；``map()``、``filter()``、``zip()``、``range()`` 以及字典的 ``keys()``、``values()`` 都返回迭代器，需要列表时显式套一层 ``list()``：

.. code-block:: python

   print("7 / 2 =", 7 / 2)
   print("7 // 2 =", 7 // 2)
   print("2 ** 10 =", 2 ** 10)

   letters = map(str.upper, ["python", "three"])
   print(list(letters))

输出结果：

.. code-block:: text

   7 / 2 = 3.5
   7 // 2 = 3
   2 ** 10 = 1024
   ['PYTHON', 'THREE']

惰性迭代器的好处是省内存：处理大文件时不必先把所有结果塞进列表，``for`` 循环会边取边算。

字符串与字节
~~~~~~~~~~~~

Python 2 的 ``str`` 实际是字节串，处理中文要先 ``decode`` 再操作；Python 3 的 ``str`` 就是 Unicode 文本，字节串单独用 ``bytes`` 表示，两者通过 ``encode()`` 与 ``decode()`` 转换：

.. code-block:: python

   text = "中文"
   print("字符数：", len(text))
   print("第一个字符：", text[0])

   data = text.encode("utf-8")
   print("UTF-8 字节数：", len(data))
   print("解码结果：", data.decode("utf-8"))

输出结果：

.. code-block:: text

   字符数： 2
   第一个字符： 中
   UTF-8 字节数： 6
   解码结果： 中文

两个常用汉字在 UTF-8 下各占 3 个字节，所以字符数是 2、字节数是 6。读写文件时如果不确定编码，显式传入 ``encoding="utf-8"`` 比依赖系统默认值更可靠。

七、主流实现
------------

Python 是一门语言规范，CPython 只是它最流行的一种实现：

* **CPython**：官方参考实现，用 C 编写，从 python.org 下载安装的就是它。生态兼容性最好，绝大多数第三方包以它为基准测试。
* **PyPy**：用 RPython 编写的实现，自带 JIT 即时编译，长时间运行的纯 Python 计算通常比 CPython 快数倍，但部分 C 扩展兼容性略差。
* **Jython**：运行在 JVM 上，可以直接调用 Java 类库，目前仍停留在 Python 2.7 语法。
* **IronPython**：面向 .NET 平台，能与 C# 代码互相调用。
* **MicroPython**：为单片机和微控制器裁剪的版本，常见于 ESP32、树莓派 Pico 等开发板。
* **GraalPy**：基于 GraalVM 的实现，可以编译成原生程序，也能与 Java、JavaScript 互操作。

所有实现遵循同一套语言规范，因此同一段纯 Python 代码在不同实现上的行为应当一致。比如浮点数的二进制误差，在任何实现里都存在，需要精确十进制运算时要改用 ``decimal`` 模块：

.. code-block:: python

   from decimal import Decimal

   print("浮点数：", 0.1 + 0.2)
   print("Decimal：", Decimal("0.1") + Decimal("0.2"))
   print("保留两位：", round(Decimal("0.1") + Decimal("0.2"), 2))

输出结果：

.. code-block:: text

   浮点数： 0.30000000000000004
   Decimal： 0.3
   保留两位： 0.30

``Decimal`` 必须用字符串构造，写成 ``Decimal(0.1)`` 会把浮点数的误差原样带进来。金额、税率这类不能有舍入偏差的场景，应该优先使用它，而不是 ``float``。

八、练习任务
------------

任务 1：判断回文。写一个函数，忽略大小写和空格后，判断字符串正着读与反着读是否相同。

.. code-block:: python

   def is_palindrome(text):
       cleaned = text.lower().replace(" ", "")
       return cleaned == cleaned[::-1]

   for word in ["Level", "Python", "上海自来水来自海上"]:
       print(word, is_palindrome(word))

输出结果：

.. code-block:: text

   Level True
   Python False
   上海自来水来自海上 True

任务 2：温度转换。把摄氏温度列表逐项转换成华氏温度，结果保留一位小数。

.. code-block:: python

   celsius = [-40, 0, 37, 100]

   for value in celsius:
       fahrenheit = value * 9 / 5 + 32
       print(f"{value} 摄氏度 = {fahrenheit:.1f} 华氏度")

输出结果：

.. code-block:: text

   -40 摄氏度 = -40.0 华氏度
   0 摄氏度 = 32.0 华氏度
   37 摄氏度 = 98.6 华氏度
   100 摄氏度 = 212.0 华氏度

任务 3：安全除法。捕获除零异常并打印提示，让程序在出错后仍能正常结束。

.. code-block:: python

   def safe_divide(a, b):
       try:
           return a / b
       except ZeroDivisionError:
           return None

   for a, b in [(10, 2), (3, 0)]:
       result = safe_divide(a, b)
       if result is None:
           print(f"{a} / {b}：除数不能为 0")
       else:
           print(f"{a} / {b} = {result}")

输出结果：

.. code-block:: text

   10 / 2 = 5.0
   3 / 0：除数不能为 0
