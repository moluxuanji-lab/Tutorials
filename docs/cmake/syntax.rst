CMake 语法基础
==============

.. meta::
   :group: 核心概念
   :summary: 命令调用、参数类型、变量引用、列表、条件、循环、函数与宏，读懂并写好 CMakeLists.txt。

CMakeLists.txt 由一条条命令组成，语法接近 Shell 又有自己的约定。本章把语言层面的规则一次讲清，让你能读懂任何开源项目的 CMakeLists.txt。

一、命令调用
------------

命令是 CMake 语言的基本单元，形式为 ``命令名(参数...)``：

.. code-block:: cmake

   # 参数之间用空格分隔
   add_executable(demo src/main.cpp src/util.cpp)

   # 一条命令可以跨多行，括号闭合才算结束
   target_link_libraries(demo
       PRIVATE
           math
           Threads::Threads
   )

命令名不区分大小写（``SET`` 与 ``set`` 等价），但社区惯例统一使用小写。

二、注释
--------

``#`` 到行尾是行注释；较长的说明块可以使用括号注释：

.. code-block:: cmake

   # 行注释：说明这一条命令的用途
   set(BUILD_TESTS ON)

   #[[ 括号注释
      可以跨越多行，
      内部的 # 也不会提前结束注释 ]]

三、参数类型
------------

.. csv-table::
   :header: "类型", "写法", "说明"

   "不带引号", "set(V demo)", "以空格分词；内容会被当作变量展开"
   "带引号", "set(V \"demo\")", "整体为一个参数；推荐对含空格、路径的值使用"
   "方括号", "set(V [[raw text]])", "原样保留，不展开转义，适合正则、JSON 片段"

带引号与不带引号的展开行为不同：

.. code-block:: cmake

   set(NAME world)
   message("hello ${NAME}")   # 输出 hello world
   message(hello ${NAME})     # 输出 helloworld（多个参数直接拼接）

   set(LIST a b c)
   message("count: ${LIST}")  # 输出 count:a;b;c（带引号保持一个参数）
   message(count: ${LIST})    # 展开 3 个参数，直接拼接为 count:abc

.. note::

   路径类、字符串类参数务必加引号，否则 Windows 路径中的反斜杠和空格会引起解析问题。

四、变量引用与转义
------------------

``${VAR}`` 引用变量，``$ENV{VAR}`` 引用环境变量。未定义变量展开为空字符串且默认不报警告。

.. code-block:: cmake

   set(COMPILER_FLAGS "-Wall")
   message(STATUS "flags = ${COMPILER_FLAGS}")

字符串中需要输出字面 ``${}`` 时用 ``\${}`` 转义：

.. code-block:: cmake

   message(STATUS "引用变量的写法是 \${VAR}")

五、列表
--------

CMake 没有独立的数组类型，列表就是 **以分号分隔的字符串**：

.. code-block:: cmake

   set(SOURCES src/main.cpp src/math.cpp)
   list(LENGTH SOURCES len)          # 2
   list(GET SOURCES 0 first)         # src/main.cpp
   list(APPEND SOURCES src/util.cpp) # 追加元素

   foreach(src IN LISTS SOURCES)
       message(STATUS "源文件: ${src}")
   endforeach()

遍历推荐 ``foreach(... IN LISTS ...)``，它按元素迭代，不会受分号展开影响。

六、条件判断
------------

if / elseif / else
~~~~~~~~~~~~~~~~~~

.. code-block:: cmake

   if(CMAKE_BUILD_TYPE STREQUAL "Debug")
       message(STATUS "调试构建")
   elseif(WIN32)
       message(STATUS "Windows 平台")
   else()
       message(STATUS "其他")
   endif()

常用条件运算：

