命令发现与帮助进阶
==================

.. meta::
   :group: 入门
   :summary: 在掌握 Get-Help、Get-Command、Get-Member 的基础上，补齐精确过滤、在线文档、PSReadLine 与脚本注释帮助。

核心概念一章已经介绍过 ``Get-Help``、``Get-Command``、``Get-Member`` 和 ``about_*`` 的基本用途，本章不再重复这些入门内容，只补三件能明显提高效率的事：**精确过滤命令**、**把帮助用透**、**让终端和脚本自己会“提示”**。

一、精确过滤命令
----------------

只知道大概方向时，用过滤参数把范围缩小：

.. csv-table::
   :header: "参数", "作用", "示例"

   "-Verb", "按标准动词过滤", "Get-Command -Verb Remove"
   "-Noun", "按名词过滤", "Get-Command -Noun Service"
   "-Module", "限定模块", "Get-Command -Module PSReadLine"
   "-CommandType", "限定命令类型", "Get-Command -CommandType Function"
   "-Name", "支持通配符", "Get-Command Get-*Item"

.. code-block:: powershell

   # 找出所有“删除类”命令
   Get-Command -Verb Remove

   # 确认某个命令来自哪个模块、哪个版本
   Get-Command Start-ThreadJob | Format-List Name, CommandType, Source, Version

   # 查看 PowerShell 官方动词表
   Get-Verb

动词和名词是 PowerShell 的“索引键”。记住 ``Get-Verb`` 和 ``Get-Command -Noun``，比背命令表有效得多。

二、把帮助用透
--------------

``Get-Help`` 的默认输出只是摘要，按需加上参数才能看到关键信息：

.. code-block:: powershell

   Get-Help Get-ChildItem -Parameter Filter   # 只看某个参数
   Get-Help Get-ChildItem -Full               # 参数、输入输出、相关链接
   Get-Help Get-ChildItem -Online             # 直接打开微软官方文档

.. note::

   本地帮助需要 ``Update-Help`` 下载，而且部分模块不提供可更新帮助。``-Online`` 始终指向微软最新文档，排查版本差异时优先使用。

概念类内容用 ``about_`` 主题查，比搜索引擎更快也更准确：

.. code-block:: powershell

   Get-Help about_Operators
   Get-Help about_Pipeline_Chain
   Get-Help about_Parsing
   Get-Help about_*

三、PSReadLine：让终端主动提示
-----------------------------

PowerShell 7 默认加载 PSReadLine，它负责补全、预测和历史搜索：

.. csv-table::
   :header: "按键", "功能"

   "Tab / Shift + Tab", "循环补全命令、参数、路径"
   "F2", "切换行内预测与列表预测"
   "Ctrl + R", "反向增量搜索历史命令"
   "Ctrl + S", "正向搜索历史命令"

查看并调整预测来源：

.. code-block:: powershell

   Get-PSReadLineOption | Select-Object PredictionSource, PredictionViewStyle

   Set-PSReadLineOption -PredictionSource HistoryAndPlugin
   Set-PSReadLineOption -PredictionViewStyle InlineView

.. tip::

   ``Ctrl + R`` 是找回长命令的最快方式。输入关键词即可匹配历史，不必记得完整语法。

四、别名：知道它，但别依赖它
----------------------------

.. code-block:: powershell

   Get-Alias
   Get-Alias -Definition Get-ChildItem

.. warning::

   别名只适合交互式输入。脚本里请写完整命令名，否则换一台机器或换一个配置文件就可能失效。

五、给自己的脚本写帮助
----------------------

在脚本或函数开头放注释块，就能被 ``Get-Help`` 读取：

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

.. code-block:: powershell

   Get-Help .\Backup-Folder.ps1 -Full

.. important::

   脚本的注释帮助放在文件开头（``param`` 之前）或文件末尾；函数的注释帮助放在 ``function`` 关键字之前，或函数体内开头、末尾。中间夹着其他语句就读不到。

六、小结
--------

.. csv-table::
   :header: "场景", "用什么"

   "只记得动词或名词", "Get-Command -Verb / -Noun"
   "确认命令来源与版本", "Get-Command | Format-List Source, Version"
   "查参数细节", "Get-Help -Parameter / -Full"
   "查最新官方说明", "Get-Help -Online"
   "查语言概念", "Get-Help about_*"
   "找回历史命令", "Ctrl + R"
   "让别人会用你的脚本", "注释帮助 + Get-Help"
