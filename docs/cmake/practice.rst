CMake 实战练习
==============

.. meta::
   :group: 工程化
   :summary: 从零搭建一个包含静态库、主程序、单元测试、自定义命令和安装规则的中等复杂度 C++ 项目，完整走一遍配置、构建、测试与安装流程。

前面的章节分别讲解了语法、目标、依赖、安装与测试。这一章把知识串起来，做一个结构接近真实工程的项目：数学库提供加法与乘法，主程序调用库函数，测试程序验证结果，构建完成后自动打印产物信息，最后把可执行文件和库安装到标准目录。

本章所有代码都可以直接复制运行。示例使用 CMake 3.16+ 与任意支持 C++17 的编译器，在 Windows + MinGW 和 Linux + GCC 下都验证过。

一、项目目标
------------

最终项目具备以下能力：

* 用 ``add_subdirectory`` 管理 ``src`` 与 ``tests`` 两个子目录。
* 把公共函数封装成静态库 ``mylib``，头文件通过 ``PUBLIC`` 传播给使用者。
* 用自定义模块统一警告选项，避免在每个目标上重复写编译参数。
* 用 CTest 注册并运行单元测试。
* 用 ``install()`` 把程序、库和头文件安装到规范目录。

二、目录结构
------------

.. code-block:: text

   MyProject/
   ├── CMakeLists.txt              # 根配置：项目信息、模块路径、子目录
   ├── cmake/
   │   └── ProjectWarnings.cmake   # 自定义模块：统一警告选项
   ├── src/
   │   ├── CMakeLists.txt          # 库与主程序
   │   ├── include/
   │   │   └── mylib.h             # 公共头文件
   │   ├── lib/
   │   │   ├── math_add.cpp
   │   │   └── math_mul.cpp
   │   └── main.cpp
   └── tests/
       ├── CMakeLists.txt          # 测试目标
       └── test_main.cpp

源码目录与构建目录分离（Out-of-source）：构建产物全部放进 ``build/``，源码树始终保持干净。

三、根目录 CMakeLists.txt
-------------------------

根配置负责项目级信息、C++ 标准和子目录编排：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(MyProject VERSION 1.0.0 LANGUAGES CXX)

   set(CMAKE_CXX_STANDARD 17)
   set(CMAKE_CXX_STANDARD_REQUIRED ON)
   set(CMAKE_CXX_EXTENSIONS OFF)

   list(APPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_SOURCE_DIR}/cmake)
   include(ProjectWarnings)

   enable_testing()

   add_subdirectory(src)
   add_subdirectory(tests)

   install(TARGETS myapp mylib
       RUNTIME DESTINATION bin
       ARCHIVE DESTINATION lib)
   install(DIRECTORY src/include/ DESTINATION include)

这里有三处关键点：

* ``CMAKE_CXX_STANDARD`` 等变量必须在 ``add_subdirectory`` 之前设置，子目录才能继承。
* ``CMAKE_MODULE_PATH`` 指向 ``cmake/`` 后，``include(ProjectWarnings)`` 才能按名字找到模块。
* ``enable_testing()`` 必须在根目录调用，CTest 才会扫描子目录中注册的测试。

四、自定义模块
--------------

``cmake/ProjectWarnings.cmake`` 定义一个函数，按编译器类型追加警告选项：

.. code-block:: cmake

   # cmake/ProjectWarnings.cmake
   include_guard(GLOBAL)

   function(project_set_warnings target)
       if(MSVC)
           target_compile_options(${target} PRIVATE /W4)
       else()
           target_compile_options(${target} PRIVATE -Wall -Wextra)
       endif()
   endfunction()

``include_guard(GLOBAL)`` 防止模块被重复包含；函数内部用 ``${target}`` 接收目标名，调用方只需写 ``project_set_warnings(mylib)``。

五、数学库
----------

公共头文件声明两个函数：

.. code-block:: cpp

   // src/include/mylib.h
   #pragma once

   int add(int a, int b);
   int mul(int a, int b);

