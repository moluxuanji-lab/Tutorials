Python urllib
==============

.. meta::
   :group: 标准库与实战
   :summary: 使用标准库 urllib 打开 URL、发送 GET 与 POST 请求、构造查询参数、解析和拼接 URL、处理 HTTP 错误、下载文件，并了解 robots.txt 与编码安全注意事项。

``urllib`` 是 Python 标准库里的 URL 处理工具包，不需要安装第三方依赖就能抓取网页、调用 HTTP 接口、解析地址。它由几个子模块组成，各管一件事：

.. csv-table::
   :header: "模块", "职责"

   "``urllib.request``", "打开 URL，构造请求，读取响应"
   "``urllib.error``", "定义 ``URLError``、``HTTPError`` 等异常"
   "``urllib.parse``", "拆分 URL、编码查询参数、拼接相对地址"
   "``urllib.robotparser``", "解析 robots.txt，判断能否抓取"

本章示例尽量不依赖外部网络：能用 ``data:`` URL 演示的就不发真实请求，需要 HTTP 交互时启动一个本地回环服务器，运行结束后自动关闭。

一、打开 URL：urlopen
---------------------

``urlopen()`` 接受 URL 字符串或 ``Request`` 对象，返回一个类似文件的对象，可以 ``read()``、``readline()``，也可以用 ``with`` 自动关闭。下面用 ``data:`` URL 演示，它把内容直接编码在地址里，适合离线验证：

.. code-block:: python

   from urllib.request import urlopen

   with urlopen("data:text/plain;charset=utf-8,Hello%20urllib") as response:
       body = response.read()
       print("内容：", body.decode("utf-8"))
       print("Content-Type：", response.headers["Content-Type"])

输出结果：

.. code-block:: text

   内容： Hello urllib
   Content-Type： text/plain;charset=utf-8

``read()`` 返回 ``bytes``，文本内容需要按响应头里的字符集解码。真实网页常见的编码是 UTF-8，但并非全部；稳妥的做法是从 ``Content-Type`` 中取 ``charset``，取不到时再回退到 UTF-8。

``urlopen()`` 的常用参数有 ``timeout``（秒）、``data``（请求体）和 ``cafile`` / ``context``（HTTPS 证书设置）。不传 ``data`` 时使用 GET；传入 ``data`` 时自动变成 POST。

二、URL 编码
------------

URL 只能安全传输一部分 ASCII 字符，中文、空格、``&``、``?`` 等都必须转义。``urlencode()`` 把字典或键值对序列化成查询串，``parse_qs()`` 反向解析：

.. code-block:: python

   from urllib.parse import urlencode, parse_qs

   params = {"q": "Python 教程", "page": 2, "lang": "zh"}
   query = urlencode(params)
   print(query)
   print(parse_qs(query))

输出结果：

.. code-block:: text

   q=Python+%E6%95%99%E7%A8%8B&page=2&lang=zh
   {'q': ['Python 教程'], 'page': ['2'], 'lang': ['zh']}

``urlencode()`` 默认用 ``+`` 表示空格，这适合查询串；如果编码的是路径片段，应当把 ``quote_via=quote`` 传进去，让空格变成 ``%20``。``parse_qs()`` 的结果是“键 → 列表”，因为同一个参数可以出现多次；只想要最后一个值时用 ``parse_qsl()`` 再自行处理。

``quote()`` 与 ``unquote()`` 负责单个字符串的转义。``safe`` 参数指定哪些字符保持原样，默认保留 ``/``，处理路径片段时通常设为空字符串：

.. code-block:: python

   from urllib.parse import quote, unquote

   print(quote("a b/c?d", safe=""))
   print(unquote("%E4%BD%A0%E5%A5%BD"))
   print(unquote("a%20b"))

输出结果：

.. code-block:: text

   a%20b%2Fc%3Fd
   你好
   a b

直接把中文拼进 URL 会出问题：``http.client`` 发送请求行时只接受 ASCII，遇到未编码的中文会抛出 ``UnicodeEncodeError``。所有动态参数都应当先经过 ``urlencode()`` 或 ``quote()``。

三、解析与拼接 URL
------------------

``urlparse()`` 把地址拆成协议、主机、路径、查询串、片段五部分，并额外提供用户名、密码、端口等属性：

.. code-block:: python

   from urllib.parse import urlparse, urljoin

   url = "https://user:pass@docs.python.org:8443/zh-cn/3/library/urllib.parse.html?q=1#top"
   parts = urlparse(url)

   print(parts.scheme, parts.netloc, parts.path, parts.query, parts.fragment)
   print(parts.username, parts.password, parts.port)
   print(urljoin("https://example.com/a/b/", "../c.html"))

输出结果：

.. code-block:: text

   https user:pass@docs.python.org:8443 /zh-cn/3/library/urllib.parse.html q=1 top
   user pass 8443
   https://example.com/a/c.html

