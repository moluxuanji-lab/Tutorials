Python 环境搭建
===============

.. meta::
   :group: 入门
   :summary: 在 Windows、macOS、Linux 上安装 Python，验证版本，使用交互式解释器、pip 与 venv，并挑选顺手的编辑器。

Python 的安装本身只有几步，真正费心的是装完之后的环境管理：一台机器上可能同时存在系统自带的解释器、官网安装的解释器、conda 创建的环境，不同项目又各自依赖不同版本的第三方包。这一章从下载安装讲到虚拟环境，目标是让每个项目的 Python 都能被准确找到、干净隔离。

一、下载与安装
--------------

官方安装包统一放在 python.org 的下载页。选择仍在维护的版本，Python 3.12 与 3.13 都是当前的主流选择；Python 3.8 及更早的版本已经停止安全更新，不建议新项目使用。

Windows
~~~~~~~

从官网下载 64 位安装包，文件名形如 ``python-3.13.1-amd64.exe``，双击运行。安装向导第一页有两个关键勾选项：

* ``Add python.exe to PATH``：把 Python 加入命令行搜索路径，不勾选的话在终端里输入 ``python`` 会提示找不到命令。
* ``Install launcher for all users``：安装 ``py`` 启动器，方便同时管理多个版本。

装完之后系统里会多出两个入口：``python`` 启动解释器，``py`` 启动器可以按版本号挑选，例如 ``py -3.12`` 会启动 3.12 那一份。

macOS
~~~~~

macOS 上有两种常见方式：

* **官方安装包**：下载 ``.pkg`` 文件，一路继续，解释器会装到 ``/Library/Frameworks/Python.framework`` 目录下。
* **Homebrew**：执行 ``brew install python@3.13``，包管理器会顺带处理 ``pip`` 和依赖关系。

macOS 自带一个 ``/usr/bin/python3``，它属于系统组件，不要用它安装第三方包，否则可能影响依赖它的系统脚本。

Linux
~~~~~

大多数发行版已经预装了 Python 3，但通常缺少 ``venv`` 和 ``pip``，需要单独补装：

.. code-block:: bash

   sudo apt update
   sudo apt install python3 python3-venv python3-pip

Fedora、CentOS 上把最后一行换成 ``sudo dnf install python3 python3-pip`` 即可。不建议替换系统自带的 ``python3``，需要更高版本时可以用 ``deadsnakes`` 源或 ``pyenv`` 单独安装一份。

二、验证安装
------------

打开终端（Windows 用 PowerShell 或 CMD），执行：

.. code-block:: bash

   python --version

输出结果：

.. code-block:: text

   Python 3.13.1

macOS 和 Linux 上可能需要写成 ``python3 --version``；Windows 装了启动器时，``py --version`` 同样有效。

多版本共存时，光看版本号还不够，要确认命令到底指向哪个文件：

.. code-block:: bash

   where python

输出结果：

.. code-block:: text

   C:\Users\demo\AppData\Local\Programs\Python\Python313\python.exe

macOS 与 Linux 上对应的命令是 ``which python3``，输出形如 ``/usr/local/bin/python3``。如果 Windows 上的结果指向 ``WindowsApps`` 目录，那通常是应用商店的占位程序，需要在“设置 → 应用 → 应用执行别名”里把它关掉。

版本是否满足要求，也可以写成脚本判断，把最低版本集中放在一处维护：

.. code-block:: python

   import sys

   required = (3, 9)
   current = sys.version_info[:2]

   print("版本满足要求：", current >= required)
   print("解释器主版本为 3：", current[0] == 3)

输出结果：

.. code-block:: text

   版本满足要求： True
   解释器主版本为 3： True

``sys.version_info`` 是一个命名元组，前两位分别是主版本号和次版本号，切片之后就能直接和 ``(3, 9)`` 这样的元组比较大小。

三、交互式解释器
----------------

在终端里不带参数运行 ``python``，就进入交互式解释器，也叫 REPL：读入一行、执行一行、立即显示结果。它适合验证语法、计算表达式、查看对象的属性和文档。

.. code-block:: bash

   python

输出结果：

.. code-block:: text

   Python 3.13.1 (main, Dec  3 2024, 10:00:00) [MSC v.1940 64 bit (AMD64)] on win32
   Type "help", "copyright", "credits" or "license" for more information.
   >>>

提示符 ``>>>`` 表示等待输入，``...`` 表示上一行还没结束（例如 ``for`` 循环体）。退出可以输入 ``exit()``，也可以按 ``Ctrl + D``，Windows 上是 ``Ctrl + Z`` 再回车。

REPL 与脚本最大的区别是：每条表达式的值都会自动回显，而脚本必须显式调用 ``print()``。下面这段代码把同样的求值过程打印出来：

.. code-block:: python

   results = {
       "2 ** 10": 2 ** 10,
       "'py' * 3": "py" * 3,
       "len('venv')": len("venv"),
   }

   for expression, value in results.items():
       print(f">>> {expression}")
       print(repr(value))

输出结果：

.. code-block:: text

   >>> 2 ** 10
   1024
   >>> 'py' * 3
   'pypypy'
   >>> len('venv')
   4

``repr()`` 返回的是“给解释器看”的表示形式，字符串会带上引号，这一点与 ``print()`` 直接输出的效果不同。

四、pip 包管理
--------------

``pip`` 随 Python 一起安装，负责从 PyPI 下载和安装第三方包。常用的几条命令：

.. code-block:: bash

   python -m pip --version
   python -m pip install requests
   python -m pip install "requests==2.32.3"
   python -m pip list
   python -m pip show requests
   python -m pip uninstall requests

