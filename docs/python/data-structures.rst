Python 数据结构
==============

.. meta::
   :group: 进阶
   :summary: 用列表、元组、集合、字典和 collections 容器组织数据，掌握栈与队列的多种实现，并用复杂度表格判断该选哪种容器。

程序由数据结构和算法组成。Python 内置的列表、元组、字典、集合已经覆盖了大多数日常需求，标准库的 ``collections`` 又补充了双端队列、计数器、默认字典、命名元组和有序字典等专用容器。熟悉它们的取舍，代码往往能同时变得更短、更快。

本章先看列表如何充当栈和队列，再讨论 ``del``、元组与列表的选择、集合去重和嵌套字典，最后进入 ``collections`` 的专用容器，并用一张表总结常见操作的时间复杂度。示例中的集合与字典在输出前都会排序，保证结果可以逐字复现。

一、用列表实现栈
----------------

栈是后进先出（LIFO）的结构：最后放进去的元素最先被取出。列表的 ``append()`` 和 ``pop()`` 都在末尾操作，平均时间复杂度是 O(1)，因此列表本身就是最顺手的栈。

下面用列表模拟入栈、查看栈顶、出栈和空栈判断：

.. code-block:: python

   stack = []

   stack.append("A")
   stack.append("B")
   stack.append("C")
   print("入栈后：", stack)
   print("栈顶：", stack[-1])
   print("栈大小：", len(stack))

   print("弹出：", stack.pop())
   print("弹出：", stack.pop())
   print("剩余：", stack)

   print("是否为空：", not stack)
   stack.pop()
   print("全部弹出后为空：", len(stack) == 0)

   try:
       stack.pop()
   except IndexError as error:
       print("空栈弹出：", type(error).__name__, "-", error)

输出结果：

.. code-block:: text

   入栈后： ['A', 'B', 'C']
   栈顶： C
   栈大小： 3
   弹出： C
   弹出： B
   剩余： ['A']
   是否为空： False
   全部弹出后为空： True
   空栈弹出： IndexError - pop from empty list

``stack[-1]`` 只读取栈顶，不会弹出元素；``not stack`` 判断空栈，比 ``len(stack) == 0`` 更符合 Python 习惯。空栈调用 ``pop()`` 会抛出 ``IndexError``，正式代码应提前判断，或用 ``try`` 捕获后给出友好提示。

二、用列表实现队列
------------------

队列是先进先出（FIFO）的结构：最早进入的元素最先离开。用列表实现时，``append()`` 负责入队，``pop(0)`` 负责从队首出队。

.. code-block:: python

   queue = ["任务1", "任务2", "任务3"]
   print("初始队列：", queue)

   queue.append("任务4")
   print("入队后：", queue)
   print("队首：", queue[0])

   served = queue.pop(0)
   print("出队：", served)
   print("剩余：", queue)
   print("队首变为：", queue[0])
   print("长度：", len(queue))

输出结果：

.. code-block:: text

   初始队列： ['任务1', '任务2', '任务3']
   入队后： ['任务1', '任务2', '任务3', '任务4']
   队首： 任务1
   出队： 任务1
   剩余： ['任务2', '任务3', '任务4']
   队首变为： 任务2
   长度： 3

功能上完全正确，但 ``pop(0)`` 会把下标 1 之后的元素全部向前移动一位。队列长度为 n 时，这一操作需要搬运 n-1 个元素，复杂度是 O(n)。

pop(0) 的代价
~~~~~~~~~~~~~

列表在内存中是一段连续空间，删除第一个元素后，后面的元素必须依次前移填补空位。队列越长，单次出队越慢；连续出队 n 次的总代价是 O(n²)。

数据量小、只跑一两次时，这种写法简单直接。只要队列可能增长到成千上万个元素，就应该改用 ``collections.deque``，它的 ``popleft()`` 是 O(1)。

三、del 语句
------------

``del`` 是语句而不是函数，它按位置删除元素，不返回被删除的值。除了单个下标，``del`` 还支持切片和整个变量。

.. code-block:: python

   numbers = [10, 20, 30, 40, 50, 60]
   print("原列表：", numbers)

   del numbers[0]
   print("删除下标 0：", numbers)

   del numbers[1:3]
   print("删除切片 [1:3]：", numbers)

   del numbers[-1]
   print("删除最后一个：", numbers)

   value = 99
   del value
   try:
       print(value)
   except NameError as error:
       print("del 变量后：", type(error).__name__, "-", error)

