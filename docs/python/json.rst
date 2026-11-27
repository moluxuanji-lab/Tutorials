Python JSON
===========

.. meta::
   :group: 标准库与实战
   :summary: 掌握 json 模块的 dumps、loads、dump、load 四个入口，理解类型映射、格式化参数与 object_hook、default 两个钩子，避开中文转义、元组退化、键类型变化等常见坑。

JSON（JavaScript Object Notation）是一种轻量的数据交换格式，用花括号表示对象、方括号表示数组，值只能是字符串、数字、布尔值、``null`` 以及这两种容器。它语法简单、跨语言、可读性好，HTTP 接口、配置文件、日志投递几乎都用它传递数据。

Python 标准库的 ``json`` 模块负责在这套格式与 Python 对象之间来回转换：``dumps()`` 把对象变成字符串，``loads()`` 把字符串变回对象，``dump()`` 与 ``load()`` 则直接读写文件。这一章从类型映射讲起，依次介绍四个入口、格式化参数、异常定位与两个钩子函数，最后总结几个容易踩的坑。

一、JSON 与 Python 的类型映射
-----------------------------

JSON 的类型比 Python 少得多，往返转换时并不是一一对应：

.. csv-table::
   :header: "JSON 类型", "Python 类型", "说明"

   "``object``", "``dict``", "键必须是字符串，嵌套对象转成嵌套字典"
   "``array``", "``list``", "元素类型可以不同，转成列表"
   "``string``", "``str``", "始终是 Unicode 文本"
   "``number``", "``int`` 或 ``float``", "没有整数与浮点之分，解析时按有无小数点判断"
   "``true`` / ``false``", "``True`` / ``False``", "对应 Python 的布尔值"
   "``null``", "``None``", "表示空值"

映射是单向有损的：``tuple``、``set``、``bytes``、``datetime`` 这些类型在 JSON 里没有对应表示，``dumps()`` 遇到它们会直接报 ``TypeError``；反过来，JSON 里的对象解析出来永远是 ``dict``，不会还原成原来的自定义类。

.. code-block:: python

   import json

   data = {
       "name": "小明",
       "age": 18,
       "score": 92.5,
       "active": True,
       "tags": ["python", "json"],
       "address": None,
   }

   print(json.dumps(data, ensure_ascii=False, sort_keys=True, indent=2))
   print("标签类型：", type(data["tags"]).__name__)
   print("空值类型：", type(data["address"]).__name__)

输出结果：

.. code-block:: text

   {
     "active": true,
     "address": null,
     "age": 18,
     "name": "小明",
     "score": 92.5,
     "tags": [
       "python",
       "json"
     ]
   }
   标签类型： list
   空值类型： NoneType

``True`` 变成 ``true``、``None`` 变成 ``null``、字符串加上了双引号，这些都是 JSON 与 Python 字面量的差异。``sort_keys=True`` 让键按字母序输出，``indent=2`` 让每层缩进两个空格，``ensure_ascii=False`` 则保证中文原样输出而不是变成 ``\uXXXX``。

二、dumps：把对象序列化成字符串
--------------------------------

``json.dumps()`` 的返回值是 ``str``，可以直接写进日志、放进 HTTP 响应或存进数据库。它对基础类型的处理规则很固定，记住下面这张对照就能预判输出。

.. code-block:: python

   import json

   values = [42, 3.5, "文本", True, False, None, [1, 2], {"k": "v"}]

   for value in values:
       print(f"{type(value).__name__:8} -> {json.dumps(value, ensure_ascii=False)}")

输出结果：

.. code-block:: text

   int      -> 42
   float    -> 3.5
   str      -> "文本"
   bool     -> true
   bool     -> false
   NoneType -> null
   list     -> [1, 2]
   dict     -> {"k": "v"}

``bool`` 是 ``int`` 的子类，但 ``json`` 会先判断布尔值，输出 ``true`` 而不是 ``1``。``float`` 的 ``3.5`` 原样保留，整数与浮点在 JSON 里没有类型标记，解析端只能靠有没有小数点来区分。默认分隔符是 ``,`` 加一个空格和 ``:`` 加一个空格，想压缩体积可以改 ``separators``。

