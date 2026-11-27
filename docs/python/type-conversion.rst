Python 数据类型转换
====================

.. meta::
   :group: 入门
   :summary: 理解隐式转换与显式转换的区别，掌握 int、float、str、bool、list、tuple、set、dict 之间的互转，熟悉 chr、ord、hex、oct、bin、repr 与 eval 的用法和边界情况。

程序里的数据经常需要在不同形式之间流动：用户输入的是字符串，计算需要数字，输出又需要还原成文本。类型转换就是把这些值从一种类型变成另一种类型的过程。

Python 不会自动把字符串当作数字使用，也不会在需要整数的地方悄悄截断小数。多数转换必须显式写出目标类型，这既是麻烦，也是安全：每一步变化都看得见。

一、隐式转换与显式转换
----------------------

隐式转换由解释器自动完成，只发生在类型兼容的算术运算中。``int`` 与 ``float`` 相遇时，整数会先提升为浮点数；``bool`` 参与运算时会被当作 1 或 0。转换方向永远是“向更宽的类型看齐”，不会丢失信息。

显式转换由开发者调用类型名完成，例如 ``int("42")``、``str(3.14)``。它是 Python 中唯一可靠的转换方式，字符串与数字之间尤其如此。

.. code-block:: python

   integer = 7
   decimal = 2.5
   result = integer + decimal
   print("隐式转换结果：", result)
   print("结果类型：", type(result).__name__)

   total = integer + True
   print("bool 参与运算：", total, "，类型：", type(total).__name__)

   text = "数量：" + str(integer)
   print("显式转换结果：", text)

   try:
       wrong = "数量：" + integer
   except TypeError:
       print("隐式拼接失败：捕获到 TypeError")

输出结果：

.. code-block:: text

   隐式转换结果： 9.5
   结果类型： float
   bool 参与运算： 8 ，类型： int
   显式转换结果： 数量：7
   隐式拼接失败：捕获到 TypeError

隐式转换的规则很窄，只在数值之间生效。字符串与数字相加、列表与元组相加都不会自动转换，前者抛 ``TypeError``，后者直接报错。遇到这类错误时，先确认两边的类型，再决定用 ``int()``、``float()`` 还是 ``str()``。

二、数值类型互转
-----------------

``int()`` 把浮点数向零截断，``float()`` 把整数补上小数部分，``complex()`` 生成复数。字符串只要符合数字写法也能被解析，前后的空白会被自动忽略。

.. code-block:: python

   print(int(3.99))
   print(int(-3.99))
   print(float(7))
   print(float("2.5"))
   print(complex(2, 3))
   print(int("42"))
   print(int("  -17  "))
   print(round(3.14159, 2))
   print(abs(-9))

输出结果：

.. code-block:: text

   3
   -3
   7.0
   2.5
   (2+3j)
   42
   -17
   3.14
   9

``int(3.99)`` 得到 3，``int(-3.99)`` 得到 -3，说明它是向零截断而不是向下取整。真正的四舍五入要用 ``round()``，向下取整用 ``math.floor()``。``round()`` 采用银行家舍入，遇到 ``.5`` 时向偶数靠拢，这一点在处理财务数据时要特别留意。

三、int() 的边界与异常处理
---------------------------

``int()`` 只接受整数写法。``"3.5"``、``"abc"``、空字符串都会抛出 ``ValueError``，带小数点的字符串必须先转成 ``float``。这类失败无法靠参数规避，只能用 ``try`` 捕获或者提前校验。

.. code-block:: python

   cases = ["42", "3.5", "abc", "", " 7 "]

   for text in cases:
       try:
           print(f"int({text!r}) =", int(text))
       except ValueError:
           print(f"int({text!r}) 失败：无法转换为整数")

   print("先转 float 再转 int：", int(float("3.5")))

输出结果：

.. code-block:: text

   int('42') = 42
   int('3.5') 失败：无法转换为整数
   int('abc') 失败：无法转换为整数
   int('') 失败：无法转换为整数
   int(' 7 ') = 7
   先转 float 再转 int： 3

捕获异常时只写 ``except ValueError``，不要用裸 ``except`` 把所有错误一起吞掉，否则连拼写错误都会被掩盖。解析用户输入时，更稳妥的做法是把转换封装成函数，失败时返回 ``None`` 或默认值。

四、str() 与 repr()
--------------------

``str()`` 生成面向用户的文本，``repr()`` 生成面向开发者的表示。对字符串来说，``str()`` 原样返回内容，``repr()`` 会加上引号并转义换行、制表符等特殊字符，因此更适合调试和日志。

.. code-block:: python

   value = "Python"
   print(str(value))
   print(repr(value))
   print(str(42), repr(42))
   print(str(3.0), repr(3.0))
   print(str([1, 2]), repr([1, 2]))
   print(repr("换行\n符"))

