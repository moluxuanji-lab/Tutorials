Python 注释
===========

.. meta::
   :group: 入门
   :summary: 掌握 Python 单行注释、多行注释与文档字符串的写法，理解注释与字符串的区别，遵循 PEP 8 注释规范，并用 Docstring 为函数和类补充可检索的说明。

注释是写给读代码的人看的说明，解释器会完全忽略它。写注释的目的不是复述代码“做了什么”，而是说明“为什么这样做”、参数的含义、边界条件和暂时不能改动的理由。Python 的注释分为单行注释、多行注释和文档字符串三类，它们的用途并不相同。

一、为什么需要注释
------------------

一段代码写完后，最先忘记细节的往往是作者自己。几个月后再看，变量名只能表达“是什么”，表达不了当时的取舍：为什么这里要加锁、为什么这个分支不能删、为什么接口返回的字段名如此奇怪。注释就是把这些背景留在代码旁边。

好的注释通常回答下面几类问题：

* **为什么**：选择这种实现的原因、被否决的方案、性能或兼容性约束。
* **做什么**：函数、类、模块对外承诺的行为，参数与返回值的含义。
* **注意什么**：边界条件、异常情况、线程安全、平台差异。
* **待办什么**：``TODO``、``FIXME``、``XXX`` 标记的遗留问题。

不需要注释的情况同样常见：变量名已经足够清楚、代码本身一眼能看懂、注释与代码重复。维护一份过时的注释，比没有注释更危险，因为读者会相信它。

二、单行注释
------------

单行注释以 ``#`` 开头，从 ``#`` 到行尾的内容都会被忽略。``#`` 可以独占一行，也可以跟在代码后面：

.. code-block:: python

   # 计算圆的面积
   radius = 3
   area = 3.14159 * radius ** 2  # 行内注释：先算平方，再乘圆周率
   print("面积：", round(area, 2))

输出结果：

.. code-block:: text

   面积： 28.27

行内注释与代码之间至少留两个空格，这是 PEP 8 的建议。被注释掉的代码同样以 ``#`` 开头，但要谨慎保留：长期留在仓库里的“死代码”会干扰阅读，需要时应当直接删除，历史记录交给版本控制。

.. code-block:: python

   price = 99
   # price = 199  # 这一行被注释掉，不会执行
   print("价格：", price)

输出结果：

.. code-block:: text

   价格： 99

三、多行注释
------------

Python 没有专门的多行注释语法。习惯上把一段三引号字符串单独放在代码中，不赋值给任何变量，解释器会把它当作字符串表达式求值，然后立即丢弃。由于没有副作用，看起来就像多行注释：

.. code-block:: python

   """
   这是多行注释的常见写法。
   Python 会把它当作字符串表达式，
   求值后立刻丢弃，不影响程序。
   """
   print("程序继续执行")

输出结果：

.. code-block:: text

   程序继续执行

三个单引号和三个双引号都可以，但同一个项目里应当统一。要注意它的本质仍是字符串：一旦赋值给变量，内容就会被保留，不再具有“注释”的效果。

.. code-block:: python

   text = """这段字符串会被保留，
   因为它赋值给了变量 text。"""
   print(text)

输出结果：

.. code-block:: text

   这段字符串会被保留，
   因为它赋值给了变量 text。

正因如此，多行字符串“注释”会在内存中创建一个字符串对象。对性能敏感的代码，或者需要长期维护的模块，仍建议使用 ``#`` 逐行注释，意图更明确，也不会产生额外的对象。

四、Docstring 文档字符串
------------------------

写在模块、函数、类或方法第一条语句位置的三引号字符串，称为文档字符串（Docstring）。它不是普通注释，而是对象的元数据：解释器会把它保存到 ``__doc__`` 属性，``help()``、``inspect`` 和各类文档工具都会读取它。

.. code-block:: python

   def add(a, b):
       """返回两个数的和。"""
       return a + b

   print(add.__doc__)
   print("计算结果：", add(2, 3))

输出结果：

.. code-block:: text

   返回两个数的和。
   计算结果： 5

Docstring 必须放在函数体的第一行。如果前面先写了别的语句，字符串就只是普通表达式，``__doc__`` 会变成 ``None``：

.. code-block:: python

   def bad():
       value = 1
       """这段文字不会成为文档字符串。"""
       return value

   print("bad 的文档：", bad.__doc__)

输出结果：

.. code-block:: text

   bad 的文档： None

多行 Docstring 通常第一行写一句摘要，空一行，再写参数、返回值和异常。标准库提供了 ``inspect.getdoc()``，它会自动清理公共缩进，比直接读 ``__doc__`` 更适合展示：

.. code-block:: python

   import inspect

   def divide(a, b):
       """返回 a 除以 b 的结果。

       参数:
           a: 被除数
           b: 除数，不能为 0
       """
       return a / b

   print(inspect.getdoc(divide))
   print("与原文档一致：", divide.__doc__ == inspect.getdoc(divide))

输出结果：

.. code-block:: text

   返回 a 除以 b 的结果。

   参数:
       a: 被除数
       b: 除数，不能为 0
   与原文档一致： False

``__doc__`` 保留了源码里的缩进和首尾换行，``inspect.getdoc()`` 则做了清理，所以两者并不相等。

