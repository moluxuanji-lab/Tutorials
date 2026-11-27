Python requests 模块
=====================

.. meta::
   :group: 标准库与实战
   :summary: 安装并使用 requests 发送 GET 与 POST 请求，掌握查询参数、请求头、JSON 与表单、响应对象、超时与异常、Session 会话和请求预处理，理解它相比 urllib 的简洁之处。

``requests`` 是最常用的第三方 HTTP 库。它把连接池、会话、编码、JSON 解析、异常处理这些细节封装成简洁的接口，同样的请求用 urllib 往往要写十几行，用 requests 两三行就能完成。它和标准库 ``urllib`` 不是替代关系：requests 依赖 urllib3 实现底层连接，只是把易用性做到了极致。

一、安装与导入
--------------

requests 不是标准库，需要用 pip 安装：

.. code-block:: bash

   pip install requests

安装完成后，导入并确认版本可用：

.. code-block:: python

   try:
       import requests
   except ImportError:
       requests = None

   print("requests 已安装：", requests is not None)
   if requests is None:
       print("安装命令：pip install requests")

输出结果：

.. code-block:: text

   requests 已安装： True

很多项目会锁定版本，避免上游更新导致行为变化：

.. code-block:: bash

   pip install "requests==2.34.2"

二、发送 GET 请求
-----------------

``requests.get()`` 接收 URL 和一组关键字参数，返回 ``Response`` 对象。``params`` 传查询参数，库会负责编码；``headers`` 传请求头；``timeout`` 限制等待时间：

.. code-block:: python

   import json
   import threading
   from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
   from urllib.parse import parse_qs, urlparse

   import requests

   class Api(BaseHTTPRequestHandler):
       def do_GET(self):
           parsed = urlparse(self.path)
           if parsed.path == "/missing":
               self.send_error(404, "Not Found")
               return
           params = parse_qs(parsed.query)
           payload = {
               "path": parsed.path,
               "name": params.get("name", ["访客"])[0],
               "ua": self.headers.get("User-Agent"),
           }
           body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
           self.send_response(200)
           self.send_header("Content-Type", "application/json; charset=utf-8")
           self.end_headers()
           self.wfile.write(body)

       def log_message(self, *args):
           pass

   server = ThreadingHTTPServer(("127.0.0.1", 0), Api)
   threading.Thread(target=server.serve_forever, daemon=True).start()
   base = f"http://127.0.0.1:{server.server_address[1]}"

   response = requests.get(
       base + "/hello",
       params={"name": "小明"},
       headers={"User-Agent": "TutorialBot/2.0"},
       timeout=5,
   )

   print("状态码：", response.status_code)
   print("编码：", response.encoding)
   print("JSON：", response.json())
   print("请求路径：", response.url.replace(base, ""))

   server.shutdown()

输出结果：

.. code-block:: text

   状态码： 200
   编码： utf-8
   JSON： {'path': '/hello', 'name': '小明', 'ua': 'TutorialBot/2.0'}
   请求路径： /hello?name=%E5%B0%8F%E6%98%8E

查询参数传字典即可，中文会自动转成 UTF-8 百分号编码。不要把参数手工拼进 URL，既容易漏转义，也无法处理列表参数（``params={"tag": ["a", "b"]}`` 会展开成 ``tag=a&tag=b``）。

三、响应对象
------------

``Response`` 把服务器返回的信息集中在一起，最常用的属性如下：

.. csv-table::
   :header: "属性或方法", "说明"

   "``status_code``", "HTTP 状态码，200 表示成功"
   "``ok``", "状态码是否小于 400"
   "``text``", "按推断的编码解码后的字符串"
   "``content``", "原始字节，适合图片、压缩包"
   "``json()``", "把响应体解析成 Python 对象，失败抛 ``JSONDecodeError``"
   "``headers``", "响应头字典，键不区分大小写"
   "``encoding``", "当前使用的字符编码，可以手动修改"
   "``url``", "最终请求的地址，跟随重定向后可能变化"

