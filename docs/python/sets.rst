Python 集合
============

.. meta::
   :group: 核心语法
   :summary: 掌握集合的创建、去重、增删元素、交并差与对称差运算、子集超集判断、frozenset、集合推导式与成员测试，并理解它与列表的取舍。

集合（set）是 Python 内置的无序容器，元素不重复，底层用哈希表实现。判断一个元素是否在集合里，平均只需要做一次哈希查找，耗时与集合大小基本无关，这是它和列表最大的差别。

集合适合处理“去重”和“关系运算”两类问题：从一堆数据里删掉重复项、求两个名单的交集、检查权限是否被包含，都可以用一行代码完成。代价是集合不保存顺序，也不能用下标访问，元素还必须是可哈希的不可变对象。

本章按照创建、去重、增删、运算、判断、推导的顺序展开，最后用一张表格对比集合与列表的差异。示例中的集合在输出前统一用 ``sorted()`` 排序，避免依赖集合内部的遍历顺序。

一、创建集合
------------

集合用一对花括号创建，元素之间用逗号分隔。空集合必须写成 ``set()``，因为单独一对花括号 ``{}`` 表示的是空字典，这是初学者最常踩的坑之一。

``set()`` 还可以接收列表、字符串、``range`` 等可迭代对象，并自动去掉其中的重复元素。集合元素必须可哈希，列表、字典、集合本身都不能放进去，元组和 ``frozenset`` 则可以。

.. code-block:: python

   empty = set()
   braces = {}
   numbers = {1, 2, 3, 3, 2}
   from_string = set("hello")
   from_list = set([1, 2, 2, 3])
   from_range = set(range(5))

   print("空集合：", empty, "类型：", type(empty).__name__)
   print("空花括号：", braces, "类型：", type(braces).__name__)
   print("自动去重：", sorted(numbers))
   print("字符串拆成字符：", sorted(from_string))
   print("列表转换：", sorted(from_list))
   print("range 转换：", sorted(from_range))
   print("元素个数：", len(numbers))

输出结果：

.. code-block:: text

   空集合： set() 类型： set
   空花括号： {} 类型： dict
   自动去重： [1, 2, 3]
   字符串拆成字符： ['e', 'h', 'l', 'o']
   列表转换： [1, 2, 3]
   range 转换： [0, 1, 2, 3, 4]
   元素个数： 3

``set("hello")`` 把字符串拆成单个字符，重复的 ``l`` 只保留一个。集合本身是无序的，直接 ``print`` 一个集合，元素顺序既不是插入顺序也不保证跨版本一致，所以本书的示例都先 ``sorted()`` 再输出。

二、去重
--------

去重是集合最常见的用途。把列表传给 ``set()``，重复元素会被自动丢弃，再用 ``sorted()`` 转回有序列表，就得到一份干净的数据。

如果还需要保留元素第一次出现的顺序，集合本身做不到，要配合一个辅助集合和循环逐个判断，这个写法在练习任务里会再出现。

.. code-block:: python

   words = ["python", "java", "python", "go", "java", "rust"]
   unique_words = set(words)

   print("原始列表：", words)
   print("元素个数：", len(words), "去重后：", len(unique_words))
   print("去重排序：", sorted(unique_words))

   scores = [88, 92, 88, 76, 92, 95]
   unique_scores = sorted(set(scores))
   print("成绩去重：", unique_scores)
   print("最高分：", unique_scores[-1])

输出结果：

.. code-block:: text

   原始列表： ['python', 'java', 'python', 'go', 'java', 'rust']
   元素个数： 6 去重后： 4
   去重排序： ['go', 'java', 'python', 'rust']
   成绩去重： [76, 88, 92, 95]
   最高分： 95

``set(words)`` 只负责去重，不负责排序；``sorted(set(scores))`` 则把两步串起来，先转集合再去重、最后排序，是处理成绩、标签这类数据的惯用写法。

三、添加与删除元素
------------------

``add()`` 向集合添加一个元素，元素已存在时不会报错，也不会重复添加；``remove()`` 删除指定元素，元素不存在时抛出 ``KeyError``；``discard()`` 同样是删除，但元素不存在时静默跳过。

``pop()`` 随机删除并返回一个元素，集合为空时抛出 ``KeyError``；``clear()`` 清空整个集合。因为 ``pop()`` 删除的是“任意一个”元素，输出不确定，示例里只在单元素集合上使用它。

