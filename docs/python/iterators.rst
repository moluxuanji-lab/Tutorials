Python 迭代器与生成器
======================

.. meta::
   :group: 进阶
   :summary: 理解可迭代对象与迭代器的区别，掌握 iter、next、StopIteration、自定义迭代器、yield 生成器、send/throw/close、无限生成器与 itertools 常用工具。

迭代是 Python 处理数据的基本方式。``for`` 循环、列表推导式、``sum()``、``max()`` 等内置函数之所以能接受列表、字符串、字典、文件等不同对象，是因为它们都遵循同一套迭代协议：先通过 ``iter()`` 取得迭代器，再不断用 ``next()`` 取出元素，直到抛出 ``StopIteration``。

生成器把“写一个迭代器类”简化为“写一个带 ``yield`` 的函数”。函数执行到 ``yield`` 时暂停，保留局部变量和当前位置，下一次取值时从暂停处继续。这种惰性求值机制让程序可以逐个处理元素，而不必先把全部数据装进内存。

本章从迭代协议讲起，依次介绍 ``iter()``、``next()``、自定义迭代器类、``yield`` 生成器、生成器表达式、``send()`` / ``throw()`` / ``close()``、无限生成器与 ``itertools``，最后用练习巩固。

一、可迭代对象与迭代器
----------------------

可迭代对象（iterable）是“可以被遍历”的对象，它实现了 ``__iter__()``，能返回一个迭代器。迭代器（iterator）是“负责一次遍历”的对象，它实现了 ``__next__()``，每次调用返回下一个元素，没有元素时抛出 ``StopIteration``。

列表、字符串、元组、字典、集合、``range`` 都是可迭代对象，但它们本身不是迭代器；对它们调用 ``iter()`` 才会得到一个独立的迭代器：

.. code-block:: python

   numbers = [1, 2, 3]
   text = "abc"

   print("列表可迭代：", hasattr(numbers, "__iter__"))
   print("列表是迭代器：", hasattr(numbers, "__next__"))

   number_iter = iter(numbers)
   print("迭代器可迭代：", hasattr(number_iter, "__iter__"))
   print("迭代器有 __next__：", hasattr(number_iter, "__next__"))
   print("迭代器类型：", type(number_iter).__name__)

   print("range 类型：", type(range(3)).__name__)
   print("生成器表达式类型：", type(n for n in numbers).__name__)

输出结果：

.. code-block:: text

   列表可迭代： True
   列表是迭代器： False
   迭代器可迭代： True
   迭代器有 __next__： True
   迭代器类型： list_iterator
   range 类型： range
   生成器表达式类型： generator

迭代器必须同时实现 ``__iter__()`` 和 ``__next__()``，其中 ``__iter__()`` 通常直接返回 ``self``。这意味着迭代器一定是可迭代对象，但可迭代对象不一定是迭代器。列表可以反复遍历，每次 ``for`` 都会创建新的迭代器；迭代器则是一次性的，遍历完就耗尽。

二、iter()、next() 与 StopIteration
-----------------------------------

``iter()`` 负责从可迭代对象取得迭代器，``next()`` 负责取出下一个元素。手动调用这两个函数，可以把 ``for`` 循环背后的动作完整地展示出来：

.. code-block:: python

   values = [10, 20, 30]
   it = iter(values)

   print(next(it))
   print(next(it))
   print(next(it))

   try:
       print(next(it))
   except StopIteration:
       print("迭代结束：StopIteration")

   for value in [1, 2]:
       print("for 取到：", value)

输出结果：

.. code-block:: text

   10
   20
   30
   迭代结束：StopIteration
   for 取到： 1
   for 取到： 2

``next()`` 可以传入第二个参数作为默认值，这样耗尽时不再抛异常，而是返回默认值。例如 ``next(it, None)`` 在迭代结束时返回 ``None``。``for`` 循环之所以能正常结束，就是因为它内部捕获了 ``StopIteration`` 并静默退出。

三、自定义迭代器类
------------------

只要实现 ``__iter__()`` 和 ``__next__()``，任何类都可以成为迭代器。下面用一个倒计时类演示完整写法：``__init__()`` 保存状态，``__iter__()`` 返回自身，``__next__()`` 在状态耗尽时抛出 ``StopIteration``。

