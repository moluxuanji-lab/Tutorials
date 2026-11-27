CMake 安装与导出
================

.. meta::
   :group: 工程化
   :summary: install() 规则、GNUInstallDirs 标准目录、cmake --install 的用法，以及把库导出给他人使用。

构建出可执行文件和库只是第一步，交付时还要把它们放进规范的目录结构。CMake 用 ``install()`` 声明安装规则，用 ``install(EXPORT)`` 把库的 “使用说明书” 一起交出去。

一、基本安装规则
----------------

.. code-block:: cmake

   # 安装目标产物
   install(TARGETS demo math
       RUNTIME DESTINATION bin        # 可执行文件
       LIBRARY DESTINATION lib        # 动态库
       ARCHIVE DESTINATION lib        # 静态库
   )

   # 安装单个文件
   install(FILES README.md DESTINATION share/doc)

   # 安装整个目录（保留相对结构）
   install(DIRECTORY include/ DESTINATION include)

   # 安装脚本并赋予执行权限
   install(PROGRAMS tools/convert.py DESTINATION bin)

注意 ``include/`` 结尾的斜杠：带斜杠表示 “安装目录 **内容** 到目标路径”（得到 ``include/math.h``），不带斜杠则会得到 ``include/include/math.h``。

二、使用标准目录变量
--------------------

各平台惯例不同（Windows 库放 ``lib``、64 位 Linux 可能放 ``lib64``）。GNUInstallDirs 模块提供了跨平台的规范变量：

.. code-block:: cmake

   include(GNUInstallDirs)

   install(TARGETS demo math
       RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
       LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
       ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
   )
   install(DIRECTORY include/ DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})

.. csv-table:: GNUInstallDirs 常用变量
   :header: "变量", "Linux/macOS 默认", "Windows 默认"

   "CMAKE_INSTALL_BINDIR", "bin", "bin"
   "CMAKE_INSTALL_LIBDIR", "lib（部分 64 位为 lib64）", "lib"
   "CMAKE_INSTALL_INCLUDEDIR", "include", "include"
   "CMAKE_INSTALL_DATADIR", "share", "share"
   "CMAKE_INSTALL_MANDIR", "share/man", "man"

三、执行安装
------------

安装前缀 ``CMAKE_INSTALL_PREFIX`` 决定根目录，默认值在 Windows 是 ``C:/Program Files/<项目名>``（32 位生成器为 ``C:/Program Files (x86)/<项目名>``），Linux/macOS 是 ``/usr/local``。开发期推荐安装到项目目录验证：

.. code-block:: bash

   cmake --install build --prefix build/_stage

输出结果类似如下：

.. code-block:: text

   -- Install configuration: ""
   -- Installing: .../build/_stage/bin/demo.exe
   -- Installing: .../build/_stage/lib/libmath.a
   -- Installing: .../build/_stage/include/math/math.h

也可以在配置阶段直接固定前缀：

.. code-block:: bash

   cmake -S . -B build -DCMAKE_INSTALL_PREFIX=/opt/demo
   cmake --install build

.. note::

   CMake 4.5 起，安装脚本执行失败会让 ``cmake --install`` 返回非零退出码，便于 CI 及时发现。

四、完整可构建示例
------------------

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(install-demo VERSION 1.0 LANGUAGES CXX)

   include(GNUInstallDirs)

   add_library(math STATIC src/math.cpp)
   target_include_directories(math PUBLIC
       $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
       $<INSTALL_INTERFACE:include>
   )

   add_executable(demo src/main.cpp)
   target_link_libraries(demo PRIVATE math)

   install(TARGETS demo math
       RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
       ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
   )
   install(DIRECTORY include/ DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})

``$<INSTALL_INTERFACE:include>`` 的含义：本地构建使用源码树的头文件；安装给别人用之后，头文件相对安装前缀的 ``include``。

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
   int main() { std::cout << add(6, 7) << std::endl; return 0; }

五、导出目标给其他项目使用
--------------------------

``install(EXPORT)`` 会把目标的依赖信息写成一组 ``*.cmake`` 文件，其他项目 ``find_package`` 一下就能用：

.. code-block:: cmake

   # 在上例基础上追加
   install(TARGETS math EXPORT mathTargets
       ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
   )

   install(EXPORT mathTargets
       FILE mathTargets.cmake
       NAMESPACE math::
       DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/math
   )

使用者侧的体验：

.. code-block:: cmake

   find_package(math CONFIG REQUIRED
       PATHS /opt/demo/lib/cmake/math)
   target_link_libraries(app PRIVATE math::math)

工业级发布还需要 ``Config.cmake.in``、版本文件和 ``export(PACKAGE)``，可参考 CMake 官方教程 “Installing and Testing” 一章，此处了解机制即可。

六、练习任务
------------

任务 1：把上一章的 math 库补上安装规则并安装到临时目录

.. code-block:: bash

   cmake -S . -B build
   cmake --build build
   cmake --install build --prefix build/_stage
   # 检查 build/_stage 下是否出现 bin、lib、include 结构

任务 2：验证 DESTINATION 路径斜杠的差别

.. code-block:: cmake

   install(DIRECTORY include/ DESTINATION include)      # 得到 include/math/math.h
   install(DIRECTORY include  DESTINATION install-demo) # 得到 install-demo/include/math/math.h

任务 3：为安装产物加上版本信息

.. code-block:: cmake

   install(FILES $<TARGET_FILE:demo> DESTINATION bin RENAME demo-${PROJECT_VERSION}.exe)
