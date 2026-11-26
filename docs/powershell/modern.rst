PowerShell 7.6 新特性与迁移
===========================

.. meta::
   :group: 进阶
   :summary: 了解 PowerShell 7.6 的运行时与随附模块，掌握命令改进，并将 Windows PowerShell 5.1 脚本安全迁移。

PowerShell 7.6 是当前的长期支持版本，基于 .NET 10 运行时，并更新了随附模块。它在保持兼容的同时，继续完善命令与参数补全体验。

本节将介绍以下内容：

* PowerShell 7.6 的运行时组成与内置模块。
* 7.6 中的命令与补全改进。
* 从 Windows PowerShell 5.1 迁移时的常见差异。
* 凭据与机密的管理方式，以及升级检查清单。

一、运行时与内置模块
--------------------

版本信息
~~~~~~~~

.. csv-table::
   :header: "项目", "版本", "说明"

   "PowerShell", "7.6.6（LTS）", "2026 年 3 月发布的长期支持版本，跨 Windows / Linux / macOS"
   "运行时", ".NET 10.0.12", "性能、TLS 与容器支持随 .NET 升级"
   "PSResourceGet", "1.2.0", "包管理模块已内置"
   "PSReadLine", "2.4.5", "命令行编辑与预测式补全"
   "ThreadJob", "2.2.0", "模块名变更为 Microsoft.PowerShell.ThreadJob"

确认本机版本：

.. code-block:: powershell

   $PSVersionTable

   $PSVersionTable | Select-Object PSVersion, PSEdition, OS, Platform

.. note::

   Windows 自带的 ``powershell.exe`` 是 5.1，``pwsh.exe`` 才是 7.x。两者可以并存，脚本中不应假设运行环境，必要时使用 ``#Requires -Version 7.4`` 明确要求。

随附模块
~~~~~~~~

PSResourceGet 从 PowerShell 7.4 起随 PowerShell 提供，7.6 内置版本为 1.2.0。它与 PowerShellGet 并存，旧脚本中的 ``Install-Module`` 仍可使用，新脚本建议使用 PSResource 命令：

.. code-block:: powershell

   Find-PSResource Pester
   Install-PSResource Pester -Scope CurrentUser -TrustRepository
   Get-InstalledPSResource Pester
   Update-PSResource Pester

ThreadJob 的模块名发生了变化：

.. code-block:: powershell

   Get-Module -ListAvailable Microsoft.PowerShell.ThreadJob | Select-Object Name, Version

   Get-Command Start-ThreadJob | Select-Object Name, Source, Version

如果旧脚本使用了模块限定名 ``ThreadJob\Start-ThreadJob``，应改为 ``Microsoft.PowerShell.ThreadJob\Start-ThreadJob``。

二、命令与补全改进
------------------

剪贴板
~~~~~~

``Get-Clipboard`` 新增 ``-Delimiter``，可以按指定分隔符把剪贴板文本拆分为字符串数组：

.. code-block:: powershell

   Set-Clipboard -Value "line1|line2|line3"
   Get-Clipboard -Delimiter "|"      # 输出 line1、line2、line3

路径拼接
~~~~~~~~

``Join-Path -ChildPath`` 现在接受字符串数组，可以一次拼接多级路径：

.. code-block:: powershell

   Join-Path -Path "C:\Logs" -ChildPath "2026", "11", "app.log"
   # C:\Logs\2026\11\app.log

原生命令补全
~~~~~~~~~~~~

``Register-ArgumentCompleter`` 新增 ``-NativeFallback``，可以为原生命令注册兜底补全器，在常规补全回退到文件系统时仍会调用它：

.. code-block:: powershell

   Register-ArgumentCompleter -Native -CommandName mycli -ParameterName env -NativeFallback -ScriptBlock {
       param($wordToComplete)
       "dev", "test", "prod" | Where-Object { $_ -like "$wordToComplete*" }
   }

三、现代语法概览
----------------

三元运算符、空值合并、空条件访问、管道链与并行管道已在运算符章节中介绍，本节不再重复。迁移时可以把简单的条件赋值改写为表达式：

