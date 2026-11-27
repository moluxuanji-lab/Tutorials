Python Lambda 表达式
====================

.. meta::
   :group: 进阶
   :summary: 掌握 lambda 的语法与适用边界，理解它与 def 的差异，学会在 sorted、map、filter、reduce 中正确使用，并避开闭包晚绑定陷阱。

``lambda`` 是 Python 中用来创建匿名函数的表达式。它借用了函数式编程的写法，把“参数”和“返回值”压缩在一行里，适合作为参数传给那些需要一个短小函数的接口，例如排序键、映射规则和过滤条件。

本章先说明 ``lambda`` 的语法结构，再与 ``def`` 做对比，随后依次演示它在 ``sorted()``、``map()``、``filter()``、``reduce()`` 中的常见用法，最后讨论闭包晚绑定、函数字典以及不该使用 ``lambda`` 的场景。

一、lambda 语法
---------------

``lambda`` 的写法是 ``lambda 参数列表: 表达式``。冒号前面是参数，规则与 ``def`` 的参数列表一致，支持位置参数、默认值和关键字参数；冒号后面只能是一个表达式，表达式的结果就是函数返回值，不需要写 ``return``。

.. code-block:: python

   add = lambda x, y: x + y
   square = lambda x: x * x
   greet = lambda name, greeting="你好": f"{greeting}，{name}！"
   pair = lambda x: (x, x * 2)

   print("3 + 5 =", add(3, 5))
   print("7 的平方 =", square(7))
   print(greet("小明"))
   print(greet("小红", "晚上好"))
   print("成对：", pair(4))

输出结果：

.. code-block:: text

   3 + 5 = 8
   7 的平方 = 49
   你好，小明！
   晚上好，小红！
   成对： (4, 8)

``lambda`` 的函数体不能包含语句，像赋值、循环、``try`` 这样的结构都写不进去。需要多步计算时，只能在表达式内部调用其他函数，或者改用 ``def`` 定义普通函数。

二、与 def 的对比
-----------------

``lambda`` 和 ``def`` 创建的都是函数对象，调用方式、参数规则完全一致。区别在于 ``def`` 会把函数绑定到一个名字上，还能写文档字符串和多行语句；``lambda`` 只是一个表达式，返回的函数默认名为 ``<lambda>``。

.. code-block:: python

   def add_def(x, y):
       """返回两个数之和。"""
       return x + y

   add_lambda = lambda x, y: x + y

   print("结果一致：", add_def(2, 3) == add_lambda(2, 3))
   print("def 的函数名：", add_def.__name__)
   print("lambda 的函数名：", add_lambda.__name__)
   print("def 的文档：", add_def.__doc__)
   print("lambda 的文档：", add_lambda.__doc__)
   print("类型：", type(add_lambda).__name__)

输出结果：

.. code-block:: text

   结果一致： True
   def 的函数名： add_def
   lambda 的函数名： <lambda>
   def 的文档： 返回两个数之和。
   lambda 的文档： None
   类型： function

两者并不是互相替代的关系。``lambda`` 的价值在于“用完即弃”，不需要为了一个临时规则去占用一个名字；一旦这段逻辑需要复用、需要注释、需要出现在报错信息里，``def`` 就是更合适的选择。

三、与 sorted 配合
------------------

``sorted()`` 的 ``key`` 参数接收一个函数，用来把每个元素转换成排序依据。``lambda`` 最适合写这种一次性的键函数，尤其是需要同时考虑多个字段的时候。

下面的例子先按分数从高到低排列，分数相同时再按姓名升序排列。键写成元组 ``(-score, name)``，负号负责把默认的升序变成降序：

.. code-block:: python

   records = [
       ("小明", 92),
       ("小红", 85),
       ("小刚", 92),
       ("小丽", 78),
   ]

   by_score = sorted(records, key=lambda item: (-item[1], item[0]))
   for name, score in by_score:
       print(f"{name}：{score}")

   words = ["banana", "fig", "cherry", "apple"]
   by_length = sorted(words, key=lambda word: (len(word), word))
   print(by_length)

输出结果：

.. code-block:: text

   小刚：92
   小明：92
   小红：85
   小丽：78
   ['fig', 'apple', 'banana', 'cherry']

排序是稳定的：当键完全相同时，``sorted()`` 会保留元素原来的相对顺序。把多个条件拼成元组，比写一个复杂的比较函数更直观，也不容易在升降序上出错。

四、与 map、filter 配合
-----------------------

``map()`` 对可迭代对象中的每个元素应用同一个函数，返回惰性迭代器。传入 ``lambda`` 可以省去为简单变换单独定义函数：