.. code-block:: python

   fruits = {"apple", "banana"}
   fruits.add("cherry")
   fruits.add("date")
   fruits.add("apple")
   print("add 后：", sorted(fruits))
   print("重复添加后长度：", len(fruits))

   fruits.remove("banana")
   print("remove 后：", sorted(fruits))

   fruits.discard("grape")
   print("discard 不存在：", sorted(fruits))

   single = {"only"}
   print("pop 得到：", single.pop())
   print("pop 后：", single)

   fruits.clear()
   print("clear 后：", fruits, "长度：", len(fruits))

输出结果：

.. code-block:: text

   add 后： ['apple', 'banana', 'cherry', 'date']
   重复添加后长度： 4
   remove 后： ['apple', 'cherry', 'date']
   discard 不存在： ['apple', 'cherry', 'date']
   pop 得到： only
   pop 后： set()
   clear 后： set() 长度： 0

``add()``、``remove()``、``discard()``、``clear()`` 都直接修改原集合，返回值都是 ``None``。如果只是“有就删、没有就算了”，用 ``discard()``；如果元素缺失说明逻辑出了问题，用 ``remove()`` 让异常尽早暴露。

删除不存在的元素时两种方法的表现：

.. code-block:: python

   values = {1, 2, 3}

   try:
       values.remove(99)
   except KeyError as error:
       print("remove 不存在：", type(error).__name__, "-", error)

   values.discard(99)
   print("discard 不报错：", sorted(values))

输出结果：

.. code-block:: text

   remove 不存在： KeyError - 99
   discard 不报错： [1, 2, 3]

四、交集、并集、差集与对称差
------------------------------

集合之间的运算用运算符最直观：``&`` 求交集，``|`` 求并集，``-`` 求差集，``^`` 求对称差（只属于其中一个集合的元素）。

这些运算符要求两边都是集合；如果右边是列表、元组等可迭代对象，就要改用下面一节的方法形式。

.. code-block:: python

   a = {1, 2, 3, 4}
   b = {3, 4, 5, 6}

   print("交集 a & b：", sorted(a & b))
   print("并集 a | b：", sorted(a | b))
   print("差集 a - b：", sorted(a - b))
   print("差集 b - a：", sorted(b - a))
   print("对称差 a ^ b：", sorted(a ^ b))

输出结果：

.. code-block:: text

   交集 a & b： [3, 4]
   并集 a | b： [1, 2, 3, 4, 5, 6]
   差集 a - b： [1, 2]
   差集 b - a： [5, 6]
   对称差 a ^ b： [1, 2, 5, 6]

差集是有方向的：``a - b`` 表示“在 a 里但不在 b 里”，``b - a`` 恰好相反。对称差则把两个方向合在一起，等价于 ``(a - b) | (b - a)``。

方法形式与就地更新
~~~~~~~~~~~~~~~~~~

方法名更长，但参数可以是任意可迭代对象，而且带 ``_update`` 后缀的版本会直接修改调用者，不再返回新集合。

.. code-block:: python

   a = {1, 2, 3, 4}
   b = {3, 4, 5, 6}

   print("intersection：", sorted(a.intersection(b)))
   print("union：", sorted(a.union(b)))
   print("difference：", sorted(a.difference(b)))
   print("symmetric_difference：", sorted(a.symmetric_difference(b)))

   c = a.copy()
   c.intersection_update(b)
   print("intersection_update：", sorted(c))

   c = a.copy()
   c.update(b)
   print("update：", sorted(c))

   c = a.copy()
   c.difference_update(b)
   print("difference_update：", sorted(c))

   c = a.copy()
   c.symmetric_difference_update(b)
   print("symmetric_difference_update：", sorted(c))

输出结果：

.. code-block:: text

   intersection： [3, 4]
   union： [1, 2, 3, 4, 5, 6]
   difference： [1, 2]
   symmetric_difference： [1, 2, 5, 6]
   intersection_update： [3, 4]
   update： [1, 2, 3, 4, 5, 6]
   difference_update： [1, 2]
   symmetric_difference_update： [1, 2, 5, 6]

``union()``、``intersection()`` 等方法返回新集合，``update()``、``intersection_update()`` 等方法修改原集合并返回 ``None``。方法形式还允许传入列表，例如 ``a.union([7, 8])``，运算符 ``a | [7, 8]`` 则会直接抛出 ``TypeError``。

五、子集与超集
--------------

``<=`` 判断子集（允许相等），``<`` 判断真子集（必须更小），``>=`` 与 ``>`` 对应超集和真超集。等价的写法是 ``issubset()`` 与 ``issuperset()``，方法形式的可读性更好。

