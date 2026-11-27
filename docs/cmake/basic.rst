CMake 基础
==========

.. meta::
   :group: 入门
   :summary: 从第一个最小工程出发，掌握 CMakeLists.txt 的基本语法、变量与缓存、头文件路径和 find_package。

CMake 的所有构建逻辑都写在 ``CMakeLists.txt`` 里。本章从最小可用的工程开始，覆盖日常使用频率最高的四块内容：基本语法、变量与缓存、头文件搜索路径、查找库和包。

一、CMakeLists.txt 文件
-----------------------

CMakeLists.txt 是纯文本文件，由一条条 **命令** 组成。基本语法规则：

* 命令名不区分大小写，惯例使用小写（``set``、``add_executable``）。
* 命令名后紧跟左括号，参数之间用空格或换行分隔。
* ``#`` 开头的内容是注释，到行尾结束。
* 字符串参数建议用双引号包裹，避免空格路径被拆开。

基本语法
~~~~~~~~

.. code-block:: cmake

   # 这是一行注释
   set(NAME "demo")            # 设置变量
   message(STATUS "项目名: ${NAME}")  # 打印信息

命令的参数本身支持多种形式：

.. code-block:: cmake

   add_executable(demo main.cpp)      # 位置参数
   set(CMAKE_BUILD_TYPE Release CACHE STRING "构建类型")  # 关键字参数 + 值

二、最小可用工程
----------------

一个 CMake 项目最少只需要两行配置加一个源文件：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(demo LANGUAGES CXX)

.. code-block:: cpp

   // src/main.cpp
   #include <iostream>

   int main() {
       std::cout << "hello cmake" << std::endl;
       return 0;
   }

还缺一条 ``add_executable``，完整的可构建版本：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(demo LANGUAGES CXX)

   add_executable(demo src/main.cpp)

.. note::

   缺少 ``cmake_minimum_required`` 时，CMake 3.x 只给出警告，**CMake 4.0 起直接报错拒绝配置**。老项目升级 CMake 后第一件事就是补上这行。

两条命令的含义：

.. csv-table::
   :header: "命令", "作用"

   "cmake_minimum_required(VERSION 3.16)", "声明项目支持的最低 CMake 版本，同时初始化策略行为，必须是第一条命令"
   "project(demo LANGUAGES CXX)", "定义项目名与启用的语言，会探测编译器并初始化相关变量"
   "add_executable(demo src/main.cpp)", "声明一个名为 demo 的可执行目标及其源文件"

三、变量和缓存
--------------

普通变量
~~~~~~~~

``set()`` 定义普通变量，只在当前目录及其子目录有效：

.. code-block:: cmake

   set(VERSION 1.2.3)
   message(STATUS "版本: ${VERSION}")

变量引用用 ``${}``；列表就是一个用分号连接的字符串：

.. code-block:: cmake

   set(SOURCES src/main.cpp src/math.cpp)
   # ${SOURCES} 展开为 src/main.cpp;src/math.cpp

缓存变量
~~~~~~~~

普通变量每次配置都会重新赋值；**缓存变量** 写入构建目录的 ``CMakeCache.txt``，跨多次配置保留，也是命令行 ``-D`` 的落点：

.. code-block:: cmake

   # 类型用于 GUI 展示与取值约束，"..." 是说明文字
   set(ENABLE_LOGGING ON CACHE BOOL "是否启用日志")

   # option() 是布尔缓存变量的简写
   option(BUILD_TESTS "构建测试" OFF)

命令行可以在配置时覆盖缓存变量：

.. code-block:: bash

   cmake -S . -B build -DENABLE_LOGGING=OFF -DBUILD_TESTS=ON

.. note::

   命令行 ``-D`` 的优先级高于 ``set(... CACHE ...)``：一旦命令行指定过某个缓存变量，脚本里同一变量的缓存默认值就不再生效（除非用 ``FORCE``）。