.. csv-table::
   :header: "运算", "写法", "说明"

   "相等", "if(VAR STREQUAL \"值\")", "字符串比较，区分大小写"
   "数值比较", "if(N LESS 10)", "LESS / GREATER / EQUAL"
   "版本比较", "if(V VERSION_LESS 3.20)", "按版本号逐段比较"
   "布尔", "if(VAR)", "ON/1/TRUE/Y 等为真；OFF/0/空为假"
   "未定义", "if(NOT DEFINED VAR)", "判断变量是否已定义"
   "存在性", "if(EXISTS ${p})", "文件或目录是否存在"
   "正则", "if(V MATCHES \"^CMake\")", "匹配正则表达式"
   "列表包含", "if(x IN LIST SOURCES)", "元素是否在列表中"

条件中直接写变量名（不带 ``${}``）是 CMake 的特例，``if(MSVC)`` 判断的就是名为 ``MSVC`` 的变量。

七、循环
--------

.. code-block:: cmake

   set(i 0)
   while(i LESS 3)
       math(EXPR i "${i} + 1")
   endwhile()

   foreach(n RANGE 1 5)
       message(STATUS "n = ${n}")
   endforeach()

``foreach`` 支持的迭代形式：

.. csv-table::
   :header: "形式", "示例"

   "枚举值", "foreach(x a b c)"
   "范围", "foreach(n RANGE 0 10 2)"
   "列表变量", "foreach(src IN LISTS SOURCES)"
   "多项遍历", "foreach(name ver IN ZIP_LISTS names versions)"

``break()`` 与 ``continue()`` 在两种循环中都可以使用。

八、函数与宏
------------

.. code-block:: cmake

   # 定义：参数按位置传入，${name} 之外还有 ${ARGC}、${ARGV}、${ARGN}
   function(add_demo_target name)
       add_executable(${name} ${ARGN})
       message(STATUS "已添加目标 ${name}，源文件: ${ARGN}")
   endfunction()

   # 调用与普通命令相同
   add_demo_target(hello src/main.cpp)

函数与宏的区别：

.. csv-table::
   :header: "特性", "function", "macro"

   "作用域", "独立作用域，内部 set 不影响外部", "文本替换，直接操作调用者作用域"
   "回溯报错", "报错位置指向函数内部", "报错位置指向调用处"
   "推荐度", "推荐", "仅用于生成重复代码片段"

函数内要向外部输出变量时使用 ``set(VAR value PARENT_SCOPE)``。

九、作用域
----------

* **目录作用域**：每个 ``CMakeLists.txt`` 及 ``add_subdirectory`` 进入的子目录都有独立变量空间，子目录继承父目录变量的副本。
* **函数作用域**：``function`` 内的新变量都是局部的。
* **缓存作用域**：``CACHE`` 变量全局唯一，写入 ``CMakeCache.txt``。

.. code-block:: cmake

   set(top "parent")
   function(show)
       set(top "inside")          # 只在函数内生效
       message(STATUS "函数内: ${top}")
   endfunction()
   show()
   message(STATUS "函数外: ${top}")   # 仍是 parent

十、练习任务
------------

任务 1：写一个脚本验证列表操作

.. code-block:: cmake

   # list-demo.cmake —— 使用 cmake -P list-demo.cmake 运行
   set(items alpha beta gamma)
   list(APPEND items delta)
   list(REMOVE_ITEM items beta)
   foreach(x IN LISTS items)
       message(STATUS "item = ${x}")
   endforeach()

任务 2：用函数封装一个打印目标信息的命令

.. code-block:: cmake

   function(log_target name)
       if(TARGET ${name})
           message(STATUS "目标 ${name} 已定义")
       else()
           message(WARNING "目标 ${name} 不存在")
       endif()
   endfunction()

任务 3：判断构建类型并输出对应信息

.. code-block:: cmake

   if(CMAKE_BUILD_TYPE MATCHES "Debug")
       message(STATUS "当前是调试模式")
   else()
       message(STATUS "当前是 ${CMAKE_BUILD_TYPE} 模式")
   endif()
