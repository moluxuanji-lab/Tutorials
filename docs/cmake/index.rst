CMake 教程
==========

.. meta::
   :summary: 面向 C/C++ 开发者的 CMake 结构化教程：从安装、基础语法、变量与目标，到依赖查找、安装导出、自定义命令、模块、预设与测试，共 16 章可运行示例。
   :group: 入门

本教程以菜鸟教程 CMake 系列为基础，对照 CMake 4.x 官方文档查漏补缺，按“入门 → 核心概念 → 工程化 → 实战”的学习路径组织，共 16 章。每一章都配有可以直接运行的示例，建议边读边在本地构建。

.. note::

   示例在 CMake 4.4 + GCC 15.1（MinGW）+ Ninja 环境下实际构建验证；生成器与编译器可以按本机环境替换。没有 Ninja 时，省略 ``-G Ninja`` 让 CMake 选择默认生成器即可。

.. toctree::
   :maxdepth: 2

   tutorial
   install-setup
   basic
   build-flow
   build-demo
   syntax
   variables
   targets
   build-config
   find-packages
   install-export
   custom-commands
   modules
   presets
   testing
   practice
