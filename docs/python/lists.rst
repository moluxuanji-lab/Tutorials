Python 列表
==============

.. meta::
   :group: 核心语法
   :summary: 掌握列表的创建、索引切片、增删改查、排序统计、成员判断、嵌套与推导式，理解浅拷贝、深拷贝以及遍历时删除的陷阱。

列表是 Python 中最常用的可变序列。它用一对方括号保存一组有序元素，元素可以是任意类型，长度可以随时变化。需要按顺序保存一批数据、临时汇总结果、实现栈或队列时，列表通常都是第一选择。

本章按照菜鸟教程列表章节的顺序展开，从创建和切片讲到增删改查、排序统计、嵌套列表、列表推导式，最后专门说明浅拷贝与深拷贝、遍历时删除这两个容易踩坑的地方。

一、创建列表
--------------

列表用方括号创建，元素之间用逗号分隔。空列表写作 ``[]``，只含一个元素的列表要写成 ``[x]``，不要多加逗号。``list()`` 可以把元组、字符串、``range`` 等可迭代对象转换成列表。

列表不要求元素类型一致，同一个列表里既可以放整数，也可以放字符串、浮点数、布尔值甚至 ``None``。这种灵活性让列表适合充当临时的“数据容器”。

.. code-block:: python

   empty = []
   numbers = [1, 2, 3, 4, 5]
   mixed = [1, "two", 3.0, True, None]
   nested = [[1, 2], [3, 4]]
   from_range = list(range(5))
   from_string = list("abc")
   from_tuple = list((1, 2, 3))

   print("空列表：", empty)
   print("数字列表：", numbers)
   print("混合类型：", mixed)
   print("嵌套列表：", nested)
   print("range 转换：", from_range)
   print("字符串转换：", from_string)
   print("元组转换：", from_tuple)
   print("类型：", type(numbers).__name__)

输出结果：

.. code-block:: text

   空列表： []
   数字列表： [1, 2, 3, 4, 5]
   混合类型： [1, 'two', 3.0, True, None]
   嵌套列表： [[1, 2], [3, 4]]
   range 转换： [0, 1, 2, 3, 4]
   字符串转换： ['a', 'b', 'c']
   元组转换： [1, 2, 3]
   类型： list

``list("abc")`` 会把字符串拆成单个字符，``list(range(5))`` 得到 0 到 4。嵌套列表的外层仍然是一个列表，内层列表则作为元素被保存。

二、索引与切片
----------------

列表和字符串一样支持下标访问。下标从 0 开始，``-1`` 表示最后一个元素。切片写法 ``[start:stop:step]`` 返回一个新列表，原列表不受影响。

切片是“浅复制”：新列表拥有自己的元素引用，但如果元素本身是列表，内层对象仍然共享。下标越界会抛出 ``IndexError``，切片越界则只会得到空列表或较短的结果。

.. code-block:: python

   letters = ["a", "b", "c", "d", "e", "f"]
   print("原列表：", letters)
   print("第一个：", letters[0])
   print("最后一个：", letters[-1])
   print("前三个：", letters[:3])
   print("后两个：", letters[-2:])
   print("步长 2：", letters[::2])
   print("反转：", letters[::-1])

   try:
       print(letters[10])
   except IndexError as error:
       print("越界：", type(error).__name__, "-", error)

输出结果：

.. code-block:: text

   原列表： ['a', 'b', 'c', 'd', 'e', 'f']
   第一个： a
   最后一个： f
   前三个： ['a', 'b', 'c']
   后两个： ['e', 'f']
   步长 2： ['a', 'c', 'e']
   反转： ['f', 'e', 'd', 'c', 'b', 'a']
   越界： IndexError - list index out of range

``letters[::-1]`` 是反转列表最简洁的写法，它返回新列表，原列表保持不变。需要原地反转时则使用 ``letters.reverse()``，两者的区别在排序一节还会再次出现。

三、添加元素
--------------

