Python 错误和异常
==================

.. meta::
   :group: 进阶
   :summary: 区分语法错误与运行时异常，熟悉常见内置异常类型，掌握 try/except/else/finally、异常对象、raise、自定义异常、异常链、assert、上下文管理、ExceptionGroup 与 except* 以及异常处理的最佳实践。

程序出错是常态。Python 把错误分成两类：一类是**语法错误**，代码根本无法通过编译；另一类是**异常**，代码能跑起来，但执行到某一行时遇到了无法继续的情况，例如除以零、键不存在、文件缺失。

异常机制的价值在于：错误发生时程序不会被立刻终止，而是沿着调用栈向上寻找处理者。找不到处理者时，解释器才打印回溯信息并退出。学会精确地捕获、转换和抛出异常，是写出健壮程序的关键一步。

本章的所有示例都会捕获异常并打印结果，因此每个代码块都能正常结束，退出码为 0。

一、语法错误与异常
------------------

语法错误（``SyntaxError``）发生在解析阶段。解释器读不懂代码结构，一行都不会执行。下面的例子用 ``compile()`` 主动触发一次语法错误，这样既能观察异常对象，又不必真的写出非法文件：

.. code-block:: python

   try:
       compile("if True print('hi')", "demo.py", "exec")
   except SyntaxError as error:
       print("语法错误类型：", type(error).__name__)
       print("错误行号：", error.lineno)
       print("涉及文件：", error.filename)

   try:
       print(undefined_name)
   except NameError as error:
       print("运行时异常类型：", type(error).__name__)

   print("程序继续执行")

输出结果：

.. code-block:: text

   语法错误类型： SyntaxError
   错误行号： 1
   涉及文件： demo.py
   运行时异常类型： NameError
   程序继续执行

``SyntaxError`` 带有 ``filename``、``lineno``、``offset``、``text`` 等属性，IDE 的红色波浪线正是靠这些信息定位问题。``NameError`` 则属于运行时异常：代码结构合法，执行到使用未定义名字的那一行才失败。

二、常见内置异常
----------------

Python 内置了几十种异常类型，绝大多数都继承自 ``Exception``。下表列出了日常脚本里最常遇到的几种：

.. csv-table::
   :header: "异常类型", "典型场景"

   "``ZeroDivisionError``", "除数为 0"
   "``ValueError``", "类型正确但值不合法，例如 ``int('abc')``"
   "``TypeError``", "类型不匹配，例如字符串与整数相加"
   "``KeyError``", "字典中不存在指定的键"
   "``IndexError``", "序列下标越界"
   "``FileNotFoundError``", "打开的文件或目录不存在"
   "``PermissionError``", "没有访问权限"
   "``AttributeError``", "对象没有指定的属性"
   "``ImportError``", "导入模块失败，子类 ``ModuleNotFoundError`` 表示模块不存在"
   "``OSError``", "操作系统层面的错误，是上述文件类异常的基类"

一次性把它们的触发方式列出来，可以直观看到类型名与场景的对应关系：

.. code-block:: python

   cases = [
       ("ZeroDivisionError", lambda: 1 / 0),
       ("ValueError", lambda: int("abc")),
       ("TypeError", lambda: "a" + 1),
       ("KeyError", lambda: {"a": 1}["b"]),
       ("IndexError", lambda: [1, 2][5]),
       ("FileNotFoundError", lambda: open("missing.txt", encoding="utf-8")),
       ("AttributeError", lambda: "abc".missing()),
   ]

   for name, action in cases:
       try:
           action()
       except Exception as error:
           print(f"{name} 被捕获，实际类型：{type(error).__name__}")

输出结果：

.. code-block:: text

   ZeroDivisionError 被捕获，实际类型：ZeroDivisionError
   ValueError 被捕获，实际类型：ValueError
   TypeError 被捕获，实际类型：TypeError
   KeyError 被捕获，实际类型：KeyError
   IndexError 被捕获，实际类型：IndexError
   FileNotFoundError 被捕获，实际类型：FileNotFoundError
   AttributeError 被捕获，实际类型：AttributeError