输出结果：

.. code-block:: text

   原列表： [10, 20, 30, 40, 50, 60]
   删除下标 0： [20, 30, 40, 50, 60]
   删除切片 [1:3]： [20, 50, 60]
   删除最后一个： [20, 50]
   del 变量后： NameError - name 'value' is not defined

``del numbers[1:3]`` 删除下标 1 和 2 对应的元素，切片规则与取值时一致，不包含结束下标。``del`` 变量会把名字从当前命名空间移除，之后再访问就抛出 ``NameError``。

清空列表内容可以写 ``del numbers[:]``，它等价于 ``numbers.clear()``；而 ``del numbers`` 连变量名一起删除，两者含义不同。按值删除用 ``remove()``，按位置删除并取回元素用 ``pop()``。

四、元组与列表的选择
--------------------

元组和列表都是有序序列，最大的区别是可变性：列表可以随时增删改，元组创建后不能修改。不可变带来一个关键能力——只要元素都可哈希，元组本身就可哈希，能作为字典的键或集合的元素。

.. code-block:: python

   point = (3, 5)
   print("元组：", point)
   x, y = point
   print("解包：", x, y)

   rgb = ("red", "green", "blue")
   print("同值元组哈希相同：", hash(rgb) == hash(("red", "green", "blue")))

   locations = {rgb: "调色板"}
   print("作为字典键：", locations[rgb])
   print("作为集合元素：", len({rgb, ("red", "green", "blue")}))

   mutable = [3, 5]
   try:
       {mutable: "坐标"}
   except TypeError as error:
       print("列表不可哈希：", type(error).__name__, "-", error)

输出结果：

.. code-block:: text

   元组： (3, 5)
   解包： 3 5
   同值元组哈希相同： True
   作为字典键： 调色板
   作为集合元素： 1
   列表不可哈希： TypeError - unhashable type: 'list'

两个内容相同的元组哈希值相同，所以第二个相同的 ``rgb`` 放进集合后只保留一个元素。列表因为可以修改，哈希值无法固定，尝试把它作为字典键会直接抛出 ``TypeError``。

两者的取舍可以归纳成一张表：

.. csv-table::
   :header: "对比项", "列表 list", "元组 tuple"

   "可变性", "可变，支持增删改", "不可变，创建后不能修改"
   "可哈希", "不可哈希，不能作为字典键", "元素都可哈希时可以作为字典键"
   "内存与速度", "需要预留额外空间，稍大稍慢", "结构紧凑，创建和遍历更快"
   "典型用途", "运行中还会变化的数据集合", "固定记录、坐标、函数多返回值"

需要频繁修改、排序、追加时选列表；表达一条不会变的记录、作为字典键、函数返回多个值时选元组。函数写 ``return x, y`` 时，返回的其实就是元组。

五、集合去重
------------

集合的元素唯一且无序，底层用哈希表实现。把列表传给 ``set()``，重复元素会被自动丢弃；再交给 ``sorted()``，就得到一份顺序稳定的去重结果。

.. code-block:: python

   tags = ["python", "web", "python", "data", "web", "python"]
   unique = sorted(set(tags))
   print("原始：", tags)
   print("去重后：", unique)
   print("数量：", len(tags), "->", len(unique))

   visits = [101, 102, 101, 103, 102, 104]
   print("不重复访客：", sorted(set(visits)))
   print("最小编号：", min(set(visits)))

   seen = set()
   ordered = []
   for tag in tags:
       if tag not in seen:
           seen.add(tag)
           ordered.append(tag)
   print("保持顺序：", ordered)

输出结果：

.. code-block:: text

   原始： ['python', 'web', 'python', 'data', 'web', 'python']
   去重后： ['data', 'python', 'web']
   数量： 6 -> 3
   不重复访客： [101, 102, 103, 104]
   最小编号： 101
   保持顺序： ['python', 'web', 'data']

``set(tags)`` 只负责去重，不负责排序，直接打印集合时元素顺序不可依赖，所以示例统一用 ``sorted()`` 整理。集合的 ``in`` 判断平均是 O(1)，列表是 O(n)，需要反复判重时先转成集合通常更快。

