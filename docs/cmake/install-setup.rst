CMake 安装与配置
================

.. meta::
   :group: 入门
   :summary: 在 Windows、macOS、Linux 上安装 CMake，配置环境变量并验证安装，顺带认识 cmake-gui。

CMake 官方为 Windows、macOS、Linux 提供预编译安装包，各发行版的软件源里也都有现成的包。安装完成后建议确认 ``cmake``、``ctest``、``cpack`` 三个命令都能找到。

一、Windows 上安装 CMake
------------------------

方法一：使用 Winget（推荐）
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Windows 10/11 自带的包管理器可以直接安装官方包：

.. code-block:: bash

   winget install --id Kitware.CMake -e

方法二：使用 Chocolatey
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   choco install cmake -y

方法三：下载安装包
~~~~~~~~~~~~~~~~~~

1. 打开官网下载页：`https://cmake.org/download <https://cmake.org/download/>`_
2. 下载 Windows x64 Installer（如 ``cmake-<版本>-windows-x86_64.msi``）。
3. 双击安装。安装向导中建议选择 **“Add CMake to the system PATH for all users”**，自动把 ``bin`` 目录加入 PATH。
4. 也可以选择 ``.zip`` 便携版，解压后自行配置 PATH，适合无管理员权限的环境。

.. tip::

   如果本机安装了 Qt、Visual Studio 等开发环境，它们通常已经自带 CMake（例如 Qt 安装在 ``Tools\CMake_64`` 目录下）。可以先用 ``where cmake`` 检查是否已有可用的 CMake，避免重复安装。

二、macOS 上安装 CMake
----------------------

方法一：使用 Homebrew（推荐）

.. code-block:: bash

   brew install cmake

方法二：下载 ``.dmg`` 安装包，拖入 Applications 后，把 ``/Applications/CMake.app/Contents/bin`` 加入 PATH。

三、Linux 上安装 CMake
----------------------

Ubuntu / Debian
~~~~~~~~~~~~~~~

发行版自带的 CMake 版本往往偏旧，Kitware 官方 APT 源始终保持最新版本：

.. code-block:: bash

   # 安装依赖
   sudo apt-get update
   sudo apt-get install -y ca-certificates gpg wget

   # 导入 Kitware 签名密钥
   test -f /usr/share/doc/kitware-archive-keyring/copyright ||
   wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null |
       gpg --dearmor - | sudo tee /usr/share/keyrings/kitware-archive-keyring.gpg >/dev/null

   # 添加软件源（按版本替换 noble：20.04 用 focal，22.04 用 jammy）
   echo 'deb [signed-by=/usr/share/keyrings/kitware-archive-keyring.gpg] https://apt.kitware.com/ubuntu/ noble main' |
       sudo tee /etc/apt/sources.list.d/kitware.list >/dev/null

   # 安装
   sudo apt-get update
   sudo apt-get install -y cmake

只想用发行版自带版本时，直接 ``sudo apt install cmake`` 即可，但版本可能落后较多。

Fedora / RHEL
~~~~~~~~~~~~~

.. code-block:: bash

   sudo dnf install -y cmake

Arch Linux
~~~~~~~~~~

.. code-block:: bash

   sudo pacman -S cmake

任意平台：使用 pip
~~~~~~~~~~~~~~~~~~

Python 环境中可以通过 PyPI 安装官方打包的 CMake，适合容器和 CI 场景：

.. code-block:: bash

   pip install cmake

四、验证安装
------------

.. code-block:: bash

   cmake --version

输出结果类似如下：

.. code-block:: text

   cmake version 4.4.4
   CMake suite maintained and supported by Kitware (kitware.com/cmake).

配套工具随主程序一起安装，一并确认：

.. code-block:: bash

   ctest --version
   cpack --version

.. csv-table:: CMake 套件常用命令
   :header: "命令", "用途"

   "cmake", "配置、生成与构建项目"
   "ctest", "运行单元测试"
   "cpack", "打包发布（zip、deb、rpm 等）"
   "cmake-gui", "图形界面配置工具"

