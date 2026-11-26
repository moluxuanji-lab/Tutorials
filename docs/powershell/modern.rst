PowerShell 7.6 新特性与迁移
===========================

.. meta::
   :group: 进阶
   :summary: 认识 7.6 的 .NET 10 底座与随附模块更新，掌握 7.x 现代语法，并把 5.1 脚本安全迁移过来。

PowerShell 7.6 是当前的最新稳定版本（7.6.6），基于 .NET 10.0.12。它不是一次语法大改，而是把运行时、内置模块和安全性继续向前推进。本章梳理值得关注的更新，并给出一份可执行的迁移清单。

一、7.6 的技术底座
------------------

.. csv-table::
   :header: "项目", "版本", "意义"

   "PowerShell", "7.6.6（LTS）", "2026 年 3 月发布的长期支持版本，跨 Windows / Linux / macOS"
   "运行时", ".NET 10.0.12", "性能、TLS 与容器支持随 .NET 升级"
   "PSResourceGet", "1.2.0", "包管理已内置，无需单独安装"
   "PSReadLine", "2.4.5", "命令行编辑与预测式补全"
   "ThreadJob", "2.2.0（Microsoft.PowerShell.ThreadJob）", "轻量后台任务模块更名为 Microsoft.PowerShell.ThreadJob"

确认本机版本：

.. code-block:: powershell

   $PSVersionTable

   # 只看关键字段
   $PSVersionTable | Select-Object PSVersion, PSEdition, OS, Platform

.. note::

   Windows 自带的 ``powershell.exe`` 是 5.1，``pwsh.exe`` 才是 7.x。两者可以并存，脚本里不要假设自己运行在哪一个之上，必要时用 ``#Requires -Version 7.4`` 明确要求。

二、随附模块的变化
------------------

PSResourceGet 从 PowerShell 7.4 起随 PowerShell 提供，7.6 内置版本为 1.2.0。它与 PowerShellGet 并存，旧脚本里的 ``Install-Module`` 仍可使用，但新脚本建议直接使用 PSResource 命令：

.. code-block:: powershell

   Find-PSResource Pester
   Install-PSResource Pester -Scope CurrentUser -TrustRepository
   Get-InstalledPSResource Pester
   Update-PSResource Pester

``ThreadJob`` 的模块名发生变化：

.. code-block:: powershell

   Get-Module -ListAvailable Microsoft.PowerShell.ThreadJob | Select-Object Name, Version

   # 检查命令来自哪个模块
   Get-Command Start-ThreadJob | Select-Object Name, Source, Version

如果旧脚本里写死了 ``ThreadJob`` 模块名或依赖特定版本，需要同步更新依赖声明。

三、7.6 的具体改进
------------------

剪贴板支持分隔符
~~~~~~~~~~~~~~~~

``Get-Clipboard`` 新增 ``-Delimiter``，可以把剪贴板文本按指定分隔符拆成字符串数组，而不必只按换行拆分：

.. code-block:: powershell

   Set-Clipboard -Value "line1|line2|line3"
   Get-Clipboard -Delimiter "|"      # 输出 line1、line2、line3

拼接多个子路径
~~~~~~~~~~~~~~

``Join-Path -ChildPath`` 现在接受字符串数组，一次拼接多级路径：

.. code-block:: powershell

   Join-Path -Path "C:\Logs" -ChildPath "2026", "11", "app.log"
   # C:\Logs\2026\11\app.log

原生命令补全更可靠
~~~~~~~~~~~~~~~~~~

``Register-ArgumentCompleter`` 新增 ``-NativeFallback``：为原生命令注册兜底补全器，常规补全回退到文件系统时仍会调用它。

.. code-block:: powershell

   Register-ArgumentCompleter -Native -CommandName mycli -ParameterName env -NativeFallback -ScriptBlock {
       param($wordToComplete)
       "dev", "test", "prod" | Where-Object { $_ -like "$wordToComplete*" }
   }

四、7.x 现代语法的默认姿势
--------------------------

三元 ``? :``、空值合并 ``??`` / ``??=``、空条件访问 ``?.`` / ``?[]``、管道链 ``&&`` / ``||`` 与 ``ForEach-Object -Parallel`` 都已在“运算符与现代语法”一章给出完整示例，这里不再重复。

迁移时只需记住一条原则：**能用表达式的不要再写成多行 if**，但复杂分支仍应保留 ``if``，可读性优先于短小。

五、从 Windows PowerShell 5.1 迁移
----------------------------------