两个实现文件分别提供加法与乘法：

.. code-block:: cpp

   // src/lib/math_add.cpp
   #include "mylib.h"

   int add(int a, int b) {
       return a + b;
   }

.. code-block:: cpp

   // src/lib/math_mul.cpp
   #include "mylib.h"

   int mul(int a, int b) {
       return a * b;
   }

``src/CMakeLists.txt`` 把两个源文件编译成静态库，并把 ``include`` 目录以 ``PUBLIC`` 方式暴露：

.. code-block:: cmake

   # src/CMakeLists.txt
   add_library(mylib STATIC lib/math_add.cpp lib/math_mul.cpp)
   target_include_directories(mylib PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)
   project_set_warnings(mylib)

   add_executable(myapp main.cpp)
   target_link_libraries(myapp PRIVATE mylib)
   project_set_warnings(myapp)

   add_custom_command(TARGET myapp POST_BUILD
       COMMAND ${CMAKE_COMMAND} -E echo "built: $<TARGET_FILE_NAME:myapp>"
       VERBATIM)

``mylib`` 的 include 目录是 ``PUBLIC``，因此 ``myapp`` 链接它之后可以直接 ``#include "mylib.h"``，不需要再写 ``target_include_directories``。``POST_BUILD`` 钩子在链接完成后打印产物文件名，演示自定义命令的用法。

六、主程序
----------

.. code-block:: cpp

   // src/main.cpp
   #include "mylib.h"
   #include <iostream>

   int main() {
       std::cout << "add(2, 3) = " << add(2, 3) << std::endl;
       std::cout << "mul(4, 5) = " << mul(4, 5) << std::endl;
       return 0;
   }

七、单元测试
------------

测试程序不依赖第三方测试框架，用简单的宏统计断言失败数：

.. code-block:: cpp

   // tests/test_main.cpp
   #include "mylib.h"
   #include <iostream>

   static int failures = 0;

   #define CHECK_EQ(actual, expected)                                        \
       do {                                                                  \
           if ((actual) != (expected)) {                                     \
               std::cerr << "FAIL: " << #actual << " = " << (actual)         \
                         << " != " << (expected) << std::endl;               \
               ++failures;                                                   \
           }                                                                 \
       } while (0)

   int main() {
       CHECK_EQ(add(2, 3), 5);
       CHECK_EQ(add(-1, 1), 0);
       CHECK_EQ(mul(4, 5), 20);
       CHECK_EQ(mul(0, 9), 0);

       if (failures != 0) {
           std::cout << failures << " 项断言失败" << std::endl;
           return 1;
       }
       std::cout << "全部测试通过" << std::endl;
       return 0;
   }

``tests/CMakeLists.txt`` 创建测试可执行文件并注册到 CTest：

.. code-block:: cmake

   # tests/CMakeLists.txt
   add_executable(mylib_tests test_main.cpp)
   target_link_libraries(mylib_tests PRIVATE mylib)
   project_set_warnings(mylib_tests)

   add_test(NAME mylib_tests COMMAND mylib_tests)

测试程序的退出码就是测试结果：0 通过，非 0 失败。``add_test`` 只是注册，真正执行由 ``ctest`` 负责。

八、配置与构建
--------------

在项目根目录执行：

.. code-block:: bash

   cmake -S . -B build -G Ninja
   cmake --build build

输出结果类似如下（编译器与耗时因机器而异）：

.. code-block:: text

   -- The CXX compiler identification is GNU 15.1.0
   -- Detecting CXX compiler ABI info - done
   -- Check for working CXX compiler: .../g++.exe - skipped
   -- Detecting CXX compile features - done
   -- Configuring done (4.4s)
   -- Generating done (0.2s)
   -- Build files have been written to: .../MyProject/build

   [1/7] Building CXX object src/CMakeFiles/mylib.dir/lib/math_add.cpp.obj
   [2/7] Building CXX object src/CMakeFiles/mylib.dir/lib/math_mul.cpp.obj
   [3/7] Linking CXX static library src\libmylib.a
   [4/7] Building CXX object src/CMakeFiles/myapp.dir/main.cpp.obj
   [5/7] Building CXX object tests/CMakeFiles/mylib_tests.dir/test_main.cpp.obj
   [6/7] Linking CXX executable tests\mylib_tests.exe
   [7/7] Linking CXX executable src\myapp.exe
   built: myapp.exe

