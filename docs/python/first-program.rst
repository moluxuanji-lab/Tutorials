Python 编程第一步
==================

.. meta::
   :group: 核心语法
   :summary: 从三个小需求出发，把变量、循环、条件与函数串成完整程序，体验需求拆解、逻辑实现、函数封装和输出格式化的迭代过程。

读完变量、类型、条件和循环之后，最需要的是把它们组合起来，写出一个真正能解决问题的小程序。本章用斐波那契数列、温度转换和猜数字三个例子，演示同一条改进路径：先明确需求，再拆出变量与逻辑，然后封装成函数，最后打磨输出。

三个阶段的目标不同。脚本式写法追求“先跑起来”，函数式写法追求“能复用、能验证、能扩展”。下面的每一段代码都可以单独运行，观察输出后再修改参数，是理解程序结构最快的方式。

一、需求与脚本式写法
--------------------

第一个需求是输出斐波那契数列的前 10 项。数列从 0 和 1 开始，之后每一项都等于前两项之和，所以前十项是 0、1、1、2、3、5、8、13、21、34。

最直接的做法是准备两个变量保存相邻两项，循环 10 次，每次打印较小的那一项，再同时向后移动：

.. code-block:: python

   a, b = 0, 1

   for _ in range(10):
       print(a, end=" ")
       a, b = b, a + b

   print()

输出结果：

.. code-block:: text

   0 1 1 2 3 5 8 13 21 34

``a, b = b, a + b`` 是 Python 的元组解包：等号右边先算出一个新元组，再分别赋给左边两个名字，因此不会出现“先改 ``a`` 导致 ``b`` 算错”的问题。下划线 ``_`` 表示循环变量用不到，只是用来计数。

二、提取变量与逻辑
------------------

脚本能跑，但 10 这个数字写死在 ``range()`` 里，结果也只打印一次。想让程序可调整，先把“要多少项”提取成变量，再用列表把结果保存下来。这样既能查看整段数列，也能继续做统计。

.. code-block:: python

   count = 10
   numbers = []
   a, b = 0, 1

   for _ in range(count):
       numbers.append(a)
       a, b = b, a + b

   print(numbers)
   print("项数：", len(numbers))
   print("第 10 项：", numbers[9])

输出结果：

