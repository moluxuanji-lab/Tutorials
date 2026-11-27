Python 模块
==========

.. meta::
   :group: 进阶
   :summary: 掌握 import、from import、as 别名、自定义模块、sys.path、__name__ 主程序入口、包与 __init__.py、dir() 以及模块缓存的工作方式。

模块是 Python 组织代码的基本单位。一个 ``.py`` 文件就是一个模块，模块里可以定义函数、类和变量；包则是包含 ``__init__.py`` 的目录，用来把多个模块按层级组织起来。标准库和第三方库正是靠这套机制拼接成庞大的生态。

本章从最基本的 ``import`` 写法开始，依次介绍导入形式、自定义模块、搜索路径、主程序入口、包、``dir()``、常用标准模块，最后解释模块缓存为什么会让“改了文件却不生效”。示例中创建的临时模块都会在同一个代码块内清理，块与块之间互不影响。

一、import 语句
---------------

``import`` 把整个模块加载进来，并绑定到同名变量上。调用模块里的函数时必须带上模块名前缀，这样能一眼看出函数来自哪里，也避免不同模块的同名函数互相覆盖。

.. code-block:: python

   import math
   import statistics

   print("圆周率：", math.pi)
   print("平方根：", math.sqrt(144))
   print("向上取整：", math.ceil(3.2))
   print("平均值：", statistics.mean([2, 4, 6]))
   print("类型：", type(math).__name__)
   print("模块名：", math.__name__)

输出结果：

.. code-block:: text

   圆周率： 3.141592653589793
   平方根： 12.0
   向上取整： 4
   平均值： 4
   类型： module
   模块名： math

``import`` 得到的是一个模块对象，函数和常量都是它的属性，所以写作 ``math.sqrt``。模块的 ``__name__`` 属性就是它的名字，``type(math).__name__`` 则说明模块对象的类型是 ``module``。

Python 允许一行导入多个模块，例如 ``import math, statistics``，但分成两行更符合 PEP 8 的建议。导入顺序通常按“标准库、第三方库、本地模块”分组，每组之间空一行。

几种导入形式的对比如下：

.. csv-table::
   :header: "写法", "含义", "调用方式"

   "``import math``", "导入整个模块", "``math.sqrt(9)``"
   "``import math as m``", "导入模块并起别名", "``m.sqrt(9)``"
   "``from math import sqrt``", "只导入指定名字", "``sqrt(9)``"
   "``from math import sqrt as s``", "导入名字并起别名", "``s(9)``"
   "``from math import *``", "导入全部公开名字", "``sqrt(9)``"

二、from ... import
-------------------

``from module import name`` 只把指定的名字绑定到当前命名空间，调用时不需要前缀。名字少、使用频繁时可以少写很多字符，但名字的来源会变得不那么直观。

.. code-block:: python

   from math import sqrt, factorial
   from statistics import mean

   print("sqrt(81)：", sqrt(81))
   print("5!：", factorial(5))
   print("平均分：", mean([80, 90, 100]))

   try:
       print(pi)
   except NameError as error:
       print("未导入的名字：", type(error).__name__, "-", error)

输出结果：

.. code-block:: text

   sqrt(81)： 9.0
   5!： 120
   平均分： 90
   未导入的名字： NameError - name 'pi' is not defined

只导入 ``sqrt`` 和 ``factorial``，并不意味着 ``math`` 里的其他名字也可用，``pi`` 没有导入，访问时直接抛出 ``NameError``。需要哪些名字就写哪些名字，比 ``from math import *`` 更可控。

星号导入会把模块里所有不以单下划线开头的名字都塞进当前命名空间，容易覆盖同名变量，也让静态检查工具难以判断名字来源。除了交互式试验，正式代码应避免这种写法。

三、as 别名
-----------

``as`` 给模块或导入的名字起一个别名。常见用途有三种：缩短过长的模块名、避免与已有变量冲突、在切换实现时保持调用代码不变。

.. code-block:: python

   import datetime as dt
   from math import factorial as fact

   today = dt.date(2024, 5, 1)
   print("日期：", today.isoformat())
   print("星期：", today.weekday())
   print("6 的阶乘：", fact(6))
   print("模块真名：", dt.__name__)

输出结果：