第一步永远是确认差异，而不是直接替换可执行文件：

.. code-block:: powershell

   # 5.1 中
   $PSVersionTable.PSVersion

   # 7.6 中检查模块兼容性
   Get-Module -ListAvailable | Group-Object ModuleType | Select-Object Name, Count

常见差异：

.. csv-table::
   :header: "主题", "Windows PowerShell 5.1", "PowerShell 7.6"

   "默认编码", "UTF-16LE / 系统代码页", "UTF-8 无 BOM（多数 cmdlet）"
   "WMI 命令", "Get-WmiObject", "Get-CimInstance"
   "事件日志", "Get-EventLog", "Get-WinEvent"
   "远程参数", "部分 cmdlet 自带 -ComputerName", "统一用 Invoke-Command / PSSession"
   "工作流", "PSWorkflow 模块", "已移除，改用普通脚本 + 并行"
   "CSV 类型头", "默认写入 #TYPE", "默认不写入，可加 -IncludeTypeInformation"
   "JSON 深度", "默认 2 层", "默认仍为 2 层，需显式 -Depth"
   "仅 Windows 模块", "ActiveDirectory、SqlServer 等", "需安装兼容版本或用兼容会话"

需要临时调用只在 5.1 中存在的模块时，可以创建兼容会话：

.. code-block:: powershell

   Import-Module ActiveDirectory -UseWindowsPowerShell
   $s = New-PSSession -ComputerName localhost -UseWindowsPowerShell
   Invoke-Command -Session $s -ScriptBlock { Get-ADUser -Filter * }
   Remove-PSSession $s

.. warning::

   兼容会话依赖本机安装 Windows PowerShell 5.1，且性能与错误处理都有差异。它适合过渡期，不适合作为长期架构。

六、凭据与机密管理
------------------

迁移时顺便清理硬编码密码。PowerShell 7.6 不自带机密保管库，需要安装两个模块：

.. code-block:: powershell

   Install-PSResource Microsoft.PowerShell.SecretManagement -Scope CurrentUser -TrustRepository
   Install-PSResource Microsoft.PowerShell.SecretStore -Scope CurrentUser -TrustRepository

   Register-SecretVault -Name Corp -ModuleName Microsoft.PowerShell.SecretStore -DefaultVault
   Set-Secret -Name deploy-password -Secret (Read-Host -AsSecureString)

脚本中读取：

.. code-block:: powershell

   $secure = Get-Secret -Name deploy-password -Vault Corp -AsPlainText
   $cred = [PSCredential]::new("svc_deploy", (ConvertTo-SecureString $secure -AsPlainText -Force))

.. important::

   ``-AsPlainText`` 会让机密以明文出现在内存中，只在必须传给外部程序时使用。优先让 cmdlet 直接接收 ``PSCredential`` 或 ``SecureString``。

七、升级检查清单
----------------

1. 在测试机安装 7.6.6，运行 ``$PSVersionTable`` 确认版本与平台。
2. 用 ``Invoke-ScriptAnalyzer`` 扫描现有脚本，先修掉兼容性告警。
3. 把 ``Get-WmiObject``、``Get-EventLog`` 等替换为 CIM / 新命令。
4. 检查编码相关逻辑，显式写出 ``-Encoding utf8NoBOM`` 或 ``utf8BOM``。
5. 把 ``Install-Module`` 迁移到 ``Install-PSResource``，并锁定版本。
6. 把明文密码迁移到 SecretManagement 或环境变量。
7. 为关键脚本补 Pester 用例，确认迁移前后行为一致。
8. 保留 5.1 回退路径，确认新版本稳定后再切换生产入口。

八、小结
--------

.. csv-table::
   :header: "关注点", "7.6 带来的变化", "行动"

   "运行时", ".NET 10.0.12", "验证依赖程序集与 TLS 行为"
   "包管理", "内置 PSResourceGet 1.2.0", "改用 *-PSResource 命令"
   "后台任务", "Microsoft.PowerShell.ThreadJob 2.2.0", "更新模块名与依赖声明"
   "命令体验", "Get-Clipboard -Delimiter、Join-Path 多路径", "简化现有脚本"
   "补全", "Register-ArgumentCompleter -NativeFallback", "完善 CLI 工具链体验"
   "安装包", "macOS PKG 已由微软签名并公证", "使用官方安装包重新安装"

升级不是目的，**让脚本在新运行时上更安全、更可维护**才是。按清单逐项验证，比一次性切换稳妥得多。