为什么不要用 except Exception
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

实际开发中不要用 ``except Exception`` 一把抓，而应该按上表的类型分别处理。捕获范围越窄，出错时越容易判断问题到底出在哪一步，也不会顺手把真正的 bug 一起吞掉。

三、try / except / else / finally
---------------------------------

完整的 ``try`` 语句有四个部分：``try`` 放可能出错的代码；``except`` 处理指定异常；``else`` 只在没有异常时执行；``finally`` 无论是否出错都会执行。下面的函数把四个分支的执行顺序打印出来：

.. code-block:: python

   def divide(a, b):
       try:
           result = a / b
       except ZeroDivisionError:
           print("except：除数不能为 0")
           return None
       else:
           print("else：计算成功")
           return result
       finally:
           print("finally：清理完成")

   print("结果：", divide(10, 2))
   print("结果：", divide(1, 0))

输出结果：

.. code-block:: text

   else：计算成功
   finally：清理完成
   结果： 5.0
   except：除数不能为 0
   finally：清理完成
   结果： None

``finally`` 在 ``return`` 之后、函数真正返回之前执行，所以它的输出总是紧跟在结果之前。这个特性适合放关闭文件、释放锁、删除临时文件这类必须执行的收尾动作。

注意 ``else`` 的边界：只有 ``try`` 块里没有异常才会进入 ``else``，``else`` 自身抛出的异常不会被同一个 ``try`` 的 ``except`` 捕获。把“可能出错的调用”留在 ``try`` 里，把“成功后的后续处理”放进 ``else``，可以让捕获范围保持最小。

四、捕获多个异常与 as
---------------------

多个异常类型可以合并到一个 ``except`` 中，用元组列出；需要访问异常对象时，用 ``as`` 绑定一个变量。异常对象携带类型、消息和参数，便于记录日志或做分支判断：

.. code-block:: python

   def parse_number(text):
       try:
           return int(text)
       except (ValueError, TypeError) as error:
           print("合并捕获：", type(error).__name__)
           return None

   print("结果：", parse_number("42"))
   print("结果：", parse_number("abc"))
   print("结果：", parse_number(None))

   try:
       data = {"count": 3}
       value = data["total"]
   except KeyError as error:
       print("缺少键：", error)

   try:
       print(10 / data.get("total", 0))
   except ZeroDivisionError as error:
       print("除零：", type(error).__name__)

输出结果：

.. code-block:: text

   结果： 42
   合并捕获： ValueError
   结果： None
   合并捕获： TypeError
   结果： None
   缺少键： 'total'
   除零： ZeroDivisionError

``except`` 子句按书写顺序匹配，命中第一个就停止，所以子类要写在父类前面。例如 ``FileNotFoundError`` 是 ``OSError`` 的子类，若先写 ``except OSError``，后面的 ``except FileNotFoundError`` 永远不会执行。

``KeyError`` 的字符串形式会给键加上引号，这是 ``str(error)`` 对参数调用 ``repr()`` 的结果。需要原始键值时，用 ``error.args[0]`` 更稳妥。

五、raise 抛出异常
------------------

``raise`` 主动抛出异常，既可以在参数校验失败时拒绝非法输入，也可以在 ``except`` 中把异常原样向上传递。下面的例子演示这两种用法：

.. code-block:: python

   def set_age(age):
       if not isinstance(age, int):
           raise TypeError("年龄必须是整数")
       if age < 0 or age > 150:
           raise ValueError(f"年龄超出范围：{age}")
       return age

   for value in [18, -1, "20"]:
       try:
           print("设置年龄：", set_age(value))
       except (TypeError, ValueError) as error:
           print("拒绝：", type(error).__name__, str(error))

   def load(path):
       try:
           with open(path, encoding="utf-8") as file:
               return file.read()
       except FileNotFoundError:
           print("记录日志：文件缺失")
           raise

   try:
       load("missing.txt")
   except FileNotFoundError as error:
       print("上层捕获：", type(error).__name__)