.. code-block:: text

   日期： 2024-05-01
   星期： 2
   6 的阶乘： 720
   模块真名： datetime

``dt.date`` 比 ``datetime.date`` 少写四个字符，在频繁使用日期类型的文件里很实用。``today.weekday()`` 返回 0 到 6，周一是 0，所以 2024 年 5 月 1 日（周三）返回 2。

别名只影响当前文件的绑定名字，模块自身的 ``__name__`` 仍然是 ``datetime``。第三方库常约定俗成的别名，例如 ``import numpy as np``、``import pandas as pd``，阅读代码时应当尊重这些惯例。

四、自定义模块
--------------

任何 ``.py`` 文件都可以被导入，文件名去掉扩展名就是模块名。下面在代码块内先写出 ``helper.py``，再导入它、调用其中的函数，最后删除文件，保证示例自包含。

.. code-block:: python

   import os
   import shutil

   source = """def shout(text):
       return text.upper() + "!"


   def word_count(text):
       return len(text.split())


   VERSION = "1.0"
   """

   with open("helper.py", "w", encoding="utf-8") as file:
       file.write(source)

   try:
       import helper

       print("模块版本：", helper.VERSION)
       print("shout：", helper.shout("hello"))
       print("单词数：", helper.word_count("python is fun"))
       print("模块文件：", os.path.basename(helper.__file__))
       print("模块名：", helper.__name__)
   finally:
       if os.path.exists("helper.py"):
           os.remove("helper.py")
       shutil.rmtree("__pycache__", ignore_errors=True)
       print("清理完成：", not os.path.exists("helper.py"))

输出结果：

.. code-block:: text

   模块版本： 1.0
   shout： HELLO!
   单词数： 3
   模块文件： helper.py
   模块名： helper
   清理完成： True

``import helper`` 会在当前目录查找 ``helper.py``，执行其中的顶层代码，然后把模块对象绑定到 ``helper``。``helper.__file__`` 指向源文件路径，``helper.__name__`` 是模块名。

导入时模块顶层的语句会真正执行，因此模块里不要放耗时或有副作用的操作。只把函数、类、常量放在顶层，把测试和演示代码放进 ``if __name__ == "__main__":`` 分支，下一节会详细说明。

``__pycache__`` 是 Python 自动生成的字节码缓存目录，删除它不影响功能，只是下次导入需要重新编译。

五、sys.path 与模块搜索路径
---------------------------

``import`` 并不是在当前目录里盲目查找，而是按 ``sys.path`` 列表中的目录顺序搜索。列表的第一项通常是脚本所在目录，后面依次是 ``PYTHONPATH``、标准库目录和第三方包的安装目录。

.. code-block:: python

   import os
   import shutil
   import sys

   folder = "mylib"
   os.makedirs(folder, exist_ok=True)
   with open(os.path.join(folder, "greeter.py"), "w", encoding="utf-8") as file:
       file.write('def hello(name):\n    return f"你好，{name}！"\n')

   script_dir = os.path.dirname(os.path.abspath(__file__))
   print("脚本目录在搜索路径中：", script_dir in [os.path.abspath(p) for p in sys.path])
   print("mylib 已在路径中：", folder in sys.path)

   target = os.path.abspath(folder)
   sys.path.insert(0, target)
   print("加入后 mylib 在路径中：", target in sys.path)

   try:
       import greeter

       print(greeter.hello("小明"))
   finally:
       if target in sys.path:
           sys.path.remove(target)
       shutil.rmtree(folder, ignore_errors=True)
       print("清理完成：", not os.path.exists(folder))

输出结果：

.. code-block:: text

   脚本目录在搜索路径中： True
   mylib 已在路径中： False
   加入后 mylib 在路径中： True
   你好，小明！
   清理完成： True

``sys.path`` 里的条目是目录而不是文件，而且通常是绝对路径，所以相对目录名 ``mylib`` 不会直接命中。调用 ``os.path.abspath()`` 转成绝对路径后插入列表头部，``import greeter`` 就能在 ``mylib`` 目录里找到 ``greeter.py``。

临时修改 ``sys.path`` 只对当前进程有效，脚本退出后自动恢复。正式项目更推荐把包安装到虚拟环境，或者用 ``pip install -e .`` 做可编辑安装，而不是在代码里手动拼接路径。