.. code-block:: python

   import json
   import threading
   from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
   from urllib.parse import parse_qs, urlparse

   import requests

   class Api(BaseHTTPRequestHandler):
       def do_GET(self):
           body = json.dumps({"name": "小明"}, ensure_ascii=False).encode("utf-8")
           self.send_response(200)
           self.send_header("Content-Type", "application/json; charset=utf-8")
           self.send_header("X-Trace-Id", "demo-001")
           self.end_headers()
           self.wfile.write(body)

       def log_message(self, *args):
           pass

   server = ThreadingHTTPServer(("127.0.0.1", 0), Api)
   threading.Thread(target=server.serve_forever, daemon=True).start()
   base = f"http://127.0.0.1:{server.server_address[1]}"

   response = requests.get(base + "/profile", timeout=5)

   print("状态码：", response.status_code, "ok：", response.ok)
   print("内容类型：", response.headers["Content-Type"])
   print("追踪号：", response.headers.get("X-Trace-Id"))
   print("文本长度：", len(response.text))
   print("字节长度：", len(response.content))
   print("JSON：", response.json())

   server.shutdown()

输出结果：

.. code-block:: text

   状态码： 200 ok： True
   内容类型： application/json; charset=utf-8
   追踪号： demo-001
   文本长度： 15
   字节长度： 15
   JSON： {'name': '小明'}

``response.encoding`` 来自响应头里的 ``charset``；如果服务器没有声明，requests 会按 HTTP 规范推断，中文站点偶尔会猜错。此时可以手动设置 ``response.encoding = "utf-8"``，再读 ``response.text``。``response.content`` 永远返回原始字节，不受编码设置影响。

四、发送 POST 请求
------------------

``data`` 用来提交表单，``json`` 用来提交 JSON。两者的关键区别是 ``Content-Type``：``data`` 默认为 ``application/x-www-form-urlencoded``，``json`` 会自动设为 ``application/json`` 并序列化：

.. code-block:: python

   import json
   import threading
   from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
   from urllib.parse import parse_qs

   import requests

   class Api(BaseHTTPRequestHandler):
       def do_POST(self):
           length = int(self.headers.get("Content-Length", 0))
           raw = self.rfile.read(length).decode("utf-8")
           content_type = self.headers.get("Content-Type", "")
           if content_type.startswith("application/json"):
               payload = {"json": json.loads(raw)}
           else:
               payload = {"form": {key: values[0] for key, values in parse_qs(raw).items()}}
           body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
           self.send_response(200)
           self.send_header("Content-Type", "application/json; charset=utf-8")
           self.end_headers()
           self.wfile.write(body)

       def log_message(self, *args):
           pass

   server = ThreadingHTTPServer(("127.0.0.1", 0), Api)
   threading.Thread(target=server.serve_forever, daemon=True).start()
   base = f"http://127.0.0.1:{server.server_address[1]}"

   form = requests.post(base + "/echo", data={"name": "小红", "age": "18"}, timeout=5)
   print("表单：", form.json()["form"])

   payload = requests.post(base + "/echo", json={"name": "小红", "age": 18}, timeout=5)
   print("JSON：", payload.json()["json"])

   server.shutdown()

输出结果：

.. code-block:: text

   表单： {'name': '小红', 'age': '18'}
   JSON： {'name': '小红', 'age': 18}

表单里的值最终都会变成字符串，JSON 则保留数字、布尔、嵌套结构等类型。接口文档要求 JSON 时不要用 ``data=json.dumps(...)`` 再手工设 Content-Type，直接传 ``json=`` 更不容易出错。

五、超时与异常
--------------

requests 的异常都继承自 ``RequestException``，常见的有：

.. csv-table::
   :header: "异常", "触发场景"

   "``Timeout``", "连接或读取超过指定时间"
   "``ConnectionError``", "连接被拒绝、DNS 失败、网络中断"
   "``HTTPError``", "调用 ``raise_for_status()`` 且状态码为 4xx 或 5xx"
   "``TooManyRedirects``", "重定向次数超过上限"
   "``RequestException``", "以上异常的基类，用它兜底最稳"

.. code-block:: python

   import requests

   try:
       requests.get("http://127.0.0.1:1/", timeout=1)
   except requests.RequestException as exc:
       print("捕获 RequestException：", isinstance(exc, requests.RequestException))

输出结果：

.. code-block:: text

   捕获 RequestException： True

