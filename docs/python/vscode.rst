VS Code 配置 Python
===================

.. meta::
   :group: 入门
   :summary: 在 VS Code 中安装 Python 扩展、选择解释器、运行与调试脚本，配置 launch.json、black 与 ruff，并用 Jupyter 逐格执行代码。

VS Code 是免费、跨平台的编辑器，装上 Python 扩展之后，代码补全、跳转、调试、格式化和笔记本执行都能在同一个窗口里完成。它的项目级配置放在根目录的 ``.vscode`` 文件夹中，可以随代码一起提交，团队里每个人打开项目就得到一致的环境。

一、安装 Python 扩展
--------------------

在扩展面板（``Ctrl + Shift + X``）搜索 ``Python``，安装 Microsoft 官方发布的那一个。它会自动带上 ``Pylance``（语言服务）和 ``Python Debugger``（调试器）两个依赖扩展，不需要单独安装。

命令行里也可以直接装，适合写进新机器的初始化脚本：

.. code-block:: bash

   code --install-extension ms-python.python
   code --install-extension ms-python.black-formatter
   code --install-extension charliermarsh.ruff

确认装好了哪些扩展：

.. code-block:: bash

   code --list-extensions

输出结果：

.. code-block:: text

   charliermarsh.ruff
   ms-python.black-formatter
   ms-python.debugpy
   ms-python.python
   ms-python.vscode-pylance

如果终端里提示找不到 ``code`` 命令，在命令面板执行 ``Shell Command: Install 'code' command in PATH``（macOS 与 Linux 上是这个名字），Windows 安装时勾选“添加到 PATH”即可。

扩展只提供编辑器能力，解释器仍然要用系统里装好的那一份，所以先确认终端中 ``python --version`` 有输出，再回到编辑器里配置。

二、选择解释器
--------------

一个工作区用哪个 Python，由解释器设置决定。命令面板执行 ``Python: Select Interpreter``，列表里会列出：

* 虚拟环境（项目下的 ``.venv``、``env``、``venv`` 目录）
* conda 环境
* 全局安装的解释器
* 通过 ``pyenv`` 管理的版本

选中之后，VS Code 会把路径写进工作区设置 ``.vscode/settings.json``：

.. code-block:: json

   {
     "python.defaultInterpreterPath": ".venv/bin/python",
     "python.terminal.activateEnvironment": true,
     "python.analysis.typeCheckingMode": "basic",
     "python.analysis.autoImportCompletions": true
   }

Windows 上把路径换成 ``.venv/Scripts/python.exe``。状态栏左下角会显示当前解释器的版本号，点一下就能快速切换；切换后新开的终端会自动激活对应的环境，不再需要手动执行 ``activate``。

依赖装在哪个环境，决定了代码能不能跑起来。可以在编辑器内置终端里核对：

.. code-block:: bash

   python -c "import sys; print(sys.prefix)"
   python -m pip list

输出结果：

.. code-block:: text

   C:\Users\demo\myproject\.venv
   Package    Version
   ---------- -------
   pip        24.2
   requests   2.32.3

``sys.prefix`` 指向虚拟环境目录，就说明当前终端确实在用项目自己的解释器。

三、运行与调试
--------------

运行一个脚本有三种方式：

* 点击编辑器右上角的三角形按钮，等同于 ``Run Python File``
* 在编辑区右键选择 ``Run Python File in Terminal``
* 在终端里手动执行命令

.. code-block:: bash

   python hello.py

输出结果：

.. code-block:: text

   Hello, VS Code!

调试才是 VS Code 的强项。在行号左侧点一下设置断点（出现红点），按 ``F5`` 启动调试，代码会在断点处暂停：左侧可以查看局部变量、调用栈和监视表达式，``F10`` 单步跳过，``F11`` 单步进入，``Shift + F5`` 结束调试。

下面这段代码适合练习断点，在 ``total += n`` 那一行下断点，反复按 ``F10`` 观察 ``total`` 与 ``n`` 的变化：

.. code-block:: python

   def sum_even(limit):
       total = 0
       for n in range(1, limit + 1):
           if n % 2 == 0:
               total += n
       return total

   print("1 到 10 的偶数和：", sum_even(10))

输出结果：

.. code-block:: text

   1 到 10 的偶数和： 30

调试时如果断点显示为灰色空心圆，通常是解释器没选对，或者运行的入口文件和断点不在同一个进程里。

四、launch.json 配置
--------------------

第一次按 ``F5`` 时，如果没有调试配置，VS Code 会询问类型，选择 ``Python File`` 就会自动生成 ``.vscode/launch.json``。需要固定参数、环境变量时，直接编辑这个文件：

.. code-block:: json

   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Python: 当前文件",
         "type": "debugpy",
         "request": "launch",
         "program": "${file}",
         "console": "integratedTerminal",
         "cwd": "${workspaceFolder}",
         "justMyCode": true
       },
       {
         "name": "Python: 带参数运行",
         "type": "debugpy",
         "request": "launch",
         "program": "${workspaceFolder}/main.py",
         "args": ["--verbose", "--limit", "10"],
         "env": {
           "APP_ENV": "dev"
         },
         "console": "integratedTerminal"
       }
     ]
   }

``type`` 在旧版扩展里写作 ``python``，新版调试器统一为 ``debugpy``；``${file}`` 表示当前打开的文件，``${workspaceFolder}`` 表示项目根目录。``args`` 里的每一项对应 ``sys.argv`` 的一个参数，``env`` 用来注入环境变量，``justMyCode`` 设为 ``true`` 可以避免单步时跳进标准库。