.. code-block:: powershell

   $level = $score -ge 60 ? "及格" : "不及格"
   $port = $config.Port ?? 8080
   Test-Path .\build.ps1 && .\build.ps1

复杂分支仍应使用 ``if`` 语句，可读性优先于写法简短。

四、从 Windows PowerShell 5.1 迁移
----------------------------------

确认差异
~~~~~~~~

迁移前应先确认版本与模块情况：

.. code-block:: powershell

   # 5.1 中
   $PSVersionTable.PSVersion

   # 7.6 中检查模块类型
   Get-Module -ListAvailable | Group-Object ModuleType | Select-Object Name, Count

常见差异如下：

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

兼容会话
~~~~~~~~

需要临时调用只在 5.1 中存在的模块时，可以创建兼容会话：

.. code-block:: powershell

   Import-Module ActiveDirectory -UseWindowsPowerShell

   $s = New-PSSession -ComputerName localhost -UseWindowsPowerShell
   Invoke-Command -Session $s -ScriptBlock { Get-ADUser -Filter * }
   Remove-PSSession $s

.. warning::

   兼容会话依赖本机安装的 Windows PowerShell 5.1，性能和错误处理都存在差异。它适合过渡期使用，不适合作为长期方案。

五、凭据与机密管理
------------------

PowerShell 7.6 不自带机密保管库，需要安装 SecretManagement 与 SecretStore：

.. code-block:: powershell

   Install-PSResource Microsoft.PowerShell.SecretManagement -Scope CurrentUser -TrustRepository
   Install-PSResource Microsoft.PowerShell.SecretStore -Scope CurrentUser -TrustRepository

   Register-SecretVault -Name Corp -ModuleName Microsoft.PowerShell.SecretStore -DefaultVault
   Set-Secret -Name deploy-password -Secret (Read-Host -AsSecureString)

脚本中读取凭据：

.. code-block:: powershell

   $secure = Get-Secret -Name deploy-password -Vault Corp -AsPlainText
   $cred = [PSCredential]::new("svc_deploy", (ConvertTo-SecureString $secure -AsPlainText -Force))

.. important::

   ``-AsPlainText`` 会让机密以明文出现在内存中，只在必须传给外部程序时使用。优先让 cmdlet 直接接收 ``PSCredential`` 或 ``SecureString``。

六、升级检查清单
----------------

1. 在测试机安装 7.6.6，运行 ``$PSVersionTable`` 确认版本与平台。
2. 使用 ``Invoke-ScriptAnalyzer`` 扫描现有脚本，先修复兼容性告警。
3. 将 ``Get-WmiObject``、``Get-EventLog`` 等替换为 CIM 或新命令。
4. 检查编码相关逻辑，显式写出 ``-Encoding utf8NoBOM`` 或 ``utf8BOM``。
5. 将 ``Install-Module`` 迁移到 ``Install-PSResource``，并锁定版本。
6. 将明文密码迁移到 SecretManagement 或环境变量。
7. 为关键脚本补充 Pester 用例，确认迁移前后行为一致。
8. 保留 5.1 回退路径，确认新版本稳定后再切换生产入口。

七、小结
--------

.. csv-table::
   :header: "关注点", "7.6 带来的变化", "对应操作"

   "运行时", ".NET 10.0.12", "验证依赖程序集与 TLS 行为"
   "包管理", "内置 PSResourceGet 1.2.0", "改用 *-PSResource 命令"
   "后台任务", "Microsoft.PowerShell.ThreadJob 2.2.0", "更新模块名与依赖声明"
   "命令体验", "Get-Clipboard -Delimiter、Join-Path 多路径", "简化现有脚本"
   "补全", "Register-ArgumentCompleter -NativeFallback", "完善 CLI 工具链体验"
   "安装包", "macOS PKG 已由微软签名并公证", "使用官方安装包重新安装"

升级的目的不是更换版本号，而是让脚本在新运行时上更安全、更易维护。按清单逐项验证，比一次性切换更为稳妥。
