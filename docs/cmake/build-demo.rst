CMake 构建实例
==============

.. meta::
   :group: 入门
   :summary: 从零开始完整构建一个“静态库 + 可执行程序”的项目，覆盖配置、编译、运行、清理全过程。

本章把前面学到的命令串起来，从零构建一个带静态库的完整项目。例子虽小，但目录结构、命令与输出都和真实项目一致，可以直接照着做。

一、项目准备
------------

项目结构
~~~~~~~~

.. code-block:: text

   demo-app/
   ├── CMakeLists.txt
   ├── include/
   │   └── math/
   │       └── math.h
   └── src/
       ├── math.cpp
       └── main.cpp

职责划分：``math`` 库提供 ``add`` 函数，``main.cpp`` 调用它。头文件单独放在 ``include`` 目录，源文件放在 ``src`` 目录，这是 CMake 项目的常见布局。

CMakeLists.txt 配置文件
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(demo_app VERSION 1.0.0 LANGUAGES CXX)

   add_library(math STATIC src/math.cpp)
   target_include_directories(math PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)

   add_executable(demo_app src/main.cpp)
   target_link_libraries(demo_app PRIVATE math)

六行配置完成了四件事：声明项目、定义静态库 ``math``、向外暴露头文件目录、把可执行程序链接到库上。

二、源代码文件
--------------

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

   int main() {
       std::cout << "2 + 3 = " << add(2, 3) << std::endl;
       return 0;
   }

三、构建步骤详解
----------------

创建 CMakeLists.txt 文件
~~~~~~~~~~~~~~~~~~~~~~~~

按上面的结构建立目录与文件。Windows 可用资源管理器创建，Linux/macOS：

.. code-block:: bash

   mkdir -p demo-app/include/math demo-app/src
   cd demo-app
   # 按上文内容创建 CMakeLists.txt 与三个源文件

创建构建目录
~~~~~~~~~~~~

在项目根目录下创建独立的构建目录：

.. code-block:: bash

   mkdir build

配置项目
~~~~~~~~

.. code-block:: bash

   cmake -S . -B build -G Ninja

输出结果类似如下：

.. code-block:: text

   -- The CXX compiler identification is GNU 15.1.0
   -- Detecting CXX compiler ABI info - done
   -- Check for working CXX compiler: .../g++.exe - skipped
   -- Detecting CXX compile features - done
   -- Detecting CXX compile ABI features - done
   -- Configuring done (0.8s)
   -- Generating done (0.1s)
   -- Build files have been written to: .../demo-app/build

这一步 CMake 完成了三件事：探测编译器、解析 ``CMakeLists.txt`` 中的目标定义、生成构建文件。若输出以 ``-- Configuring incomplete`` 结尾，按提示修复 ``CMakeLists.txt`` 后重试。

编译项目
~~~~~~~~

.. code-block:: bash

   cmake --build build

输出结果类似如下：

.. code-block:: text

   [1/4] Building CXX object CMakeFiles/math.dir/src/math.cpp.obj
   [2/4] Linking CXX static library libmath.a
   [3/4] Building CXX object CMakeFiles/demo_app.dir/src/main.cpp.obj
   [4/4] Linking CXX executable demo_app.exe

可以看到构建顺序由 CMake 自动推导：先编 ``math`` 库，再编译并链接 ``demo_app``。修改 ``main.cpp`` 后再次执行同一条命令，只会重新编译受影响的文件。

运行可执行文件
~~~~~~~~~~~~~~

.. code-block:: bash

   ./build/demo_app.exe      # Linux/macOS：./build/demo_app

输出结果：

.. code-block:: text

   2 + 3 = 5

清理构建文件
~~~~~~~~~~~~

两种清理方式：

.. code-block:: bash

   # 方式一：清理编译产物，保留配置缓存
   cmake --build build --target clean

   # 方式二：彻底删除整个构建目录
   rm -rf build

清理后重新构建，只需再执行一遍 “配置 + 构建” 两条命令。

四、完整命令流程回顾
--------------------

.. code-block:: bash

   # 一次性走完：配置 → 构建 → 运行
   cmake -S . -B build -G Ninja
   cmake --build build
   ./build/demo_app.exe

   # 指定构建类型重新配置（单配置生成器）
   cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
   cmake --build build

五、注意事项
-----------

* 所有命令都在项目根目录执行；``-S .`` 表示当前目录是源码根目录。
* 配置阶段报错时优先看 **第一段** 错误信息，后面的报错通常是连锁反应。
* 换了编译器或生成器，务必换新的构建目录。
* ``project(demo_app VERSION 1.0.0)`` 记录的版本号可通过 ``${PROJECT_VERSION}`` 在代码和打包配置中使用，建议从一开始就写上。

六、练习任务
------------

任务 1：把 ``math`` 改成动态库，重新配置后观察产物与运行结果的变化。

.. code-block:: cmake

   add_library(math SHARED src/math.cpp)

任务 2：增加一个只包含编译要求的 INTERFACE 库，把公共编译定义挂在它上面。

.. code-block:: cmake

   add_library(project_options INTERFACE)
   target_compile_features(project_options INTERFACE cxx_std_17)
   target_link_libraries(demo_app PRIVATE project_options)

任务 3：补上安装规则，把可执行文件安装到 ``bin``、静态库到 ``lib``、头文件到 ``include``。

.. code-block:: cmake

   include(GNUInstallDirs)
   install(TARGETS demo_app math
       RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
       ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR})
   install(DIRECTORY include/ DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})

任务 4：只构建 ``demo_app`` 目标，并开启 4 个并行任务。

.. code-block:: bash

   cmake --build build --target demo_app -j 4