四、头文件搜索路径
------------------

``#include "math/math.h"`` 这类引用需要告诉编译器去哪里找头文件。

include_directories 与 target_include_directories 对比
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cmake

   # 全局方式（旧风格）：影响当前目录及子目录的所有目标
   include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

   # 目标方式（Modern CMake 推荐）：只影响指定目标，语义清晰
   target_include_directories(demo PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)

两种方式都能完成任务，但 ``target_include_directories`` 可以明确声明依赖传播方向：

.. csv-table:: PUBLIC / PRIVATE / INTERFACE 的含义
   :header: "关键字", "对自己", "对使用者（链接我的目标）"

   "PRIVATE", "生效", "不生效"
   "INTERFACE", "不生效", "生效"
   "PUBLIC", "生效", "生效"

判断口诀：**头文件出现在我的公开头文件里就用 PUBLIC，只在自己源文件里用就 PRIVATE，纯接口库用 INTERFACE**。

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.16)
   project(withlib LANGUAGES CXX)

   add_library(math STATIC src/math.cpp)
   target_include_directories(math PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)

   add_executable(app src/app.cpp)
   target_link_libraries(app PRIVATE math)

``math`` 以 PUBLIC 暴露 include 目录，链接它的 ``app`` 无需再写一行头文件路径：

.. code-block:: cpp

   // include/math/math.h
   int add(int a, int b);

.. code-block:: cpp

   // src/math.cpp
   #include "math/math.h"

   int add(int a, int b) { return a + b; }

.. code-block:: cpp

   // src/app.cpp
   #include "math/math.h"
   #include <iostream>

   int main() {
       std::cout << add(2, 3) << std::endl;
       return 0;
   }

五、查找库和包
--------------

find_package 指令
~~~~~~~~~~~~~~~~~

第三方库通常用 ``find_package`` 查找，而不是手写路径。它有两种模式：

* **MODULE 模式**：使用 CMake 自带的 ``FindXxx.cmake`` 模块（如 ``FindThreads``、``FindZLIB``）。
* **CONFIG 模式**：使用库自己安装的 ``XxxConfig.cmake``（如 Qt6、Boost 新版），加 ``CONFIG`` 关键字。

使用查找到的库
~~~~~~~~~~~~~~

标准写法是 “查找 → 判断 → 链接” 三步：

.. code-block:: cmake

   find_package(Threads REQUIRED)

   add_executable(app src/main.cpp)
   target_link_libraries(app PRIVATE Threads::Threads)

``Threads::Threads`` 这种 ``Xxx::Yyy`` 形式叫 **导入目标**，头文件路径、宏定义、链接参数都随目标一起生效，不需要再手写 ``-lpthread``。

使用第三方库示例
~~~~~~~~~~~~~~~~

以 Boost 为例，指定组件并处理查找失败：

.. code-block:: cmake

   find_package(Boost 1.80 COMPONENTS filesystem)

   if(Boost_FOUND)
       target_link_libraries(app PRIVATE Boost::filesystem)
   else()
       message(FATAL_ERROR "未找到 Boost，请设置 -DBOOST_ROOT=/path/to/boost")
   endif()

查找失败的常见处理方式是把库的安装路径通过 ``-D`` 告诉 CMake：

.. code-block:: bash

   cmake -S . -B build -DBOOST_ROOT=/opt/boost

六、注意事项
------------

* ``cmake_minimum_required`` 必须放在最前面，否则部分策略行为会不一致。
* 源码目录变化（新增 .cpp 文件）后，Linux/macOS 的 Makefile 生成器需要重新 ``cmake`` 配置；Ninja 和 Visual Studio 生成器会自动检测。
* 变量名区分大小写，``${SOURCES}`` 和 ``${sources}`` 是两个变量。
* 推荐始终使用 ``target_xxx`` 系列命令（Modern CMake），避免全局 ``include_directories``、``add_definitions`` 等旧式命令。