.. code-block:: text

   [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
   项数： 10
   第 10 项： 34

这一步把“生成”和“展示”分开了：循环只负责往 ``numbers`` 里放数据，打印语句放在循环外面。数据一旦保存下来，求长度、取某一项、传给其他函数都变得很容易。

三、封装成函数
--------------

变量和逻辑都清楚了，就可以封装成函数。函数接收 ``count`` 作为参数，返回列表，调用者不必关心内部的 ``a``、``b`` 如何变化。同时补上边界处理：项数小于等于 0 时返回空列表。

.. code-block:: python

   def fibonacci(count):
       """返回斐波那契数列的前 count 项。"""
       if count <= 0:
           return []
       numbers = []
       a, b = 0, 1
       for _ in range(count):
           numbers.append(a)
           a, b = b, a + b
       return numbers


   for count in [0, 1, 8]:
       print(count, "->", fibonacci(count))

   print("前 10 项：", ", ".join(str(n) for n in fibonacci(10)))

输出结果：

.. code-block:: text

   0 -> []
   1 -> [0]
   8 -> [0, 1, 1, 2, 3, 5, 8, 13]
   前 10 项： 0, 1, 1, 2, 3, 5, 8, 13, 21, 34

函数把“需求”变成了“接口”：参数是输入，返回值是输出，中间的循环是实现细节。``", ".join(...)`` 把列表里的整数先转成字符串，再用逗号连接，这是格式化输出的常用手法。

四、摄氏与华氏温度转换
----------------------

第二个需求是温度转换，公式为“华氏度 = 摄氏度 × 9 / 5 + 32”。先写最朴素的脚本，只转换一个温度：

.. code-block:: python

   celsius = 37
   fahrenheit = celsius * 9 / 5 + 32
   print(f"{celsius} 摄氏度 = {fahrenheit} 华氏度")

输出结果：

.. code-block:: text

   37 摄氏度 = 98.6 华氏度

单点转换只需要一行公式，但真实场景往往要处理一批数据。把公式封装成函数，再写一个循环批量生成文本，就能直接得到一张转换表：

.. code-block:: python

   def celsius_to_fahrenheit(celsius):
       return celsius * 9 / 5 + 32


   def build_table(values):
       rows = []
       for value in values:
           fahrenheit = celsius_to_fahrenheit(value)
           rows.append(f"{value} 摄氏度 = {fahrenheit:.1f} 华氏度")
       return rows


   for row in build_table([-40, 0, 25, 37, 100]):
       print(row)

输出结果：

.. code-block:: text

   -40 摄氏度 = -40.0 华氏度
   0 摄氏度 = 32.0 华氏度
   25 摄氏度 = 77.0 华氏度
   37 摄氏度 = 98.6 华氏度
   100 摄氏度 = 212.0 华氏度

``{fahrenheit:.1f}`` 表示保留一位小数。``build_table()`` 只负责拼装字符串，不直接打印，这样返回的列表还能写入文件或传给其他函数，测试时也更容易比对。

反向转换要考虑输入是否合法。下面的 ``parse()`` 先用 ``float()`` 尝试解析，遇到无法转换的内容时捕获异常并返回 ``None``，调用方再决定如何提示：

.. code-block:: python

   def fahrenheit_to_celsius(fahrenheit):
       return (fahrenheit - 32) * 5 / 9


   def parse(value):
       try:
           return round(fahrenheit_to_celsius(float(value)), 1)
       except (TypeError, ValueError):
           return None


   for raw in ["212", "98.6", "冰点", None]:
       result = parse(raw)
       if result is None:
           print(f"{raw!r}：无法转换")
       else:
           print(f"{raw} 华氏度 = {result} 摄氏度")

输出结果：

.. code-block:: text

   212 华氏度 = 100.0 摄氏度
   98.6 华氏度 = 37.0 摄氏度
   '冰点'：无法转换
   None：无法转换

异常被捕获后程序仍然正常结束，退出码为 0。``float("冰点")`` 抛出 ``ValueError``，``float(None)`` 抛出 ``TypeError``，两个异常类型都要写进 ``except``，否则某一种输入就会让程序中断。

五、猜数字：用预设变量代替输入
------------------------------

第三个需求是猜数字。真实程序通常从键盘读取用户输入，但学习阶段为了结果可复现，这里用预设变量模拟输入。先判断一次猜测：

.. code-block:: python

   secret = 42
   guess = 42

   if guess > secret:
       print("猜大了")
   elif guess < secret:
       print("猜小了")
   else:
       print("猜对了，答案是", secret)

输出结果：

.. code-block:: text

   猜对了，答案是 42

一次判断只能处理一个猜测。把预设值换成列表，循环处理多次猜测，猜中就 ``break``，全部猜完仍未命中则走循环的 ``else`` 分支：

.. code-block:: python

   secret = 42
   guesses = [60, 25, 42]
   attempt = 0

   for guess in guesses:
       attempt += 1
       if guess > secret:
           print(f"第 {attempt} 次：{guess} 猜大了")
       elif guess < secret:
           print(f"第 {attempt} 次：{guess} 猜小了")
       else:
           print(f"第 {attempt} 次：{guess} 猜对了")
           break
   else:
       print("机会用完，答案是", secret)

输出结果：

.. code-block:: text

   第 1 次：60 猜大了
   第 2 次：25 猜小了
   第 3 次：42 猜对了

手动维护 ``attempt`` 容易出错，封装时改用 ``enumerate()``，并让函数返回是否猜中，调用方就能根据返回值决定下一步动作：

.. code-block:: python

   def play(secret, guesses):
       for attempt, guess in enumerate(guesses, start=1):
           if guess > secret:
               print(f"第 {attempt} 次：{guess} 猜大了")
           elif guess < secret:
               print(f"第 {attempt} 次：{guess} 猜小了")
           else:
               print(f"第 {attempt} 次：{guess} 猜对了")
               return True
       print("机会用完，答案是", secret)
       return False


   print("结果：", play(42, [60, 25, 42]))
   print("结果：", play(42, [10, 20, 30]))

输出结果：

.. code-block:: text

   第 1 次：60 猜大了
   第 2 次：25 猜小了
   第 3 次：42 猜对了
   结果： True
   第 1 次：10 猜小了
   第 2 次：20 猜小了
   第 3 次：30 猜小了
   机会用完，答案是 42
   结果： False

函数把“游戏规则”集中在一个地方，预设的猜测列表相当于测试用例。以后改成随机答案或接入真实输入时，只需要替换参数，不用重写循环和判断。

六、脚本式与函数式的对比
------------------------

同样是计算 1 到 5 的平方和，两种写法都能得到 55，但组织方式完全不同。脚本式从上到下顺序执行，函数式把计算过程命名为 ``sum_of_squares()``，输入由参数决定：

.. code-block:: python

   # 脚本式：从上到下直接算
   total = 0
   for n in range(1, 6):
       total += n * n
   print("脚本式结果：", total)


   # 函数式：把逻辑封装起来，便于复用
   def sum_of_squares(limit):
       return sum(n * n for n in range(1, limit + 1))


   print("函数式结果：", sum_of_squares(5))
   print("函数式结果：", sum_of_squares(10))

输出结果：

.. code-block:: text

   脚本式结果： 55
   函数式结果： 55
   函数式结果： 385

两种写法没有绝对优劣。脚本式适合一次性的临时任务，函数式适合需要反复调用、逐步扩展的程序。判断标准很简单：如果同一段逻辑要出现第二次，就应该把它封装成函数。

.. csv-table::
   :header: "对比项", "脚本式", "函数式"

   "代码组织", "从上到下顺序执行，逻辑与输出混在一起", "输入、计算、输出分离，职责清晰"
   "复用方式", "复制粘贴后修改数字", "调用函数并传入不同参数"
   "测试难度", "只能整体运行，难以单独验证某一步", "可以针对函数传入多组参数验证"
   "适用场景", "一次性的小脚本、临时验证想法", "需要反复使用或逐步扩展的程序"

从脚本过渡到函数，通常只做三件事：把变化的量提取成参数，把计算结果 ``return`` 出来，把打印语句移到调用方。改造过程中每完成一步就运行一次，确认输出没有变化，比一次性重写安全得多。

七、练习任务
------------

任务 1：封装一个函数，返回斐波那契数列的第 n 项，并验证第 1、2、3、10、20 项。

.. code-block:: python

   def fibonacci_at(index):
       if index < 1:
           return None
       a, b = 0, 1
       for _ in range(index - 1):
           a, b = b, a + b
       return a


   for index in [1, 2, 3, 10, 20]:
       print(f"第 {index} 项：{fibonacci_at(index)}")

输出结果：

.. code-block:: text

   第 1 项：0
   第 2 项：1
   第 3 项：1
   第 10 项：34
   第 20 项：4181

任务 2：写一个双向温度转换函数，用单位参数区分摄氏与华氏，并输出一组转换结果。

.. code-block:: python

   def convert(value, unit):
       if unit == "C":
           return value * 9 / 5 + 32
       if unit == "F":
           return (value - 32) * 5 / 9
       raise ValueError("单位只能是 C 或 F")


   for value, unit in [(-40, "C"), (0, "C"), (100, "C"), (32, "F"), (212, "F")]:
       result = convert(value, unit)
       target = "F" if unit == "C" else "C"
       print(f"{value} {unit} = {result:.1f} {target}")

输出结果：

.. code-block:: text

   -40 C = -40.0 F
   0 C = 32.0 F
   100 C = 212.0 F
   32 F = 0.0 C
   212 F = 100.0 C

任务 3：把猜数字改写成带次数上限的函数，分别测试猜中与没猜中两种情况。

.. code-block:: python

   def guess_number(secret, guesses, limit=3):
       for attempt, guess in enumerate(guesses[:limit], start=1):
           if guess == secret:
               return f"第 {attempt} 次猜中：{guess}"
           hint = "大了" if guess > secret else "小了"
           print(f"第 {attempt} 次：{guess}，{hint}")
       return f"没猜中，答案是 {secret}"


   print(guess_number(42, [50, 30, 42]))
   print(guess_number(42, [50, 30, 20]))

输出结果：

.. code-block:: text

   第 1 次：50，大了
   第 2 次：30，小了
   第 3 次猜中：42
   第 1 次：50，大了
   第 2 次：30，小了
   第 3 次：20，小了
   没猜中，答案是 42
