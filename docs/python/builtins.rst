Python 内置函数
================

.. meta::
   :group: 标准库与实战
   :summary: 按类型、数学、迭代、对象、字符串和其他六组梳理常用内置函数，掌握类型转换、数值计算、迭代器操作、属性读写与格式化输出的用法。

内置函数是 Python 解释器启动时就准备好的函数，不需要写 ``import`` 就能直接调用。它们由 ``builtins`` 模块提供，解释器会把其中的名字自动注入每个模块的全局命名空间，所以 ``len()``、``range()``、``print()`` 在任何文件里都可用。

内置函数大多用 C 实现，执行效率比同等的 Python 代码高，也是大量标准库和第三方库的底层基础。官方文档的“内置函数”一章按字母顺序列出了全部名字，数量有一百多个，但日常写代码真正高频的只有几十个，按用途分组记忆会轻松很多。

一、内置函数总览
----------------

按用途可以把常用内置函数分成六组：

* **类型构造**：``int``、``float``、``complex``、``str``、``bool``、``list``、``tuple``、``dict``、``set``、``bytes``。
* **数学计算**：``abs``、``round``、``pow``、``divmod``、``sum``、``min``、``max``。
* **迭代处理**：``range``、``enumerate``、``zip``、``map``、``filter``、``sorted``、``reversed``、``iter``、``next``、``any``、``all``。
* **对象操作**：``type``、``isinstance``、``hasattr``、``getattr``、``setattr``、``delattr``、``callable``。
* **文本处理**：``repr``、``format``、``chr``、``ord``、``hex``、``oct``、``bin``。
* **其他**：``len``、``open``、``print``、``input``。

内置函数的名字同时也是普通标识符，一旦被变量覆盖，原来的函数就再也找不到。例如写了 ``list = [1, 2, 3]``，后面的 ``list("abc")`` 就会报 ``TypeError``。变量命名时应避开这些名字，常见的坑还有 ``str``、``dict``、``sum``、``id``。

二、类型转换
------------

``int``、``float``、``str`` 这些名字本质上都是类型对象，调用它们就是用目标类型构造一个新值。转换规则由类型自己定义：``int()`` 可以解析字符串并指定进制，``float()`` 接受数字字符串，``bool()`` 按真假规则返回 ``True`` 或 ``False``。

.. code-block:: python

   print("整数：", int("42"), int(3.9), int("2a", 16))
   print("浮点：", float("3.5"), float(7))
   print("文本：", str(2026), repr("py"))
   print("布尔：", bool(0), bool(""), bool([1]))
   print("容器：", list("abc"), tuple([1, 2]), dict([("a", 1)]))
   print("集合：", sorted(set([3, 1, 3, 2])))
   print("其他：", complex(1, 2), bytes("hi", "utf-8"))

   try:
       int("abc")
   except ValueError as error:
       print("转换失败：", error)

输出结果：

.. code-block:: text

   整数： 42 3 42
   浮点： 3.5 7.0
   文本： 2026 'py'
   布尔： False False True
   容器： ['a', 'b', 'c'] (1, 2) {'a': 1}
   集合： [1, 2, 3]
   其他： (1+2j) b'hi'
   转换失败： invalid literal for int() with base 10: 'abc'

``int(3.9)`` 直接截断小数部分得到 ``3``，不会四舍五入；``int("2a", 16)`` 把十六进制字符串按基数 16 解析，结果是十进制的 ``42``。``bool()`` 对 ``0``、空字符串、空列表、``None`` 都返回 ``False``，其余为 ``True``。``dict()`` 接受 ``(键, 值)`` 形式的序列，``set()`` 会去重且不保证顺序，所以示例先用 ``sorted()`` 排序再打印。无法解析的字符串会抛 ``ValueError``，实际脚本里应当捕获并给出提示。

三、数学计算
------------

``abs()`` 取绝对值，``round()`` 做舍入，``pow()`` 求幂，``divmod()`` 一次拿到商和余数。它们既接受整数也接受浮点数，``pow()`` 还支持第三个参数，用来计算模幂。