``timeout`` 可以是一个数字，表示连接与读取共用的上限；也可以传 ``(connect_timeout, read_timeout)`` 元组分别控制。不设置超时，请求可能永久阻塞，生产代码中应当始终显式传入。

状态码 4xx 和 5xx 默认不会抛异常，需要调用 ``raise_for_status()`` 显式检查：

.. code-block:: python

   import threading
   from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

   import requests

   class Api(BaseHTTPRequestHandler):
       def do_GET(self):
           self.send_error(404, "Not Found")

       def log_message(self, *args):
           pass

   server = ThreadingHTTPServer(("127.0.0.1", 0), Api)
   threading.Thread(target=server.serve_forever, daemon=True).start()
   base = f"http://127.0.0.1:{server.server_address[1]}"

   response = requests.get(base + "/missing", timeout=5)
   print("状态码：", response.status_code, "ok：", response.ok)

   try:
       response.raise_for_status()
   except requests.HTTPError as exc:
       print("异常：", type(exc).__name__)
       print("响应状态：", exc.response.status_code)

   server.shutdown()

输出结果：

.. code-block:: text

   状态码： 404 ok： False
   异常： HTTPError
   响应状态： 404

六、Session 会话
----------------

``requests.get()`` 每次都会新建连接。多个请求访问同一站点时，用 ``Session`` 可以复用 TCP 连接、保持 Cookie、统一默认请求头：

.. code-block:: python

   import json
   import threading
   from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
   from urllib.parse import parse_qs, urlparse

   import requests

   class Api(BaseHTTPRequestHandler):
       def do_GET(self):
           params = parse_qs(urlparse(self.path).query)
           payload = {
               "name": params.get("name", ["访客"])[0],
               "ua": self.headers.get("User-Agent"),
           }
           body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
           self.send_response(200)
           self.send_header("Content-Type", "application/json; charset=utf-8")
           self.end_headers()
           self.wfile.write(body)

       def log_message(self, *args):
           pass

   server = ThreadingHTTPServer(("127.0.0.1", 0), Api)
   threading.Thread(target=server.serve_forever, daemon=True).start()
   base = f"http://127.0.0.1:{server.server_address[1]}"

   with requests.Session() as session:
       session.headers.update({"User-Agent": "SessionBot/1.0"})
       first = session.get(base + "/hello", params={"name": "甲"}, timeout=5)
       second = session.get(base + "/hello", params={"name": "乙"}, timeout=5)

   print("会话结果：", first.json()["name"], second.json()["name"])
   print("UA：", first.json()["ua"])

   server.shutdown()

输出结果：

.. code-block:: text

   会话结果： 甲 乙
   UA： SessionBot/1.0

``Session`` 还可以挂载重试策略、代理、证书，配合 ``requests.adapters.HTTPAdapter`` 使用。爬虫、API 客户端几乎都会创建一个长生命周期的 Session，而不是反复调用顶层函数。

七、准备请求与参数编码
----------------------

``Session.prepare_request()`` 把请求对象转换成最终要发送的形式，可以提前检查 URL 编码和请求头：

.. code-block:: python

   import requests

   with requests.Session() as session:
       prepared = session.prepare_request(
           requests.Request(
               "GET",
               "https://example.com/search",
               params={"q": "Python 教程", "page": 2},
           )
       )

   print("URL：", prepared.url)
   print("带 UA：", "User-Agent" in prepared.headers)
   print("UA 前缀：", prepared.headers["User-Agent"].startswith("python-requests/"))

输出结果：

.. code-block:: text

   URL： https://example.com/search?q=Python+%E6%95%99%E7%A8%8B&page=2
   带 UA： True
   UA 前缀： True

顶层 ``requests.get()`` 内部同样会经过这一步。需要签名、重放或调试时，提前拿到 prepared request 会更方便。

八、常用技巧与注意事项
----------------------

.. csv-table::
   :header: "需求", "写法"

   "自定义请求头", "``headers={\"Authorization\": \"Bearer ...\"}``"
   "上传文件", "``files={\"file\": open(\"a.txt\", \"rb\")}``"
   "设置 Cookie", "``cookies={\"token\": \"abc\"}``"
   "禁止重定向", "``allow_redirects=False``"
   "关闭证书校验（仅测试）", "``verify=False``，同时会收到警告"
   "使用代理", "``proxies={\"https\": \"http://127.0.0.1:7890\"}``"
   "限制响应大小", "``stream=True`` 后按块读取，及时关闭"

