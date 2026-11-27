CMake 目标与依赖
================

.. meta::
   :group: 核心概念
   :summary: 可执行文件与各类库的创建方式，别名目标、依赖传播规则与常用目标属性。

Modern CMake 的核心思想是 **以目标为中心**：定义目标、为目标设置属性、声明目标之间的依赖。旧式的全局 ``include_directories``、全局宏定义会把设置扩散到整个目录树，新项目应一律使用 ``add_xxx`` 加 ``target_xxx`` 的组合。

一、可执行目标
--------------

.. code-block:: cmake

   # 三种写法任选其一；这里用不同目标名，避免重复定义
   add_executable(demo src/main.cpp)

   add_executable(app src/main.cpp src/util.cpp)    # 多个源文件

   set(ALL_SOURCES src/main.cpp src/util.cpp)
   add_executable(tool ${ALL_SOURCES})              # 或变量展开

两个常用可选项：

.. code-block:: cmake

   # WIN32：Windows 上构建为 GUI 程序（入口 WinMain，运行不弹控制台）
   add_executable(editor WIN32 src/main.cpp)

   # EXCLUDE_FROM_ALL：不参与默认构建，仅在显式 --target 时构建
   add_executable(tool EXCLUDE_FROM_ALL src/tool.cpp)

二、库目标
----------

.. code-block:: cmake

   # 五种类型任选其一；这里用不同目标名，避免重复定义
   add_library(math_static STATIC src/math.cpp)     # 静态库 .a / .lib
   add_library(math_shared SHARED src/math.cpp)     # 动态库 .so / .dll
   add_library(plugin MODULE src/plugin.cpp)        # 运行时插件，不作为链接目标
   add_library(math_objects OBJECT src/math.cpp)    # 对象库：只编译出 .o，再分发给多个目标
   add_library(headers INTERFACE)                   # 头文件库：只有 INTERFACE 属性

各类型的选择建议：

.. csv-table::
   :header: "类型", "产物", "典型用途"

   "STATIC", "libmath.a / math.lib", "默认选择，发布简单、启动快"
   "SHARED", "libmath.so / math.dll", "多组件独立升级、减小体积"
   "OBJECT", "一组 .obj", "多个目标共享同一批源文件"
   "INTERFACE", "无", "header-only 库或纯配置集合"

不指定类型时由 ``BUILD_SHARED_LIBS`` 缓存变量决定（默认静态）：

.. code-block:: cmake

   option(BUILD_SHARED_LIBS "默认构建动态库" OFF)
   add_library(math src/math.cpp)   # 类型随 BUILD_SHARED_LIBS

三、别名目标
------------

别名是给目标起一个只读的 ``命名空间::名字`` 引用，不允许重复定义，推荐项目内部统一使用别名：

.. code-block:: cmake

   add_library(math STATIC src/math.cpp)
   add_library(demo::math ALIAS math)

   add_executable(app src/main.cpp)
   target_link_libraries(app PRIVATE demo::math)

四、依赖传播：PUBLIC / PRIVATE / INTERFACE
------------------------------------------

``target_link_libraries`` 的可见性关键字决定了依赖是否 “传递” 给下游：

.. csv-table::
   :header: "关键字", "自己用", "传递给链接我的目标"

   "PRIVATE", "链接", "不传递"
   "INTERFACE", "不链接", "传递"
   "PUBLIC", "链接", "传递"

一个真实的反例：静态库 ``math`` 的头文件里用了 Boost 的头文件。若写成 ``PRIVATE``，下游 ``app`` 编译时找不到 Boost 头文件而报错。判断规则不变 —— **头文件出现在公开头文件里就用 PUBLIC**：

.. code-block:: cmake

   add_library(parser STATIC src/parser.cpp)
   target_include_directories(parser PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)
   target_link_libraries(parser PUBLIC Boost::headers)      # 头文件被公开使用
   target_link_libraries(parser PRIVATE ZLIB::ZLIB)         # 只在 .cpp 里用

完整可构建示例：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(propagate LANGUAGES CXX)

   add_library(math STATIC src/math.cpp)
   target_include_directories(math PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)

   add_executable(app src/main.cpp)
   target_link_libraries(app PRIVATE math)   # 自动继承 math 的 PUBLIC include

.. code-block:: cpp

   // include/math/math.h
   #pragma once
   int add(int a, int b);

.. code-block:: cpp

   // src/math.cpp
   #include "math/math.h"
   int add(int a, int b) { return a + b; }

.. code-block:: cpp

   // src/main.cpp
   #include "math/math.h"
   #include <iostream>
   int main() { std::cout << add(20, 22) << std::endl; return 0; }

五、目标属性
------------

``target_xxx`` 命令本质上是在设置目标属性，少量场景直接操作属性更方便：

.. code-block:: cmake

   set_target_properties(demo PROPERTIES
       OUTPUT_NAME "demo-tool"        # 产物文件名
       CXX_STANDARD 17                # C++ 标准
       CXX_EXTENSIONS OFF             # 关闭 GNU 扩展（-std=c++17 而非 gnu++17）
   )

   # 读取属性
   get_target_property(out demo OUTPUT_NAME)

常用属性速查：

.. csv-table::
   :header: "属性", "作用"

   "OUTPUT_NAME", "输出文件名（不含扩展名）"
   "CXX_STANDARD / CXX_EXTENSIONS", "C++ 标准与是否启用扩展"
   "RUNTIME_OUTPUT_DIRECTORY", "可执行文件输出目录"
   "LIBRARY_OUTPUT_DIRECTORY", "动态库输出目录"
   "ARCHIVE_OUTPUT_DIRECTORY", "静态库输出目录"
   "EXCLUDE_FROM_ALL", "是否排除在默认构建之外"
   "VS_DEBUGGER_WORKING_DIRECTORY", "Visual Studio 调试时的工作目录"

六、练习任务
------------

任务 1：把一个静态库改成别名调用

.. code-block:: cmake

   add_library(utils STATIC src/util.cpp)
   add_library(project::utils ALIAS utils)

   add_executable(app src/main.cpp)
   target_link_libraries(app PRIVATE project::utils)

任务 2：验证依赖不传递

.. code-block:: cmake

   add_library(a STATIC a.cpp)
   target_include_directories(a PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/a-include)

   add_library(b STATIC b.cpp)
   target_link_libraries(b PRIVATE a)   # b 能使用 a 的私有 include

   add_executable(c c.cpp)
   target_link_libraries(c PRIVATE b)   # c 不会继承 a 的 include

任务 3：为可执行目标设置输出目录

.. code-block:: cmake

   set_target_properties(demo PROPERTIES
       RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