.. code-block:: python

   class Countdown:
       def __init__(self, start):
           self.current = start

       def __iter__(self):
           return self

       def __next__(self):
           if self.current <= 0:
               raise StopIteration
           value = self.current
           self.current -= 1
           return value

   print("类型：", type(Countdown(3)).__name__)
   print(list(Countdown(4)))

   for number in Countdown(3):
       print("倒计时", number)

   countdown = Countdown(2)
   print("第一次：", list(countdown))
   print("第二次：", list(countdown))

输出结果：

.. code-block:: text

   类型： Countdown
   [4, 3, 2, 1]
   倒计时 3
   倒计时 2
   倒计时 1
   第一次： [2, 1]
   第二次： []

第二次得到空列表，是因为 ``current`` 已经减到 0，迭代器无法重置。需要反复遍历时，应该让 ``__iter__()`` 每次返回一个新的迭代器对象，而不是返回 ``self``；这也是“可迭代对象”和“迭代器”分离的常见做法。

四、yield 生成器
----------------

生成器函数用 ``yield`` 代替 ``return``。调用生成器函数不会立即执行函数体，而是返回一个生成器对象；每次 ``next()`` 才推进到下一个 ``yield``，函数在这里暂停，局部变量保持不变：

.. code-block:: python

   def countdown(start):
       while start > 0:
           yield start
           start -= 1

   print("类型：", type(countdown(3)).__name__)
   print("列表：", list(countdown(4)))

   gen = countdown(2)
   print(next(gen))
   print(next(gen))

   try:
       next(gen)
   except StopIteration:
       print("生成器已耗尽")

输出结果：

.. code-block:: text

   类型： generator
   列表： [4, 3, 2, 1]
   2
   1
   生成器已耗尽

生成器同样是一次性的。``list(countdown(4))`` 和随后的 ``countdown(2)`` 是两个独立对象，互不影响；而同一个生成器对象被 ``list()`` 消费后，再次遍历只能得到空结果。

多个生成器可以串联成流水线：上游负责生产，中间负责筛选，下游负责变换，数据按需流动，不会产生中间列表：

.. code-block:: python

   def read_numbers(limit):
       for n in range(1, limit + 1):
           yield n

   def keep_even(numbers):
       for n in numbers:
           if n % 2 == 0:
               yield n

   def square(numbers):
       for n in numbers:
           yield n * n

   pipeline = square(keep_even(read_numbers(10)))
   print(list(pipeline))

输出结果：

.. code-block:: text

   [4, 16, 36, 64, 100]

流水线中的每个 ``yield`` 都只处理一个元素，随后把控制权交还调用方。这种写法适合处理日志、文件行、网络流等数据量不确定的输入。

五、生成器表达式
----------------

把列表推导式的方括号换成圆括号，就得到生成器表达式。它不会一次性构建列表，而是返回一个生成器对象，按需计算每个元素：

.. code-block:: python

   squares = (n * n for n in range(1, 6))
   print("类型：", type(squares).__name__)
   print("第一个：", next(squares))
   print("剩余：", list(squares))

   total = sum(n * n for n in range(1, 101))
   print("平方和：", total)

输出结果：

.. code-block:: text

   类型： generator
   第一个： 1
   剩余： [4, 9, 16, 25]
   平方和： 338350

生成器表达式适合“只遍历一次”的场景，尤其是作为 ``sum()``、``max()``、``any()`` 等函数的实参时，可以省略一层括号。它不支持 ``len()`` 和下标访问，也不能重复遍历；需要多次使用或查看全部结果时，仍然应该构建列表。

六、send()、throw() 与 close()
------------------------------

生成器不仅能向外产出值，还能接收调用方送进来的值。``yield`` 本身是一个表达式，``send(value)`` 会把 ``value`` 赋给暂停处的 ``yield``，并推进到下一个 ``yield``。第一次使用 ``send()`` 前必须先调用一次 ``next()``，让生成器运行到第一个 ``yield``，这一步通常称为“预激活”。

