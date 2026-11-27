Python 命名空间和作用域
=======================

.. meta::
   :group: 进阶
   :summary: 理解命名空间与 LEGB 查找顺序，掌握 global 与 nonlocal、闭包、模块命名空间、dir/locals/globals、变量生命周期，以及循环变量泄漏和可变默认值这两个常见陷阱。

名字是程序里最普通的元素，但“这个名字指向哪个对象”并不是一眼就能看出来的。Python 把名字存放在不同的命名空间里，查找时按固定的顺序逐层搜索；函数、类、模块各自拥有独立的命名空间，赋值语句又会改变名字的归属。很多看似诡异的行为，根源都在这里。

理解作用域之后，闭包、装饰器、模块导入、全局状态这些问题都会变得清晰。本章从命名空间的本质讲起，依次介绍 LEGB 规则、``global`` 与 ``nonlocal``、闭包、模块命名空间、内省函数、变量生命周期，最后分析两个初学者最常踩的坑。

一、命名空间
------------

命名空间（namespace）是从名字到对象的映射，在 CPython 中就是一个字典。模块有模块的命名空间，函数调用时会创建局部命名空间，类定义和实例也各有自己的命名空间。不同命名空间里的同名变量互不影响。

模块级的 ``globals()`` 返回当前模块的命名空间字典，函数内的 ``locals()`` 返回该次调用的局部名字：

.. code-block:: python

   title = "命名空间"
   count = 3


   def show(namespace, label):
       names = sorted(name for name in namespace if not name.startswith("__"))
       print(f"{label}：{names}")


   def local_demo():
       inner = "局部变量"
       show(locals(), "函数内名字")


   show(globals(), "模块级名字")
   local_demo()

输出结果：

.. code-block:: text

   模块级名字：['count', 'local_demo', 'show', 'title']
   函数内名字：['inner']

模块级命名空间里能看到 ``title``、``count`` 和两个函数名；进入 ``local_demo()`` 后，``locals()`` 里只有本次调用创建的 ``inner``。函数一返回，这个局部命名空间就被丢弃，里面的名字随之消失。

类与实例同样各自维护一份命名空间：

.. code-block:: python

   class Config:
       app_name = "demo"
       version = "1.0"

       def __init__(self, user):
           self.user = user
           self.options = {}


   config = Config("小明")

   print("类命名空间：", sorted(name for name in vars(Config) if not name.startswith("__")))
   print("实例命名空间：", sorted(vars(config)))
   print("通过实例读取类属性：", config.app_name)
   print("类命名空间里没有 user：", "user" in vars(Config))

输出结果：

.. code-block:: text

   类命名空间： ['app_name', 'version']
   实例命名空间： ['options', 'user']
   通过实例读取类属性： demo
   类命名空间里没有 user： False

``vars(Config)`` 里有类属性和方法，``vars(config)`` 里只有 ``__init__()`` 中通过 ``self`` 赋值的字段。读取 ``config.app_name`` 时，实例命名空间找不到，就继续到类命名空间里找，这条“实例优先、类兜底”的规则同样是一种作用域查找。

二、LEGB 查找规则
-----------------

Python 查找一个名字时，按 L、E、G、B 四个层次依次搜索，找到第一个就停止：

.. csv-table::
   :header: "层级", "查找位置", "例子"

   "L（Local）", "当前函数内部的局部名字", "函数参数、函数体内的赋值"
   "E（Enclosing）", "外层嵌套函数的局部名字", "闭包捕获的变量"
   "G（Global）", "当前模块的全局名字", "模块顶层定义的变量"
   "B（Built-in）", "内置命名空间", "``len``、``print``、``ValueError``"

内层函数可以读取外层的变量，函数内也可以使用全局变量和内置函数。但一旦在函数体内对某个名字赋值，这个名字在整个函数内都会被当作局部变量，除非显式声明 ``global`` 或 ``nonlocal``：

