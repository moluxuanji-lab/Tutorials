PowerShell 运算符与现代语法
===========================

.. meta::
   :group: 核心概念
   :summary: 跳过基础运算符表，专讲大小写、集合方向、正则捕获、格式化、空值运算符与 7.x 新语法。

基本语法一章已经列出算术、比较、逻辑和包含运算符，并演示了 ``-eq``、``-like`` 的用法。本章不重复那张表，只讲三类内容：**容易用错的细节**、**文本处理中真正高频的运算符**、**PowerShell 7 引入的新语法**。

一、大小写与集合方向
--------------------

比较运算符默认不区分大小写。需要区分时加 ``c`` 前缀，强制忽略时加 ``i`` 前缀：

.. code-block:: powershell

   "ABC" -eq "abc"      # True
   "ABC" -ceq "abc"     # False
   "ABC" -ieq "abc"     # True

``-contains`` 与 ``-in`` 的方向最容易记反：

.. code-block:: powershell

   $names = @("Alice", "Bob", "Carol")

   $names -contains "Bob"     # 集合在前：集合是否包含元素
   "Bob" -in $names           # 元素在前：元素是否在集合中

PowerShell 7 中，比较运算符还可以直接筛选左侧集合：

.. code-block:: powershell

   1..10 -gt 7                # 8 9 10
   "a", "b", "c" -like "a*"   # a

.. note::

   这种“集合比较”返回的是元素本身，不是布尔值。写成 ``if`` 条件时要注意结果是否为空集合。

二、正则匹配与替换
------------------

``-match`` 使用 .NET 正则表达式，匹配成功后结果会写入自动变量 ``$Matches``：

.. code-block:: powershell

   if ("user_2024.log" -match "user_(\d+)") {
       "年份：" + $Matches[1]
   }

``-replace`` 的语法是 ``-replace 模式, 替换内容``，替换串里可以用 ``$1``、``$2`` 引用捕获组：

.. code-block:: powershell

   "2026-11-26" -replace "(\d{4})-(\d{2})-(\d{2})", '$3/$2/$1'
   "C:\Temp\a.txt" -replace "\\", "/"

.. warning::

   ``$Matches`` 是**上一次成功匹配**的结果。多次匹配时它会被覆盖，需要在循环里立即取值。

``-split`` 同样支持正则，``-join`` 负责反向拼接：

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

范围运算符 ``..`` 生成连续整数或单字符序列：

.. code-block:: powershell

   1..5
   5..1
   "a".."e"

.. tip::

   ``..`` 不能直接生成日期序列。日期请用 ``for`` 循环配合 ``AddDays()``，或改用 ``while`` 控制。

四、类型判断与安全转换
----------------------

.. code-block:: powershell

   5 -is [int]              # True
   "abc" -is [string]       # True

   [int]"42"                # 42
   "abc" -as [int]          # $null，不抛异常
   "2026-11-26" -as [datetime]

``-as`` 适合“转换失败也不希望中断”的场景；需要严格失败时用强制转换 ``[int]``，它会抛出终止性错误，可被 ``try/catch`` 捕获。

五、空值处理：??、??=、?. 与 ?[]
---------------------------------

PowerShell 7 的空值运算可以显著减少防御式判断：

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

   ``?.`` 只处理“对象为 null”的情况，不会掩盖索引越界等真实错误。集合边界仍需自行校验。

六、三元运算符与管道链
----------------------

三元运算符适合简单的二选一：

.. code-block:: powershell

   $score = 82
   $level = $score -ge 60 ? "及格" : "不及格"

管道链 ``&&`` 与 ``||`` 根据左侧命令的成功与否决定是否执行右侧：

.. code-block:: powershell

   Test-Path .\build.ps1 && .\build.ps1
   Get-Item .\missing.txt || Write-Warning "文件不存在"

它同时参考 ``$?`` 与 ``$LASTEXITCODE``，因此也适用于原生命令：

.. code-block:: powershell

   git pull && npm install

.. warning::

   管道链只表达“成功/失败”两态。多分支逻辑仍然应该用 ``if``，否则可读性会迅速下降。

七、调用运算符与其他
--------------------

``&`` 执行保存在变量里的命令名，``.`` 在当前作用域执行脚本：

.. code-block:: powershell

   $cmd = "Get-Date"
   & $cmd

   . .\library.ps1      # 点源：函数与变量进入当前作用域

``--%`` 是停止解析符，之后的参数原样交给外部程序：

.. code-block:: powershell

   icacls.exe $path --% /grant Everyone:(OI)(CI)F

.. tip::

   调用路径带空格的可执行文件时，用 ``& "C:\Program Files\App\app.exe"`` 而不是直接写路径，否则会被当成字符串。

八、小结
--------

.. csv-table::
   :header: "类别", "关键运算符", "本章补充点"

   "比较", "-ceq / -ieq / -contains / -in", "大小写前缀与集合方向"
   "正则", "-match / -replace / -split", "$Matches 与捕获组引用"
   "格式化", "-f / -join", "数字与日期格式串"
   "类型", "-is / -as", "安全转换与严格转换的区别"
   "空值", "?? / ??= / ?. / ?[]", "只在对象为 null 时短路"
   "分支", "? : / && / ||", "表达式与命令链的边界"
   "调用", "& / . / --%", "动态执行与参数透传"

基础表负责“认识”，本章负责“用对”。真正写脚本时，正则捕获、``??`` 和管道链的出现频率远高于算术运算。
