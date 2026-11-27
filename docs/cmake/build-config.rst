CMake 编译与构建配置
====================

.. meta::
   :group: 核心概念
   :summary: 构建类型与默认参数、编译选项、C++ 标准与生成器表达式，让目标按需编译。

本章解决 “怎么让代码按我想要的方式编译”：选构建类型、加警告、定标准、按配置切换参数。

一、构建类型
------------

单配置生成器（Ninja、Makefiles）用 ``CMAKE_BUILD_TYPE`` 选择构建类型：

.. code-block:: bash

   cmake -S . -B build -DCMAKE_BUILD_TYPE=Release

.. csv-table:: 四种标准构建类型
   :header: "类型", "含义", "典型用途"

   "Debug", "调试版：含调试信息、无优化", "日常开发与调试"
   "Release", "发布版：完全优化", "正式发布"
   "RelWithDebInfo", "优化 + 调试信息", "需要调试线上问题"
   "MinSizeRel", "最小体积优化", "对体积敏感的发布"

**默认值是空字符串**，既不优化也不带调试信息，通常不是想要的效果。推荐在脚本里给一个默认值：

.. code-block:: cmake

   if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
       set(CMAKE_BUILD_TYPE Release CACHE STRING "构建类型" FORCE)
       set_property(CACHE CMAKE_BUILD_TYPE PROPERTY STRINGS Debug Release RelWithDebInfo MinSizeRel)
   endif()

多配置生成器（Visual Studio、Ninja Multi-Config）在 **构建阶段** 选择，配置阶段设置 ``CMAKE_BUILD_TYPE`` 无效：

.. code-block:: bash

   cmake -S . -B build
   cmake --build build --config Release

二、各构建类型的默认参数
------------------------

CMake 为每种构建类型准备了默认编译参数，按编译器区分：

.. csv-table:: GNU（GCC / Clang）
   :header: "类型", "默认参数"

   "Debug", "-g"
   "Release", "-O3 -DNDEBUG"
   "RelWithDebInfo", "-O2 -g -DNDEBUG"
   "MinSizeRel", "-Os -DNDEBUG"

.. csv-table:: MSVC
   :header: "类型", "默认参数"

   "Debug", "/MDd /Zi /Ob0 /Od /RTC1"
   "Release", "/MD /O2 /Ob2 /DNDEBUG"
   "RelWithDebInfo", "/MD /Zi /O2 /Ob1 /DNDEBUG"
   "MinSizeRel", "/MD /O1 /Ob1 /DNDEBUG"

``NDEBUG`` 会关闭 ``assert`` 断言，Release 下断言不再生效 —— 依赖断言做校验的代码要注意。

三、添加编译选项
----------------

推荐 ``target_compile_options``，只影响指定目标：

.. code-block:: cmake

   if(MSVC)
       target_compile_options(demo PRIVATE /W4)
   else()
       target_compile_options(demo PRIVATE -Wall -Wextra -Wpedantic)
   endif()

需要全局生效时可以追加到语言级变量（在 ``project()`` 之后）：

.. code-block:: cmake

   add_compile_options(-Wall)

按构建类型区分参数，直接追加到对应变量：

.. code-block:: cmake

   string(APPEND CMAKE_CXX_FLAGS_DEBUG " -fno-omit-frame-pointer")

四、C++ 标准
------------

三种设置方式，前两种最常用：

.. code-block:: cmake

   # 方式一：全局变量（目标未单独设置时生效）
   set(CMAKE_CXX_STANDARD 17)
   set(CMAKE_CXX_STANDARD_REQUIRED ON)   # 不达标直接报错而不是降级
   set(CMAKE_CXX_EXTENSIONS OFF)         # 用 -std=c++17 而非 gnu++17

   # 方式二：目标属性
   set_target_properties(demo PROPERTIES CXX_STANDARD 20)

   # 方式三：按特性声明（推荐用于库，精确表达需要哪个标准）
   target_compile_features(demo PRIVATE cxx_std_17)

.. csv-table::
   :header: "写法", "优点", "适用"

   "CMAKE_CXX_STANDARD", "一行搞定全局", "应用程序"
   "target_compile_features(cxx_std_17)", "随 target 传递，多标准并存", "库项目"

五、生成器表达式
----------------

生成器表达式形如 ``$<...>``，在 **构建阶段** 才求值，可以按配置、平台、目标动态取值：

.. code-block:: cmake

   # 仅 Debug 构建时加参数（多个参数用分号分隔）
   target_compile_options(demo PRIVATE
       $<$<CONFIG:Debug>:-O0;-g3;-fno-omit-frame-pointer>
   )

   # 按编译器区分
   target_compile_options(demo PRIVATE
       $<$<CXX_COMPILER_ID:MSVC>:/W4>
       $<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall;-Wextra>
   )

   # 安装/导出与本地构建使用不同路径
   target_include_directories(demo
       PUBLIC $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
   )

常用形式速查：

.. csv-table::
   :header: "表达式", "含义"

   "$<CONFIG:Debug>", "当前配置是否为 Debug"
   "$<PLATFORM_ID:Windows>", "平台判断"
   "$<CXX_COMPILER_ID:MSVC>", "编译器判断"
   "$<TARGET_FILE:demo>", "目标产物完整路径（可执行文件/库）"
   "$<TARGET_FILE_DIR:demo>", "目标产物所在目录"
   "$<BUILD_INTERFACE:...>", "本地构建时生效，安装导出时剔除"
   "$<INSTALL_INTERFACE:...>", "安装导出后生效"

六、把配置变严的常用组合
------------------------

新项目可以直接采用这套基线：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(quality LANGUAGES CXX)

   set(CMAKE_CXX_STANDARD 17)
   set(CMAKE_CXX_STANDARD_REQUIRED ON)
   set(CMAKE_CXX_EXTENSIONS OFF)

   add_executable(quality src/main.cpp)

   if(MSVC)
       target_compile_options(quality PRIVATE /W4 /permissive-)
   else()
       target_compile_options(quality PRIVATE -Wall -Wextra -Wpedantic)
       target_compile_options(quality PRIVATE $<$<CONFIG:Debug>:-O0;-g3>)
   endif()

.. code-block:: cpp

   // src/main.cpp
   #include <iostream>

   int main() {
       int sum = 0;
       for (int i = 1; i <= 100; ++i) sum += i;
       std::cout << "1+...+100 = " << sum << std::endl;
       return 0;
   }

七、练习任务
------------

任务 1：给项目加默认构建类型，并验证三种取值

.. code-block:: bash

   cmake -S . -B build-debug -DCMAKE_BUILD_TYPE=Debug
   cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release
   cmake --build build-debug
   cmake --build build-release

任务 2：用生成器表达式给 Debug 加 ``-DVERBOSE_LOGGING``

.. code-block:: cmake

   target_compile_definitions(demo PRIVATE
       $<$<CONFIG:Debug>:VERBOSE_LOGGING>)

任务 3：把 C++ 标准提升到 20 并禁止扩展

.. code-block:: cmake

   set_target_properties(demo PROPERTIES CXX_STANDARD 20 CXX_EXTENSIONS OFF)
