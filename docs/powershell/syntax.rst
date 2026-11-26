PowerShell 基本语法
===================

.. meta::
   :group: 核心概念
   :summary: 变量、数据类型、运算符、条件与循环、函数、错误处理——一次掌握脚本语言基石。

PowerShell 不只是一个命令行工具，它还是一个完整的脚本语言。学习它的基本语法，就像学习一门新的编程语言一样，是入门的重要一步。

本节将详细介绍 PowerShell 中最基本的语法元素，包括变量、注释、数据类型、运算符、条件判断、循环结构等，为后续编写脚本打下扎实基础。

一、注释
--------

PowerShell 中的注释与大多数编程语言相似，用于解释代码，不会被执行。

单行注释使用 ``#`` 开头：

.. code-block:: powershell

   # 这是一个单行注释
   Write-Output "Hello, PowerShell"

多行注释使用 ``<#`` 和 ``#>`` 包裹：

.. code-block:: powershell

   <#
   这是多行注释
   可用于文档说明
   #>

二、变量
--------

定义变量
~~~~~~~~

PowerShell 中变量以美元符号（``$``）开头，无需事先声明类型：

.. code-block:: powershell

   $name = "Alice"
   $age = 25

使用变量
~~~~~~~~

.. code-block:: powershell

   Write-Output "Name: $name"

也可以使用字符串插值：

.. code-block:: powershell

   Write-Output "User: $($name), Age: $($age)"

三、数据类型
------------

PowerShell 是动态类型语言：变量无需声明类型，但每个值背后都有确定的 .NET 类型。

.. csv-table::
   :header: "类型", "示例"

   "字符串", "$str = 'Hello'"
   "整数", "$num = 123"
   "小数", "$pi = 3.14"
   "布尔值", "$isTrue = $true"
   "数组", "$arr = @(1, 2, 3)"
   "哈希表", "$h = @{Name='Tom'; Age=30}"

可以使用 ``.GetType()`` 查看变量类型：

.. code-block:: powershell

   $str.GetType().Name   # String

四、运算符
----------

.. csv-table::
   :header: "类别", "示例", "说明"

   "算术运算", "+ - * / %", "常见数学运算"
   "比较运算", "-eq -ne -lt -gt", "等于、不等于、小于、大于"
   "逻辑运算", "-and -or -not", "逻辑运算符"
   "字符串", "-like -match -replace", "模式匹配和替换"
   "包含运算", "-in -contains", "集合判断"

示例：

.. code-block:: powershell

   5 -eq 5              # True
   "abc" -like "a*"     # True

五、条件判断
------------

if 语句
~~~~~~~

.. code-block:: powershell

   if ($age -ge 18) {
       Write-Output "成年人"
   } else {
       Write-Output "未成年人"
   }

if-elseif-else
~~~~~~~~~~~~~~

.. code-block:: powershell

   if ($score -ge 90) {
       "优秀"
   } elseif ($score -ge 60) {
       "及格"
   } else {
       "不及格"
   }

六、循环结构
------------

for 循环
~~~~~~~~

.. code-block:: powershell

   for ($i = 1; $i -le 5; $i++) {
       Write-Output "第 $i 次循环"
   }

foreach 循环
~~~~~~~~~~~~

.. code-block:: powershell

   $colors = @("Red", "Green", "Blue")
   foreach ($color in $colors) {
       Write-Output "颜色：$color"
   }

while 循环
~~~~~~~~~~

.. code-block:: powershell

   $count = 0
   while ($count -lt 3) {
       Write-Output $count
       $count++
   }

七、函数定义
------------

PowerShell 允许自定义函数，语法如下：

.. code-block:: powershell

   function Say-Hello {
       param([string]$name)
       Write-Output "Hello, $name!"
   }

   Say-Hello -name "PowerShell"

也可以使用简洁写法：

.. code-block:: powershell

   function Square($x) { return $x * $x }
   Square 5   # 输出 25

八、错误处理
------------

使用 ``try {}``、``catch {}`` 块来处理可能出错的语句：

.. code-block:: powershell

   try {
       Get-Item "C:\NotExist.txt" -ErrorAction Stop
   } catch {
       Write-Output "找不到文件"
   }

九、脚本文件基本格式
--------------------

PowerShell 脚本文件使用 ``.ps1`` 后缀名，可以使用 VS Code 或记事本创建：

.. code-block:: powershell

   # hello.ps1
   $name = "World"
   Write-Output "Hello, $name"

在 PowerShell 中运行：

.. code-block:: powershell

   .\hello.ps1

.. note::

   如果脚本未能执行，请检查执行策略（``Get-ExecutionPolicy``），必要时使用 ``Set-ExecutionPolicy`` 允许运行脚本。
