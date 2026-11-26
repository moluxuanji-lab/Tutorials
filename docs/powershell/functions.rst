PowerShell 函数与脚本组织
=========================

.. meta::
   :group: 工程化
   :summary: 跳过函数定义基础，专注高级函数、参数验证、begin/process/end、ShouldProcess 与脚本结构。

基本语法和脚本编写章节已经讲过 ``function``、``param``、``return`` 和函数作用域。本章不再重复这些基础，而是讲**怎么把函数写成和内置 Cmdlet 一样可靠**。

一、[CmdletBinding()]：高级函数的开关
-------------------------------------

在函数体第一行加上 ``[CmdletBinding()]``，函数立刻获得通用参数与完整的参数绑定机制：

.. code-block:: powershell

   function Get-DiskFree {
       [CmdletBinding()]
       param(
           [Parameter(Mandatory, Position = 0)]
           [string]$Drive = "C"
       )

       Write-Verbose "查询驱动器 $Drive"
       Get-PSDrive -Name $Drive |
           Select-Object Name,
               @{ n = "FreeGB"; e = { [math]::Round($_.Free / 1GB, 2) } }
   }

与普通函数相比，多了这些能力：

.. csv-table::
   :header: "能力", "体现"

   "通用参数", "-Verbose / -Debug / -ErrorAction / -ErrorVariable"
   "严格参数绑定", "未知参数直接报错，而不是被忽略"
   "管道输入", "ValueFromPipeline / ValueFromPipelineByPropertyName"
   "确认与演练", "-WhatIf / -Confirm（配合 ShouldProcess）"
   "$PSCmdlet", "访问当前命令的运行时上下文"

.. note::

   高级函数不能再用 ``function Foo($a, $b) { }`` 的简写形式，参数必须写在 ``param()`` 块里。

二、参数验证：把错误挡在函数外
------------------------------

绑定阶段就校验参数，比在函数体里写一堆 ``if`` 清晰得多：

.. code-block:: powershell

   function Set-ServiceState {
       [CmdletBinding()]
       param(
           [Parameter(Mandatory, ValueFromPipelineByPropertyName)]
           [Alias("Name", "ServiceName")]
           [string]$Service,

           [Parameter(Mandatory)]
           [ValidateSet("Running", "Stopped", "Paused")]
           [string]$State,

           [ValidateRange(1, 60)]
           [int]$TimeoutSeconds = 30
       )

       Write-Verbose "将 $Service 切换到 $State"
   }

常用验证特性：

.. csv-table::
   :header: "特性", "作用"

   "ValidateSet", "限定可选值，并提供 Tab 补全"
   "ValidateRange", "限定数值范围"
   "ValidatePattern", "用正则校验格式"
   "ValidateLength", "限定字符串长度"
   "ValidateNotNullOrEmpty", "禁止空值与空字符串"
   "ValidateScript", "用脚本块自定义校验"

参数还可以通过 ``ParameterSetName`` 分组，做出“同一函数两套用法”的效果：

.. code-block:: powershell

   param(
       [Parameter(Mandatory, ParameterSetName = "ByName")]
       [string]$Name,

       [Parameter(Mandatory, ParameterSetName = "ById")]
       [int]$Id
   )

三、begin / process / end：正确处理流式输入
-------------------------------------------

.. code-block:: powershell

   function Measure-LineCount {
       [CmdletBinding()]
       param(
           [Parameter(ValueFromPipeline)]
           [string]$Line
       )

       begin {
           $count = 0
       }

       process {
           if ($Line) { $count++ }
       }

       end {
           "共 $count 行"
       }
   }

   Get-Content .\app.log | Measure-LineCount

执行顺序是：``begin`` 一次 → 每个管道元素执行一次 ``process`` → ``end`` 一次。需要累积状态时，变量必须在 ``begin`` 中初始化。

.. warning::

   只写 ``param`` 和函数体、不写 ``process`` 时，管道输入只绑定一次，函数体相当于 ``end``。这是“管道看起来没生效”的最常见原因。

四、输出流：数据与提示要分开
----------------------------

PowerShell 函数里所有未被捕获的输出都会进入管道，因此要区分“数据”和“给人看的提示”：

