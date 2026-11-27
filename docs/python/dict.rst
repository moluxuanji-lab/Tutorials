Python 字典
================

.. meta::
   :group: 核心语法
   :summary: 掌握字典的创建、键的哈希要求、访问与增删改查、遍历与推导式，理解嵌套字典、按值排序以及 | 合并与计数场景。

字典（dict）是 Python 里的映射类型，用键值对保存数据。键必须唯一且可哈希，值可以是任意对象。它基于哈希表实现，按 key 查找的平均时间复杂度是 O(1)，所以数据量变大时依然很快。

Python 3.7 之后，字典同时保证插入顺序：遍历时按写入的先后返回，这对输出结果的可复现性非常重要。

一、创建字典
----------------

最直接的写法是花括号加键值对。``dict()`` 还接受键值对列表、``zip()`` 产生的配对以及关键字参数：

.. code-block:: python

   empty = {}
   literal = {"name": "小明", "age": 18}
   from_pairs = dict([("a", 1), ("b", 2)])
   from_zip = dict(zip(["x", "y"], [10, 20]))
   from_kwargs = dict(name="小红", city="上海")

   print("空字典：", empty)
   print("字面量：", literal)
   print("键值对列表：", from_pairs)
   print("zip 配对：", from_zip)
   print("关键字参数：", from_kwargs)
   print("长度：", len(literal))

输出结果：

.. code-block:: text

   空字典： {}
   字面量： {'name': '小明', 'age': 18}
   键值对列表： {'a': 1, 'b': 2}
   zip 配对： {'x': 10, 'y': 20}
   关键字参数： {'name': '小红', 'city': '上海'}
   长度： 2

``{}`` 表示空字典，而空集合必须写 ``set()``。``dict(zip(keys, values))`` 是把两列数据配成映射的常用手法，``zip()`` 会按较短的序列截断。

二、键的不可变要求
----------------------

键必须是可哈希的对象，实际含义就是“不可变”：数字、字符串、元组可以做键，列表、字典、集合不行。元组做键时，它包含的元素也必须可哈希：

.. code-block:: python

   valid = {(1, 2): "坐标", "name": "小明", 100: "分数"}

   print("合法键：", valid)
   print("元组键取值：", valid[(1, 2)])

   try:
       broken = {[1, 2]: "列表"}
   except TypeError:
       print("列表不可哈希，不能作为键：捕获到 TypeError")

   try:
       broken = {{"a": 1}: "字典"}
   except TypeError:
       print("字典不可哈希，不能作为键：捕获到 TypeError")

   collision = {1: "整数", True: "布尔值"}
   print("1 与 True 是同一个键：", collision)

输出结果：

.. code-block:: text

   合法键： {(1, 2): '坐标', 'name': '小明', 100: '分数'}
   元组键取值： 坐标
   列表不可哈希，不能作为键：捕获到 TypeError
   字典不可哈希，不能作为键：捕获到 TypeError
   1 与 True 是同一个键： {1: '布尔值'}

最后一行值得注意：``1 == True`` 成立，两者的哈希值也相同，所以它们被视为同一个键，后写入的值覆盖先写入的值，而键本身仍是先出现的 ``1``。

三、访问与 KeyError
-----------------------

用方括号按键取值是最常见的方式。键不存在时不会返回 ``None``，而是直接抛出 ``KeyError``，这是字典与 ``get()`` 的关键区别：

.. code-block:: python

   student = {"name": "小明", "age": 18, "score": 92}

   print("姓名：", student["name"])
   print("年龄：", student["age"])

   try:
       print(student["city"])
   except KeyError:
       print("访问不存在的键：捕获到 KeyError")

   student["age"] = 19
   student["city"] = "北京"
   print("新增与修改后：", student)

输出结果：

.. code-block:: text

   姓名： 小明
   年龄： 18
   访问不存在的键：捕获到 KeyError
   新增与修改后： {'name': '小明', 'age': 19, 'score': 92, 'city': '北京'}

对已存在的键赋值是修改，对不存在的键赋值是新增。修改不会改变键的位置，新增的键追加在末尾，这一点在依赖输出顺序时要记牢。

四、get() 与 setdefault()
-----------------------------

