Python pip
============

.. meta::
   :group: 标准库与实战
   :summary: 使用 pip 查找、安装、升级和卸载 Python 包，掌握版本固定、requirements.txt、镜像源、虚拟环境配合以及常见安装错误的排查方法。

``pip`` 是 Python 的包管理工具，负责从 Python 包索引（PyPI）下载、安装、升级和卸载第三方库。Python 3.4 以后官方安装包自带 pip，日常开发几乎离不开它。

一、检查 pip 是否可用
---------------------

在命令行执行：

.. code-block:: bash

   python -m pip --version

也可以直接用 ``pip --version``。推荐写成 ``python -m pip``，这样可以明确指定使用哪个解释器的 pip，避免多版本 Python 时装错环境：

.. code-block:: python

   import subprocess
   import sys

   result = subprocess.run(
       [sys.executable, "-m", "pip", "--version"],
       capture_output=True,
       text=True,
   )

   print("pip 可用：", result.returncode == 0)
   print("输出以 pip 开头：", result.stdout.startswith("pip "))

输出结果：

.. code-block:: text

   pip 可用： True
   输出以 pip 开头： True

如果提示“不是内部或外部命令”，通常是没有把 Python 的 Scripts 目录加入 PATH，用 ``python -m pip`` 即可绕过。若提示 ``No module named pip``，可以执行 ``python -m ensurepip --upgrade`` 重新安装 pip。

二、升级 pip
------------

pip 本身也通过 pip 升级：

.. code-block:: bash

   python -m pip install --upgrade pip

在 Linux 或 macOS 上如果遇到权限错误，优先创建虚拟环境，而不是加 ``sudo``；确实需要装到用户目录时用 ``--user``：

.. code-block:: bash

   python -m pip install --upgrade pip --user

升级后可以用 ``pip cache purge`` 清理下载缓存，释放磁盘空间。

三、安装包
----------

最基本的安装命令是 ``pip install 包名``：

.. code-block:: bash

   pip install requests

指定版本可以避免上游更新带来的不兼容：

.. code-block:: bash

   pip install "requests==2.34.2"

版本约束支持多种写法：

.. csv-table::
   :header: "写法", "含义"

   "``==2.34.2``", "精确匹配这个版本"
   "``>=2.0``", "不低于 2.0"
   "``~=2.34.0``", "兼容 2.34.x，不跨到 2.35"
   "``!=2.34.1``", "排除指定版本"
   "``requests[security]``", "同时安装可选依赖"

国内访问 PyPI 较慢时，可以临时指定镜像：

.. code-block:: bash

   pip install requests -i https://pypi.tuna.tsinghua.edu.cn/simple

也可以把镜像写入配置，永久生效：

.. code-block:: bash

   pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

从本地源码安装、以可编辑模式开发时用 ``-e``：

.. code-block:: bash

   pip install -e .

``-e`` 会把当前目录作为包链接进环境，修改源码后无需重新安装。

四、查看已安装的包
------------------

``pip list`` 列出当前环境安装的全部包及版本，``pip show`` 查看单个包的详细信息：

.. code-block:: python

   import subprocess
   import sys

   result = subprocess.run(
       [sys.executable, "-m", "pip", "show", "pip"],
       capture_output=True,
       text=True,
   )

   fields = {}
   for line in result.stdout.splitlines():
       if ": " in line:
           key, value = line.split(": ", 1)
           fields[key] = value

   print("名称：", fields.get("Name"))
   print("版本号非空：", bool(fields.get("Version")))
   print("安装位置包含 site-packages：", "site-packages" in fields.get("Location", ""))

输出结果：

.. code-block:: text

   名称： pip
   版本号非空： True
   安装位置包含 site-packages： True

``pip list --outdated`` 列出可升级的包，``pip list --format=freeze`` 输出适合写入 requirements 的格式：

.. code-block:: python

   import subprocess
   import sys

   result = subprocess.run(
       [sys.executable, "-m", "pip", "list", "--format=freeze"],
       capture_output=True,
       text=True,
   )

   packages = [line for line in result.stdout.splitlines() if "==" in line]
   print("已安装包数量大于 0：", len(packages) > 0)
   print("列表中包含 pip：", any(line.lower().startswith("pip==") for line in packages))

输出结果：

.. code-block:: text

   已安装包数量大于 0： True
   列表中包含 pip： True

五、卸载包
----------

卸载用 ``pip uninstall``，加 ``-y`` 跳过确认：

.. code-block:: bash

   pip uninstall requests -y

pip 只卸载指定的包，不会自动清理它带进来的依赖。长期迭代后环境里会留下大量不再需要的包，可以定期用 ``pip check`` 检查依赖冲突，或在虚拟环境中重建。

六、requirements.txt
--------------------

