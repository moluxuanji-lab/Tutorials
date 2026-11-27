CMake 构建流程
==============

.. meta::
   :group: 入门
   :summary: 理解“配置生成”与“编译构建”两个阶段，掌握构建目录、生成器选择与常用命令行参数。

CMake 的构建分为两个阶段：先由 ``cmake`` 读取 ``CMakeLists.txt`` **生成** 当前平台的构建文件，再由生成的构建系统 **编译** 代码。理解这两阶段的分工，就能解释日常遇到的绝大多数构建问题。

一、构建流程概览
----------------

.. csv-table:: 两个阶段
   :header: "阶段", "执行者", "输入", "输出"

   "配置 + 生成", "cmake", "CMakeLists.txt、缓存变量", "build.ninja / Makefile / .sln 等构建文件"
   "编译 + 链接", "Ninja、Make、MSBuild 等", "构建文件、源代码", "可执行文件与库文件"

日常命令与之对应：

.. code-block:: bash

   cmake -S . -B build          # 第一阶段：配置并生成
   cmake --build build          # 第二阶段：编译构建

``-S`` 指定源码目录，``-B`` 指定构建目录。``cmake --build`` 是跨生成器的统一入口，它会自动调用底层工具（Ninja / make / msbuild），不需要记忆具体构建命令。

完整演练
~~~~~~~~

用一个最小工程把两阶段走一遍。工程只有两个文件：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(hello LANGUAGES CXX)
   add_executable(hello src/main.cpp)

.. code-block:: cpp

   // src/main.cpp
   #include <iostream>

   int main() {
       std::cout << "Hello, CMake!" << std::endl;
       return 0;
   }

第一步，配置并生成：

.. code-block:: bash

   cmake -S . -B build -G Ninja

第二步，编译：

.. code-block:: bash

   cmake --build build

第三步，运行：

.. code-block:: bash

   ./build/hello.exe      # Linux/macOS：./build/hello

完整输出类似：

.. code-block:: text

   -- The CXX compiler identification is GNU 15.1.0
   -- Detecting CXX compiler ABI info - done
   -- Check for working CXX compiler: .../g++.exe - skipped
   -- Detecting CXX compile features - done
   -- Configuring done (6.6s)
   -- Generating done (0.2s)
   -- Build files have been written to: .../hello/build
   [1/2] Building CXX object CMakeFiles/hello.dir/src/main.cpp.obj
   [2/2] Linking CXX executable hello.exe
   Hello, CMake!

修改 ``main.cpp`` 后再次执行 ``cmake --build build``，只会重新编译变动的一个文件并重新链接，这就是增量构建。清理产物用 ``cmake --build build --target clean``，输出 ``Cleaning... 2 files.``。

二、构建流程详解
----------------

创建构建目录
~~~~~~~~~~~~

构建目录通常放在源码根目录下，名字约定为 ``build``（可加入 ``.gitignore``）。CMake 会在其中生成构建文件、缓存文件 ``CMakeCache.txt`` 和编译产物：

.. code-block:: text

   demo/
   ├── CMakeLists.txt
   ├── src/
   │   └── main.cpp
   └── build/            # 构建目录（生成）
       ├── CMakeCache.txt
       ├── build.ninja
       ├── CMakeFiles/
       └── demo.exe

生成构建文件
~~~~~~~~~~~~

.. code-block:: bash

   cmake -S . -B build -G Ninja

输出结果类似如下：

.. code-block:: text

   -- The CXX compiler identification is GNU 15.1.0
   -- Detecting CXX compiler ABI info - done
   -- Check for working CXX compiler: C:/Qt/Tools/mingw1510_64/bin/g++.exe - skipped
   -- Detecting CXX compile features - done
   -- Detecting CXX compile ABI features - done
   -- Configuring done (0.7s)
   -- Generating done (0.1s)
   -- Build files have been written to: .../demo/build

``-G`` 选择生成器。不指定时 CMake 会按平台选默认值（Linux 默认 Unix Makefiles，Windows 安装了 VS 时默认 Visual Studio 生成器）。

编译和构建
~~~~~~~~~~

.. code-block:: bash

   cmake --build build

