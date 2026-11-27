Python 综合练习
================

.. meta::
   :group: 标准库与实战
   :summary: 用 12 道由浅入深的综合练习串起数据类型、控制流程、函数、类、文件、异常、正则、JSON、日期与并发，每题给出可直接运行的代码和输出。

前面各章分别讲解了语法、数据结构、函数、类、标准库与网络。这一章不再引入新概念，而是用一组小任务把知识串起来。建议先自己动手实现，再对照参考代码；同一道题往往有多种写法，能跑通、能解释清楚就是好答案。

一、循环与格式化：九九乘法表
----------------------------

任务：输出标准的九九乘法表，每一行只显示到当前行号，列之间用空格分隔。

.. code-block:: python

   for i in range(1, 10):
       row = [f"{j}x{i}={i * j}" for j in range(1, i + 1)]
       print(" ".join(row))

输出结果：

.. code-block:: text

   1x1=1
   1x2=2 2x2=4
   1x3=3 2x3=6 3x3=9
   1x4=4 2x4=8 3x4=12 4x4=16
   1x5=5 2x5=10 3x5=15 4x5=20 5x5=25
   1x6=6 2x6=12 3x6=18 4x6=24 5x6=30 6x6=36
   1x7=7 2x7=14 3x7=21 4x7=28 5x7=35 6x7=42 7x7=49
   1x8=8 2x8=16 3x8=24 4x8=32 5x8=40 6x8=48 7x8=56 8x8=64
   1x9=9 2x9=18 3x9=27 4x9=36 5x9=45 6x9=54 7x9=63 8x9=72 9x9=81

外层循环控制行，内层控制列。用列表推导式先构造每行的字符串，再一次性 ``join``，比循环里反复 ``print(end=" ")`` 更清晰，也更容易控制格式。

二、生成器：斐波那契数列
------------------------

任务：写一个生成器，依次产出前 ``n`` 个斐波那契数。

.. code-block:: python

   def fib(n):
       a, b = 0, 1
       for _ in range(n):
           yield a
           a, b = b, a + b

   print(list(fib(10)))

输出结果：

.. code-block:: text

   [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

生成器不会一次性把整个数列放进内存，适合处理无限序列或超大数据。``a, b = b, a + b`` 利用元组解包同时完成两个变量的更新，省掉了临时变量。

三、字典与排序：词频统计
------------------------

任务：统计一段文本中每个单词出现的次数，按次数降序排列，次数相同按字母升序。

.. code-block:: python

   from collections import Counter

   text = "the quick brown fox jumps over the lazy dog the fox"
   counts = Counter(text.split())
   ranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))

   print(ranked[:3])
   print("单词总数：", len(text.split()))
   print("不同单词：", len(counts))

输出结果：

.. code-block:: text

   [('the', 3), ('fox', 2), ('brown', 1)]
   单词总数： 11
   不同单词： 8

``Counter`` 是 ``dict`` 的子类，计数场景比手写循环简洁。排序键用 ``(-次数, 单词)`` 的复合形式，可以同时表达“次数降序、同分按字母升序”两个规则。

四、去重与查找：保持原顺序
--------------------------

任务：去掉列表中的重复元素并保持第一次出现的顺序，同时找出所有重复值。

.. code-block:: python

   items = [3, 1, 3, 2, 1, 5, 2]

   seen = set()
   unique = []
   for item in items:
       if item not in seen:
           seen.add(item)
           unique.append(item)

   duplicates = sorted({item for item in items if items.count(item) > 1})

   print("去重后：", unique)
   print("重复值：", duplicates)

输出结果：

.. code-block:: text

   去重后： [3, 1, 2, 5]
   重复值： [1, 2, 3]

``set`` 的 ``in`` 判断是平均 O(1)，适合边遍历边记录。``list.count()`` 每次都会完整扫描列表，只适合数据量很小的场景；大数据应当先用 ``Counter`` 统计。

五、算法入门：素数筛选
----------------------

任务：输出 30 以内的所有素数。

.. code-block:: python

   def is_prime(n):
       if n < 2:
           return False
       for divisor in range(2, int(n ** 0.5) + 1):
           if n % divisor == 0:
               return False
       return True

   print([n for n in range(2, 31) if is_prime(n)])

输出结果：

.. code-block:: text

   [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]

判断素数只需试除到平方根：如果 ``n = a * b``，那么 ``a`` 和 ``b`` 中至少有一个不超过 ``sqrt(n)``。这个优化把复杂度从 O(n) 降到 O(sqrt(n))。

六、文件与异常：安全读取
------------------------

任务：写入一个临时文件，再逐行读回；尝试打开不存在的文件并捕获异常。

.. code-block:: python

   import os
   import tempfile

   folder = tempfile.mkdtemp(prefix="practice_")
   path = os.path.join(folder, "data.txt")

   with open(path, "w", encoding="utf-8") as file:
       file.write("Python\n教程\n")

   with open(path, encoding="utf-8") as file:
       lines = [line.strip() for line in file]

   print("读取内容：", lines)

   try:
       open(os.path.join(folder, "missing.txt"), encoding="utf-8")
   except FileNotFoundError as exc:
       print("捕获异常：", type(exc).__name__)

   os.remove(path)
   os.rmdir(folder)

输出结果：

.. code-block:: text

   读取内容： ['Python', '教程']
   捕获异常： FileNotFoundError

``with`` 保证文件在异常发生时也能关闭；``encoding="utf-8"`` 避免不同平台默认编码不一致导致中文乱码。捕获具体异常类型，而不是笼统的 ``Exception``，可以避免掩盖真正的程序错误。

七、面向对象：银行账户
----------------------

任务：实现一个账户类，支持存款、取款，取款超过余额时抛出自定义异常。

