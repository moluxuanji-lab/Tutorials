CMake 测试与打包
================

.. meta::
   :group: 工程化
   :summary: 用 enable_testing/add_test/ctest 组织单元测试，用 CPack 一键产出发布包。

构建出程序之后，还需要测试与打包两道工序。两者都内置于 CMake 套件：``ctest`` 跑测试，``cpack`` 产发布包。

一、注册并运行测试
------------------

三步接入 CTest：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(test-demo LANGUAGES CXX)

   enable_testing()          # 或 include(CTest)（还会带上 BUILD_TESTING 选项）

   add_library(math STATIC src/math.cpp)
   target_include_directories(math PUBLIC include)

   add_executable(math-test test/math_test.cpp)
   target_link_libraries(math-test PRIVATE math)

   add_test(NAME math_add COMMAND math-test)

测试程序用退出码表达结果：0 通过、非 0 失败。

.. code-block:: cpp

   // include/math/math.h
   #pragma once
   int add(int a, int b);

.. code-block:: cpp

   // src/math.cpp
   #include "math/math.h"
   int add(int a, int b) { return a + b; }

.. code-block:: cpp

   // test/math_test.cpp
   #include "math/math.h"
   #include <iostream>

   static int failures = 0;
   #define CHECK_EQ(actual, expected)                       \
       do {                                                 \
           if ((actual) != (expected)) {                    \
               std::cerr << "FAIL: " << #actual << " = "    \
                         << (actual) << " != " << (expected) << std::endl; \
               ++failures;                                  \
           }                                                \
       } while (0)

   int main() {
       CHECK_EQ(add(1, 2), 3);
       CHECK_EQ(add(-1, 1), 0);
       CHECK_EQ(add(100, 200), 300);
       if (failures) {
           std::cout << failures << " 项断言失败" << std::endl;
           return 1;
       }
       std::cout << "全部通过" << std::endl;
       return 0;
   }

运行测试：

.. code-block:: bash

   cmake -S . -B build
   cmake --build build
   ctest --test-dir build --output-on-failure

输出结果类似如下：

.. code-block:: text

   Test project .../build
       Start 1: math_add
   1/1 Test #1: math_add ....................   Passed    0.02 sec

   100% tests passed, 0 tests failed out of 1

二、校验测试输出
----------------

有些测试只关心输出内容，用 ``PASS_REGULAR_EXPRESSION`` 校验：

.. code-block:: cmake

   add_test(NAME math_output COMMAND math-test)
   set_tests_properties(math_output PROPERTIES
       PASS_REGULAR_EXPRESSION "全部通过")

失败信息同理用 ``FAIL_REGULAR_EXPRESSION``；测试超时用 ``TIMEOUT`` 属性（秒）。

三、ctest 常用操作
------------------

.. csv-table::
   :header: "命令", "作用"

   "ctest --test-dir build", "运行全部测试（3.20+ 显式指定构建目录）"
   "ctest -R math", "按名字正则筛选测试"
   "ctest --output-on-failure", "失败时打印完整输出（CI 必开）"
   "ctest -j 8", "并行执行测试"
   "ctest --rerun-failed", "只重跑上次失败的测试"
   "ctest -N", "只列出测试，不执行"

.. note::

   旧习惯是在构建目录里直接敲 ``ctest``；3.20 起推荐 ``ctest --test-dir <dir>``，不依赖当前工作目录。

四、CPack 打包
--------------

在 ``CMakeLists.txt`` 末尾追加 CPack 配置，安装规则（``install()``）会自动成为打包内容：

.. code-block:: cmake

   set(CPACK_PACKAGE_NAME "math-demo")
   set(CPACK_PACKAGE_VERSION ${PROJECT_VERSION})
   set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "CMake 测试与打包示例")
   set(CPACK_PACKAGE_VENDOR "Runoob")

   include(CPack)

生成发布包：

.. code-block:: bash

   cmake --build build
   cpack -G ZIP -B build/_pack     # Windows 常用 ZIP；Linux 可用 TGZ、DEB、RPM

输出结果类似如下：

.. code-block:: text

   CPack: Create package using ZIP
   CPack: Install projects
   CPack: - Run preinstall target for: test-demo
   CPack: - Install project: test-demo []
   CPack: Create package
   CPack: - package: .../math-demo-1.0.0-win64.zip generated.

.. csv-table:: 常用生成器
   :header: "生成器", "平台", "产物"

   "ZIP / TGZ", "全平台", "压缩包"
   "DEB", "Debian / Ubuntu", ".deb"
   "RPM", "Fedora / RHEL", ".rpm"
   "WIX / NSIS", "Windows", "安装向导 .exe/.msi"

五、完整可构建示例
------------------

一个最小的可打包项目：静态库加安装规则加 CPack 配置：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(pack-demo VERSION 1.0.0 LANGUAGES CXX)

   include(GNUInstallDirs)

   add_library(math STATIC src/math.cpp)
   target_include_directories(math PUBLIC include)

   install(TARGETS math
       ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR})
   install(DIRECTORY include/ DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})

   set(CPACK_PACKAGE_NAME "math-demo")
   set(CPACK_PACKAGE_VERSION ${PROJECT_VERSION})
   set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "math 库示例包")
   include(CPack)

.. code-block:: cpp

   // include/math/math.h
   #pragma once
   int add(int a, int b);

.. code-block:: cpp

   // src/math.cpp
   #include "math/math.h"
   int add(int a, int b) { return a + b; }

执行打包：

.. code-block:: bash

   cpack -G ZIP -B build/_pack

六、练习任务
------------

任务 1：为 math 库补一个 ``sub`` 函数并新增测试用例

.. code-block:: cpp

   // test/math_test.cpp 追加
   CHECK_EQ(add(2, -5), -3);

任务 2：设置测试属性

.. code-block:: cmake

   set_tests_properties(math_add PROPERTIES
       TIMEOUT 30
       PASS_REGULAR_EXPRESSION "全部通过")

任务 3：为项目产出 ZIP 包并解包检查目录结构

.. code-block:: bash

   cpack -G ZIP -B build/_pack