六、__name__ 与主程序入口
-------------------------

每个模块都有 ``__name__`` 属性。直接运行文件时，它的值是 ``"__main__"``；被其他模块导入时，它的值是模块名。利用这一点，可以让同一个文件既能当脚本执行，又能被安全导入。

.. code-block:: python

   import os
   import runpy
   import shutil
   import sys

   print("直接运行时的 __name__：", __name__)

   source = """def main():
       print("执行主程序逻辑")


   if __name__ == "__main__":
       main()
   else:
       print("被当作模块导入")
   """

   with open("main_demo.py", "w", encoding="utf-8") as file:
       file.write(source)

   try:
       import main_demo

       print("导入后的模块名：", main_demo.__name__)
       runpy.run_path("main_demo.py", run_name="__main__")
   finally:
       if "main_demo" in sys.modules:
           del sys.modules["main_demo"]
       if os.path.exists("main_demo.py"):
           os.remove("main_demo.py")
       shutil.rmtree("__pycache__", ignore_errors=True)
       print("清理完成：", not os.path.exists("main_demo.py"))

输出结果：

.. code-block:: text

   直接运行时的 __name__： __main__
   被当作模块导入
   导入后的模块名： main_demo
   执行主程序逻辑
   清理完成： True

示例文件自身被当作脚本运行，所以第一行输出 ``__main__``。``main_demo.py`` 被导入时走 ``else`` 分支，只打印“被当作模块导入”；``runpy.run_path(..., run_name="__main__")`` 模拟了“直接运行该文件”的场景，于是进入 ``if`` 分支执行 ``main()``。

真实项目里不需要 ``runpy``，直接在命令行输入 ``python main_demo.py`` 即可。主程序入口的价值在于：测试代码不会在别人 ``import`` 你的模块时被意外执行。

七、包与 __init__.py
--------------------

包是带层级的模块集合，本质是包含 ``__init__.py`` 的目录。导入包里的模块时用点号分隔，例如 ``import shapes.area``；``area`` 的完整模块名就是 ``shapes.area``。

.. code-block:: python

   import os
   import shutil

   package = "shapes"
   os.makedirs(package, exist_ok=True)
   with open(os.path.join(package, "__init__.py"), "w", encoding="utf-8") as file:
       file.write('"""图形计算包。"""\n\nNAME = "shapes"\n')
   with open(os.path.join(package, "area.py"), "w", encoding="utf-8") as file:
       file.write(
           "def square(side):\n"
           "    return side * side\n"
           "\n"
           "def circle(radius):\n"
           "    return round(3.14159 * radius * radius, 2)\n"
       )

   try:
       import shapes
       from shapes import area

       print("包名：", shapes.NAME)
       print("正方形面积：", area.square(4))
       print("圆面积：", area.circle(2))
       print("包文件：", os.path.basename(shapes.__file__))
       print("模块名：", area.__name__)
   finally:
       shutil.rmtree(package, ignore_errors=True)
       print("清理完成：", not os.path.exists(package))

输出结果：

.. code-block:: text

   包名： shapes
   正方形面积： 16
   圆面积： 12.57
   包文件： __init__.py
   模块名： shapes.area
   清理完成： True

导入包时，``__init__.py`` 会先被执行，里面定义的 ``NAME`` 直接成为包的属性。``from shapes import area`` 导入子模块；也可以写 ``import shapes.area``，之后通过 ``shapes.area.square()`` 调用。

``__init__.py`` 可以是空文件，它的存在让目录成为常规包；也可以在里面对外暴露常用接口，例如 ``from .area import square``，让调用方写 ``shapes.square()``。Python 3 还支持不带 ``__init__.py`` 的命名空间包，但常规项目仍建议显式创建它，结构更清晰。

八、dir() 函数
--------------

``dir()`` 返回对象可用名字的排序列表。传入模块时列出模块的公开接口，传入实例时列出属性和方法。它适合在交互式环境里快速探索一个不熟悉的模块。

.. code-block:: python

   import math

   names = [name for name in dir(math) if not name.startswith("_")]
   print("包含 sqrt：", "sqrt" in names)
   print("包含 pi：", "pi" in names)
   print("前五个：", sorted(names)[:5])


   class Demo:
       def __init__(self):
           self.value = 1

       def run(self):
           return self.value


   demo = Demo()
   public = sorted(name for name in dir(demo) if not name.startswith("_"))
   print("实例公开属性：", public)