三、loads：把字符串还原成对象
-----------------------------

``json.loads()`` 接受 ``str``、``bytes`` 或 ``bytearray``，返回对应的 Python 对象。JSON 里的对象解析成 ``dict``，数组解析成 ``list``，``true``/``false``/``null`` 分别变成 ``True``/``False``/``None``。

.. code-block:: python

   import json

   text = '{"name": "小明", "age": 18, "score": 92.5, "vip": true, "tags": ["a", "b"], "note": null}'
   data = json.loads(text)

   print("整体类型：", type(data).__name__)
   for key in sorted(data):
       print(f"{key}: {data[key]!r}")
   print("布尔类型：", type(data["vip"]).__name__)

输出结果：

.. code-block:: text

   整体类型： dict
   age: 18
   name: '小明'
   note: None
   score: 92.5
   tags: ['a', 'b']
   vip: True
   布尔类型： bool

用 ``!r``（即 ``repr()``）打印可以看清类型：字符串带引号、``None`` 显示为 ``None``、列表保留方括号。实际业务里更常见的是取出某个字段直接用，例如 ``data["tags"][0]``，缺字段时会抛 ``KeyError``，所以读外部数据前最好用 ``data.get("tags", [])`` 兜底。

四、格式化输出：ensure_ascii、indent、sort_keys、separators
-------------------------------------------------------------

四个参数决定了输出的可读性与体积，它们可以任意组合：

* ``ensure_ascii=False``：中文等非 ASCII 字符原样输出，默认值 ``True`` 会转成 ``\uXXXX`` 转义。
* ``indent``：缩进空格数，设为 ``None``（默认）时输出单行，设为数字时按层级换行缩进。
* ``sort_keys=True``：键按字典序排序，便于对比两次输出的差异。
* ``separators=(item, key)``：自定义元素之间与键值之间的分隔符，压缩传输时常用 ``(",", ":")``。

ensure_ascii 与 indent
~~~~~~~~~~~~~~~~~~~~~~

默认的 ASCII 转义让中文变成一串 ``\u`` 编码，人能读但很难核对；调试和写配置文件时几乎总要关掉它。

.. code-block:: python

   import json

   data = {"city": "上海", "temp": 23, "weather": "多云"}

   print("默认输出：", json.dumps(data))
   print("关闭 ASCII 转义：", json.dumps(data, ensure_ascii=False))
   print("indent=2：")
   print(json.dumps(data, ensure_ascii=False, indent=2))

输出结果：

.. code-block:: text

   默认输出： {"city": "\u4e0a\u6d77", "temp": 23, "weather": "\u591a\u4e91"}
   关闭 ASCII 转义： {"city": "上海", "temp": 23, "weather": "多云"}
   indent=2：
   {
     "city": "上海",
     "temp": 23,
     "weather": "多云"
   }

``\u4e0a\u6d77`` 是“上海”两个字的 Unicode 码位，``ensure_ascii=False`` 只是让输出保留原字符，文件写入时仍要自己指定 ``encoding="utf-8"``，否则在默认编码不是 UTF-8 的机器上可能报错。``indent`` 除了数字还可以传字符串，例如 ``indent="\t"`` 用制表符缩进。

sort_keys 与 separators
~~~~~~~~~~~~~~~~~~~~~~~

排序让输出稳定，紧凑分隔符则能省下不少字节。两者同时使用时，先排序再拼接，结果完全可复现。

.. code-block:: python

   import json

   data = {"b": 2, "a": 1, "c": [3, 4]}

   print("默认：", json.dumps(data))
   print("排序：", json.dumps(data, sort_keys=True))
   print("紧凑：", json.dumps(data, separators=(",", ":")))
   print("排序并紧凑：", json.dumps(data, sort_keys=True, separators=(",", ":")))
   print("长度：", len(json.dumps(data)), "->", len(json.dumps(data, separators=(",", ":"))))

输出结果：

.. code-block:: text

   默认： {"b": 2, "a": 1, "c": [3, 4]}
   排序： {"a": 1, "b": 2, "c": [3, 4]}
   紧凑： {"b":2,"a":1,"c":[3,4]}
   排序并紧凑： {"a":1,"b":2,"c":[3,4]}
   长度： 29 -> 23