列表提供了三个添加元素的方法：``append()`` 在末尾追加一个元素，``extend()`` 把另一个可迭代对象中的元素逐个追加进来，``insert()`` 在指定下标前插入一个元素。

``append()`` 和 ``extend()`` 的区别经常被弄混：前者把参数当成一个整体，后者把参数拆开。如果传入的是列表，``append()`` 会得到嵌套结构，``extend()`` 才会把元素平铺进去。

append 与 extend 的区别
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   numbers = [1, 2, 3]
   print("初始：", numbers)

   numbers.append(4)
   print("append：", numbers)

   numbers.extend([5, 6])
   print("extend：", numbers)

   numbers.insert(0, 0)
   print("insert 开头：", numbers)

   numbers.insert(3, 99)
   print("insert 中间：", numbers)

   numbers += [7]
   print("+=：", numbers)

   print("append 返回：", numbers.append(8))
   print("追加后：", numbers)

输出结果：

.. code-block:: text

   初始： [1, 2, 3]
   append： [1, 2, 3, 4]
   extend： [1, 2, 3, 4, 5, 6]
   insert 开头： [0, 1, 2, 3, 4, 5, 6]
   insert 中间： [0, 1, 2, 99, 3, 4, 5, 6]
   +=： [0, 1, 2, 99, 3, 4, 5, 6, 7]
   append 返回： None
   追加后： [0, 1, 2, 99, 3, 4, 5, 6, 7, 8]

``append()``、``extend()``、``insert()`` 都直接修改原列表，返回值都是 ``None``。因此不要写 ``numbers = numbers.append(4)``，否则 ``numbers`` 会变成 ``None``。

四、删除元素
--------------

删除元素有三类写法：``remove()`` 按值删除第一个匹配项，``pop()`` 按下标删除并返回被删元素，``clear()`` 清空整个列表。``del`` 是语句而不是方法，可以按下标或切片删除。

``remove()`` 找不到目标值时会抛出 ``ValueError``，``pop()`` 的下标越界时会抛出 ``IndexError``。实际使用时，如果只关心“删掉这个值”，用 ``remove()``；如果还需要拿到被删的元素，用 ``pop()``。

删除方法的返回值
~~~~~~~~~~~~~~~~

.. code-block:: python

   fruits = ["apple", "banana", "cherry", "banana", "date"]
   print("初始：", fruits)

   fruits.remove("banana")
   print("remove 第一个 banana：", fruits)

   popped = fruits.pop()
   print("pop 末尾：", popped, fruits)

   popped_index = fruits.pop(0)
   print("pop 指定下标：", popped_index, fruits)

   del fruits[1]
   print("del 下标：", fruits)

   del fruits[0:1]
   print("del 切片：", fruits)

   fruits.clear()
   print("clear：", fruits)

   try:
       fruits.remove("apple")
   except ValueError as error:
       print("remove 不存在：", type(error).__name__, "-", error)

输出结果：

.. code-block:: text

   初始： ['apple', 'banana', 'cherry', 'banana', 'date']
   remove 第一个 banana： ['apple', 'cherry', 'banana', 'date']
   pop 末尾： date ['apple', 'cherry', 'banana']
   pop 指定下标： apple ['cherry', 'banana']
   del 下标： ['cherry']
   del 切片： []
   clear： []
   remove 不存在： ValueError - list.remove(x): x not in list

``remove()`` 只删除第一个匹配项，列表里还有同名元素时不会被一起清掉。``pop()`` 不传参数时默认删除最后一个元素，传下标时删除对应位置的元素。

五、修改与查询
----------------

修改列表元素可以直接给下标赋值，也可以用切片赋值批量替换。切片赋值不要求左右两边的长度一致：赋一个更长的列表会插入新元素，赋空列表则相当于删除这一段。

查询元素位置用 ``index()``，统计出现次数用 ``count()``，获取长度用 ``len()``。``index()`` 只返回第一个匹配项的下标，找不到时会抛出 ``ValueError``。

