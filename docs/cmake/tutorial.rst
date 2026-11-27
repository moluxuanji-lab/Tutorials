CMake 教程
==========

.. meta::
   :group: 入门
   :summary: 认识 CMake 的定位与核心思想：它不直接编译代码，而是为各平台生成统一的构建系统。

CMake 是一个开源的跨平台自动化构建系统，用来管理软件构建的过程。它不依赖于某个特定编译器，可以支持多层目录、多个应用程序与多个函数库，是目前 C/C++ 生态事实上的构建标准 —— Qt、LLVM、OpenCV、VTK 等知名项目都使用 CMake 组织构建。

CMake 通过一份简单的配置文件 ``CMakeLists.txt``，自动生成不同平台的构建文件（如 Makefile、Ninja 构建文件、Visual Studio 工程文件等），简化项目的编译和构建过程。

需要特别理解的一点是：**CMake 本身不是构建工具，而是“生成构建系统的工具”**。它生成的构建系统可以使用不同的编译器和工具链，真正编译代码的是 Make、Ninja 或 MSBuild 这些底层工具。

CMake 的作用和优势
------------------

* **跨平台支持**：支持多种操作系统和编译器，同一份构建配置可以在不同环境中使用。
* **简化配置**：通过 ``CMakeLists.txt`` 定义项目结构、依赖项、编译选项等，无需手写复杂的构建脚本。
* **自动化构建**：能够自动检测系统上的编译器、库和工具，减少手动配置的工作量。
* **灵活性**：支持 Debug、Release 等多种构建类型，允许自定义构建选项和模块。

构建配置
--------

**CMakeLists.txt 文件**

``CMakeLists.txt`` 是 CMake 的配置文件，用于定义项目的构建规则、依赖关系、编译选项等。每个 CMake 项目通常包含一个或多个 ``CMakeLists.txt`` 文件：顶层目录一个，每个子目录也可以有自己的一个。

**构建目录**

为了保持源代码的整洁，CMake 鼓励使用独立的构建目录（Out-of-source 构建），让构建生成的文件与源代码分开存放。构建目录可以随时整个删掉重建，源代码目录始终保持干净。

基本工作流程
------------

1. **编写 CMakeLists.txt 文件**：定义项目的构建规则和依赖关系。
2. **生成构建文件**：运行 ``cmake`` 命令，生成适合当前平台的构建系统文件（例如 Makefile、Visual Studio 工程文件）。
3. **执行构建**：使用生成的构建系统（如 ``make``、``ninja``、``msbuild``）或统一的 ``cmake --build`` 命令来编译项目。

可以用一个简化的流程图表示：

.. code-block:: text

   CMakeLists.txt
        │
        │  cmake -S . -B build        （配置 + 生成）
        ▼
   build/  ← 构建系统文件（build.ninja / Makefile / .sln …）
        │
        │  cmake --build build        （编译 + 链接）
        ▼
   可执行文件 / 库文件

五分钟体验：第一个 CMake 工程
------------------------------

新建目录 ``hello``，放入两个文件：

.. code-block:: text

   hello/
   ├── CMakeLists.txt
   └── src/
       └── main.cpp

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

在 ``hello`` 目录配置并构建（未安装 Ninja 时可以省略 ``-G Ninja``，让 CMake 选择平台默认生成器）：

.. code-block:: bash

   cmake -S . -B build -G Ninja
   cmake --build build

输出结果类似如下：

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

运行程序：

.. code-block:: bash

   ./build/hello.exe      # Linux/macOS：./build/hello

输出结果：

.. code-block:: text

   Hello, CMake!

到这里，一个可跨平台构建的最小工程就跑起来了。后面各章会逐步解释每条命令的含义，并加入库、依赖、安装与测试。

发展简史
--------

CMake 由 Kitware 公司在 1999 年开始开发，最初是为美国国家医学图书馆资助的 ITK 医学图像项目解决跨平台构建问题，2000 年首次公开发布。名字里的 “C” 代表 “cross-platform”（跨平台）。

.. csv-table:: CMake 版本演进
   :header: "时间", "版本", "关键里程碑"

   "1999 - 2000", "CMake 诞生", "Kitware 为 ITK 项目开发，2000 年首次发布"
   "2014-06", "CMake 3.0", "“Modern CMake” 时代的起点，以目标（target）为中心的用法开始普及"
   "2019-11", "CMake 3.16", "支持预编译头、按目标控制 C++ 标准的用法成熟"
   "2021-03", "CMake 3.20", "预设格式 v2，新增 buildPresets、testPresets"
   "2022-11", "CMake 3.25", "预设格式 v6，新增 packagePresets 与 workflowPresets"
   "2025-03", "CMake 4.0", "移除对 CMake 3.5 以下版本的兼容，旧工程需要更新最低版本声明"
   "2026", "CMake 4.5 系列", "新增 add_custom_rule()、SBOM 安装支持等特性"

CMake 采用宽松的 BSD-3-Clause 许可证发布，个人与商业项目都可以自由使用。

CMake 与手写 Makefile 对比
--------------------------

.. csv-table:: CMake vs. 手写 Makefile
   :header: "对比项", "CMake", "手写 Makefile"

   "跨平台", "一份配置适配 Windows / Linux / macOS", "通常只针对一类环境"
   "编译器选择", "自动探测 GCC / Clang / MSVC 并生成对应参数", "需要自己为每个编译器写规则"
   "依赖探测", "find_package 自动查找库和头文件", "手动维护 -I、-L、-l 参数"
   "IDE 集成", "可生成 Visual Studio、Xcode、CLion 等工程", "需要额外转换"
   "子目录支持", "add_subdirectory 天然支持多层目录", "需要手工递归 include"
   "可读性", "声明式描述“有哪些目标”", "描述“如何一步步编译”"

.. note::

   CMake 并不能完全替代对构建过程的理解。遇到链接错误、头文件找不到这类问题时，仍然需要 C/C++ 编译链接的基础知识来定位原因。

练习任务
--------

任务 1：把 ``hello`` 工程的可执行文件名改成 ``hello-cmake``，重新配置并构建。

.. code-block:: cmake

   add_executable(hello-cmake src/main.cpp)

任务 2：给 ``project()`` 加上版本号，并在程序启动时打印版本宏。

.. code-block:: cmake

   project(hello VERSION 1.0.0 LANGUAGES CXX)

   add_executable(hello src/main.cpp)
   target_compile_definitions(hello PRIVATE HELLO_VERSION="${PROJECT_VERSION}")

任务 3：不使用 ``-G Ninja`` 重新配置一个新构建目录，比较 CMake 选择的默认生成器。

.. code-block:: bash

   cmake -S . -B build-default

相关链接
--------

* CMake 官网：`https://cmake.org <https://cmake.org/>`_
* 官方教程：`CMake 官方 Tutorial <https://cmake.org/cmake/help/latest/guide/tutorial/index.html>`_
* 官方文档：`https://cmake.org/cmake/help/latest <https://cmake.org/cmake/help/latest/>`_
* 源码仓库：`https://github.com/Kitware/CMake <https://github.com/Kitware/CMake>`_