统一写成 ``python -m pip`` 而不是直接写 ``pip``，可以保证调用的是当前解释器对应的那一份 pip，多版本共存时不会把包装到别的环境里。

项目依赖通常记录在 ``requirements.txt`` 中，一行一个包，支持 ``==``、``>=``、``~=`` 等版本限定符，也允许写注释：

.. code-block:: text

   requests==2.32.3
   rich>=13.0
   pytest~=8.3

这类文件可以交给脚本解析成结构化的数据，用来生成报告或做依赖检查：

.. code-block:: python

   lines = [
       "requests==2.32.3",
       "rich>=13.0",
       "pytest~=8.3",
       "# 开发依赖",
   ]

   for line in lines:
       text = line.strip()
       if not text or text.startswith("#"):
           continue
       for operator in ("==", ">=", "~="):
           if operator in text:
               name, version = text.split(operator, 1)
               print(f"{name:10} {operator} {version}")
               break
       else:
           print(f"{text:10} 未指定版本")

输出结果：

.. code-block:: text

   requests   == 2.32.3
   rich       >= 13.0
   pytest     ~= 8.3

国内网络下载慢时，可以临时指定镜像源，不必修改全局配置：

.. code-block:: bash

   python -m pip install requests -i https://pypi.tuna.tsinghua.edu.cn/simple

五、虚拟环境 venv
-----------------

直接往全局环境安装第三方包，早晚会遇到版本冲突：A 项目需要 ``requests 2.28``，B 项目需要 ``2.32``，而全局环境只能留一个版本。虚拟环境为每个项目准备独立的解释器和 ``site-packages``，互不干扰。``venv`` 是标准库自带的模块，不需要额外安装。

创建环境：

.. code-block:: bash

   cd myproject
   python -m venv .venv

激活环境。Windows PowerShell：

.. code-block:: bash

   .\.venv\Scripts\Activate.ps1

Windows CMD：

.. code-block:: bash

   .venv\Scripts\activate.bat

macOS 与 Linux：

.. code-block:: bash

   source .venv/bin/activate

激活后命令提示符前面会出现 ``(.venv)``，此时 ``python``、``pip`` 都指向虚拟环境内部；退出用 ``deactivate``。PowerShell 如果提示“禁止运行脚本”，先执行 ``Set-ExecutionPolicy -Scope CurrentUser RemoteSigned``。

两个平台的目录结构差别只在存放可执行文件的子目录名，用 ``pathlib`` 可以直观看出来：

.. code-block:: python

   from pathlib import Path

   layout = {"Windows": "Scripts", "macOS / Linux": "bin"}

   for system, folder in layout.items():
       interpreter = Path(".venv") / folder / "python"
       print(f"{system:14} {interpreter.as_posix()}")

输出结果：

.. code-block:: text

   Windows        .venv/Scripts/python
   macOS / Linux  .venv/bin/python

``as_posix()`` 把路径统一成正斜杠形式，输出不受当前操作系统影响。虚拟环境目录不要提交到版本库，在 ``.gitignore`` 里加一行 ``.venv/`` 即可；重建环境只需要删掉目录，再执行一次 ``python -m venv .venv``。

.. tip::

   激活只是修改当前终端的环境变量，关掉终端就失效。VS Code 之类的编辑器可以记住解释器路径，不必每次手动激活。

六、编辑器与 IDE
----------------

Python 没有官方指定的开发工具，按使用场景挑选即可：

.. csv-table::
   :header: "工具", "类型", "适合场景"

   "IDLE", "Python 自带", "临时验证语法，无需任何安装"
   "VS Code", "轻量编辑器 + 扩展", "通用开发，装 Python 扩展即可运行、调试、格式化"
   "PyCharm", "专业 IDE", "大型项目与 Django 开发，代码分析能力强"
   "Jupyter", "交互式笔记本", "数据分析与教学演示，单元格逐个执行"
   "Neovim", "终端编辑器", "远程服务器上改代码，配合 LSP 获得补全"

无论选哪一个，都建议按同一套流程建立项目：先建虚拟环境，再装依赖，最后让编辑器指向 ``.venv`` 里的解释器。下一章会以 VS Code 为例，把这条流程完整走一遍。

练习任务
--------

任务 1：判断当前解释器是否满足最低版本要求，并打印主版本号与次版本号。

.. code-block:: python

   import sys

   major, minor = sys.version_info[:2]

   print("主版本：", major, "次版本：", minor)
   print("满足 3.9 以上：", (major, minor) >= (3, 9))

输出结果：

.. code-block:: text

   主版本： 3 次版本： 13
   满足 3.9 以上： True

任务 2：把 ``requirements.txt`` 的行列表整理成“包名 → 版本”的字典，过滤注释行，并按包名排序输出。

.. code-block:: python

   requirements = ["flask==3.0.3", "# 基础依赖", "requests==2.32.3", "rich==13.9.4"]

   pinned = {}
   for item in requirements:
       text = item.strip()
       if not text or text.startswith("#"):
           continue
       try:
           name, version = text.split("==")
       except ValueError:
           print(f"跳过无法解析的行：{text}")
           continue
       pinned[name] = version

   for name in sorted(pinned):
       print(f"{name}: {pinned[name]}")

输出结果：

.. code-block:: text

   flask: 3.0.3
   requests: 2.32.3
   rich: 13.9.4

相关资源
--------

* 下载页面：`Python Downloads <https://www.python.org/downloads/>`_
* 安装指南：`Python Setup and Usage <https://docs.python.org/zh-cn/3/using/index.html>`_
* 虚拟环境：`venv — 创建虚拟环境 <https://docs.python.org/zh-cn/3/library/venv.html>`_
* 包管理：`pip 文档 <https://pip.pypa.io/en/stable/>`_