如果既要保留第一次出现的顺序，又要快速判重，可以像示例后半段那样，用一个辅助集合 ``seen`` 记录已出现的元素，再把新元素追加到列表。

六、嵌套字典
------------

嵌套字典是保存层级数据的自然方式：外层键是学生姓名，内层字典保存各科成绩。逐层取值、逐层赋值，结构清晰，也方便按学生遍历。

.. code-block:: python

   students = {
       "小明": {"语文": 92, "数学": 88},
       "小红": {"语文": 85, "数学": 95},
   }

   for name, scores in students.items():
       total = sum(scores.values())
       average = total / len(scores)
       print(f"{name}：总分 {total}，平均 {average:.1f}")

   students["小明"]["英语"] = 90
   print("小明科目：", sorted(students["小明"]))

   print("数学成绩：")
   for name, scores in students.items():
       print(f"  {name} {scores['数学']}")

   for name, scores in sorted(students.items()):
       best = max(scores, key=scores.get)
       print(f"{name} 最高分科目：{best} {scores[best]}")

输出结果：

.. code-block:: text

   小明：总分 180，平均 90.0
   小红：总分 180，平均 90.0
   小明科目： ['数学', '英语', '语文']
   数学成绩：
     小明 88
     小红 95
   小明 最高分科目：语文 92
   小红 最高分科目：数学 95

``students["小明"]["英语"] = 90`` 直接在内层字典新增键，外层字典不需要重新赋值。任何一层键不存在都会抛出 ``KeyError``，读取不确定的键时应使用 ``get()``，或者用后文的 ``defaultdict`` 自动建立默认结构。

内层字典的遍历顺序就是插入顺序，但示例仍然调用 ``sorted()`` 输出，避免把展示结果绑定在书写顺序上。

七、collections 容器
--------------------

``collections`` 是标准库中专门存放容器实现的模块，常用的有：

* ``deque``：双端队列，两端增删都是 O(1)。
* ``Counter``：计数器，统计可哈希对象的出现次数。
* ``defaultdict``：带默认值工厂的字典，键缺失时自动创建。
* ``namedtuple``：带字段名的元组子类，兼顾元组的轻量与对象的可读性。
* ``OrderedDict``：强调顺序的字典，支持把键移到两端。

deque：双端队列
~~~~~~~~~~~~~~~

``deque`` 在两端插入和删除都是 O(1)，是实现队列、滑动窗口、撤销栈的理想结构。它还支持固定最大长度，超出时自动从另一端丢弃旧元素。

.. code-block:: python

   from collections import deque

   queue = deque(["a", "b", "c"])
   print("初始：", list(queue))

   queue.append("d")
   queue.appendleft("z")
   print("两端添加：", list(queue))

   print("右端弹出：", queue.pop())
   print("左端弹出：", queue.popleft())
   print("剩余：", list(queue))

   queue.rotate(1)
   print("右旋 1：", list(queue))
   queue.rotate(-1)
   print("左旋 1：", list(queue))

   limited = deque(maxlen=3)
   for n in range(5):
       limited.append(n)
   print("maxlen=3：", list(limited))

输出结果：

.. code-block:: text

   初始： ['a', 'b', 'c']
   两端添加： ['z', 'a', 'b', 'c', 'd']
   右端弹出： d
   左端弹出： z
   剩余： ['a', 'b', 'c']
   右旋 1： ['c', 'a', 'b']
   左旋 1： ['a', 'b', 'c']
   maxlen=3： [2, 3, 4]

``appendleft()`` 与 ``popleft()`` 在左端操作，正好弥补列表头部操作慢的缺陷。``rotate(1)`` 把末尾元素移到开头，``rotate(-1)`` 反向旋转。``maxlen=3`` 的队列在追加第 4 个元素时，会自动丢弃最早进入的 0。

Counter：计数器
~~~~~~~~~~~~~~~

``Counter`` 是字典的子类，键是元素，值是出现次数。它可以直接接收列表、字符串或任何可迭代对象，最常用的方法是 ``most_common()``。