.. code-block:: python

   numbers = [1, 2, 3, 4, 5]
   squares = list(map(lambda n: n * n, numbers))
   print("平方：", squares)

   words = ["python", "go", "rust"]
   upper = list(map(lambda word: word.upper(), words))
   print("大写：", upper)

   sums = list(map(lambda a, b: a + b, [1, 2, 3], [10, 20, 30]))
   print("对应相加：", sums)

输出结果：

.. code-block:: text

   平方： [1, 4, 9, 16, 25]
   大写： ['PYTHON', 'GO', 'RUST']
   对应相加： [11, 22, 33]

``map()`` 可以同时接收多个可迭代对象，函数需要提供对应数量的参数，长度不一致时以最短的那个为准。``map()`` 返回的是迭代器而不是列表，需要列表时要显式套一层 ``list()``。

``filter()`` 用函数判断每个元素是否保留，返回的同样是惰性迭代器。函数返回真值时元素被保留，返回假值时被丢弃：

.. code-block:: python

   numbers = list(range(1, 11))
   evens = list(filter(lambda n: n % 2 == 0, numbers))
   print("偶数：", evens)

   words = ["apple", "fig", "banana", "kiwi", "cherry"]
   long_words = list(filter(lambda word: len(word) >= 5, words))
   print("长单词：", long_words)

   mixed = [0, 1, "", "python", [], [0], None]
   truthy = list(filter(lambda item: bool(item), mixed))
   print("真值元素：", truthy)

输出结果：

.. code-block:: text

   偶数： [2, 4, 6, 8, 10]
   长单词： ['apple', 'banana', 'cherry']
   真值元素： [1, 'python', [0]]

``filter()`` 只负责筛选，不负责变换。既要筛选又要变换时，可以串联 ``filter()`` 与 ``map()``，也可以直接用生成器表达式，后者通常更好读。

五、与 reduce 配合
------------------

``reduce()`` 位于 ``functools`` 模块，它把函数不断应用到“累计值”和“下一个元素”上，最终把整个序列压缩成一个结果。``lambda`` 写这种二元合并规则非常紧凑：

.. code-block:: python

   from functools import reduce

   numbers = [1, 2, 3, 4, 5]
   print("求和：", reduce(lambda a, b: a + b, numbers))
   print("求积：", reduce(lambda a, b: a * b, numbers, 1))

   words = ["Python", " ", "is", " ", "fun"]
   print("拼接：", reduce(lambda a, b: a + b, words, ""))

   print("最大值：", reduce(lambda a, b: a if a > b else b, [3, 9, 2, 7]))

输出结果：

.. code-block:: text

   求和： 15
   求积： 120
   拼接： Python is fun
   最大值： 9

第三个参数是初始值。省略初始值时，``reduce()`` 会把序列的第一个元素当作累计值，因此空序列会抛出 ``TypeError``；提供初始值后，空序列也能安全返回初始值。求和、求积、求最值这类操作在标准库里已有 ``sum()``、``max()``、``math.prod()`` 等现成函数，``reduce()`` 更适合表达自定义的合并逻辑。

六、作为参数传递
----------------

``lambda`` 最常见的角色是“回调”：调用方只关心“这里需要一个函数”，不关心它的名字。把 ``lambda`` 直接写在实参位置上，阅读时不需要跳到别处找定义：

.. code-block:: python

   def apply_twice(func, value):
       return func(func(value))

   print("加三次：", apply_twice(lambda n: n + 3, 10))

   def make_rule(threshold):
       return lambda score: score >= threshold

   pass_line = make_rule(60)
   print("58 及格：", pass_line(58))
   print("60 及格：", pass_line(60))
   print("92 及格：", pass_line(92))

   def sort_by(key_func, data):
       return sorted(data, key=key_func)

   print(sort_by(lambda word: len(word), ["banana", "fig", "apple"]))

输出结果：

.. code-block:: text

   加三次： 16
   58 及格： False
   60 及格： True
   92 及格： True
   ['fig', 'apple', 'banana']

``apply_twice()`` 接收函数作为参数，说明函数在 Python 里是普通对象，可以赋值、传递和返回。``make_rule()`` 返回的 ``lambda`` 记住了创建时的 ``threshold``，这就是闭包。

七、闭包与晚绑定陷阱
--------------------

闭包捕获的是变量本身，而不是变量在某一时刻的值。在循环或推导式里创建的多个 ``lambda``，如果直接引用循环变量，它们看到的是循环结束后的最终值，这就是“晚绑定”：

.. code-block:: python

   funcs = [lambda: i for i in range(3)]
   print("晚绑定：", [func() for func in funcs])

   fixed = [lambda i=i: i for i in range(3)]
   print("默认参数固定：", [func() for func in fixed])

   def make_multipliers():
       result = []
       for factor in range(1, 4):
           result.append(lambda value, factor=factor: value * factor)
       return result

   multipliers = make_multipliers()
   print("工厂函数：", [func(10) for func in multipliers])