输出结果类似如下：

.. code-block:: text

   [1/2] Building CXX object CMakeFiles/demo.dir/src/main.cpp.obj
   [2/2] Linking CXX executable demo.exe

也可以直接使用生成器对应的原生工具，效果相同：

.. code-block:: bash

   ninja -C build            # Ninja 生成器
   make -C build             # Makefile 生成器
   cmake --build build --config Release   # 多配置生成器（如 Visual Studio）指定配置

并行加速是默认行为；手动控制并发数用 ``-j``：

.. code-block:: bash

   cmake --build build -j 8

清理构建文件
~~~~~~~~~~~~

清理编译产物但保留配置：

.. code-block:: bash

   cmake --build build --target clean

彻底重来则直接删除整个构建目录（这正是 Out-of-source 布局的好处）：

.. code-block:: bash

   rm -rf build              # Windows PowerShell：Remove-Item -Recurse -Force build

重新配置和构建
~~~~~~~~~~~~~~

修改了缓存变量或 ``CMakeLists.txt`` 后，重新运行配置即可；已存在的 ``CMakeCache.txt`` 会保留上次设置：

.. code-block:: bash

   cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
   cmake --build build

.. warning::

   更换生成器（``-G``）时必须使用全新的构建目录，或在删除 ``CMakeCache.txt`` 与 ``CMakeFiles/`` 后再配置，否则 CMake 会直接报错拒绝。

三、生成器与构建系统对比
------------------------

常用生成器分两类：

.. csv-table:: 单配置与多配置生成器
   :header: "类别", "生成器", "构建类型设置方式"

   "单配置", "Ninja、Unix Makefiles、MinGW Makefiles", "配置阶段：-DCMAKE_BUILD_TYPE=Release"
   "多配置", "Visual Studio 17 2022、Ninja Multi-Config、Xcode", "构建阶段：cmake --build build --config Release"

各生成器的典型场景：

.. csv-table:: 构建系统对比
   :header: "生成器", "优点", "典型场景"

   "Ninja", "增量构建快、依赖简单，CMake 官方推荐", "日常开发、CI、Qt Creator 默认"
   "Unix Makefiles", "Linux 生态默认、工具链成熟", "Linux 服务器与开源项目"
   "MinGW Makefiles", "配合 MinGW 编译器", "Windows 上的 GCC 工具链"
   "Visual Studio 17 2022", "生成 .sln/.vcxproj，IDE 调试体验好", "Windows + MSVC 开发"
   "Ninja Multi-Config", "一个构建目录同时容纳 Debug/Release", "需要频繁切换构建类型"

四、常用命令行参数速查
----------------------

.. csv-table::
   :header: "参数", "作用"

   "-S <dir>", "指定源码目录（顶层 CMakeLists.txt 所在目录）"
   "-B <dir>", "指定构建目录"
   "-G <name>", "选择生成器"
   "-D<var>=<value>", "设置缓存变量，如 -DCMAKE_BUILD_TYPE=Release、-DBUILD_TESTS=ON"
   "--build <dir>", "调用底层工具编译"
   "--target <t>", "只构建指定目标，如 --target demo"
   "--config <cfg>", "多配置生成器选择构建类型"
   "--install <dir>", "执行安装规则，配合 --prefix 指定安装前缀"
   "--preset <name>", "使用 CMakePresets.json 中定义的预设"

.. tip::

   顽固的配置问题九成能用 “删掉 build 目录重新来” 解决。构建目录本质是纯缓存，重建没有任何损失。

.. note::

   保持 Out-of-source 构建纪律：不要在源码目录里直接运行 ``cmake .``，否则生成的文件会污染源码树，且老版本下难以清理。
五、练习任务
------------

任务 1：分别使用 ``Ninja`` 与默认生成器各配置一个构建目录，比较生成的文件。

.. code-block:: bash

   cmake -S . -B build-ninja -G Ninja
   cmake -S . -B build-default

任务 2：修改 ``main.cpp`` 后连续执行两次 ``cmake --build build``，观察第二次是否还有编译动作。

任务 3：用 ``cmake --build build --target help`` 查看当前构建系统提供哪些目标。
