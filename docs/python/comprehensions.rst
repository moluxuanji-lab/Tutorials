Python 推导式
==============

.. meta::
   :group: 核心语法
   :summary: 掌握列表、字典、集合推导式与生成器表达式，理解过滤、条件表达式、嵌套顺序、惰性求值以及性能与可读性的取舍。

推导式是 Python 从已有可迭代对象快速构建新容器的语法。它把“遍历、判断、计算、收集”四步压缩成一行，既减少了临时变量，也让代码更接近对数据的描述。常见的推导式包括列表推导式、字典推导式和集合推导式，另外还有用圆括号书写的生成器表达式。

本章先讲列表推导式的基本结构和过滤条件，再看条件表达式与嵌套推导，随后扩展到字典和集合，最后说明生成器表达式与性能、可读性方面的取舍。

一、列表推导式
--------------

列表推导式写作 ``[表达式 for 变量 in 可迭代对象]``。解释器会依次取出可迭代对象中的元素，把表达式的结果收集到一个新列表里。它和“先建空列表、再在循环里 append”的效果完全一样，但执行路径更短，可读性也更好。

最简单的用法是对区间内的数字做统一变换：

.. code-block:: python

   squares = [n * n for n in range(1, 11)]
   print(squares)
   print("个数：", len(squares))

输出结果：