类和方法也可以写 Docstring：

.. code-block:: python

   class Circle:
       """表示一个圆。"""

       def __init__(self, radius):
           """用半径初始化圆。"""
           self.radius = radius

       def area(self):
           """返回圆的面积。"""
           return 3.14159 * self.radius ** 2

   print(Circle.__doc__)
   print(Circle.area.__doc__)
   print("面积：", round(Circle(2).area(), 2))

输出结果：

.. code-block:: text

   表示一个圆。
   返回圆的面积。
   面积： 12.57

常用的 Docstring 风格有三种：Google 风格用 ``Args:``、``Returns:`` 分节；Sphinx/reST 风格用 ``:param name:`` 这样的字段；NumPy 风格用下划线分隔参数区。团队内部选择一种并保持一致即可，混用会让文档工具难以解析。

五、注释规范与常见标记
----------------------

PEP 8 对注释提出了几条简单要求：注释要与代码同步更新；注释应当完整句子，首字母大写；块注释每行以 ``#`` 加一个空格开头；行内注释与代码间隔至少两个空格。中文注释不必强行加英文句号，但同一篇文章里要保持统一。

工程中常用几个固定标记，方便搜索和后续处理：

.. code-block:: python

   # TODO: 下个版本支持分页
   # FIXME: 并发写入时可能丢失数据
   # NOTE: 这里的顺序不能调整，依赖字典插入顺序
   tasks = ["分页", "并发修复", "顺序校验"]
   print("待处理：", len(tasks), "项")

输出结果：

.. code-block:: text

   待处理： 3 项

``TODO`` 表示计划完成的功能，``FIXME`` 表示已知缺陷，``XXX`` 或 ``NOTE`` 用来提醒后来者注意某段实现。很多编辑器会高亮这些关键字，代码审查时也能快速定位。

六、多行“注释”不能嵌套
----------------------

三引号字符串不能嵌套同种引号。外层用三个双引号时，内层再出现三个双引号就会提前结束字符串，后面的内容被当成代码，通常直接引发语法错误：

.. code-block:: text

   """
   外层注释开始
   """
   内层三个双引号会提前结束字符串
   """
   """

正确做法是在外层多行字符串里使用 ``#`` 单行注释，或者把内层引号改成不同种类：

.. code-block:: python

   """
   外层注释开始
   # 这是内部的单行注释，可以安全嵌套
   """
   print("嵌套写法正确")

输出结果：

.. code-block:: text

   嵌套写法正确

七、注释、字符串与文档字符串的取舍
----------------------------------

三种写法各有适用场景，混用会造成误解：

.. csv-table::
   :header: "写法", "是否产生对象", "典型用途"

   "``# 注释``", "否", "解释实现细节、标记待办、临时禁用代码"
   "三引号字符串", "是，求值后丢弃", "大段说明、模块顶部的说明文字"
   "Docstring", "是，保存在 ``__doc__``", "函数、类、模块的对外文档"

判断标准很简单：需要被 ``help()``、IDE 或文档生成器读取的内容，写成 Docstring；只给人看的实现说明，用 ``#``；大段暂时不执行的代码，优先删除而不是注释掉。

八、练习任务
------------

任务 1：为下面的函数补一条 Docstring，说明参数含义与返回值，然后用 ``__doc__`` 打印出来。

.. code-block:: python

   def normalize(text):
       """去掉首尾空格并转为小写。"""
       return text.strip().lower()

   print(normalize.__doc__)
   print(normalize("  Hello Python  "))

输出结果：

.. code-block:: text

   去掉首尾空格并转为小写。
   hello python

任务 2：下面这段代码没有注释。为关键步骤补充行内注释，说明每一步的目的，而不是重复语句本身。

.. code-block:: python

   scores = [88, 92, 79, 95, 92]
   unique = sorted(set(scores), reverse=True)  # 去重后按分数从高到低排列
   average = sum(scores) / len(scores)  # 总分除以人数得到平均分
   print("去重排序：", unique)
   print("平均分：", round(average, 1))

输出结果：

.. code-block:: text

   去重排序： [95, 92, 88, 79]
   平均分： 89.2

任务 3：写一个函数 ``parse_port``，用 Docstring 说明它对非法端口的处理，并用 ``#`` 注释标出一个 ``TODO``：未来支持从环境变量读取默认端口。

.. code-block:: python

   def parse_port(text, default=8000):
       """把字符串解析成端口号。

       参数:
           text: 端口字符串，空字符串返回默认值
           default: 默认端口
       返回:
           0 到 65535 之间的整数
       异常:
           ValueError: 内容不是整数或超出范围
       """
       # TODO: 支持从环境变量 PORT 读取默认值
       if not text.strip():
           return default

       port = int(text)
       if not 0 <= port <= 65535:
           raise ValueError("端口必须在 0 到 65535 之间")
       return port

   print(parse_port("8080"))
   print(parse_port("  "))
   try:
       parse_port("70000")
   except ValueError as exc:
       print("捕获异常：", exc)

输出结果：

.. code-block:: text

   8080
   8000
   捕获异常： 端口必须在 0 到 65535 之间

注释写得清楚，代码才能真正“自解释”。下一章进入运算符，开始接触表达式与优先级。