``urljoin()`` 按 RFC 3986 的规则解析相对地址：以 ``/`` 开头替换整个路径，以 ``../`` 开头先回退一级目录，不带斜杠则替换最后一段。抓取网页时，页内链接大多需要这样转成绝对地址再继续访问。

``urlsplit()`` 与 ``urlparse()`` 接近，但不单独解析 ``params``（分号后的参数），在新代码中更常用。``urlunsplit()`` 则把拆分后的元组重新拼回字符串。

四、发送 GET 与 POST
--------------------

真实请求通常要带查询参数、请求头、请求体。下面启动一个本地 HTTP 服务，依次演示 GET、404 错误、自定义 ``User-Agent`` 和 POST：

.. code-block:: python

   import json
   import threading
   from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
   from urllib.error import HTTPError
   from urllib.parse import parse_qs, urlencode, urlparse
   from urllib.request import Request, urlopen

   class Handler(BaseHTTPRequestHandler):
       def do_GET(self):
           parsed = urlparse(self.path)
           if parsed.path == "/hello":
               name = parse_qs(parsed.query).get("name", ["访客"])[0]
               body = f"你好，{name}".encode("utf-8")
               self.send_response(200)
               self.send_header("Content-Type", "text/plain; charset=utf-8")
               self.end_headers()
               self.wfile.write(body)
           elif parsed.path == "/headers":
               body = self.headers.get("User-Agent", "无").encode("utf-8")
               self.send_response(200)
               self.send_header("Content-Type", "text/plain; charset=utf-8")
               self.end_headers()
               self.wfile.write(body)
           else:
               self.send_error(404, "Not Found")

       def do_POST(self):
           length = int(self.headers["Content-Length"])
           body = self.rfile.read(length).decode("utf-8")
           reply = json.dumps(
               {"received": body, "type": self.headers["Content-Type"]},
               ensure_ascii=False,
           ).encode("utf-8")
           self.send_response(200)
           self.send_header("Content-Type", "application/json; charset=utf-8")
           self.end_headers()
           self.wfile.write(reply)

       def log_message(self, *args):
           pass

   server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
   threading.Thread(target=server.serve_forever, daemon=True).start()
   base = f"http://127.0.0.1:{server.server_address[1]}"

   query = urlencode({"name": "小明"})
   with urlopen(base + "/hello?" + query) as response:
       print("GET：", response.read().decode("utf-8"))

   try:
       urlopen(base + "/missing")
   except HTTPError as exc:
       print("错误码：", exc.code, "原因：", exc.reason)

   request = Request(base + "/headers", headers={"User-Agent": "TutorialBot/1.0"})
   with urlopen(request) as response:
       print("UA：", response.read().decode("utf-8"))

   request = Request(
       base + "/echo",
       data="name=小红".encode("utf-8"),
       method="POST",
       headers={"Content-Type": "text/plain; charset=utf-8"},
   )
   with urlopen(request) as response:
       reply = json.loads(response.read().decode("utf-8"))
       print("POST：", reply["received"])

   server.shutdown()

输出结果：

.. code-block:: text

   GET： 你好，小明
   错误码： 404 原因： Not Found
   UA： TutorialBot/1.0
   POST： name=小红

``Request`` 对象把方法、地址、请求头、请求体打包在一起。``headers`` 的键不区分大小写，默认的 ``User-Agent`` 是 ``Python-urllib/3.x``，很多站点会拒绝默认值，抓取前应当设置一个能说明用途的标识。

服务端读取 POST 请求体时必须依据 ``Content-Length``，否则 ``rfile.read()`` 不知道读到哪里。示例里用 ``json.dumps(..., ensure_ascii=False)`` 保留中文，再用 UTF-8 编码，避免出现 ``\u4f60`` 这样的转义。

五、错误处理
------------

``urllib`` 把两类错误分得很清楚：

* ``HTTPError``：服务器已经返回响应，只是状态码不是 2xx，例如 404、403、500。它同时是一个响应对象，可以读取错误页内容。
* ``URLError``：请求没能到达服务器，例如域名解析失败、连接被拒绝、超时。真正的底层异常放在 ``exc.reason`` 里。

.. code-block:: python

   from urllib.error import URLError
   from urllib.request import urlopen

   try:
       urlopen("http://127.0.0.1:1/", timeout=1)
   except URLError as exc:
       print("连接失败：", type(exc).__name__)

输出结果：

.. code-block:: text

   连接失败： URLError

``HTTPError`` 是 ``URLError`` 的子类，所以捕获顺序应当先处理 ``HTTPError``，再处理 ``URLError``。网络请求必须设置超时，否则遇到不响应的服务器会一直等待。

六、下载文件
------------

``urlretrieve()`` 把响应直接写入文件，适合下载图片、压缩包等二进制内容。它不负责校验和断点续传，生产环境更常用 ``requests`` 或专门下载库：