输出结果：

.. code-block:: text

   晚绑定： [2, 2, 2]
   默认参数固定： [0, 1, 2]
   工厂函数： [10, 20, 30]

第一种写法里，三个 ``lambda`` 共用同一个 ``i``，调用时循环早已结束，``i`` 停留在 2。把 ``i`` 写成默认参数 ``i=i``，可以在创建函数的那一刻把当前值绑定到参数上，从而得到 0、1、2。同样的思路也适用于 ``for`` 循环中的工厂函数。

八、字典中存放函数
------------------

函数可以作为字典的值，用字符串或枚举做键，就能把“分支选择”改写成“查表”。这种写法比一长串 ``if`` / ``elif`` 更容易扩展，也便于把命令名直接暴露给调用方：

.. code-block:: python

   operations = {
       "加": lambda a, b: a + b,
       "减": lambda a, b: a - b,
       "乘": lambda a, b: a * b,
       "除": lambda a, b: a / b,
   }

   for name in ["加", "减", "乘", "除"]:
       print(name, operations[name](8, 2))

   unknown = operations.get("幂")
   print("未知操作：", unknown)

   choice = "乘"
   print(f"选择 {choice}：", operations[choice](6, 7))

输出结果：

.. code-block:: text

   加 10
   减 6
   乘 16
   除 4.0
   未知操作： None
   选择 乘： 42

用 ``operations[name]`` 取值时，未知的键会抛出 ``KeyError``；用 ``get()`` 则可以拿到 ``None`` 或指定的默认函数。字典里的函数和普通函数没有区别，同样可以带参数、返回值，也可以替换成 ``def`` 定义的具名函数。

九、何时不该用 lambda
---------------------

``lambda`` 的限制很明确：只能写一个表达式，不能写注释，报错时函数名只显示 ``<lambda>``，堆栈信息也不如具名函数直观。逻辑稍微复杂一点，就应该改用 ``def``。

下面用同一个排序任务对比两种写法。``lambda`` 版本把所有规则挤在一行里，命名函数版本则可以写文档字符串、拆分步骤，还能被其他代码复用：

.. code-block:: python

   students = [
       {"name": "小明", "score": 92, "age": 18},
       {"name": "小红", "score": 92, "age": 17},
       {"name": "小刚", "score": 85, "age": 19},
   ]

   by_lambda = sorted(students, key=lambda s: (-s["score"], s["age"]))
   print("lambda 排序：", [s["name"] for s in by_lambda])

   def student_sort_key(student):
       return (-student["score"], student["age"])

   by_def = sorted(students, key=student_sort_key)
   print("命名函数排序：", [s["name"] for s in by_def])
   print("结果一致：", by_lambda == by_def)

   def describe(student):
       return f"{student['name']}，{student['score']} 分，{student['age']} 岁"

   print(describe(students[0]))

输出结果：

.. code-block:: text

   lambda 排序： ['小红', '小明', '小刚']
   命名函数排序： ['小红', '小明', '小刚']
   结果一致： True
   小明，92 分，18 岁

按照 PEP 8 的建议，不要把 ``lambda`` 赋值给变量再当普通函数使用，那种场景应该直接写 ``def``。``lambda`` 适合出现在实参位置上，长度以一眼能读完为准；需要嵌套、需要条件分支、需要调试信息时，都应该回到 ``def``。

十、练习任务
------------

任务 1：按单词长度降序排列，长度相同时按字母升序排列。

.. code-block:: python

   words = ["banana", "kiwi", "apple", "fig", "cherry"]
   result = sorted(words, key=lambda word: (-len(word), word))
   print(result)

输出结果：

.. code-block:: text

   ['banana', 'cherry', 'apple', 'kiwi', 'fig']

任务 2：先用 ``filter()`` 保留及格分数，再用 ``map()`` 把分数转换成等级。

.. code-block:: python

   scores = [92, 58, 77, 45, 88, 61]
   passed = list(filter(lambda score: score >= 60, scores))
   grades = list(map(lambda score: "优秀" if score >= 90 else "通过", passed))
   print("及格分数：", passed)
   print("等级：", grades)

输出结果：

.. code-block:: text

   及格分数： [92, 77, 88, 61]
   等级： ['优秀', '通过', '通过', '通过']

任务 3：用 ``reduce()`` 求一组数字中的最大值，并把三个字母拼接成字符串。

.. code-block:: python

   from functools import reduce

   numbers = [23, 7, 91, 45, 68]
   print("最大值：", reduce(lambda a, b: a if a > b else b, numbers))
   print("拼接：", reduce(lambda a, b: f"{a}-{b}", ["A", "B", "C"]))

输出结果：

.. code-block:: text

   最大值： 91
   拼接： A-B-C