.. code-block:: python

   from collections import Counter

   words = "apple banana apple cherry banana apple".split()
   counts = Counter(words)
   print("计数：", dict(sorted(counts.items())))
   print("最常见的两个：", counts.most_common(2))
   print("apple 出现次数：", counts["apple"])
   print("不存在的键：", counts["grape"])

   counts.update(["cherry", "date"])
   print("update 后：", dict(sorted(counts.items())))
   print("总元素数：", sum(counts.values()))

   letters = Counter("hello world")
   print("字符串计数：", dict(sorted(letters.items())))
   print("前两位：", letters.most_common(2))

输出结果：

.. code-block:: text

   计数： {'apple': 3, 'banana': 2, 'cherry': 1}
   最常见的两个： [('apple', 3), ('banana', 2)]
   apple 出现次数： 3
   不存在的键： 0
   update 后： {'apple': 3, 'banana': 2, 'cherry': 2, 'date': 1}
   总元素数： 8
   字符串计数： {' ': 1, 'd': 1, 'e': 1, 'h': 1, 'l': 3, 'o': 2, 'r': 1, 'w': 1}
   前两位： [('l', 3), ('o', 2)]

访问不存在的键返回 0，而不是抛出 ``KeyError``，这让计数代码可以省掉初始化判断。``update()`` 是累加计数，不是替换计数；``most_common(n)`` 返回按次数降序排列的前 n 项。

Counter 还支持 ``+``、``-``、``&``、``|`` 等运算，结果只保留计数为正的项，适合合并多份统计结果。

defaultdict：默认字典
~~~~~~~~~~~~~~~~~~~~~

``defaultdict`` 在键不存在时调用工厂函数生成默认值，省去“先判断键是否存在”的样板代码。传入 ``list`` 得到空列表，传入 ``int`` 得到 0，传入 ``set`` 得到空集合。

.. code-block:: python

   from collections import defaultdict

   by_first = defaultdict(list)
   for word in ["apple", "avocado", "banana", "blueberry", "cherry"]:
       by_first[word[0]].append(word)
   print("分组：", dict(sorted(by_first.items())))

   scores = [("小明", 88), ("小红", 95), ("小明", 92)]
   totals = defaultdict(int)
   for name, score in scores:
       totals[name] += score
   print("总分：", dict(sorted(totals.items())))

   unique_tags = defaultdict(set)
   for name, tag in [("a", "x"), ("a", "y"), ("b", "x")]:
       unique_tags[name].add(tag)
   print("去重标签：", {k: sorted(v) for k, v in sorted(unique_tags.items())})

   print("访问不存在的键：", totals["小刚"])
   print("访问后键已存在：", "小刚" in totals)

输出结果：

.. code-block:: text

   分组： {'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry'], 'c': ['cherry']}
   总分： {'小明': 180, '小红': 95}
   去重标签： {'a': ['x', 'y'], 'b': ['x']}
   访问不存在的键： 0
   访问后键已存在： True

``by_first[word[0]].append(word)`` 一行完成“取列表 + 追加”，第一次遇到某个首字母时列表会自动创建。``totals[name] += score`` 同理，缺失的键先按 0 处理。

注意 ``totals["小刚"]`` 这次读取会真正插入键，所以随后 ``"小刚" in totals`` 为 ``True``。只想查询、不想改变字典时，仍然应该使用 ``get()``。

namedtuple：命名元组
~~~~~~~~~~~~~~~~~~~~

``namedtuple`` 用字段名生成一个元组子类。实例仍然支持下标、解包和哈希，同时可以用属性名访问，比普通元组可读，又比完整类轻量。

.. code-block:: python

   from collections import namedtuple

   Point = namedtuple("Point", ["x", "y"])
   p = Point(3, 5)
   print("实例：", p)
   print("按名字访问：", p.x, p.y)
   print("按下标访问：", p[0], p[1])
   a, b = p
   print("解包：", a, b)

   print("字段名：", p._fields)
   print("转字典：", p._asdict())
   print("替换：", p._replace(x=10))

   p2 = Point(3, 5)
   print("值相等：", p == p2)
   print("可哈希：", len({p, p2}))

   try:
       p.x = 10
   except AttributeError as error:
       print("不可修改：", type(error).__name__, "-", error)

输出结果：

.. code-block:: text

   实例： Point(x=3, y=5)
   按名字访问： 3 5
   按下标访问： 3 5
   解包： 3 5
   字段名： ('x', 'y')
   转字典： {'x': 3, 'y': 5}
   替换： Point(x=10, y=5)
   值相等： True
   可哈希： 1
   不可修改： AttributeError - can't set attribute

