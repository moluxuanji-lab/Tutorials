PowerShell 数据格式与 REST API
==============================

.. meta::
   :group: 工程化
   :summary: 不重复入门调用示例，补齐 JSON 深度、CSV 编码、XML/CliXml 与 REST 认证、分页、重试。

实际应用一章已经演示过用 ``Invoke-RestMethod`` 读取一个公开接口，也展示了 CSV 与数据库的基本思路。本章不重复那个入门示例，重点讲**格式转换的坑**和**接口调用的工程化**。

一、JSON：三个最常见的坑
------------------------

``ConvertTo-Json`` 默认只序列化两层，嵌套更深的属性会被降级成字符串：

.. code-block:: powershell

   $info = [PSCustomObject]@{
       Name  = "Server01"
       Cpu   = 12.5
       Owner = [PSCustomObject]@{
           Team   = "Ops"
           Detail = [PSCustomObject]@{ OnCall = "zhang" }
       }
   }

   $info | ConvertTo-Json              # Detail 会被压成字符串
   $info | ConvertTo-Json -Depth 5     # 正确保留层级
   $info | ConvertTo-Json -Depth 5 -Compress   # 单行，适合传输

反序列化有两个行为需要注意：

.. code-block:: powershell

   $json = Get-Content .\config.json -Raw

   $obj = $json | ConvertFrom-Json
   $map = $json | ConvertFrom-Json -AsHashtable    # 按字典方式访问键

   # 单元素数组默认会被展开成单个对象
   $single = $json | ConvertFrom-Json -NoEnumerate

PowerShell 7.5 起，``ConvertFrom-Json`` 支持 ``-DateKind``，可以把日期字符串还原为真正的日期类型：

.. code-block:: powershell

   $data = $json | ConvertFrom-Json -DateKind Local

.. warning::

   含循环引用的对象（部分 WMI / CIM 结果）无法直接序列化。先用 ``Select-Object`` 投影出需要的字段，再转换。

二、CSV：编码比字段更容易出错
-----------------------------

.. code-block:: powershell

   Get-Process |
       Sort-Object CPU -Descending |
       Select-Object -First 20 Name, Id, CPU, WorkingSet |
       Export-Csv .\processes.csv -Encoding utf8BOM

   $rows = Import-Csv .\processes.csv
   $rows | Group-Object Name | Sort-Object Count -Descending | Select-Object -First 5

要点：

* PowerShell 7 的 ``Export-Csv`` 默认不写 ``#TYPE`` 头，需要时用 ``-IncludeTypeInformation``。
* ``utf8BOM`` 兼容旧版 Excel；``utf8NoBOM`` 更适合程序读取。
* 非逗号分隔的文件用 ``-Delimiter ";"``，从旧系统导出的文件通常还要指定 ``-Encoding Default``。

.. tip::

   字段由第一条对象的属性决定。对象属性不一致时，缺失列会留空，多余列会被丢弃。导出前先用 ``Select-Object`` 统一结构。

三、XML 与 CliXml
-----------------

XML 用 ``[xml]`` 转换后即可按节点访问：

.. code-block:: powershell

   [xml]$doc = Get-Content .\app.config -Raw
   $doc.configuration.appSettings.add | Select-Object key, value
   $doc.SelectNodes("//add[@key='LogLevel']")

CliXml 是 PowerShell 的私有序列化格式，能保留类型信息，适合会话之间传递复杂对象：

.. code-block:: powershell

   Get-Process notepad | Export-Clixml .\notepad.clixml
   $p = Import-Clixml .\notepad.clixml
   $p.Name

.. important::

   ``Import-Clixml`` 会还原对象结构，不要用于来源不明的文件。只处理自己生成或可信来源的数据。

四、REST：从“能调通”到“能上线”
-------------------------------

入门示例通常只发 GET。真实接口还需要处理请求体、认证、分页和状态码：

.. code-block:: powershell

   $body = @{
       title = "来自 PowerShell 的工单"
       body  = "由自动化脚本创建"
   } | ConvertTo-Json

   $result = Invoke-RestMethod -Method Post `
       -Uri "https://api.example.com/issues" `
       -ContentType "application/json" `
       -Headers @{ Authorization = "Bearer $env:API_TOKEN" } `
       -Body $body `
       -TimeoutSec 20

分页接口要循环取完，直到返回数量小于页大小：

.. code-block:: powershell

   $page = 1
   $all = @()
   do {
       $batch = Invoke-RestMethod `
           -Uri "https://api.example.com/items?page=$page&size=100" `
           -Headers @{ Authorization = "Bearer $env:API_TOKEN" } `
           -TimeoutSec 20

       $all += $batch.items
       $page++
   } while ($batch.items.Count -eq 100)

需要自行判断 4xx/5xx 时，用 ``-SkipHttpErrorCheck`` 配合 ``-StatusCodeVariable``：

.. code-block:: powershell

   $resp = Invoke-RestMethod -Uri $uri -SkipHttpErrorCheck -StatusCodeVariable code
   if ($code -ge 400) {
       Write-Warning "接口返回 $code"
   }

.. warning::

   ``-SkipCertificateCheck`` 只应在受控测试环境使用。生产环境应正确配置证书信任，而不是关闭校验。

五、超时、重试与结果落盘
------------------------

所有网络调用都应设置超时；批处理再加有限次退避重试：

.. code-block:: powershell

   $retry = 3
   for ($i = 1; $i -le $retry; $i++) {
       try {
           $data = Invoke-RestMethod -Uri $uri -TimeoutSec 20 -ErrorAction Stop
           break
       }
       catch {
           if ($i -eq $retry) { throw }
           Start-Sleep -Seconds ([math]::Pow(2, $i))
       }
   }

结果最好落成结构化文件，而不是只打印到屏幕：

.. code-block:: powershell

   $data | ConvertTo-Json -Depth 6 | Set-Content .\result.json -Encoding utf8NoBOM

六、小结
--------

.. csv-table::
   :header: "主题", "关键点"

   "JSON 序列化", "显式 -Depth，避免嵌套被压平"
   "JSON 反序列化", "-AsHashtable / -NoEnumerate / -DateKind"
   "CSV", "编码、分隔符、#TYPE 头"
   "XML", "[xml] 转换后按节点或 XPath 访问"
   "CliXml", "保留类型，但只处理可信文件"
   "REST", "请求体、认证头、分页、状态码、超时"
   "重试", "有限次数 + 指数退避 + 最终抛出"
   "落盘", "JSON/CSV + 明确编码"

格式转换的关键不是记住 cmdlet，而是记住每个格式的**默认行为**：JSON 的深度、CSV 的编码、CliXml 的信任边界。把这些默认值显式写出来，脚本就稳定了。
