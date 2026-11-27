Python 基本数据类型
====================

.. meta::
   :group: 入门
   :summary: 认识 Python 的内置数据类型，掌握数字、字符串、列表、元组、集合、字典与 None 的用法，理解可变与不可变的区别，并学会用 type() 与 isinstance() 判断类型。

Python 的变量不需要提前声明类型，赋值时解释器会根据字面量自动创建对应类型的对象。类型决定了这个对象能参与哪些运算、能调用哪些方法，也决定了它是可以被原地修改，还是每次操作都产生一个新对象。

这一章按“数字 → 序列 → 集合 → 映射 → 空值”的顺序介绍最常用的内置类型，每一类都给出可以直接运行的示例。示例之后的输出都是在 Python 3.13 下实际运行得到的结果。

一、数据类型总览
----------------

Python 3 的内置类型可以按用途分成几组：数字用来计算，字符串、列表、元组用来保存有序数据，集合与字典用来保存无序或按键访问的数据，布尔值与 ``None`` 则分别表示真假和空值。

.. csv-table::
   :header: "类型", "关键字", "示例", "可变性"

   "整数", "``int``", "``42``、``-7``", "不可变"
   "浮点数", "``float``", "``3.14``、``2.0``", "不可变"
   "复数", "``complex``", "``1 + 2j``", "不可变"
   "布尔值", "``bool``", "``True``、``False``", "不可变"
   "字符串", "``str``", "``'Python'``", "不可变"
   "列表", "``list``", "``[1, 2, 3]``", "可变"
   "元组", "``tuple``", "``(1, 2, 3)``", "不可变"
   "集合", "``set``", "``{1, 2, 3}``", "可变"
   "字典", "``dict``", "``{'a': 1}``", "可变"
   "空值", "``NoneType``", "``None``", "不可变"

``type()`` 返回对象所属的类型，配合 ``__name__`` 可以只取出类型名。下面把常见的字面量放在一个列表里逐个查看：

.. code-block:: python

   values = [42, 3.14, 1 + 2j, True, "Python", [1, 2], (1, 2), {1, 2}, {"a": 1}, None]

   for value in values:
       print(type(value).__name__)

输出结果：

.. code-block:: text

   int
   float
   complex
   bool
   str
   list
   tuple
   set
   dict
   NoneType

注意 ``True`` 的类型是 ``bool`` 而不是 ``int``，尽管 ``bool`` 是 ``int`` 的子类，在算术运算里会被当作 1 和 0 使用。

二、Number 数字类型
--------------------

数字类型包含整数 ``int``、浮点数 ``float``、复数 ``complex`` 和布尔值 ``bool`` 四种。它们都是不可变对象，任何“修改”实际上都是创建了一个新对象。

整数与浮点数
~~~~~~~~~~~~

``int`` 的精度只受内存限制，可以表示任意大的整数；``float`` 遵循 IEEE 754 双精度标准，取值范围大但存在二进制舍入误差。除法 ``/`` 总是返回浮点数，整除用 ``//``，取余用 ``%``。

复数与布尔值
~~~~~~~~~~~~

复数写作 ``a + bj``，通过 ``.real`` 与 ``.imag`` 取实部和虚部。布尔值只有 ``True`` 和 ``False`` 两个取值，参与运算时分别等于 1 和 0。

