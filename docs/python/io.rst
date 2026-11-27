Python 输入输出
===============

.. meta::
   :group: 进阶
   :summary: 掌握 print 的 sep、end、file 参数与 input 读取输入，熟悉 %、format、f-string 三种格式化写法，理解标准流与用 io.StringIO 重定向输出。

程序要和人、和其他程序打交道，靠的就是输入输出。输出最常用的是 ``print()``，输入最常用的是 ``input()``；再往下一层，是每个进程天生就有的三个标准流：标准输入 ``sys.stdin``、标准输出 ``sys.stdout`` 和标准错误 ``sys.stderr``。

这一章先讲清楚 ``print()`` 的三个关键字参数，再看 ``input()`` 如何读取一行文本，然后对比三种把变量拼进字符串的写法，接着用文件演示最基本的读写，最后说明标准流与 ``io.StringIO`` 重定向——它能在不碰终端的情况下捕获程序输出，写测试时非常实用。

一、print 的输出控制
--------------------

``print()`` 的签名里有三个常被忽略的关键字参数：

* ``sep``：多个参数之间的分隔符，默认是一个空格。
* ``end``：输出结束时的追加字符，默认是换行符 ``\n``。
* ``file``：输出目标，默认是 ``sys.stdout``，可以换成任何带 ``write()`` 方法的对象。

把 ``file`` 指向 ``io.StringIO``，输出就不会出现在终端，而是被收集在内存里的字符串缓冲区中：

.. code-block:: python

   import io

   print("2026", "11", "27", sep="-")
   print("2026", "11", "27", sep="")
   print("Python", "文件", "读写", sep=" | ")

   print("读取中", end="")
   print("……完成")
   print("不换行", end=" | ")
   print("接在后面")

   lines = io.StringIO()
   print("第一行日志", file=lines)
   print("第二行日志", file=lines)
   print("缓冲区行数：", len(lines.getvalue().splitlines()))
   print("缓冲区内容：", repr(lines.getvalue()))

输出结果：

.. code-block:: text

   2026-11-27
   20261127
   Python | 文件 | 读写
   读取中……完成
   不换行 | 接在后面
   缓冲区行数： 2
   缓冲区内容： '第一行日志\n第二行日志\n'

``sep`` 只在一次调用传入多个参数时生效，``end`` 则决定这一次调用结束时补什么。``repr()`` 会把换行符显示成 ``\n``，方便确认缓冲区里到底存了什么。

二、用 input() 读取输入
-----------------------

``input()`` 先从标准输入读一行，去掉末尾的换行符，再把这个字符串返回。它有一个可选参数作为提示词，提示词会写到标准输出，且不带换行——所以在终端里，用户的输入正好接在提示词后面：

.. code-block:: python

   name = input("请输入你的名字：")
   print()
   age_text = input("请输入你的年龄：")
   print()

   try:
       age = int(age_text)
   except ValueError:
       print(f"{name}，年龄“{age_text}”不是整数。")
   else:
       print(f"你好，{name}！你今年 {age} 岁，明年 {age + 1} 岁。")

运行后依次输入 ``小明`` 和 ``18``，输出结果为：

.. code-block:: text

   请输入你的名字：
   请输入你的年龄：
   你好，小明！你今年 18 岁，明年 19 岁。

提示词后面紧跟的 ``print()`` 只是为了补一个换行：输入被管道重定向时终端不会回显用户敲下的字符，如果不补换行，两个提示词会挤在同一行。真实终端里看到的则是“请输入你的名字：小明”，输入的内容由终端负责回显。

校验与类型转换
~~~~~~~~~~~~~~

``input()`` 返回的永远是 ``str``，即使输入的是数字。想拿它做算术，必须先转换；转换失败会抛 ``ValueError``，所以要显式捕获。把“解析一行输入”抽成函数，逻辑会更清楚：

.. code-block:: python

   def parse_age(text):
       try:
           return int(text)
       except ValueError:
           return None

   for raw in ["18", "十八", " 20 "]:
       age = parse_age(raw)
       if age is None:
           print(f"“{raw}”无法转换为整数")
       else:
           print(f"“{raw}”转换为 {age} 岁")

输出结果：

.. code-block:: text

   “18”转换为 18 岁
   “十八”无法转换为整数
   “ 20 ”转换为 20 岁

