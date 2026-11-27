Python 函数
============

.. meta::
   :group: 进阶
   :summary: 掌握函数的定义与调用、返回值、位置参数、关键字参数、默认参数、可变参数、参数解包、作用域、递归、文档字符串、类型注解与高阶函数。

函数是组织代码的基本单位。它把一段可以被反复使用的逻辑封装起来，通过参数接收输入，通过返回值交出结果。把代码拆成函数之后，重复的逻辑只需要维护一份，调用处只关心“做什么”，不必重复阅读“怎么做”。

本章从最简单的定义与调用开始，依次介绍返回值、各类参数形式、参数解包、作用域、递归、文档字符串、类型注解和高阶函数，最后用三个练习巩固这些用法。

一、定义与调用
--------------

函数用 ``def`` 关键字定义，后面依次是函数名、圆括号包裹的参数列表和冒号，函数体统一缩进。定义本身不会执行函数体，只有调用时才真正运行。

下面定义一个带默认问候语的函数：

.. code-block:: python

   def greet(name, greeting="你好"):
       return f"{greeting}，{name}！"

   print(greet("小明"))
   print(greet("小红", "早上好"))

输出结果：

.. code-block:: text

   你好，小明！
   早上好，小红！

函数名后面加圆括号就是调用。调用时传入的参数会按位置绑定到形参上，返回值可以用变量接收，也可以直接打印或继续参与运算。没有 ``return`` 的函数默认返回 ``None``。

二、返回值
----------

``return`` 负责结束函数并把结果交还给调用者。Python 的函数可以返回多个值，写法上是用逗号分隔，实际返回的是一个元组，调用处可以直接解包。

下面的函数一次返回最低分、最高分和平均分：

.. code-block:: python

   def analyze(numbers):
       return min(numbers), max(numbers), sum(numbers) / len(numbers)

   low, high, average = analyze([80, 92, 75, 88])
   print("最低分：", low)
   print("最高分：", high)
   print("平均分：", round(average, 2))

输出结果：

.. code-block:: text

   最低分： 75
   最高分： 92
   平均分： 83.75

``return`` 之后的代码不会再执行。如果函数体走完了所有分支都没有遇到 ``return``，调用结果就是 ``None``。需要提前结束时，可以单独写一个不带值的 ``return``。

三、位置、关键字与默认参数
--------------------------

调用函数时，参数既可以按位置传递，也可以按名字传递。位置参数要求顺序和个数都匹配；关键字参数通过 ``参数名=值`` 的形式传入，顺序可以调整。默认参数在定义时给出默认值，调用时省略即可。

.. csv-table::
   :header: "形式", "示例", "说明"

   "位置参数", "``f(1, 2)``", "按定义顺序传参，个数必须匹配"
   "关键字参数", "``f(a=1, b=2)``", "按参数名传参，顺序可以调整"
   "默认参数", "``def f(a, b=2)``", "省略时使用默认值，默认值只求值一次"
   "可变位置参数", "``def f(*args)``", "收集多余的位置参数为元组"
   "可变关键字参数", "``def f(**kwargs)``", "收集多余的关键字参数为字典"

三种基本形式可以混用：

.. code-block:: python

   def describe(name, age, city="北京"):
       return f"{name}，{age} 岁，来自{city}"

   print(describe("小明", 18))
   print(describe("小红", 20, city="上海"))
   print(describe(age=22, name="小刚"))

输出结果：

.. code-block:: text

   小明，18 岁，来自北京
   小红，20 岁，来自上海
   小刚，22 岁，来自北京

位置参数必须写在关键字参数前面，否则会触发 ``SyntaxError``。默认参数也不能放在普通位置参数之前，定义时同样要遵循“先必填、后可选”的顺序。

可变默认值陷阱
~~~~~~~~~~~~~~

默认值只在函数定义时求值一次，之后所有调用共享同一个对象。如果默认值是列表、字典这类可变对象，函数内部对它的修改会保留到下一次调用：

.. code-block:: python

   def add_item(item, bucket=[]):
       bucket.append(item)
       return bucket

   print(add_item("a"))
   print(add_item("b"))

   def add_item_fixed(item, bucket=None):
       if bucket is None:
           bucket = []
       bucket.append(item)
       return bucket

   print(add_item_fixed("a"))
   print(add_item_fixed("b"))

输出结果：

.. code-block:: text

   ['a']
   ['a', 'b']
   ['a']
   ['b']