.. code-block:: text

   [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
   个数： 10

表达式可以任意复杂，也可以调用字符串方法、内置函数或自定义函数：

.. code-block:: python

   words = ["python", "list", "loop"]
   upper = [word.upper() for word in words]
   lengths = [len(word) for word in words]

   print(upper)
   print(lengths)

输出结果：

.. code-block:: text

   ['PYTHON', 'LIST', 'LOOP']
   [6, 4, 4]

推导式里的循环变量只在推导式内部有效，不会泄漏到外层作用域。上面的 ``word`` 在推导式结束后就不可见了，这一点比传统 ``for`` 循环更干净。

二、if 过滤
------------

在 ``for`` 之后追加 ``if`` 子句，可以只保留满足条件的元素，写法是 ``[表达式 for 变量 in 可迭代对象 if 条件]``。条件不成立时，该元素会被直接跳过，不会进入结果列表。

下面的例子从 1 到 20 中挑出所有偶数：

.. code-block:: python

   evens = [n for n in range(1, 21) if n % 2 == 0]
   print(evens)

输出结果：

.. code-block:: text

   [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

过滤条件可以用 ``and``、``or`` 组合，也可以调用返回布尔值的函数：

.. code-block:: python

   words = ["apple", "Banana", "cherry", "avocado", "blueberry"]
   selected = [word for word in words if len(word) > 5 and word[0].islower()]
   print(selected)

输出结果：

.. code-block:: text

   ['cherry', 'avocado', 'blueberry']

``if`` 子句可以出现多个，但更推荐用 ``and`` 合并成一个条件，避免把推导式写得过长。条件越复杂，越应该考虑改回普通循环。

三、if-else 表达式
------------------

过滤只能决定“要不要这个元素”，如果希望两类元素都保留、只是处理方式不同，就要用条件表达式：``[甲 if 条件 else 乙 for 变量 in 可迭代对象]``。注意条件表达式整体位于 ``for`` 之前，而过滤条件位于 ``for`` 之后，两者位置不能互换。

下面给 1 到 6 的每个数字打上奇偶标签：

.. code-block:: python

   labels = ["偶数" if n % 2 == 0 else "奇数" for n in range(1, 7)]
   print(labels)

输出结果：

.. code-block:: text

   ['奇数', '偶数', '奇数', '偶数', '奇数', '偶数']

如果写成 ``[n for n in range(1, 7) if n % 2 == 0 else ...]`` 就是语法错误，因为 ``if`` 后面不能再接 ``else``。记住一个简单的判断方法：``for`` 前面的 ``if`` 负责“二选一”，``for`` 后面的 ``if`` 负责“要不要”。

四、嵌套推导
------------

推导式允许出现多个 ``for`` 子句，书写顺序与嵌套循环一致，从左到右依次展开。``[n for row in matrix for n in row]`` 等价于先遍历每一行，再遍历行中的每个元素。

把二维列表拉平成一维列表是最典型的场景：

.. code-block:: python

   matrix = [[1, 2, 3], [4, 5], [6]]
   flat = [n for row in matrix for n in row]
   print(flat)

输出结果：

.. code-block:: text

   [1, 2, 3, 4, 5, 6]

多个 ``for`` 还可以配合条件，生成满足约束的组合：

.. code-block:: python

   pairs = [(x, y) for x in range(1, 4) for y in range(1, 4) if x != y]
   print(pairs)
   print("对数：", len(pairs))

输出结果：

.. code-block:: text

   [(1, 2), (1, 3), (2, 1), (2, 3), (3, 1), (3, 2)]
   对数： 6

嵌套超过两层时，推导式的阅读成本会迅速上升。此时用普通循环反而更清晰，也能在循环里加注释、打印中间结果，便于排查问题。

五、字典推导
------------

字典推导式用花括号书写，格式为 ``{键表达式: 值表达式 for 变量 in 可迭代对象}``。它适合从一组数据中按某个规则建立映射，例如把单词映射到长度：

.. code-block:: python

   words = ["python", "go", "rust"]
   lengths = {word: len(word) for word in words}
   print(lengths)

输出结果：

.. code-block:: text

   {'python': 6, 'go': 2, 'rust': 4}

字典推导同样支持过滤，还能借助 ``enumerate()`` 生成序号。下面的例子先筛出及格成绩，再按分数从高到低编号：

.. code-block:: python

   scores = {"小明": 92, "小红": 85, "小刚": 58}
   passed = {name: score for name, score in scores.items() if score >= 60}
   rank = {
       name: index
       for index, name in enumerate(sorted(passed, key=passed.get, reverse=True), start=1)
   }

   print("及格：", passed)
   print("排名：", rank)

输出结果：

.. code-block:: text

   及格： {'小明': 92, '小红': 85}
   排名： {'小明': 1, '小红': 2}

如果多个键计算出相同的结果，后面的值会覆盖前面的值。需要保留全部数据时，应该把值设计成列表，而不是依赖“后写覆盖先写”的行为。

六、集合推导
------------

集合推导式同样使用花括号，但没有冒号，格式为 ``{表达式 for 变量 in 可迭代对象}``。它会自动去除重复元素，结果是一个无序集合，因此判断成员是否存在非常快。

下面统计字符串中出现过哪些字母，并忽略大小写：

.. code-block:: python

   text = "Banana"
   letters = {ch.lower() for ch in text if ch.isalpha()}
   print(sorted(letters))
   print("不重复字符数：", len(letters))

输出结果：

.. code-block:: text

   ['a', 'b', 'n']
   不重复字符数： 3

集合本身不保证顺序，直接打印时的元素排列可能随运行环境变化。教程和测试里需要稳定输出时，应像上面这样先调用 ``sorted()``，不要依赖集合的迭代顺序。

七、生成器表达式
----------------

把列表推导式的方括号换成圆括号，得到的就是生成器表达式：``(表达式 for 变量 in 可迭代对象)``。它不会一次性构建完整列表，而是每取一个元素才计算一个，因此占用的内存与数据总量无关，只与当前元素有关。

生成器的特点是“惰性”和“一次性”：可以用 ``next()`` 逐个取值，也可以交给 ``sum()``、``max()`` 等函数消费；一旦遍历完，再取就只能得到 ``StopIteration``，不能像列表那样反复使用。

.. code-block:: python

   squares = (n * n for n in range(1, 6))
   print("类型：", type(squares).__name__)
   print("前三个：", [next(squares) for _ in range(3)])
   print("剩余求和：", sum(squares))

输出结果：

.. code-block:: text

   类型： generator
   前三个： [1, 4, 9]
   剩余求和： 41

处理百万级数据或逐行读取大文件时，生成器表达式可以避免把全部结果同时放进内存。代价是不能使用 ``len()``、不能下标访问，也不适合需要多次遍历的场景。

八、性能与可读性
----------------

列表推导式在解释器内部做了专门优化，通常比“空列表加 append”的写法更快；生成器表达式省去了构建列表的开销，在只遍历一次时更省内存。但性能优势只在小范围内成立，真正耗时的部分往往在 I/O、网络或数值计算上，不值得为了几毫秒把代码写得晦涩。

很多场景下，``map()``、``filter()`` 与推导式可以互相替代：

.. code-block:: python

   data = [3, 1, 4, 1, 5, 9, 2, 6]
   print("生成器求和：", sum(n * n for n in data))

   words = ["Python", "Go", "Rust"]
   print("两种写法一致：", [word.upper() for word in words] == list(map(str.upper, words)))

输出结果：

.. code-block:: text

   生成器求和： 173
   两种写法一致： True

选择写法时可以遵循几条经验：只做简单变换或过滤时用推导式；需要复杂条件、多个分支或调试输出时用普通循环；数据量很大且只遍历一次时用生成器表达式；已经有现成函数可以复用时，``map()`` 与 ``filter()`` 也很自然。

九、练习任务
------------

任务 1：用列表推导式生成 1 到 30 中所有能被 3 整除的数的平方。

.. code-block:: python

   multiples = [n * n for n in range(1, 31) if n % 3 == 0]
   print(multiples)

输出结果：

.. code-block:: text

   [9, 36, 81, 144, 225, 324, 441, 576, 729, 900]

任务 2：统计句子中长度大于 3 的单词，构造“单词到长度”的字典。

.. code-block:: python

   sentence = "the quick brown fox jumps over the lazy dog"
   lengths = {word: len(word) for word in sentence.split() if len(word) > 3}
   print(lengths)

输出结果：

.. code-block:: text

   {'quick': 5, 'brown': 5, 'jumps': 5, 'over': 4, 'lazy': 4}

任务 3：用生成器表达式计算 1 到 100 中所有奇数之和。

.. code-block:: python

   total = sum(n for n in range(1, 101) if n % 2 == 1)
   print("奇数和：", total)

输出结果：

.. code-block:: text

   奇数和： 2500