输出结果：

.. code-block:: text

   设置年龄： 18
   拒绝： ValueError 年龄超出范围：-1
   拒绝： TypeError 年龄必须是整数
   记录日志：文件缺失
   上层捕获： FileNotFoundError

``raise`` 后面不带异常对象时，表示“重新抛出当前异常”，它会保留原始回溯信息，比 ``raise error`` 更好，后者会把抛出点改成当前行。只在当前层无法处理、但需要记录日志或补充上下文时才这么写，否则应该让异常直接向上传播。

六、自定义异常
--------------

内置异常表达的是通用错误，业务错误适合定义自己的异常类。惯例是继承 ``Exception``，并在类名后加 ``Error``；需要分类处理时，可以先定义一个应用级基类，再派生出具体异常：

.. code-block:: python

   class AppError(Exception):
       """应用异常基类。"""

   class ValidationError(AppError):
       def __init__(self, field, message):
           super().__init__(f"{field}：{message}")
           self.field = field

   def check_user(name):
       if not name:
           raise ValidationError("name", "不能为空")
       return name

   for value in ["小明", ""]:
       try:
           print("通过：", check_user(value))
       except AppError as error:
           print("业务异常：", type(error).__name__, "-", error)
           if isinstance(error, ValidationError):
               print("出错字段：", error.field)

输出结果：

.. code-block:: text

   通过： 小明
   业务异常： ValidationError - name：不能为空
   出错字段： name

自定义异常让调用方可以用 ``except AppError`` 捕获整个业务层的错误，也可以精确捕获某一类错误。把字段名、错误码等结构化信息存成属性，比只塞进一条字符串消息更容易在界面或日志里做后续处理。

七、异常链 from
---------------

在 ``except`` 中抛出新的异常时，可以用 ``from`` 指定“直接原因”，形成显式的异常链。这样调用方看到的仍是贴近业务的异常，回溯信息里却保留了底层细节：

.. code-block:: python

   def parse_score(text):
       try:
           return int(text)
       except ValueError as error:
           raise RuntimeError("成绩必须是数字") from error

   try:
       parse_score("优秀")
   except RuntimeError as error:
       print("异常类型：", type(error).__name__)
       print("原因类型：", type(error.__cause__).__name__)
       print("异常信息：", error)

   try:
       try:
           int("abc")
       except ValueError:
           raise RuntimeError("转换失败")
   except RuntimeError as error:
       print("隐式原因：", type(error.__context__).__name__)
       print("未指定显式原因：", error.__cause__ is None)

输出结果：

.. code-block:: text

   异常类型： RuntimeError
   原因类型： ValueError
   异常信息： 成绩必须是数字
   隐式原因： ValueError
   未指定显式原因： True

``__cause__`` 对应 ``raise ... from ...``，``__context__`` 是 Python 自动记录的“在哪个异常处理过程中又抛出了异常”。写 ``from None`` 可以主动切断这条链，让回溯只显示新异常；但这会丢掉排查线索，除非底层异常确实毫无参考价值，否则不建议这么做。

八、assert 断言
---------------

``assert`` 用于检查“程序内部必须成立”的条件，语法是 ``assert 条件, 消息``。条件为假时抛出 ``AssertionError``，消息会作为异常内容：

.. code-block:: python

   def apply_discount(price, rate):
       assert 0 <= rate <= 1, "折扣率必须在 0 到 1 之间"
       return round(price * rate, 2)

   print("正常结果：", apply_discount(100, 0.8))

   try:
       apply_discount(100, 1.5)
   except AssertionError as error:
       print("断言失败：", error)

   print("断言当前启用：", __debug__)

输出结果：

.. code-block:: text

   正常结果： 80.0
   断言失败： 折扣率必须在 0 到 1 之间
   断言当前启用： True

``assert`` 是调试工具，不是输入校验手段。用 ``python -O`` 运行时所有断言都会被删除，依赖它检查用户输入会让程序在优化模式下失去保护。面向用户的校验应该显式写 ``if`` 加 ``raise``。

