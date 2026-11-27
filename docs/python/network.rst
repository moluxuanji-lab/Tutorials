Python 网络编程
===============

.. meta::
   :group: 标准库与实战
   :summary: 从 TCP/IP 基础出发，掌握 socket 的 TCP 服务端与客户端、UDP 通信、超时控制、HTTP 请求响应以及常见的网络错误处理。

网络编程的本质，是让两个进程按照约定的协议交换字节。Python 标准库把操作系统提供的套接字接口封装在 ``socket`` 模块里，不需要安装第三方包就能完成 TCP、UDP 和 HTTP 的基础通信。本章先用 ``ipaddress`` 认识地址与网段，再逐步搭建 TCP 服务端、客户端和 UDP 通道，最后在一个只绑定 ``127.0.0.1`` 的本地回环服务上完成真实对话。

所有示例都只使用回环地址 ``127.0.0.1``，不会访问外部网络；服务端端口统一写成 ``0``，由操作系统自动分配，因此不会和本机已占用的端口冲突。示例中也不会打印临时端口号，输出在每台机器上都一致。

一、TCP/IP 基础
----------------

TCP/IP 把网络通信拆成四层：链路层负责同一网段内的帧传输，网络层用 IP 地址定位主机，传输层用端口区分进程，应用层则是 HTTP、SMTP 这类具体协议。写代码时最常打交道的是网络层和传输层：IP 地址找到机器，端口找到机器上的某个服务。

IPv4 地址是 32 位整数，通常写成点分十进制；``127.0.0.1`` 是回环地址，数据不会离开本机。端口号是 16 位整数，取值范围 ``0`` 到 ``65535``，其中 ``0`` 表示“请操作系统分配一个空闲端口”，``1`` 到 ``1023`` 是系统保留端口，普通程序应使用 ``1024`` 以上的端口。

``ipaddress`` 模块可以完成地址校验和网段计算：

.. code-block:: python

   import ipaddress

   address = ipaddress.ip_address("127.0.0.1")
   print("版本：", address.version)
   print("是回环地址：", address.is_loopback)
   print("是私有地址：", address.is_private)
   print("是保留地址：", address.is_reserved)

   network = ipaddress.ip_network("192.168.1.0/24", strict=False)
   print("网段地址：", network.network_address)
   print("广播地址：", network.broadcast_address)
   print("可用主机数：", network.num_addresses - 2)

输出结果：

.. code-block:: text

   版本： 4
   是回环地址： True
   是私有地址： True
   是保留地址： False
   网段地址： 192.168.1.0
   广播地址： 192.168.1.255
   可用主机数： 254

``is_private`` 对 ``127.0.0.1`` 返回 ``True``，因为回环网段也属于特殊用途地址；``is_reserved`` 则只针对保留给实验用途的地址段。``ip_network(..., strict=False)`` 允许传入带主机位的网段，自动把它规范成网络地址。

传输层最常用的是 TCP 和 UDP，两者的取舍如下：

.. csv-table::
   :header: "特性", "TCP", "UDP"

   "连接方式", "面向连接，先握手再传输", "无连接，直接发送数据报"
   "可靠性", "确认与重传，保证顺序", "不保证到达与顺序"
   "数据形式", "连续的字节流", "独立的数据报"
   "典型协议", "HTTP、SMTP、SSH", "DNS、DHCP、视频通话"

TCP 的“面向连接”意味着通信前要完成三次握手，通信结束后要四次挥手；这些细节由操作系统处理，应用层看到的是 ``connect()``、``send()``、``recv()`` 这样的接口。UDP 则把每个数据报单独发送，开销小，但可靠性要由应用自己保证。

二、socket 对象
----------------

``socket.socket()`` 创建一个套接字，两个最常用的参数是地址族和套接字类型。``AF_INET`` 表示 IPv4，``SOCK_STREAM`` 表示 TCP 字节流，``SOCK_DGRAM`` 表示 UDP 数据报。套接字使用完必须关闭，否则文件描述符会泄漏；本章统一用 ``close()`` 或 ``with`` 语句释放。

