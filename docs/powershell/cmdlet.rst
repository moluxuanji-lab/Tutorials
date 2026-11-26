PowerShell Cmdlet 基础
======================

.. meta::
   :group: 核心概念
   :summary: 认识 PowerShell 的基本命令单元 Cmdlet：命名规范、参数结构、帮助系统与常用命令。

**Cmdlet（发音类似 “command-let”）** 是 PowerShell 中的基本命令单元，由 Microsoft 基于 .NET 框架实现的小型命令。

Cmdlet 不同于传统 shell 中的外部程序，例如 ``.exe`` 或 ``.bat`` 文件，而是内置于 PowerShell 运行时环境中的。

每个 Cmdlet 执行一项特定的任务，比如获取数据、设置属性、创建对象、导出文件等。

Cmdlet 的命名规则：动词-名词
----------------------------

PowerShell 中所有 Cmdlet 的命名都遵循统一的 **“动词-名词”** 格式，例如：

* ``Get-Process``：获取进程信息。
* ``Set-Date``：设置系统日期。
* ``New-Item``：创建新项（如文件或文件夹）。
* ``Remove-Service``：删除服务。

这种命名方式既直观又一致，便于记忆和查找。

Cmdlet 的基本语法结构
---------------------

Cmdlet 的语法结构一般如下：

.. code-block:: text

   动词-名词 [-参数名 参数值] [-开关参数]

示例：

.. code-block:: powershell

   Get-Service -Name W32Time

说明：

* ``Get-Service``：获取服务对象。
* ``-Name W32Time``：指定要查询的服务名称为 ``W32Time``。

再如：

.. code-block:: powershell

   Stop-Process -Id 1234 -Force

* ``-Id`` 是带值参数。
* ``-Force`` 是开关参数，不需要指定值。

参数与管道的结合
----------------

Cmdlet 支持 **位置参数**、**命名参数** 和 **管道输入**。这使得命令可以灵活组合，构建复杂的工作流。

示例 1：指定参数形式

.. code-block:: powershell

   Get-Process -Name notepad

示例 2：通过管道传递

.. code-block:: powershell

   "notepad" | Get-Process -Name

示例 3：对象管道传递给另一个 Cmdlet

.. code-block:: powershell

   Get-Process notepad | Stop-Process

在上面这个例子中，``Get-Process`` 获取了 notepad 进程对象，然后通过管道传递给 ``Stop-Process`` 来终止它。

查看 Cmdlet 的帮助信息
----------------------

PowerShell 提供了完整的帮助系统，可以使用 ``Get-Help`` 查看任何 Cmdlet 的用法：

.. code-block:: powershell

   Get-Help Get-Process

要查看更多参数说明和示例，可加上 ``-Detailed`` 或 ``-Examples``：

.. code-block:: powershell

   Get-Help Get-Process -Examples

如果是首次使用 PowerShell，建议执行一次以下命令来更新本地帮助：

.. code-block:: powershell

   Update-Help

常见基础 Cmdlet 速查表
----------------------

.. csv-table::
   :header: "Cmdlet", "功能说明"

   "Get-Command", "查看所有可用命令"
   "Get-Help", "查看命令的帮助信息"
   "Get-Process", "获取进程列表"
   "Get-Service", "获取服务列表"
   "Start-Service", "启动服务"
   "Stop-Service", "停止服务"
   "Set-ExecutionPolicy", "设置执行策略"
   "New-Item", "创建新文件或文件夹"
   "Remove-Item", "删除文件或文件夹"
   "Copy-Item", "复制文件或文件夹"
   "Move-Item", "移动文件或文件夹"
   "Clear-Host", "清屏，类似于 cls"

实践示例：文件操作
------------------

创建文件夹：

.. code-block:: powershell

   New-Item -Path "C:\TestFolder" -ItemType Directory

在该目录下创建文本文件：

.. code-block:: powershell

   New-Item -Path "C:\TestFolder\demo.txt" -ItemType File

将内容写入文件：

.. code-block:: powershell

   Set-Content -Path "C:\TestFolder\demo.txt" -Value "Hello PowerShell"

读取文件内容：

.. code-block:: powershell

   Get-Content -Path "C:\TestFolder\demo.txt"