.. code-block:: python

   print("绝对值：", abs(-7), abs(-3.5))
   print("四舍五入：", round(2.675, 2), round(2.5), round(3.5))
   print("幂运算：", pow(2, 10), pow(2, 10, 1000))
   print("商与余数：", divmod(17, 5), divmod(-17, 5))

输出结果：

.. code-block:: text

   绝对值： 7 3.5
   四舍五入： 2.67 2 4
   幂运算： 1024 24
   商与余数： (3, 2) (-4, 3)

``round()`` 采用“银行家舍入”，遇到正好一半时向偶数靠拢，所以 ``round(2.5)`` 是 ``2``、``round(3.5)`` 是 ``4``。``round(2.675, 2)`` 得到 ``2.67`` 而不是 ``2.68``，原因是 2.675 在二进制里并不精确，这一点在金额计算中要特别小心。``pow(2, 10, 1000)`` 等价于 ``2 ** 10 % 1000``，但中间结果不会膨胀，适合大数取模。``divmod(-17, 5)`` 得到 ``(-4, 3)``，因为 Python 的整除向下取整，余数始终与除数同号。

四、聚合计算
------------

``sum()`` 对可迭代对象求和，``min()``、``max()`` 找最小值和最大值。后两个都支持 ``key`` 参数和 ``default`` 参数，可以在空序列上给出兜底值，也可以按自定义规则比较。

.. code-block:: python

   scores = [78, 85, 92, 66]
   print("总分：", sum(scores))
   print("带起点：", sum(scores, 100))
   print("平方和：", sum(n * n for n in scores))
   print("最低：", min(scores), "最高：", max(scores))
   print("最短单词：", min(["python", "go", "rust"], key=len))
   print("空列表默认值：", max([], default="无数据"))

输出结果：

.. code-block:: text

   总分： 321
   带起点： 421
   平方和： 26129
   最低： 66 最高： 92
   最短单词： go
   空列表默认值： 无数据

``sum()`` 的第二个参数是起始值，默认是 ``0``，所以 ``sum(scores, 100)`` 会在总分上再加 100。它只适合数值，拼接字符串要用 ``"".join(parts)``，直接对字符串调用 ``sum()`` 会抛 ``TypeError``。``min()``、``max()`` 的 ``key`` 接受一个函数，比较的是函数返回值，但返回的仍是原元素，所以按长度比较得到的是单词 ``go`` 本身。对空序列直接调用 ``max()`` 会抛 ``ValueError``，加上 ``default`` 就能避免。

五、范围与配对
--------------

``range()`` 生成等差整数序列，``enumerate()`` 在遍历时附带下标，``zip()`` 把多个可迭代对象按位置配对。三者都返回惰性对象，需要列表时显式套一层 ``list()``。

.. code-block:: python

   print("范围：", list(range(1, 10, 3)))
   print("长度：", len(range(0, 10, 2)), "包含 7：", 7 in range(0, 10, 2))

   for index, name in enumerate(["apple", "banana"], start=1):
       print(index, name)

   names = ["小明", "小红"]
   scores = [92, 88]
   for name, score in zip(names, scores):
       print(f"{name}: {score}")

输出结果：

.. code-block:: text

   范围： [1, 4, 7]
   长度： 5 包含 7： False
   1 apple
   2 banana
   小明: 92
   小红: 88

``range(start, stop, step)`` 包含起点、不包含终点，步长为正时递增，为负时递减；``range`` 对象很省内存，判断成员是否存在是 O(1)，不需要真的生成整个序列。``enumerate()`` 的 ``start`` 决定编号起点，省略时从 0 开始，比手动维护计数器清晰。``zip()`` 以最短的输入为准，多出来的元素会被丢弃；Python 3.10 起可以传 ``strict=True``，长度不一致时直接抛 ``ValueError``。

六、映射与排序
--------------

``map()`` 把函数应用到每个元素，``filter()`` 保留使函数返回真的元素，``sorted()`` 返回排好序的新列表，``reversed()`` 反向遍历序列。前两个返回迭代器，后两个返回列表或反向迭代器。

.. code-block:: python

   words = ["Python", "go", "Rust", "c"]
   print("映射：", list(map(str.lower, words)))
   print("过滤：", list(filter(lambda word: len(word) > 2, words)))
   print("排序：", sorted(words, key=str.lower))
   print("按长度：", sorted(words, key=len, reverse=True))
   print("反转：", list(reversed(words)))

