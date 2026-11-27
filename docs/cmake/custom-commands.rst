CMake 自定义命令与目标
======================

.. meta::
   :group: 工程化
   :summary: 在构建前后挂钩子、生成源码、注册自定义目标，把代码生成和资源处理纳入构建系统。

真实项目总有构建系统之外的动作：生成版本号头文件、拷贝资源、调用代码生成器、打包后处理。CMake 用 ``add_custom_command`` 与 ``add_custom_target`` 把这些动作纳入依赖图，而不是靠手工脚本。

一、add_custom_target：自定义目标
---------------------------------

自定义目标本质是 “一个可被构建系统调用的命令”，**始终被视为过时**，每次被构建时都会执行：

.. code-block:: cmake

   add_custom_target(print_info
       COMMAND ${CMAKE_COMMAND} -E echo "构建目录: ${CMAKE_BINARY_DIR}"
       COMMAND ${CMAKE_COMMAND} -E echo "编译器: ${CMAKE_CXX_COMPILER}"
       COMMENT "打印构建信息"
       VERBATIM
   )

单独执行：

.. code-block:: bash

   cmake --build build --target print_info

不希望它进入默认构建链时，在 ``ALL`` 关键字上做取舍：不带 ``ALL`` 默认就不参与 ``cmake --build``，需要时 ``--target`` 显式调用；带 ``ALL`` 则每次构建都执行。

二、目标钩子：POST_BUILD / PRE_BUILD / PRE_LINK
-----------------------------------------------

.. code-block:: cmake

   add_executable(demo src/main.cpp)

   # 链接完成后自动执行：把产物复制到 bin 目录
   add_custom_command(TARGET demo POST_BUILD
       COMMAND ${CMAKE_COMMAND} -E make_directory ${CMAKE_BINARY_DIR}/bin
       COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:demo> ${CMAKE_BINARY_DIR}/bin/
       COMMENT "复制产物到 bin/"
       VERBATIM
   )

三种钩子的触发时机：

.. csv-table::
   :header: "钩子", "时机"

   "PRE_BUILD", "目标内第一个源文件编译前（仅 Visual Studio 生成器支持，其他生成器按 PRE_LINK 处理）"
   "PRE_LINK", "编译完成、开始链接之前"
   "POST_BUILD", "链接完成之后，最常用"

``$<TARGET_FILE:demo>`` 这类生成器表达式在这里特别有用：产物路径随平台、配置变化，写死文件名会翻车。

三、构建时生成源码
------------------

另一种形态：``add_custom_command(OUTPUT ...)`` 声明 “这个文件是这样生成的”，CMake 会把它挂进依赖图：

.. code-block:: cmake

   # 生成 build/table.h：把模板复制为构建产物
   add_custom_command(
       OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/table.h
       COMMAND ${CMAKE_COMMAND} -E copy_if_different
               ${CMAKE_CURRENT_SOURCE_DIR}/table.h.in
               ${CMAKE_CURRENT_BINARY_DIR}/table.h
       DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/table.h.in
       COMMENT "生成 table.h"
       VERBATIM
   )

   add_executable(app src/main.cpp ${CMAKE_CURRENT_BINARY_DIR}/table.h)
   target_include_directories(app PRIVATE ${CMAKE_CURRENT_BINARY_DIR})

生成器可以是任意程序：CMake 自带命令、Python 脚本或专门的代码生成器。注意 ``COMMAND`` 不经过 shell，``>`` 这类重定向不会生效，需要写文件的动作应当由生成器本身完成。

关键点：

* ``OUTPUT`` 声明产物路径（应放在构建目录，不要污染源码树）。
* ``DEPENDS`` 声明输入，输入变化时重新生成。
* 生成的文件必须加入某个目标的源文件列表，否则不会执行。

.. warning::

   生成的 ``.c/.cpp`` 源文件需要 ``set_source_files_properties(... PROPERTIES GENERATED TRUE)``，否则某些生成器会在依赖扫描阶段找不到文件而报错。

四、configure_file：模板替换
----------------------------

把版本号、路径等配置信息写进头文件，标准做法是 ``configure_file``：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(cfg-demo VERSION 2.4.1 LANGUAGES CXX)

   configure_file(config.h.in ${CMAKE_CURRENT_BINARY_DIR}/config.h)
   add_executable(cfg-demo src/main.cpp)
   target_include_directories(cfg-demo PRIVATE ${CMAKE_CURRENT_BINARY_DIR})

.. code-block:: cpp

   // config.h.in
   #pragma once
   #define CFG_DEMO_VERSION "@PROJECT_VERSION@"
   #cmakedefine USE_OPENMP

``@VAR@`` 会被 CMake 变量替换；``#cmakedefine USE_OPENMP`` 在变量 ``USE_OPENMP`` 为真时变成 ``#define USE_OPENMP 1``，否则是 ``/* #undef USE_OPENMP */``。

.. code-block:: cpp

   // src/main.cpp
   #include "config.h"
   #include <iostream>

   int main() {
       std::cout << "version: " << CFG_DEMO_VERSION << std::endl;
       return 0;
   }

.. note::

   ``configure_file`` 在配置阶段执行，不参与增量编译的依赖判断之外的时间开销，比 ``add_custom_command`` 生成头文件更轻量，优先选用。

五、完整可构建示例
------------------

把钩子、生成目标、configure_file 组合到一个项目里：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(custom-demo VERSION 1.2.0 LANGUAGES CXX)

   configure_file(config.h.in ${CMAKE_CURRENT_BINARY_DIR}/config.h)

   add_executable(custom-demo src/main.cpp)
   target_include_directories(custom-demo PRIVATE ${CMAKE_CURRENT_BINARY_DIR})

   add_custom_command(TARGET custom-demo POST_BUILD
       COMMAND ${CMAKE_COMMAND} -E echo "post-build: $<TARGET_FILE_NAME:custom-demo> 已就绪"
       VERBATIM
   )

   add_custom_target(show_version
       COMMAND ${CMAKE_COMMAND} -E echo "custom-demo v${PROJECT_VERSION}"
       VERBATIM
   )

.. code-block:: cpp

   // config.h.in
   #pragma once
   #define CUSTOM_DEMO_VERSION "@PROJECT_VERSION@"

.. code-block:: cpp

   // src/main.cpp
   #include "config.h"
   #include <iostream>

   int main() {
       std::cout << "custom-demo " << CUSTOM_DEMO_VERSION << std::endl;
       return 0;
   }

.. code-block:: text

   构建输出（POST_BUILD 钩子部分）：
   ...
   [2/2] Linking CXX executable custom-demo.exe
   post-build: custom-demo.exe 已就绪

六、练习任务
------------

任务 1：注册一个清理产物的目标

.. code-block:: cmake

   add_custom_target(clear_bins
       COMMAND ${CMAKE_COMMAND} -E rm -rf ${CMAKE_BINARY_DIR}/bin
       COMMENT "清理 bin 目录")

任务 2：让构建完成后自动运行测试

.. code-block:: cmake

   add_custom_command(TARGET demo POST_BUILD
       COMMAND ${CMAKE_CTEST_COMMAND} -C $<CONFIG> --output-on-failure
       WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
       VERBATIM)

任务 3：为库生成导出宏头文件

.. code-block:: cmake

   include(GenerateExportHeader)
   add_library(math SHARED src/math.cpp)
   generate_export_header(math)   # 生成 math_export.h，WINDOWS 下控制 dllexport