.. code-block:: powershell

   function Test-Endpoint {
       [CmdletBinding()]
       [OutputType([bool])]
       param([string]$Uri)

       try {
           $resp = Invoke-WebRequest $Uri -TimeoutSec 5 -ErrorAction Stop
           Write-Verbose "状态码：$($resp.StatusCode)"
           return $resp.StatusCode -eq 200
       }
       catch {
           Write-Warning "请求失败：$Uri"
           return $false
       }
   }

.. csv-table::
   :header: "写法", "进入管道", "用途"

   "Write-Output / 直接输出", "是", "返回数据"
   "Write-Verbose", "否（详细流）", "调试信息，-Verbose 才显示"
   "Write-Warning", "否（警告流）", "可恢复的异常情况"
   "Write-Error", "否（错误流）", "非终止性错误"
   "Write-Host", "否（信息流）", "纯展示，不应作为数据返回"
   "Write-Information", "否（信息流）", "结构化提示，可被 -InformationAction 控制"

需要精确控制输出对象时，使用 ``$PSCmdlet.WriteObject($value)``；``[OutputType()]`` 则是给使用者和工具看的声明，不会强制转换类型。

五、ShouldProcess：免费获得 -WhatIf
-----------------------------------

涉及修改的函数应实现 ``SupportsShouldProcess``：

.. code-block:: powershell

   function Remove-OldLog {
       [CmdletBinding(SupportsShouldProcess, ConfirmImpact = "High")]
       param(
           [Parameter(Mandatory)]
           [string]$Path,
           [int]$Days = 30
       )

       $files = Get-ChildItem $Path -Filter *.log |
           Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$Days) }

       foreach ($file in $files) {
           if ($PSCmdlet.ShouldProcess($file.FullName, "删除过期日志")) {
               Remove-Item $file.FullName -Force
           }
       }
   }

.. code-block:: powershell

   Remove-OldLog -Path C:\Logs -Days 7 -WhatIf     # 只显示将要做什么
   Remove-OldLog -Path C:\Logs -Days 7 -Confirm    # 逐项确认

六、脚本结构：让脚本可移植、可测试
----------------------------------

推荐的单文件脚本骨架：

.. code-block:: powershell

   #Requires -Version 7.4
   [CmdletBinding()]
   param(
       [string]$ConfigPath = "$PSScriptRoot\config.json"
   )

   Set-StrictMode -Version Latest
   $ErrorActionPreference = "Stop"

   function Invoke-Main {
       Write-Verbose "读取配置：$ConfigPath"
       Get-Content $ConfigPath -Raw | ConvertFrom-Json
   }

   Invoke-Main

要点：

* ``$PSScriptRoot`` 指向脚本所在目录，不依赖调用者的当前目录。
* 主逻辑封装成函数，脚本末尾只留一行调用，方便被测试代码点源加载。
* 公共函数抽到 ``.psm1`` 模块中，用 ``Import-Module`` 引用；点源 ``. .\lib.ps1`` 只适合临时共享。
* 写脚本时使用完整命令名，不要依赖交互式别名。

.. tip::

   ``Set-StrictMode -Version Latest`` 能让未定义变量、访问不存在的属性尽早报错。新脚本建议默认开启，老脚本可以逐步启用。

七、给参数加补全
----------------

.. code-block:: powershell

   function Connect-Env {
       param(
           [ArgumentCompleter({
               param($commandName, $parameterName, $wordToComplete)
               "dev", "test", "prod" |
                   Where-Object { $_ -like "$wordToComplete*" } |
                   ForEach-Object { [System.Management.Automation.CompletionResult]::new($_) }
           })]
           [string]$Environment
       )
       "连接到 $Environment"
   }

PowerShell 7.6 的 ``Register-ArgumentCompleter`` 新增 ``-NativeFallback``，可以让原生命令的补全器在文件补全回退机制下依然生效。

八、小结
--------

.. csv-table::
   :header: "主题", "关键写法", "解决的问题"

   "高级函数", "[CmdletBinding()]", "通用参数与严格绑定"
   "参数校验", "ValidateSet / ValidateRange", "非法输入提前失败"
   "流式处理", "begin / process / end", "正确消费管道输入"
   "输出分层", "Write-Verbose / Write-Warning", "数据不被提示污染"
   "安全变更", "SupportsShouldProcess", "免费获得 -WhatIf / -Confirm"
   "脚本骨架", "$PSScriptRoot + 主函数", "可移植、可测试"
   "参数补全", "ArgumentCompleter", "提升使用体验"

判断函数写得好不好，标准很简单：别人不看实现，也能从参数和帮助里正确使用它。
