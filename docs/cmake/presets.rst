CMake 预设与工作流
==================

.. meta::
   :group: 工程化
   :summary: 用 CMakePresets.json 把配置、构建、测试参数固化成可复现的命令，告别冗长的 -D 记忆负担。

配置一个项目往往要记住一长串参数：

.. code-block:: bash

   cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTS=ON -DCMAKE_INSTALL_PREFIX=...

换个机器、换个同事、换条流水线，这串命令就得口口相传。**CMakePresets.json** 把它们固化成有名字的 “预设”，一条命令即可复现。

一、快速上手
------------

.. code-block:: json

   {
     "version": 3,
     "configurePresets": [
       {
         "name": "default",
         "displayName": "默认配置",
         "generator": "Ninja",
         "binaryDir": "${sourceDir}/build",
         "cacheVariables": {
           "CMAKE_BUILD_TYPE": "Release",
           "BUILD_TESTS": "ON"
         }
       }
     ],
     "buildPresets": [
       { "name": "default", "configurePreset": "default" }
     ],
     "testPresets": [
       {
         "name": "default",
         "configurePreset": "default",
         "output": { "outputOnFailure": true }
       }
     ]
   }

使用方式：

.. code-block:: bash

   cmake --list-presets            # 查看可用预设
   cmake --preset default          # 按预设配置
   cmake --build --preset default  # 按预设构建（v2+）
   ctest --preset default          # 按预设跑测试（v2+）

VS Code、CLion、Qt Creator 都原生读取 CMakePresets.json，IDE 里能直接选择预设。

二、文件与版本
--------------

预设文件放在项目根目录，最多两个：

.. csv-table::
   :header: "文件", "定位", "是否入库"

   "CMakePresets.json", "项目官方预设，所有人共享", "应提交到版本库"
   "CMakeUserPresets.json", "个人本地预设（如本机 SDK 路径）", "不应提交"

``CMakeUserPresets.json`` 隐式包含 ``CMakePresets.json``，可以直接引用官方预设做扩展。

顶层 ``version`` 字段是 JSON 模式版本，**它决定支持的特性与所需的最低 CMake 版本**：

.. csv-table:: 常用 schema 版本
   :header: "version", "最低 CMake", "新增能力"

   "1", "3.19", "configurePresets 基础结构"
   "2", "3.20", "buildPresets、testPresets"
   "3", "3.21", "隐藏预设、继承增强（on/multiple）"
   "4", "3.23", "vendor 字段、条件表达式增强"
   "5", "3.24", "``${pathListSep}`` 宏、``testOutputTruncation``"
   "6", "3.25", "``packagePresets``、``workflowPresets``（多步骤流水线）"

.. note::

   版本号不要贪高：写 ``"version": 3`` 的文件在 CMake 3.21+ 都能用，写成 6 就要求所有人用 3.25 以上。团队环境按 “最低公共版本” 取值。

三、继承与组合
--------------

预设支持 ``inherits``，把公共配置收敛到基类，避免重复：

.. code-block:: json

   {
     "version": 3,
     "configurePresets": [
       {
         "name": "base",
         "hidden": true,
         "generator": "Ninja",
         "binaryDir": "${sourceDir}/build/${presetName}",
         "cacheVariables": { "BUILD_TESTS": "ON" }
       },
       {
         "name": "debug",
         "inherits": "base",
         "displayName": "Debug 构建",
         "cacheVariables": { "CMAKE_BUILD_TYPE": "Debug" }
       },
       {
         "name": "release",
         "inherits": "base",
         "displayName": "Release 构建",
         "cacheVariables": { "CMAKE_BUILD_TYPE": "Release" }
       }
     ]
   }

* ``hidden: true`` 的预设只作为基类，不会出现在 ``--list-presets`` 里。
* ``binaryDir`` 里的 ``${presetName}`` 让不同预设用不同构建目录，Debug/Release 互不覆盖。

四、宏展开与条件
----------------

预设里可用的路径宏：

.. csv-table::
   :header: "宏", "含义"

   "${sourceDir}", "项目源码根目录"
   "${sourceParentDir}", "源码根目录的上级"
   "${presetName}", "当前预设名"
   "${generator}", "当前生成器"
   "$env{NAME}", "环境变量"
   "${hostSystemName}", "Linux / Windows / Darwin"

按环境启用预设：

.. code-block:: json

   {
     "name": "windows-only",
     "hidden": true,
     "condition": {
       "type": "equals",
       "lhs": "${hostSystemName}",
       "rhs": "Windows"
     }
   }

五、构建与测试预设
------------------

配置、构建、测试三套预设可以独立命名，用 ``configurePreset`` 关联：

.. code-block:: json

   {
     "version": 3,
     "configurePresets": [
       { "name": "dev", "generator": "Ninja", "binaryDir": "${sourceDir}/build" }
     ],
     "buildPresets": [
       { "name": "dev-build", "configurePreset": "dev" }
     ],
     "testPresets": [
       {
         "name": "dev-test",
         "configurePreset": "dev",
         "output": { "outputOnFailure": true },
         "execution": { "jobs": 8 }
       }
     ]
   }

.. code-block:: bash

   cmake --preset dev && cmake --build --preset dev-build && ctest --preset dev-test

六、完整可构建示例
------------------

一个带预设的项目：

.. code-block:: cmake

   # CMakeLists.txt
   cmake_minimum_required(VERSION 3.21)
   project(preset-demo LANGUAGES CXX)

   add_executable(preset-demo src/main.cpp)

.. code-block:: cpp

   // src/main.cpp
   #include <iostream>
   int main() { std::cout << "preset demo" << std::endl; return 0; }

预设文件（``CMakePresets.json``）：

.. code-block:: json

   {
     "version": 3,
     "cmakeMinimumRequired": { "major": 3, "minor": 21, "patch": 0 },
     "configurePresets": [
       {
         "name": "dev",
         "displayName": "开发默认",
         "generator": "Ninja",
         "binaryDir": "${sourceDir}/build",
         "cacheVariables": { "CMAKE_BUILD_TYPE": "Debug" }
       }
     ]
   }

验证预设已被识别：

.. code-block:: bash

   cmake --list-presets

输出结果类似如下：

.. code-block:: text

   Configure Presets:
     "dev"      - 开发默认

.. note::

   ``cmakeMinimumRequired`` 字段（3.19+）声明使用这份预设所需的最低 CMake，不满足时 CMake 会直接拒绝。

七、练习任务
------------

任务 1：为现有项目添加 debug/release 两个预设（用 hidden 基类收敛公共配置）

任务 2：在 ``CMakeUserPresets.json`` 里写一个带本机路径的预设并验证 ``--list-presets`` 能看到它

任务 3：给 testPreset 加 ``"output": { "verbosity": "verbose" }``，观察 ctest 输出变化