同样的数据，紧凑写法少了 6 个字节，键越多、层级越深，差距越明显。接口返回大量数据时压缩收益可观，但日志和配置文件仍建议保留缩进，可读性比几个字节重要得多。

五、dump 与 load：直接读写文件
------------------------------

每次都先 ``dumps()`` 再 ``write()`` 很啰嗦，``json.dump()`` 与 ``json.load()`` 把这两步合并了：前者把对象写进文件对象，后者从文件对象读出对象。注意它们操作的是文件对象，不是文件名，所以要自己 ``open()``。

.. code-block:: python

   import json
   import os

   path = "profile.json"
   data = {"name": "小明", "skills": ["Python", "正则"], "level": 3}

   with open(path, "w", encoding="utf-8") as file:
       json.dump(data, file, ensure_ascii=False, indent=2)

   with open(path, encoding="utf-8") as file:
       print(file.read())

   with open(path, encoding="utf-8") as file:
       loaded = json.load(file)
   print("读回类型：", type(loaded).__name__)
   print("技能：", loaded["skills"])

   os.remove(path)
   print("文件已清理：", not os.path.exists(path))

输出结果：

.. code-block:: text

   {
     "name": "小明",
     "skills": [
       "Python",
       "正则"
     ],
     "level": 3
   }
   读回类型： dict
   技能： ['Python', '正则']
   文件已清理： True

示例在同一个代码块里完成写入、读取和删除，避免给工作目录留下垃圾文件。``json.dump()`` 不会自动换行结尾，需要的话可以写完再补一个 ``file.write("\n")``；读取时文件指针在开头，读一次就到末尾，想再读必须重新 ``open()``。

六、嵌套结构与遍历
------------------

真实数据往往是多层嵌套：对象里放数组，数组里再放对象。解析后就是一个普通的 ``dict`` 与 ``list`` 的组合，用下标和循环逐层深入即可，不需要任何特殊 API。

.. code-block:: python

   import json

   payload = {
       "order": "A1024",
       "customer": {"name": "小明", "vip": True},
       "items": [
           {"sku": "P1", "qty": 2, "price": 19.9},
           {"sku": "P2", "qty": 1, "price": 99.0},
       ],
   }

   text = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)
   print(text)

   total = sum(item["qty"] * item["price"] for item in payload["items"])
   print("总价：", round(total, 2))
   print("第二项编号：", payload["items"][1]["sku"])
   print("反序列化后 VIP：", json.loads(text)["customer"]["vip"])

输出结果：

.. code-block:: text

   {
     "customer": {
       "name": "小明",
       "vip": true
     },
     "items": [
       {
         "price": 19.9,
         "qty": 2,
         "sku": "P1"
       },
       {
         "price": 99.0,
         "qty": 1,
         "sku": "P2"
       }
     ],
     "order": "A1024"
   }
   总价： 138.8
   第二项编号： P2
   反序列化后 VIP： True

``sort_keys=True`` 会递归作用于每一层的对象，所以 ``items`` 里每个元素的键也按字母序排列，这种输出在代码评审和测试快照里非常好对比。遍历嵌套结构时，``for item in payload["items"]`` 拿到的是字典，取字段仍要用 ``item["price"]``；如果某一层可能缺失，用 ``payload.get("items", [])`` 更安全。

七、JSONDecodeError：解析失败的定位
-----------------------------------

``json.loads()`` 遇到不合法的文本会抛 ``json.JSONDecodeError``，它是 ``ValueError`` 的子类。异常对象带有 ``msg``、``lineno``、``colno``、``pos`` 四个属性，能直接指出出错的位置和原因。

.. code-block:: python

   import json

   samples = ['{"a": 1', "{'a': 1}", '{"a": 1,}']

   for text in samples:
       try:
           json.loads(text)
       except json.JSONDecodeError as exc:
           print(f"{text} -> 第 {exc.lineno} 行第 {exc.colno} 列：{exc.msg}")

输出结果：