``isdisjoint()`` 用于判断两个集合是否完全没有交集，做“互斥检查”时很方便。

.. code-block:: python

   small = {1, 2}
   large = {1, 2, 3, 4}
   same = {1, 2}

   print("small <= large：", small <= large)
   print("small < large：", small < large)
   print("large >= small：", large >= small)
   print("small < same：", small < same)
   print("small == same：", small == same)
   print("issubset：", small.issubset(large))
   print("issuperset：", large.issuperset(small))
   print("isdisjoint 无交集：", small.isdisjoint({3, 4}))
   print("isdisjoint 有交集：", small.isdisjoint({2, 3}))

输出结果：

.. code-block:: text

   small <= large： True
   small < large： True
   large >= small： True
   small < same： False
   small == same： True
   issubset： True
   issuperset： True
   isdisjoint 无交集： True
   isdisjoint 有交集： False

集合的相等判断只看元素是否完全一致，与顺序无关。``small < same`` 为 ``False``，因为两个集合元素相同，``same`` 并不比 ``small`` 更大。

六、frozenset
-------------

``frozenset`` 是不可变的集合：创建之后不能添加、删除元素，因此它可以计算哈希值，能作为字典的键，也能放进另一个集合里。

普通集合因为可变，哈希值无法固定，所以不能作为字典键。需要把“一组值”当作整体去重或索引时，``frozenset`` 是标准做法，它的运算方法与 ``set`` 完全一致。

.. code-block:: python

   frozen = frozenset([1, 2, 3, 3])
   print("frozenset：", sorted(frozen), "类型：", type(frozen).__name__)
   print("长度：", len(frozen))

   nested = {frozenset({1, 2}), frozenset({3, 4})}
   print("集合里放 frozenset：", len(nested))

   print("并集：", sorted(frozen | {4, 5}))
   print("交集：", sorted(frozen & {2, 3, 9}))

   try:
       frozen.add(4)
   except AttributeError as error:
       print("不可修改：", type(error).__name__, "-", error)

输出结果：

.. code-block:: text

   frozenset： [1, 2, 3] 类型： frozenset
   长度： 3
   集合里放 frozenset： 2
   并集： [1, 2, 3, 4, 5]
   交集： [2, 3]
   不可修改： AttributeError - 'frozenset' object has no attribute 'add'

``frozenset`` 没有 ``add()``、``remove()`` 这些修改方法，调用时会抛出 ``AttributeError``。``frozen | {4, 5}`` 的结果仍然是 ``frozenset``，参与运算的两个集合都不会被修改。

七、集合推导式
--------------

集合推导式的写法与列表推导式几乎一样，只是把方括号换成花括号：``{表达式 for 元素 in 可迭代对象 if 条件}``。它在遍历过程中自动去重，适合一步完成“过滤 + 转换 + 去重”。

需要生成“坐标对”“标签组合”这类复合元素时，表达式部分写成元组即可，元组是可哈希的，可以正常放进集合。

.. code-block:: python

   numbers = [1, 2, 2, 3, 4, 5, 5, 6]
   squares = {n * n for n in numbers}
   print("平方集合：", sorted(squares))

   evens = {n for n in numbers if n % 2 == 0}
   print("偶数集合：", sorted(evens))

   words = ["Python", "java", "GO", "rust"]
   lengths = {len(word) for word in words}
   print("单词长度：", sorted(lengths))

   pairs = {(x, y) for x in [1, 2] for y in ["a", "b"]}
   print("笛卡尔积：", sorted(pairs))

输出结果：

.. code-block:: text

   平方集合： [1, 4, 9, 16, 25, 36]
   偶数集合： [2, 4, 6]
   单词长度： [2, 4, 6]
   笛卡尔积： [(1, 'a'), (1, 'b'), (2, 'a'), (2, 'b')]

``{n * n for n in numbers}`` 里两个 2 和两个 5 只各算一次，所以平方集合有 6 个元素。多重 ``for`` 的顺序与嵌套循环一致：先写外层，再写内层。

八、成员测试
------------

``in`` 和 ``not in`` 用来判断元素是否属于集合。集合的查找走哈希表，平均时间复杂度是 O(1)；列表需要从头逐个比较，平均是 O(n)，数据量越大差距越明显。

因此“先转成集合再反复判断”是脚本里非常常见的优化手段。反过来说，如果只需要判断一两次，额外构造集合的开销可能反而更大。