.. code-block:: python

   message = "全局 message"


   def outer():
       message = "外层 message"

       def inner():
           return f"inner 读到：{message}"

       return inner()


   def shadow_builtin():
       len = 3
       return len


   print(outer())
   print("全局 message：", message)
   print("内置 len：", len("python"))
   print("遮蔽内置 len：", shadow_builtin())
   print("全局 len 未受影响：", len("abc"))

输出结果：

.. code-block:: text

   inner 读到：外层 message
   全局 message： 全局 message
   内置 len： 6
   遮蔽内置 len： 3
   全局 len 未受影响： 3

``inner()`` 先在自己的局部范围找 ``message``，没找到就去外层 ``outer()`` 的命名空间找，因此读到“外层 message”，不会继续去全局范围取同名变量。``shadow_builtin()`` 里的 ``len = 3`` 创建了一个局部变量，在函数内部完全遮蔽了内置的 ``len``，但函数返回后内置函数照常可用。

更麻烦的是，函数体内只要出现赋值，这个名字在整个函数范围内都会被当作局部变量，即使赋值语句写在读取之后。编译器在编译函数体时看到 ``total = 200``，就会把 ``total`` 标记为局部变量；执行到前面的 ``print`` 时局部变量尚未绑定，于是抛出 ``UnboundLocalError``，而不是去读全局的 100。这是 LEGB 规则最容易让人困惑的地方，下一节会结合 ``global`` 一起演示。

三、global 与 nonlocal
----------------------

``global`` 声明让函数内的赋值作用于模块级名字，而不是新建局部变量。修改全局计数器是它最典型的用途。反过来，函数内只读取全局变量不需要任何声明；但一旦执行了赋值，该名字就变成局部变量，读取发生在赋值之前便会抛 ``UnboundLocalError``：

.. code-block:: python

   counter = 0


   def increase(step=1):
       global counter
       counter += step
       return counter


   print(increase())
   print(increase(4))
   print("全局 counter：", counter)

   total = 100


   def broken():
       print("函数内部先读取：", total)
       total = 200


   try:
       broken()
   except UnboundLocalError:
       print("捕获 UnboundLocalError：赋值让 total 变成局部变量")

   print("全局 total 仍为：", total)


   def fixed():
       global total
       total = 200
       return total


   print("修复后：", fixed())
   print("全局 total：", total)

输出结果：

.. code-block:: text

   1
   5
   全局 counter： 5
   捕获 UnboundLocalError：赋值让 total 变成局部变量
   全局 total 仍为： 100
   修复后： 200
   全局 total： 200

``global`` 只影响赋值行为，读取全局变量本来就不需要声明。它也是一把双刃剑：函数会隐式依赖并修改外部状态，调用次数、调用顺序都会影响结果，测试和并发场景下尤其难以推理。能用参数和返回值表达的逻辑，尽量不要用全局变量。

``nonlocal`` 用于内层函数修改外层函数的局部变量，它不会一直找到模块级：

.. code-block:: python

   def make_counter(start=0):
       count = start

       def step(amount=1):
           nonlocal count
           count += amount
           return count

       return step


   counter_a = make_counter()
   counter_b = make_counter(10)

   print(counter_a())
   print(counter_a(2))
   print(counter_b(5))
   print("counter_a 当前值：", counter_a())
   print("counter_b 当前值：", counter_b())

输出结果：

.. code-block:: text

   1
   3
   15
   counter_a 当前值： 4
   counter_b 当前值： 16

每个 ``make_counter()`` 调用都会创建独立的 ``count``，两个闭包各自维护自己的计数，互不干扰。如果去掉 ``nonlocal``，``count += amount`` 会被当成局部赋值，第一次执行就抛 ``UnboundLocalError``；如果改用 ``global``，两个计数器反而会共享同一个全局变量。

四、闭包
--------

闭包是“函数 + 它引用的外层变量”的组合。内层函数没有立即执行，而是被返回或保存下来，外层函数已经结束，但它捕获的变量仍然存活，供内层函数以后使用。

