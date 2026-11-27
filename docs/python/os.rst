Python OS 模块
===============

.. meta::
   :group: 进阶
   :summary: 掌握 os 模块的目录与文件操作、os.path 路径处理、os.walk 遍历目录树、os.environ 环境变量、subprocess 调用外部命令以及 os.stat 读取文件状态。

``os`` 是 Python 与操作系统打交道的标准库入口。它把“当前工作目录”“创建文件夹”“重命名文件”“读取环境变量”这些平台相关的操作封装成统一的函数，同一份代码在 Windows、macOS、Linux 上都能运行。

本章按“目录 → 文件 → 路径 → 遍历 → 环境变量 → 子进程 → 文件状态”的顺序展开。所有示例只使用相对路径，并在同一个代码块内创建、使用、清理临时文件，块与块之间互不影响；输出中也不会出现绝对路径，方便在不同机器上复现。

一、os 模块概览
---------------

``os`` 提供的函数大致可以分为几类，下面的表格列出了本章会用到的常用成员：

.. csv-table::
   :header: "分类", "常用成员", "作用"

   "工作目录", "``getcwd()``、``chdir()``", "读取或切换当前工作目录"
   "目录操作", "``listdir()``、``mkdir()``、``makedirs()``、``rmdir()``", "列出、创建、删除目录"
   "文件操作", "``remove()``、``rename()``", "删除文件、重命名文件或目录"
   "路径处理", "``os.path.join()``、``exists()``、``isfile()``、``isdir()``", "拼接路径、判断路径类型"
   "路径拆分", "``basename()``、``dirname()``、``splitext()``", "取出文件名、目录名、扩展名"
   "目录遍历", "``walk()``", "递归遍历目录树"
   "环境变量", "``environ``、``getenv()``", "读取和修改进程环境变量"
   "文件状态", "``stat()``", "获取大小、类型、权限等元数据"

``os`` 中的路径参数既可以是字符串，也可以是 ``pathlib.Path`` 对象。本章统一使用字符串，便于观察每一步的返回值；实际项目中更推荐 ``pathlib``，它的可读性更好。

二、工作目录：getcwd 与 chdir
-----------------------------

每个进程都有一个“当前工作目录”，相对路径正是以它为基准解析的。``os.getcwd()`` 返回当前目录的绝对路径，``os.chdir()`` 负责切换。由于绝对路径因机器而异，示例只对返回值做判断，不直接打印：

.. code-block:: python

   import os

   cwd = os.getcwd()
   print("是绝对路径：", os.path.isabs(cwd))
   print("是已存在的目录：", os.path.isdir(cwd))
   print("可以列出内容：", isinstance(os.listdir(cwd), list))

输出结果：

.. code-block:: text

   是绝对路径： True
   是已存在的目录： True
   可以列出内容： True

``getcwd()`` 永远返回绝对路径，``listdir()`` 则接受相对路径。脚本中如果依赖相对路径读写文件，最好在开头显式切换到脚本所在目录，避免因为“从哪个目录启动”而读到不同的文件。

``chdir()`` 改变的是整个进程的工作目录，切换之后所有相对路径都会以新目录为基准。下面的例子先进入演示目录，再回到上一级：

.. code-block:: python

   import os

   os.makedirs("chdir_demo/inner", exist_ok=True)
   with open(os.path.join("chdir_demo", "note.txt"), "w", encoding="utf-8") as file:
       file.write("demo")

   os.chdir("chdir_demo")
   print("已切换到演示目录：", os.path.basename(os.getcwd()) == "chdir_demo")
   print("目录内容：", sorted(os.listdir(".")))

   os.chdir(os.pardir)
   print("返回后仍能看到演示目录：", os.path.isdir("chdir_demo"))

   os.remove(os.path.join("chdir_demo", "note.txt"))
   os.rmdir(os.path.join("chdir_demo", "inner"))
   os.rmdir("chdir_demo")
   print("清理完成：", not os.path.exists("chdir_demo"))

输出结果：