``int()`` 会自动忽略首尾空白，所以 ``" 20 "`` 能正常转换；但它不会接受中文数字，也不会把 ``"18.5"`` 当成整数。需要小数时应该用 ``float()``，需要更严格的格式校验时可以用 ``str.isdigit()`` 先做一次判断。

三、字符串格式化
----------------

把变量嵌入文本有三种写法，它们诞生于不同年代，但都能完成同一件事。了解三种写法有助于读懂旧代码，新代码则统一推荐 f-string。

% 格式化
~~~~~~~~

这是 Python 从 C 语言继承来的写法，用 ``%`` 加占位符，右侧用元组提供数据：

.. code-block:: python

   name = "小明"
   score = 92.5

   print("姓名：%s，分数：%d" % (name, score))
   print("保留一位小数：%.1f" % score)
   print("宽度 6、保留两位：%6.2f" % score)
   print("左对齐 8 格：%-8s|" % name)
   print("百分号字面量：完成 80%")

输出结果：

.. code-block:: text

   姓名：小明，分数：92
   保留一位小数：92.5
   宽度 6、保留两位： 92.50
   左对齐 8 格：小明      |
   百分号字面量：完成 80%

``%d`` 会把浮点数截断成整数，``%6.2f`` 表示总宽度 6、小数点后 2 位，宽度不够时左边补空格。这种写法可读性一般，参数顺序一旦写错很难发现，新代码不建议再用。

str.format
~~~~~~~~~~

``str.format()`` 用花括号占位，支持位置参数、关键字参数和丰富的格式说明符：

.. code-block:: python

   name = "小明"
   score = 92.5

   print("姓名：{}，分数：{}".format(name, score))
   print("保留两位：{:.2f}".format(score))
   print("右对齐 8 格：{:>8.2f}".format(score))
   print("百分比：{:.0%}".format(0.75))
   print("{0} 考了 {1} 分，{0} 很满意".format(name, int(score)))
   print("居中：|{:^9}|".format("Python"))

输出结果：

.. code-block:: text

   姓名：小明，分数：92.5
   保留两位：92.50
   右对齐 8 格：   92.50
   百分比：75%
   小明 考了 92 分，小明 很满意
   居中：| Python  |

花括号里的数字是参数下标，``{0}`` 可以重复出现，把同一个参数用在多处；这也是 ``format`` 比 ``%`` 更好用的地方——不必为了复用而重复传参。居中的 ``{:^9}`` 表示总宽度 9，``Python`` 占 6 个字符，左右各补 1 个和 2 个空格，多出来的那个给了右侧。

f-string
~~~~~~~~

Python 3.6 引入的 f-string 在字符串前加 ``f``，花括号里可以直接写表达式，还能复用同一套格式说明符：

.. code-block:: python

   name = "小明"
   score = 92.5
   rank = 3

   print(f"姓名：{name}，分数：{score:.1f}")
   print(f"{name} 排名第 {rank}，分数 {score:>6.1f}")
   print(f"分数翻倍：{score * 2:.2f}")

   width = 10
   print(f"|{name:^{width}}|")
   print(f"{rank=}")
   print(f"明年是 {2026 + 1} 年")

输出结果：

.. code-block:: text

   姓名：小明，分数：92.5
   小明 排名第 3，分数   92.5
   分数翻倍：185.00
   |    小明    |
   rank=3
   明年是 2027 年

``{rank=}`` 是调试用的简写，会同时输出变量名和值；格式说明符里可以用变量控制宽度，写成 ``{name:^{width}}`` 时 ``width`` 会当作表达式求值。需要留意的是，宽度按字符个数计算，``小明`` 只算 2 个字符，所以补了 8 个空格；而终端里一个汉字占两列，看起来会略偏左，做表格对齐时要按显示宽度另行处理。三种写法的对比如下：

.. csv-table::
   :header: "写法", "示例", "特点"

   "% 格式化", "``'%s：%d' % (name, score)``", "语法古老，只能按位置传参，容易写错顺序"
   "str.format", "``'{}：{}'.format(name, score)``", "支持位置与关键字参数，可读性一般"
   "f-string", "``f'{name}：{score}'``", "直接写表达式，性能最好，推荐使用"

