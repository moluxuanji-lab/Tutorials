Python 基础语法
================

.. meta::
   :group: 入门
   :summary: 掌握标识符命名、保留字、行与缩进、多行语句、字符串引号、注释、print 输出、import 导入以及变量赋值与链式赋值的写法。

语法是写程序时最先要跨过的一道门槛。Python 的语法规则不多，但每一条都直接决定代码能不能运行：名字怎么起、什么时候必须换行、缩进几个空格、字符串用哪种引号、模块怎么导入。这一章把这些基础规则集中讲清楚，并给出可以直接运行的示例。

一、标识符命名规则
------------------

标识符就是给变量、函数、类、模块等起的名字。Python 对标识符的硬性要求只有几条：

* 只能由字母、数字和下划线组成，其中“字母”包括中文等 Unicode 字母。
* 不能以数字开头，``2user``、``3d_model`` 都不合法。
* 区分大小写，``name``、``Name``、``NAME`` 是三个不同的名字。
* 不能与 Python 保留字相同，也不能包含空格、连字符等符号。
* 长度没有限制，但名字应当能说明用途，不要用 ``a``、``b``、``tmp`` 敷衍。

``str.isidentifier()`` 可以判断一个字符串是否符合标识符的构成规则，``keyword.iskeyword()`` 则用来排除保留字。两者需要配合使用，因为 ``class`` 这类保留字同样能让 ``isidentifier()`` 返回真。

.. code-block:: python

   import keyword

   candidates = [
       "name",
       "_count",
       "user2",
       "2user",
       "my-name",
       "class",
       "中文变量",
       "total_price",
       "__init__",
       "with space",
   ]

   for name in candidates:
       if not name.isidentifier():
           result = "非法：含非法字符或以数字开头"
       elif keyword.iskeyword(name):
           result = "非法：是保留字"
       else:
           result = "合法"
       print(f"{name!r}：{result}")

输出结果：

.. code-block:: text

   'name'：合法
   '_count'：合法
   'user2'：合法
   '2user'：非法：含非法字符或以数字开头
   'my-name'：非法：含非法字符或以数字开头
   'class'：非法：是保留字
   '中文变量'：合法
   'total_price'：合法
   '__init__'：合法
   'with space'：非法：含非法字符或以数字开头

中文可以作为标识符，是因为 Python 3 的标识符遵循 Unicode 规则。不过在团队协作中，除非项目本身就以中文命名，否则更常见的做法仍然是用英文单词加下划线。

常见命名约定
~~~~~~~~~~~~

Python 社区遵循 PEP 8 的命名习惯，不同对象使用不同风格：

.. csv-table::
   :header: "风格", "示例", "适用对象"

   "小写下划线", "``user_name``、``total_price``", "变量、函数、模块"
   "大驼峰", "``UserName``、``HttpClient``", "类名"
   "全大写", "``MAX_SIZE``、``DEFAULT_TIMEOUT``", "模块级常量"
   "单下划线开头", "``_cache``", "内部使用，提示不要外部导入"
   "双下划线开头", "``__secret``", "触发名称改写，避免子类冲突"
   "双下划线包围", "``__init__``、``__doc__``", "解释器约定的特殊方法或属性"

这些只是约定，不遵守也不会报错，但统一风格能让他人更快读懂代码。

二、Python 保留字
-----------------

保留字（也叫关键字）是语言本身占用的单词，不能拿来当作标识符。Python 3.13 一共有 35 个保留字，可以按用途分成几组：

保留字分组
~~~~~~~~~~

.. csv-table::
   :header: "类别", "保留字", "用途"

   "常量", "``False``、``None``、``True``", "布尔值与空值"
   "逻辑运算", "``and``、``or``、``not``", "组合或取反条件"
   "条件分支", "``if``、``elif``、``else``", "按条件选择执行路径"
   "循环控制", "``for``、``while``、``break``、``continue``", "遍历、循环与提前退出"
   "异常处理", "``try``、``except``、``finally``、``raise``、``assert``", "捕获、清理与主动抛出异常"
   "函数与类", "``def``、``return``、``lambda``、``class``、``yield``", "定义函数、类与生成器"
   "模块导入", "``import``、``from``、``as``", "导入模块与起别名"
   "作用域", "``global``、``nonlocal``", "在函数内声明外层变量"
   "上下文管理", "``with``", "自动管理资源释放"
   "删除与占位", "``del``、``pass``", "删除引用与占位"
   "成员与身份", "``in``、``is``", "判断成员关系与对象身份"
   "异步编程", "``async``、``await``", "定义与等待协程"