.. code-block:: python

   import socket

   tcp = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
   udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

   print("TCP：", tcp.family.name, tcp.type.name, tcp.proto)
   print("UDP：", udp.family.name, udp.type.name, udp.proto)

   tcp.close()
   udp.close()

输出结果：

.. code-block:: text

   TCP： AF_INET SOCK_STREAM 0
   UDP： AF_INET SOCK_DGRAM 0

``family.name`` 与 ``type.name`` 把枚举值还原成可读的名字，``proto`` 为 ``0`` 表示使用该套接字类型的默认协议。实际项目中更常见的写法是直接传常量，需要判断类型时再读这两个属性。

三、TCP 服务端：bind、listen、accept
------------------------------------

TCP 服务端的工作顺序是固定的：创建套接字、``bind()`` 绑定地址和端口、``listen()`` 进入监听状态、循环调用 ``accept()`` 等待客户端。``accept()`` 会阻塞，直到有客户端完成三次握手，返回一个**新的**已连接套接字和客户端地址；原来的监听套接字继续负责接收后续连接。

下面的例子把端口写成 ``0``，再通过 ``getsockname()`` 确认系统已经分配了一个合法端口：

.. code-block:: python

   import socket

   server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
   server.bind(("127.0.0.1", 0))
   server.listen(1)

   host, port = server.getsockname()
   print("绑定地址：", host)
   print("端口自动分配：", port > 0)
   print("套接字已打开：", server.fileno() != -1)

   server.close()

输出结果：

.. code-block:: text

   绑定地址： 127.0.0.1
   端口自动分配： True
   套接字已打开： True

``listen(1)`` 的参数是等待队列长度，表示最多允许一个尚未被 ``accept()`` 取走的连接排队。队列满之后新的连接会被拒绝或忽略，因此高并发服务通常会把队列设得更大，并及时把 ``accept()`` 放到循环里。

四、TCP 客户端与一次完整对话
----------------------------

客户端用 ``connect()`` 发起连接，连接建立后双方都能用 ``send()`` / ``sendall()`` 发送、用 ``recv()`` 接收。``sendall()`` 会循环发送直到所有字节写完，比 ``send()`` 更适合发送完整消息。下面的例子在后台线程里启动服务端，主线程作为客户端，在 ``127.0.0.1`` 上完成一次问答：

.. code-block:: python

   import socket
   import threading

   result = {}

   def serve(server):
       conn, _ = server.accept()
       with conn:
           data = conn.recv(1024)
           result["request"] = data.decode("utf-8")
           conn.sendall("你好，客户端".encode("utf-8"))

   server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
   server.bind(("127.0.0.1", 0))
   server.listen(1)
   port = server.getsockname()[1]

   worker = threading.Thread(target=serve, args=(server,), daemon=True)
   worker.start()

   with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as client:
       client.settimeout(5)
       client.connect(("127.0.0.1", port))
       client.sendall("你好，服务端".encode("utf-8"))
       reply = client.recv(1024).decode("utf-8")

   worker.join()
   server.close()

   print("服务端收到：", result["request"])
   print("客户端收到：", reply)

输出结果：

.. code-block:: text

   服务端收到： 你好，服务端
   客户端收到： 你好，客户端

服务端把结果写进 ``result`` 字典而不是直接在子线程里打印，主线程执行 ``join()`` 之后再统一输出，这样两行结果的顺序不会受线程调度影响。``with conn`` 负责在对话结束后关闭已连接套接字，监听套接字则由 ``server.close()`` 显式释放。

五、TCP 数据边界与 sendall
--------------------------

TCP 提供的是字节流，不保留“消息边界”：一次 ``sendall()`` 发出的内容，对端可能分多次 ``recv()`` 收到，也可能两次发送被合并成一次读取。因此应用层必须自己定义边界，常见做法是“一行一条消息”或“长度前缀 + 正文”。下面的例子用换行符分帧，服务端用 ``makefile()`` 包装成可按行读取的文件对象：