项目通常把依赖写进 ``requirements.txt``，让其他机器一键复现环境：

.. code-block:: bash

   pip freeze > requirements.txt
   pip install -r requirements.txt

``pip freeze`` 会导出所有已安装包（包括间接依赖），适合锁定生产环境；手工维护的 ``requirements.txt`` 通常只写直接依赖，让 pip 自行解析版本。

文件格式很简单，每行一个包，支持注释和版本约束：

.. code-block:: python

   from pathlib import Path

   content = """# Web 项目依赖
   requests==2.34.2
   flask>=3.0
   """
   Path("requirements.txt").write_text(content, encoding="utf-8")

   lines = Path("requirements.txt").read_text(encoding="utf-8").splitlines()
   packages = [line for line in lines if line.strip() and not line.startswith("#")]

   print("依赖数量：", len(packages))
   print("第一条：", packages[0])
   print("包含 Flask 约束：", any(item.lower().startswith("flask") for item in packages))

   Path("requirements.txt").unlink()

输出结果：

.. code-block:: text

   依赖数量： 2
   第一条： requests==2.34.2
   包含 Flask 约束： True

七、pip 与虚拟环境
------------------

不同项目依赖的版本可能冲突，应该为每个项目创建独立的虚拟环境。``venv`` 是标准库自带的方案：

.. code-block:: bash

   python -m venv .venv
   .venv\Scripts\activate
   python -m pip install -r requirements.txt

macOS 和 Linux 的激活命令是：

.. code-block:: bash

   source .venv/bin/activate

激活后，``pip`` 和 ``python`` 都指向虚拟环境内部，安装的包不会污染全局环境。退出用 ``deactivate``。IDE 中选择解释器时，指向 ``.venv`` 目录下的 python 可执行文件即可。

八、常见错误与排查
------------------

.. csv-table::
   :header: "现象", "原因与处理"

   "``pip 不是内部或外部命令``", "Scripts 目录不在 PATH，改用 ``python -m pip``"
   "``Permission denied``", "装到了系统目录，改用虚拟环境或 ``--user``"
   "``Could not find a version``", "包名拼错、Python 版本不兼容，或需要换镜像源"
   "``SSL: CERTIFICATE_VERIFY_FAILED``", "代理或公司证书问题，安装根证书，不要关闭校验"
   "``ERROR: pip's dependency resolver``", "依赖版本冲突，按提示调整版本或新建虚拟环境"
   "安装很慢或超时", "指定国内镜像，或设置 ``--default-timeout=120``"

排查时可加 ``-v`` 查看详细日志：

.. code-block:: bash

   pip install requests -v

如果只是想在离线机器上安装，可以先在有网机器执行 ``pip download requests -d packages``，把整个目录拷过去，再执行 ``pip install --no-index --find-links=packages requests``。

九、练习任务
------------

任务 1：用 Python 调用 pip，判断当前环境是否安装了 pip 自身，并输出包名。

.. code-block:: python

   import subprocess
   import sys

   result = subprocess.run(
       [sys.executable, "-m", "pip", "show", "pip"],
       capture_output=True,
       text=True,
   )
   name = None
   for line in result.stdout.splitlines():
       if line.startswith("Name:"):
           name = line.split(":", 1)[1].strip()

   print("查询成功：", result.returncode == 0)
   print("包名：", name)

输出结果：

.. code-block:: text

   查询成功： True
   包名： pip

任务 2：解析一份 requirements 文本，统计依赖数量并列出包名（不含版本号）。

.. code-block:: python

   text = """# 项目依赖
   requests==2.34.2
   flask>=3.0
   numpy~=2.0
   """
   lines = [line.strip() for line in text.splitlines() if line.strip() and not line.startswith("#")]
   names = [line.split("=")[0].split(">")[0].split("<")[0].split("~")[0] for line in lines]

   print("依赖数量：", len(names))
   print("包名：", names)

输出结果：

.. code-block:: text

   依赖数量： 3
   包名： ['requests', 'flask', 'numpy']

任务 3：生成一个 requirements.txt，再读取并校验每一行都包含版本约束。

.. code-block:: python

   from pathlib import Path

   content = "requests==2.34.2\nflask>=3.0\n"
   path = Path("requirements.txt")
   path.write_text(content, encoding="utf-8")

   lines = [line for line in path.read_text(encoding="utf-8").splitlines() if line]
   all_constrained = all(("==" in line or ">=" in line or "<=" in line or "~=" in line) for line in lines)

   print("文件行数：", len(lines))
   print("全部带版本约束：", all_constrained)
   path.unlink()

输出结果：

.. code-block:: text

   文件行数： 2
   全部带版本约束： True

掌握 pip 之后，第三方库的安装与版本管理就基本顺畅了。下一章用综合练习把前面各章的知识串起来。