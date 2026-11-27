Python 循环语句
================

.. meta::
   :group: 核心语法
   :summary: 掌握 while 与 for 两种循环、range 的三种形式、break/continue/pass、循环 else，以及 enumerate、zip、嵌套循环、字典遍历和遍历时修改列表的陷阱。

循环让程序重复执行同一段代码。Python 只有两种循环语句：``while`` 根据条件反复执行，``for`` 逐个取出可迭代对象中的元素。配合 ``break``、``continue`` 和循环的 ``else`` 分支，绝大多数重复逻辑都能写得清楚而简短。

本章从 ``while`` 讲起，再说明 ``for`` 与可迭代对象的关系，然后依次介绍 ``range``、跳转语句、``enumerate``、``zip``、嵌套循环、字典遍历，最后处理无限循环和遍历时修改列表这两个实际问题。

一、while 循环
--------------

``while`` 在条件为真时重复执行循环体，每轮开始前重新判断条件。循环体必须包含能让条件逐渐变为假的语句，否则会陷入死循环。下面的例子用倒计时累加，每一轮都修改 ``count``：

.. code-block:: python

   count = 5
   total = 0

   while count > 0:
       total += count
       print(f"倒计时 {count}，累计 {total}")
       count -= 1

   print("循环结束，total =", total)

输出结果：

.. code-block:: text

   倒计时 5，累计 5
   倒计时 4，累计 9
   倒计时 3，累计 12
   倒计时 2，累计 14
   倒计时 1，累计 15
   循环结束，total = 15

循环体靠缩进划分，``count -= 1`` 与 ``total += count`` 处于同一层，所以每轮都会执行。如果把 ``count -= 1`` 写到循环外面，条件永远为真，程序就会一直打印。

二、for 与可迭代对象
--------------------

``for`` 不依赖计数器，它直接从一个可迭代对象中逐个取元素。字符串、列表、元组、字典、集合、``range`` 对象、文件对象都是可迭代对象。循环变量只是当前元素的临时名字，循环结束后仍然保留最后一个值。

.. code-block:: python

   word = "Python"
   for ch in word:
       print(ch, end=" ")
   print()

   numbers = [3, 1, 4]
   for n in numbers:
       print(n * 2, end=" ")
   print()

   point = (2, 5)
   for value in point:
       print(value, end=" ")
   print()

   print("循环变量最后的值：", value)

输出结果：

.. code-block:: text

   P y t h o n
   6 2 8
   2 5
   循环变量最后的值： 5

``for`` 遍历的是“元素”而不是“下标”，这是 Python 与 C 系语言写法上最明显的区别。需要下标时不要手动维护计数器，用后面介绍的 ``enumerate()`` 更稳妥。

三、range 的三种形式
--------------------

``range()`` 生成一段等差数列，常见的有三种写法：``range(stop)`` 从 0 开始、到 ``stop`` 之前结束；``range(start, stop)`` 指定起点；``range(start, stop, step)`` 再指定步长。步长为负数时从大到小递减。

``range()`` 返回的是惰性对象，直接打印只能看到它的描述，需要查看内容时要套一层 ``list()``。它非常适合控制循环次数，也常直接传给 ``sum()``、``max()`` 等内置函数。

.. code-block:: python

   print("range(5)：", list(range(5)))
   print("range(2, 6)：", list(range(2, 6)))
   print("range(0, 10, 3)：", list(range(0, 10, 3)))
   print("range(5, 0, -1)：", list(range(5, 0, -1)))
   print("range(10, 0, -2)：", list(range(10, 0, -2)))

   total = sum(range(1, 101))
   print("1 到 100 的和：", total)

输出结果：

.. code-block:: text

   range(5)： [0, 1, 2, 3, 4]
   range(2, 6)： [2, 3, 4, 5]
   range(0, 10, 3)： [0, 3, 6, 9]
   range(5, 0, -1)： [5, 4, 3, 2, 1]
   range(10, 0, -2)： [10, 8, 6, 4, 2]
   1 到 100 的和： 5050

区间遵循“左闭右开”：``range(2, 6)`` 包含 2 但不包含 6。写 ``range(1, 101)`` 才能得到 1 到 100，这是初学时最容易差一的地方。

四、break、continue 与 pass
----------------------------

三个关键字的作用完全不同：``break`` 立即结束整个循环，``continue`` 跳过本轮剩余语句、直接进入下一轮，``pass`` 什么都不做，只用来占位，保证语法完整。下面的循环遇到 6 就退出，遇到偶数则跳过：