输出结果：

.. code-block:: text

   映射： ['python', 'go', 'rust', 'c']
   过滤： ['Python', 'Rust']
   排序： ['c', 'go', 'Python', 'Rust']
   按长度： ['Python', 'Rust', 'go', 'c']
   反转： ['c', 'Rust', 'go', 'Python']

``sorted()`` 不改动原列表，``list.sort()`` 才是就地排序并返回 ``None``。``key=str.lower`` 让排序忽略大小写，否则大写字母会排在小写字母前面。``sorted(words, key=len, reverse=True)`` 先按长度降序排列，长度相同时保持原有相对顺序，这是排序算法稳定性的体现。``reversed()`` 要求对象支持下标或实现了 ``__reversed__``，对生成器这类一次性迭代器不起作用。

七、迭代器与判断
----------------

``iter()`` 从可迭代对象取出迭代器，``next()`` 逐个取值，取完后抛 ``StopIteration``。``any()`` 和 ``all()`` 对可迭代对象做真假判断，两者都会短路，找到结论就立即停止。

.. code-block:: python

   numbers = iter([10, 20, 30])
   print(next(numbers), next(numbers))
   print("剩余：", list(numbers))

   try:
       next(numbers)
   except StopIteration:
       print("迭代结束：StopIteration")

   print("任一为真：", any([0, "", 3]))
   print("全部为真：", all([1, "a", [0]]))
   print("带默认值：", next(iter([]), "空"))

输出结果：

.. code-block:: text

   10 20
   剩余： [30]
   迭代结束：StopIteration
   任一为真： True
   全部为真： True
   带默认值： 空

``next()`` 可以传第二个参数作为耗尽时的默认值，避免写 ``try`` 语句。``any()`` 遇到第一个真值就返回 ``True``，``all()`` 遇到第一个假值就返回 ``False``，所以传给它们的生成器不一定会被完整消费。空序列上 ``any()`` 返回 ``False``、``all()`` 返回 ``True``，这是数学上“存在”与“任意”的定义。注意 ``[0]`` 是非空列表，本身为真，所以 ``all([1, "a", [0]])`` 仍然是 ``True``。

八、类型判断
------------

``type()`` 返回对象的精确类型，``isinstance()`` 判断对象是否属于某个类型，并且会把子类计算在内。做类型分支时优先用 ``isinstance()``，需要严格相等时才用 ``type()``。

.. code-block:: python

   print("类型名：", type(42).__name__, type("py").__name__, type([]).__name__)
   print("type 比较：", type(True) is int, type(True) is bool)
   print("isinstance：", isinstance(True, int), isinstance(True, bool))
   print("多类型判断：", isinstance(3.5, (int, float)), isinstance("3.5", (int, float)))

输出结果：

.. code-block:: text

   类型名： int str list
   type 比较： False True
   isinstance： True True
   多类型判断： True False

``bool`` 是 ``int`` 的子类，所以 ``isinstance(True, int)`` 为 ``True``，而 ``type(True) is int`` 为 ``False``。``isinstance()`` 的第二个参数可以是类型元组，任意一个匹配就返回 ``True``，写参数校验时很方便。``type()`` 返回的类型对象带 ``__name__`` 属性，打印类型名比打印整个 ``<class 'int'>`` 更简洁。

九、属性操作
------------

``hasattr()`` 判断属性是否存在，``getattr()`` 读取属性，``setattr()`` 设置属性，``delattr()`` 删除属性。它们让程序可以在运行时按字符串名字操作对象，是实现插件、配置映射的常用手段。``callable()`` 判断对象能否像函数一样加括号调用。

.. code-block:: python

   class Config:
       pass

   config = Config()
   setattr(config, "debug", True)
   print("是否存在：", hasattr(config, "debug"))
   print("读取属性：", getattr(config, "debug"))
   print("默认值：", getattr(config, "timeout", 30))
   delattr(config, "debug")
   print("删除之后：", hasattr(config, "debug"))
   print("可调用：", callable(len), callable(config))

输出结果：

