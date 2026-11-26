PowerShell 远程管理与并行执行
=============================

.. meta::
   :group: 进阶
   :summary: 使用 PSSession、$using:、SSH 与 ForEach-Object -Parallel 完成批量远程运维与本地并发任务。

PowerShell Remoting 可以在多台主机上执行命令，本地并行则能在单机内同时处理多个任务。两者都会涉及变量传递、会话生命周期与结果序列化。

本节将介绍以下内容：

* 在远程脚本块中传递变量与参数。
* 建立批量会话并传输文件。
* 通过 SSH 管理 Linux 与 macOS 主机。
* 使用 ``ForEach-Object -Parallel`` 与后台任务执行并发操作。

一、远程脚本块中的变量传递
--------------------------

远程脚本块运行在另一台主机上，本地变量默认不可见。需要使用 ``$using:`` 显式传入：

.. code-block:: powershell

   $threshold = 90
   Invoke-Command -ComputerName $servers -ScriptBlock {
       Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" |
           Where-Object { ($_.FreeSpace / $_.Size) * 100 -lt $using:threshold }
   }

需要传递多个值时，可以使用 ``-ArgumentList`` 配合 ``param``：

.. code-block:: powershell

   Invoke-Command -ComputerName $servers -ScriptBlock {
       param($Path, $Days)
       Get-ChildItem $Path -Recurse |
           Where-Object LastWriteTime -lt (Get-Date).AddDays(-$Days)
   } -ArgumentList "C:\Logs", 7

.. note::

   ``$using:`` 在脚本块开始执行时取值，之后本地变量的变化不会同步过去。需要动态值时，应使用 ``-ArgumentList``。

执行本地脚本文件时使用 ``-FilePath``，脚本会自动分发到目标主机：

.. code-block:: powershell

   Invoke-Command -ComputerName $servers -FilePath .\collect.ps1 -ArgumentList "C:\Logs"

二、批量会话与文件传输
----------------------

一次建立多个会话，后续命令可以复用连接：

.. code-block:: powershell

   $sessions = New-PSSession -ComputerName $servers -ThrottleLimit 10

   Invoke-Command -Session $sessions -ScriptBlock { Get-PSDrive C }

基于会话传输文件：

.. code-block:: powershell

   Copy-Item .\agent.zip -Destination C:\Temp\agent.zip -ToSession $sessions[0]
   Copy-Item C:\Temp\result.log -Destination .\result.log -FromSession $sessions[0]

完成后及时释放会话，避免占用目标主机资源：

.. code-block:: powershell

   Remove-PSSession -Session $sessions

.. tip::

   ``Invoke-Command`` 的默认并发数是 32。管理大量主机时应使用 ``-ThrottleLimit`` 主动限制并发，避免目标主机拒绝连接。

三、SSH 远程连接
----------------

跨平台环境优先使用 SSH。目标主机需要启用 OpenSSH Server，客户端使用密钥或 ssh-agent 认证：

.. code-block:: powershell

   $linux = New-PSSession -HostName 10.0.0.21 -UserName ops

   Invoke-Command -Session $linux -ScriptBlock {
       uname -a
       systemctl is-active nginx
   }

   Remove-PSSession $linux

.. important::

   SSH 连接使用 ``-UserName`` 参数；``-HostName`` 会自动选择 SSH 传输，无需额外开关。

四、本地并行处理
----------------

远程用于管理多台机器，并行用于单机多任务。PowerShell 7 的 ``ForEach-Object -Parallel`` 可以直接并发处理管道元素：

.. code-block:: powershell

   $urls = 1..10 | ForEach-Object { "https://example.com/item/$_" }

   $urls | ForEach-Object -Parallel {
       $u = $_
       try {
           (Invoke-WebRequest -Uri $u -TimeoutSec 10).StatusCode
       }
       catch {
           "失败：$u"
       }
   } -ThrottleLimit 5

需要引用外部变量时同样使用 ``$using:``：

.. code-block:: powershell

   $token = $env:API_TOKEN
   $urls | ForEach-Object -Parallel {
       Invoke-RestMethod -Uri $_ -Headers @{ Authorization = "Bearer $using:token" }
   } -ThrottleLimit 8

.. warning::

   并行块之间不共享变量，返回的也是反序列化对象。不应在块内直接修改外部变量，而应汇总结果后统一处理。

五、后台任务
------------

需要先发起任务、稍后收取结果时，可以使用后台任务：

.. code-block:: powershell

   $job = Start-ThreadJob -ScriptBlock {
       Start-Sleep -Seconds 30
       "扫描完成"
   }

   Get-Job
   $job | Wait-Job | Receive-Job
   $job | Remove-Job

常见任务方式的对比如下：

.. csv-table::
   :header: "方式", "进程模型", "适用场景"

   "ForEach-Object -Parallel", "线程", "无状态批处理，写法简单"
   "Start-ThreadJob", "线程", "轻量、启动快；7.6 模块名为 Microsoft.PowerShell.ThreadJob"
   "Start-Job", "独立进程", "隔离性最好，但启动慢、对象需序列化"
   "Invoke-Command -AsJob", "远程任务", "批量远程执行后异步收取结果"

.. note::

   ``Start-Job`` 启动的是独立 PowerShell 进程，函数和模块不会自动带过去。可以使用 ``ThreadJob`` 或 ``-Parallel`` 时，应优先选择它们。

六、凭据与安全
--------------

无人值守脚本不应硬编码密码，可以使用 SecretManagement 读取保管的凭据：

.. code-block:: powershell

   $cred = [PSCredential]::new(
       "svc_deploy",
       (Get-Secret -Name deploy-password -Vault Corp)
   )
   Invoke-Command -ComputerName Server01 -Credential $cred -ScriptBlock { hostname }

其他安全要点：

* 使用最小权限账户，避免直接用域管理员执行日常脚本。
* Windows 优先使用 HTTPS 监听器（5986）并配置可信证书，不依赖 ``TrustedHosts``。
* 关键变更先使用只读命令或 ``-WhatIf`` 验证，再批量执行。
* 对输出做脱敏，凭据与令牌不应进入日志、转录文件或工单。
* 远程执行失败时，先检查 ``PSComputerName`` 与错误流，再决定是否重试。

.. warning::

   将凭据作为普通字符串传入 ``-ScriptBlock``，会让它在远程主机的进程内存中以明文存在。应将 ``PSCredential`` 作为参数传入，或在目标端使用托管身份。

七、小结
--------

.. csv-table::
   :header: "需求", "首选方案", "关键参数"

   "传值到远程块", "Invoke-Command", "$using: / -ArgumentList"
   "执行本地脚本", "Invoke-Command -FilePath", "-ArgumentList"
   "复用连接", "New-PSSession + -Session", "Remove-PSSession 收尾"
   "传输文件", "Copy-Item -ToSession / -FromSession", "会话对象"
   "Linux 主机", "New-PSSession -HostName", "-UserName + SSH 密钥"
   "单机并发", "ForEach-Object -Parallel", "-ThrottleLimit / $using:"
   "后台长任务", "Start-ThreadJob", "Wait-Job / Receive-Job"

远程块运行在另一台机器的会话中，并行块运行在另一条执行线程中。理解变量传递、输出序列化和权限边界，批量运维才能保持可控。