.. code-block:: text

   已切换到演示目录： True
   目录内容： ['inner', 'note.txt']
   返回后仍能看到演示目录： True
   清理完成： True

``os.pardir`` 就是字符串 ``".."``，``os.curdir`` 是 ``"."``。用常量代替手写点号，可以让意图更清楚，也不必担心平台差异。

三、目录操作：mkdir、makedirs 与 rmdir
--------------------------------------

``mkdir()`` 只能创建一级目录，父目录不存在时会抛出 ``FileNotFoundError``；``makedirs()`` 会连同缺失的父目录一起创建，加上 ``exist_ok=True`` 后重复调用也不会报错。``rmdir()`` 只删除空目录：

.. code-block:: python

   import os

   os.mkdir("mkdir_demo")
   print("单级目录已创建：", os.path.isdir("mkdir_demo"))

   try:
       os.mkdir("mkdir_demo")
   except FileExistsError as error:
       print("重复创建被拒绝：", type(error).__name__)

   os.makedirs("mkdir_demo/a/b", exist_ok=True)
   print("多级目录已创建：", os.path.isdir("mkdir_demo/a/b"))

   try:
       os.rmdir("mkdir_demo")
   except OSError as error:
       print("非空目录不能直接删除：", type(error).__name__)

   os.rmdir("mkdir_demo/a/b")
   os.rmdir("mkdir_demo/a")
   os.rmdir("mkdir_demo")
   print("清理完成：", not os.path.exists("mkdir_demo"))

输出结果：

.. code-block:: text

   单级目录已创建： True
   重复创建被拒绝： FileExistsError
   多级目录已创建： True
   非空目录不能直接删除： OSError
   清理完成： True

``rmdir()`` 不能删除非空目录，想连同内容一起删除要用 ``shutil.rmtree()``。这个函数威力很大且不可撤销，调用前一定要确认路径来自可信来源，不要把用户输入直接拼进去。

四、文件操作：remove 与 rename
------------------------------

``os.remove()`` 删除文件，``os.rename()`` 重命名文件或目录。两者都直接作用于文件系统，没有“回收站”这一层缓冲：

.. code-block:: python

   import os

   with open("report.txt", "w", encoding="utf-8") as file:
       file.write("hello os")

   os.rename("report.txt", "report_backup.txt")
   print("重命名后存在：", os.path.exists("report_backup.txt"))
   print("原文件已消失：", not os.path.exists("report.txt"))

   try:
       os.remove("missing.txt")
   except FileNotFoundError as error:
       print("删除不存在的文件：", type(error).__name__)

   os.remove("report_backup.txt")
   print("删除后存在：", os.path.exists("report_backup.txt"))

输出结果：

.. code-block:: text

   重命名后存在： True
   原文件已消失： True
   删除不存在的文件： FileNotFoundError
   删除后存在： False

在 POSIX 系统上 ``os.rename()`` 会直接覆盖同名目标文件，在 Windows 上目标已存在时则会抛出 ``FileExistsError``。需要跨平台一致的“存在则替换”语义时，应该使用 ``os.replace()``。

五、os.path 路径拼接与判断
--------------------------

拼接路径不要用字符串加法，否则很容易漏掉分隔符，或者在不同平台上拼出错误的结果。``os.path.join()`` 会按当前系统选择正确的分隔符，``exists()``、``isfile()``、``isdir()`` 则用来判断路径的真实状态：

.. code-block:: python

   import os

   os.makedirs("path_demo/sub")
   target = os.path.join("path_demo", "sub", "notes.txt")
   with open(target, "w", encoding="utf-8") as file:
       file.write("path demo")

   print("拼接结果：", target.replace(os.sep, "/"))
   print("路径存在：", os.path.exists(target))
   print("是文件：", os.path.isfile(target))
   print("父目录是目录：", os.path.isdir("path_demo/sub"))
   print("缺失路径存在：", os.path.exists("path_demo/missing.txt"))

   os.remove(target)
   os.rmdir("path_demo/sub")
   os.rmdir("path_demo")

