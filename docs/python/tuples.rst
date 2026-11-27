Python 元组
================

.. meta::
   :group: 核心语法
   :summary: 掌握元组的创建、不可变性、索引切片、解包与星号解包，理解它与列表的取舍，并会用 namedtuple 与元组键组织数据。

元组（tuple）是不可变的有序序列，用圆括号书写，元素之间用逗号分隔。它和列表长得很像，但一旦创建就不能增删改，因此占用更少内存、可以作为字典的键，也更适合表达“一条固定结构的数据”，例如坐标、日期、数据库的一行记录。

这一章从创建讲起，依次覆盖不可变性、切片、解包、拼接、类型转换，最后落到 ``namedtuple`` 和元组作为字典键这两个实际用法。

一、创建元组
----------------

圆括号不是关键，逗号才是。``(42)`` 只是一个加了括号的整数，``(42,)`` 才是单元素元组。省略括号时，只要用逗号分隔，Python 也会自动打包成元组：

.. code-block:: python

   point = (3, 5)
   single = (42,)
   no_parens = 1, 2, 3
   empty = ()
   nested = (1, (2, 3))

   print("坐标：", point)
   print("单元素：", single, "，类型：", type(single).__name__)
   print("省略括号：", no_parens, "，类型：", type(no_parens).__name__)
   print("空元组：", empty, "，长度：", len(empty))
   print("嵌套：", nested)
   print("加了括号的整数：", (42), "，类型：", type((42)).__name__)

输出结果：

.. code-block:: text

   坐标： (3, 5)
   单元素： (42,) ，类型： tuple
   省略括号： (1, 2, 3) ，类型： tuple
   空元组： () ，长度： 0
   嵌套： (1, (2, 3))
   加了括号的整数： 42 ，类型： int

空元组只能写成 ``()``，因为没有元素时逗号无处可放。想要“只有一个元素的元组”却漏掉逗号，是初学者最常见的错误，``len()`` 和遍历的结果会立刻暴露问题。

二、不可变性
----------------

元组创建后不能替换元素，也不能追加或删除。任何试图修改的操作都会抛出异常，而不是悄悄失效：

.. code-block:: python

   point = (3, 5)

   try:
       point[0] = 10
   except TypeError:
       print("替换元素失败：捕获到 TypeError")

   try:
       point.append(7)
   except AttributeError:
       print("追加元素失败：捕获到 AttributeError")

   try:
       del point[1]
   except TypeError:
       print("删除元素失败：捕获到 TypeError")

   print("原元组保持不变：", point)

输出结果：

.. code-block:: text

   替换元素失败：捕获到 TypeError
   追加元素失败：捕获到 AttributeError
   删除元素失败：捕获到 TypeError
   原元组保持不变： (3, 5)

不可变是浅层的：如果元组里装的是列表，列表本身仍然可以修改。所以“元组可以作为字典的键”这个结论有前提——它包含的所有元素也都必须可哈希。

三、索引与切片
------------------

元组支持与列表、字符串一致的索引和切片规则：下标从 0 开始，负数表示从末尾倒数，切片 ``[start:stop:step]`` 左闭右开，越界切片返回空元组而不是报错：

.. code-block:: python

   letters = ("a", "b", "c", "d", "e")

   print("第一个：", letters[0])
   print("最后一个：", letters[-1])
   print("前三个：", letters[:3])
   print("从第 2 个到末尾：", letters[2:])
   print("步长为 2：", letters[::2])
   print("反转：", letters[::-1])
   print("越界切片：", letters[10:])

   try:
       letters[10]
   except IndexError:
       print("越界下标：捕获到 IndexError")

输出结果：

.. code-block:: text

   第一个： a
   最后一个： e
   前三个： ('a', 'b', 'c')
   从第 2 个到末尾： ('c', 'd', 'e')
   步长为 2： ('a', 'c', 'e')
   反转： ('e', 'd', 'c', 'b', 'a')
   越界切片： ()
   越界下标：捕获到 IndexError

切片返回的是新元组，原元组不受影响。用 ``[::-1]`` 反转序列是 Python 的惯用写法，列表和字符串同样适用。

四、解包
------------

把元组的元素一次性赋给多个变量，叫做解包。变量个数必须与元素个数一致，否则抛出 ``ValueError``。函数返回多个值时，本质上返回的就是一个元组：

.. code-block:: python

   point = (3, 5)
   x, y = point
   print("x =", x, "，y =", y)

   def min_max(numbers):
       return min(numbers), max(numbers)

   low, high = min_max([7, 2, 9, 4])
   print("最小值：", low, "，最大值：", high)

   a, b = 1, 2
   a, b = b, a
   print("交换后：a =", a, "，b =", b)

   try:
       p, q, r = point
   except ValueError:
       print("元素个数不匹配：捕获到 ValueError")

输出结果：