.. code-block:: text

   是否存在： True
   读取属性： True
   默认值： 30
   删除之后： False
   可调用： True False

``getattr()`` 的第三个参数是属性不存在时的默认值，不传则抛 ``AttributeError``。``setattr()`` 和 ``delattr()`` 只能操作已经存在或允许动态添加属性的对象，内置类型如 ``list`` 不允许这样改。``callable()`` 对函数、方法、类、实现了 ``__call__`` 的实例都返回 ``True``，普通实例返回 ``False``；它只判断“能不能调用”，不保证调用一定成功。

十、字符串表示
--------------

``repr()`` 返回面向开发者的字面表示，字符串会带引号、换行会写成 ``\n``；``str()`` 返回面向用户的易读文本。``format()`` 按格式说明符把值转成字符串，f-string 的花括号内部调用的就是同一套规则。

.. code-block:: python

   print("repr 字符串：", repr("line1\nline2"))
   print("str 与 repr：", str("py"), repr("py"))
   print("保留两位：", format(3.14159, ".2f"))
   print("十六进制：", format(255, "x"), format(255, "#06x"))
   print("百分比：", format(0.256, ".1%"))
   print("右对齐：", format("py", ">6"), "|")

输出结果：

.. code-block:: text

   repr 字符串： 'line1\nline2'
   str 与 repr： py 'py'
   保留两位： 3.14
   十六进制： ff 0x00ff
   百分比： 25.6%
   右对齐：     py |

``repr()`` 的输出原则上应当能重新作为 Python 字面量求值，所以字符串带引号、特殊字符被转义，调试容器时特别有用。``format(255, "#06x")`` 中 ``#`` 要求带 ``0x`` 前缀，``06`` 表示总宽度 6、不足补零，结果是 ``0x00ff``。``.1%`` 先把数字乘 100 再加上百分号。``>6`` 表示右对齐、宽度 6，``<`` 和 ``^`` 分别是左对齐和居中。

十一、字符与进制
----------------

``ord()`` 把单个字符转成 Unicode 码位，``chr()`` 做反向转换。``hex()``、``oct()``、``bin()`` 把整数转成带前缀的十六进制、八进制和二进制字符串。它们处理的是字符与数字之间的映射，和编码解码不是一回事。

.. code-block:: python

   print("字符编码：", ord("A"), ord("中"))
   print("编码转字符：", chr(65), chr(0x4E2D))
   print("进制转换：", hex(255), oct(8), bin(10))
   print("二进制中 1 的个数：", bin(10).count("1"))

输出结果：

.. code-block:: text

   字符编码： 65 20013
   编码转字符： A 中
   进制转换： 0xff 0o10 0b1010
   二进制中 1 的个数： 2

``ord()`` 只接受长度为 1 的字符串，传多个字符会抛 ``TypeError``。汉字“中”的 Unicode 码位是 ``0x4E2D``，也就是十进制的 20013，和 UTF-8 编码后的三个字节不是同一个概念。``hex()`` 等函数返回的字符串带 ``0x``、``0o``、``0b`` 前缀，想要不带前缀的写法可以用 ``format(255, "x")``。``bin(10)`` 得到 ``0b1010``，数一数其中的 ``1`` 就能知道二进制里有多少个置位。

十二、长度与文件
----------------

``len()`` 返回容器或序列的长度，``open()`` 打开文件并返回文件对象。``open()`` 通常配合 ``with`` 语句使用，代码块结束时自动关闭文件，即使中途抛出异常也不会泄漏句柄。

.. code-block:: python

   import os

   print("长度：", len("Python"), len([1, 2, 3]), len({"a": 1}))

   with open("demo.txt", "w", encoding="utf-8") as file:
       file.write("第一行\n第二行\n")

   with open("demo.txt", encoding="utf-8") as file:
       lines = file.readlines()

   print("行数：", len(lines))
   for index, line in enumerate(lines, start=1):
       print(index, line.strip())

   os.remove("demo.txt")

输出结果：

.. code-block:: text

   长度： 6 3 1
   行数： 2
   1 第一行
   2 第二行