输出结果：

.. code-block:: text

   拼接结果： path_demo/sub/notes.txt
   路径存在： True
   是文件： True
   父目录是目录： True
   缺失路径存在： False

示例中统一用 ``replace(os.sep, "/")`` 把分隔符换成斜杠再打印，这样在 Windows 上也不会输出反斜杠。另外，``os.path.exists()`` 对“文件”和“目录”都返回 ``True``，只想匹配其中一种时必须改用 ``isfile()`` 或 ``isdir()``。

六、os.path 拆分路径
--------------------

``basename()`` 取路径的最后一段，``dirname()`` 取它前面的目录部分，``splitext()`` 把扩展名单独切出来。三者都只做字符串层面的拆分，不会访问文件系统：

.. code-block:: python

   import os

   path = os.path.join("docs", "python", "os.rst")
   print("完整路径：", path.replace(os.sep, "/"))
   print("文件名：", os.path.basename(path))
   print("所在目录：", os.path.dirname(path).replace(os.sep, "/"))
   print("去掉扩展名：", os.path.splitext(path)[0].replace(os.sep, "/"))
   print("扩展名：", os.path.splitext(path)[1])
   print("多后缀只取最后一段：", os.path.splitext("archive.tar.gz")[1])

输出结果：

.. code-block:: text

   完整路径： docs/python/os.rst
   文件名： os.rst
   所在目录： docs/python
   去掉扩展名： docs/python/os
   扩展名： .rst
   多后缀只取最后一段： .gz

``splitext()`` 只按最后一个点拆分，所以 ``archive.tar.gz`` 得到的是 ``.gz``。需要处理 ``.tar.gz`` 这类组合后缀时，要么判断 ``name.endswith(".tar.gz")``，要么用多次拆分。

七、获取文件信息：getsize 与 abspath
------------------------------------

``os.path.getsize()`` 返回文件的字节数，``os.path.abspath()`` 把相对路径补全成绝对路径。绝对路径通常包含用户名等本机信息，所以示例只检查它的性质，不直接打印：

.. code-block:: python

   import os

   with open("size_demo.txt", "w", encoding="utf-8") as file:
       file.write("hello os")

   print("文件字节数：", os.path.getsize("size_demo.txt"))

   absolute = os.path.abspath("size_demo.txt")
   print("绝对路径已生成：", os.path.isabs(absolute))
   print("绝对路径的文件名：", os.path.basename(absolute))
   print("与相对路径指向同一文件：", os.path.samefile(absolute, "size_demo.txt"))

   os.remove("size_demo.txt")

输出结果：

.. code-block:: text

   文件字节数： 8
   绝对路径已生成： True
   绝对路径的文件名： size_demo.txt
   与相对路径指向同一文件： True

``getsize()`` 统计的是字节数而不是字符数，含中文的文件会因为 UTF-8 编码而比字符数更大。如果要统计目录的总大小，必须自己递归累加，``getsize()`` 对目录返回的是目录项本身的大小，各平台并不一致。

八、遍历目录树：os.walk
-----------------------

``os.walk()`` 自顶向下递归遍历目录，每次产出一个三元组 ``(root, dirs, files)``：``root`` 是当前目录，``dirs`` 是其中的子目录名列表，``files`` 是文件名列表。对 ``dirs`` 原地排序，可以让遍历顺序固定下来：

.. code-block:: python

   import os

   os.makedirs("walk_demo/a/b")
   for relative in ["walk_demo/top.txt", "walk_demo/a/a.txt", "walk_demo/a/b/b.txt"]:
       with open(relative, "w", encoding="utf-8") as file:
           file.write(relative)

   for root, dirs, files in os.walk("walk_demo"):
       dirs.sort()
       print(root.replace(os.sep, "/"), "目录：", dirs, "文件：", sorted(files))

   for root, dirs, files in os.walk("walk_demo", topdown=False):
       for name in files:
           os.remove(os.path.join(root, name))
       for name in dirs:
           os.rmdir(os.path.join(root, name))
   os.rmdir("walk_demo")
   print("清理完成：", not os.path.exists("walk_demo"))