.. code-block:: text

   {"a": 1 -> 第 1 行第 8 列：Expecting ',' delimiter
   {'a': 1} -> 第 1 行第 2 列：Expecting property name enclosed in double quotes
   {"a": 1,} -> 第 1 行第 8 列：Illegal trailing comma before end of object

三种错误的成因各不相同：第一段缺少右花括号，解析到末尾仍期待一个 ``,`` 或 ``}``；第二段用了单引号，JSON 只认双引号；第三段多了个尾逗号，右花括号前不允许再有逗号，解释器直接点名 ``Illegal trailing comma before end of object``。``lineno`` 和 ``colno`` 都从 1 开始计数，多行文本里能快速定位到出错行，这对排查几 MB 的配置文件尤其有用。

八、object_hook：自定义解码
---------------------------

``loads()`` 的 ``object_hook`` 参数接受一个函数，每个 JSON 对象解析成字典后都会先交给它，返回值取代原字典进入结果。利用这个钩子可以在反序列化时顺手把日期字符串转成 ``date`` 对象。

.. code-block:: python

   import json
   from datetime import date

   def decode_order(obj):
       if "date" in obj:
           obj["date"] = date.fromisoformat(obj["date"])
       return obj

   text = '{"order": "A1024", "date": "2026-11-27", "items": [{"qty": 2}]}'
   data = json.loads(text, object_hook=decode_order)

   print("订单：", data["order"])
   print("日期对象：", data["date"], type(data["date"]).__name__)
   print("年份：", data["date"].year)
   print("子对象也被处理：", type(data["items"][0]).__name__)

输出结果：

.. code-block:: text

   订单： A1024
   日期对象： 2026-11-27 date
   年份： 2026
   子对象也被处理： dict

钩子是从内向外调用的：先处理 ``items`` 里的子对象，再处理最外层，所以每一个层级的字典都会经过 ``decode_order``。判断条件用 ``in`` 检查键是否存在，不要假设所有对象都带 ``date`` 字段。如果想把 JSON 对象直接还原成自定义类，可以在钩子里按某个标记键分派，例如看到 ``"__type__": "user"`` 就构造 ``User(**obj)``。

九、default：自定义编码
-----------------------

反过来，``dumps()`` 遇到不认识的类型会调用 ``default`` 函数，只要它返回一个可序列化的对象，序列化就能继续；如果仍然无法处理，再抛 ``TypeError``。这是把 ``Decimal``、``set``、``datetime`` 写进 JSON 的标准做法。

.. code-block:: python

   import json
   from decimal import Decimal

   def encode_extra(obj):
       if isinstance(obj, Decimal):
           return str(obj)
       if isinstance(obj, set):
           return sorted(obj)
       raise TypeError(f"无法序列化 {type(obj).__name__}")

   data = {"price": Decimal("19.90"), "tags": {"b", "a"}}
   print(json.dumps(data, ensure_ascii=False, default=encode_extra, sort_keys=True))

   try:
       json.dumps({"when": object()}, default=encode_extra)
   except TypeError as exc:
       print("捕获 TypeError：", exc)

输出结果：

.. code-block:: text

   {"price": "19.90", "tags": ["a", "b"]}
   捕获 TypeError： 无法序列化 object

``default`` 只对无法直接序列化的值触发，``dict``、``list``、``str`` 这些原生类型不会走到这里。集合本身无序，示例里先 ``sorted()`` 再返回，保证每次输出一致。金额用 ``str`` 而不是 ``float`` 返回，可以避免 ``19.90`` 变成 ``19.9`` 这类精度与格式损失。

十、常见坑
----------

JSON 的规则比 Python 严格，跨语言传输时最容易在这几处翻车：

.. csv-table::
   :header: "现象", "原因", "对策"

   "元组往返后变成列表", "JSON 没有元组类型，``dumps()`` 把 ``tuple`` 当数组处理", "接收端按列表处理，或在钩子里转回元组"
   "整数键变成字符串键", "JSON 对象的键只能是字符串", "统一用字符串键，取值时不要用整数下标"
   "``datetime`` 直接报错", "JSON 没有日期类型", "先 ``isoformat()``，或用 ``default`` 钩子"
   "中文变成 ``\uXXXX``", "``ensure_ascii`` 默认为 ``True``", "传 ``ensure_ascii=False`` 并用 UTF-8 写文件"
   "单引号字典解析失败", "JSON 只接受双引号字符串", "用 ``dumps()`` 生成，不要手写拼接"
   "浮点数末尾多出小数", "二进制浮点无法精确表示十进制小数", "金额改用 ``Decimal`` 加字符串传输"
   "``NaN``、``Infinity`` 能写出", "它们是 Python 扩展，不属于标准 JSON", "开启 ``allow_nan=False`` 让非法值立刻报错"