.. code-block:: python

   def accumulator():
       received = []
       try:
           while True:
               value = yield
               if value is None:
                   break
               received.append(value)
               print("收到：", value)
       finally:
           print("累计：", received)
           print("清理完成")

   gen = accumulator()
   next(gen)
   gen.send(10)
   gen.send(20)
   gen.close()
   print("生成器已关闭：", gen.gi_frame is None)

输出结果：

.. code-block:: text

   收到： 10
   收到： 20
   累计： [10, 20]
   清理完成
   生成器已关闭： True

``close()`` 会在暂停处抛出 ``GeneratorExit``，生成器应当捕获它或通过 ``finally`` 完成清理，然后退出。上面把统计逻辑放在 ``finally`` 里，所以无论正常结束还是被关闭，累计结果都会打印。

``throw()`` 则把指定异常注入生成器内部，由生成器里的 ``try`` / ``except`` 决定如何处理。如果生成器没有捕获该异常，它会继续向外传播；如果捕获后函数结束，``throw()`` 最终会抛出 ``StopIteration``：

.. code-block:: python

   def guarded():
       try:
           while True:
               value = yield
               print("处理：", value)
       except ValueError as error:
           print("捕获到 ValueError：", error)
       finally:
           print("清理完成")

   gen = guarded()
   next(gen)
   gen.send("正常数据")

   try:
       gen.throw(ValueError("数据不合法"))
   except StopIteration:
       print("生成器已结束")

   print("生成器已关闭：", gen.gi_frame is None)

输出结果：

.. code-block:: text

   处理： 正常数据
   捕获到 ValueError： 数据不合法
   清理完成
   生成器已结束
   生成器已关闭： True

这三个方法让生成器可以充当协程的雏形：``send()`` 传入数据，``throw()`` 传入错误，``close()`` 通知结束。现代异步编程中的 ``async`` / ``await`` 就是在类似机制上发展起来的。

七、无限生成器与 islice
-----------------------

生成器不必有终点。只要在 ``while True`` 中不断 ``yield``，就能描述一个无限序列；调用方用 ``itertools.islice()`` 截取需要的部分，避免真的无限执行下去：

.. code-block:: python

   from itertools import islice

   def natural_numbers():
       n = 1
       while True:
           yield n
           n += 1

   def fibonacci():
       a, b = 0, 1
       while True:
           yield a
           a, b = b, a + b

   numbers = natural_numbers()
   print("前 5 个自然数：", list(islice(numbers, 5)))
   print("接着 3 个：", list(islice(numbers, 3)))
   print("下一个：", next(numbers))

   print("前 8 个斐波那契数：", list(islice(fibonacci(), 8)))

输出结果：

.. code-block:: text

   前 5 个自然数： [1, 2, 3, 4, 5]
   接着 3 个： [6, 7, 8]
   下一个： 9
   前 8 个斐波那契数： [0, 1, 1, 2, 3, 5, 8, 13]

``islice()`` 只消费指定数量的元素，生成器会保留当前状态，所以第二次截取从 6 开始。绝对不要对无限生成器直接调用 ``list()`` 或写不带 ``break`` 的 ``for`` 循环，否则程序会一直运行到内存耗尽。

八、内存优势
------------

列表会把所有元素同时保存在内存里，生成器只在需要时计算当前元素。处理一百万个数时，列表需要为每个整数分配对象和指针，生成器始终只保留一个当前值：

.. code-block:: python

   def square_numbers(limit):
       for n in range(1, limit + 1):
           yield n * n

   total = sum(square_numbers(1_000_000))
   print("求和结果：", total)
   print("处理数量：", 1_000_000)

   squares = square_numbers(1_000_000)
   print("前三个：", [next(squares) for _ in range(3)])

输出结果：

.. code-block:: text

   求和结果： 333333833333500000
   处理数量： 1000000
   前三个： [1, 4, 9]

``sum()`` 逐个消费生成器，内存占用与数据总量无关，只与当前元素有关。如果先写出 ``[n * n for n in range(1, 1_000_001)]``，程序会先分配一个包含一百万个整数的大列表，再求和，峰值内存高出许多。逐行读取大文件、处理数据库游标、解析网络流，都应该优先考虑生成器。

