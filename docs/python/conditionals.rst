Python 条件控制
================

.. meta::
   :group: 核心语法
   :summary: 掌握 if、elif、else 的分支写法与缩进规则，理解嵌套条件、三元表达式、真值判断、and 与 or 的短路、in 成员测试、match/case 模式匹配，以及 = 与 == 的区别。

条件控制让程序根据不同的情况走不同的分支。Python 没有花括号，分支范围完全由缩进决定，因此“代码属于哪个分支”在源码里一眼可见，这也是它强制统一风格的方式。

本章从最简单的 ``if`` 讲起，依次介绍 ``elif``、嵌套、三元表达式、真值判断、短路求值、``in`` 成员测试，再进入 Python 3.10 引入的 ``match`` / ``case`` 模式匹配，最后说明 ``=`` 与 ``==`` 这个新手最容易混淆的地方。

一、if 语句
-----------

``if`` 后面跟一个条件表达式，以冒号结尾，条件为真时执行缩进的代码块。条件表达式的结果会被自动转换成布尔值，不必显式写 ``== True``。

条件为假时，整个代码块被跳过，程序继续执行与 ``if`` 同级的下一行。冒号和缩进缺一不可，这是 Python 语法里最基础也最严格的部分。

.. code-block:: python

   score = 72

   if score >= 60:
       print("及格")
       print("成绩：", score)

   print("判断结束")

输出结果：

.. code-block:: text

   及格
   成绩： 72
   判断结束

``if`` 内部的两条 ``print`` 都属于条件成立时执行的代码块；最后一行没有缩进，所以无论条件真假都会执行。

二、if、elif、else
------------------

多分支用 ``elif``（else if 的缩写）串联，从上到下依次判断，命中一个分支后剩下的分支全部跳过。``else`` 放在最后，兜住所有没有命中的情况。

判断顺序很关键：条件写得太宽，后面的分支就永远轮不到。比如先判断 ``score >= 60`` 再判断 ``score >= 90``，90 分以上的成绩会被第一个分支拦截。

.. code-block:: python

   def level(score):
       if score >= 90:
           return "优秀"
       elif score >= 80:
           return "良好"
       elif score >= 60:
           return "及格"
       else:
           return "不及格"

   for value in [95, 85, 72, 45]:
       print(value, "->", level(value))

输出结果：

.. code-block:: text

   95 -> 优秀
   85 -> 良好
   72 -> 及格
   45 -> 不及格

``elif`` 可以有任意多个，``else`` 最多一个且必须放在最后。只要某个分支执行了 ``return``，函数就会立即结束，不会再往下判断。

三、缩进规则
------------

Python 用缩进表示代码块，同一代码块内的语句必须保持相同的缩进量。官方风格（PEP 8）约定用 4 个空格，不要在同一个文件里混用制表符和空格。

缩进不同，语句的归属就不同。下面这段代码里，前两条 ``print`` 属于 ``if`` 内部，第三条回到了顶层，所以总会打印。

.. code-block:: python

   score = 75

   if score >= 60:
       print("进入 if 内部")
       print("两条语句属于同一个代码块")
   print("这条语句在 if 外部，总会执行")

   try:
       compile("if True:\nprint('缺少缩进')", "<demo>", "exec")
   except IndentationError as error:
       print("缩进错误：", type(error).__name__)

输出结果：

.. code-block:: text

   进入 if 内部
   两条语句属于同一个代码块
   这条语句在 if 外部，总会执行
   缩进错误： IndentationError

``compile()`` 在运行期编译一段字符串，遇到缺少缩进的代码会抛出 ``IndentationError``，它是 ``SyntaxError`` 的子类。缩进错误在源码阶段就会被解释器拦下，不会等到运行到那一行才报错。

四、嵌套条件
------------

一个分支内部还可以再写 ``if``，形成嵌套。缩进每加深一层，就表示“在外层条件成立的前提下再判断一次”。

嵌套层数不宜过多，超过三层通常说明可以把条件合并，或者拆成函数提前返回。下面用“年龄 + 是否持票”两个条件演示入场判断。

.. code-block:: python

   visitors = [(20, True), (17, True), (25, False)]

   for age, has_ticket in visitors:
       if age >= 18:
           if has_ticket:
               result = "可以入场"
           else:
               result = "请先购票"
       else:
           result = "未成年人不能入场"
       print(f"年龄 {age}，有票 {has_ticket}：{result}")

输出结果：

.. code-block:: text

   年龄 20，有票 True：可以入场
   年龄 17，有票 True：未成年人不能入场
   年龄 25，有票 False：请先购票

``if age >= 18`` 为假时，内层的 ``if has_ticket`` 根本不会被求值。把最容易命中的条件放在外层，可以减少不必要的判断。

五、三元表达式
--------------

``A if 条件 else B`` 是 ``if`` 的表达式形式，条件为真时取 ``A``，否则取 ``B``。它适合在赋值、``print`` 和推导式里做简单的二选一。

三元表达式可以嵌套，但超过两层就很难读，此时应该改回普通的 ``if`` 语句。注意条件写在中间，不要写成其他语言的 ``条件 ? A : B``。