.. code-block:: python

   for n in range(1, 10):
       if n == 6:
           break
       if n % 2 == 0:
           continue
       print("奇数：", n)

   for n in range(3):
       if n == 1:
           pass
       print("pass 之后：", n)

输出结果：

.. code-block:: text

   奇数： 1
   奇数： 3
   奇数： 5
   pass 之后： 0
   pass 之后： 1
   pass 之后： 2

``pass`` 常见于先搭框架、后补逻辑的场合：函数体、类体或 ``if`` 分支暂时留空时，写一个 ``pass`` 就能通过语法检查。它不会改变程序的执行流程。

五、循环的 else
---------------

``for`` 和 ``while`` 都可以带 ``else`` 分支。这个分支在循环“正常结束”时执行；如果循环被 ``break`` 中断，``else`` 就会被跳过。它适合表达“找遍了都没有找到”这类逻辑，比额外设置标志变量更直观。

.. code-block:: python

   def find(numbers, target):
       for index, value in enumerate(numbers):
           if value == target:
               print(f"找到 {target}，下标 {index}")
               break
       else:
           print(f"没有找到 {target}")

   find([4, 8, 15, 16], 15)
   find([4, 8, 15, 16], 23)

   count = 3
   while count > 0:
       count -= 1
   else:
       print("while 正常结束，count =", count)

输出结果：

.. code-block:: text

   找到 15，下标 2
   没有找到 23
   while 正常结束，count = 0

``else`` 与 ``for`` 对齐，而不是与 ``if`` 对齐，阅读时要注意缩进层次。只要循环体里执行过 ``break``，``else`` 里的代码就不会运行。

六、enumerate 同时取下标
------------------------

遍历列表时经常需要“第几个”和“是什么”。手动维护计数器容易忘记自增，``enumerate()`` 可以在每次迭代时同时给出下标和元素。``start`` 参数决定编号起点，默认是 0。

.. code-block:: python

   fruits = ["apple", "banana", "cherry"]

   for index, fruit in enumerate(fruits):
       print(index, fruit)

   print("---")

   for index, fruit in enumerate(fruits, start=1):
       print(f"{index}. {fruit}")

输出结果：

.. code-block:: text

   0 apple
   1 banana
   2 cherry
   ---
   1. apple
   2. banana
   3. cherry

``enumerate()`` 返回的是 ``(下标, 元素)`` 元组，循环时可以直接解包成两个变量。需要生成带编号的报表、菜单或排行榜时，它比 ``range(len(fruits))`` 更清晰。

七、zip 并行遍历
----------------

``zip()`` 把多个可迭代对象“拉链式”配对，每次取出一组元素。只要有一个对象先耗尽，循环就停止，多余的元素会被忽略。它适合把姓名和成绩、日期和数值这类等长数据放在一起处理。

.. code-block:: python

   names = ["小明", "小红", "小刚"]
   scores = [92, 85, 78]

   for name, score in zip(names, scores):
       print(f"{name}：{score} 分")

   pairs = list(zip(names, scores))
   print(pairs)
   print("姓名：", [name for name, _ in pairs])

输出结果：

.. code-block:: text

   小明：92 分
   小红：85 分
   小刚：78 分
   [('小明', 92), ('小红', 85), ('小刚', 78)]
   姓名： ['小明', '小红', '小刚']

``zip()`` 在 Python 3 中返回迭代器，只能遍历一次；需要反复使用或查看内容时，先用 ``list()`` 保存下来。下划线 ``_`` 是约定俗成的“不关心的变量”，表示这里只需要姓名，不需要成绩。

八、嵌套循环
------------

循环里再写循环就是嵌套循环。外层每走一步，内层都要完整走一遍，因此总次数是两层循环次数的乘积。打印九九乘法表、处理二维表格、生成组合都属于典型场景。

.. code-block:: python

   for i in range(1, 4):
       row = []
       for j in range(1, 4):
           row.append(f"{i}×{j}={i * j}")
       print("  ".join(row))

   total = 0
   for i in range(1, 4):
       for j in range(1, 4):
           total += i * j
   print("所有乘积之和：", total)

输出结果：

.. code-block:: text

   1×1=1  1×2=2  1×3=3
   2×1=2  2×2=4  2×3=6
   3×1=3  3×2=6  3×3=9
   所有乘积之和： 36

内层循环负责一行中的各列，外层循环负责换行。嵌套层数越多，代码越难读，超过两层时通常应该考虑拆成函数，或者改用列表推导式。

九、遍历字典
------------

