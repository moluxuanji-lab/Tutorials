PowerShell 错误处理、调试与测试
===============================

.. meta::
   :group: 工程化
   :summary: 读懂错误记录，主动抛出可控错误，并用断点、Pester 与静态检查建立可靠的排错闭环。

PowerShell 的错误分为终止性与非终止性，错误记录中保存了异常类型、错误分类与调用栈。掌握这些信息，才能让脚本在失败时给出可定位、可复现的线索。

本节将介绍以下内容：

* 错误记录的常用字段与读取方式。
* 使用 ``throw`` 抛出终止性错误。
* 使用 ``$Error``、错误视图与断点定位问题。
* 使用 Pester 编写回归测试，使用 PSScriptAnalyzer 做静态检查。

一、错误记录的结构
------------------

``catch`` 中的 ``$_``（也可写作 ``$PSItem``）是完整的错误记录，而不仅是一条消息：

.. code-block:: powershell

   try {
       Get-Item C:\NotExist.txt -ErrorAction Stop
   }
   catch {
       $_.Exception.GetType().FullName
       $_.Exception.Message
       $_.CategoryInfo.Activity
       $_.FullyQualifiedErrorId
       $_.ScriptStackTrace
   }

多层函数调用时，``Message`` 通常只说明失败发生在哪一步，``ScriptStackTrace`` 才能指出调用来源。记录日志时建议同时保存这两项。

需要继续执行并收集错误时，可以使用 ``-ErrorVariable``：

.. code-block:: powershell

   Get-ChildItem C:\Data -Recurse -ErrorAction SilentlyContinue `
       -ErrorVariable scanErrors

   if ($scanErrors.Count) {
       Write-Warning "有 $($scanErrors.Count) 个目录无法访问"
   }

.. warning::

   ``-ErrorAction SilentlyContinue`` 会让错误不再显示。生产脚本至少应将 ``$scanErrors`` 汇总写入日志。

二、throw 与自定义错误
----------------------

``throw`` 抛出终止性错误，错误信息应说明做了什么、期望什么、实际得到什么：

.. code-block:: powershell

   function Get-Config {
       param([string]$Path)

       if (-not (Test-Path $Path)) {
           throw "配置文件不存在：$Path"
       }

       Get-Content $Path -Raw | ConvertFrom-Json
   }

需要让调用方按错误类别处理时，可以抛出带分类的 ``ErrorRecord``：

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

   ``throw "字符串"`` 生成的是通用 ``RuntimeException``。需要精确分类时，应使用异常对象或 ``ErrorRecord``，调用方才能按类型捕获。

三、$Error 与错误视图
---------------------

当前会话中的错误都保存在 ``$Error`` 中，最近一条是 ``$Error[0]``：

.. code-block:: powershell

   $Error[0] | Format-List * -Force
   Get-Error

PowerShell 7 默认使用 ``ConciseView``，只显示关键信息。需要查看完整堆栈时，可以切换错误视图：

.. code-block:: powershell

   $ErrorView = "DetailedView"    # NormalView / CategoryView / ConciseView / DetailedView

.. tip::

   交互式排障时可以临时切换到 ``DetailedView``，退出会话后自动失效，不会影响其他环境。

四、调试方法
------------

严格模式
~~~~~~~~

.. code-block:: powershell

   Set-StrictMode -Version Latest

严格模式会禁止未初始化变量、访问不存在的属性和越界索引，把静默的 ``$null`` 变成明确错误。新脚本建议默认开启。

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

在 VS Code 中可以直接点击行号设置断点；在任意环境中也可以插入 ``Wait-Debugger``，执行到该行时自动进入调试器。

跟踪参数绑定
~~~~~~~~~~~~

管道未生效或参数未绑定时，``Trace-Command`` 可以输出完整的绑定过程：

.. code-block:: powershell

   Trace-Command -Name ParameterBinding -PSHost -Expression {
       "notepad" | Get-Process
   }

``Set-PSDebug -Trace 1`` 会逐行打印执行过程，``-Trace 2`` 还会显示变量赋值。排查完成后使用 ``Set-PSDebug -Off`` 关闭。

.. warning::

   ``Set-PSDebug -Trace 2`` 输出量较大，只适合在最小复现脚本中使用，不应直接对生产脚本开启。

五、使用 Pester 编写测试
------------------------

Pester 是 PowerShell 官方测试框架，使用 ``Describe``、``It`` 与 ``Should`` 组织用例：

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

运行测试：

.. code-block:: powershell

   Invoke-Pester .\Get-Square.Tests.ps1 -Output Detailed

修复缺陷后补充一条用例，是成本最低的回归保障方式。

六、使用 PSScriptAnalyzer 检查代码
----------------------------------

.. code-block:: powershell

   Install-PSResource PSScriptAnalyzer -Scope CurrentUser -TrustRepository
   Invoke-ScriptAnalyzer -Path .\deploy.ps1 -Severity Warning

PSScriptAnalyzer 可以发现未使用变量、危险的 ``Invoke-Expression``、不当的凭据处理等问题，适合放入提交前检查或 CI 流程。

.. note::

   PSScriptAnalyzer 是规则引擎，不是安全审计工具。它会漏报业务逻辑漏洞，也不能替代代码审查。

七、练习任务
------------

任务 1：捕获文件不存在错误并输出关键字段

.. code-block:: powershell

   try {
       Get-Item .\not-exist.txt -ErrorAction Stop
   }
   catch {
       $_.Exception.Message
       $_.ScriptStackTrace
   }

任务 2：使用 throw 校验配置文件是否存在

.. code-block:: powershell

   function Get-Config {
       param([string]$Path)

       if (-not (Test-Path $Path)) {
           throw "配置文件不存在：$Path"
       }

       Get-Content $Path -Raw | ConvertFrom-Json
   }

任务 3：为函数编写 Pester 测试

.. code-block:: powershell

   Describe "Get-Square" {
       It "返回平方值" {
           Get-Square -Number 4 | Should -Be 16
       }

       It "拒绝非整数输入" {
           { Get-Square -Number "abc" } | Should -Throw
       }
   }

任务 4：扫描脚本中的潜在问题

.. code-block:: powershell

   Invoke-ScriptAnalyzer -Path .\deploy.ps1 -Severity Warning