``get()`` 在键不存在时返回 ``None`` 或指定的默认值，且不会修改字典；``setdefault()`` 则在键不存在时把默认值写进去，并返回该值：

.. code-block:: python

   config = {"theme": "dark", "lang": "zh"}

   print("存在的键：", config.get("theme"))
   print("不存在的键：", config.get("font"))
   print("指定默认值：", config.get("font", "微软雅黑"))
   print("get 不写入：", config)

   config.setdefault("font", "微软雅黑")
   config.setdefault("theme", "light")
   print("setdefault 之后：", config)

   counts = {}
   for word in ["a", "b", "a"]:
       counts[word] = counts.get(word, 0) + 1
   print("计数：", counts)

输出结果：

.. code-block:: text

   存在的键： dark
   不存在的键： None
   指定默认值： 微软雅黑
   get 不写入： {'theme': 'dark', 'lang': 'zh'}
   setdefault 之后： {'theme': 'dark', 'lang': 'zh', 'font': '微软雅黑'}
   计数： {'a': 2, 'b': 1}

``counts.get(word, 0) + 1`` 是统计频次的标准写法：键第一次出现时取到 0，加 1 后写入。若默认值是列表，用 ``setdefault(key, []).append(...)`` 可以一步完成分组。

五、删除元素
----------------

删除有四种方式：``del`` 按 key 删除，``pop()`` 删除并返回对应的值，``popitem()`` 弹出最后写入的一对，``clear()`` 清空整个字典：

.. code-block:: python

   data = {"a": 1, "b": 2, "c": 3, "d": 4}

   del data["a"]
   print("del 之后：", data)

   value = data.pop("b")
   print("pop 返回：", value, "，剩余：", data)

   last = data.popitem()
   print("popitem 返回：", last, "，剩余：", data)

   print("带默认值的 pop：", data.pop("z", "没有这个键"))
   data.clear()
   print("clear 之后：", data, "，长度：", len(data))

输出结果：

.. code-block:: text

   del 之后： {'b': 2, 'c': 3, 'd': 4}
   pop 返回： 2 ，剩余： {'c': 3, 'd': 4}
   popitem 返回： ('d', 4) ，剩余： {'c': 3}
   带默认值的 pop： 没有这个键
   clear 之后： {} ，长度： 0

``del`` 和不带默认值的 ``pop()`` 在键不存在时都会抛 ``KeyError``，加上默认值参数后就不会报错。``popitem()`` 遵循后进先出，适合逐个取出并处理的场景。

六、更新与合并
------------------

``update()`` 接受另一个字典、键值对序列或关键字参数，把内容并入当前字典：已存在的键被覆盖，新键追加到末尾。它原地修改，返回值是 ``None``：

.. code-block:: python

   profile = {"name": "小明", "age": 18}
   profile.update({"age": 19, "city": "北京"})
   print("合并字典：", profile)

   profile.update([("score", 92), ("city", "上海")])
   print("合并键值对序列：", profile)

   profile.update(email="ming@example.com")
   print("合并关键字参数：", profile)

   extra = {"age": 20, "lang": "Python"}
   result = profile.update(extra)
   print("返回值：", result)
   print("最终结果：", profile)

输出结果：

.. code-block:: text

   合并字典： {'name': '小明', 'age': 19, 'city': '北京'}
   合并键值对序列： {'name': '小明', 'age': 19, 'city': '上海', 'score': 92}
   合并关键字参数： {'name': '小明', 'age': 19, 'city': '上海', 'score': 92, 'email': 'ming@example.com'}
   返回值： None
   最终结果： {'name': '小明', 'age': 20, 'city': '上海', 'score': 92, 'email': 'ming@example.com', 'lang': 'Python'}

把 ``update()`` 的返回值赋给变量是个隐蔽的错误，拿到的是 ``None`` 而不是合并后的字典。需要新字典而不改动原字典时，应当使用下一节介绍的 ``|`` 运算符。

七、遍历字典
----------------

字典的 ``keys()``、``values()`` 和 ``items()`` 返回视图对象，不会复制数据，字典变化时视图同步变化。遍历时优先使用 ``items()``，可以同时拿到键和值：