.. code-block:: python

   scores = [78, 92, 85, 92, 60]
   print("初始：", scores)
   print("第一个：", scores[0])
   print("最后一个：", scores[-1])

   scores[0] = 80
   print("修改下标 0：", scores)

   scores[1:3] = [90, 88, 86]
   print("修改切片：", scores)

   print("index(92)：", scores.index(92))
   print("count(92)：", scores.count(92))
   print("长度：", len(scores))

   scores[1:3] = []
   print("删除切片：", scores)

输出结果：

.. code-block:: text

   初始： [78, 92, 85, 92, 60]
   第一个： 78
   最后一个： 60
   修改下标 0： [80, 92, 85, 92, 60]
   修改切片： [80, 90, 88, 86, 92, 60]
   index(92)： 4
   count(92)： 1
   长度： 6
   删除切片： [80, 86, 92, 60]

切片赋值 ``scores[1:3] = [90, 88, 86]`` 把原来的两个元素替换成三个元素，列表长度随之增加。反过来，``scores[1:3] = []`` 会把这一段删掉。

六、排序
----------

``sort()`` 是列表方法，直接修改原列表，返回 ``None``；``sorted()`` 是内置函数，返回一个新列表，原列表保持不变。``reverse()`` 原地反转，``reversed()`` 返回反向迭代器。

默认排序按元素大小升序进行，``reverse=True`` 改为降序。对字符串列表，默认按字符编码比较，大写字母排在小写字母前面；需要忽略大小写时传入 ``key=str.lower``。

sort 与 sorted 的区别
~~~~~~~~~~~~~~~~~~~~~~

.. csv-table::
   :header: "方式", "是否修改原列表", "返回值", "适用场景"

   "``list.sort()``", "是", "``None``", "只排序，不需要保留原顺序"
   "``sorted(list)``", "否", "新列表", "需要保留原列表"
   "``list.reverse()``", "是", "``None``", "原地反转"
   "``reversed(list)``", "否", "迭代器", "反向遍历，不占额外列表"

.. code-block:: python

   numbers = [5, 2, 9, 1, 7]
   print("原列表：", numbers)

   print("sorted 升序：", sorted(numbers))
   print("sorted 降序：", sorted(numbers, reverse=True))
   print("原列表不变：", numbers)

   numbers.sort()
   print("sort 升序：", numbers)

   numbers.sort(reverse=True)
   print("sort 降序：", numbers)

   numbers.reverse()
   print("reverse：", numbers)

   words = ["banana", "apple", "Cherry"]
   print("区分大小写：", sorted(words))
   print("忽略大小写：", sorted(words, key=str.lower))

输出结果：

.. code-block:: text

   原列表： [5, 2, 9, 1, 7]
   sorted 升序： [1, 2, 5, 7, 9]
   sorted 降序： [9, 7, 5, 2, 1]
   原列表不变： [5, 2, 9, 1, 7]
   sort 升序： [1, 2, 5, 7, 9]
   sort 降序： [9, 7, 5, 2, 1]
   reverse： [1, 2, 5, 7, 9]
   区分大小写： ['Cherry', 'apple', 'banana']
   忽略大小写： ['apple', 'banana', 'Cherry']

``sort()`` 和 ``reverse()`` 都是在原列表上操作，所以不能把它们的结果赋给变量。``sorted()`` 和 ``reversed()`` 不修改原列表，适合函数式写法和需要保留原始顺序的场景。

七、统计函数
--------------

内置函数 ``len()``、``max()``、``min()``、``sum()`` 可以直接作用于列表。``len()`` 返回元素个数，``max()`` 和 ``min()`` 返回最大、最小元素，``sum()`` 对数值元素求和。

``max()`` 和 ``min()`` 可以配合 ``key`` 参数，按指定规则比较。例如对字符串列表传入 ``key=len``，就能找出最长或最短的单词。空列表没有最大值和最小值，调用时会抛出 ``ValueError``。

