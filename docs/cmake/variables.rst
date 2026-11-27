CMake 变量与缓存
================

.. meta::
   :group: 核心概念
   :summary: 普通变量、缓存变量、环境变量的区别与作用域规则，以及必须记住的内置变量清单。

CMake 的变量体系分三层：**普通变量**、**缓存变量** 和 **环境变量**，三者读取方式不同、生命周期不同。分清它们是读懂构建脚本的前提。

一、普通变量
------------

``set()`` 赋值，``${}`` 读取，未定义的变量展开为空：

.. code-block:: cmake

   set(APP_NAME "demo")
   set(VERSION 1.0)
   message(STATUS "${APP_NAME} v${VERSION}")

变量名区分大小写，建议使用下划线分隔的全大写或全小写风格。重复 ``set`` 会直接覆盖。

取消定义用 ``unset()``：

.. code-block:: cmake

   set(TMP_VAR 1)
   unset(TMP_VAR)
   message(STATUS "[${TMP_VAR}]")   # 输出 []

二、缓存变量
------------

缓存变量保存在构建目录的 ``CMakeCache.txt`` 中，跨配置持久存在。它解决的正是 “用户手动选择过的东西不该被脚本悄悄改回去” 的问题。

.. code-block:: cmake

   # set(<变量> <值> CACHE <类型> <说明> [FORCE])
   set(BUILD_TESTS ON CACHE BOOL "是否构建测试")
   set(DATA_DIR "/opt/demo/data" CACHE PATH "数据目录")
   option(USE_CUDA "启用 CUDA 加速" OFF)   # 布尔缓存变量的简写

缓存类型：

.. csv-table::
   :header: "类型", "用途"

   "BOOL", "开/关布尔值（ON、OFF）"
   "PATH", "目录路径，GUI 中显示为目录选择框"
   "FILEPATH", "文件路径"
   "STRING", "普通字符串"
   "INTERNAL", "内部变量，不展示给用户，仅用于缓存计算结果"

三种变量的行为对比：

.. csv-table::
   :header: "特性", "普通变量", "缓存变量", "环境变量"

   "读取", "${VAR}", "${VAR}", "$ENV{VAR}"
   "存储位置", "当前作用域内存", "CMakeCache.txt", "进程环境块"
   "生命周期", "本次配置", "跨配置持久", "cmake 进程运行期间"
   "命令行设置", "不可", "cmake -DVAR=value", "导出后由 cmake 读取"

命令行 -D 与缓存
~~~~~~~~~~~~~~~~

.. code-block:: bash

   cmake -S . -B build -DBUILD_TESTS=ON -DDATA_DIR=D:/data

命令行设置的值优先级高于脚本中的缓存默认值：之后再运行 ``set(BUILD_TESTS OFF CACHE BOOL ...)`` 不会覆盖 ``-D`` 的选择，除非加 ``FORCE``：

.. code-block:: cmake

   set(BUILD_TESTS OFF CACHE BOOL "是否构建测试" FORCE)   # 强制覆盖

.. warning::

   修改缓存默认值后，旧构建目录里仍保留着旧值。测试新默认值时请换一个全新构建目录，或删除 ``CMakeCache.txt``。

三、作用域与继承
----------------

普通变量按 **目录作用域** 隔离，``add_subdirectory`` 进入子目录时会复制一份父目录变量；子目录里的修改不影响父目录：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(scope-demo LANGUAGES NONE)

   set(level "top")
   add_subdirectory(sub)
   message(STATUS "顶层: ${level}")     # top

.. code-block:: cmake

   # sub/CMakeLists.txt
   set(level "sub")
   message(STATUS "子目录: ${level}")   # sub
   set(level "changed" PARENT_SCOPE)    # 只影响父目录

需要向上传递时使用 ``PARENT_SCOPE``：上面的 ``set(level "changed" PARENT_SCOPE)`` 只影响父目录，子目录里的 ``level`` 仍是 ``sub``。

函数内同理，``PARENT_SCOPE`` 指向调用者的作用域。

四、环境变量
------------

.. code-block:: cmake

   # 读取
   message(STATUS "HOME = $ENV{HOME}")

   # 设置：只影响本次 cmake 进程及其启动的子进程（编译器等）
   set(ENV{CC} "gcc")

.. note::

   ``set(ENV{...})`` 不会写回系统环境，配置结束即失效。需要持久设置时请在系统层面配置环境变量。

五、常用内置变量
----------------

路径类：

.. csv-table::
   :header: "变量", "含义"

   "CMAKE_SOURCE_DIR", "顶层源码目录（与调用位置无关）"
   "CMAKE_BINARY_DIR", "顶层构建目录"
   "CMAKE_CURRENT_SOURCE_DIR", "当前 CMakeLists.txt 所在源码目录"
   "CMAKE_CURRENT_BINARY_DIR", "当前目录对应的构建目录"
   "PROJECT_SOURCE_DIR", "最近一次 project() 的源码目录"
   "PROJECT_NAME / PROJECT_VERSION", "最近一次 project() 的名称与版本"

配置类：

.. csv-table::
   :header: "变量", "含义"

   "CMAKE_BUILD_TYPE", "构建类型（单配置生成器）：Debug / Release / RelWithDebInfo / MinSizeRel"
   "CMAKE_INSTALL_PREFIX", "安装前缀，Windows 默认 C:/Program Files (x86)/<项目>"
   "CMAKE_CXX_COMPILER / CMAKE_C_COMPILER", "编译器路径"
   "CMAKE_CXX_STANDARD", "C++ 标准版本（14、17、20、23）"
   "CMAKE_PREFIX_PATH", "find_package 的查找前缀列表"
   "BUILD_SHARED_LIBS", "add_library 不指定类型时的默认类型（ON 为动态库）"

平台判断类：``WIN32``（Windows，含 64 位）、``UNIX``（Linux/macOS）、``APPLE``（macOS）、``MSVC``（MSVC 编译器）、``MINGW``（MinGW 编译器）。

六、练习任务
------------

任务 1：观察缓存与命令行 ``-D`` 的优先级

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(cache-demo LANGUAGES NONE)

   set(MODE "script-default" CACHE STRING "演示缓存")
   message(STATUS "MODE = ${MODE}")

分别运行以下命令并对比输出：

.. code-block:: bash

   cmake -S . -B build                 # 输出 MODE = script-default
   cmake -S . -B build -DMODE=cli      # 输出 MODE = cli（-D 优先）
   cmake -S . -B build                 # 仍是 cli：缓存已记住 -D 的值

任务 2：用 PARENT_SCOPE 把子目录的探测结果带回顶层

.. code-block:: cmake

   # sub/CMakeLists.txt
   if(EXISTS ${CMAKE_CURRENT_SOURCE_DIR}/config.h)
       set(HAVE_CONFIG 1 PARENT_SCOPE)
   endif()

任务 3：打印当前环境的 PATH（配置阶段）

.. code-block:: cmake

   message(STATUS "PATH = $ENV{PATH}")