第一次调用返回 ``['a']``，第二次却变成 ``['a', 'b']``，原因就是两次调用使用的是同一个默认列表。正确的做法是用 ``None`` 作为默认值，在函数体内部再创建新列表。字典、集合等可变对象都有同样的问题。

四、可变参数
------------

在参数名前加一个星号，表示收集任意数量的位置参数。函数内部拿到的 ``args`` 是一个元组，可以像普通元组一样遍历、求和或取长度。

.. code-block:: python

   def total(*args):
       print("参数个数：", len(args))
       return sum(args)

   print(total(1, 2, 3))
   print(total(10, 20))
   print(total())

输出结果：

.. code-block:: text

   参数个数： 3
   6
   参数个数： 2
   30
   参数个数： 0
   0

在参数名前加两个星号，表示收集任意数量的关键字参数。函数内部拿到的 ``kwargs`` 是一个字典，键是参数名，值是传入的内容。

.. code-block:: python

   def build_profile(name, **kwargs):
       profile = {"name": name}
       profile.update(kwargs)
       return profile

   print(build_profile("小明", age=18, city="北京"))
   print(build_profile("小红"))

输出结果：

.. code-block:: text

   {'name': '小明', 'age': 18, 'city': '北京'}
   {'name': '小红'}

``*args`` 与 ``**kwargs`` 可以同时出现，但 ``*args`` 必须写在 ``**kwargs`` 前面。它们常用来编写装饰器、转发参数或封装通用接口，不过滥用会让函数签名失去约束，调用方也难以判断到底该传什么。

五、参数解包
------------

调用函数时，可以在列表、元组前加 ``*``，把其中的元素依次展开成位置参数；在字典前加 ``**``，把键值对展开成关键字参数。解包让“把已有数据结构直接传给函数”变得非常自然。

.. code-block:: python

   def distance(x1, y1, x2, y2):
       return ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5

   point_a = (0, 0)
   point_b = (3, 4)
   print("两点距离：", distance(*point_a, *point_b))

   options = {"x1": 0, "y1": 0, "x2": 6, "y2": 8}
   print("两点距离：", distance(**options))

输出结果：

.. code-block:: text

   两点距离： 5.0
   两点距离： 10.0

解包时，元素个数和键名必须与函数签名匹配。多传、少传或键名拼错都会抛出 ``TypeError``。同一个参数不能被位置解包和关键字解包重复赋值。

六、作用域简介
--------------

函数内部定义的变量属于局部作用域，函数执行结束后就不可访问；模块顶层定义的变量属于全局作用域，函数可以读取，但直接赋值会被当成新建局部变量。需要修改全局变量时用 ``global`` 声明，需要修改外层函数变量时用 ``nonlocal`` 声明。

.. code-block:: python

   count = 0

   def increase():
       global count
       count += 1

   def make_counter():
       value = 0

       def step():
           nonlocal value
           value += 1
           return value

       return step

   increase()
   increase()
   print("全局计数：", count)

   counter = make_counter()
   print("连续调用：", counter(), counter(), counter())

输出结果：

.. code-block:: text

   全局计数： 2
   连续调用： 1 2 3

``make_counter()`` 返回的 ``step`` 函数记住了外层变量 ``value``，即使外层函数已经返回，``value`` 仍然保存在闭包里。每调用一次 ``make_counter()`` 都会创建一份独立的状态，因此不同的计数器互不影响。

七、递归
--------

递归是函数直接或间接调用自己。写好递归的关键是两件事：确定终止条件，保证问题规模每次都向终止条件靠近；确定递推关系，把大问题拆成同类的子问题。

.. code-block:: python

   def factorial(n):
       if n <= 1:
           return 1
       return n * factorial(n - 1)

   def fib(n):
       if n < 2:
           return n
       return fib(n - 1) + fib(n - 2)

   print("5! =", factorial(5))
   print("前 8 个斐波那契数：", [fib(i) for i in range(8)])

输出结果：

.. code-block:: text

   5! = 120
   前 8 个斐波那契数： [0, 1, 1, 2, 3, 5, 8, 13]

递归写法接近数学定义，可读性好，但每一层调用都会占用栈空间。层数过深会触发 ``RecursionError``，而朴素的斐波那契递归还会重复计算大量子问题。实际项目里可以用循环、缓存或 ``functools.lru_cache`` 来替代。