``args`` 最终会变成命令行参数，用 ``argparse`` 接收时最好显式声明类型和默认值：

.. code-block:: python

   import argparse
   import sys

   sys.argv = ["main.py", "--verbose", "--limit", "10"]

   parser = argparse.ArgumentParser()
   parser.add_argument("--verbose", action="store_true")
   parser.add_argument("--limit", type=int, default=5)
   options = parser.parse_args()

   print("verbose =", options.verbose)
   print("limit =", options.limit)

输出结果：

.. code-block:: text

   verbose = True
   limit = 10

``store_true`` 表示这个开关不带值，出现即为真；``type=int`` 会把字符串自动转换成整数，省去手动 ``int()``。

五、格式化：black 与 ruff
-------------------------

格式化工具解决缩进、引号、换行这类没有争议的风格问题，让评审时不再讨论排版。社区的主流组合是 black 负责格式化，ruff 负责 lint 和 import 排序：

.. code-block:: bash

   python -m pip install black ruff
   black .
   ruff check .
   ruff check --fix .
   ruff format .

把这些动作挂到保存上，就不用每次手动执行：

.. code-block:: json

   {
     "[python]": {
       "editor.defaultFormatter": "ms-python.black-formatter",
       "editor.formatOnSave": true,
       "editor.codeActionsOnSave": {
         "source.organizeImports": "explicit"
       }
     },
     "black-formatter.args": ["--line-length", "100"],
     "ruff.lineLength": 100
   }

``editor.defaultFormatter`` 填的是扩展 ID：black 是 ``ms-python.black-formatter``，ruff 是 ``charliermarsh.ruff``，换成 ruff 做格式化时把这一行改掉即可。行长度要和其他配置保持一致，black 默认 88，这里改成 100 之后，``pyproject.toml`` 里的 ``line-length`` 也要同步，否则保存时会被反复改写。

六、Jupyter Notebook
--------------------

VS Code 可以直接打开 ``.ipynb`` 文件，也可以用 ``# %%`` 把普通 ``.py`` 文件切成单元格。逐格执行时变量保留在同一个内核里，适合做数据探索和教学演示。

内核由 ``jupyter`` 与 ``ipykernel`` 提供，装进项目自己的虚拟环境：

.. code-block:: bash

   python -m pip install jupyter ipykernel
   python -m ipykernel install --user --name myenv --display-name "Python (.venv)"

打开笔记本后，右上角选择内核（Kernel），单元格上方会出现 ``Run Cell``、``Run Below`` 等按钮。单元格之间的变量是共享的，下面三段代码放在同一个笔记本里会依次拿到前一格的结果：

.. code-block:: python

   numbers = [1, 2, 3, 4]
   squares = [n * n for n in numbers]

   print("平方：", squares)
   print("总和：", sum(squares))

输出结果：

.. code-block:: text

   平方： [1, 4, 9, 16]
   总和： 30

笔记本里不建议存放需要长时间运行的任务，内核一旦断开，内存中的变量会全部丢失，重要结果要及时写入文件。

七、常用快捷键
--------------

.. csv-table::
   :header: "快捷键", "作用"

   "``Ctrl + Shift + P``", "打开命令面板，所有 Python 命令都在这里"
   "``Ctrl + Shift + X``", "打开扩展面板"
   "``F5``", "启动调试，调试中表示继续运行"
   "``F9``", "在当前行切换断点"
   "``F10``", "单步跳过，不进入函数内部"
   "``F11``", "单步进入函数内部"
   "``Shift + F5``", "停止调试"
   "``Shift + Alt + F``", "格式化当前文件"
   "``F12``", "跳转到定义"
   "``Shift + F12``", "查找所有引用"

快捷键在不同系统上略有差异，macOS 上把 ``Ctrl`` 换成 ``Cmd``、``Alt`` 换成 ``Option``。记不住也没关系，命令面板里输入命令名同样能执行。

练习任务
--------

任务 1：写一个带累加过程的函数，在 ``total += value`` 处下断点，单步观察每轮的总和。

.. code-block:: python

   def running_total(values):
       total = 0
       for value in values:
           total += value
           print(f"加上 {value} 后，total = {total}")
       return total

   print("最终结果：", running_total([5, 10, 15]))

输出结果：

.. code-block:: text

   加上 5 后，total = 5
   加上 10 后，total = 15
   加上 15 后，total = 30
   最终结果： 30

任务 2：black 默认行长 88，写脚本统计各文件超出该长度的行数，用来决定是否需要调整 ``line-length``。

.. code-block:: python

   files = {
       "main.py": [72, 88, 95],
       "utils.py": [60, 64, 80],
       "train.py": [120, 76, 88],
   }

   limit = 88

   for name in sorted(files):
       lengths = files[name]
       over = [length for length in lengths if length > limit]
       print(f"{name:10} 共 {len(lengths)} 行，超长 {len(over)} 行")

输出结果：

.. code-block:: text

   main.py    共 3 行，超长 1 行
   train.py   共 3 行，超长 1 行
   utils.py   共 3 行，超长 0 行

相关资源
--------

* 官方文档：`Python in Visual Studio Code <https://code.visualstudio.com/docs/python/python-tutorial>`_
* 调试配置：`Debugging configurations <https://code.visualstudio.com/docs/python/debugging>`_
* 格式化与 lint：`Formatting and linting <https://code.visualstudio.com/docs/python/formatting>`_
* Jupyter 支持：`Jupyter Notebooks in VS Code <https://code.visualstudio.com/docs/datascience/jupyter-notebooks>`_