.. code-block:: python

   import os
   import tempfile
   from urllib.request import urlretrieve

   folder = tempfile.mkdtemp(prefix="urllib_demo_")
   target = os.path.join(folder, "hello.txt")
   urlretrieve("data:text/plain;charset=utf-8,download%20ok", target)

   with open(target, encoding="utf-8") as file:
       print(file.read())
   print("字节数：", os.path.getsize(target))

输出结果：

.. code-block:: text

   download ok
   字节数： 11

``urlretrieve()`` 返回 ``(文件名, headers)`` 元组，可以用后者确认内容类型和长度。下载大文件时应当分块读写，避免一次性把内容读进内存。

七、robots.txt 与抓取礼仪
-------------------------

``RobotFileParser`` 读取站点的 robots.txt，判断某个 User-Agent 能否访问指定路径。它只负责解析规则，不会自动帮你遵守：

.. code-block:: python

   from urllib.robotparser import RobotFileParser

   parser = RobotFileParser()
   parser.parse([
       "User-agent: *",
       "Disallow: /admin/",
       "Crawl-delay: 2",
   ])

   print(parser.can_fetch("*", "https://example.com/index.html"))
   print(parser.can_fetch("*", "https://example.com/admin/secret"))
   print(parser.crawl_delay("*"))

输出结果：

.. code-block:: text

   True
   False
   2

``parse()`` 既能接受多行字符串列表，也能接受 ``readlines()`` 的结果；``set_url()`` 加 ``read()`` 会真正下载 robots.txt。抓取前先读取规则，控制请求频率，并在 ``User-Agent`` 里留下联系方式，是基本的抓取礼仪。

八、编码与安全注意事项
----------------------

使用 urllib 时有几件事需要特别注意：

* **中文参数必须编码**：查询串用 ``urlencode()``，路径片段用 ``quote()``，否则会抛出 ``UnicodeEncodeError``。
* **响应内容按声明解码**：优先读 ``Content-Type`` 的 ``charset``，没有声明时再尝试 UTF-8，并处理解码失败。
* **不要信任 URL**：服务端脚本如果接受用户传入的地址并直接 ``urlopen()``，可能被用来访问内网地址（SSRF）。应当限制协议为 ``http`` / ``https``，并校验主机和解析后的 IP。
* **限制大小与超时**：读取 ``read()`` 前先看 ``Content-Length``，对未知长度的响应分块读取并设置上限。
* **遵守 robots.txt 与版权**：抓取公开页面也要控制频率，不要绕过登录、验证码或付费墙。

九、练习任务
------------

任务 1：把一段查询串解析成字典，再添加一个参数重新编码，保证中文正确转义。

.. code-block:: python

   from urllib.parse import parse_qs, urlencode

   original = "q=Python+%E6%95%99%E7%A8%8B&page=2"
   params = {key: values[0] for key, values in parse_qs(original).items()}
   params["lang"] = "zh"

   print(params)
   print(urlencode(params))

输出结果：

.. code-block:: text

   {'q': 'Python 教程', 'page': '2', 'lang': 'zh'}
   q=Python+%E6%95%99%E7%A8%8B&page=2&lang=zh

任务 2：用 ``urljoin()`` 把页面里的相对链接补成绝对地址。

.. code-block:: python

   from urllib.parse import urljoin

   base = "https://example.com/docs/python/"
   links = ["intro.html", "/about", "../index.html", "?page=2"]

   for link in links:
       print(urljoin(base, link))

输出结果：

.. code-block:: text

   https://example.com/docs/python/intro.html
   https://example.com/about
   https://example.com/docs/index.html
   https://example.com/docs/python/?page=2

任务 3：启动一个本地服务，返回一段 JSON，用 urllib 读取并解析成字典。

.. code-block:: python

   import json
   import threading
   from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
   from urllib.request import urlopen

   class Api(BaseHTTPRequestHandler):
       def do_GET(self):
           body = json.dumps({"ok": True, "lang": "Python"}).encode("utf-8")
           self.send_response(200)
           self.send_header("Content-Type", "application/json; charset=utf-8")
           self.end_headers()
           self.wfile.write(body)

       def log_message(self, *args):
           pass

   server = ThreadingHTTPServer(("127.0.0.1", 0), Api)
   threading.Thread(target=server.serve_forever, daemon=True).start()

   with urlopen(f"http://127.0.0.1:{server.server_address[1]}/status") as response:
       data = json.loads(response.read().decode("utf-8"))

   print("ok：", data["ok"])
   print("lang：", data["lang"])
   server.shutdown()

输出结果：

.. code-block:: text

   ok： True
   lang： Python

标准库能完成基础抓取，但处理会话、重试、连接池时写法会比较繁琐。下一章介绍第三方库 requests，它把这些常见需求封装成了更简洁的接口。