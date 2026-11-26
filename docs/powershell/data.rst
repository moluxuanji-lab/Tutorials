PowerShell 数据格式与 REST API
==============================

.. meta::
   :group: 工程化
   :summary: 掌握 JSON、CSV、XML 与 CliXml 的读写细节，并处理 REST 接口的认证、分页、超时与重试。

PowerShell 内部处理的是对象，而配置文件、报表和接口通常使用 JSON、CSV、XML 等文本格式。格式转换的默认行为往往决定了脚本是否稳定。

本节将介绍以下内容：

* JSON 序列化深度与反序列化选项。
* CSV 文件的编码、分隔符与类型头。
* XML 与 CliXml 的读写方式。
* 调用 REST API 时的请求体、认证、分页与重试。

一、对象与 JSON
---------------

``ConvertTo-Json`` 把对象序列化为 JSON，``ConvertFrom-Json`` 把 JSON 还原为对象。

序列化深度
~~~~~~~~~~

默认只序列化两层，嵌套更深的属性会被降级为字符串：

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
   $info | ConvertTo-Json -Depth 5     # 保留完整层级
   $info | ConvertTo-Json -Depth 5 -Compress

反序列化选项
~~~~~~~~~~~~

.. code-block:: powershell

   $json = Get-Content .\config.json -Raw

   $obj = $json | ConvertFrom-Json
   $map = $json | ConvertFrom-Json -AsHashtable
   $single = $json | ConvertFrom-Json -NoEnumerate

``-AsHashtable`` 适合按字典方式访问键；``-NoEnumerate`` 可以避免单元素数组被展开成单个对象。PowerShell 7.5 起还支持 ``-DateKind``，用于把日期字符串还原为日期类型：

.. code-block:: powershell

   $data = $json | ConvertFrom-Json -DateKind Local

.. warning::

   包含循环引用的对象（例如部分 WMI / CIM 结果）无法直接序列化。应先用 ``Select-Object`` 投影出需要的字段，再进行转换。

二、CSV 文件的读写
------------------

.. code-block:: powershell

   Get-Process |
       Sort-Object CPU -Descending |
       Select-Object -First 20 Name, Id, CPU, WorkingSet |
       Export-Csv .\processes.csv -Encoding utf8BOM

   $rows = Import-Csv .\processes.csv
   $rows | Group-Object Name |
       Sort-Object Count -Descending |
       Select-Object -First 5

需要注意以下行为：

* PowerShell 7 的 ``Export-Csv`` 默认不写入 ``#TYPE`` 头，需要时使用 ``-IncludeTypeInformation``。
* ``utf8BOM`` 兼容旧版 Excel，``utf8NoBOM`` 更适合程序读取。
* 非逗号分隔的文件使用 ``-Delimiter ";"``，旧系统导出的文件可能还需要指定 ``-Encoding Default``。

.. tip::

   CSV 字段由第一条对象的属性决定。对象属性不一致时，缺失列会留空，多余列会被丢弃。导出前应先使用 ``Select-Object`` 统一结构。

三、XML 与 CliXml
-----------------

XML 文件转换为 ``[xml]`` 后，可以按节点访问：

.. code-block:: powershell

   [xml]$doc = Get-Content .\app.config -Raw
   $doc.configuration.appSettings.add | Select-Object key, value
   $doc.SelectNodes("//add[@key='LogLevel']")

CliXml 是 PowerShell 的序列化格式，能够保留类型信息，适合在会话之间传递复杂对象：

.. code-block:: powershell

   Get-Process notepad | Export-Clixml .\notepad.clixml
   $p = Import-Clixml .\notepad.clixml
   $p.Name

.. important::

   ``Import-Clixml`` 会还原对象结构，只应处理自己生成或来源可信的文件，不要用于来源不明的数据。

四、调用 REST API
-----------------

``Invoke-RestMethod`` 会自动把 JSON 响应解析为对象，是调用接口的常用命令。

发送 POST 请求
~~~~~~~~~~~~~~

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

分页与状态码
~~~~~~~~~~~~

分页接口需要循环取完，直到返回数量小于页大小：

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

需要自行处理 4xx/5xx 时，可以使用 ``-SkipHttpErrorCheck`` 与 ``-StatusCodeVariable``：

.. code-block:: powershell

   $resp = Invoke-RestMethod -Uri $uri -SkipHttpErrorCheck -StatusCodeVariable code
   if ($code -ge 400) {
       Write-Warning "接口返回 $code"
   }

.. warning::

   ``-SkipCertificateCheck`` 只应在受控的测试环境中使用。生产环境应正确配置证书信任，而不是关闭校验。

五、超时、重试与结果保存
------------------------

网络调用都应设置超时，批处理时可以增加有限次退避重试：

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

结果应保存为结构化文件，而不是只输出到屏幕：

.. code-block:: powershell

   $data | ConvertTo-Json -Depth 6 | Set-Content .\result.json -Encoding utf8NoBOM

六、小结
--------

.. csv-table::
   :header: "主题", "关键点"

   "JSON 序列化", "显式指定 -Depth，避免嵌套被压平"
   "JSON 反序列化", "-AsHashtable / -NoEnumerate / -DateKind"
   "CSV", "编码、分隔符与 #TYPE 头"
   "XML", "[xml] 转换后按节点或 XPath 访问"
   "CliXml", "保留类型，但只处理可信文件"
   "REST", "请求体、认证头、分页与状态码"
   "重试", "有限次数、指数退避、最终抛出"
   "保存结果", "JSON/CSV + 明确编码"

格式转换的关键不是记住命令，而是记住每个格式的默认行为。把 JSON 的深度、CSV 的编码和 CliXml 的信任边界显式写出来，脚本就会更加稳定。