输出结果：

.. code-block:: text

   Python
   'Python'
   42 42
   3.0 3.0
   [1, 2] [1, 2]
   '换行\n符'

最后一行实际输出是带引号的 ``'换行\n符'``，其中 ``\n`` 是两个可见字符而不是真正的换行，这正是 ``repr()`` 的价值：它让不可见的字符变得可见。容器类型内部调用的也是元素的 ``repr()``，所以 ``repr([1, 2])`` 和 ``str([1, 2])`` 看起来一样。

五、bool() 的真假规则
----------------------

``bool()`` 把任意对象转成布尔值。数字 0、空字符串、空列表、空元组、空字典、空集合和 ``None`` 都是假，其余为真。注意字符串 ``"0"`` 和 ``"False"`` 都是非空文本，转换结果是 ``True``。

.. code-block:: python

   values = [0, 1, -1, 0.0, 0.5, "", "0", [], [0], (), {}, set(), None]

   for value in values:
       print(f"{repr(value):<6} -> {bool(value)}")

输出结果：

.. code-block:: text

   0      -> False
   1      -> True
   -1     -> True
   0.0    -> False
   0.5    -> True
   ''     -> False
   '0'    -> True
   []     -> False
   [0]    -> True
   ()     -> False
   {}     -> False
   set()  -> False
   None   -> False

因为字符串 ``"0"`` 非空，``bool("0")`` 为真，而 ``bool(0)`` 为假。判断“字符串里写的是不是数字”不能只看布尔值，必须真正做一次 ``int()`` 转换并处理异常。

六、容器之间互转
-----------------

``list()``、``tuple()``、``set()`` 接受任意可迭代对象，字符串会被拆成单个字符，字典会被拆成键。``dict()`` 则要求输入是键值对序列，或者直接传入关键字参数。

.. code-block:: python

   letters = "hello"
   chars = list(letters)

   print("list：", chars)
   print("tuple：", tuple(chars))
   print("set 去重：", sorted(set(chars)))
   print("再次转回字符串：", "".join(chars))
   print("range 转列表：", list(range(1, 6)))
   print("字典转列表：", list({"a": 1, "b": 2}))

输出结果：

.. code-block:: text

   list： ['h', 'e', 'l', 'l', 'o']
   tuple： ('h', 'e', 'l', 'l', 'o')
   set 去重： ['e', 'h', 'l', 'o']
   再次转回字符串： hello
   range 转列表： [1, 2, 3, 4, 5]
   字典转列表： ['a', 'b']

集合是无序的，转成列表后顺序不保证，需要固定输出时先 ``sorted()``。字符串与列表之间用 ``"".join()`` 还原，不要用 ``str(list)``，后者会连方括号和引号一起带出来。

字典的构造方式更多，键值对列表、关键字参数、``zip()`` 配合、``fromkeys()`` 都能生成字典：

.. code-block:: python

   pairs = [("name", "小明"), ("age", 18)]
   student = dict(pairs)
   print(student)
   print(dict(name="小红", age=20))
   print(dict.fromkeys(["a", "b"], 0))
   print(dict(zip(["x", "y"], [1, 2])))
   print(dict([[1, 2], [3, 4]]))

输出结果：

.. code-block:: text

   {'name': '小明', 'age': 18}
   {'name': '小红', 'age': 20}
   {'a': 0, 'b': 0}
   {'x': 1, 'y': 2}
   {1: 2, 3: 4}

``dict()`` 要求每个元素恰好包含两个值，长度不对会抛 ``ValueError``，重复的键则保留最后一次的值。``fromkeys()`` 的默认值如果是可变对象，所有键会共享同一个列表，这一点在需要独立默认值时要用推导式代替。

七、chr() 与 ord()
-------------------

``chr()`` 把码点转成对应字符，``ord()`` 把单个字符转回码点，两者互为逆运算。码点范围是 0 到 0x10FFFF，超出范围会抛 ``ValueError``。

.. code-block:: python

   print(chr(65), chr(97), chr(0x4E2D))
   print(ord("A"), ord("a"), ord("中"))
   print([ord(char) for char in "Python"])
   print("".join(chr(code) for code in [80, 121, 116, 104, 111, 110]))

   try:
       chr(-1)
   except ValueError:
       print("码点超出范围：捕获到 ValueError")

输出结果：

.. code-block:: text

   A a 中
   65 97 20013
   [80, 121, 116, 104, 111, 110]
   Python
   码点超出范围：捕获到 ValueError

``chr(0x4E2D)`` 得到“中”，说明 Python 3 的字符串按 Unicode 码点处理，中文与英文在 ``ord()`` 面前没有区别。做简单加密时常用“码点加偏移再转回字符”的方式，但要先确认结果没有超出合法范围。

八、hex()、oct() 与 bin()
--------------------------