前三条是类型层面的损失，后几条是格式层面的误用。下面这段代码把常见现象集中演示一遍：

.. code-block:: python

   import json

   print("元组变列表：", json.loads(json.dumps((1, 2))))
   print("整数键变字符串：", json.loads(json.dumps({1: "a", 2: "b"})))
   print("往返类型：", type(json.loads(json.dumps((1, 2)))).__name__)
   print("浮点误差：", json.dumps(0.1 + 0.2))
   print("NaN 被接受：", json.dumps(float("nan")))
   print("重复键只留最后一个：", json.loads('{"a": 1, "a": 2}'))

输出结果：

.. code-block:: text

   元组变列表： [1, 2]
   整数键变字符串： {'1': 'a', '2': 'b'}
   往返类型： list
   浮点误差： 0.30000000000000004
   NaN 被接受： NaN
   重复键只留最后一个： {'a': 2}

``json.dumps()`` 默认允许 ``NaN`` 与 ``Infinity``，但标准 JSON 并不认这两个字面量，其他语言的解析器可能直接报错，对接外部系统时应该传 ``allow_nan=False``。重复键在解析时不会报错，后出现的值覆盖先前的值，这类问题只能靠生成端保证键唯一。

十一、练习任务
--------------

任务 1：解析一段接口响应，统计用户数量、平均年龄、VIP 名单和标签总数。

.. code-block:: python

   import json

   raw = """
   {
     "code": 0,
     "data": {
       "users": [
         {"name": "小明", "age": 18, "tags": ["vip", "new"]},
         {"name": "小红", "age": 22, "tags": ["vip"]},
         {"name": "小刚", "age": 17, "tags": []}
       ]
     }
   }
   """

   payload = json.loads(raw)
   users = payload["data"]["users"]

   print("用户数：", len(users))
   print("平均年龄：", round(sum(user["age"] for user in users) / len(users), 2))
   print("VIP 名单：", sorted(user["name"] for user in users if "vip" in user["tags"]))
   print("标签总数：", sum(len(user["tags"]) for user in users))

输出结果：

.. code-block:: text

   用户数： 3
   平均年龄： 19.0
   VIP 名单： ['小明', '小红']
   标签总数： 3

任务 2：把配置字典写成带缩进、键已排序的 JSON 文本，再读回来验证与原数据一致。

.. code-block:: python

   import json

   config = {
       "server": {"host": "127.0.0.1", "port": 8080},
       "features": ["search", "export"],
       "debug": False,
   }

   text = json.dumps(config, ensure_ascii=False, indent=4, sort_keys=True)
   print(text)
   print("行数：", len(text.splitlines()))
   print("往返一致：", json.loads(text) == config)

输出结果：

.. code-block:: text

   {
       "debug": false,
       "features": [
           "search",
           "export"
       ],
       "server": {
           "host": "127.0.0.1",
           "port": 8080
       }
   }
   行数： 11
   往返一致： True

任务 3：把多层嵌套的对象拍平成 ``a.b.c = 值`` 形式的行，值本身仍用 JSON 表示。

.. code-block:: python

   import json

   data = {"a": 1, "b": {"c": 2, "d": [3, 4]}, "e": {"f": {"g": 5}}}

   def flatten(obj, prefix=""):
       items = []
       for key in sorted(obj):
           value = obj[key]
           path = f"{prefix}.{key}" if prefix else key
           if isinstance(value, dict):
               items.extend(flatten(value, path))
           else:
               items.append((path, value))
       return items

   for path, value in flatten(data):
       print(f"{path} = {json.dumps(value, ensure_ascii=False)}")

输出结果：

.. code-block:: text

   a = 1
   b.c = 2
   b.d = [3, 4]
   e.f.g = 5