字典的遍历有三种视角：直接 ``for key in scores`` 得到键，``scores.items()`` 得到键值对，``scores.values()`` 只得到值。Python 3.7 之后字典保持插入顺序，所以输出顺序与定义顺序一致。

.. code-block:: python

   scores = {"语文": 88, "数学": 95, "英语": 79}

   for subject in scores:
       print(subject, end=" ")
   print()

   for subject, score in scores.items():
       print(f"{subject}：{score}")

   for score in scores.values():
       print(score, end=" ")
   print()

   print("总分：", sum(scores.values()))

输出结果：

.. code-block:: text

   语文 数学 英语
   语文：88
   数学：95
   英语：79
   88 95 79
   总分： 262

需要同时拿到键和值时用 ``items()``，它返回 ``(键, 值)`` 元组，可以直接解包。遍历字典时不要增加或删除键，否则会抛出 ``RuntimeError``；确实需要修改时，先复制出键的列表再遍历。

十、无限循环与退出
------------------

``while True`` 是最常见的无限循环写法，靠循环体里的 ``break`` 退出。服务端监听、命令行菜单、重试机制都采用这种结构。为了避免程序真的无法结束，通常还会设置次数上限或退出条件。

.. code-block:: python

   commands = ["start", "status", "quit", "start"]

   for command in commands:
       if command == "quit":
           print("收到 quit，退出循环")
           break
       print("执行命令：", command)
   else:
       print("命令列表处理完毕")

   attempts = 0
   while True:
       attempts += 1
       print("第", attempts, "次尝试")
       if attempts >= 3:
           print("达到上限，主动退出")
           break

输出结果：

.. code-block:: text

   执行命令： start
   执行命令： status
   收到 quit，退出循环
   第 1 次尝试
   第 2 次尝试
   第 3 次尝试
   达到上限，主动退出

第一段循环因为执行了 ``break``，所以 ``else`` 没有输出。真实程序里 ``while True`` 通常配合 ``try`` / ``except KeyboardInterrupt``，让用户按 ``Ctrl + C`` 时可以干净地退出。

十一、遍历时修改列表的坑
------------------------

在 ``for`` 循环中直接删除列表元素，很容易漏删或跳过元素。列表变短后，后面的元素整体前移，而迭代器仍然按原来的下标继续，某些元素就这样被跳过了。

.. code-block:: python

   numbers = [1, 2, 2, 3, 2, 4]

   for value in numbers:
       if value == 2:
           numbers.remove(value)
   print("直接删除：", numbers)

   numbers = [1, 2, 2, 3, 2, 4]
   for value in numbers[:]:
       if value == 2:
           numbers.remove(value)
   print("遍历副本：", numbers)

   numbers = [1, 2, 2, 3, 2, 4]
   numbers = [value for value in numbers if value != 2]
   print("重建列表：", numbers)

输出结果：

.. code-block:: text

   直接删除： [1, 3, 2, 4]
   遍历副本： [1, 3, 4]
   重建列表： [1, 3, 4]

直接删除后仍然剩下一个 ``2``。``numbers[:]`` 先复制一份列表，遍历的是副本，删除的是原列表，因此不会打乱遍历节奏；列表推导式则直接生成新列表，是更推荐的做法。

练习任务
--------

任务 1：用 ``while`` 循环实现辗转相除法，求两个整数的最大公约数。

.. code-block:: python

   a, b = 84, 36
   x, y = a, b

   while y:
       x, y = y, x % y

   print(f"{a} 和 {b} 的最大公约数是 {x}")

输出结果：

.. code-block:: text

   84 和 36 的最大公约数是 12

任务 2：输出 1 到 20 中能被 3 整除、但不能被 5 整除的数，并统计个数。

.. code-block:: python

   found = []

   for n in range(1, 21):
       if n % 3 != 0:
           continue
       if n % 5 == 0:
           continue
       found.append(n)

   print("结果：", found)
   print("个数：", len(found))

输出结果：

.. code-block:: text

   结果： [3, 6, 9, 12, 18]
   个数： 5

任务 3：用 ``zip()`` 配对姓名与成绩，按成绩从高到低输出名次。

.. code-block:: python

   names = ["小明", "小红", "小刚"]
   scores = [92, 85, 78]

   ranking = sorted(zip(names, scores), key=lambda item: item[1], reverse=True)

   for rank, (name, score) in enumerate(ranking, start=1):
       print(f"第 {rank} 名：{name}，{score} 分")

输出结果：

.. code-block:: text

   第 1 名：小明，92 分
   第 2 名：小红，85 分
   第 3 名：小刚，78 分
