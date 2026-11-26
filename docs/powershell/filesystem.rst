Cmdlet 文件系统操作
===================

.. meta::
   :group: 常用操作
   :summary: 用 Get-ChildItem、New-Item、Copy-Item 等命令完成文件与目录的日常操作。

文件系统操作是 PowerShell 中最常见、最实用的任务之一。

从创建、复制、移动、删除文件，到获取文件属性、批量处理目录结构，PowerShell 提供了大量简洁而强大的 Cmdlet 来完成这些操作。

一、查看目录内容：Get-ChildItem
-------------------------------

.. code-block:: powershell

   Get-ChildItem

这是 PowerShell 中查看目录内容（相当于 ``ls`` 或 ``dir``）的命令。默认列出当前目录下的所有文件和子目录。

你也可以使用路径参数：

.. code-block:: powershell

   Get-ChildItem -Path C:\Test

查看所有子目录（递归）：

.. code-block:: powershell

   Get-ChildItem -Path C:\Test -Recurse

按文件类型筛选：

.. code-block:: powershell

   Get-ChildItem -Path C:\Test -Filter *.txt

二、创建文件和目录：New-Item
-----------------------------

创建新目录：

.. code-block:: powershell

   New-Item -Path "C:\Demo" -ItemType Directory

创建新文件：

.. code-block:: powershell

   New-Item -Path "C:\Demo\example.txt" -ItemType File

.. tip::

   如路径中父目录不存在，将报错。需先手动或通过脚本创建上级目录。

三、复制与移动：Copy-Item 和 Move-Item
--------------------------------------

复制文件：

.. code-block:: powershell

   Copy-Item -Path "C:\Demo\example.txt" -Destination "D:\Backup"

复制整个文件夹（包含内容）：

.. code-block:: powershell

   Copy-Item -Path "C:\Demo" -Destination "D:\Backup" -Recurse

移动文件：

.. code-block:: powershell

   Move-Item -Path "C:\Demo\example.txt" -Destination "C:\Demo2"

四、删除文件和目录：Remove-Item
--------------------------------

删除文件：

.. code-block:: powershell

   Remove-Item -Path "C:\Demo\example.txt"

删除文件夹及其内容：

.. code-block:: powershell

   Remove-Item -Path "C:\Demo" -Recurse -Force

说明：

* ``-Recurse``：删除目录下的所有内容。
* ``-Force``：强制删除隐藏或只读文件。

五、读取和写入文件
------------------

读取文件内容：

.. code-block:: powershell

   Get-Content -Path "C:\Demo\example.txt"

写入内容（覆盖）：

.. code-block:: powershell

   Set-Content -Path "C:\Demo\example.txt" -Value "Hello PowerShell"

追加内容：

.. code-block:: powershell

   Add-Content -Path "C:\Demo\example.txt" -Value "Another line"

六、文件重命名与存在性判断
--------------------------

重命名文件：

.. code-block:: powershell

   Rename-Item -Path "C:\Demo\example.txt" -NewName "renamed.txt"

判断文件是否存在：

.. code-block:: powershell

   Test-Path -Path "C:\Demo\renamed.txt"

如果存在返回 ``True``，否则返回 ``False``。

七、获取文件属性：Get-Item
---------------------------

.. code-block:: powershell

   $item = Get-Item -Path "C:\Demo\renamed.txt"
   $item.Length         # 文件大小（字节）
   $item.CreationTime   # 创建时间
   $item.Extension      # 扩展名

.. note::

   返回的是 ``System.IO.FileInfo`` 类型对象，可进一步使用对象属性。

八、组合操作示例：批量处理文件
------------------------------

批量列出目录下所有 ``.log`` 文件大小总和：

.. code-block:: powershell

   Get-ChildItem -Path "C:\Logs" -Filter *.log | Measure-Object -Property Length -Sum

输出结果示例：

.. code-block:: text

   Count    : 15
   Sum      : 1289345
   Property : Length

将所有 ``.txt`` 文件内容追加到一个新文件中：

.. code-block:: powershell

   Get-ChildItem -Path "C:\TextFiles" -Filter *.txt | ForEach-Object {
       Get-Content $_.FullName | Add-Content -Path "C:\AllText.txt"
   }

九、注意事项与常见坑
--------------------

.. csv-table::
   :header: "问题", "说明"

   "路径中包含空格", "使用引号将整个路径字符串括起来"
   "区分目录和文件", "New-Item 必须指定 -ItemType File 或 Directory"
   "文件不存在时操作报错", "使用 Test-Path 检查再处理"
   "删除命令需小心", "Remove-Item 使用 -Recurse 时慎重，避免误删"