.. code-block:: python

   score = 58
   result = "及格" if score >= 60 else "不及格"
   print("成绩", score, "：", result)

   numbers = [-3, 0, 7]
   labels = ["正数" if n > 0 else "零" if n == 0 else "负数" for n in numbers]
   print("分类：", labels)

   age = 20
   print("身份：", "成年人" if age >= 18 else "未成年人")

输出结果：

.. code-block:: text

   成绩 58 ： 不及格
   分类： ['负数', '零', '正数']
   身份： 成年人

``"正数" if n > 0 else "零" if n == 0 else "负数"`` 从右向左结合，等价于 ``"正数" if n > 0 else ("零" if n == 0 else "负数")``。推导式里用三元表达式很常见，但再长就该拆成函数了。

六、真值与假值
--------------

``if`` 后面不一定要写比较运算，任何对象都能直接判断真假。``0``、``0.0``、空字符串、空列表、空字典、空集合、``None`` 和 ``False`` 都被视为假，其余对象为真。

这条规则让代码可以写得很短：判断列表是否非空写 ``if items:`` 即可，不必写 ``if len(items) > 0:``。但要注意字符串 ``"0"`` 和 ``"False"`` 是真值，非空就是真。

.. code-block:: python

   values = [0, 1, -1, "", "0", [], [0], {}, None, False, True]

   for value in values:
       print(repr(value), "->", bool(value))

   name = ""
   if name:
       print("姓名：", name)
   else:
       print("姓名为空")

输出结果：

.. code-block:: text

   0 -> False
   1 -> True
   -1 -> True
   '' -> False
   '0' -> True
   [] -> False
   [0] -> True
   {} -> False
   None -> False
   False -> False
   True -> True
   姓名为空

``[0]`` 是含有一个元素的列表，所以为真；``[]`` 没有任何元素，所以为假。判断“有没有值”和判断“值是不是 0”是两件事，写条件时要先想清楚需要哪一种。

七、and 与 or 的短路
--------------------

``and`` 和 ``or`` 按从左到右的顺序求值，一旦结果确定就停止，后面的表达式不会再执行，这叫短路求值。

``and`` 遇到第一个假值就返回它，``or`` 遇到第一个真值就返回它，返回的是操作数本身而不是 ``True`` / ``False``。常用来给变量设置默认值，例如 ``name or "匿名用户"``。

.. code-block:: python

   def check(label, result):
       print("执行", label)
       return result

   print("--- and ---")
   print(check("A", True) and check("B", False) and check("C", True))

   print("--- or ---")
   print(check("A", False) or check("B", True) or check("C", False))

   nickname = ""
   print("昵称：", nickname or "匿名用户")

输出结果：

.. code-block:: text

   --- and ---
   执行 A
   执行 B
   False
   --- or ---
   执行 A
   执行 B
   True
   昵称： 匿名用户

两个例子里 ``check("C", ...)`` 都没有执行，因为前面的结果已经能决定整体真假。利用这一点，可以把“先判断再取值”写成 ``items and items[0]``，避免空列表取值报错。

八、in 成员判断
---------------

``in`` 判断元素是否属于某个容器，``not in`` 判断是否不属于。字符串判断子串，列表、元组判断元素，字典判断键，集合判断元素是否存在。

成员判断可以和 ``and``、``or`` 组合成更复杂的条件。需要同时检查多个值都在时，用集合的子集判断会更简洁。

.. code-block:: python

   fruits = ["apple", "banana", "cherry"]
   print("apple" in fruits)
   print("grape" in fruits)
   print("grape" not in fruits)

   text = "python tutorial"
   print("tutorial" in text)
   print("java" in text)

   permissions = {"read", "write"}
   if "write" in permissions and "delete" not in permissions:
       print("可以修改，不能删除")

输出结果：

.. code-block:: text

   True
   False
   True
   True
   False
   可以修改，不能删除

``in`` 用在字典上只检查键，不检查值；想判断值是否存在，要写 ``value in student.values()``。字符串的 ``in`` 区分大小写，``"Python" in text`` 在这个例子里是 ``False``。

九、match 与 case
-----------------

Python 3.10 引入了结构化模式匹配：``match`` 后面跟待匹配的对象，``case`` 后面跟模式，命中就执行对应分支。``case _`` 是通配符，相当于 ``else``，必须放在最后。

多个字面量可以用 ``|`` 合并成一个模式。``match`` 比较的是值是否相等，不做类型转换，因此 ``1`` 和 ``"1"`` 是两个不同的模式。

.. code-block:: python

   def describe(command):
       match command:
           case "start" | "run":
               return "启动"
           case "stop":
               return "停止"
           case "restart":
               return "重启"
           case _:
               return "未知命令"

   for cmd in ["start", "run", "stop", "restart", "pause"]:
       print(cmd, "->", describe(cmd))

输出结果：

.. code-block:: text

   start -> 启动
   run -> 启动
   stop -> 停止
   restart -> 重启
   pause -> 未知命令