``[3/7]`` 表示静态库先于主程序完成链接，这是 CMake 根据 ``target_link_libraries`` 自动推导出的依赖顺序。

九、运行与测试
--------------

运行主程序：

.. code-block:: bash

   ./build/src/myapp.exe      # Linux/macOS：./build/src/myapp

输出结果：

.. code-block:: text

   add(2, 3) = 5
   mul(4, 5) = 20

运行测试：

.. code-block:: bash

   ctest --test-dir build --output-on-failure

输出结果类似如下：

.. code-block:: text

   Test project .../MyProject/build
       Start 1: mylib_tests
   1/1 Test #1: mylib_tests ......................   Passed    0.20 sec

   100% tests passed, 0 tests failed out of 1

``--output-on-failure`` 会在测试失败时打印完整输出，CI 环境务必加上。``--test-dir`` 让 ctest 明确在哪个构建目录里查找测试，不依赖当前路径。

十、安装项目
------------

把产物安装到临时前缀，检查目录结构：

.. code-block:: bash

   cmake --install build --prefix build/_stage

输出结果类似如下：

.. code-block:: text

   -- Install configuration: ""
   -- Installing: .../build/_stage/bin/myapp.exe
   -- Installing: .../build/_stage/lib/libmylib.a
   -- Installing: .../build/_stage/include
   -- Installing: .../build/_stage/include/mylib.h

``--prefix`` 的优先级高于 ``CMAKE_INSTALL_PREFIX``，适合在开发阶段验证安装规则而不影响系统目录。

十一、扩展练习
--------------

任务 1：为 ``mylib`` 添加 ``sub`` 函数，并补充对应测试用例。

.. code-block:: cpp

   // src/include/mylib.h 追加
   int sub(int a, int b);

   // src/lib 下新增 math_sub.cpp
   #include "mylib.h"
   int sub(int a, int b) { return a - b; }

同时把 ``math_sub.cpp`` 加入 ``add_library(mylib ...)`` 的源文件列表，并在测试中加一行：

.. code-block:: cpp

   CHECK_EQ(sub(10, 4), 6);

任务 2：给测试注册超时与输出校验属性。

.. code-block:: cmake

   set_tests_properties(mylib_tests PROPERTIES
       TIMEOUT 30
       PASS_REGULAR_EXPRESSION "全部测试通过")

任务 3：把构建类型默认值设为 Release，并允许命令行覆盖。

.. code-block:: cmake

   if(NOT CMAKE_BUILD_TYPE AND NOT CMAKE_CONFIGURATION_TYPES)
       set(CMAKE_BUILD_TYPE Release CACHE STRING "构建类型" FORCE)
   endif()

任务 4：新增 ``make_package`` 目标，用 ``cpack`` 生成 ZIP 包。

.. code-block:: cmake

   include(CPack)
   add_custom_target(make_package
       COMMAND ${CMAKE_CPACK_COMMAND} -G ZIP -B ${CMAKE_BINARY_DIR}/_pack
       COMMENT "生成 ZIP 发布包")

任务 5：用 ``CMakePresets.json`` 固化 Debug 与 Release 两套配置。

.. code-block:: json

   {
     "version": 3,
     "configurePresets": [
       { "name": "debug", "generator": "Ninja", "binaryDir": "${sourceDir}/build/debug", "cacheVariables": { "CMAKE_BUILD_TYPE": "Debug" } },
       { "name": "release", "generator": "Ninja", "binaryDir": "${sourceDir}/build/release", "cacheVariables": { "CMAKE_BUILD_TYPE": "Release" } }
     ]
   }