九、itertools 常用工具
----------------------

``itertools`` 是标准库中专门处理迭代的工具模块，所有函数都返回惰性迭代器。它提供的组合、切片、分组能力，可以替代大量手写循环。

count、cycle 与 islice
~~~~~~~~~~~~~~~~~~~~~~

``count(start, step)`` 生成无限等差数列，``cycle(iterable)`` 把序列无限重复，``islice(iterable, stop)`` 或 ``islice(iterable, start, stop, step)`` 负责截取。三者都只按需计算，不会预先展开：

.. code-block:: python

   from itertools import count, cycle, islice

   counter = count(start=10, step=5)
   print("count：", list(islice(counter, 4)))

   colors = cycle(["红", "绿", "蓝"])
   print("cycle：", list(islice(colors, 7)))

   print("islice 步长：", list(islice(range(1, 20), 0, 10, 3)))

输出结果：

.. code-block:: text

   count： [10, 15, 20, 25]
   cycle： ['红', '绿', '蓝', '红', '绿', '蓝', '红']
   islice 步长： [1, 4, 7, 10]

``islice()`` 不支持负数索引，也不能从后往前截取，这是它为了保持惰性而做出的限制。需要随机访问或反向切片时，应该先把数据转成列表。

chain 与 groupby
~~~~~~~~~~~~~~~~~

``chain()`` 把多个可迭代对象首尾相接，形成一个连续的迭代器；``groupby()`` 按指定的键把相邻元素分组。``groupby()`` 只合并“连续”的相同键，数据没有按关键字段排好序时，同一组会被拆成多段：

.. code-block:: python

   from itertools import chain, groupby

   letters = chain(["a", "b"], ["c"], "de")
   print("chain：", list(letters))

   data = [
       ("水果", "苹果"),
       ("水果", "香蕉"),
       ("蔬菜", "白菜"),
       ("蔬菜", "萝卜"),
       ("水果", "橙子"),
   ]

   for category, group in groupby(data, key=lambda item: item[0]):
       print(category, [item[1] for item in group])

   sorted_data = sorted(data, key=lambda item: item[0])
   for category, group in groupby(sorted_data, key=lambda item: item[0]):
       print("排序后", category, len(list(group)))

输出结果：

.. code-block:: text

   chain： ['a', 'b', 'c', 'd', 'e']
   水果 ['苹果', '香蕉']
   蔬菜 ['白菜', '萝卜']
   水果 ['橙子']
   排序后 水果 3
   排序后 蔬菜 2

第一次分组出现了两个“水果”，就是因为中间隔着“蔬菜”。希望同一类元素聚在一起时，必须先按相同的键排序，再交给 ``groupby()``。另外，每个分组本身也是迭代器，遍历完就失效，需要保留时应当转换成列表。

十、练习任务
------------

任务 1：写一个生成器函数，产出 1 到 ``limit`` 中所有能被 3 整除的数的平方，并用 ``islice()`` 只取前 5 个。

.. code-block:: python

   from itertools import islice

   def divisible_squares(limit):
       for n in range(1, limit + 1):
           if n % 3 == 0:
               yield n * n

   print(list(divisible_squares(30)))
   print(list(islice(divisible_squares(1_000_000), 5)))

输出结果：

.. code-block:: text

   [9, 36, 81, 144, 225, 324, 441, 576, 729, 900]
   [9, 36, 81, 144, 225]

任务 2：用 ``count()`` 与 ``islice()`` 生成前 8 个 3 的倍数，用 ``chain()`` 拼接结束标记，再按单词长度分组。

.. code-block:: python

   from itertools import chain, count, groupby, islice

   multiples = islice(count(start=3, step=3), 8)
   print(list(chain(multiples, ["结束"])))

   words = ["fig", "apple", "kiwi", "banana", "pear"]
   for length, group in groupby(sorted(words, key=len), key=len):
       print(length, list(group))

输出结果：

.. code-block:: text

   [3, 6, 9, 12, 15, 18, 21, 24, '结束']
   3 ['fig']
   4 ['kiwi', 'pear']
   5 ['apple']
   6 ['banana']