.. code-block:: python

   numbers = [12, 5, 8, 21, 3]
   print("列表：", numbers)
   print("长度：", len(numbers))
   print("最大值：", max(numbers))
   print("最小值：", min(numbers))
   print("总和：", sum(numbers))
   print("平均值：", round(sum(numbers) / len(numbers), 2))

   words = ["apple", "banana", "cherry"]
   print("最长单词：", max(words, key=len))
   print("最短单词：", min(words, key=len))

   empty = []
   print("空列表长度：", len(empty))
   try:
       print(max(empty))
   except ValueError as error:
       print("空列表最大值：", type(error).__name__, "-", error)

输出结果：

.. code-block:: text

   列表： [12, 5, 8, 21, 3]
   长度： 5
   最大值： 21
   最小值： 3
   总和： 49
   平均值： 9.8
   最长单词： banana
   最短单词： apple
   空列表长度： 0
   空列表最大值： ValueError - max() iterable argument is empty

``sum()`` 只能用于数值元素，字符串列表求和会抛出 ``TypeError``。求平均值时先 ``sum()`` 再除以 ``len()``，最后用 ``round()`` 控制小数位数。

八、成员判断
--------------

用 ``in`` 判断元素是否在列表中，用 ``not in`` 判断是否不在。成员判断会从头到尾逐个比较，列表很长时速度会变慢；需要频繁判断成员时，通常改用集合。

``index()`` 可以返回元素第一次出现的下标，但元素不存在时会报错。如果只是想知道“在不在”，用 ``in`` 更安全；确认存在之后再取下标，才不会让程序意外退出。

.. code-block:: python

   fruits = ["apple", "banana", "cherry"]
   print("banana" in fruits)
   print("grape" in fruits)
   print("grape" not in fruits)
   print("下标：", fruits.index("cherry"))
   print("安全查找：", "grape" in fruits and fruits.index("grape"))

   numbers = [1, 2, 3, 2, 1]
   print("2 出现次数：", numbers.count(2))
   print("去重后排序：", sorted(set(numbers)))

输出结果：

.. code-block:: text

   True
   False
   True
   下标： 2
   安全查找： False
   2 出现次数： 2
   去重后排序： [1, 2, 3]

``set(numbers)`` 去掉重复元素，``sorted()`` 再把结果按升序排好。集合本身是无序的，直接打印集合可能因版本或运行环境不同而变化，所以这里先排序再输出。

九、拼接与重复
----------------

加号 ``+`` 把两个列表拼接成一个新列表，乘号 ``*`` 把列表重复若干次。``+=`` 在列表上执行的是原地扩展，效果类似 ``extend()``，不会创建新列表对象。

重复列表时要小心可变元素。``[[]] * 3`` 得到的三项指向同一个内层列表，修改其中一项会影响另外两项。需要多个独立的内层列表时，用列表推导式逐个创建。

.. code-block:: python

   a = [1, 2, 3]
   b = [4, 5]
   print("a + b：", a + b)
   print("a 不变：", a)
   print("a * 3：", a * 3)
   print("重复元素：", [0] * 5)

   a += b
   print("+= 后：", a)
   print("长度：", len(a))

   matrix = [[0] * 3 for _ in range(2)]
   print("二维列表：", matrix)

输出结果：

.. code-block:: text

   a + b： [1, 2, 3, 4, 5]
   a 不变： [1, 2, 3]
   a * 3： [1, 2, 3, 1, 2, 3, 1, 2, 3]
   重复元素： [0, 0, 0, 0, 0]
   += 后： [1, 2, 3, 4, 5]
   长度： 5
   二维列表： [[0, 0, 0], [0, 0, 0]]

``a + b`` 返回新列表，``a`` 本身没有变化；``a += b`` 则把 ``b`` 的元素追加到 ``a`` 上。``[[0] * 3 for _ in range(2)]`` 每次循环都新建一行，因此两行互不影响。

十、嵌套列表
--------------

列表的元素可以是另一个列表，这样就形成了二维甚至多维结构。访问嵌套元素要连续写多个下标，``matrix[1][2]`` 表示第二行第三列。