九、上下文管理
--------------

``with`` 语句保证资源在离开代码块时被释放，即使块内抛出异常也不会漏掉。任何实现了 ``__enter__()`` 与 ``__exit__()`` 的对象都可以用在 ``with`` 中：

.. code-block:: python

   class DemoResource:
       def __init__(self, name):
           self.name = name

       def __enter__(self):
           print("获取资源：", self.name)
           return self

       def __exit__(self, exc_type, exc_value, traceback):
           if exc_type is None:
               print("正常释放：", self.name)
           else:
               print("异常释放：", self.name, "->", exc_type.__name__)
           return False

   with DemoResource("数据库连接") as resource:
       print("使用资源：", resource.name)

   try:
       with DemoResource("文件句柄") as resource:
           raise ValueError("读取失败")
   except ValueError as error:
       print("外部捕获：", error)

输出结果：

.. code-block:: text

   获取资源： 数据库连接
   使用资源： 数据库连接
   正常释放： 数据库连接
   获取资源： 文件句柄
   异常释放： 文件句柄 -> ValueError
   外部捕获： 读取失败

``__exit__()`` 的三个参数分别是异常类型、异常对象和回溯对象，没有异常时三者都是 ``None``。返回 ``False``（或 ``None``）表示不抑制异常，异常会继续向外传播；返回 ``True`` 则吞掉异常，``with`` 之后的代码会照常执行。

用 contextlib 简化
~~~~~~~~~~~~~~~~~~

``contextlib.contextmanager`` 可以把一个带 ``yield`` 的生成器变成上下文管理器，省去写类的样板代码。文件对象、锁、数据库连接、临时目录都遵循同一套协议。

十、ExceptionGroup 与 except*
-----------------------------

并行任务或批量校验常常一次产生多个错误，逐个抛出会丢失信息。Python 3.11 引入了 ``ExceptionGroup``，用一个异常携带一组子异常；配套的 ``except*`` 可以按类型把这些子异常拆开处理：

.. code-block:: python

   def validate(rows):
       errors = []
       for index, row in enumerate(rows, start=1):
           try:
               if not row.get("name"):
                   raise ValueError(f"第 {index} 行缺少姓名")
               if row.get("age", 0) <= 0:
                   raise TypeError(f"第 {index} 行年龄非法")
           except (ValueError, TypeError) as error:
               errors.append(error)
       if errors:
           raise ExceptionGroup("批量校验失败", errors)

   rows = [
       {"name": "小明", "age": 18},
       {"name": "", "age": 20},
       {"name": "小红", "age": 0},
   ]

   try:
       validate(rows)
   except* ValueError as group:
       for error in group.exceptions:
           print("值错误：", error)
   except* TypeError as group:
       for error in group.exceptions:
           print("类型错误：", error)

   try:
       raise ExceptionGroup("混合错误", [ValueError("a"), TypeError("b")])
   except* ValueError as group:
       print("值错误子组数量：", len(group.exceptions))
   except* TypeError as group:
       print("类型错误子组数量：", len(group.exceptions))

输出结果：

.. code-block:: text

   值错误： 第 2 行缺少姓名
   类型错误： 第 3 行年龄非法
   值错误子组数量： 1
   类型错误子组数量： 1

``except*`` 会把异常组按类型拆成若干子组，每个子句只收到匹配的那一部分，匹配完的异常从组中移除；没有任何子句认领的异常会在最后合并成一个新的 ``ExceptionGroup`` 继续抛出。同一个 ``try`` 中不能混用 ``except`` 和 ``except*``。

如果确实想整体处理，可以直接 ``except ExceptionGroup as group``，再遍历 ``group.exceptions`` 自己分类。

十一、最佳实践
--------------

异常处理的目标不是“让程序不报错”，而是“在正确的位置处理正确的错误”。几条实用原则：