``_asdict()`` 返回普通字典，``_replace()`` 返回一个新实例，原对象保持不变。字段是只读属性，赋值会抛出 ``AttributeError``；值相同的两个实例相等，也可以放进集合去重。

因为命名元组本质是元组，它同样可以作为字典键，适合表示坐标、数据库记录、配置项这类固定结构。

OrderedDict：有序字典
~~~~~~~~~~~~~~~~~~~~~

Python 3.7 起普通字典也保持插入顺序，但 ``OrderedDict`` 仍有两个独有能力：``move_to_end()`` 调整键的位置，``popitem(last=False)`` 从头部弹出。

.. code-block:: python

   from collections import OrderedDict

   od = OrderedDict()
   od["first"] = 1
   od["second"] = 2
   od["third"] = 3
   print("初始顺序：", list(od))

   od.move_to_end("first")
   print("移到末尾：", list(od))

   od.move_to_end("third", last=False)
   print("移到开头：", list(od))

   od.popitem(last=True)
   print("弹出末尾：", list(od))
   od.popitem(last=False)
   print("弹出开头：", list(od))

   print("与普通字典比较：", OrderedDict([("a", 1), ("b", 2)]) == {"a": 1, "b": 2})
   print("顺序不同比较：", OrderedDict([("a", 1), ("b", 2)]) == OrderedDict([("b", 2), ("a", 1)]))

输出结果：

.. code-block:: text

   初始顺序： ['first', 'second', 'third']
   移到末尾： ['second', 'third', 'first']
   移到开头： ['third', 'second', 'first']
   弹出末尾： ['third', 'second']
   弹出开头： ['second']
   与普通字典比较： True
   顺序不同比较： False

``move_to_end(key)`` 默认把键移到末尾，传入 ``last=False`` 则移到开头；``popitem(last=False)`` 按先进先出弹出。两个 ``OrderedDict`` 比较时顺序不同就不相等，而它与普通 ``dict`` 比较时仍然只看键值。

实现 LRU 缓存、需要显式维护访问顺序时，``OrderedDict`` 比手动拼接列表更清晰；普通业务字典直接用内置 ``dict`` 即可。

八、栈与队列的完整实现
----------------------

把栈和队列封装成类，可以隐藏内部容器，只暴露必要的方法。下面的版本用列表实现栈、用 ``deque`` 实现队列，并额外用栈完成括号匹配。

.. code-block:: python

   from collections import deque


   class Stack:
       def __init__(self):
           self._items = []

       def push(self, item):
           self._items.append(item)

       def pop(self):
           if not self._items:
               raise IndexError("栈为空")
           return self._items.pop()

       def peek(self):
           return self._items[-1]

       def __len__(self):
           return len(self._items)


   class Queue:
       def __init__(self):
           self._items = deque()

       def enqueue(self, item):
           self._items.append(item)

       def dequeue(self):
           if not self._items:
               raise IndexError("队列为空")
           return self._items.popleft()

       def __len__(self):
           return len(self._items)


   def is_balanced(text):
       pairs = {")": "(", "]": "[", "}": "{"}
       stack = Stack()
       for char in text:
           if char in "([{":
               stack.push(char)
           elif char in pairs:
               if len(stack) == 0 or stack.pop() != pairs[char]:
                   return False
       return len(stack) == 0


   stack = Stack()
   for value in [1, 2, 3]:
       stack.push(value)
   print("栈弹出：", stack.pop(), stack.pop(), "剩余：", len(stack))

   queue = Queue()
   for value in ["A", "B", "C"]:
       queue.enqueue(value)
   print("队列出队：", queue.dequeue(), queue.dequeue(), "剩余：", len(queue))

   for expr in ["([]{})", "([)]", "(("]:
       print(expr, is_balanced(expr))

   try:
       Stack().pop()
   except IndexError as error:
       print("空栈异常：", type(error).__name__, "-", error)

输出结果：