.. code-block:: python

   valid = {"read", "write", "delete"}
   print("read in valid：", "read" in valid)
   print("admin in valid：", "admin" in valid)
   print("admin not in valid：", "admin" not in valid)

   values = [n % 10 for n in range(1000)]
   lookup_set = set(values)
   print("列表长度：", len(values), "集合长度：", len(lookup_set))
   print("7 在列表中：", 7 in values)
   print("7 在集合中：", 7 in lookup_set)

输出结果：

.. code-block:: text

   read in valid： True
   admin in valid： False
   admin not in valid： True
   列表长度： 1000 集合长度： 10
   7 在列表中： True
   7 在集合中： True

列表里的 1000 个元素只取到 0 到 9 十个值，转成集合后长度立刻降到 10。``in`` 用在字典上时判断的是键，不要和判断值混淆。

九、与列表的对比
----------------

集合和列表都能保存一组数据，但定位完全不同：列表强调顺序和下标，集合强调去重和快速判断。选错类型，代码要么变慢，要么直接报错。

.. csv-table::
   :header: "对比项", "列表 list", "集合 set"

   "顺序", "有序，按插入顺序保存", "无序，遍历顺序不保证"
   "重复元素", "允许重复", "自动去重"
   "下标访问", "支持 ``items[0]`` 与切片", "不支持下标与切片"
   "成员判断", "逐个比较，平均 O(n)", "哈希查找，平均 O(1)"
   "可变性", "可变", "可变，但元素必须可哈希"
   "典型用途", "按顺序保存一批数据", "去重、关系运算、快速判断"

.. code-block:: python

   items = [3, 1, 3, 2]
   unique_items = set(items)

   print("列表：", items, "长度：", len(items))
   print("集合排序后：", sorted(unique_items), "长度：", len(unique_items))
   print("列表有下标：", items[0])

   try:
       print(unique_items[0])
   except TypeError as error:
       print("集合不可下标：", type(error).__name__, "-", error)

输出结果：

.. code-block:: text

   列表： [3, 1, 3, 2] 长度： 4
   集合排序后： [1, 2, 3] 长度： 3
   列表有下标： 3
   集合不可下标： TypeError - 'set' object is not subscriptable

需要按下标取值、保留重复项、维持插入顺序时用列表；需要去重、求交并差、频繁判断成员时用集合。两者可以随时互转，``list(set(...))`` 会丢掉顺序，``sorted(set(...))`` 才是稳定的写法。

练习任务
--------

任务 1：两个班级的参赛名单分别用集合表示，求两班都参加的人、全部参赛人员、只在一班的人，以及只在一个班出现的人。

.. code-block:: python

   class_a = {"小明", "小红", "小刚", "小丽"}
   class_b = {"小红", "小丽", "小强"}

   print("两班都参加：", sorted(class_a & class_b))
   print("全部人员：", sorted(class_a | class_b))
   print("只在一班：", sorted(class_a - class_b))
   print("只在一个班：", sorted(class_a ^ class_b))

输出结果：

.. code-block:: text

   两班都参加： ['小丽', '小红']
   全部人员： ['小丽', '小刚', '小强', '小明', '小红']
   只在一班： ['小刚', '小明']
   只在一个班： ['小刚', '小强', '小明']

任务 2：去掉列表中的重复单词，保持第一次出现的顺序，并找出所有重复出现过的单词。

.. code-block:: python

   words = ["python", "go", "python", "rust", "go", "c"]
   seen = set()
   ordered = []

   for word in words:
       if word not in seen:
           seen.add(word)
           ordered.append(word)

   repeated = {word for word in words if words.count(word) > 1}

   print("原列表：", words)
   print("保持顺序去重：", ordered)
   print("集合去重排序：", sorted(set(words)))
   print("重复单词：", sorted(repeated))

输出结果：

.. code-block:: text

   原列表： ['python', 'go', 'python', 'rust', 'go', 'c']
   保持顺序去重： ['python', 'go', 'rust', 'c']
   集合去重排序： ['c', 'go', 'python', 'rust']
   重复单词： ['go', 'python']

任务 3：检查用户权限是否覆盖了操作所需的全部权限，并列出缺少和多余的权限。

.. code-block:: python

   required = {"read", "write"}
   owned = {"read", "write", "delete"}

   missing = required - owned
   extra = owned - required

   print("缺少权限：", sorted(missing))
   print("多余权限：", sorted(extra))
   print("是否满足：", required.issubset(owned))
   print("权限完全一致：", required == owned)

输出结果：

.. code-block:: text

   缺少权限： []
   多余权限： ['delete']
   是否满足： True
   权限完全一致： False