输出结果：

.. code-block:: text

   walk_demo 目录： ['a'] 文件： ['top.txt']
   walk_demo/a 目录： ['b'] 文件： ['a.txt']
   walk_demo/a/b 目录： [] 文件： ['b.txt']
   清理完成： True

遍历顺序与清理
~~~~~~~~~~~~~~

``os.walk()`` 默认自顶向下，父目录先于子目录产出；传入 ``topdown=False`` 则自底向上，正好适合“先删文件、再删空目录”的清理顺序。``dirs`` 列表可以在遍历过程中修改，例如原地删除不想进入的子目录，``walk()`` 就不会再往下走。

九、环境变量：os.environ
------------------------

``os.environ`` 是一个映射对象，读写它就等于读写当前进程的环境变量。它只在当前进程及其子进程中有效，不会影响系统设置：

.. code-block:: python

   import os

   os.environ["COAMTE_DEMO_MODE"] = "tutorial"
   print("读取自定义变量：", os.environ.get("COAMTE_DEMO_MODE"))
   print("带默认值的读取：", os.getenv("COAMTE_NOT_SET", "默认值"))
   print("PATH 已定义：", "PATH" in os.environ)
   print("变量总数大于零：", len(os.environ) > 0)

   del os.environ["COAMTE_DEMO_MODE"]
   print("删除后再读：", os.getenv("COAMTE_DEMO_MODE", "未设置"))

输出结果：

.. code-block:: text

   读取自定义变量： tutorial
   带默认值的读取： 默认值
   PATH 已定义： True
   变量总数大于零： True
   删除后再读： 未设置

读取环境变量时应优先用 ``os.getenv()`` 并给出默认值，而不是直接下标访问，否则变量缺失时会抛出 ``KeyError``。Windows 的环境变量名不区分大小写，Linux 和 macOS 则区分，跨平台代码里的变量名最好统一用大写。

十、subprocess 简介
-------------------

``os.system()`` 只能拿到退出码，输出会直接打到终端，难以处理。现代代码应该使用 ``subprocess`` 模块：它可以把参数以列表形式传入，避免 shell 注入，还能分别捕获标准输出和标准错误。下面的示例只调用 Python 自身执行无害的短语句：

.. code-block:: python

   import subprocess
   import sys

   result = subprocess.run(
       [sys.executable, "-c", "print('hello from subprocess')"],
       capture_output=True,
       text=True,
   )
   print("退出码：", result.returncode)
   print("标准输出：", result.stdout.strip())
   print("标准错误为空：", result.stderr == "")

   failed = subprocess.run(
       [sys.executable, "-c", "import sys; sys.exit(3)"],
       capture_output=True,
       text=True,
   )
   print("非零退出码：", failed.returncode)

输出结果：

.. code-block:: text

   退出码： 0
   标准输出： hello from subprocess
   标准错误为空： True
   非零退出码： 3

返回值与安全检查
~~~~~~~~~~~~~~~~

``subprocess.run()`` 会阻塞到命令结束，返回的 ``CompletedProcess`` 带有 ``returncode``、``stdout``、``stderr`` 三个关键属性。加上 ``check=True`` 后，非零退出码会直接抛出 ``CalledProcessError``；不检查返回值则要像上面这样自己判断 ``returncode``。

参数列表里不要拼接用户输入，也不要随手加 ``shell=True``。前者容易造成命令注入，后者会让参数重新交给 shell 解析，引号和通配符的行为都变得难以预测。

十一、文件状态：os.stat
-----------------------

``os.stat()`` 返回一个 ``os.stat_result`` 对象，包含大小、类型、权限、时间戳等元数据。配合 ``stat`` 模块的 ``S_ISREG()``、``S_ISDIR()`` 判断，可以精确区分文件类型：