.. code-block:: text

   栈弹出： 3 2 剩余： 1
   队列出队： A B 剩余： 1
   ([]{}) True
   ([)] False
   (( False
   空栈异常： IndexError - 栈为空

``Stack`` 用列表保存数据，``Queue`` 用 ``deque``，两者的 ``__len__`` 让 ``len()`` 直接可用。``is_balanced()`` 遇到左括号就入栈，遇到右括号就弹出并核对类型，遍历结束后栈必须为空；``([)]`` 虽然括号数量相同，但嵌套顺序错误，所以返回 ``False``。

类封装的好处是内部容器可以随时替换：把 ``Stack`` 的 ``_items`` 换成 ``deque``，外部调用代码一行都不用改。

九、操作复杂度对比
------------------

下表列出常见操作的平均时间复杂度。实际耗时还受数据规模、缓存局部性和对象大小影响，但复杂度决定了数据量增长时的趋势。

.. csv-table::
   :header: "操作", "列表 list", "双端队列 deque", "集合 / 字典", "说明"

   "按下标访问", "O(1)", "O(n)", "不支持", "deque 需要从头遍历到目标位置"
   "末尾追加", "O(1)", "O(1)", "O(1) 平均", "三者都适合频繁追加"
   "末尾弹出", "O(1)", "O(1)", "不适用", "栈操作的标准写法"
   "头部插入", "O(n)", "O(1)", "不适用", "列表需要整体后移"
   "头部弹出", "O(n)", "O(1)", "不适用", "列表需要整体前移"
   "中间插入或删除", "O(n)", "O(n)", "不适用", "都要移动后续元素"
   "成员判断", "O(n)", "O(n)", "O(1) 平均", "集合与字典走哈希查找"
   "按键取值", "不支持", "不支持", "O(1) 平均", "字典的典型操作"
   "有序遍历", "O(n)", "O(n)", "O(n)", "遍历本身与元素个数成正比"

表中的 O(1) 是平均情况。哈希表在极端冲突下可能退化到 O(n)，但 Python 的哈希实现和扩容策略让这种情况很少出现；如果代码对最坏延迟敏感，需要单独评估。

选择容器时先看访问模式：频繁在头部增删选 ``deque``，频繁按下标读写选 ``list``，频繁判重、求交并差选 ``set``，按键快速取值选 ``dict``。选错容器，算法本身再优雅也会被数据搬移拖慢。

练习任务
--------

任务 1：给定一个整数数组和窗口大小 k，窗口从左向右滑动，输出每个窗口中的最大值。要求用 ``deque`` 把总复杂度控制在 O(n)。

.. code-block:: python

   from collections import deque


   def max_sliding_window(numbers, k):
       result = []
       window = deque()
       for index, value in enumerate(numbers):
           while window and window[0] <= index - k:
               window.popleft()
           while window and numbers[window[-1]] <= value:
               window.pop()
           window.append(index)
           if index >= k - 1:
               result.append(numbers[window[0]])
       return result


   data = [1, 3, -1, -3, 5, 3, 6, 7]
   print("数组：", data)
   print("窗口 k=3：", max_sliding_window(data, 3))

输出结果：

.. code-block:: text

   数组： [1, 3, -1, -3, 5, 3, 6, 7]
   窗口 k=3： [3, 3, 5, 5, 6, 7]

``window`` 中保存的是下标，对应值从队首到队尾单调递减。队首下标超出窗口范围就弹出，新元素入队前把比它小的队尾全部弹出。每个下标最多入队、出队一次，所以整体是 O(n)。

任务 2：统计一段文本的词频，再按单词长度分组，最后输出出现次数最多的单词。

.. code-block:: python

   from collections import Counter, defaultdict

   text = "red blue red green blue red"
   counts = Counter(text.split())
   print("词频：", dict(sorted(counts.items())))

   by_length = defaultdict(list)
   for word in sorted(counts):
       by_length[len(word)].append(word)
   print("按长度分组：", {k: v for k, v in sorted(by_length.items())})
   print("最常见：", counts.most_common(1))

输出结果：

.. code-block:: text

   词频： {'blue': 2, 'green': 1, 'red': 3}
   按长度分组： {3: ['red'], 4: ['blue'], 5: ['green']}
   最常见： [('red', 3)]

``Counter`` 负责计数，``defaultdict(list)`` 负责按长度分组，两个容器各司其职。遍历 ``sorted(counts)`` 而不是直接遍历 ``counts``，可以让同一长度内的单词也保持字母顺序，输出更稳定。