四、读写文件基础
----------------

文件读写的固定流程是：用 ``open()`` 打开，拿到文件对象，读或写，最后 ``close()`` 关闭。关闭不只是释放资源，更重要的是把缓冲区里的数据真正刷到磁盘上：

.. code-block:: python

   import os

   path = "greeting.txt"

   writer = open(path, "w", encoding="utf-8")
   writer.write("第一行：你好，Python\n")
   writer.write("第二行：文件读写很简单\n")
   writer.close()
   print("写入后已关闭：", writer.closed)

   reader = open(path, encoding="utf-8")
   content = reader.read()
   reader.close()

   print("行数：", len(content.splitlines()))
   print("内容：")
   print(content, end="")

   os.remove(path)
   print("清理后文件仍存在：", os.path.exists(path))

输出结果：

.. code-block:: text

   写入后已关闭： True
   行数： 2
   内容：
   第一行：你好，Python
   第二行：文件读写很简单
   清理后文件仍存在： False

``open()`` 的第一个参数是路径，第二个是模式：``w`` 表示写入并清空原内容，省略模式时默认是只读的 ``r``。``encoding="utf-8"`` 建议总是显式写上，否则会使用操作系统的默认编码，同一份代码在不同机器上可能读出乱码。

五、with 语句与上下文管理
-------------------------

手动 ``close()`` 的问题在于：中间一旦抛异常，关闭语句就执行不到。``with`` 语句保证无论代码块正常结束还是异常退出，文件都会被关闭：

.. code-block:: python

   import os

   path = "with_demo.txt"

   with open(path, "w", encoding="utf-8") as handle:
       handle.write("第一行\n第二行\n")
       print("块内已关闭：", handle.closed)

   print("块外已关闭：", handle.closed)

   with open(path, encoding="utf-8") as handle:
       lines = [line.strip() for line in handle]
   print("读取到：", lines)

   try:
       with open(path, encoding="utf-8") as handle:
           raise RuntimeError("模拟处理中途失败")
   except RuntimeError as exc:
       print("捕获异常：", exc)
       print("异常后已关闭：", handle.closed)

   os.remove(path)

输出结果：

.. code-block:: text

   块内已关闭： False
   块外已关闭： True
   读取到： ['第一行', '第二行']
   捕获异常： 模拟处理中途失败
   异常后已关闭： True

``with`` 背后的协议是上下文管理器：进入代码块时调用 ``__enter__()``，退出时调用 ``__exit__()``，后者即使面对异常也一定会执行。``open()`` 返回的文件对象、``threading.Lock``、数据库连接都实现了这套协议。

六、标准输入、标准输出与标准错误
--------------------------------

每个进程启动时都会拿到三个已经打开的文件对象：``sys.stdin`` 负责输入，``sys.stdout`` 负责正常输出，``sys.stderr`` 负责错误信息。``print()`` 默认写 ``stdout``，而解释器的报错信息默认写 ``stderr``——把两者分开，程序输出重定向到文件时，错误仍然能显示在终端上：

.. code-block:: python

   import sys

   print("stdout 可写：", sys.stdout.writable())
   print("stderr 可写：", sys.stderr.writable())
   print("stdin 可读：", sys.stdin.readable())

   sys.stdout.write("直接用 write 写入标准输出\n")
   sys.stdout.flush()

   print("逐行读取标准输入：")
   for number, line in enumerate(sys.stdin, start=1):
       print(number, line.rstrip("\n"))

运行后依次输入 ``小明`` 和 ``18``，每行按一次回车，再按 ``Ctrl + D``（Windows 上为 ``Ctrl + Z`` 后回车）结束输入，输出结果为：

.. code-block:: text

   stdout 可写： True
   stderr 可写： True
   stdin 可读： True
   直接用 write 写入标准输出
   逐行读取标准输入：
   1 小明
   2 18

``sys.stdin`` 可以直接用 ``for`` 逐行遍历，这在处理管道输入时很方便，写法与读文件完全一致。``sys.stdout.write()`` 不会自动补换行，也不做类型转换，只接受字符串；``flush()`` 则强制把缓冲区内容立刻送出。

七、用 io.StringIO 重定向输出
-----------------------------