.. code-block:: python

   import socket
   import threading

   received = []

   def serve(server):
       conn, _ = server.accept()
       with conn:
           stream = conn.makefile("rb")
           for _ in range(2):
               line = stream.readline().decode("utf-8").rstrip("\n")
               received.append(line)
           conn.sendall(b"ACK\n")

   server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
   server.bind(("127.0.0.1", 0))
   server.listen(1)
   port = server.getsockname()[1]

   worker = threading.Thread(target=serve, args=(server,), daemon=True)
   worker.start()

   with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as client:
       client.settimeout(5)
       client.connect(("127.0.0.1", port))
       client.sendall(b"first\nsecond\n")
       reply = client.recv(16).decode("utf-8").strip()

   worker.join()
   server.close()

   print("服务端逐行收到：", received)
   print("客户端收到：", reply)

输出结果：

.. code-block:: text

   服务端逐行收到： ['first', 'second']
   客户端收到： ACK

``makefile("rb")`` 返回一个带缓冲的文件对象，``readline()`` 会一直读到换行符为止，即使底层分多次 ``recv()`` 也能正确拼出完整一行。发送方必须保证每条消息以换行结尾，否则接收方会一直等待后续字节。

六、UDP：sendto 与 recvfrom
---------------------------

UDP 不需要建立连接，每个数据报都自带目标地址。客户端用 ``sendto()`` 发送，服务端用 ``recvfrom()`` 接收并拿到发送方地址，再用 ``sendto()`` 回复。UDP 不保证到达、不保证顺序，也不做重传，适合对实时性要求高、能容忍少量丢包的场景：

.. code-block:: python

   import socket

   server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
   server.bind(("127.0.0.1", 0))
   server.settimeout(5)
   port = server.getsockname()[1]

   client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
   client.settimeout(5)

   client.sendto(b"ping", ("127.0.0.1", port))
   data, addr = server.recvfrom(1024)
   server.sendto(data.upper(), addr)
   reply, _ = client.recvfrom(1024)

   print("服务端收到：", data.decode("utf-8"))
   print("客户端收到：", reply.decode("utf-8"))

   server.close()
   client.close()

输出结果：

.. code-block:: text

   服务端收到： ping
   客户端收到： PING

``recvfrom()`` 返回的第二个值是发送方的 ``(host, port)``，服务端直接把它传给 ``sendto()`` 就能把回复发回原地址，不需要事先知道客户端绑定的是哪个端口。``data.upper()`` 作用于 ``bytes``，只转换 ASCII 字母，因此 ``ping`` 变成 ``PING``。

七、超时控制
------------

网络操作默认可能无限阻塞。``settimeout()`` 为套接字设置超时秒数，超时后抛出 ``socket.timeout``（它是 ``TimeoutError`` 的别名）。服务端可以用它避免 ``accept()`` 一直挂起，客户端也应在 ``connect()``、``recv()`` 上设置合理上限：

.. code-block:: python

   import socket

   server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
   server.bind(("127.0.0.1", 0))
   server.listen(1)
   server.settimeout(0.2)

   timed_out = False
   try:
       server.accept()
   except socket.timeout:
       timed_out = True
   finally:
       server.close()

   print("accept 超时：", timed_out)

输出结果：

.. code-block:: text

   accept 超时： True

超时不是错误，而是“在指定时间内没有等到事件”的信号。捕获之后可以继续循环、记录日志或退出，关键是要有明确的处理分支，不要让异常直接冒到最外层。生产环境的超时值通常设置为几秒到几十秒，既不能太短导致频繁误判，也不能太长让故障线程长期占用资源。

八、HTTP 简介
--------------

HTTP 是建立在 TCP 之上的文本协议：客户端发送“请求行 + 请求头 + 空行 + 请求体”，服务端返回“状态行 + 响应头 + 空行 + 响应体”。请求行包含方法、路径和协议版本，状态行包含三位状态码和原因短语。``urllib.parse`` 可以拆解 URL，``http.HTTPStatus`` 提供了状态码的常量与英文描述：

