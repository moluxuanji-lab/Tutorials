CMake 自定义模块与脚本
======================

.. meta::
   :group: 工程化
   :summary: 用 include() 复用 .cmake 模块，封装函数库，并用 FetchContent 引入源码依赖。

当 ``CMakeLists.txt`` 开始变得臃肿，就该把逻辑拆进 ``.cmake`` 模块了。模块让构建逻辑像代码一样可组织、可测试、可复用。

一、include() 与 CMAKE_MODULE_PATH
----------------------------------

``include(<文件>)`` 在当前位置执行一段 CMake 代码，两个来源：

.. code-block:: cmake

   # 1. CMake 自带模块（不写路径）
   include(GNUInstallDirs)      # 实际执行 Modules/GNUInstallDirs.cmake

   # 2. 项目自己的模块：先注册搜索路径，再按名字引入
   list(APPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/cmake)
   include(MyUtils)             # 执行 cmake/MyUtils.cmake

标准的工程目录结构：

.. code-block:: text

   project/
   ├── CMakeLists.txt
   ├── cmake/
   │   ├── MyUtils.cmake       # 通用函数
   │   └── FindFoo.cmake       # 自写的第三方查找模块
   └── src/

``cmake/FindFoo.cmake`` 命名遵循 ``Find<包名>.cmake`` 约定后，``find_package(Foo)`` 也会自动到 ``CMAKE_MODULE_PATH`` 里找到它。

二、编写自己的模块
------------------

一个规范的模块包含 **包含守卫、函数、文档注释**：

.. code-block:: cmake

   # cmake/MyUtils.cmake
   include_guard(GLOBAL)                       # 防止被重复 include

   # 添加项目内常用警告选项
   function(my_set_warnings target)
       if(MSVC)
           target_compile_options(${target} PRIVATE /W4)
       else()
           target_compile_options(${target} PRIVATE -Wall -Wextra)
       endif()
   endfunction()

   # 统计并打印源文件数量
   macro(my_report_sources name)
       list(LENGTH ${name} _n)
       message(STATUS "${name}: ${_n} 个源文件")
   endmacro()

使用：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(module-demo LANGUAGES CXX)

   list(APPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/cmake)
   include(MyUtils)

   add_executable(module-demo src/main.cpp)
   my_set_warnings(module-demo)

.. code-block:: cpp

   // src/main.cpp
   #include <iostream>
   int main() { std::cout << "module demo" << std::endl; return 0; }

三、function 与 macro 的选择
----------------------------

规则很简单：**默认用 function**，只有需要 “就地修改变量” 时才用 macro。macro 是文本替换，内部变量会泄漏到调用方，容易踩坑：

.. code-block:: cmake

   macro(leaky)
       set(x "changed")     # 直接改掉调用者的 x
   endmacro()

   function(clean)
       set(x "local")       # 函数内局部变量
       set(x "changed" PARENT_SCOPE)   # 明确传出去
   endfunction()

四、脚本模式
------------

``.cmake`` 文件还能脱离项目、以脚本方式直接执行，适合写构建辅助工具：

.. code-block:: cmake

   # cmake/collect_stats.cmake
   file(GLOB_RECURSE headers ${SRC_DIR}/*.h)
   list(LENGTH headers n)
   message(STATUS "${SRC_DIR} 共有 ${n} 个头文件")

.. code-block:: bash

   cmake -DSRC_DIR=src -P cmake/collect_stats.cmake      # -P 进入脚本模式

脚本模式里没有 project()、目标概念，能用的主要是 ``file``、``string``、``list``、``execute_process`` 等通用命令。

五、FetchContent：引入源码依赖
------------------------------

不想依赖系统安装的库时，``FetchContent`` 在配置阶段把第三方源码拉进构建图：

.. code-block:: cmake

   include(FetchContent)
   FetchContent_Declare(
       fmt
       GIT_REPOSITORY https://github.com/fmtlib/fmt.git
       GIT_TAG        11.1.4
   )
   FetchContent_MakeAvailable(fmt)

   add_executable(demo src/main.cpp)
   target_link_libraries(demo PRIVATE fmt::fmt)

首次配置需要联网，之后源码缓存在 ``build/_deps``。团队协作建议锁定版本并考虑用 ``FETCHCONTENT_SOURCE_DIR_<名字>`` 指向本地镜像。

.. warning::

   ``FetchContent`` 会让配置阶段变慢且依赖网络。稳定的第三方库优先 ``find_package``，仅 “小而纯源码” 的依赖适合 FetchContent。

六、练习任务
------------

任务 1：把常用编译选项封装成模块函数

.. code-block:: cmake

   # cmake/MyFlags.cmake
   include_guard(GLOBAL)
   function(my_default_flags target)
       target_compile_features(${target} PRIVATE cxx_std_17)
       if(NOT MSVC)
           target_compile_options(${target} PRIVATE -Wall -Wextra)
       endif()
   endfunction()

任务 2：写一个脚本模式工具，统计源码行数

.. code-block:: cmake

   # cmake/loc.cmake
   file(GLOB_RECURSE files ${SRC_DIR}/*.cpp ${SRC_DIR}/*.h)
   set(total 0)
   foreach(f IN LISTS files)
       file(READ ${f} content)
       string(REGEX MATCHALL "[^\n]+" lines "${content}")
       list(LENGTH lines n)
       math(EXPR total "${total} + ${n}")
   endforeach()
   message(STATUS "总行数: ${total}")

任务 3：用 configure_file + 模块函数输出项目信息

.. code-block:: cmake

   include(MyUtils)
   my_set_warnings(app)
   message(STATUS "项目 ${PROJECT_NAME} v${PROJECT_VERSION}")