.. code-block:: text

   x = 3 ，y = 5
   最小值： 2 ，最大值： 9
   交换后：a = 2 ，b = 1
   元素个数不匹配：捕获到 ValueError

``a, b = b, a`` 之所以能交换，是因为赋值号右边先被打包成一个元组 ``(b, a)``，再解包给左边。不需要临时变量，也不用担心覆盖。

五、星号解包
----------------

在变量名前加 ``*``，可以让它接收“剩下的所有元素”，结果是一个列表。同一个赋值里最多只能有一个带星号的目标，它也不必放在末尾：

.. code-block:: python

   numbers = (1, 2, 3, 4, 5)

   first, *middle, last = numbers
   print("first =", first)
   print("middle =", middle)
   print("last =", last)

   head, *tail = numbers
   print("head =", head, "，tail =", tail)

   *init, final = numbers
   print("init =", init, "，final =", final)

   print(*numbers, sep="-")

输出结果：

.. code-block:: text

   first = 1
   middle = [2, 3, 4]
   last = 5
   head = 1 ，tail = [2, 3, 4, 5]
   init = [1, 2, 3, 4] ，final = 5
   1-2-3-4-5

``print(*numbers, sep="-")`` 把元组拆成五个位置参数，``sep`` 决定分隔符。调用函数时用 ``*`` 展开序列，也是同一种语法。

六、拼接与重复
------------------

``+`` 把两个元组连接成新元组，``*`` 按次数重复。两者都不修改原对象，这与列表的 ``append()``、``extend()`` 有本质区别：

.. code-block:: python

   left = (1, 2)
   right = (3, 4)

   print("拼接：", left + right)
   print("重复：", left * 3)
   print("与空元组相加：", left + ())
   print("原元组不变：", left)

   combined = left + right + (5,)
   print("链式拼接：", combined)
   print("是否包含 3：", 3 in combined)
   print("3 第一次出现的下标：", combined.index(3))

输出结果：

.. code-block:: text

   拼接： (1, 2, 3, 4)
   重复： (1, 2, 1, 2, 1, 2)
   与空元组相加： (1, 2)
   原元组不变： (1, 2)
   链式拼接： (1, 2, 3, 4, 5)
   是否包含 3： True
   3 第一次出现的下标： 2

``+`` 只能连接两个元组，写 ``(1, 2) + [3]`` 会抛出 ``TypeError``。需要把列表内容并进来时，先转成元组再相加。

七、tuple() 转换
--------------------

``tuple()`` 接受任意可迭代对象，把其中的元素依次放进新元组。字符串、列表、``range``、集合、字典的键都可以直接转换：

.. code-block:: python

   print("字符串：", tuple("abc"))
   print("列表：", tuple([1, 2, 3]))
   print("range：", tuple(range(5)))
   print("字典的键：", tuple({"a": 1, "b": 2}))
   print("字典的值：", tuple({"a": 1, "b": 2}.values()))
   print("排序后的集合：", tuple(sorted({3, 1, 2})))

   items = [1, 2, 3]
   converted = tuple(items)
   items.append(4)
   print("转换后互不影响：", converted, items)

输出结果：

.. code-block:: text

   字符串： ('a', 'b', 'c')
   列表： (1, 2, 3)
   range： (0, 1, 2, 3, 4)
   字典的键： ('a', 'b')
   字典的值： (1, 2)
   排序后的集合： (1, 2, 3)
   转换后互不影响： (1, 2, 3) [1, 2, 3, 4]

``tuple()`` 只做浅拷贝，元素本身还是原来那些对象。集合直接转换顺序不确定，先 ``sorted()`` 再转换才能得到稳定结果。

八、元组与列表的取舍
------------------------

两者的接口高度重合，真正的区别在可变性和可哈希性上：

.. csv-table::
   :header: "对比项", "元组 tuple", "列表 list"

   "定义方式", "``(1, 2, 3)``，单元素必须写 ``(1,)``", "``[1, 2, 3]``，单元素直接写 ``[1]``"
   "可变性", "不可变，创建后不能增删改", "可变，支持 ``append()``、``pop()``、排序"
   "可哈希", "元素都可哈希时可以作为字典的键或集合元素", "永远不可哈希，不能作为字典的键"
   "内存占用", "更小，同样元素数量下比列表省内存", "较大，需要预留追加空间"
   "性能", "创建和遍历略快", "按需增长，追加元素更方便"
   "语义", "一条固定结构的记录，元素位置有意义", "一组同类元素的集合，长度可变"
   "典型场景", "坐标、日期、函数多返回值、字典键", "待处理的数据集合、需要原地修改的队列"

最直接的差异体现在能否哈希，下面的代码把两者放在一起对比：