* **捕获具体类型**：``except ValueError`` 优于 ``except Exception``，更优于裸 ``except:``。
* **不要静默吞掉异常**：``except Exception: pass`` 会掩盖真正的 bug，至少应该打印或记录日志。
* **尽早失败**：参数不合法时立刻 ``raise``，不要带着脏数据继续往下跑。
* **EAFP 风格**：与其先判断再操作，不如直接操作并捕获异常，这样能避免“判断与使用之间状态改变”的竞态。
* **用 ``finally`` 或 ``with`` 收尾**：资源释放不应该依赖某条代码路径是否被执行。
* **异常不是流程控制**：可预期的分支用 ``if`` 表达，异常留给真正异常的情况。

下面用“先做后捕获”的 EAFP 写法读取字典与文件：

.. code-block:: python

   data = {"count": "3", "total": "10"}

   try:
       count = int(data["count"])
   except (KeyError, ValueError) as error:
       print("读取失败：", type(error).__name__)
   else:
       print("读取成功：", count)

   def read_config(path):
       try:
           with open(path, encoding="utf-8") as file:
               return file.read()
       except FileNotFoundError:
           print("配置文件不存在，使用默认值")
           return "default"

   print("配置：", read_config("no_such_config.ini"))

输出结果：

.. code-block:: text

   读取成功： 3
   配置文件不存在，使用默认值
   配置： default

EAFP 是“Easier to Ask Forgiveness than Permission”的缩写，意思是先尝试、出错再补救；与之相对的 LBYL（先检查再操作）在单线程脚本里也没问题，但在并发环境下检查结果可能立刻失效。

十二、练习任务
--------------

任务 1：写一个安全除法函数，分别处理除零和类型错误，并让调用方拿到 ``None`` 而不是崩溃。

.. code-block:: python

   def safe_divide(a, b):
       try:
           return a / b
       except ZeroDivisionError as error:
           print("除零错误：", type(error).__name__)
           return None
       except TypeError as error:
           print("类型错误：", type(error).__name__)
           return None

   for a, b in [(10, 2), (10, 0), ("10", 2)]:
       print(f"{a} / {b} =", safe_divide(a, b))

输出结果：

.. code-block:: text

   10 / 2 = 5.0
   除零错误： ZeroDivisionError
   10 / 0 = None
   类型错误： TypeError
   10 / 2 = None

任务 2：定义 ``ScoreError``，把 ``int()`` 抛出的 ``ValueError`` 转换成业务异常，并用 ``from`` 保留原因。

.. code-block:: python

   class ScoreError(Exception):
       """成绩不合法。"""

   def parse_score(text):
       try:
           score = int(text)
       except ValueError as error:
           raise ScoreError(f"无法解析成绩：{text}") from error
       if not 0 <= score <= 100:
           raise ScoreError(f"成绩超出范围：{score}")
       return score

   for raw in ["90", "abc", "120"]:
       try:
           print("成绩：", parse_score(raw))
       except ScoreError as error:
           cause = type(error.__cause__).__name__ if error.__cause__ else "无"
           print("失败：", error, "原因：", cause)

输出结果：

.. code-block:: text

   成绩： 90
   失败： 无法解析成绩：abc 原因： ValueError
   失败： 成绩超出范围：120 原因： 无

任务 3：批量校验一组数据，把所有错误收集到 ``ExceptionGroup``，再用 ``except*`` 分类统计。

.. code-block:: python

   def check_values(values):
       errors = []
       for value in values:
           try:
               if not isinstance(value, int):
                   raise TypeError(f"{value!r} 不是整数")
               if value < 0:
                   raise ValueError(f"{value} 是负数")
           except (TypeError, ValueError) as error:
               errors.append(error)
       if errors:
           raise ExceptionGroup("数据校验失败", errors)

   try:
       check_values([1, -2, "x"])
   except* ValueError as group:
       print("负值错误数：", len(group.exceptions))
   except* TypeError as group:
       print("类型错误数：", len(group.exceptions))

输出结果：

.. code-block:: text

   负值错误数： 1
   类型错误数： 1