几个常见坑：

* **编码错误**：响应头没有 ``charset`` 时，``response.text`` 可能乱码，手动设置 ``response.encoding = "utf-8"``。
* **JSON 解析失败**：先看 ``response.text`` 实际内容，有些接口出错时返回的是 HTML 而不是 JSON。
* **HTTPS 证书**：公司内网代理可能导致证书校验失败，应安装公司根证书，而不是无脑 ``verify=False``。
* **连接泄漏**：``stream=True`` 的响应必须调用 ``response.close()`` 或使用 ``with`` 语句。
* **重试**：网络抖动用 ``HTTPAdapter(max_retries=...)`` 配置，不要自己写无限循环。

九、练习任务
------------

任务 1：请求本地接口，把返回的文本保存到文件，并打印文件大小。

.. code-block:: python

   import threading
   from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

   import requests

   class Api(BaseHTTPRequestHandler):
       def do_GET(self):
           body = "requests 下载完成".encode("utf-8")
           self.send_response(200)
           self.send_header("Content-Type", "text/plain; charset=utf-8")
           self.end_headers()
           self.wfile.write(body)

       def log_message(self, *args):
           pass

   server = ThreadingHTTPServer(("127.0.0.1", 0), Api)
   threading.Thread(target=server.serve_forever, daemon=True).start()
   base = f"http://127.0.0.1:{server.server_address[1]}"

   response = requests.get(base + "/download", timeout=5)
   with open("download.txt", "w", encoding="utf-8") as file:
       file.write(response.text)

   print("内容：", response.text)
   print("字符数：", len(response.text))

   server.shutdown()

输出结果：

.. code-block:: text

   内容： requests 下载完成
   字符数： 8

任务 2：用同一个 Session 依次查询三个名字，收集返回结果。

.. code-block:: python

   import json
   import threading
   from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
   from urllib.parse import parse_qs, urlparse

   import requests

   class Api(BaseHTTPRequestHandler):
       def do_GET(self):
           name = parse_qs(urlparse(self.path).query).get("name", ["访客"])[0]
           body = json.dumps({"name": name}, ensure_ascii=False).encode("utf-8")
           self.send_response(200)
           self.send_header("Content-Type", "application/json; charset=utf-8")
           self.end_headers()
           self.wfile.write(body)

       def log_message(self, *args):
           pass

   server = ThreadingHTTPServer(("127.0.0.1", 0), Api)
   threading.Thread(target=server.serve_forever, daemon=True).start()
   base = f"http://127.0.0.1:{server.server_address[1]}"

   names = []
   with requests.Session() as session:
       for name in ["小明", "小红", "小刚"]:
           response = session.get(base + "/query", params={"name": name}, timeout=5)
           names.append(response.json()["name"])

   print("查询结果：", names)
   server.shutdown()

输出结果：

.. code-block:: text

   查询结果： ['小明', '小红', '小刚']

任务 3：访问一个不存在的路径，分别打印状态码、``ok``，并演示 ``raise_for_status()`` 抛出的异常类型。

.. code-block:: python

   import threading
   from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

   import requests

   class Api(BaseHTTPRequestHandler):
       def do_GET(self):
           self.send_error(404, "Not Found")

       def log_message(self, *args):
           pass

   server = ThreadingHTTPServer(("127.0.0.1", 0), Api)
   threading.Thread(target=server.serve_forever, daemon=True).start()
   base = f"http://127.0.0.1:{server.server_address[1]}"

   response = requests.get(base + "/not-exists", timeout=5)
   print("状态码：", response.status_code)
   print("ok：", response.ok)
   try:
       response.raise_for_status()
   except requests.HTTPError as exc:
       print("异常类型：", type(exc).__name__)

   server.shutdown()

输出结果：

.. code-block:: text

   状态码： 404
   ok： False
   异常类型： HTTPError

requests 用起来简单，但它默认不做重试、不限制响应大小，也不校验业务状态码。封装一层客户端，把超时、重试、日志和错误码统一处理，才能让接口调用在线上稳定运行。下一章介绍 pip，把依赖安装与环境管理讲清楚。