.. code-block:: python

   from http import HTTPStatus
   from urllib.parse import parse_qs, urlsplit

   url = "http://127.0.0.1:8080/docs/python/network.rst?chapter=network&lang=zh#top"
   parts = urlsplit(url)

   print("协议：", parts.scheme)
   print("主机：", parts.hostname)
   print("端口：", parts.port)
   print("路径：", parts.path)
   print("查询参数：", sorted(parse_qs(parts.query).items()))
   print("片段：", parts.fragment)

   for status in (HTTPStatus.OK, HTTPStatus.NOT_FOUND, HTTPStatus.INTERNAL_SERVER_ERROR):
       print(status.value, status.phrase)

输出结果：

.. code-block:: text

   协议： http
   主机： 127.0.0.1
   端口： 8080
   路径： /docs/python/network.rst
   查询参数： [('chapter', ['network']), ('lang', ['zh'])]
   片段： top
   200 OK
   404 Not Found
   500 Internal Server Error

``urlsplit()`` 把 URL 拆成协议、主机、端口、路径、查询串和片段六部分；``parse_qs()`` 再把查询串解析成字典，值统一是列表，因为同一个参数可以出现多次。``HTTPStatus`` 是枚举，``value`` 是数字状态码，``phrase`` 是英文原因短语。

真正发请求时不必手写 TCP，``http.client`` 已经封装了请求构造和响应解析。下面的例子仍然在本地回环地址上启动一个极简 HTTP 服务端，收到请求后返回固定的纯文本响应：

.. code-block:: python

   import http.client
   import socket
   import threading

   body = "hello http"
   response = (
       "HTTP/1.1 200 OK\r\n"
       "Content-Type: text/plain; charset=utf-8\r\n"
       f"Content-Length: {len(body.encode('utf-8'))}\r\n"
       "Connection: close\r\n"
       "\r\n"
       + body
   ).encode("utf-8")

   def serve(server):
       conn, _ = server.accept()
       with conn:
           request = b""
           while b"\r\n\r\n" not in request:
               chunk = conn.recv(1024)
               if not chunk:
                   break
               request += chunk
           conn.sendall(response)

   server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
   server.bind(("127.0.0.1", 0))
   server.listen(1)
   port = server.getsockname()[1]

   worker = threading.Thread(target=serve, args=(server,), daemon=True)
   worker.start()

   connection = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
   connection.request("GET", "/")
   reply = connection.getresponse()

   print("状态码：", reply.status)
   print("原因：", reply.reason)
   print("内容类型：", reply.getheader("Content-Type"))
   print("正文：", reply.read().decode("utf-8"))

   connection.close()
   worker.join()
   server.close()

输出结果：

.. code-block:: text

   状态码： 200
   原因： OK
   内容类型： text/plain; charset=utf-8
   正文： hello http

服务端先循环读取，直到遇到空行 ``\r\n\r\n``，表示请求头结束；这个例子不处理请求体，所以读到空行就可以回复。响应中的 ``Content-Length`` 必须和正文的字节数一致，客户端才能判断响应何时结束。``Connection: close`` 告诉客户端本次请求结束后关闭连接。

九、错误处理
------------

网络错误几乎都以异常形式出现。``OSError`` 是大多数套接字错误的基类，``ConnectionRefusedError`` 表示目标端口没有服务在监听，``socket.gaierror`` 表示地址或服务名解析失败，``socket.timeout`` 表示操作超时。捕获异常时不要只写一个空的 ``except``，至少打印异常类型或记录日志，并确保套接字在 ``finally`` 中关闭。

端口被占用是服务端最常见的启动错误。下面的例子先绑定一个自动分配的端口，再尝试用另一个套接字绑定同一个端口：

.. code-block:: python

   import socket

   first = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
   first.bind(("127.0.0.1", 0))
   port = first.getsockname()[1]

   second = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
   try:
       second.bind(("127.0.0.1", port))
       print("重复绑定： 成功")
   except OSError as exc:
       print("重复绑定失败：", type(exc).__name__)
   finally:
       second.close()
       first.close()

输出结果：

.. code-block:: text

   重复绑定失败： OSError