.. code-block:: python

   def make_multiplier(factor):
       def multiply(number):
           return number * factor

       return multiply


   double = make_multiplier(2)
   triple = make_multiplier(3)

   print("double(5)：", double(5))
   print("triple(5)：", triple(5))
   print("闭包变量：", double.__closure__[0].cell_contents)
   print("函数名：", double.__name__)

输出结果：

.. code-block:: text

   double(5)： 10
   triple(5)： 15
   闭包变量： 2
   函数名： multiply

``double.__closure__`` 保存着被捕获的变量，每个 cell 的 ``cell_contents`` 就是当前值。闭包让“带配置的函数”不必依赖全局变量，也不需要写一个只保存单个字段的类。

闭包捕获的是变量本身，而不是创建时的快照。多个内层函数可以共享同一份外层状态：

.. code-block:: python

   def make_cache():
       store = {}

       def remember(key, value):
           store[key] = value
           return len(store)

       def lookup(key):
           return store.get(key, "未找到")

       return remember, lookup


   remember, lookup = make_cache()
   print("写入后条目数：", remember("a", 1))
   print("写入后条目数：", remember("b", 2))
   print("读取 a：", lookup("a"))
   print("读取 c：", lookup("c"))
   print("共享同一个 store：", remember("c", 3), lookup("c"))

输出结果：

.. code-block:: text

   写入后条目数： 1
   写入后条目数： 2
   读取 a： 1
   读取 c： 未找到
   共享同一个 store： 3 3

``remember`` 与 ``lookup`` 引用的是同一个 ``store`` 字典，因此一个写入、另一个立刻能读到。正因为捕获的是变量而非值，循环中创建的多个闭包如果引用同一个循环变量，最终都会看到循环结束后的值，这一点在第八节会详细说明。

五、模块命名空间
----------------

每个 ``.py`` 文件在导入后都会变成一个模块对象，模块对象有自己的命名空间字典。``import math`` 只是把模块对象绑定到当前命名空间的 ``math`` 名字上，模块内部的函数仍然待在自己的命名空间里，通过 ``math.sqrt`` 这样的属性访问取得。

.. code-block:: python

   import math


   print("pi：", math.pi)
   print("sqrt(16)：", math.sqrt(16))
   print("math 命名空间包含 pi：", "pi" in vars(math))
   print("模块名：", math.__name__)

   from math import sqrt

   print("直接导入后可用：", sqrt(25))
   print("sqrt 已成为全局名字：", "sqrt" in globals())

输出结果：

.. code-block:: text

   pi： 3.141592653589793
   sqrt(16)： 4.0
   math 命名空间包含 pi： True
   模块名： math
   直接导入后可用： 5.0
   sqrt 已成为全局名字： True

``from math import sqrt`` 把 ``sqrt`` 直接复制到当前模块的命名空间，之后可以不加前缀调用，但也更容易和本地变量重名。工程代码通常优先使用 ``import 模块名``，让名字来源一目了然；确实需要简化时，再用 ``import numpy as np`` 这类约定俗成的别名。

模块命名空间就是一个普通字典，可以用 ``types.ModuleType`` 手动创建：

.. code-block:: python

   import types

   module = types.ModuleType("tools")
   module.version = "1.0"
   module.author = "小明"

   print("模块名：", module.__name__)
   print("模块字典：", sorted(name for name in vars(module) if not name.startswith("__")))
   print("读取属性：", module.version)

   module.version = "2.0"
   print("修改后：", getattr(module, "version"))
   print("是 ModuleType 实例：", isinstance(module, types.ModuleType))

输出结果：

.. code-block:: text

   模块名： tools
   模块字典： ['author', 'version']
   读取属性： 1.0
   修改后： 2.0
   是 ModuleType 实例： True

给模块对象赋属性，等价于往它的命名空间字典里写键值对；访问 ``module.version`` 则是在这个字典里查名字。理解这一点，就能明白为什么模块级变量天然是“全局”的，也能明白动态注册插件时为什么可以直接往模块对象上挂函数。