除了这些固定保留字，``match``、``case``、``type``、``_`` 属于软关键字：它们只在特定语法位置被当作关键字，平时仍可作为变量名。可以用 ``keyword.issoftkeyword()`` 判断。

在代码中查看
~~~~~~~~~~~~

``keyword.kwlist`` 保存了全部保留字。下面的代码按首字母分组打印，方便快速浏览：

.. code-block:: python

   import keyword

   groups = {}
   for word in sorted(keyword.kwlist):
       groups.setdefault(word[0].lower(), []).append(word)

   for letter in sorted(groups):
       print(letter.upper() + ":", ", ".join(groups[letter]))

   print("保留字总数：", len(keyword.kwlist))

输出结果：

.. code-block:: text

   A: and, as, assert, async, await
   B: break
   C: class, continue
   D: def, del
   E: elif, else, except
   F: False, finally, for, from
   G: global
   I: if, import, in, is
   L: lambda
   N: None, nonlocal, not
   O: or
   P: pass
   R: raise, return
   T: True, try
   W: while, with
   Y: yield
   保留字总数： 35

保留字不能用作变量名、函数名或类名。写代码时如果拿不准某个词能不能用，直接调用 ``keyword.iskeyword()`` 判断即可。

三、行与缩进
------------

Python 用换行表示一条语句结束，不像 C、Java 那样需要在行尾写分号。同一行写多条语句可以用分号分隔，例如 ``a = 1; b = 2``，但这种写法可读性差，不推荐。

代码块则完全依靠缩进划分。``if``、``for``、``while``、``def``、``class``、``try`` 等语句以冒号结尾，下一行必须缩进，通常使用 4 个空格。同一个代码块内的语句必须保持相同的缩进量，多一个或少一个空格都会报错。

.. code-block:: python

   def classify(score):
       if score >= 90:
           level = "优秀"
       elif score >= 60:
           level = "及格"
       else:
           level = "不及格"
       return level

   for value in [95, 72, 48]:
       print(f"{value} 分：{classify(value)}")

输出结果：

.. code-block:: text

   95 分：优秀
   72 分：及格
   48 分：不及格

缩进不只是排版，它是语法的一部分。空行会被忽略，所以可以在函数之间、逻辑段落之间留空行提升可读性，但空行不能改变缩进层级。

.. tip::

   在编辑器里把 Tab 自动展开成 4 个空格，可以避免绝大多数“看起来对齐、实际不一致”的缩进问题。

四、多行语句
------------

一条语句太长时，有两种换行方式。

第一种是在行尾加反斜杠 ``\``，表示下一行继续当前语句。反斜杠后面不能再写注释，也不能有空格。

第二种是使用圆括号、方括号或花括号。只要表达式还处在未闭合的括号中，Python 就允许自由换行，这也是 PEP 8 更推荐的方式。

.. code-block:: python

   total = 1 + 2 + 3 \
           + 4 + 5

   numbers = [
       10,
       20,
       30,
   ]

   result = (
       numbers[0]
       + numbers[1]
       + numbers[2]
   )

   print("total =", total)
   print("result =", result)
   print("sum =", sum(numbers))

输出结果：

.. code-block:: text

   total = 15
   result = 60
   sum = 60

列表、字典、函数参数列表都可以直接跨行书写。括号内的换行不需要反斜杠，缩进也只影响可读性，不影响语义。

五、字符串引号
--------------

Python 的字符串可以用单引号或双引号包裹，两者完全等价。选择哪一种，通常取决于字符串内容里出现了哪种引号：内容里有双引号就用单引号包裹，内容里有单引号就用双引号包裹，这样可以少写转义。

如果内容里两种引号都有，可以用反斜杠转义，或者在字符串前加 ``r`` 写成原始字符串。原始字符串中的反斜杠不再表示转义，适合书写 Windows 路径和正则表达式。

三个连续的单引号或双引号可以创建多行字符串，换行会原样保留。函数或模块开头的三引号字符串还会被当作文档字符串。

.. code-block:: python

   single = 'Python'
   double = "Python"
   quote = '他说："你好"'
   apostrophe = "It's easy"
   escaped = 'It\'s easy'
   path = r"C:\Users\python"
   multiline = """第一行
   第二行"""

   print(single, double)
   print(quote)
   print(apostrophe)
   print(escaped)
   print(path)
   print(multiline)
   print("多行字符串长度：", len(multiline))

输出结果：

.. code-block:: text

   Python Python
   他说："你好"
   It's easy
   It's easy
   C:\Users\python
   第一行
   第二行
   多行字符串长度： 7

