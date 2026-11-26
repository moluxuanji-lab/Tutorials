Cmdlet 进程和服务管理
=====================

.. meta::
   :group: 常用操作
   :summary: 查看、启动、停止与筛选进程和服务，搭建最基础的运维监控脚本。

进程和服务的管理，是系统维护和自动化运维中非常重要的一部分。

PowerShell 提供了一组简洁而强大的 Cmdlet，用于查看、启动、停止、筛选和控制本地（或远程）计算机上的进程与服务。

本节将详细讲解如何使用 PowerShell 管理进程与服务，包括基本操作命令、典型应用场景及常见问题，帮助你提升系统管理效率。

一、进程管理（Process）
-----------------------

PowerShell 使用 .NET 的进程对象来处理进程操作，常用的 Cmdlet 包括：

.. csv-table::
   :header: "Cmdlet", "功能"

   "Get-Process", "获取正在运行的进程"
   "Stop-Process", "停止指定进程"
   "Start-Process", "启动新进程（程序）"
   "Wait-Process", "等待某个进程结束"

查看进程：Get-Process
~~~~~~~~~~~~~~~~~~~~~

查看所有正在运行的进程：

.. code-block:: powershell

   Get-Process

查看特定进程（如 notepad）：

.. code-block:: powershell

   Get-Process -Name notepad

查看多个进程：

.. code-block:: powershell

   Get-Process -Name chrome, notepad

获取进程详细信息并排序：

.. code-block:: powershell

   Get-Process | Sort-Object CPU -Descending | Select-Object -First 5

结束进程：Stop-Process
~~~~~~~~~~~~~~~~~~~~~~

根据进程名停止：

.. code-block:: powershell

   Stop-Process -Name notepad

根据进程 ID 停止：

.. code-block:: powershell

   Stop-Process -Id 1234

强制终止进程（避免交互提示）：

.. code-block:: powershell

   Stop-Process -Name notepad -Force

启动进程：Start-Process
~~~~~~~~~~~~~~~~~~~~~~~

打开记事本：

.. code-block:: powershell

   Start-Process notepad

以管理员身份打开 PowerShell（需当前窗口有权限）：

.. code-block:: powershell

   Start-Process powershell -Verb RunAs

启动网页浏览器并访问网址：

.. code-block:: powershell

   Start-Process "https://learn.microsoft.com"

等待进程：Wait-Process
~~~~~~~~~~~~~~~~~~~~~~

等待进程执行完毕后继续：

.. code-block:: powershell

   Start-Process notepad
   Wait-Process -Name notepad
   Write-Output "记事本已关闭"

二、服务管理（Service）
-----------------------

PowerShell 对服务管理的支持非常完备，常用 Cmdlet 如下：

.. csv-table::
   :header: "Cmdlet", "功能说明"

   "Get-Service", "查看服务状态"
   "Start-Service", "启动服务"
   "Stop-Service", "停止服务"
   "Restart-Service", "重启服务"
   "Set-Service", "更改服务属性"

查看服务：Get-Service
~~~~~~~~~~~~~~~~~~~~~

查看所有服务：

.. code-block:: powershell

   Get-Service

筛选正在运行的服务：

.. code-block:: powershell

   Get-Service | Where-Object {$_.Status -eq "Running"}

查看特定服务：

.. code-block:: powershell

   Get-Service -Name W32Time

启动与停止服务
~~~~~~~~~~~~~~

启动 Windows 时间服务：

.. code-block:: powershell

   Start-Service -Name W32Time

停止服务（如果权限不足可能会报错）：

.. code-block:: powershell

   Stop-Service -Name W32Time

重启服务：Restart-Service
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   Restart-Service -Name W32Time

更改服务设置：Set-Service
~~~~~~~~~~~~~~~~~~~~~~~~~

将服务启动类型设为自动：

.. code-block:: powershell

   Set-Service -Name W32Time -StartupType Automatic

将服务禁用：

.. code-block:: powershell

   Set-Service -Name W32Time -StartupType Disabled

三、服务 vs 进程的区别
----------------------

.. csv-table::
   :header: "比较项", "服务（Service）", "进程（Process）"

   "启动方式", "自动启动 / 手动启动 / 禁用", "用户手动或程序触发"
   "运行状态", "持续后台运行，通常无界面", "可前台交互，生命周期较短"
   "管理方式", "Get-Service, Start-Service 等", "Get-Process, Start-Process 等"
   "示例", "Windows Update（wuauserv）", "Notepad、chrome.exe 等"

四、实战示例
------------

示例 1：检测并重启某个异常停止的服务
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   $svc = Get-Service -Name Spooler
   if ($svc.Status -ne "Running") {
       Restart-Service -Name Spooler
       Write-Output "服务已重启"
   }

示例 2：关闭所有 CPU 占用高于 50 的进程（需谨慎）
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   Get-Process | Where-Object { $_.CPU -gt 50 } | Stop-Process -Force

.. warning::

   这类操作务必在测试环境或确认无风险的前提下进行。

五、常见问题与注意事项
----------------------

.. csv-table::
   :header: "问题", "原因与建议说明"

   "无法停止服务", "需要管理员权限，建议使用“以管理员身份运行”"
   "进程名或服务名拼写错误", "可先使用 Get-Process 或 Get-Service 获取准确名称"
   "服务已停止但仍显示为 Running", "某些服务具有保护机制，建议使用 Restart-Service 尝试重启"

六、小结
--------

PowerShell 通过标准化的命令集，使得进程与服务的管理变得简单而高效：

* 使用 ``Get-*`` 查看信息，``Start-*`` / ``Stop-*`` 控制行为，``Set-*`` 修改属性。
* 管道 + 条件筛选 + 对象操作，适合批量管理任务。
* 可以结合计划任务、监控脚本，构建自动化运维体系。