.. code-block:: python

   class InsufficientBalance(Exception):
       pass

   class Account:
       def __init__(self, balance=0):
           self.balance = balance

       def deposit(self, amount):
           if amount <= 0:
               raise ValueError("金额必须为正数")
           self.balance += amount
           return self.balance

       def withdraw(self, amount):
           if amount > self.balance:
               raise InsufficientBalance("余额不足")
           self.balance -= amount
           return self.balance

   account = Account(100)
   print("存款后：", account.deposit(50))
   print("取款后：", account.withdraw(30))

   try:
       account.withdraw(500)
   except InsufficientBalance as exc:
       print("错误：", exc)

   print("最终余额：", account.balance)

输出结果：

.. code-block:: text

   存款后： 150
   取款后： 120
   错误： 余额不足
   最终余额： 120

自定义异常让调用方可以精确捕获业务错误，而不是靠错误信息字符串判断。余额校验放在方法内部，保证任何调用路径都不会把账户扣成负数。

八、正则表达式：提取并脱敏
--------------------------

任务：从一段文本中提取手机号和邮箱，手机号中间四位用星号遮蔽。

.. code-block:: python

   import re

   text = "联系 13812345678 或 admin@example.com，备用 test.user@mail.cn"

   phones = re.findall(r"1[3-9]\d{9}", text)
   emails = re.findall(r"[\w.+-]+@[\w-]+\.[\w.]+", text)
   masked = [phone[:3] + "****" + phone[-4:] for phone in phones]

   print("手机号：", masked)
   print("邮箱：", emails)

输出结果：

.. code-block:: text

   手机号： ['138****5678']
   邮箱： ['admin@example.com', 'test.user@mail.cn']

``\d`` 匹配数字，``{9}`` 表示再重复九次，``1[3-9]`` 限定号段。邮箱正则要覆盖点号、加号和子域名，但不需要做到 RFC 完全精确；过长的正则既难维护，也容易误判。

九、JSON：递归合并配置
----------------------

任务：把覆盖配置递归合并到基础配置中，嵌套字典逐层合并，其他类型直接覆盖。

.. code-block:: python

   import json

   base = {"db": {"host": "localhost", "port": 3306}, "debug": False}
   override = {"db": {"port": 5432}, "debug": True}

   def merge(left, right):
       result = dict(left)
       for key, value in right.items():
           if isinstance(value, dict) and isinstance(result.get(key), dict):
               result[key] = merge(result[key], value)
           else:
               result[key] = value
       return result

   merged = merge(base, override)
   print(json.dumps(merged, ensure_ascii=False, sort_keys=True))
   print("原配置端口：", base["db"]["port"])

输出结果：

.. code-block:: text

   {"db": {"host": "localhost", "port": 5432}, "debug": true}
   原配置端口： 3306

递归合并时一定要创建新字典，不能直接修改 ``left``，否则基础配置会被污染。``json.dumps(..., sort_keys=True)`` 让键按字母排序，输出稳定，便于比较和测试。

十、日期与时间：计算截止日
--------------------------

任务：从 2026 年 1 月 1 日往后推 45 天，输出日期、相差天数和星期。

.. code-block:: python

   from datetime import date, timedelta

   start = date(2026, 1, 1)
   end = start + timedelta(days=45)
   weekdays = ["一", "二", "三", "四", "五", "六", "日"]

   print("结束日期：", end.isoformat())
   print("相差天数：", (end - start).days)
   print("星期：", weekdays[end.weekday()])

输出结果：

.. code-block:: text

   结束日期： 2026-02-15
   相差天数： 45
   星期： 日

两个 ``date`` 相减得到 ``timedelta``，``.days`` 取整数天数。``weekday()`` 返回 0 到 6，分别对应周一到周日，用列表映射成中文最直观。

十一、并发：线程池批量计算
--------------------------

任务：用线程池并发计算 1 到 5 的平方，并按输入顺序收集结果。

.. code-block:: python

   import time
   from concurrent.futures import ThreadPoolExecutor

   def work(n):
       time.sleep(0.1)
       return n * n

   with ThreadPoolExecutor(max_workers=3) as pool:
       results = list(pool.map(work, range(1, 6)))

   print("结果：", results)
   print("总和：", sum(results))

输出结果：

.. code-block:: text

   结果： [1, 4, 9, 16, 25]
   总和： 55

``pool.map()`` 按传入顺序返回结果，即使实际完成顺序不同也不会乱序。线程池适合 I/O 密集型任务；CPU 密集型计算受 GIL 限制，应该用 ``ProcessPoolExecutor``。

十二、综合：学生成绩分析
------------------------

任务：按成绩排名，计算平均分与及格率，并输出格式化结果。

.. code-block:: python

   students = [("小明", 92), ("小红", 88), ("小刚", 95), ("小丽", 79)]

   ranked = sorted(students, key=lambda item: -item[1])
   average = sum(score for _, score in students) / len(students)
   pass_rate = sum(1 for _, score in students if score >= 60) / len(students)

   print("排名：", [name for name, _ in ranked])
   print("平均分：", round(average, 1))
   print("及格率：", f"{pass_rate:.0%}")

输出结果：

.. code-block:: text

   排名： ['小刚', '小明', '小红', '小丽']
   平均分： 88.5
   及格率： 100%

``sorted`` 的 ``key`` 返回 ``-score`` 实现降序；``sum`` 配合生成器表达式简洁且不需要额外列表。``f"{pass_rate:.0%}"`` 把 0.5 格式化成 ``50%``，比手工乘 100 再拼百分号更易读。

这 12 道题覆盖了教程的主干内容。真正的提升来自动手改需求：换数据、加边界、把脚本拆成函数与模块，再补上单元测试。遇到问题时回到对应章节查语法和标准库，比死记结论更有效。