用脚本模式检查环境
~~~~~~~~~~~~~~~~~~

不创建项目也能验证 CMake 是否可用：把下面的内容保存为 ``check_env.cmake``，用 ``cmake -P`` 执行。脚本模式不需要编译器，适合在 CI 的安装步骤里做前置检查：

.. code-block:: cmake

   # check_env.cmake
   message(STATUS "CMake 版本: ${CMAKE_VERSION}")
   message(STATUS "系统: ${CMAKE_HOST_SYSTEM_NAME}")

   if(CMAKE_VERSION VERSION_LESS 3.16)
       message(FATAL_ERROR "CMake 版本过低，请升级")
   endif()
   message(STATUS "版本检查通过")

运行：

.. code-block:: bash

   cmake -P check_env.cmake

输出结果类似如下：

.. code-block:: text

   -- CMake 版本: 4.4.4
   -- 系统: Windows

   -- 版本检查通过

五、配置环境变量
----------------

Windows 环境变量设置
~~~~~~~~~~~~~~~~~~~~

MSI 安装时勾选了加入 PATH 的选项，则无需手动配置。便携版需要手动添加：

1. 打开 “系统属性 → 高级系统设置 → 环境变量”。
2. 在 “系统变量” 中找到 ``Path``，点击 “编辑 → 新建”。
3. 填入 CMake 的 ``bin`` 目录，例如 ``D:\cmake-4.4.4-windows-x86_64\bin``。
4. 重新打开终端，运行 ``cmake --version`` 验证。

macOS 和 Linux
~~~~~~~~~~~~~~

包管理器安装后通常已经就绪。手动解压的版本把 ``bin`` 目录加入 shell 配置文件：

.. code-block:: bash

   # ~/.bashrc 或 ~/.zshrc
   export PATH="$HOME/cmake-4.4.4-linux-x86_64/bin:$PATH"

六、CMake GUI 使用
------------------

安装包含图形界面 ``cmake-gui``，适合不想敲命令的场景：

1. 打开 ``cmake-gui``，在 **Where is the source code** 填源码目录，**Where to build the binaries** 填构建目录（两者应不同）。
2. 点击 **Configure**，首次会询问生成器（如 Ninja、Visual Studio 17 2022）和编译器。
3. 红色的缓存变量列表中可以勾选选项（如 ``BUILD_SHARED_LIBS``）。
4. 再次 **Configure** 直到没有红色项，点击 **Generate** 生成构建文件。
5. 点击 **Open Project** 打开 IDE，或回到终端执行 ``cmake --build build``。

.. note::

   GUI 与命令行操作的是同一套缓存文件，两种方式可以混用。命令行 ``-D`` 设置的变量同样会出现在 GUI 的变量列表中。

七、版本选择建议
----------------

* 新项目建议使用较新的版本（不低于 3.16），文档和生态支持最好。
* 维护老项目时注意：**CMake 4.0 起不再兼容声明 3.5 以下最低版本的工程**，升级 CMake 后需要修改 ``cmake_minimum_required``。
* 团队协作环境不必追求最新版，版本一致比版本新更省事。
八、练习任务
------------

任务 1：用 ``cmake -P`` 写一个脚本，检查 CMake 版本不低于 3.20，并打印 ``ctest`` 的路径。

.. code-block:: cmake

   # check_ctest.cmake
   if(CMAKE_VERSION VERSION_LESS 3.20)
       message(FATAL_ERROR "需要 CMake 3.20+")
   endif()

   find_program(CTEST_EXE ctest)
   message(STATUS "ctest: ${CTEST_EXE}")

任务 2：运行 ``cmake --help``，找出本机默认生成器的名称。

任务 3：用 ``where cmake``（Windows）或 ``which cmake``（Linux/macOS）确认命令来自哪个安装目录。