.. code-block:: python

   count = 7
   ratio = 3.5
   wave = 1 + 2j

   print("整数：", count, "，类型：", type(count).__name__)
   print("浮点数：", ratio, "，类型：", type(ratio).__name__)
   print("复数：", wave, "，实部：", wave.real, "，虚部：", wave.imag)
   print("大整数：", 2 ** 100)
   print("整除与取余：", 17 // 5, 17 % 5)
   print("布尔参与运算：", True + True, False * 10)
   print("bool 是 int 的子类：", issubclass(bool, int))

输出结果：

.. code-block:: text

   整数： 7 ，类型： int
   浮点数： 3.5 ，类型： float
   复数： (1+2j) ，实部： 1.0 ，虚部： 2.0
   大整数： 1267650600228229401496703205376
   整除与取余： 3 2
   布尔参与运算： 2 0
   bool 是 int 的子类： True

浮点数的误差在涉及金额的场景里不能忽略，``0.1 + 0.2`` 并不等于 ``0.3``。需要精确十进制运算时应该改用 ``decimal`` 模块，而不是用 ``round()`` 掩盖问题。

三、String 字符串
------------------

字符串是 Unicode 字符组成的不可变序列，用单引号、双引号或三引号定义。它支持下标访问、切片、拼接、重复以及大量文本处理方法。

下标从 0 开始，负数下标表示从末尾倒数；切片 ``[start:stop:step]`` 左闭右开，省略边界时取到两端，``step`` 为负数时从后往前取。

.. code-block:: python

   text = "Python 教程"

   print("长度：", len(text))
   print("首字符：", text[0])
   print("切片：", text[:6])
   print("反转：", text[::-1])
   print("重复：", "ab" * 3)
   print("拼接：", "Py" + "thon")
   print("大写：", "python".upper())
   print("替换：", text.replace("教程", "入门"))
   print("分割：", "a,b,c".split(","))
   print("查找：", text.find("教程"))
   print("填充：", f"{'Python':*>8}")

输出结果：

.. code-block:: text

   长度： 9
   首字符： P
   切片： Python
   反转： 程教 nohtyP
   重复： ababab
   拼接： Python
   大写： PYTHON
   替换： Python 入门
   分割： ['a', 'b', 'c']
   查找： 7
   填充： **Python

字符串不可变，所以 ``upper()``、``replace()``、``strip()`` 这类方法都不会改动原字符串，而是返回一个新字符串。忘记接收返回值是初学者最常见的错误之一。

四、List 列表
--------------

列表是可变的有序序列，用方括号定义，元素可以是任意类型，也可以互相嵌套。它是 Python 里使用频率最高的容器，支持增删改、排序、切片和推导式。

.. code-block:: python

   fruits = ["apple", "banana", "cherry"]
   fruits.append("date")
   fruits[1] = "blueberry"

   print(fruits)
   print("长度：", len(fruits))
   print("第一个：", fruits[0], "最后一个：", fruits[-1])
   print("切片：", fruits[1:3])

   numbers = [3, 1, 4, 1, 5]
   numbers.sort()
   print("排序后：", numbers)
   print("求和：", sum(numbers), "最大值：", max(numbers))

   matrix = [[1, 2], [3, 4]]
   print("二维取值：", matrix[1][0])

输出结果：

.. code-block:: text

   ['apple', 'blueberry', 'cherry', 'date']
   长度： 4
   第一个： apple 最后一个： date
   切片： ['blueberry', 'cherry']
   排序后： [1, 1, 3, 4, 5]
   求和： 14 最大值： 5
   二维取值： 3

``append()`` 在末尾追加一个元素，``extend()`` 把另一个可迭代对象的元素逐个追加进来，``insert()`` 在指定位置插入。三者都原地修改列表，返回值是 ``None``。

五、Tuple 元组
---------------

元组是不可变的有序序列，用圆括号定义。它比列表更轻量，可以作为字典的键，也常用来表示一条固定结构的数据，例如坐标、数据库的一行记录。

只有一个元素的元组必须写成 ``(42,)``，逗号才是关键；写成 ``(42)`` 只是一个加了括号的整数。

.. code-block:: python

   point = (3, 5)
   single = (42,)
   mixed = ("Python", 3, True)

   print("坐标：", point)
   print("单元素元组：", single, "，类型：", type(single).__name__)
   print("混合元素：", mixed)

   x, y = point
   print("解包：x =", x, "，y =", y)
   print("长度：", len(mixed))
   print("切片：", mixed[1:])

   try:
       point[0] = 10
   except TypeError:
       print("元组不可修改：捕获到 TypeError")

输出结果：

.. code-block:: text

   坐标： (3, 5)
   单元素元组： (42,) ，类型： tuple
   混合元素： ('Python', 3, True)
   解包：x = 3 ，y = 5
   长度： 3
   切片： (3, True)
   元组不可修改：捕获到 TypeError

解包是元组最常用的写法，``x, y = point`` 会把两个元素依次赋给两个变量。函数返回多个值时，本质上返回的就是一个元组。

六、Set 集合
-------------

集合是无序、元素不重复的容器，用花括号定义，空集合必须用 ``set()`` 创建，因为 ``{}`` 表示的是空字典。集合的成员判断是哈希实现的，平均时间复杂度为 O(1)，非常适合去重和集合运算。

.. code-block:: python

   tags = {"python", "web", "data"}
   tags.add("python")
   tags.add("ai")

   print("元素个数：", len(tags))
   print("排序后：", sorted(tags))

   numbers = {1, 2, 3, 4}
   other = {3, 4, 5}
   print("交集：", sorted(numbers & other))
   print("并集：", sorted(numbers | other))
   print("差集：", sorted(numbers - other))
   print("对称差：", sorted(numbers ^ other))

   empty = set()
   print("空集合：", empty, "，类型：", type(empty).__name__)

输出结果：

.. code-block:: text

   元素个数： 4
   排序后： ['ai', 'data', 'python', 'web']
   交集： [3, 4]
   并集： [1, 2, 3, 4, 5]
   差集： [1, 2]
   对称差： [1, 2, 5]
   空集合： set() ，类型： set

集合元素必须可哈希，列表、字典、集合本身都不能放进集合里。需要把一组列表去重时，通常先转成元组再放入集合。

七、Dictionary 字典
--------------------

字典是键值对组成的映射，用花括号定义，键必须可哈希且不重复。Python 3.7 之后字典保持插入顺序，遍历时按写入顺序返回。

访问不存在的键会抛出 ``KeyError``，用 ``get()`` 可以提供默认值；``keys()``、``values()``、``items()`` 返回的是视图对象，会随字典变化而变化。

.. code-block:: python

   student = {"name": "小明", "age": 18, "score": 92}

   print("键：", list(student.keys()))
   print("值：", list(student.values()))
   print("姓名：", student["name"])
   print("默认值：", student.get("city", "未填写"))

   student["city"] = "北京"
   student["score"] = 95
   print("更新后：", student)

   print("遍历：")
   for key in sorted(student):
       print(f"  {key} = {student[key]}")

   print("是否存在 age 键：", "age" in student)

输出结果：

.. code-block:: text

   键： ['name', 'age', 'score']
   值： ['小明', 18, 92]
   姓名： 小明
   默认值： 未填写
   更新后： {'name': '小明', 'age': 18, 'score': 95, 'city': '北京'}
   遍历：
     age = 18
     city = 北京
     name = 小明
     score = 95
   是否存在 age 键： True

字典的键必须唯一，重复赋值会覆盖旧值，但键的位置保持不变。需要按键排序输出时显式调用 ``sorted()``，不要依赖插入顺序碰巧符合预期。

八、None 空值
--------------

``None`` 是 Python 里表示“没有值”的唯一对象，类型是 ``NoneType``。函数没有显式 ``return`` 时默认返回 ``None``，可选参数也常用它作为默认值。

判断是否为 ``None`` 要用 ``is`` 而不是 ``==``，因为 ``None`` 是全局唯一的单例对象，身份比较既准确又更快。

.. code-block:: python

   result = None
   print("值：", result)
   print("类型：", type(result).__name__)
   print("布尔值：", bool(result))
   print("是否为 None：", result is None)

   def find(items, target):
       for item in items:
           if item == target:
               return item
       return None

   found = find([1, 2, 3], 5)
   if found is None:
       print("没有找到目标元素")

输出结果：

.. code-block:: text

   值： None
   类型： NoneType
   布尔值： False
   是否为 None： True
   没有找到目标元素

``None`` 在布尔上下文中为假，但它不等于 0、空字符串或空列表。用 ``if not value`` 判断会把这些值混在一起，确实只想判断“没有值”时应当写 ``if value is None``。

九、type() 与 isinstance()
---------------------------

``type()`` 返回对象的精确类型，``isinstance()`` 判断对象是否属于某个类型或类型元组，并且会把子类计算在内。日常检查类型时优先使用 ``isinstance()``，它兼容继承关系，也更符合多态的设计。

需要注意 ``bool`` 是 ``int`` 的子类，所以 ``isinstance(True, int)`` 返回 ``True``。如果布尔值要单独处理，必须先判断 ``bool``。

.. code-block:: python

   print(type(42) is int)
   print(type("42") is str)
   print(isinstance(42, int))
   print(isinstance(True, int))
   print(isinstance(3.5, (int, float)))
   print(isinstance("Python", (list, tuple)))

   def describe(value):
       if isinstance(value, bool):
           return "布尔值"
       if isinstance(value, int):
           return "整数"
       if isinstance(value, float):
           return "浮点数"
       if isinstance(value, str):
           return "字符串"
       return "其他类型"

   for item in [True, 7, 2.5, "文本", [1]]:
       print(item, "->", describe(item))

输出结果：

.. code-block:: text

   True
   True
   True
   True
   True
   False
   True -> 布尔值
   7 -> 整数
   2.5 -> 浮点数
   文本 -> 字符串
   [1] -> 其他类型

``type() is`` 这种写法只适合确认“恰好是某个类型”，例如做序列化时需要区分 ``bool`` 和 ``int``。接受子类的场景一律用 ``isinstance()``。

十、可变与不可变
-----------------

可变对象可以在原地修改，所有指向它的名字都会看到变化；不可变对象一旦创建就不能修改，任何运算都会产生新对象。这个区别直接影响赋值、函数传参和默认参数的行为。

.. csv-table::
   :header: "类型", "可变性", "能否原地修改", "可哈希"

   "``int``、``float``、``bool``", "不可变", "不能，运算会创建新对象", "可哈希"
   "``str``", "不可变", "不能，方法返回新字符串", "可哈希"
   "``tuple``", "不可变", "不能，元素不能被替换", "元素都可哈希时才可哈希"
   "``frozenset``", "不可变", "不能，构造后固定", "可哈希"
   "``list``", "可变", "能，支持增删改", "不可哈希"
   "``dict``", "可变", "能，支持增删改键值", "不可哈希"
   "``set``", "可变", "能，支持增删元素", "不可哈希"

下面的示例把两种行为放在一起对比：字符串拼接后是一个新对象，列表追加元素则会影响所有指向同一个列表的名字。

.. code-block:: python

   text = "abc"
   original = text
   text += "d"
   print("字符串：", text)
   print("是否生成新对象：", text is not original)

   items = [1, 2]
   alias = items
   alias.append(3)
   print("列表别名：", items)
   print("是否仍是同一对象：", alias is items)

   number = 10
   number += 5
   print("整数：", number)

输出结果：

.. code-block:: text

   字符串： abcd
   是否生成新对象： True
   列表别名： [1, 2, 3]
   是否仍是同一对象： True
   整数： 15

因为列表是可变对象，``alias = items`` 只是给同一个列表起了第二个名字，并不是复制。需要独立副本时应当写 ``items.copy()`` 或 ``items[:]``，嵌套结构则要用 ``copy.deepcopy()``。

十一、练习任务
---------------

任务 1：统计一段文本的单词总数和不重复单词，并按字母顺序输出不重复的单词。

.. code-block:: python

   sentence = "the quick brown fox jumps over the lazy dog the end"
   words = sentence.split()
   unique = sorted(set(words))

   print("单词总数：", len(words))
   print("不重复单词：", len(unique))
   print("按字母排序：", unique)

输出结果：

.. code-block:: text

   单词总数： 11
   不重复单词： 9
   按字母排序： ['brown', 'dog', 'end', 'fox', 'jumps', 'lazy', 'over', 'quick', 'the']

任务 2：用字典统计字符串中每个字符出现的次数，并按字符顺序输出。

.. code-block:: python

   text = "banana"
   counts = {}

   for char in text:
       counts[char] = counts.get(char, 0) + 1

   for char in sorted(counts):
       print(f"{char}: {counts[char]}")

输出结果：

.. code-block:: text

   a: 3
   b: 1
   n: 2
