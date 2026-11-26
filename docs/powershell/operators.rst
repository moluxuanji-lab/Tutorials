PowerShell 运算符与现代语法
===========================

.. meta::
   :group: 核心概念
   :summary: 掌握比较、正则、格式化、空值与管道链等运算符，并了解 PowerShell 7 引入的新语法。

PowerShell 的运算符既包含算术、比较和逻辑运算，也包含正则匹配、空值合并与管道链等专用语法。编写脚本时，常见问题往往不是“不会用运算符”，而是忽略了大小写规则、集合方向或默认行为。

本节将介绍以下内容：

* 比较运算符的大小写规则与集合判断方向。
* 正则匹配、替换与字符串拆分。
* 格式化、类型转换与空值处理。
* 三元运算符、管道链与调用运算符。

一、比较运算符的细节
--------------------

比较运算符默认不区分大小写。需要区分时加 ``c`` 前缀，需要强制忽略时加 ``i`` 前缀：

.. code-block:: powershell

   "ABC" -eq "abc"      # True
   "ABC" -ceq "abc"     # False
   "ABC" -ieq "abc"     # True

集合判断的方向
~~~~~~~~~~~~~~

``-contains`` 用于判断集合是否包含某个元素，``-in`` 用于判断元素是否属于集合：

.. code-block:: powershell

   $names = @("Alice", "Bob", "Carol")

   $names -contains "Bob"     # 集合在前
   "Bob" -in $names           # 元素在前

在 PowerShell 7 中，比较运算符还可以直接筛选左侧集合：

.. code-block:: powershell

   1..10 -gt 7                # 8 9 10
   "a", "b", "c" -like "a*"   # a

.. note::

   集合比较返回的是满足条件的元素，而不是布尔值。作为 ``if`` 条件时，需要注意结果是否为空集合。

二、正则匹配与替换
------------------

``-match`` 使用 .NET 正则表达式，匹配成功后会把结果写入自动变量 ``$Matches``：

.. code-block:: powershell

   if ("user_2024.log" -match "user_(\d+)") {
       "年份：" + $Matches[1]
   }

``-replace`` 的语法是 ``-replace 模式, 替换内容``，替换串中可以用 ``$1``、``$2`` 引用捕获组：

.. code-block:: powershell

   "2026-11-26" -replace "(\d{4})-(\d{2})-(\d{2})", '$3/$2/$1'
   "C:\Temp\a.txt" -replace "\\", "/"

.. warning::

   ``$Matches`` 保存的是上一次成功匹配的结果。在循环中多次匹配时，它会被覆盖，应及时取值。

字符串拆分与拼接
~~~~~~~~~~~~~~~~

``-split`` 支持正则表达式，``-join`` 用于反向拼接：

.. code-block:: powershell

   "a  b   c" -split "\s+"        # a b c
   "a,b,c" -split ",", 2          # 只拆成 2 段
   @("a", "b", "c") -join "-"     # a-b-c

三、格式化与范围
----------------

``-f`` 是字符串格式化运算符，等价于 .NET 的 ``String.Format``：

.. code-block:: powershell

   "{0} 的 CPU 是 {1:N1}%" -f "chrome", 12.345   # chrome 的 CPU 是 12.3%
   "{0:D3}" -f 7                                  # 007

范围运算符 ``..`` 用于生成连续整数或单字符序列：

.. code-block:: powershell

   1..5
   5..1
   "a".."e"

.. tip::

   ``..`` 不能直接生成日期序列。日期应使用 ``for`` 循环配合 ``AddDays()``，或用 ``while`` 控制。

四、类型判断与转换
------------------

.. code-block:: powershell

   5 -is [int]              # True
   "abc" -is [string]       # True

   [int]"42"                # 42
   "abc" -as [int]          # $null，不抛异常
   "2026-11-26" -as [datetime]

``-as`` 适合转换失败也不希望中断的场景；需要严格失败时使用强制转换 ``[int]``，它会抛出终止性错误，可以被 ``try/catch`` 捕获。

五、空值运算符
--------------

PowerShell 7 提供了空值合并与空条件访问运算符，可以减少防御式判断：

.. code-block:: powershell

   $name = $null
   $display = $name ?? "匿名用户"     # 匿名用户

   $config = @{}
   $config.Port ??= 8080              # 仅在为空时赋值
   $config.Port                       # 8080

   $user = $null
   $user?.Name                        # 不报错，返回 $null
   $list = @(1, 2, 3)
   $list?[0]                          # 1

.. note::

   ``?.`` 只处理对象为 ``$null`` 的情况，不会掩盖索引越界等真实错误。集合边界仍需自行校验。

六、三元运算符与管道链
----------------------

三元运算符适合简单的二选一：

.. code-block:: powershell

   $score = 82
   $level = $score -ge 60 ? "及格" : "不及格"

管道链 ``&&`` 与 ``||`` 根据左侧命令是否成功来决定是否执行右侧命令：

.. code-block:: powershell

   Test-Path .\build.ps1 && .\build.ps1
   Get-Item .\missing.txt || Write-Warning "文件不存在"

它同时参考 ``$?`` 与 ``$LASTEXITCODE``，因此也适用于原生命令：

.. code-block:: powershell

   git pull && npm install

.. warning::

   管道链只表达成功与失败两种状态。多分支逻辑仍应使用 ``if``，以保证可读性。

七、调用运算符
--------------

``&`` 用于执行保存在变量中的命令名，``.`` 用于在当前作用域执行脚本：

.. code-block:: powershell

   $cmd = "Get-Date"
   & $cmd

   . .\library.ps1      # 点源：函数与变量进入当前作用域

``--%`` 是停止解析符，它之后的参数会原样交给外部程序：

.. code-block:: powershell

   icacls.exe $path --% /grant Everyone:(OI)(CI)F

.. tip::

   调用路径带空格的可执行文件时，应使用 ``& "C:\Program Files\App\app.exe"``，而不是直接书写路径。

八、练习任务
------------

任务 1：判断集合中是否包含指定元素

.. code-block:: powershell

   $os = "Windows", "Linux", "macOS"
   $os -contains "Linux"
   "macOS" -in $os

任务 2：使用正则重新排列日期格式

.. code-block:: powershell

   "2026-11-26" -replace "(\d{4})-(\d{2})-(\d{2})", '$3/$2/$1'

任务 3：使用空值运算符设置默认端口

.. code-block:: powershell

   $config = @{}
   $port = $config.Port ?? 8080
   $port -gt 1024 ? "高位端口" : "系统端口"

任务 4：仅当文件存在时读取最后几行

.. code-block:: powershell

   Test-Path .\app.log && Get-Content .\app.log -Tail 5