六、dir、locals 与 globals
--------------------------

Python 提供了几个内省函数，用来观察当前有哪些名字：

* ``locals()`` 返回当前局部命名空间的字典。
* ``globals()`` 返回当前模块全局命名空间的字典。
* ``vars(obj)`` 返回对象的 ``__dict__``，对模块、类、实例都适用。
* ``dir(obj)`` 返回对象可访问名字的排序列表，包含继承来的属性，适合探索 API。

.. code-block:: python

   import builtins

   city = "上海"
   population = 2487


   def inspect_scope(extra):
       local_value = extra * 2
       return sorted(locals()), local_value


   names, result = inspect_scope(10)
   print("函数局部名字：", names)
   print("计算结果：", result)
   print("globals 包含 city：", "city" in globals())
   print("通过 globals 取值：", globals()["city"])
   print("dir 包含 print：", "print" in dir(builtins))
   print("内置名字片段：", [name for name in dir(builtins) if name in ("len", "print", "sum")])

输出结果：

.. code-block:: text

   函数局部名字： ['extra', 'local_value']
   计算结果： 20
   globals 包含 city： True
   通过 globals 取值： 上海
   dir 包含 print： True
   内置名字片段： ['len', 'print', 'sum']

``locals()`` 在函数内部返回的是当前绑定的快照，修改它通常不会影响真正的局部变量，不应把它当作动态作用域的工具。``globals()`` 返回的则是真实的模块字典，通过 ``globals()["name"] = value`` 确实可以创建全局变量，但这种写法会让名字来源变得难以追踪，除非写框架或调试工具，否则不建议使用。

七、变量生命周期
----------------

变量的生命周期取决于它所属的命名空间。函数调用开始时创建局部命名空间，调用结束时销毁；模块级名字从模块加载一直存活到解释器退出；被闭包捕获的变量则会延长到闭包本身被回收为止。

.. code-block:: python

   def create_message():
       text = "临时消息"
       print("函数内部：", text)
       return len(text)


   length = create_message()
   print("返回长度：", length)

   try:
       print(text)
   except NameError:
       print("函数结束后 text 已消失")

   print("text 是否在全局：", "text" in globals())


   def keep_reference():
       data = [1, 2, 3]
       return data


   numbers = keep_reference()
   print("返回后仍然可用：", numbers)
   print("numbers 在全局：", "numbers" in globals())

输出结果：

.. code-block:: text

   函数内部： 临时消息
   返回长度： 4
   函数结束后 text 已消失
   text 是否在全局： False
   返回后仍然可用： [1, 2, 3]
   numbers 在全局： True

函数返回后，局部变量 ``text`` 随命名空间一起消失，再访问就是 ``NameError``。但如果函数把对象作为返回值交给调用方，对象本身不会消失，只是换了一个名字 ``numbers`` 继续被引用。Python 的垃圾回收依据是引用计数加循环检测，名字只是引用的一种，对象活多久取决于还有没有引用指向它。

八、循环变量泄漏与可变默认值
----------------------------

Python 的 ``for`` 循环不会创建新的作用域，循环变量在循环结束后依然留在当前命名空间里。列表推导式则不同，它在 Python 3 中拥有自己的作用域，内部的循环变量不会泄漏到外面：

.. code-block:: python

   for index in range(3):
       pass

   print("循环结束后 index：", index)
   print("index 仍在全局：", "index" in globals())

   squares = [n * n for n in range(5)]
   print("推导式结果：", squares)

   try:
       print(n)
   except NameError:
       print("推导式变量 n 不会泄漏")

   value = 0
   for value in range(2):
       pass
   print("循环变量 value：", value)

   pairs = [value * 10 for value in range(3)]
   print("推导式结果：", pairs)
   print("推导式后 value 不变：", value)

输出结果：

