PowerShell 变量和作用域
=======================

.. meta::
   :group: 进阶
   :summary: 变量定义、内置变量与 Global / Script / Local 作用域规则，以及环境变量的正确用法。

变量是任何编程语言的基础工具，在 PowerShell 中也不例外。

我们可以用变量存储数字、字符串、对象、数组、哈希表……而真正让 PowerShell 变量变得强大的，是它的 **作用域机制**。理解作用域，可以让你写出更稳定、结构更清晰的脚本，避免变量冲突或意外覆盖。

本节将带你全面认识 PowerShell 中变量的使用方式、数据类型、作用域规则以及最佳实践。

一、变量基础
------------

定义变量
~~~~~~~~

在 PowerShell 中，变量以美元符号（``$``）开头，后跟变量名。

.. code-block:: powershell

   $greeting = "Hello, PowerShell"
   $number = 100

变量赋值不需要事先声明类型，PowerShell 会自动推断数据类型。

读取变量
~~~~~~~~

直接引用变量即可读取其值：

.. code-block:: powershell

   Write-Output $greeting

还可以插入到字符串中：

.. code-block:: powershell

   Write-Output "提示信息：$greeting"

如果字符串使用单引号，则不会解析变量：

.. code-block:: powershell

   Write-Output '提示信息：$greeting'   # 输出字面值

查看变量类型：

.. code-block:: powershell

   $number.GetType()

常见变量类型举例：

.. csv-table::
   :header: "示例", "类型", "示例值"

   "$str = 'abc'", "字符串（String）", "abc"
   "$num = 123", "整数（Int32）", "123"
   "$arr = 1, 2, 3", "数组（Array）", "[1, 2, 3]"
   "$obj = Get-Process", "对象集合（Object[]）", "进程列表"
   "$hashtable = @{}", "哈希表（Hashtable）", "@{Name='Tom'; Age=30}"

二、特殊变量
------------

PowerShell 预定义了许多有用的内置变量：

.. csv-table::
   :header: "变量名", "描述"

   "$_", "管道中当前处理的对象"
   "$?", "上一个命令是否成功"
   "$LASTEXITCODE", "上一个外部程序的退出码"
   "$PSVersionTable", "PowerShell 的版本信息"
   "$env:PATH", "环境变量 PATH"

三、变量作用域概念
------------------

什么是作用域？
~~~~~~~~~~~~~~

**作用域（Scope）** 指变量在何处有效。PowerShell 支持多个作用域层级，确保变量不会被无意中覆盖。

常见作用域包括：

.. csv-table::
   :header: "作用域", "描述"

   "Global", "全局作用域，脚本或 shell 的顶层作用域"
   "Local", "当前函数或代码块中的变量（默认作用域）"
   "Script", "当前脚本文件中有效的变量"
   "Private", "当前作用域内有效，外部无法访问"

示例演示：变量作用域差异
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   $global:name = "Tom"       # 全局变量
   $name = "Alice"            # 本地变量
   function Show-Name {
       $name = "Bob"          # 函数内的局部变量
       Write-Output "函数内部：$name"
   }

   Show-Name
   Write-Output "函数外部：$name"
   Write-Output "全局变量：$global:name"

**输出结果：**

.. code-block:: text

   函数内部：Bob
   函数外部：Alice
   全局变量：Tom

显式设置作用域
~~~~~~~~~~~~~~

你可以在变量名前加作用域标识符来明确变量的可见范围：

.. code-block:: powershell

   $script:dbName = "MyDatabase"  # 仅对当前脚本可见
   $global:apiKey = "abcdef12345" # 对所有位置可用

查看当前作用域中的变量
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   Get-Variable

或者列出全局变量：

.. code-block:: powershell

   Get-Variable -Scope Global

四、常见错误与注意事项
----------------------

.. csv-table::
   :header: "问题情况", "原因与建议"

   "函数内设置的变量外部无法访问", "没有使用 global: 或 script: 显式声明"
   "同名变量被覆盖", "建议用作用域前缀区分重要变量"
   "环境变量修改未生效", "请使用 $env: 修改，并注意作用域和持久性"

五、实践示例
------------

示例 1：创建一个函数并使用全局变量作为配置
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   $global:Threshold = 80

   function Check-CPU {
       $usage = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples[0].CookedValue
       if ($usage -gt $global:Threshold) {
           Write-Output "CPU 使用率过高：$([math]::Round($usage, 2))%"
       } else {
           Write-Output "CPU 使用率正常：$([math]::Round($usage, 2))%"
       }
   }

示例 2：函数中定义变量对外不可见（局部作用域）
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   function Say-Hello {
       $message = "你好，PowerShell！"
       Write-Output $message
   }

   Say-Hello
   Write-Output $message   # 报错：$message 不存在

示例 3：使用 $env: 设置环境变量（临时）
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   $env:MY_ENV = "HelloWorld"
   Write-Output $env:MY_ENV

.. note::

   这种方式只在当前 PowerShell 会话中有效，关闭窗口后失效。

六、小结
--------

* PowerShell 使用 ``$变量名`` 定义变量，类型自动推断。
* 可存储任意数据类型，包括字符串、数组、哈希表、对象等。
* 作用域控制变量的“生存范围”，常用的有 ``Local``、``Script``、``Global``。
* 正确理解作用域有助于编写结构清晰、可维护性强的脚本。
* 内置变量和环境变量非常实用，但要注意其作用域限制。

七、练习任务
------------

任务 1：定义一个字符串变量 ``$title`` 并输出：

.. code-block:: powershell

   $title = "PowerShell 学习之旅"
   Write-Output $title

任务 2：在函数中定义变量，并尝试在函数外访问：

.. code-block:: powershell

   function Set-Message {
       $msg = "来自函数"
       Write-Output $msg
   }
   Set-Message
   Write-Output $msg   # 查看是否能访问

任务 3：设置并读取环境变量 ``APP_ENV``：

.. code-block:: powershell

   $env:APP_ENV = "Development"
   Write-Output $env:APP_ENV