``multiline`` 的内容是“第一行”加一个 ``\n`` 再加“第二行”，一共 7 个字符：六个汉字加一个换行符。注意三引号字符串里的缩进也会成为内容的一部分，写多行文本时不要把代码缩进带进去。

六、注释
--------

注释用来解释代码意图，解释器会直接忽略。Python 只有一种注释符号：``#``。从 ``#`` 开始到行尾的内容都是注释，可以单独占一行，也可以写在语句末尾。

Python 没有专门的多行注释语法。需要写多行说明时，可以连续使用多行 ``#``，也可以使用三引号字符串。后者在函数、类、模块开头会被解释器保存为文档字符串，可以通过 ``__doc__`` 读取，因此更适合写接口说明，而不是随手注释掉一段代码。

.. code-block:: python

   import math

   # 单行注释：计算圆的面积
   radius = 3

   def circle_area(r):
       """返回圆的面积，保留两位小数。"""
       return round(math.pi * r * r, 2)

   area = circle_area(radius)  # 行尾注释
   print("半径：", radius)
   print("面积：", area)
   print("函数说明：", circle_area.__doc__)

   # 连续的多行注释，通常每行都以 # 开头
   # Python 没有专门的多行注释符号

输出结果：

.. code-block:: text

   半径： 3
   面积： 28.27
   函数说明： 返回圆的面积，保留两位小数。

注释应当说明“为什么这么做”，而不是重复代码已经写清楚的事情。例如 ``radius = 3  # 把 3 赋给 radius`` 就是没有价值的注释。

七、print 输出
--------------

``print()`` 把内容输出到标准输出。它接受任意多个参数，默认用空格分隔，并在末尾自动换行。关键字参数 ``sep`` 可以改变分隔符，``end`` 可以改变结尾字符。

格式化输出常用三种方式：直接用逗号分隔多个值、使用 f-string、使用 ``%`` 占位符。f-string 在字符串前加 ``f``，用花括号嵌入变量或表达式，可读性最好，是现在的主流写法。

.. code-block:: python

   name = "小明"
   score = 92.5

   print("姓名：", name, "分数：", score)
   print("姓名：", name, "分数：", score, sep="|")
   print("A", "B", "C", sep="-")
   print("加载中", end="")
   print("...完成")
   print(f"{name} 的分数是 {score:.1f}")
   print("百分号格式化：%.1f" % score)

输出结果：

.. code-block:: text

   姓名： 小明 分数： 92.5
   姓名：|小明|分数：|92.5
   A-B-C
   加载中...完成
   小明 的分数是 92.5
   百分号格式化：92.5

``print()`` 不带参数时只输出一个换行，常用来分隔不同的输出段落。需要控制小数位数时，f-string 的 ``:.1f`` 和 ``%`` 的 ``%.1f`` 都表示保留一位小数。

八、import 导入
---------------

标准库和第三方库的功能都放在模块里，使用前要先导入。常见的导入形式有三种：

* ``import 模块名``：导入整个模块，通过 ``模块名.成员`` 访问。
* ``from 模块名 import 成员``：只导入指定成员，之后直接使用成员名。
* ``import 模块名 as 别名``：给模块起一个短别名，常用于 ``numpy``、``pandas`` 这类名字较长的库。

导入语句通常写在文件开头。不建议使用 ``from 模块名 import *``，因为它会把大量名字一次性引入当前命名空间，容易和已有变量冲突，也看不出某个名字来自哪里。

.. code-block:: python

   import math
   from math import sqrt, pi
   import statistics as stats

   print("math.sqrt(81) =", math.sqrt(81))
   print("sqrt(2) =", round(sqrt(2), 4))
   print("pi =", round(pi, 4))
   print("mean =", stats.mean([1, 2, 3, 4]))
   print("模块名：", math.__name__)

输出结果：

.. code-block:: text

   math.sqrt(81) = 9.0
   sqrt(2) = 1.4142
   pi = 3.1416
   mean = 2.5
   模块名： math

同一个模块被多次导入时，解释器只会执行一次模块代码，后续导入直接复用缓存。因此把导入语句放在文件顶部不会带来重复加载的开销。

九、缩进错误演示
----------------

缩进错误在编写阶段就会被解释器发现，程序根本不会开始执行。最常见的两种是 ``IndentationError`` 和 ``TabError``：前者表示缩进层级不对，后者表示同一份代码里混用了制表符和空格。

为了在教程里演示错误又不让脚本真的语法错误退出，可以把待检查的代码写成字符串，交给 ``compile()`` 或 ``exec()`` 执行，再用 ``except`` 捕获异常。这样脚本本身始终是合法代码，捕获后打印信息即可正常结束。

