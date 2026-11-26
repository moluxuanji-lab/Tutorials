PowerShell 管道和过滤
=====================

.. meta::
   :group: 进阶
   :summary: 用管道把命令搭成流水线：Where-Object 筛选、Select-Object 提取、Sort-Object 排序。

PowerShell 最强大的特性之一就是“管道”机制。

管道允许你像搭积木一样，将多个命令组合在一起，每一步都处理和传递对象，这不仅让脚本更简洁，还极大提升了处理数据的灵活性与效率。

本节将介绍管道 ``|`` 的基本原理、过滤的两种方式、对象属性提取，以及常见的组合技巧，帮助你写出更强大、更智能的命令行操作。

一、什么是管道？
----------------

在 PowerShell 中，**管道符号**（``|``，竖线）表示将前一个命令的输出“传递”给下一个命令作为输入。

不同于传统命令行中的文本流，PowerShell 管道中传递的是 **对象**，这使得操作更加精准和强大。

示例：列出正在运行的服务并排序

.. code-block:: powershell

   Get-Service | Where-Object {$_.Status -eq "Running"} | Sort-Object DisplayName

解释：

1. ``Get-Service`` 获取所有服务对象。
2. ``Where-Object`` 筛选出状态为 Running 的服务。
3. ``Sort-Object`` 根据服务名进行排序。

二、对象过滤：Where-Object
--------------------------

基本语法：

.. code-block:: text

   Where-Object { 条件表达式 }

在 ``{}`` 内部，使用 ``$_`` 表示当前管道中的每个对象。

示例 1：筛选内存占用超过 500MB 的进程

.. code-block:: powershell

   Get-Process | Where-Object { $_.WorkingSet -gt 500MB }

示例 2：筛选服务名以 “Win” 开头的服务

.. code-block:: powershell

   Get-Service | Where-Object { $_.Name -like "Win*" }

三、提取属性：Select-Object
---------------------------

``Select-Object`` 用于从对象中提取你关心的字段，常用于输出简洁化、重定向文件或构建报表。

示例：列出所有服务的名称和状态

.. code-block:: powershell

   Get-Service | Select-Object Name, Status

还可以重命名字段：

.. code-block:: powershell

   Get-Service | Select-Object @{Name="服务名"; Expression={$_.DisplayName}}, Status

四、排序数据：Sort-Object
-------------------------

``Sort-Object`` 用于按照某个属性对对象进行排序。

示例：按内存使用量降序排列进程

.. code-block:: powershell

   Get-Process | Sort-Object WorkingSet -Descending | Select-Object Name, WorkingSet -First 5

五、输出与格式化
----------------

示例：以表格形式显示服务信息

.. code-block:: powershell

   Get-Service | Format-Table -Property Name, Status, DisplayName

输出到文件：

.. code-block:: powershell

   Get-Service | Where-Object {$_.Status -eq "Running"} |
       Select-Object Name, DisplayName |
       Out-File -FilePath "C:\RunningServices.txt"

六、常见用法组合（实战）
------------------------

1. 查看所有占用 CPU 的进程（按 CPU 使用量排序）：

.. code-block:: powershell

   Get-Process | Where-Object { $_.CPU -gt 0 } | Sort-Object CPU -Descending

2. 查找所有名字中带有 “Time” 的服务：

.. code-block:: powershell

   Get-Service | Where-Object { $_.DisplayName -like "*Time*" }

3. 导出硬盘信息：

.. code-block:: powershell

   Get-CimInstance Win32_LogicalDisk |
       Select-Object DeviceID, VolumeName, Size, FreeSpace |
       Export-Csv -Path "C:\diskinfo.csv" -NoTypeInformation

七、Where-Object 简写形式（PowerShell 3.0+）
--------------------------------------------

PowerShell 3.0 及以上版本支持简写语法：

.. code-block:: powershell

   Where-Object Name -like "*Win*"

等同于：

.. code-block:: powershell

   Where-Object { $_.Name -like "*Win*" }

.. tip::

   建议初学者先熟悉标准写法，后期再使用简写提升效率。

八、常用管道操作命令一览
------------------------

.. csv-table::
   :header: "命令", "功能说明"

   "Where-Object", "对对象进行条件筛选"
   "Select-Object", "提取指定属性"
   "Sort-Object", "按属性排序"
   "Format-Table", "美化输出为表格形式"
   "Out-File", "将输出写入文本文件"
   "Export-Csv", "将数据导出为 CSV 文件"

十、练习任务
------------

任务 1：筛选所有以 “W” 开头的服务并按名称排序

.. code-block:: powershell

   Get-Service | Where-Object { $_.Name -like "W*" } | Sort-Object Name

任务 2：列出前 10 个内存占用最高的进程

.. code-block:: powershell

   Get-Process | Sort-Object WorkingSet -Descending | Select-Object Name, WorkingSet -First 10

任务 3：导出本机所有 IPv4 地址到文件

.. code-block:: powershell

   Get-NetIPAddress -AddressFamily IPv4 | Select-Object IPAddress | Out-File -FilePath "C:\ip_list.txt"