.. code-block:: python

   scores = {"语文": 92, "数学": 88, "英语": 79}

   print("遍历键：")
   for subject in scores:
       print(" ", subject)

   print("遍历值：")
   for score in scores.values():
       print(" ", score)

   print("遍历键值对：")
   for subject, score in scores.items():
       print(f"  {subject}：{score}")

   print("键列表：", list(scores.keys()))
   print("值的总和：", sum(scores.values()))
   print("是否包含数学：", "数学" in scores)
   print("是否包含物理：", "物理" in scores)

输出结果：

.. code-block:: text

   遍历键：
     语文
     数学
     英语
   遍历值：
     92
     88
     79
   遍历键值对：
     语文：92
     数学：88
     英语：79
   键列表： ['语文', '数学', '英语']
   值的总和： 259
   是否包含数学： True
   是否包含物理： False

``for subject in scores`` 等价于遍历 ``scores.keys()``，直接对字典做 ``in`` 判断时检查的也是键，而不是值。判断值是否存在要写 ``88 in scores.values()``。

八、字典推导式
------------------

和列表推导式一样，字典推导式用一行代码生成新字典，语法是 ``{键表达式: 值表达式 for 变量 in 可迭代对象 if 条件}``：

.. code-block:: python

   numbers = [1, 2, 3, 4, 5]
   print("平方表：", {n: n * n for n in numbers})

   words = ["apple", "banana", "cherry"]
   print("单词长度：", {word: len(word) for word in words})

   print("只保留奇数：", {n: n * n for n in numbers if n % 2 == 1})

   flipped = {value: key for key, value in {"a": 1, "b": 2}.items()}
   print("键值互换：", flipped)

输出结果：

.. code-block:: text

   平方表： {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}
   单词长度： {'apple': 5, 'banana': 6, 'cherry': 6}
   只保留奇数： {1: 1, 3: 9, 5: 25}
   键值互换： {1: 'a', 2: 'b'}

如果原字典的值有重复，键值互换会让后面的条目覆盖前面的条目。需要保留全部映射时，应当把值改成列表，而不是直接反转。

九、嵌套字典
----------------

字典的值可以是另一个字典，这种结构适合表示带层级的记录。访问嵌套值需要连续写多组方括号，层级越深越要考虑键是否一定存在：

.. code-block:: python

   students = {
       "小明": {"age": 18, "scores": {"math": 92, "english": 88}},
       "小红": {"age": 17, "scores": {"math": 95, "english": 91}},
   }

   print("小明的数学：", students["小明"]["scores"]["math"])

   for name, info in students.items():
       total = sum(info["scores"].values())
       print(f"{name}：年龄 {info['age']}，总分 {total}")

   students["小刚"] = {"age": 18, "scores": {"math": 70, "english": 75}}
   print("全部学生：", list(students.keys()))

   students["小红"]["scores"]["math"] = 99
   print("修改后小红的数学：", students["小红"]["scores"]["math"])

输出结果：

.. code-block:: text

   小明的数学： 92
   小明：年龄 18，总分 180
   小红：年龄 17，总分 186
   全部学生： ['小明', '小红', '小刚']
   修改后小红的数学： 99

嵌套字典的修改是逐层深入的：``students["小红"]`` 取到内层字典，再取 ``"scores"``，最后给 ``"math"`` 赋值。中间任何一层不存在，都会抛 ``KeyError``。

十、按值排序
----------------

字典本身没有排序方法，需要排序时把 ``items()`` 转成列表，用 ``key`` 参数指定按值还是按键，再决定是否转回字典：

.. code-block:: python

   scores = {"小明": 92, "小红": 88, "小刚": 95, "小丽": 88}

   ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
   print("按分数降序：")
   for name, score in ranked:
       print(f"  {name}：{score}")

   stable = sorted(scores.items(), key=lambda item: (-item[1], item[0]))
   print("同分按姓名升序：", stable)
   print("前两名：", dict(ranked[:2]))

输出结果：

.. code-block:: text

   按分数降序：
     小刚：95
     小明：92
     小红：88
     小丽：88
   同分按姓名升序： [('小刚', 95), ('小明', 92), ('小丽', 88), ('小红', 88)]
   前两名： {'小刚': 95, '小明': 92}