.. code-block:: text

   循环结束后 index： 2
   index 仍在全局： True
   推导式结果： [0, 1, 4, 9, 16]
   推导式变量 n 不会泄漏
   循环变量 value： 1
   推导式结果： [0, 10, 20]
   推导式后 value 不变： 1

循环变量泄漏本身不算错误，但会带来两个隐患：一是无意中覆盖了同名的外部变量，二是循环结束后仍然能读到一个“最后一次迭代”的值，让逻辑边界变得模糊。把循环包进函数，或者改用推导式，都能有效限制作用域。

另一个更隐蔽的陷阱是可变默认参数。函数的默认值只在定义时求值一次，之后所有调用共享同一个对象：

.. code-block:: python

   def add_item(item, bucket=[]):
       bucket.append(item)
       return bucket


   print("第一次：", add_item("a"))
   print("第二次：", add_item("b"))
   print("第三次：", add_item("c"))


   def add_item_safe(item, bucket=None):
       if bucket is None:
           bucket = []
       bucket.append(item)
       return bucket


   print("修复后第一次：", add_item_safe("a"))
   print("修复后第二次：", add_item_safe("b"))
   print("传入已有列表：", add_item_safe("c", ["x"]))

输出结果：

.. code-block:: text

   第一次： ['a']
   第二次： ['a', 'b']
   第三次： ['a', 'b', 'c']
   修复后第一次： ['a']
   修复后第二次： ['b']
   传入已有列表： ['x', 'c']

``bucket=[]`` 只在 ``def`` 执行时创建一次，之后每次省略参数都复用这个列表，元素越积越多。正确写法是用 ``None`` 作为哨兵，在函数体内判断并新建列表；这样既保留了“参数可省略”的便利，又不会在调用之间共享状态。同样的规则适用于字典、集合等所有可变默认值。

九、练习任务
------------

任务 1：用闭包实现一个账户，``deposit()`` 与 ``withdraw()`` 共享余额和交易记录，``report()`` 返回当前状态。

.. code-block:: python

   def make_account(balance):
       history = []

       def deposit(amount):
           nonlocal balance
           balance += amount
           history.append(("存入", amount))
           return balance

       def withdraw(amount):
           nonlocal balance
           if amount > balance:
               print("余额不足，操作取消")
               return balance
           balance -= amount
           history.append(("取出", amount))
           return balance

       def report():
           return history, balance

       return deposit, withdraw, report


   deposit, withdraw, report = make_account(100)
   print(deposit(50))
   print(withdraw(30))
   print(withdraw(500))
   print(report())

输出结果：

.. code-block:: text

   150
   120
   余额不足，操作取消
   120
   ([('存入', 50), ('取出', 30)], 120)

任务 2：统计全局访问次数，并观察 ``global`` 声明与未定义名字抛出的 ``NameError``。

.. code-block:: python

   visits = 0


   def visit(name):
       global visits
       visits += 1
       return f"第 {visits} 位访客：{name}"


   print(visit("小明"))
   print(visit("小红"))

   try:
       print(count)
   except NameError:
       print("未定义的 count 触发 NameError")

   for count in range(3):
       pass

   print("循环后 count 留存：", count)

输出结果：

.. code-block:: text

   第 1 位访客：小明
   第 2 位访客：小红
   未定义的 count 触发 NameError
   循环后 count 留存： 2

任务 3：修正可变默认参数，并用默认参数固定循环中创建的闭包所引用的值。

.. code-block:: python

   def collect_scores(subject, scores=None):
       if scores is None:
           scores = []
       scores.append(subject)
       return scores


   print(collect_scores("语文"))
   print(collect_scores("数学"))
   print(collect_scores("英语", ["物理"]))

   functions = []
   for factor in [2, 3, 4]:
       functions.append(lambda number, factor=factor: number * factor)

   print([func(10) for func in functions])
   print("循环变量最终值：", factor)

输出结果：

.. code-block:: text

   ['语文']
   ['数学']
   ['物理', '英语']
   [20, 30, 40]
   循环变量最终值： 4