八、文档字符串
--------------

函数体的第一行如果是字符串字面量，它就会被当作文档字符串保存在 ``__doc__`` 属性里。文档字符串用于说明函数做什么、参数含义、返回值以及可能抛出的异常，是自动生成文档的主要来源。

.. code-block:: python

   def average(numbers):
       """返回一组数字的平均值。

       参数 numbers 必须是非空的可迭代对象。
       """
       return sum(numbers) / len(numbers)

   print("首行文档：", average.__doc__.splitlines()[0])
   print("计算结果：", average([2, 4, 6]))

输出结果：

.. code-block:: text

   首行文档： 返回一组数字的平均值。
   计算结果： 4.0

按惯例，首行用一句话概括功能，空一行后再写详细说明。多行文档字符串的结束引号单独占一行，缩进与开头保持一致。调用 ``help(average)`` 可以看到格式化后的完整说明。

九、类型注解
------------

类型注解写在参数名和返回值箭头后面，例如 ``text: str`` 与 ``-> str``。Python 不会在运行时强制检查这些注解，它们主要服务于阅读代码、IDE 补全和 ``mypy`` 之类的静态检查工具。

.. code-block:: python

   def repeat(text: str, times: int = 2) -> str:
       return text * times

   print(repeat("ab"))
   print(repeat("ab", 3))
   print("参数注解：", repeat.__annotations__["text"].__name__)
   print("返回注解：", repeat.__annotations__["return"].__name__)

输出结果：

.. code-block:: text

   abab
   ababab
   参数注解： str
   返回注解： str

注解保存在函数的 ``__annotations__`` 字典里，默认参数仍然照常生效。复杂类型可以借助 ``list[int]``、``dict[str, int]``、``Optional[str]`` 等写法表达，需要更精细的约束时再引入 ``typing`` 模块。

十、高阶函数简介
----------------

接受函数作为参数，或者把函数作为返回值的函数，称为高阶函数。Python 的函数是一等对象，可以赋值给变量、放进列表、当作参数传递。标准库里的 ``map()``、``filter()``、``sorted()`` 都接受函数参数。

.. code-block:: python

   def apply_twice(func, value):
       return func(func(value))

   def add_ten(n):
       return n + 10

   numbers = [3, 1, 4, 1, 5]
   print("连续加十：", apply_twice(add_ten, 5))
   print("平方：", list(map(lambda n: n * n, numbers)))
   print("偶数：", list(filter(lambda n: n % 2 == 0, numbers)))
   print("降序：", sorted(numbers, key=lambda n: -n))

输出结果：

.. code-block:: text

   连续加十： 25
   平方： [9, 1, 16, 1, 25]
   偶数： [4]
   降序： [5, 4, 3, 1, 1]

高阶函数把“做什么”与“怎么做”分开，适合把通用流程和具体操作组合起来。简单的变换用 ``lambda`` 很方便，逻辑稍复杂时就应该改成具名函数，或者直接用推导式和普通循环，避免一行里塞进太多表达式。

十一、练习任务
--------------

任务 1：编写判断素数的函数，并列出 2 到 19 之间的所有素数。

.. code-block:: python

   def is_prime(n):
       if n < 2:
           return False
       for divisor in range(2, int(n ** 0.5) + 1):
           if n % divisor == 0:
               return False
       return True

   print([n for n in range(2, 20) if is_prime(n)])

输出结果：

.. code-block:: text

   [2, 3, 5, 7, 11, 13, 17, 19]

任务 2：编写一个同时使用 ``*args`` 与 ``**kwargs`` 的函数，把若干商品拼成订单描述。

.. code-block:: python

   def format_order(*items, **options):
       prefix = options.get("prefix", "订单")
       return f"{prefix}：{'、'.join(items)}"

   print(format_order("苹果", "香蕉"))
   print(format_order("咖啡", "蛋糕", prefix="下午茶"))

输出结果：

.. code-block:: text

   订单：苹果、香蕉
   下午茶：咖啡、蛋糕

任务 3：用递归计算一个非负整数各位数字之和。

.. code-block:: python

   def digit_sum(n):
       if n < 10:
           return n
       return n % 10 + digit_sum(n // 10)

   print("2026 各位之和：", digit_sum(2026))
   print("999 各位之和：", digit_sum(999))

输出结果：

.. code-block:: text

   2026 各位之和： 10
   999 各位之和： 27
