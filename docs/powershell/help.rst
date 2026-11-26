PowerShell 命令发现与帮助
=========================

.. meta::
   :group: 入门
   :summary: 掌握命令过滤、帮助查阅、PSReadLine 提示与脚本注释帮助，快速找到并正确使用命令。

PowerShell 内置了数百条 Cmdlet，加上模块、函数和别名，可用命令的数量还会继续增长。与其记住每一条命令，不如掌握一套稳定的查找方法：先确定方向，再阅读参数，最后在终端中验证。

本节将介绍以下内容：

* 使用 ``Get-Command`` 的过滤参数缩小查找范围。
* 查阅参数说明、完整帮助与在线文档。
* 利用 PSReadLine 完成补全、预测和历史搜索。
* 为编写的脚本添加可被 ``Get-Help`` 读取的注释帮助。

一、精确查找命令
----------------

PowerShell 的命令遵循“动词-名词”命名规范，因此动词和名词就是最有效的检索条件。

按动词和名词过滤
~~~~~~~~~~~~~~~~

.. code-block:: powershell

   # 找出所有删除类命令
   Get-Command -Verb Remove

   # 找出所有与服务相关的命令
   Get-Command -Noun Service

   # 按名称通配符查找
   Get-Command Get-*Item

常用过滤参数如下：

.. csv-table::
   :header: "参数", "作用", "示例"

   "-Verb", "按标准动词过滤", "Get-Command -Verb Remove"
   "-Noun", "按名词过滤", "Get-Command -Noun Service"
   "-Module", "限定模块", "Get-Command -Module PSReadLine"
   "-CommandType", "限定命令类型", "Get-Command -CommandType Function"
   "-Name", "支持通配符", "Get-Command Get-*Item"

确认命令来源
~~~~~~~~~~~~

找到命令后，可以进一步确认它来自哪个模块、哪个版本：

.. code-block:: powershell

   Get-Command Start-ThreadJob | Format-List Name, CommandType, Source, Version

如果不确定应该使用哪个动词，可以先查看内置动词表：

.. code-block:: powershell

   Get-Verb

二、查看帮助的常用方式
----------------------

``Get-Help`` 的默认输出是摘要信息，按需添加参数才能看到参数、示例和完整说明。

查看参数说明
~~~~~~~~~~~~

.. code-block:: powershell

   Get-Help Get-ChildItem -Parameter Filter
   Get-Help Get-ChildItem -Full

查看在线文档
~~~~~~~~~~~~

.. code-block:: powershell

   Get-Help Get-ChildItem -Online

.. note::

   本地帮助需要通过 ``Update-Help`` 下载，而且部分模块不提供可更新帮助。``-Online`` 始终指向微软最新文档，排查版本差异时更为可靠。

查看概念主题
~~~~~~~~~~~~

概念类内容以 ``about_`` 开头，适合系统了解语法与行为：

.. code-block:: powershell

   Get-Help about_Operators
   Get-Help about_Pipeline_Chain
   Get-Help about_Parsing
   Get-Help about_*

三、PSReadLine 与历史命令
-------------------------

PowerShell 7 默认加载 PSReadLine，它负责命令补全、预测提示和历史搜索。

Tab 补全
~~~~~~~~

输入命令或参数时按 ``Tab`` 循环补全，``Shift + Tab`` 反向循环。输入 ``Get-Ch`` 后按 Tab，即可补出 ``Get-ChildItem``。

预测式 IntelliSense
~~~~~~~~~~~~~~~~~~~

PSReadLine 会根据历史记录和内联预测给出完整命令，按 ``F2`` 可以在行内预测和列表预测之间切换。

.. code-block:: powershell

   Get-PSReadLineOption | Select-Object PredictionSource, PredictionViewStyle

   Set-PSReadLineOption -PredictionSource HistoryAndPlugin
   Set-PSReadLineOption -PredictionViewStyle InlineView

历史搜索
~~~~~~~~

按 ``Ctrl + R`` 进入反向增量搜索，输入关键词即可找到以前执行过的命令；``Ctrl + S`` 用于正向搜索。

四、别名与外部命令
------------------

.. code-block:: powershell

   Get-Alias
   Get-Alias -Definition Get-ChildItem

外部程序同样可以通过 ``Get-Command`` 查询：

.. code-block:: powershell

   Get-Command pwsh

.. warning::

   别名只适合交互式输入。脚本中应使用完整命令名，否则换一台机器或换一个配置文件就可能失效。

五、为脚本编写帮助
------------------

在脚本或函数的开头放置注释块，就可以用 ``Get-Help`` 查看帮助。

注释帮助的基本结构
~~~~~~~~~~~~~~~~~~

.. code-block:: powershell

   <#
   .SYNOPSIS
       备份指定目录到目标路径。
   .PARAMETER Source
       要备份的源目录。
   .PARAMETER Target
       备份文件存放目录。
   .EXAMPLE
       .\Backup-Folder.ps1 -Source C:\Data -Target D:\Backup
   #>
   param(
       [Parameter(Mandatory)]
       [string]$Source,
       [Parameter(Mandatory)]
       [string]$Target
   )

查看生成的帮助：

.. code-block:: powershell

   Get-Help .\Backup-Folder.ps1 -Full

.. important::

   脚本的注释帮助放在文件开头（``param`` 之前）或文件末尾；函数的注释帮助放在 ``function`` 关键字之前，或函数体内开头、末尾。中间夹着其他语句时无法被识别。

六、练习任务
------------

任务 1：查找与进程相关的命令

.. code-block:: powershell

   Get-Command -Noun Process
   Get-Command -Verb Get -Noun Process

任务 2：查看某个参数的详细说明

.. code-block:: powershell

   Get-Help Get-ChildItem -Parameter Filter
   Get-Help Get-ChildItem -Online

任务 3：为脚本添加注释帮助并查看

.. code-block:: powershell

   <#
   .SYNOPSIS
       输出问候语。
   .EXAMPLE
       .\Hello.ps1
   #>
   "Hello, PowerShell"

.. code-block:: powershell

   Get-Help .\Hello.ps1 -Full
