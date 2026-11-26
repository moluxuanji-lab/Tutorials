PowerShell 远程管理与并行执行
=============================

.. meta::
   :group: 进阶
   :summary: 跳过 Remoting 入门，专讲 $using:、批量会话、文件传输、SSH、并行管道与后台任务。

核心概念与实际应用章节已经介绍过 ``Enable-PSRemoting``、``Invoke-Command``、``Enter-PSSession`` 和 ``Get-Credential`` 的基本用法。本章不重复这些内容，只补**批量运维真正会遇到的问题**：变量怎么传、会话怎么复用、文件怎么搬、任务怎么并发。

一、把值带进远程脚本块
----------------------

远程脚本块运行在另一台机器上，本地变量默认不可见。用 ``$using:`` 显式传入：

.. code-block:: powershell

   $threshold = 90
   Invoke-Command -ComputerName $servers -ScriptBlock {
       Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" |
           Where-Object { ($_.FreeSpace / $_.Size) * 100 -lt $using:threshold }
   }

多个值可以用 ``-ArgumentList``，配合 ``param`` 更清晰：

.. code-block:: powershell

   Invoke-Command -ComputerName $servers -ScriptBlock {
       param($Path, $Days)
       Get-ChildItem $Path -Recurse |
           Where-Object LastWriteTime -lt (Get-Date).AddDays(-$Days)
   } -ArgumentList "C:\Logs", 7

.. note::

   ``$using:`` 在脚本块开始执行时取值，之后本地变量再变化不会同步过去。需要动态值就用 ``-ArgumentList``。

执行本地脚本文件时用 ``-FilePath``，脚本会自动分发到目标主机：

.. code-block:: powershell

   Invoke-Command -ComputerName $servers -FilePath .\collect.ps1 -ArgumentList "C:\Logs"

二、批量会话与文件传输
----------------------

一次建立多个会话，后续命令复用连接：

.. code-block:: powershell

   $sessions = New-PSSession -ComputerName $servers -ThrottleLimit 10

   Invoke-Command -Session $sessions -ScriptBlock { Get-PSDrive C }

基于会话传文件：

.. code-block:: powershell

   Copy-Item .\agent.zip -Destination C:\Temp\agent.zip -ToSession $sessions[0]
   Copy-Item C:\Temp\result.log -Destination .\result.log -FromSession $sessions[0]

用完及时释放，避免占用目标主机资源：

.. code-block:: powershell

   Remove-PSSession -Session $sessions

.. tip::

   默认并发是 32。管理大量主机时用 ``-ThrottleLimit`` 主动限制，比等到目标机器拒绝连接更可控。

三、SSH Remoting
----------------

跨平台环境优先用 SSH。目标主机需启用 OpenSSH Server，客户端使用密钥或 ssh-agent 认证：

.. code-block:: powershell

   $linux = New-PSSession -HostName 10.0.0.21 -UserName ops

   Invoke-Command -Session $linux -ScriptBlock {
       uname -a
       systemctl is-active nginx
   }

   Remove-PSSession $linux

.. important::

   SSH 连接使用 ``-UserName``，不要写成 ``-User``；``-HostName`` 会自动选择 SSH 传输，无需额外开关。

四、本地并行：ForEach-Object -Parallel
--------------------------------------

远程解决“多台机器”，并行解决“单机多任务”。PowerShell 7 的 ``-Parallel`` 写法最直接：

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

需要引用外部变量时同样用 ``$using:``：

.. code-block:: powershell

   $token = $env:API_TOKEN
   $urls | ForEach-Object -Parallel {
       Invoke-RestMethod -Uri $_ -Headers @{ Authorization = "Bearer $using:token" }
   } -ThrottleLimit 8

.. warning::

   并行块之间不共享变量，返回的也是反序列化对象。不要在块里直接修改外部变量，应把结果汇总后统一处理。

五、后台任务：ThreadJob 与 Start-Job
------------------------------------

需要“发起后先做别的事”时，用后台任务：

.. code-block:: powershell

   $job = Start-ThreadJob -ScriptBlock {
       Start-Sleep -Seconds 30
       "扫描完成"
   }

   Get-Job
   $job | Wait-Job | Receive-Job
   $job | Remove-Job

.. csv-table::
   :header: "方式", "进程模型", "适用场景"

   "ForEach-Object -Parallel", "线程", "无状态批处理，写法最简单"
   "Start-ThreadJob", "线程", "轻量、启动快；7.6 模块名为 Microsoft.PowerShell.ThreadJob"
   "Start-Job", "独立进程", "隔离性最好，但启动慢、对象需序列化"
   "Invoke-Command -AsJob", "远程任务", "批量远程执行后异步收取结果"

.. note::

   ``Start-Job`` 启动的是独立 PowerShell 进程，函数和模块不会自动带过去。能用 ``ThreadJob`` 或 ``-Parallel`` 时优先用它们。

六、安全边界与凭据
------------------

自动化场景不要硬编码密码。交互式可以用 ``Get-Credential``，无人值守则从 SecretManagement 读取：

.. code-block:: powershell

   $cred = [PSCredential]::new(
       "svc_deploy",
       (Get-Secret -Name deploy-password -Vault Corp)
   )
   Invoke-Command -ComputerName Server01 -Credential $cred -ScriptBlock { hostname }

其他必须遵守的边界：

* 使用最小权限账户，避免直接用域管理员执行日常脚本。
* Windows 优先使用 HTTPS 监听器（5986）并配置可信证书，不依赖 ``TrustedHosts``。
* 关键变更先用只读命令或 ``-WhatIf`` 验证，再批量执行。
* 对输出做脱敏，凭据与令牌不要进入日志、转录文件或工单。
* 远程执行失败时，先查 ``PSComputerName`` 与错误流，不要盲目重试全部主机。

.. warning::

   把凭据作为普通字符串传进 ``-ScriptBlock`` 会让它在远程主机的进程内存中以明文存在。优先把 ``PSCredential`` 作为参数传入，或在目标端使用托管身份。

七、小结
--------

.. csv-table::
   :header: "需求", "首选方案", "关键参数"

   "传值进远程块", "Invoke-Command", "$using: / -ArgumentList"
   "执行本地脚本", "Invoke-Command -FilePath", "-ArgumentList"
   "复用连接", "New-PSSession + -Session", "Remove-PSSession 收尾"
   "传文件", "Copy-Item -ToSession / -FromSession", "会话对象"
   "Linux 主机", "New-PSSession -HostName", "-UserName + SSH 密钥"
   "单机并发", "ForEach-Object -Parallel", "-ThrottleLimit / $using:"
   "后台长任务", "Start-ThreadJob", "Wait-Job / Receive-Job"

记住两条边界：远程块里是**另一台机器的会话**，并行块里是**另一条执行线程**。把变量传递、输出序列化和权限想清楚，批量运维才不会变成批量事故。