``hex()``、``oct()``、``bin()`` 把整数转成带前缀的字符串，前缀分别是 ``0x``、``0o``、``0b``。``int()`` 加上第二个参数 base 可以反向解析任意进制的文本。

.. code-block:: python

   number = 255

   print("二进制：", bin(number))
   print("八进制：", oct(number))
   print("十六进制：", hex(number))
   print("去掉前缀：", format(number, "b"), format(number, "o"), format(number, "x"))
   print("反向解析：", int("11111111", 2), int("377", 8), int("ff", 16))
   print("大写十六进制：", hex(number).upper())

输出结果：

.. code-block:: text

   二进制： 0b11111111
   八进制： 0o377
   十六进制： 0xff
   去掉前缀： 11111111 377 ff
   反向解析： 255 255 255
   大写十六进制： 0XFF

需要固定宽度、补前导零时用 ``format()``，例如 ``format(255, "08b")`` 得到 ``11111111``，``format(255, "#010x")`` 得到 ``0x000000ff``。``hex()`` 的结果永远是小写，想输出大写要自己调用 ``upper()``。

九、eval() 与 ast.literal_eval()
---------------------------------

``eval()`` 把字符串当作 Python 表达式执行并返回结果，能解析算术式、容器字面量和方法调用。它的代价是执行任意代码，绝不能用于处理不可信的输入。``ast.literal_eval()`` 只接受字面量，安全得多。

.. code-block:: python

   from ast import literal_eval

   print(eval("1 + 2 * 3"))
   print(eval("[1, 2, 3]"))
   print(eval("{'a': 1}"))
   print(eval("'Python'.upper()"))

   try:
       eval("undefined_name + 1")
   except NameError:
       print("未定义的名字：捕获到 NameError")

   print(literal_eval("{'a': (1, 2)}"))
   try:
       literal_eval("__import__('os')")
   except ValueError:
       print("literal_eval 拒绝执行函数调用")

输出结果：

.. code-block:: text

   7
   [1, 2, 3]
   {'a': 1}
   PYTHON
   未定义的名字：捕获到 NameError
   {'a': (1, 2)}
   literal_eval 拒绝执行函数调用

解析配置文件、命令行参数这类场景，优先使用 ``json.loads()`` 或 ``ast.literal_eval()``。``eval()`` 只适合在完全可控的开发调试环境里临时使用，线上代码应当避免。

十、转换规则速查表
-------------------

下表汇总常用的转换写法和容易踩的坑：

.. csv-table::
   :header: "源类型", "目标类型", "写法", "说明"

   "``str``", "``int``", "``int('42')``", "只接受整数写法，``'3.5'`` 会抛 ValueError"
   "``str``", "``float``", "``float('3.5')``", "支持小数与指数写法，例如 ``'1e3'``"
   "``float``", "``int``", "``int(3.9)``", "向零截断，不做四舍五入"
   "``int``", "``float``", "``float(7)``", "得到 ``7.0``，精度可能丢失"
   "任意对象", "``str``", "``str(42)``", "得到面向用户的文本"
   "任意对象", "``repr``", "``repr('hi')``", "得到带引号、可调试的表示"
   "任意对象", "``bool``", "``bool([])``", "空容器、0、``None`` 为假"
   "``str``", "``list``", "``list('abc')``", "按字符拆分成列表"
   "``list``", "``tuple``", "``tuple([1, 2])``", "生成不可变副本"
   "``list``", "``set``", "``set([1, 1, 2])``", "去重，顺序不保证"
   "键值对序列", "``dict``", "``dict([('a', 1)])``", "每个元素必须恰好两个值"
   "``int``", "进制字符串", "``hex(255)``", "得到 ``0xff``，``oct``、``bin`` 同理"

表格里没有列出的组合基本都不成立，例如 ``int([1])``、``list(1)`` 都会抛 ``TypeError``。转换前先想清楚目标类型能否从源对象“逐个取出元素”或“解析文本”，不能确定时先在小段代码里试一次。

十一、练习任务
---------------

任务 1：把一组字符串转成数值并求和，遇到无法转换的值就跳过并打印提示。

.. code-block:: python

   raw = ["12", "3.5", "8", "abc", " 4 "]
   total = 0.0

   for item in raw:
       try:
           total += float(item)
       except ValueError:
           print(f"跳过无法转换的值：{item!r}")

   print("总和：", total)

输出结果：

.. code-block:: text

   跳过无法转换的值：'abc'
   总和： 27.5

任务 2：把一组十进制整数同时输出成二进制、八进制和十六进制。

.. code-block:: python

   numbers = [5, 16, 255]

   for number in numbers:
       print(number, bin(number), oct(number), hex(number))

输出结果：

.. code-block:: text

   5 0b101 0o5 0x5
   16 0b10000 0o20 0x10
   255 0b11111111 0o377 0xff