输出结果：

.. code-block:: text

   包含 sqrt： True
   包含 pi： True
   前五个： ['acos', 'acosh', 'asin', 'asinh', 'atan']
   实例公开属性： ['run', 'value']

``dir()`` 的结果包含双下划线开头的特殊名字，例如 ``__name__``、``__doc__``，筛选时通常把它们过滤掉。``dir(demo)`` 同时列出类方法和实例属性，``run`` 来自类，``value`` 来自 ``__init__`` 中的赋值。

``dir()`` 只列出名字，不告诉你类型和用法。配合 ``help()`` 或 ``inspect`` 模块，才能看到函数签名和文档字符串。

九、常用标准模块
----------------

标准库覆盖了日常开发的大部分基础能力，下面这些模块几乎每个项目都会用到：

* ``math``：平方根、三角函数、对数、常量 ``pi`` 与 ``e``。
* ``statistics``：均值、中位数、众数、标准差等统计函数。
* ``random``：随机数生成，正式实验应固定种子以便复现。
* ``datetime``：日期、时间、时间差与格式化。
* ``json``：JSON 文本与 Python 对象互相转换。
* ``os`` 与 ``sys``：文件路径、环境变量、解释器信息。
* ``pathlib``：面向对象的路径操作，比字符串拼接更安全。
* ``collections``：``deque``、``Counter``、``defaultdict`` 等专用容器。
* ``re``：正则表达式匹配与替换。
* ``itertools``：排列、组合、分组等迭代工具。

math 与 statistics
~~~~~~~~~~~~~~~~~~

.. code-block:: python

   import math
   import statistics
   from random import Random

   data = [12, 7, 9, 15, 7, 11]
   print("math.sqrt(2)：", round(math.sqrt(2), 4))
   print("statistics.mean：", statistics.mean(data))
   print("statistics.median：", statistics.median(data))
   print("statistics.mode：", statistics.mode(data))

   rng = Random(42)
   picked = [rng.randint(1, 10) for _ in range(5)]
   print("固定种子随机数：", picked)

输出结果：

.. code-block:: text

   math.sqrt(2)： 1.4142
   statistics.mean： 10.166666666666666
   statistics.median： 10.0
   statistics.mode： 7
   固定种子随机数： [2, 1, 5, 4, 4]

``statistics.mode()`` 返回出现次数最多的值 7；数据里有两个 7，其余各一个，所以结果唯一。``median()`` 先排序再取中间两个数的平均值，得到 10.0。

``Random(42)`` 创建独立的随机数生成器，固定种子后每次运行都得到同一串结果，适合写测试和教程。它不会影响全局的 ``random`` 模块状态；真实抽奖、抽样场景不应固定种子。

datetime 与 json
~~~~~~~~~~~~~~~~

.. code-block:: python

   import json
   import os
   from datetime import date, timedelta

   day = date(2024, 5, 1)
   print("日期：", day.isoformat())
   print("100 天后：", (day + timedelta(days=100)).isoformat())

   payload = {"name": "小明", "tags": ["python", "json"], "active": True}
   text = json.dumps(payload, ensure_ascii=False, sort_keys=True)
   print("JSON：", text)
   print("解析后的标签：", json.loads(text)["tags"])

   path = os.path.join("docs", "python", "modules.rst")
   print("文件名：", os.path.basename(path))
   print("扩展名：", os.path.splitext(path)[1])
   print("统一斜杠：", path.replace(os.sep, "/"))

输出结果：

.. code-block:: text

   日期： 2024-05-01
   100 天后： 2024-08-09
   JSON： {"active": true, "name": "小明", "tags": ["python", "json"]}
   解析后的标签： ['python', 'json']
   文件名： modules.rst
   扩展名： .rst
   统一斜杠： docs/python/modules.rst

``date + timedelta`` 返回新的日期对象，原对象不变。``json.dumps()`` 的 ``ensure_ascii=False`` 让中文按原样输出，``sort_keys=True`` 固定键的顺序，方便比对结果。``os.path.join`` 会按平台使用分隔符，展示时统一替换成斜杠即可跨平台。