``io.StringIO`` 是一个“内存文件”：接口和文本文件一样，但数据存在字符串里。配合 ``contextlib.redirect_stdout``，可以把一段代码的所有 ``print`` 收集起来，既用于测试，也用于把结果写进日志或文件：

.. code-block:: python

   import io
   from contextlib import redirect_stdout

   def report(name, score):
       print(f"{name} 的成绩是 {score}")

   buffer = io.StringIO()
   with redirect_stdout(buffer):
       report("小明", 92)
       report("小红", 88)
       print("这段输出不会出现在终端")

   captured = buffer.getvalue()
   print("捕获到", len(captured.splitlines()), "行")
   print(captured, end="")

输出结果：

.. code-block:: text

   捕获到 3 行
   小明 的成绩是 92
   小红 的成绩是 88
   这段输出不会出现在终端

``redirect_stdout`` 只是临时把 ``sys.stdout`` 换成另一个对象，离开 ``with`` 就自动还原成终端。同样的思路可以作用在 ``sys.stderr`` 上，把错误信息也收集起来：

.. code-block:: python

   import io
   import sys
   from contextlib import redirect_stderr

   errors = io.StringIO()

   def check_score(score):
       if 0 <= score <= 100:
           return score
       print(f"分数 {score} 超出 0 到 100 的范围", file=sys.stderr)
       return None

   with redirect_stderr(errors):
       for value in [92, -5, 120]:
           if check_score(value) is None:
               print("记录到一条错误")

   captured = errors.getvalue().strip().splitlines()
   print("错误条数：", len(captured))
   print("错误内容：", captured)

输出结果：

.. code-block:: text

   记录到一条错误
   记录到一条错误
   错误条数： 2
   错误内容： ['分数 -5 超出 0 到 100 的范围', '分数 120 超出 0 到 100 的范围']

注意 ``print(..., file=sys.stderr)`` 必须写成 ``file=sys.stderr``，而不是在 ``redirect_stderr`` 之外提前缓存 ``sys.stderr`` 的引用：重定向替换的是模块属性，提前取出的旧引用仍然指向终端。

练习任务
--------

任务 1：把姓名和分数按 ``姓名,分数`` 的格式写入文件，再读回来统计总分。

.. code-block:: python

   import os

   scores = [("小明", 92), ("小红", 88)]
   path = "scores.txt"

   with open(path, "w", encoding="utf-8") as handle:
       for name, score in scores:
           print(f"{name},{score}", file=handle)

   with open(path, encoding="utf-8") as handle:
       rows = [line.rstrip("\n").split(",") for line in handle]

   print("行数：", len(rows))
   print("第一行姓名：", rows[0][0])
   print("总分：", sum(int(score) for _, score in rows))

   os.remove(path)

输出结果：

.. code-block:: text

   行数： 2
   第一行姓名： 小明
   总分： 180

任务 2：解析形如 ``姓名:分数`` 的记录，遇到无法转换的分数时打印提示并跳过。

.. code-block:: python

   records = ["小明:92", "小红:88", "小刚:缺考"]

   total = 0
   for record in records:
       name, score = record.split(":")
       try:
           total += int(score)
       except ValueError:
           print(f"{name} 的成绩无法解析：{score}")
       else:
           print(f"{name} 考了 {score} 分")

   print("有效总分：", total)

输出结果：

.. code-block:: text

   小明 考了 92 分
   小红 考了 88 分
   小刚 的成绩无法解析：缺考
   有效总分： 180

任务 3：用 ``io.StringIO`` 捕获表格输出，再把捕获到的内容原样写入文件。

.. code-block:: python

   import io
   import os
   from contextlib import redirect_stdout

   def table(rows):
       print("姓名 分数")
       for name, score in rows:
           print(f"{name} {score:>4}")

   buffer = io.StringIO()
   with redirect_stdout(buffer):
       table([("小明", 92), ("小红", 88)])

   path = "report.txt"
   with open(path, "w", encoding="utf-8") as handle:
       handle.write(buffer.getvalue())

   with open(path, encoding="utf-8") as handle:
       print(handle.read(), end="")
   print("写入行数：", len(buffer.getvalue().splitlines()))

   os.remove(path)

输出结果：

.. code-block:: text

   姓名 分数
   小明   92
   小红   88
   写入行数： 3
