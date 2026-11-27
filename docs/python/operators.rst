Python 运算符
============

.. meta::
   :group: 入门
   :summary: 掌握算术、比较、赋值、海象运算符、位运算、逻辑、成员与身份运算符的用法，理解优先级、``/`` 与 ``//`` 的区别以及 ``==`` 与 ``is`` 的差异。

运算符是对数据做运算的符号。Python 的运算符数量不多，但每一类都有容易踩坑的细节：``/`` 和 ``//`` 的结果类型不同，``and`` 返回的是操作数而不是布尔值，``is`` 判断的是身份而不是相等。这一章按类别逐个讲解，最后给出优先级表和常见误区对比。

一、算术运算符
--------------

Python 支持七种算术运算：加 ``+``、减 ``-``、乘 ``*``、除 ``/``、整除 ``//``、取余 ``%``、幂 ``**``。其中 ``+``、``*`` 对字符串和列表还有“拼接”“重复”的含义，``%`` 对字符串则是格式化占位符。

``divmod()`` 一次返回商和余数，等价于 ``(a // b, a % b)``，在需要同时拿到两者的场合比写两次运算更清晰。

.. code-block:: python

   a, b = 17, 5

   print("a + b =", a + b)
   print("a - b =", a - b)
   print("a * b =", a * b)
   print("a / b =", a / b)
   print("a // b =", a // b)
   print("a % b =", a % b)
   print("a ** b =", a ** b)
   print("divmod(a, b) =", divmod(a, b))
   print("-a // b =", -a // b)
   print("b - a =", b - a)

输出结果：

.. code-block:: text

   a + b = 22
   a - b = 12
   a * b = 85
   a / b = 3.4
   a // b = 3
   a % b = 2
   a ** b = 1419857
   divmod(a, b) = (3, 2)
   -a // b = -4
   b - a = -12

``-a // b`` 得到 ``-4`` 而不是 ``-3``，因为 Python 的整除是向下取整（朝负无穷方向），而不是简单地截断小数部分。取余的结果也跟随这个规则：``-17 % 5`` 是 ``3``，保证 ``商 * 除数 + 余数`` 恒等于被除数。

拼接与重复
~~~~~~~~~~~

字符串与列表同样可以使用 ``+`` 和 ``*``：

.. code-block:: python

   print("Py" + "thon")
   print("ab" * 3)
   print([1, 2] + [3, 4])
   print([0] * 4)
   print("-" * 20)

输出结果：

.. code-block:: text

   Python
   ababab
   [1, 2, 3, 4]
   [0, 0, 0, 0]
   --------------------

注意 ``[0] * 4`` 只适合存放不可变元素。如果写成 ``[[]] * 3``，三个位置会指向同一个列表，修改其中一个，其余两个也会跟着变。

二、除法 / 与整除 //
-------------------

``/`` 是“真除法”，无论操作数是整数还是浮点数，结果一律是 ``float``。``//`` 是“地板除法”，结果是向下取整后的商，两个整数相除得到 ``int``，只要有一边是浮点数，结果就是 ``float``。

.. code-block:: python

   pairs = [(7, 2), (7, -2), (-7, 2), (6, 3)]

   for x, y in pairs:
       print(f"{x} / {y} = {x / y}，{x} // {y} = {x // y}，余数 = {x % y}")

   print("7.5 // 2 =", 7.5 // 2)
   print("7.5 % 2 =", 7.5 % 2)
   print("10 / 4 =", 10 / 4, "10 // 4 =", 10 // 4)

输出结果：

.. code-block:: text

   7 / 2 = 3.5，7 // 2 = 3，余数 = 1
   7 / -2 = -3.5，7 // -2 = -4，余数 = -1
   -7 / 2 = -3.5，-7 // 2 = -4，余数 = 1
   6 / 3 = 2.0，6 // 3 = 2，余数 = 0
   7.5 // 2 = 3.0
   7.5 % 2 = 1.5
   10 / 4 = 2.5 10 // 4 = 2

``6 / 3`` 的结果是 ``2.0`` 而不是 ``2``，这是初学者最常遇到的类型问题：需要整数结果时应当显式写 ``int(6 / 3)`` 或者直接使用 ``//``。另外，``//`` 对负数的向下取整方向与 C、Java 的截断取整不同，做数值换算时要留出容差。

三、比较运算符
--------------

比较运算符包括 ``==``、``!=``、``<``、``<=``、``>``、``>=``，结果永远是布尔值 ``True`` 或 ``False``。Python 允许把多个比较连起来写，``60 <= score < 100`` 等价于 ``60 <= score and score < 100``，但前者只会计算一次 ``score``。

.. code-block:: python

   scores = [88, 92, 75]

   print("88 < 92：", 88 < 92)
   print("88 >= 92：", 88 >= 92)
   print("75 != 88：", 75 != 88)
   print("88 == 88.0：", 88 == 88.0)

   score = 92
   print("60 <= 92 < 100：", 60 <= score < 100)
   print("等价写法：", 60 <= score and score < 100)
   print("降序排列：", sorted(scores, reverse=True))
   print("最大值唯一：", scores.count(max(scores)) == 1)

输出结果：

.. code-block:: text

   88 < 92： True
   88 >= 92： False
   75 != 88： True
   88 == 88.0： True
   60 <= 92 < 100： True
   等价写法： True
   降序排列： [92, 88, 75]
   最大值唯一： True

``88 == 88.0`` 为真，因为 ``==`` 比较的是数值大小，不是类型。整数与浮点数之间、整数与复数之间都可以直接比较相等性，但 ``<``、``>`` 这类大小比较不能用于复数。

四、赋值运算符与海象运算符
--------------------------

赋值运算符把运算和赋值合并成一步：``+=``、``-=``、``*=``、``/=``、``//=``、``%=``、``**=``，位运算也有对应的 ``&=``、``|=``、``^=``、``<<=``、``>>=``。

海象运算符 ``:=`` 是 Python 3.8 引入的“赋值表达式”，它能在表达式内部完成赋值，常用于 ``if``、``while`` 的条件位置，避免先算一遍再判断：

.. code-block:: python

   x = 7
   x += 3
   print("+= 3 后：", x)
   x -= 4
   print("-= 4 后：", x)
   x *= 5
   print("*= 5 后：", x)
   x //= 4
   print("//= 4 后：", x)
   x %= 4
   print("%= 4 后：", x)
   x **= 3
   print("**= 3 后：", x)

   data = [12, 5, 8, 21, 3, 17]
   if (total := sum(data)) > 50:
       print("总和超过 50：", total)

   values = [1, 2, 3, 4, 5, 6]
   while (count := len(values)) > 3:
       values.pop()
   print("剩余元素个数：", count)

   doubled = [y for n in [3, 9, 14] if (y := n * 2) > 10]
   print("过滤后的结果：", doubled)

输出结果：

.. code-block:: text

   += 3 后： 10
   -= 4 后： 6
   *= 5 后： 30
   //= 4 后： 7
   %= 4 后： 3
   **= 3 后： 27
   总和超过 50： 66
   剩余元素个数： 3
   过滤后的结果： [18, 28]

``x += 3`` 对不可变对象等价于 ``x = x + 3``；对列表这类可变对象，``+=`` 会就地扩展（相当于 ``extend()``），而 ``x = x + [4]`` 会创建一个新列表。两种写法在存在多个引用时行为不同，需要就地修改时用 ``+=``。

五、位运算符
------------

位运算符直接操作整数的二进制位：按位与 ``&``、按位或 ``|``、按位异或 ``^``、按位取反 ``~``、左移 ``<<``、右移 ``>>``。它们最常见的用途是权限标志、掩码和底层协议解析。

``~a`` 的结果是 ``-(a + 1)``，因为 Python 的整数是任意精度补码语义，取反后最高位视为符号位。

.. code-block:: python

   a, b = 12, 10

   print("a =", a, "二进制", bin(a))
   print("b =", b, "二进制", bin(b))
   print("a & b =", a & b, "二进制", bin(a & b))
   print("a | b =", a | b, "二进制", bin(a | b))
   print("a ^ b =", a ^ b, "二进制", bin(a ^ b))
   print("~a =", ~a)
   print("a << 2 =", a << 2)
   print("a >> 2 =", a >> 2)

   READ, WRITE, EXEC = 0b100, 0b010, 0b001
   perm = READ | WRITE
   print("权限值：", perm, bin(perm))
   print("有读权限：", bool(perm & READ))
   print("有执行权限：", bool(perm & EXEC))
   print("去掉写权限：", bin(perm & ~WRITE))

输出结果：

.. code-block:: text

   a = 12 二进制 0b1100
   b = 10 二进制 0b1010
   a & b = 8 二进制 0b1000
   a | b = 14 二进制 0b1110
   a ^ b = 6 二进制 0b110
   ~a = -13
   a << 2 = 48
   a >> 2 = 3
   权限值： 6 0b110
   有读权限： True
   有执行权限： False
   去掉写权限： 0b100

``x << n`` 等价于 ``x * 2 ** n``，``x >> n`` 等价于 ``x // 2 ** n``（向下取整）。位运算只接受整数，传入浮点数会直接抛出 ``TypeError``。

六、逻辑运算符
--------------

逻辑运算符有三个：``and``、``or``、``not``。它们有两个容易误解的地方：

* ``and`` 和 ``or`` 返回的是**操作数本身**，不是 ``True`` / ``False``。``0 or "默认值"`` 得到字符串 ``"默认值"``。
* 两者都采用短路求值：``and`` 遇到假值就停下，``or`` 遇到真值就停下，右边的表达式不会被执行。

.. code-block:: python

   def trace(label, value):
       print("  求值", label)
       return value

   print("and 短路：")
   result = trace("False", False) and trace("True", True)
   print("结果：", result)

   print("or 短路：")
   result = trace("True", True) or trace("False", False)
   print("结果：", result)

   print("and 返回操作数：", 0 or "默认值", "|", "小明" and "已登录")
   print("not：", not 0, not 1, not [], not [0])
   print("组合条件：", (88 > 60) and not (88 > 90))

输出结果：

.. code-block:: text

   and 短路：
     求值 False
   结果： False
   or 短路：
     求值 True
   结果： True
   and 返回操作数： 默认值 | 已登录
   not： True False True False
   组合条件： True

短路特性常被用来写“取默认值”：``name = user_input or "匿名"``，当 ``user_input`` 是空字符串时自动退回默认值。但如果 ``user_input`` 可能是 ``0`` 或 ``False`` 这类合法假值，这种写法会误判，应当改用 ``if user_input is None`` 显式判断。

七、成员运算符与身份运算符
--------------------------

成员运算符 ``in``、``not in`` 判断某个值是否存在于容器中：对列表、元组、字符串是逐个查找，对字典是查找键，对集合是哈希查找。

身份运算符 ``is``、``is not`` 判断两个名字是否指向**同一个对象**，比较的是内存地址，而不是内容。

.. code-block:: python

   fruits = ["apple", "banana", "cherry"]
   print("banana in fruits：", "banana" in fruits)
   print("grape not in fruits：", "grape" not in fruits)
   print("app in apple：", "app" in "apple")
   print("键是否存在：", "name" in {"name": "小明"})
   print("值是否存在：", "小明" in {"name": "小明"}.values())

   a = [1, 2]
   b = a
   c = [1, 2]
   print("a is b：", a is b)
   print("a is c：", a is c)
   print("a == c：", a == c)
   print("a is not c：", a is not c)
   print("None 判断：", None is None)

输出结果：

.. code-block:: text

   banana in fruits： True
   grape not in fruits： True
   app in apple： True
   键是否存在： True
   值是否存在： True
   a is b： True
   a is c： False
   a == c： True
   a is not c： True
   None 判断： True

``b = a`` 只是给同一个列表再起一个名字，所以 ``a is b`` 为真；``c`` 是另建的列表，内容相同但对象不同，所以 ``a is c`` 为假而 ``a == c`` 为真。判断 ``None`` 一律用 ``is None``，既语义准确，也比 ``== None`` 更快。

八、运算符优先级
----------------

同一个表达式里出现多个运算符时，优先级高的先算。记不住全部规则时，加括号永远是最稳妥的做法。下表从高到低排列，同一行的运算符优先级相同，按结合性决定计算顺序：

.. csv-table::
   :header: "优先级", "运算符", "说明", "结合性"

   "1", "``( )``、``[ ]``、``{ }``", "括号、列表、字典、集合字面量", "从左到右"
   "2", "``x[i]``、``x.attr``、``f()``", "下标、属性访问、函数调用", "从左到右"
   "3", "``**``", "幂运算", "从右到左"
   "4", "``+x``、``-x``、``~x``", "正号、负号、按位取反", "从右到左"
   "5", "``*``、``/``、``//``、``%``、``@``", "乘、除、整除、取余、矩阵乘", "从左到右"
   "6", "``+``、``-``", "加、减", "从左到右"
   "7", "``<<``、``>>``", "左移、右移", "从左到右"
   "8", "``&``", "按位与", "从左到右"
   "9", "``^``", "按位异或", "从左到右"
   "10", "``|``", "按位或", "从左到右"
   "11", "``<``、``<=``、``>``、``>=``、``==``、``!=``、``in``、``is``", "比较、成员、身份", "从左到右"
   "12", "``not x``", "逻辑非", "从右到左"
   "13", "``and``", "逻辑与", "从左到右"
   "14", "``or``", "逻辑或", "从左到右"
   "15", "``:=``", "赋值表达式", "从右到左"

两个容易记错的点：``**`` 的优先级高于一元负号，所以 ``-2 ** 2`` 是 ``-4``；``and`` 的优先级高于 ``or``，所以 ``True or False and False`` 仍是 ``True``。

.. code-block:: python

   print("2 + 3 * 4 =", 2 + 3 * 4)
   print("(2 + 3) * 4 =", (2 + 3) * 4)
   print("2 ** 3 ** 2 =", 2 ** 3 ** 2)
   print("-2 ** 2 =", -2 ** 2)
   print("2 + 3 & 1 =", 2 + 3 & 1)
   print("not 1 == 2 =", not 1 == 2)
   print("1 + 1 == 2 and 3 > 2 =", 1 + 1 == 2 and 3 > 2)
   print("True or False and False =", True or False and False)
   print("(True or False) and False =", (True or False) and False)

输出结果：

.. code-block:: text

   2 + 3 * 4 = 14
   (2 + 3) * 4 = 20
   2 ** 3 ** 2 = 512
   -2 ** 2 = -4
   2 + 3 & 1 = 1
   not 1 == 2 = True
   1 + 1 == 2 and 3 > 2 = True
   True or False and False = True
   (True or False) and False = False

``2 ** 3 ** 2`` 是 ``2 ** 9`` 而不是 ``8 ** 2``，因为幂运算从右到左结合；``2 + 3 & 1`` 先算加法得 ``5``，再与 ``1`` 做按位与得到 ``1``。这两处如果不确定，直接补括号即可。

九、== 与 is 的区别
-------------------

``==`` 比较值是否相等，``is`` 比较是否是同一个对象。两个列表内容一样，``==`` 为真；但它们是分别创建的两个对象，``is`` 为假。判断“值”用 ``==``，判断“同一个对象”或“是不是 ``None``”才用 ``is``。

.. code-block:: python

   x = [1, 2, 3]
   y = [1, 2, 3]
   z = x

   print("x == y：", x == y)
   print("x is y：", x is y)
   print("x is z：", x is z)
   print("id 相同：", id(x) == id(z))

   first = "python"
   second = "".join(["py", "thon"])
   print("first == second：", first == second)
   print("first is second：", first is second)

   empty1 = []
   empty2 = []
   print("两个空列表相等：", empty1 == empty2)
   print("身份并不相同：", empty1 is empty2)

输出结果：

.. code-block:: text

   x == y： True
   x is y： False
   x is z： True
   id 相同： True
   first == second： True
   first is second： False
   两个空列表相等： True
   身份并不相同： False

小整数和短字符串在 CPython 里存在缓存与驻留机制，``is`` 偶尔会对内容相同的字面量返回真，这是实现细节，不能依赖。判断相等就用 ``==``，这样换到 PyPy 等其他实现上结果依然正确。

十、练习任务
------------

任务 1：用算术和逻辑运算符判断闰年。规则是能被 4 整除且不能被 100 整除，或者能被 400 整除。

.. code-block:: python

   def is_leap(year):
       return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)

   for year in [1900, 2000, 2023, 2024]:
       print(year, "是闰年" if is_leap(year) else "不是闰年")

输出结果：

.. code-block:: text

   1900 不是闰年
   2000 是闰年
   2023 不是闰年
   2024 是闰年

任务 2：用位运算实现一套简单的权限系统，支持授权、回收和查询。

.. code-block:: python

   READ, WRITE, EXEC = 0b100, 0b010, 0b001

   def describe(perm):
       names = []
       if perm & READ:
           names.append("读")
       if perm & WRITE:
           names.append("写")
       if perm & EXEC:
           names.append("执行")
       return "、".join(names) if names else "无"

   perm = READ
   perm |= WRITE
   print("授权后：", bin(perm), describe(perm))
   perm |= EXEC
   print("追加执行：", bin(perm), describe(perm))
   perm &= ~WRITE
   print("回收写权限：", bin(perm), describe(perm))
   print("是否还有写权限：", bool(perm & WRITE))

输出结果：

.. code-block:: text

   授权后： 0b110 读、写
   追加执行： 0b111 读、写、执行
   回收写权限： 0b101 读、执行
   是否还有写权限： False

任务 3：遍历一批字符串，把能转成整数的累加起来，非法值跳过，最后输出有效值个数、总和与平均值。

.. code-block:: python

   raw = ["12", "7", "abc", "0", "5"]
   total = 0

   for item in raw:
       try:
           total += int(item)
       except ValueError:
           print("跳过非法值：", item)

   valid = sum(1 for item in raw if item.isdigit())
   print("有效值个数：", valid)
   print("累加结果：", total)
   print("平均值：", round(total / len(raw), 2))

输出结果：

.. code-block:: text

   跳过非法值： abc
   有效值个数： 4
   累加结果： 24
   平均值： 4.8