十、模块缓存
------------

Python 把已导入的模块保存在 ``sys.modules`` 字典里。第二次 ``import`` 同一个名字时，解释器直接返回缓存中的模块对象，不会重新执行文件，这也是大型项目导入速度不会随重复导入线性变慢的原因。

.. code-block:: python

   import importlib
   import os
   import shutil
   import sys

   source = """print("模块加载中")
   VALUE = 1
   """

   with open("cache_demo.py", "w", encoding="utf-8") as file:
       file.write(source)

   try:
       import cache_demo

       print("第一次导入 VALUE：", cache_demo.VALUE)
       print("已在 sys.modules：", "cache_demo" in sys.modules)

       import cache_demo as again

       print("第二次导入同一对象：", again is cache_demo)

       with open("cache_demo.py", "w", encoding="utf-8") as file:
           file.write('print("模块重新加载")\nVALUE = 2\n')

       print("修改文件后 VALUE：", cache_demo.VALUE)
       importlib.reload(cache_demo)
       print("reload 后 VALUE：", cache_demo.VALUE)
   finally:
       if "cache_demo" in sys.modules:
           del sys.modules["cache_demo"]
       if os.path.exists("cache_demo.py"):
           os.remove("cache_demo.py")
       shutil.rmtree("__pycache__", ignore_errors=True)
       print("清理完成：", not os.path.exists("cache_demo.py"))

输出结果：

.. code-block:: text

   模块加载中
   第一次导入 VALUE： 1
   已在 sys.modules： True
   第二次导入同一对象： True
   修改文件后 VALUE： 1
   模块重新加载
   reload 后 VALUE： 2
   清理完成： True

“模块加载中”只打印一次，说明第二次 ``import`` 直接复用了缓存。修改源文件后，已经导入的模块对象仍然是旧代码，``VALUE`` 依旧是 1；``importlib.reload()`` 才会重新执行模块顶层代码，把 ``VALUE`` 更新为 2。

交互式调试时可以借助 ``reload()`` 快速验证修改，但正在运行的服务不会因为源文件变化而自动生效，必须重启进程。需要热更新时应使用专门的框架，而不是依赖 ``reload()``。

练习任务
--------

任务 1：编写一个统计工具模块，提供平均值和最大值函数，在主程序中导入并使用，结束后清理生成的模块文件。

.. code-block:: python

   import os
   import shutil

   source = """def average(values):
       return sum(values) / len(values)


   def maximum(values):
       return max(values)
   """

   with open("stats_tools.py", "w", encoding="utf-8") as file:
       file.write(source)

   try:
       from stats_tools import average, maximum

       scores = [88, 92, 76, 95]
       print("平均分：", average(scores))
       print("最高分：", maximum(scores))
   finally:
       if os.path.exists("stats_tools.py"):
           os.remove("stats_tools.py")
       shutil.rmtree("__pycache__", ignore_errors=True)
       print("清理完成：", not os.path.exists("stats_tools.py"))

输出结果：

.. code-block:: text

   平均分： 87.75
   最高分： 95
   清理完成： True

模块名由文件名决定，``stats_tools.py`` 对应 ``import stats_tools``。只导入需要的两个函数，调用时不用写模块前缀；文件删除后模块仍留在 ``sys.modules`` 中，但进程结束后一切归零。

任务 2：用 ``dir()`` 找出 ``math`` 中所有公开的可调用对象，并确认 ``pi`` 不是函数。

.. code-block:: python

   import math

   callables = sorted(
       name
       for name in dir(math)
       if not name.startswith("_") and callable(getattr(math, name))
   )
   print("sqrt 是函数：", "sqrt" in callables)
   print("pi 是函数：", "pi" in callables)
   print("前五个函数：", callables[:5])

输出结果：

.. code-block:: text

   sqrt 是函数： True
   pi 是函数： False
   前五个函数： ['acos', 'acosh', 'asin', 'asinh', 'atan']

``getattr(math, name)`` 取出名字对应的对象，``callable()`` 判断它能否被调用。``pi`` 是浮点常量，不在结果里；``sqrt``、``acos`` 等函数则会被保留。先过滤下划线开头的名字，再排序输出，结果稳定且便于阅读。