``SO_REUSEADDR`` 可以让服务端在重启时复用处于 ``TIME_WAIT`` 状态的端口，但它不应该被用来掩盖“另一个进程仍在监听”的事实。排查端口占用时，可以先确认是否有旧进程没有退出，再决定是否调整套接字选项。

参数越界和服务名错误同样需要捕获。下面的例子分别触发 ``OverflowError`` 和 ``socket.gaierror``：

.. code-block:: python

   import socket

   sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
   try:
       sock.bind(("127.0.0.1", 70000))
   except OverflowError as exc:
       print("端口越界：", type(exc).__name__)
   except OSError as exc:
       print("绑定失败：", type(exc).__name__)
   finally:
       sock.close()

   try:
       socket.getaddrinfo("127.0.0.1", "not-a-service")
   except socket.gaierror as exc:
       print("解析失败：", type(exc).__name__)

输出结果：

.. code-block:: text

   端口越界： OverflowError
   解析失败： gaierror

端口号的合法范围是 ``0`` 到 ``65535``，超出范围时 Python 在参数校验阶段就抛出 ``OverflowError``，不会真正调用操作系统。``getaddrinfo()`` 的第二个参数既可以写数字端口，也可以写服务名；服务名不在系统服务表中时抛出 ``socket.gaierror``，它同时覆盖主机名解析失败的情况。

十、练习任务
------------

任务 1：查询常见服务对应的 TCP 端口。``socket.getservbyname()`` 会读取系统的服务表，如果服务名不存在则抛出 ``OSError``。不同系统的服务表条目并不完整，因此下面为查询失败的情况准备了内置端口作为回退：

.. code-block:: python

   import socket

   fallback = {"http": 80, "https": 443, "smtp": 25, "ssh": 22}
   for name, default_port in fallback.items():
       try:
           port = socket.getservbyname(name, "tcp")
       except OSError:
           port = default_port
       print(f"{name}: {port}")

输出结果：

.. code-block:: text

   http: 80
   https: 443
   smtp: 25
   ssh: 22

任务 2：实现一个本地回环 TCP 回声服务。客户端依次发送三行文本，服务端原样返回，双方都使用 ``makefile()`` 按行读写。

.. code-block:: python

   import socket
   import threading

   received = []

   def serve(server):
       conn, _ = server.accept()
       with conn:
           stream = conn.makefile("rwb")
           for _ in range(3):
               line = stream.readline()
               received.append(line.decode("utf-8").rstrip("\n"))
               stream.write(line)
               stream.flush()

   server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
   server.bind(("127.0.0.1", 0))
   server.listen(1)
   port = server.getsockname()[1]

   worker = threading.Thread(target=serve, args=(server,), daemon=True)
   worker.start()

   with socket.create_connection(("127.0.0.1", port), timeout=5) as client:
       stream = client.makefile("rwb")
       for text in ["alpha", "beta", "gamma"]:
           stream.write((text + "\n").encode("utf-8"))
           stream.flush()
           print("收到回声：", stream.readline().decode("utf-8").rstrip("\n"))

   worker.join()
   server.close()

   print("服务端处理条数：", len(received))

输出结果：

.. code-block:: text

   收到回声： alpha
   收到回声： beta
   收到回声： gamma
   服务端处理条数： 3

任务 3：用 UDP 完成一次加法请求。客户端发送 ``3,4``，服务端解析后返回 ``7``。

.. code-block:: python

   import socket

   server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
   server.bind(("127.0.0.1", 0))
   server.settimeout(5)
   port = server.getsockname()[1]

   client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
   client.settimeout(5)

   client.sendto(b"3,4", ("127.0.0.1", port))
   data, addr = server.recvfrom(1024)
   a, b = (int(part) for part in data.decode("ascii").split(","))
   server.sendto(str(a + b).encode("ascii"), addr)
   reply, _ = client.recvfrom(1024)

   print("请求：", data.decode("ascii"))
   print("响应：", reply.decode("ascii"))

   server.close()
   client.close()

输出结果：

.. code-block:: text

   请求： 3,4
   响应： 7
