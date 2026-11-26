PowerShell 错误处理、调试与测试
===============================

.. meta::
   :group: 工程化
   :summary: 在已掌握 try/catch 的基础上，补错误记录、throw、$Error、断点调试、Pester 与静态检查。

控制流一章已经讲过 ``try / catch / finally``、类型化 ``catch``、``-ErrorAction Stop`` 和 ``$ErrorActionPreference``。本章不再重复这些语法，只回答三个工程问题：**错误里有什么、怎么定位、怎么防止回归**。

一、catch 里的错误记录
----------------------

``catch`` 中的 ``$_``（也可写 ``$PSItem``）不只是一条消息，而是完整的 ``ErrorRecord``：

.. code-block:: powershell

   try {
       Get-Item C:\NotExist.txt -ErrorAction Stop
   }
   catch {
       $_.Exception.GetType().FullName     # System.Management.Automation.ItemNotFoundException
       $_.Exception.Message
       $_.CategoryInfo.Activity
       $_.FullyQualifiedErrorId
       $_.ScriptStackTrace
   }

多层函数调用时，``Message`` 往往只说明“失败在哪一步”，``ScriptStackTrace`` 才能指出“从哪一行调过来的”。记录日志时建议同时保存这两项。

需要“继续执行但收集错误”时，用 ``-ErrorVariable``：

.. code-block:: powershell

   Get-ChildItem C:\Data -Recurse -ErrorAction SilentlyContinue `
       -ErrorVariable scanErrors

   if ($scanErrors.Count) {
       Write-Warning "有 $($scanErrors.Count) 个目录无法访问"
   }

.. warning::

   ``-ErrorAction SilentlyContinue`` 会让问题彻底消失。生产脚本至少要把 ``$scanErrors`` 汇总写入日志。

二、throw 与自定义终止性错误
----------------------------

``throw`` 抛出的是终止性错误，信息应包含“做了什么、期望什么、实际得到什么”：

.. code-block:: powershell

   function Get-Config {
       param([string]$Path)

       if (-not (Test-Path $Path)) {
           throw "配置文件不存在：$Path"
       }

       Get-Content $Path -Raw | ConvertFrom-Json
   }

需要让调用方按错误类别处理时，抛出带分类的 ``ErrorRecord``：

.. code-block:: powershell

   $PSCmdlet.ThrowTerminatingError(
       [System.Management.Automation.ErrorRecord]::new(
           [System.IO.FileNotFoundException]::new("找不到 $Path"),
           "ConfigNotFound",
           [System.Management.Automation.ErrorCategory]::ObjectNotFound,
           $Path
       )
   )

.. note::

   ``throw "字符串"`` 生成的是通用 ``RuntimeException``。需要精确分类时用异常对象或 ``ErrorRecord``，调用方才能写 ``catch [System.IO.FileNotFoundException]``。

三、$Error、Get-Error 与错误视图
--------------------------------

当前会话的错误都保存在 ``$Error`` 中，最近一条是 ``$Error[0]``：

.. code-block:: powershell

   $Error[0] | Format-List * -Force
   Get-Error

PowerShell 7 默认使用 ``ConciseView``，只显示关键信息。需要完整堆栈时切换视图：

.. code-block:: powershell

   $ErrorView = "DetailedView"    # NormalView / CategoryView / ConciseView / DetailedView

.. tip::

   交互式排障时临时切到 ``DetailedView``，退出会话即失效，不会污染其他环境。

四、调试：从“猜”变成“看”
--------------------------

严格模式
~~~~~~~~

.. code-block:: powershell

   Set-StrictMode -Version Latest

它会禁止未初始化变量、访问不存在的属性、越界索引，把静默的 ``$null`` 变成明确错误。新脚本建议默认开启。

会话转录
~~~~~~~~

.. code-block:: powershell

   Start-Transcript -Path .\debug.log
   # ... 复现问题 ...
   Stop-Transcript

断点
~~~~

.. code-block:: powershell

   Set-PSBreakpoint -Script .\deploy.ps1 -Line 42
   Get-PSBreakpoint
   Remove-PSBreakpoint -Id 0

VS Code 中可直接点击行号设置断点；任意环境里也可以插入 ``Wait-Debugger``，执行到该行自动进入调试器。

跟踪参数绑定
~~~~~~~~~~~~

管道没生效、参数没绑上时，``Trace-Command`` 能直接给出绑定过程：

.. code-block:: powershell

   Trace-Command -Name ParameterBinding -PSHost -Expression {
       "notepad" | Get-Process
   }

``Set-PSDebug -Trace 1`` 逐行打印执行过程，``-Trace 2`` 还会显示变量赋值；排查完用 ``Set-PSDebug -Off`` 关闭。

.. warning::

   ``Set-PSDebug -Trace 2`` 输出量极大，只适合在最小复现脚本上使用，不要直接对着生产脚本开启。

五、Pester：把问题变成回归测试
------------------------------

Pester 是 PowerShell 官方测试框架。安装后按 ``Describe / Context / It / Should`` 组织用例：

.. code-block:: powershell

   Install-PSResource Pester -Scope CurrentUser -TrustRepository

   # Get-Square.Tests.ps1
   BeforeAll {
       . $PSScriptRoot\Get-Square.ps1
   }

   Describe "Get-Square" {
       It "返回平方值" {
           Get-Square -Number 4 | Should -Be 16
       }

       It "拒绝非整数输入" {
           { Get-Square -Number "abc" } | Should -Throw
       }
   }

运行：

.. code-block:: powershell

   Invoke-Pester .\Get-Square.Tests.ps1 -Output Detailed

修复一个 bug 后补一条用例，是最划算的工程习惯。

六、PSScriptAnalyzer：运行前的静态检查
--------------------------------------

.. code-block:: powershell

   Install-PSResource PSScriptAnalyzer -Scope CurrentUser -TrustRepository
   Invoke-ScriptAnalyzer -Path .\deploy.ps1 -Severity Warning

它能发现未使用变量、危险的 ``Invoke-Expression``、不当的凭据处理等问题。可以把它放进提交前检查或 CI 流程。

.. note::

   PSScriptAnalyzer 是规则引擎，不是安全审计工具。它会漏报业务逻辑漏洞，也不能替代代码审查。

七、小结
--------

.. csv-table::
   :header: "场景", "推荐做法"

   "读取错误细节", "$_.Exception / ScriptStackTrace"
   "保留错误但继续", "-ErrorAction SilentlyContinue -ErrorVariable"
   "主动失败", "throw 或 $PSCmdlet.ThrowTerminatingError"
   "查看历史错误", "$Error / Get-Error / $ErrorView"
   "逐行定位", "断点 / Wait-Debugger / Trace-Command"
   "防止回归", "Pester 用例"
   "代码质量", "Invoke-ScriptAnalyzer"

错误处理的目标不是“让错误消失”，而是让失败**可控、可观测、可复现**。做到这三点，脚本才算真正可靠。