没有 ``case _`` 时，所有分支都不命中就什么都不做，程序不会报错。实际使用中建议总是保留一个兜底分支，让未预料到的输入有明确的处理方式。

十、序列模式与守卫
------------------

``case`` 可以直接解构序列：``(x, y)`` 匹配长度为 2 的序列，并把两个元素分别绑定到 ``x``、``y``。``case (0, 0)`` 则是带字面量的模式，只有两个位置都是 0 才命中。

在模式后面加 ``if`` 就是守卫（guard），只有模式匹配成功并且守卫为真，分支才会执行。守卫可以引用模式里绑定的变量，适合做额外的范围检查。

.. code-block:: python

   def handle(point):
       match point:
           case (0, 0):
               return "原点"
           case (x, 0):
               return f"x 轴上的点，x={x}"
           case (0, y):
               return f"y 轴上的点，y={y}"
           case (x, y) if x == y:
               return f"对角线上的点，坐标 {x}"
           case (x, y):
               return f"普通点 ({x}, {y})"
           case _:
               return "不是二维点"

   for p in [(0, 0), (5, 0), (0, -3), (4, 4), (2, 7), (1, 2, 3)]:
       print(p, "->", handle(p))

输出结果：

.. code-block:: text

   (0, 0) -> 原点
   (5, 0) -> x 轴上的点，x=5
   (0, -3) -> y 轴上的点，y=-3
   (4, 4) -> 对角线上的点，坐标 4
   (2, 7) -> 普通点 (2, 7)
   (1, 2, 3) -> 不是二维点

分支顺序决定匹配结果：``(4, 4)`` 也满足 ``(x, y)``，但前面的守卫分支先命中，所以返回“对角线上的点”。长度不是 2 的元组只能落到最后一个 ``case _``。

十一、= 与 == 的区别
---------------------

``=`` 是赋值，把右边的值绑定到左边的名字；``==`` 是比较，判断两边的值是否相等。把 ``=`` 写进 ``if`` 条件里是语法错误，Python 不会像某些语言那样把它当成“赋值并判断”。

需要“先计算再判断”时用海象运算符 ``:=``，它必须用括号包起来。另外 ``==`` 比较值，``is`` 比较对象身份，两个内容相同的列表 ``==`` 为真，``is`` 却为假。

.. code-block:: python

   value = 5
   if value == 5:
       print("相等判断成立")

   item = [1, 2]
   same = [1, 2]
   print("内容相等：", item == same)
   print("同一对象：", item is same)

   if (n := len("python")) > 5:
       print("长度超过 5：", n)

   try:
       exec("if value = 5:\n    print('ok')")
   except SyntaxError:
       print("赋值号 = 不能用于条件判断")

输出结果：

.. code-block:: text

   相等判断成立
   内容相等： True
   同一对象： False
   长度超过 5： 6
   赋值号 = 不能用于条件判断

``exec()`` 在运行期编译字符串，遇到 ``if value = 5`` 会抛出 ``SyntaxError``。判断两个对象是否为同一个，只在比较 ``None``、``True``、``False`` 这类单例时才推荐用 ``is``。

练习任务
--------

任务 1：按分数给出等级，分数超出 0 到 100 的范围时提示无效，注意先处理非法输入再判断等级。

.. code-block:: python

   def grade(score):
       if score < 0 or score > 100:
           return "分数无效"
       if score >= 90:
           return "A"
       elif score >= 80:
           return "B"
       elif score >= 60:
           return "C"
       else:
           return "D"

   for s in [95, 85, 60, 59, 101, -1]:
       print(f"{s} -> {grade(s)}")

输出结果：

.. code-block:: text

   95 -> A
   85 -> B
   60 -> C
   59 -> D
   101 -> 分数无效
   -1 -> 分数无效

任务 2：判断闰年。能被 4 整除但不能被 100 整除，或者能被 400 整除的年份是闰年。

.. code-block:: python

   def is_leap(year):
       return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)

   for year in [1900, 2000, 2024, 2023]:
       print(year, "闰年" if is_leap(year) else "平年")

输出结果：

.. code-block:: text

   1900 平年
   2000 闰年
   2024 闰年
   2023 平年

任务 3：用 ``match`` / ``case`` 实现一个四则运算函数，除数为 0 时返回提示，遇到不支持的运算符也给出提示。

.. code-block:: python

   def calculate(op, left, right):
       match op:
           case "+":
               return left + right
           case "-":
               return left - right
           case "*":
               return left * right
           case "/" if right != 0:
               return left / right
           case "/":
               return "除数不能为 0"
           case _:
               return "不支持的运算符"

   cases = [("+", 3, 4), ("-", 10, 4), ("*", 3, 5), ("/", 8, 2), ("/", 1, 0), ("%", 5, 2)]
   for op, left, right in cases:
       print(f"{left} {op} {right} = {calculate(op, left, right)}")

输出结果：

.. code-block:: text

   3 + 4 = 7
   10 - 4 = 6
   3 * 5 = 15
   8 / 2 = 4.0
   1 / 0 = 除数不能为 0
   5 % 2 = 不支持的运算符
