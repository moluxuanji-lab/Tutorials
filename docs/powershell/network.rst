Cmdlet 网络与系统管理
=====================

.. meta::
   :group: 常用操作
   :summary: 测试连通性、查看 IP 与端口、采集系统信息、管理本地账户与时区。

PowerShell 不仅能管理本地文件、进程和服务，它还具备强大的网络功能和系统级操作能力。无论是查看 IP、测试网络连通性，还是获取系统信息、管理用户账户，PowerShell 都提供了丰富而统一的 Cmdlet。

本节将带你掌握网络和系统管理中最常用的命令，助你从“命令行使用者”迈向“系统管理高手”。

一、网络管理相关 Cmdlet
-----------------------

测试网络连通性：Test-Connection
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

类似于 ``ping`` 命令，但输出为对象，支持更多操作。

.. code-block:: powershell

   Test-Connection -ComputerName www.baidu.com -Count 4

快速版本（PowerShell 7+）：

.. code-block:: powershell

   Test-NetConnection www.baidu.com

获取本机 IP 配置：Get-NetIPAddress
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   Get-NetIPAddress

仅查看 IPv4 地址：

.. code-block:: powershell

   Get-NetIPAddress -AddressFamily IPv4

也可通过旧命令兼容方式：

.. code-block:: powershell

   ipconfig

或者更通用的 WMI 命令：

.. code-block:: powershell

   Get-WmiObject -Class Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled }

获取当前网络连接状态：Get-NetTCPConnection
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

列出所有 TCP 连接及端口状态（类似 ``netstat``）：

.. code-block:: powershell

   Get-NetTCPConnection

查看某个端口的连接情况：

.. code-block:: powershell

   Get-NetTCPConnection -LocalPort 80

管理主机名和 DNS 缓存
~~~~~~~~~~~~~~~~~~~~~~

获取本机主机名：

.. code-block:: powershell

   $env:COMPUTERNAME

清除 DNS 缓存：

.. code-block:: powershell

   Clear-DnsClientCache

二、系统信息查询
----------------

获取操作系统信息：Get-ComputerInfo
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   Get-ComputerInfo

筛选关键字段（如系统版本、CPU）：

.. code-block:: powershell

   Get-ComputerInfo | Select-Object OSName, WindowsVersion, CsProcessors

获取系统启动时间
~~~~~~~~~~~~~~~~

.. code-block:: powershell

   (Get-CimInstance -Class Win32_OperatingSystem).LastBootUpTime

获取磁盘信息：Get-Volume
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   Get-Volume

也可以用：

.. code-block:: powershell

   Get-PSDrive -PSProvider FileSystem

或：

.. code-block:: powershell

   Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID, VolumeName, Size, FreeSpace

获取 BIOS 和硬件信息
~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   Get-CimInstance -ClassName Win32_BIOS
   Get-CimInstance -ClassName Win32_ComputerSystem

三、用户与账户管理（本地）
--------------------------

获取当前用户信息：

.. code-block:: powershell

   [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

或者：

.. code-block:: powershell

   $env:USERNAME

查看本地用户列表（Windows 本地账户）：

.. code-block:: powershell

   Get-LocalUser

禁用用户：

.. code-block:: powershell

   Disable-LocalUser -Name "TestUser"

启用用户：

.. code-block:: powershell

   Enable-LocalUser -Name "TestUser"

.. note::

   以下账户操作需以管理员身份运行。

添加新用户（本地）：

.. code-block:: powershell

   New-LocalUser -Name "NewUser" -Password (Read-Host -AsSecureString "输入密码")

四、系统设置操作
----------------

设置系统时区：

.. code-block:: powershell

   Set-TimeZone -Id "China Standard Time"

查看支持的时区：

.. code-block:: powershell

   Get-TimeZone -ListAvailable

设置系统主机名（需重启生效）：

.. code-block:: powershell

   Rename-Computer -NewName "MyNewPC" -Restart

设置系统时间（需要管理员权限）：

.. code-block:: powershell

   Set-Date -Date "2025-07-22 10:30"

五、实战场景示例
----------------

示例 1：测试本机到多个目标主机的连通性
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   "192.168.1.1", "8.8.8.8", "www.baidu.com" | ForEach-Object {
       Test-Connection -ComputerName $_ -Count 2
   }

示例 2：列出当前打开的 TCP 端口（状态为 Listening）
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   Get-NetTCPConnection | Where-Object { $_.State -eq "Listen" }

示例 3：生成系统信息报告
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   $report = Get-ComputerInfo | Select-Object OSName, OSArchitecture, CsName, CsProcessors, WindowsVersion
   $report | Out-File -FilePath "C:\SystemReport.txt"