.. code-block:: python

   cases = [
       ("缩进不匹配", "value = 10\n    print(value)"),
       ("制表符与空格混用", "if True:\n\tprint('tab')\n        print('space')"),
   ]

   for label, source in cases:
       try:
           exec(compile(source, "<demo>", "exec"))
       except IndentationError as error:
           print(f"{label}：{type(error).__name__}")
           print(f"  第 {error.lineno} 行：{error.msg}")

   fixed = "if True:\n    print('修正后可以正常运行')\n"
   exec(fixed)

输出结果：

.. code-block:: text

   缩进不匹配：IndentationError
     第 2 行：unexpected indent
   制表符与空格混用：TabError
     第 3 行：inconsistent use of tabs and spaces in indentation
   修正后可以正常运行

``TabError`` 是 ``IndentationError`` 的子类，所以一个 ``except IndentationError`` 就能同时捕获两者。实际开发中遇到这类错误，先检查报错行及其上一行的缩进，再把全文件的 Tab 统一替换成 4 个空格。

十、变量赋值与链式赋值
----------------------

Python 的赋值是把名字绑定到对象上，而不是把值复制进变量。``x = 10`` 让名字 ``x`` 指向整数对象 ``10``；之后再写 ``x = 20``，只是让 ``x`` 改指向另一个对象，原来的 ``10`` 不受影响。

链式赋值 ``a = b = c = 0`` 让三个名字同时指向同一个对象。对整数、字符串、元组这类不可变对象，之后重新赋值不会互相影响；但对列表这类可变对象，通过一个名字修改内容，其他名字看到的也会随之改变。

多重赋值 ``x, y = y, x`` 会先计算右边，再依次绑定左边的名字，因此可以一步完成交换，不需要临时变量。

.. code-block:: python

   x = 10
   y = 20

   x, y = y, x
   print("交换后：x =", x, "y =", y)

   a = b = c = 0
   print("链式赋值：", a, b, c)

   a = 1
   print("单独修改 a：", a, b, c)

   first, second = [1, 2]
   print("序列解包：", first, second)

   left = right = [1, 2]
   left.append(3)
   print("共享引用：left =", left, "right =", right)

   count = 5
   count += 2
   count *= 3
   print("增量赋值：", count)

输出结果：

.. code-block:: text

   交换后：x = 20 y = 10
   链式赋值： 0 0 0
   单独修改 a： 1 0 0
   序列解包： 1 2
   共享引用：left = [1, 2, 3] right = [1, 2, 3]
   增量赋值： 21

链式赋值适合给多个计数器设同一个初始值，但不要用它初始化可变对象。``left = right = []`` 看似得到两个空列表，实际只有一个列表被两个名字共享，后续修改很容易互相干扰。需要独立对象时，分别写 ``left = []`` 和 ``right = []``。

十一、练习任务
--------------

任务 1：写一个函数检查一批名字是否为合法标识符，并把“含非法字符”和“是保留字”两种情况区分开。

.. code-block:: python

   import keyword

   def check_name(name):
       if not name.isidentifier():
           return "非法：含非法字符或以数字开头"
       if keyword.iskeyword(name):
           return "非法：Python 保留字"
       return "合法"

   for candidate in ["user_name", "2fast", "for", "数据1", "data-set"]:
       print(f"{candidate}：{check_name(candidate)}")

输出结果：

.. code-block:: text

   user_name：合法
   2fast：非法：含非法字符或以数字开头
   for：非法：Python 保留字
   数据1：合法
   data-set：非法：含非法字符或以数字开头

任务 2：用多行语句计算总分和平均分，再用 ``print()`` 的 ``sep`` 参数输出一张对齐的成绩单。

.. code-block:: python

   scores = {
       "语文": 88,
       "数学": 95,
       "英语": 79,
   }

   total = (
       scores["语文"]
       + scores["数学"]
       + scores["英语"]
   )
   average = round(total / len(scores), 2)

   print("科目", "分数", sep=" | ")
   for subject, score in scores.items():
       print(subject, score, sep=" | ")
   print("总分", total, sep=" | ")
   print("平均分", average, sep=" | ")

输出结果：

.. code-block:: text

   科目 | 分数
   语文 | 88
   数学 | 95
   英语 | 79
   总分 | 262
   平均分 | 87.33

任务 3：仿照第九节，自己构造一段缩进错误的字符串，用 ``exec()`` 配合 ``except IndentationError`` 捕获，打印错误类型和行号；再把缩进改正确，确认修正后的代码可以正常执行。