.. code-block:: python

   import os
   import stat

   with open("stat_demo.txt", "w", encoding="utf-8") as file:
       file.write("hello os")

   info = os.stat("stat_demo.txt")
   print("大小：", info.st_size)
   print("是普通文件：", stat.S_ISREG(info.st_mode))
   print("是目录：", stat.S_ISDIR(info.st_mode))

   os.mkdir("stat_demo_dir")
   dir_info = os.stat("stat_demo_dir")
   print("目录是目录：", stat.S_ISDIR(dir_info.st_mode))

   os.remove("stat_demo.txt")
   os.rmdir("stat_demo_dir")

输出结果：

.. code-block:: text

   大小： 8
   是普通文件： True
   是目录： False
   目录是目录： True

``st_mode`` 同时编码了文件类型和权限位，直接拿它和数字比较在不同平台上并不可靠，应该用 ``stat`` 模块提供的判断函数。``os.path.isfile()`` 和 ``os.path.isdir()`` 内部做的就是这件事，日常判断优先用它们，只有需要读取大小、时间戳等更多信息时才直接调用 ``stat()``。

十二、练习任务
--------------

任务 1：遍历目录树，逐个打印文件路径与字节数，并统计文件总数和总大小。

.. code-block:: python

   import os

   os.makedirs("exercise_data/logs")
   contents = {
       "exercise_data/readme.txt": "hello",
       "exercise_data/logs/app.log": "line one\nline two\n",
       "exercise_data/logs/error.log": "boom\n",
   }
   for path, text in contents.items():
       with open(path, "w", encoding="utf-8", newline="") as file:
           file.write(text)

   total = 0
   count = 0
   for root, dirs, files in os.walk("exercise_data"):
       dirs.sort()
       for name in sorted(files):
           path = os.path.join(root, name)
           size = os.path.getsize(path)
           total += size
           count += 1
           print(path.replace(os.sep, "/"), size)

   print("文件数：", count)
   print("总字节数：", total)

   for root, dirs, files in os.walk("exercise_data", topdown=False):
       for name in files:
           os.remove(os.path.join(root, name))
       for name in dirs:
           os.rmdir(os.path.join(root, name))
   os.rmdir("exercise_data")

输出结果：

.. code-block:: text

   exercise_data/readme.txt 5
   exercise_data/logs/app.log 18
   exercise_data/logs/error.log 5
   文件数： 3
   总字节数： 28

任务 2：批量给目录下的 ``.txt`` 文件加上 ``_done`` 后缀，其他扩展名保持不变。

.. code-block:: python

   import os

   os.makedirs("exercise_rename")
   for name in ["a.txt", "b.txt", "c.md"]:
       with open(os.path.join("exercise_rename", name), "w", encoding="utf-8") as file:
           file.write(name)

   for name in sorted(os.listdir("exercise_rename")):
       base, extension = os.path.splitext(name)
       if extension == ".txt":
           source = os.path.join("exercise_rename", name)
           target = os.path.join("exercise_rename", f"{base}_done{extension}")
           os.rename(source, target)

   print("重命名结果：", sorted(os.listdir("exercise_rename")))

   for name in os.listdir("exercise_rename"):
       os.remove(os.path.join("exercise_rename", name))
   os.rmdir("exercise_rename")

输出结果：

.. code-block:: text

   重命名结果： ['a_done.txt', 'b_done.txt', 'c.md']

任务 3：把变量写进环境变量，再启动一个子进程读取它，验证环境变量可以被子进程继承。

.. code-block:: python

   import os
   import subprocess
   import sys

   os.environ["COAMTE_GREETING"] = "hello"

   code = "import os; print(os.environ.get('COAMTE_GREETING', 'missing'))"
   result = subprocess.run(
       [sys.executable, "-c", code],
       capture_output=True,
       text=True,
   )

   print("子进程读取：", result.stdout.strip())
   print("退出码：", result.returncode)
   print("标准错误为空：", result.stderr == "")

   del os.environ["COAMTE_GREETING"]

输出结果：

.. code-block:: text

   子进程读取： hello
   退出码： 0
   标准错误为空： True
