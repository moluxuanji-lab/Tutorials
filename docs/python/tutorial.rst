Python 教程
============

.. meta::
   :group: 入门
   :summary: 认识 Python 的定位、核心特点与典型应用场景，写下第一个可以运行的 Python 程序。

Python 是一门简洁、易读、功能强大的通用编程语言，由荷兰程序员 Guido van Rossum 于 1989 年圣诞节期间开始设计，1991 年发布第一个版本。它目前由 Python 软件基金会（PSF）维护，是世界上使用最广泛的编程语言之一。

Python 的设计哲学强调代码的**可读性**和**简洁性**：它用缩进表示代码块，语法接近自然语言，让初学者可以把注意力放在“解决问题”上，而不是被复杂的符号淹没。

Python 的名字并非来自蟒蛇，而是来自 Guido 喜爱的英国喜剧团体 Monty Python。不过这只蓝色的蟒蛇，后来成了它最广为人知的标志。

Python 的核心特点
-----------------

* **简单易学**：语法清晰，关键字少，入门门槛低。
* **解释型语言**：写完即可运行，不需要编译步骤，调试反馈快。
* **动态类型**：变量不需要提前声明类型，赋值时自动推断。
* **跨平台**：Windows、macOS、Linux 上的代码几乎可以原样运行。
* **生态丰富**：标准库覆盖文件、网络、文本、并发等常见场景，第三方包超过 50 万个。
* **可扩展**：既能调用 C/C++ 编写的扩展模块，也能被其他语言嵌入。
* **面向对象**：支持类、继承、多态，同时也支持函数式写法。

Python 版本演进
---------------

.. csv-table::
   :header: "版本", "发布时间", "关键变化"

   "Python 2.7", "2010", "Python 2 的最后一个版本，已于 2020 年停止维护"
   "Python 3.6", "2016", "引入 f-string；字典开始保持插入顺序（3.7 起成为语言保证）"
   "Python 3.8", "2019", "海象运算符 ``:=``，仅位置参数"
   "Python 3.10", "2021", "结构化模式匹配 ``match`` / ``case``，更友好的错误提示"
   "Python 3.11", "2022", "解释器性能大幅提升，异常组与 ``except*``"
   "Python 3.12", "2023", "新的类型参数语法，f-string 支持嵌套引号"
   "Python 3.13", "2024", "实验性自由线程模式，交互式解释器增强"

第一个 Python 程序
------------------

新建一个文件 ``hello.py``，写入下面这行代码：

.. code-block:: python

   print("Hello, Python!")

在命令行中执行：

.. code-block:: bash

   python hello.py

输出结果：

.. code-block:: text

   Hello, Python!

``print()`` 是 Python 的内置函数，负责把内容输出到终端。字符串用双引号或单引号包裹都可以，这一点比很多语言更自由。

再写一段稍微完整一点的代码，计算 1 到 100 的和：

.. code-block:: python

   total = 0
   for n in range(1, 101):
       total += n
   print("1 到 100 的和是：", total)

输出结果：

.. code-block:: text

   1 到 100 的和是： 5050

注意 ``for`` 循环体前面的四个空格缩进。Python 用缩进划分代码块，缩进不一致会直接报错，这也是它强制代码风格统一的巧妙设计。

Python 能做什么
---------------

Python 的应用范围非常广，常见的领域包括：

* **Web 开发**：Django、Flask、FastAPI 等框架可以快速搭建网站和 API。
* **数据分析**：NumPy、pandas、Matplotlib 处理数据、做可视化。
* **人工智能**：PyTorch、TensorFlow、scikit-learn 是主流的机器学习工具。
* **自动化运维**：编写脚本批量处理文件、调用系统命令、定时任务。
* **网络爬虫**：requests、BeautifulSoup、Scrapy 抓取和解析网页。
* **桌面工具**：Tkinter、PyQt 编写跨平台图形界面程序。
* **科学计算**：SciPy、SymPy 覆盖数值计算与符号推导。

下面用列表推导式演示 Python 的简洁：

.. code-block:: python

   # 取出 1 到 20 中所有偶数的平方
   squares = [n * n for n in range(1, 21) if n % 2 == 0]
   print(squares)

输出结果：

.. code-block:: text

   [4, 16, 36, 64, 100, 144, 196, 256, 324, 400]

同样的逻辑用传统循环要写四五行，而 Python 一行就能表达清楚。

函数与可读性
-------------

Python 的函数定义同样直白，参数、默认值、返回值都一目了然：

.. code-block:: python

   def greet(name, greeting="你好"):
       return f"{greeting}，{name}！"

   for person in ["小明", "小红"]:
       print(greet(person))

输出结果：

.. code-block:: text

   你好，小明！
   你好，小红！

``f"{greeting}，{name}！"`` 是 Python 3.6 引入的 f-string，在字符串前加 ``f``，就能直接把变量嵌入文本。

如何学习 Python
---------------

建议按下面的顺序推进：

1. 先熟悉基础语法、变量、运算符和注释。
2. 掌握列表、元组、字典、集合等内置数据结构。
3. 学会条件、循环、函数和异常处理，能写出完整的小脚本。
4. 理解类与模块，开始拆分和组织代码。
5. 熟悉标准库，再按兴趣进入 Web、数据分析或自动化方向。

.. tip::

   学习编程最有效的方式是动手。读完每一节的示例后，试着改几个数字或变量名，观察输出有什么变化。

练习任务
--------

任务 1：输出一句自我介绍。

.. code-block:: python

   print("我叫小明，正在学习 Python。")

输出结果：

.. code-block:: text

   我叫小明，正在学习 Python。

任务 2：用循环计算 10 的阶乘。

.. code-block:: python

   product = 1
   for n in range(1, 11):
       product *= n
   print("10! =", product)

输出结果：

.. code-block:: text

   10! = 3628800

任务 3：改写 ``greet`` 函数，让它支持传入不同的问候语。

.. code-block:: python

   def greet(name, greeting):
       return f"{greeting}，{name}！"

   print(greet("小明", "早上好"))
   print(greet("小红", "晚安"))

输出结果：

.. code-block:: text

   早上好，小明！
   晚安，小红！

相关资源
--------

* 官方文档：`Python 官方文档 <https://docs.python.org/zh-cn/3/>`_
* 官方教程：`The Python Tutorial <https://docs.python.org/zh-cn/3/tutorial/index.html>`_
* 标准库索引：`Python 标准库 <https://docs.python.org/zh-cn/3/library/index.html>`_