``key=lambda item: item[1]`` 表示按值排序，``item[0]`` 则是按键排序。用 ``(-item[1], item[0])`` 这种复合键，可以让同分条目的顺序也固定下来，输出不会随字典内部状态漂移。

十一、使用 ``|`` 运算符合并字典
--------------------------------

Python 3.9 起，``|`` 可以直接合并两个字典并返回新字典，``|=`` 则原地更新。它的语义与 ``update()`` 相同，但更简洁、也不会改动参与运算的原字典：

.. code-block:: python

   defaults = {"theme": "light", "lang": "zh", "font": 14}
   custom = {"theme": "dark", "font": 16}

   merged = defaults | custom
   print("合并结果：", merged)
   print("原字典不变：", defaults)

   print("顺序相反：", custom | defaults)

   defaults |= {"zoom": 100}
   print("原地合并：", defaults)

输出结果：

.. code-block:: text

   合并结果： {'theme': 'dark', 'lang': 'zh', 'font': 16}
   原字典不变： {'theme': 'light', 'lang': 'zh', 'font': 14}
   顺序相反： {'theme': 'light', 'font': 14, 'lang': 'zh'}
   原地合并： {'theme': 'light', 'lang': 'zh', 'font': 14, 'zoom': 100}

``|`` 右侧的字典优先，键冲突时右边的值覆盖左边的值。输出顺序则是“左边先出现、右边补充”，所以 ``custom | defaults`` 里 ``theme`` 和 ``font`` 排在前面。

十二、计数器与映射表
------------------------

字典最常见的两个落地场景：用 ``collections.Counter`` 统计频次，用“键到值”的映射表替代一长串 ``if`` / ``elif``：

.. code-block:: python

   from collections import Counter

   text = "to be or not to be that is the question"
   counts = Counter(text.split())
   print("计数结果：", dict(counts))
   print("出现最多的两个：", counts.most_common(2))

   menus = {1: "新建文件", 2: "打开文件", 3: "退出"}
   print("选择 2：", menus.get(2, "无效选项"))
   print("选择 9：", menus.get(9, "无效选项"))

   status_text = {200: "成功", 404: "未找到", 500: "服务器错误"}
   for code in [200, 404]:
       print(code, "->", status_text[code])

输出结果：

.. code-block:: text

   计数结果： {'to': 2, 'be': 2, 'or': 1, 'not': 1, 'that': 1, 'is': 1, 'the': 1, 'question': 1}
   出现最多的两个： [('to', 2), ('be', 2)]
   选择 2： 打开文件
   选择 9： 无效选项
   200 -> 成功
   404 -> 未找到

``Counter`` 是 ``dict`` 的子类，取不存在的键返回 0 而不是抛异常，还提供 ``most_common()``。映射表则把分支判断变成一次查表，新增选项时只改数据、不碰逻辑。

练习任务
------------

任务 1：统计一段文本的词频，按次数降序输出，次数相同时按单词字母升序。

.. code-block:: python

   text = "the cat and the dog and the bird"
   counts = {}

   for word in text.split():
       counts[word] = counts.get(word, 0) + 1

   ranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
   for word, count in ranked:
       print(f"{word}: {count}")

输出结果：

.. code-block:: text

   the: 3
   and: 2
   bird: 1
   cat: 1
   dog: 1

任务 2：根据分数判定等级，再按等级把学生分组，输出分组结果与优秀人数。

.. code-block:: python

   scores = {"小明": 92, "小红": 88, "小刚": 95}
   grades = {}

   for name, score in scores.items():
       if score >= 90:
           grades[name] = "优秀"
       else:
           grades[name] = "良好"

   print("成绩等级：", grades)
   print("优秀人数：", sum(1 for level in grades.values() if level == "优秀"))

   by_level = {}
   for name, level in grades.items():
       by_level.setdefault(level, []).append(name)
   print("按等级分组：", by_level)

输出结果：

.. code-block:: text

   成绩等级： {'小明': '优秀', '小红': '良好', '小刚': '优秀'}
   优秀人数： 2
   按等级分组： {'优秀': ['小明', '小刚'], '良好': ['小红']}
