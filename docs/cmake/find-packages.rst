CMake 查找库与包
================

.. meta::
   :group: 核心概念
   :summary: find_package 的两种模式、查找路径变量、导入目标用法与查找失败的排查手段。

第三方库是 C++ 项目的常态。``find_package`` 负责找到库的 **头文件在哪里、要链接哪个文件、编译需要什么定义**，并把结果封装成目标供你链接。

一、两种查找模式
----------------

.. code-block:: cmake

   # MODULE 模式（默认）：使用 CMake 自带的 Find<包名>.cmake
   find_package(Threads REQUIRED)
   find_package(ZLIB 1.2 REQUIRED)

   # CONFIG 模式：使用库安装时自带的 <包名>Config.cmake
   find_package(Qt6 COMPONENTS Widgets REQUIRED CONFIG)
   find_package(OpenCV 4.8 CONFIG REQUIRED)

.. csv-table::
   :header: "模式", "查找对象", "典型包"

   "MODULE", "CMake 发行自带的 FindZLIB.cmake 等模块", "Threads、ZLIB、OpenSSL、BZip2、CURL"
   "CONFIG", "库安装目录下的 lib/cmake/<包>/Config.cmake", "Qt6、Boost、OpenCV、fmt、nlohmann_json"

CMake 会先按 MODULE 找（不带 ``CONFIG`` 且存在同名 Find 模块时），失败后自动回退 CONFIG 模式。

二、使用导入目标
----------------

查找成功后得到两种东西：旧式变量（``ZLIB_INCLUDE_DIRS``、``ZLIB_LIBRARIES``）和 **导入目标**（``ZLIB::ZLIB``）。一律推荐导入目标：

.. code-block:: cmake

   find_package(ZLIB REQUIRED)

   add_executable(gzip-demo src/main.cpp)
   target_link_libraries(gzip-demo PRIVATE ZLIB::ZLIB)
   # 头文件路径、链接库、宏定义全部随目标自动生效

.. code-block:: cpp

   // src/main.cpp
   #include <zlib.h>
   #include <cstdio>

   int main() {
       printf("zlib 版本: %s\n", zlibVersion());
       return 0;
   }

CMake 自带模块的常用导入目标：

.. csv-table::
   :header: "find_package", "导入目标"

   "Threads", "Threads::Threads"
   "ZLIB", "ZLIB::ZLIB"
   "OpenSSL", "OpenSSL::SSL、OpenSSL::Crypto"
   "CURL", "CURL::libcurl"
   "BZip2", "BZip2::BZip2"

三、查找路径
------------


CONFIG 模式按 “前缀 + 固定子路径” 搜索。最常用的控制手段：

.. code-block:: cmake

   # 脚本内追加查找前缀
   list(APPEND CMAKE_PREFIX_PATH "C:/Qt/6.12.0/mingw_64")

.. code-block:: bash

   # 或在命令行传入（推荐，不改脚本）
   cmake -S . -B build -DCMAKE_PREFIX_PATH=C:/Qt/6.12.0/mingw_64

.. csv-table:: 查找相关变量
   :header: "变量", "作用"

   "CMAKE_PREFIX_PATH", "查找前缀列表，CONFIG 模式的主入口"
   "<包名>_ROOT", "单包专用根路径，如 BOOST_ROOT、Qt6_ROOT"
   "<包名>_DIR", "直接指向 Config.cmake 所在目录（缓存变量，找到后自动写入）"

环境变量 ``PATH``、``CMAKE_PREFIX_PATH`` 也会参与搜索，这正是 “装好的库找不到” 时应依次检查的三处：``CMAKE_PREFIX_PATH`` → ``<包>_ROOT`` → ``<包>_DIR``。

四、可选依赖与组件
------------------

.. code-block:: cmake

   # REQUIRED：找不到直接报错终止配置
   find_package(Threads REQUIRED)

   # 不带 REQUIRED：找不到返回 <包>_FOUND = FALSE，自行处理
   find_package(OpenMP)
   if(OpenMP_FOUND)
       target_link_libraries(demo PRIVATE OpenMP::OpenMP_CXX)
   else()
       message(STATUS "未检测到 OpenMP，跳过并行加速")
   endif()

   # 只需要库的部分组件
   find_package(Qt6 COMPONENTS Core Gui Widgets REQUIRED)

   # 多种可用实现：先找 CONFIG，找不到退回 MODULE
   find_package(fmt CONFIG QUIET)
   if(NOT fmt_FOUND)
       message(STATUS "使用自带的 fallback 实现")
   endif()

五、完整可构建示例
------------------

一个链接线程库并打印硬件线程数的项目，``Threads`` 在所有平台都可用：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(hw-threads LANGUAGES CXX)

   find_package(Threads REQUIRED)

   add_executable(hw-threads src/main.cpp)
   target_link_libraries(hw-threads PRIVATE Threads::Threads)

.. code-block:: cpp

   // src/main.cpp
   #include <thread>
   #include <iostream>

   int main() {
       std::cout << "硬件线程数: " << std::thread::hardware_concurrency() << std::endl;
       return 0;
   }

配置阶段输出会确认查找结果：

.. code-block:: text

   -- Found Threads: TRUE
   -- Configuring done (0.4s)
   -- Generating done (0.1s)

六、查找失败的排查步骤
----------------------

1. 看报错里 CMake 搜索过的路径列表，确认库是否真的装在那些位置。
2. 设置 ``-D<包>_DIR=<Config.cmake 所在目录>`` 直接定位。
3. 设置 ``-DCMAKE_FIND_DEBUG_MODE=ON`` 重新配置，CMake 会打印每个查找步骤的详细日志（CMake 3.23+）。
4. 确认架构匹配：64 位编译器不能链接 32 位库。
5. 确认版本：``find_package(OpenCV 4.8)`` 要求版本不低于 4.8。

.. warning::

   不要用 ``link_directories`` 加 ``include_directories`` 手拼第三方库路径，这种写法绕过了依赖管理，换台机器就崩。优先 ``find_package`` + 导入目标；确实没有 Config 的库，再用 ``find_library`` / ``find_path`` 手动查找后封装成本项目的导入目标。

七、练习任务
------------

任务 1：链接线程库并打印线程数

.. code-block:: cmake

   find_package(Threads REQUIRED)
   target_link_libraries(demo PRIVATE Threads::Threads)

.. code-block:: cpp

   // main.cpp
   #include <thread>
   #include <iostream>
   int main() {
       std::cout << std::thread::hardware_concurrency() << " 条硬件线程" << std::endl;
   }

任务 2：可选依赖探测

.. code-block:: cmake

   find_package(OpenMP QUIET)
   if(OpenMP_FOUND)
       message(STATUS "OpenMP 可用")
   endif()

任务 3：用 ``CMAKE_FIND_DEBUG_MODE`` 观察一次真实查找过程

.. code-block:: cmake

   set(CMAKE_FIND_DEBUG_MODE ON)
   find_package(ZLIB)
   set(CMAKE_FIND_DEBUG_MODE OFF)