.. code-block:: python

   record = (1, 2)
   collection = [1, 2]

   print("元组作为键：", {record: "坐标"})

   try:
       mapping = {collection: "列表"}
   except TypeError:
       print("列表作为键：捕获到 TypeError")

   print("元组的哈希值可用：", isinstance(hash(record), int))
   print("列表没有 hash 可用：")
   try:
       hash(collection)
   except TypeError:
       print("捕获到 TypeError")

输出结果：

.. code-block:: text

   元组作为键： {(1, 2): '坐标'}
   列表作为键：捕获到 TypeError
   元组的哈希值可用： True
   列表没有 hash 可用：
   捕获到 TypeError

选择的原则很简单：数据一旦确定就不该再变，用元组；需要不断增删改，用列表。把元组当作“只读列表”只是它的一面，它更重要的角色是不可变的记录。

九、namedtuple
------------------

``collections.namedtuple`` 生成一种带字段名的元组子类。它既有属性访问的可读性，又保留了元组的不可变性和低开销：

.. code-block:: python

   from collections import namedtuple

   Point = namedtuple("Point", ["x", "y"])
   p = Point(3, 5)

   print("打印：", p)
   print("按字段访问：x =", p.x, "，y =", p.y)
   print("按下标访问：", p[0], p[1])

   x, y = p
   print("解包：", x, y)

   print("转为字典：", p._asdict())
   print("替换字段：", p._replace(x=10))
   print("仍是元组：", isinstance(p, tuple))

输出结果：

.. code-block:: text

   打印： Point(x=3, y=5)
   按字段访问：x = 3 ，y = 5
   按下标访问： 3 5
   解包： 3 5
   转为字典： {'x': 3, 'y': 5}
   替换字段： Point(x=10, y=5)
   仍是元组： True

``_replace()`` 返回一个新对象，原对象不变，这正好符合元组不可变的语义。字段名不能以数字开头，也不能与关键字重名，否则生成类时就会报错。

十、作为字典键
------------------

元组最常见的“高级”用法是当字典的键。因为坐标、日期、复合主键这类数据天然是多字段的，用元组做键比把字段拼成字符串更清晰：

.. code-block:: python

   locations = {
       (39, 116): "北京",
       (31, 121): "上海",
       (22, 114): "深圳",
   }

   print("(31, 121) 对应的城市：", locations[(31, 121)])
   print("是否存在 (39, 116)：", (39, 116) in locations)
   print("键的数量：", len(locations))

   for coordinate in sorted(locations):
       print(coordinate, "->", locations[coordinate])

   grid = {(0, 0): "起点", (1, 2): "宝藏"}
   grid[(2, 3)] = "营地"
   print("添加后的地图：", grid)

输出结果：

.. code-block:: text

   (31, 121) 对应的城市： 上海
   是否存在 (39, 116)： True
   键的数量： 3
   (22, 114) -> 深圳
   (31, 121) -> 上海
   (39, 116) -> 北京
   添加后的地图： {(0, 0): '起点', (1, 2): '宝藏', (2, 3): '营地'}

元组的比较是按元素逐个进行的，所以对坐标排序会先比第一个分量、再比第二个分量。如果元组里含有列表这类不可哈希的元素，它同样不能作为键。

练习任务
------------

任务 1：给定若干个点，按它们到原点的距离平方升序排列，并输出坐标。

.. code-block:: python

   points = [(3, 4), (1, 1), (0, 2)]

   ranked = sorted((x * x + y * y, (x, y)) for x, y in points)
   for distance, point in ranked:
       print(point, "到原点的距离平方：", distance)

输出结果：

.. code-block:: text

   (1, 1) 到原点的距离平方： 2
   (0, 2) 到原点的距离平方： 4
   (3, 4) 到原点的距离平方： 25

任务 2：用 ``namedtuple`` 表示员工记录，把原始行数据转换成对象，并统计总薪资。

.. code-block:: python

   from collections import namedtuple

   Employee = namedtuple("Employee", ["name", "dept", "salary"])
   rows = [
       ("小明", "研发", 18000),
       ("小红", "研发", 21000),
       ("小刚", "市场", 15000),
   ]

   staff = [Employee(*row) for row in rows]
   print("总薪资：", sum(person.salary for person in staff))
   for person in staff:
       print(f"{person.name}（{person.dept}）：{person.salary}")

输出结果：

.. code-block:: text

   总薪资： 54000
   小明（研发）：18000
   小红（研发）：21000
   小刚（市场）：15000

任务 3：把一组分数用星号解包成首场、中间场次和末场，并计算中间场次的平均分。

.. code-block:: python

   scores = (88, 92, 79, 95, 85)

   first, *middle, last = scores
   print("第一场：", first)
   print("最后一场：", last)
   print("中间场次：", middle)
   print("中间平均分：", round(sum(middle) / len(middle), 2))

输出结果：

.. code-block:: text

   第一场： 88
   最后一场： 85
   中间场次： [92, 79, 95]
   中间平均分： 88.67