``len()`` 对字符串返回字符数，对列表返回元素个数，对字典返回键值对数量，自定义类实现 ``__len__`` 后也能被它识别。``open()`` 的 ``encoding`` 参数建议显式写成 ``utf-8``，否则会依赖系统默认编码，在 Windows 和 Linux 之间搬代码时容易出现乱码。``readlines()`` 保留每行末尾的换行符，打印前用 ``strip()`` 去掉，示例最后删除临时文件，保证代码块可以重复运行。

十三、内置函数速查表
--------------------

.. csv-table::
   :header: "分类", "函数", "用途"

   "类型转换", "``int``、``float``、``str``、``bool``", "在数值、文本与布尔之间转换"
   "容器构造", "``list``、``tuple``、``dict``、``set``", "从可迭代对象创建容器"
   "数值计算", "``abs``、``round``、``pow``、``divmod``", "绝对值、舍入、幂、商与余数"
   "聚合", "``sum``、``min``、``max``、``len``", "求和、最值、长度"
   "范围与配对", "``range``、``enumerate``、``zip``", "生成整数序列、同时取下标、并行遍历"
   "函数式", "``map``、``filter``、``sorted``、``reversed``", "映射、过滤、排序、反转"
   "迭代器", "``iter``、``next``、``any``、``all``", "手动迭代、耗尽处理、真假判断"
   "类型判断", "``type``、``isinstance``", "查看精确类型、判断实例"
   "属性操作", "``hasattr``、``getattr``、``setattr``、``delattr``、``callable``", "动态读写属性、判断能否调用"
   "文本表示", "``repr``、``format``、``chr``、``ord``", "字面表示、格式化、字符与码位"
   "进制转换", "``hex``、``oct``、``bin``", "转成十六、八、二进制字符串"
   "文件与输出", "``open``、``print``、``input``", "读写文件、输出文本、读取输入"

十四、练习任务
--------------

任务 1：用内置函数给成绩表排序。计算总分与平均分，按分数从高到低输出名次，并给出最高分和最低分。

.. code-block:: python

   scores = {"小明": 92, "小红": 85, "小刚": 78}
   total = sum(scores.values())
   print("总分：", total, "平均分：", round(total / len(scores), 1))

   for rank, (name, score) in enumerate(sorted(scores.items(), key=lambda item: -item[1]), start=1):
       print(f"{rank}. {name} {score}")

   print("最高分：", max(scores.values()), "最低分：", min(scores.values()))

输出结果：

.. code-block:: text

   总分： 255 平均分： 85.0
   1. 小明 92
   2. 小红 85
   3. 小刚 78
   最高分： 92 最低分： 78

任务 2：用 ``any()``、``all()`` 和 ``zip()`` 校验一批数据，判断是否全部为正、是否存在零值、值类型是否统一，并把两组数据配对。

.. code-block:: python

   rows = [("A", 10), ("B", 0), ("C", 7)]
   print("全部为正：", all(value > 0 for name, value in rows))
   print("存在零值：", any(value == 0 for name, value in rows))
   print("类型统一：", all(isinstance(value, int) for name, value in rows))
   print("配对：", list(zip(["x", "y", "z"], [1, 2, 3])))

输出结果：

.. code-block:: text

   全部为正： False
   存在零值： True
   类型统一： True
   配对： [('x', 1), ('y', 2), ('z', 3)]

任务 3：把字符列表拼成字符串，统计长度，输出每个字符的码位和十六进制形式，并用 ``repr()`` 查看字面表示。

.. code-block:: python

   chars = ["P", "y", "t", "h", "o", "n"]
   code = "".join(chars)
   print("原文：", code, "长度：", len(code))
   print("大写：", code.upper())
   print("字符编码：", [ord(char) for char in code])
   print("十六进制：", [format(ord(char), "x") for char in code])
   print("字面量：", repr(code))

输出结果：

.. code-block:: text

   原文： Python 长度： 6
   大写： PYTHON
   字符编码： [80, 121, 116, 104, 111, 110]
   十六进制： ['50', '79', '74', '68', '6f', '6e']
   字面量： 'Python'

三个任务分别覆盖了聚合、迭代判断和文本转换。试着把成绩表换成从字典推导式生成的数据，或者给数据校验加上 ``strict=True`` 的 ``zip()``，看看长度不一致时会发生什么。