嵌套列表适合表示矩阵、表格和分组数据。遍历二维列表通常用两层循环，或者用列表推导式一次处理一行。``zip(*matrix)`` 可以把矩阵的行转成列，是转置的常用技巧。

.. code-block:: python

   matrix = [
       [1, 2, 3],
       [4, 5, 6],
       [7, 8, 9],
   ]
   print("矩阵：", matrix)
   print("第一行：", matrix[0])
   print("第二行第三列：", matrix[1][2])
   print("主对角线：", [matrix[i][i] for i in range(3)])
   print("转置：", [list(row) for row in zip(*matrix)])

   matrix[0][0] = 100
   print("修改后：", matrix)
   print("第一行：", matrix[0])

输出结果：

.. code-block:: text

   矩阵： [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
   第一行： [1, 2, 3]
   第二行第三列： 6
   主对角线： [1, 5, 9]
   转置： [[1, 4, 7], [2, 5, 8], [3, 6, 9]]
   修改后： [[100, 2, 3], [4, 5, 6], [7, 8, 9]]
   第一行： [100, 2, 3]

``zip(*matrix)`` 把每一行作为参数传给 ``zip()``，于是每次取出的是一列。``zip()`` 返回的是元组，需要列表时再用 ``list()`` 转换。

十一、列表推导式
------------------

列表推导式用一行代码完成“遍历 + 过滤 + 转换”，基本形式是 ``[表达式 for 元素 in 可迭代对象 if 条件]``。它比手写循环更短，也更容易看出数据的流向。

条件可以放在末尾做过滤，也可以写成三元表达式放在前面做分支。多重 ``for`` 可以生成笛卡尔积，顺序与嵌套循环一致：先写外层，再写内层。

.. code-block:: python

   numbers = [1, 2, 3, 4, 5, 6]
   squares = [n * n for n in numbers]
   evens = [n for n in numbers if n % 2 == 0]
   labels = ["偶数" if n % 2 == 0 else "奇数" for n in numbers]
   pairs = [(x, y) for x in [1, 2] for y in ["a", "b"]]
   lengths = [len(word) for word in ["apple", "fig", "banana"]]

   print("平方：", squares)
   print("偶数：", evens)
   print("标签：", labels)
   print("组合：", pairs)
   print("长度：", lengths)

输出结果：

.. code-block:: text

   平方： [1, 4, 9, 16, 25, 36]
   偶数： [2, 4, 6]
   标签： ['奇数', '偶数', '奇数', '偶数', '奇数', '偶数']
   组合： [(1, 'a'), (1, 'b'), (2, 'a'), (2, 'b')]
   长度： [5, 3, 6]

列表推导式适合逻辑简单、一眼能看懂的转换。如果表达式里嵌套了三层循环或者多个条件，写成普通 ``for`` 循环反而更清晰。

十二、浅拷贝与深拷贝
----------------------

赋值 ``alias = original`` 只是让两个名字指向同一个列表，并没有复制内容。要得到独立的外层列表，可以用 ``copy()``、``list()`` 或切片，但这些都只是浅拷贝：内层可变对象仍然共享。

``copy.deepcopy()`` 会递归复制所有层级，得到的列表与原来完全独立。数据只有一层时浅拷贝就够了；嵌套列表、字典等结构需要彻底隔离时，必须使用深拷贝。

.. code-block:: python

   import copy

   original = [[1, 2], [3, 4]]
   alias = original
   shallow = original.copy()
   deep = copy.deepcopy(original)

   original[0][0] = 100

   print("original：", original)
   print("alias：", alias)
   print("shallow：", shallow)
   print("deep：", deep)
   print("alias is original：", alias is original)
   print("shallow is original：", shallow is original)
   print("shallow[0] is original[0]：", shallow[0] is original[0])
   print("deep[0] is original[0]：", deep[0] is original[0])

输出结果：

.. code-block:: text

   original： [[100, 2], [3, 4]]
   alias： [[100, 2], [3, 4]]
   shallow： [[100, 2], [3, 4]]
   deep： [[1, 2], [3, 4]]
   alias is original： True
   shallow is original： False
   shallow[0] is original[0]： True
   deep[0] is original[0]： False

``is`` 判断两个名字是否指向同一个对象。``shallow`` 虽然是新列表，但 ``shallow[0]`` 与 ``original[0]`` 仍然是同一个内层列表，所以内层修改会同时反映在两边。

十三、遍历时删除的坑
----------------------

在 ``for`` 循环中直接删除列表元素，很容易漏删或跳过元素。原因是列表长度变化后，迭代器仍然按原来的下标往后走，后面的元素会向前移动，导致某些元素没有被访问到。

安全的做法有三种：用列表推导式生成新列表、遍历原列表的副本、用 ``while`` 循环反复删除。下面把错误写法和三种正确写法放在一起对比：

.. code-block:: python

   numbers = [1, 2, 2, 3, 2, 4]
   print("原列表：", numbers)

   wrong = numbers.copy()
   for value in wrong:
       if value == 2:
           wrong.remove(value)
   print("边遍历边删除：", wrong)

   correct = [value for value in numbers if value != 2]
   print("列表推导式：", correct)

   another = numbers.copy()
   for value in another[:]:
       if value == 2:
           another.remove(value)
   print("遍历副本：", another)

   while 2 in numbers:
       numbers.remove(2)
   print("while 删除：", numbers)

输出结果：

.. code-block:: text

   原列表： [1, 2, 2, 3, 2, 4]
   边遍历边删除： [1, 3, 2, 4]
   列表推导式： [1, 3, 4]
   遍历副本： [1, 3, 4]
   while 删除： [1, 3, 4]

错误写法最后仍然留下了一个 ``2``，因为删除元素后下标发生了偏移。遍历 ``another[:]`` 相当于先复制一份列表再遍历，删除操作只影响原列表，不会打乱遍历节奏。

练习任务
--------

任务 1：统计一组成绩的最高分、最低分、平均分，并分别输出去重后的升序结果和从高到低的完整结果。

.. code-block:: python

   scores = [88, 76, 92, 85, 76, 90]
   print("原始成绩：", scores)
   print("最高分：", max(scores))
   print("最低分：", min(scores))
   print("平均分：", round(sum(scores) / len(scores), 2))
   print("从高到低：", sorted(scores, reverse=True))
   print("去重排序：", sorted(set(scores)))

输出结果：

.. code-block:: text

   原始成绩： [88, 76, 92, 85, 76, 90]
   最高分： 92
   最低分： 76
   平均分： 84.5
   从高到低： [92, 90, 88, 85, 76, 76]
   去重排序： [76, 85, 88, 90, 92]

任务 2：合并两个列表并去重，保持元素第一次出现的顺序，最后输出排序后的结果。

.. code-block:: python

   a = [1, 2, 3, 4]
   b = [3, 4, 5, 6]
   merged = a + b
   unique = []

   for value in merged:
       if value not in unique:
           unique.append(value)

   print("合并：", merged)
   print("去重：", unique)
   print("排序：", sorted(unique))

输出结果：

.. code-block:: text

   合并： [1, 2, 3, 4, 3, 4, 5, 6]
   去重： [1, 2, 3, 4, 5, 6]
   排序： [1, 2, 3, 4, 5, 6]

任务 3：用嵌套列表表示一个 3×3 矩阵，分别计算每行之和、每列之和，并输出转置后的矩阵。

.. code-block:: python

   matrix = [
       [1, 2, 3],
       [4, 5, 6],
       [7, 8, 9],
   ]
   row_sums = [sum(row) for row in matrix]
   col_sums = [sum(col) for col in zip(*matrix)]

   print("每行之和：", row_sums)
   print("每列之和：", col_sums)
   print("转置：", [list(col) for col in zip(*matrix)])

输出结果：

.. code-block:: text

   每行之和： [6, 15, 24]
   每列之和： [12, 15, 18]
   转置： [[1, 4, 7], [2, 5, 8], [3, 6, 9]]
