Python SMTP 发送邮件
====================

.. meta::
   :group: 标准库与实战
   :summary: 理解 SMTP 会话流程，掌握 smtplib 的 SMTP 与 SMTP_SSL、login、starttls、sendmail、send_message，以及用 email.mime 构造纯文本、HTML 和带附件邮件的完整方法。

邮件是网络应用里最常见的外部通知渠道之一。Python 标准库提供了两层支持：``smtplib`` 负责与 SMTP 服务器对话，``email`` 包负责构造和解析符合 MIME 规范的邮件内容。把两者组合起来，几十行代码就能完成“登录邮箱、填写主题、添加附件、发送给多个收件人”的流程。

本章的示例只构造邮件并打印 ``as_string()``，不会真的建立 SMTP 连接，也不会发送任何邮件。真正发送的调用放在注释或函数定义里，读者可以安全地逐段运行；需要接入真实邮箱时，再替换服务器地址、账号和授权码。

一、SMTP 工作流程
------------------

SMTP（Simple Mail Transfer Protocol）是发信方与邮件服务器之间的文本协议。一次典型会话包含建立连接、握手、加密、认证、声明信封、传输正文和退出等阶段。服务器用三位数字响应码表示结果，``2xx`` 表示成功，``3xx`` 表示需要继续输入，``4xx`` 表示临时失败，``5xx`` 表示永久失败。

.. csv-table::
   :header: "阶段", "客户端命令", "典型响应", "作用"

   "建立连接", "无", "220 ...", "服务器就绪"
   "握手", "EHLO", "250 ...", "声明客户端身份并协商扩展"
   "加密", "STARTTLS", "220 ...", "把明文连接升级为 TLS"
   "认证", "AUTH LOGIN", "334 / 235", "提交账号与授权码"
   "信封", "MAIL FROM", "250 ...", "声明发件人地址"
   "收件人", "RCPT TO", "250 ...", "声明收件人，可重复多次"
   "正文", "DATA", "354 ...", "发送头部和正文，以单独一行句点结束"
   "退出", "QUIT", "221 ...", "结束会话"

下面把一次会话的双方输出按顺序打印出来，帮助建立直观印象：

.. code-block:: python

   steps = [
       ("S", "220 smtp.example.com ESMTP ready"),
       ("C", "EHLO client.example.com"),
       ("S", "250-smtp.example.com"),
       ("S", "250 AUTH LOGIN PLAIN"),
       ("C", "STARTTLS"),
       ("S", "220 Ready to start TLS"),
       ("C", "AUTH LOGIN"),
       ("S", "334 VXNlcm5hbWU6"),
       ("C", "c2VuZGVyQGV4YW1wbGUuY29t"),
       ("S", "334 UGFzc3dvcmQ6"),
       ("C", "5o6I5p2D56CB"),
       ("S", "235 Authentication successful"),
       ("C", "MAIL FROM:<sender@example.com>"),
       ("S", "250 OK"),
       ("C", "RCPT TO:<receiver@example.com>"),
       ("S", "250 OK"),
       ("C", "DATA"),
       ("S", "354 End data with <CR><LF>.<CR><LF>"),
       ("C", "Subject: hello"),
       ("C", "From: sender@example.com"),
       ("C", "To: receiver@example.com"),
       ("C", ""),
       ("C", "Hello from Python"),
       ("C", "."),
       ("S", "250 Queued"),
       ("C", "QUIT"),
       ("S", "221 Bye"),
   ]

   for side, line in steps:
       print(f"{side}: {line if line else '<空行>'}")

输出结果：

.. code-block:: text

   S: 220 smtp.example.com ESMTP ready
   C: EHLO client.example.com
   S: 250-smtp.example.com
   S: 250 AUTH LOGIN PLAIN
   C: STARTTLS
   S: 220 Ready to start TLS
   C: AUTH LOGIN
   S: 334 VXNlcm5hbWU6
   C: c2VuZGVyQGV4YW1wbGUuY29t
   S: 334 UGFzc3dvcmQ6
   C: 5o6I5p2D56CB
   S: 235 Authentication successful
   C: MAIL FROM:<sender@example.com>
   S: 250 OK
   C: RCPT TO:<receiver@example.com>
   S: 250 OK
   C: DATA
   S: 354 End data with <CR><LF>.<CR><LF>
   C: Subject: hello
   C: From: sender@example.com
   C: To: receiver@example.com
   C: <空行>
   C: Hello from Python
   C: .
   S: 250 Queued
   C: QUIT
   S: 221 Bye

``EHLO`` 之后服务器会列出自己支持的扩展，``AUTH LOGIN`` 只是其中一种认证方式，很多服务商也支持 ``AUTH PLAIN`` 或 OAuth2。``MAIL FROM`` 和 ``RCPT TO`` 构成信封，决定邮件实际投递到哪些地址；``DATA`` 之后的头部和正文才是收件人看到的内容。正文以单独一行 ``.`` 结束，如果正文本身有以句点开头的行，客户端需要做点填充（dot-stuffing）。

二、smtplib 模块概览
--------------------

``smtplib`` 提供两个核心类：``SMTP`` 用于普通连接或 STARTTLS 升级，``SMTP_SSL`` 从连接建立时就使用 TLS。两者的默认端口不同，``SMTP`` 是 ``25``，``SMTP_SSL`` 是 ``465``；使用 STARTTLS 时通常连接 ``587`` 端口，再调用 ``starttls()`` 升级。

.. code-block:: python

   import smtplib

   print("SMTP 默认端口：", smtplib.SMTP_PORT)
   print("SMTP_SSL 默认端口：", smtplib.SMTP_SSL_PORT)
   print("SMTP 类可用：", hasattr(smtplib, "SMTP"))
   print("SMTP_SSL 类可用：", hasattr(smtplib, "SMTP_SSL"))

输出结果：

.. code-block:: text

   SMTP 默认端口： 25
   SMTP_SSL 默认端口： 465
   SMTP 类可用： True
   SMTP_SSL 类可用： True

``smtplib`` 的常用方法都挂在 ``SMTP`` 类上，``SMTP_SSL`` 继承自它，因此登录、发信、退出的用法完全一致，区别只在连接阶段是否加密：

.. code-block:: python

   import smtplib

   for name in ["connect", "login", "starttls", "sendmail", "send_message", "quit"]:
       print(f"SMTP.{name}：", hasattr(smtplib.SMTP, name))

   print("SMTP_SSL 继承 SMTP：", issubclass(smtplib.SMTP_SSL, smtplib.SMTP))

输出结果：

.. code-block:: text

   SMTP.connect： True
   SMTP.login： True
   SMTP.starttls： True
   SMTP.sendmail： True
   SMTP.send_message： True
   SMTP.quit： True
   SMTP_SSL 继承 SMTP： True

两个类都支持上下文管理器和 ``timeout`` 参数。把超时设置为十秒左右，可以避免网络异常时程序长时间卡住；连接对象退出 ``with`` 块时会自动调用 ``quit()``，即使中途抛出异常也能尽量正常关闭会话。

三、构造纯文本邮件
------------------

``email.mime.text.MIMEText`` 用于构造纯文本或 HTML 正文。第一个参数是正文，第二个参数是子类型 ``plain`` 或 ``html``，第三个参数是字符编码。设置 ``From``、``To``、``Subject`` 之后，``as_string()`` 会生成完整的 MIME 文本，可以直接交给 ``sendmail()``。

.. code-block:: python

   from email.header import Header
   from email.mime.text import MIMEText

   message = MIMEText("你好，这是一封纯文本测试邮件。", "plain", "utf-8")
   message["From"] = "sender@example.com"
   message["To"] = "receiver@example.com"
   message["Subject"] = Header("纯文本邮件", "utf-8")

   print(message.as_string())

输出结果：

.. code-block:: text

   Content-Type: text/plain; charset="utf-8"
   MIME-Version: 1.0
   Content-Transfer-Encoding: base64
   From: sender@example.com
   To: receiver@example.com
   Subject: =?utf-8?b?57qv5paH5pys6YKu5Lu2?=

   5L2g5aW977yM6L+Z5piv5LiA5bCB57qv5paH5pys5rWL6K+V6YKu5Lu244CC

``Content-Type`` 声明正文是 UTF-8 纯文本，``Content-Transfer-Encoding: base64`` 表示正文经过 base64 编码，这样即使邮件服务器只支持 7 位 ASCII 也不会破坏中文。头部与正文之间必须有一个空行，缺少这个空行，客户端会把正文当成头部的一部分。

四、构造 HTML 邮件
------------------

把 ``MIMEText`` 的第二个参数改成 ``html``，正文就会以 ``text/html`` 类型发送。HTML 正文同样会用 base64 传输，客户端收到后按 ``charset`` 解码并渲染。复杂的 HTML 邮件通常还会搭配纯文本备选正文，用 ``MIMEMultipart("alternative")`` 组合，让不支持 HTML 的客户端也能阅读。

.. code-block:: python

   from email.header import Header
   from email.mime.text import MIMEText

   html = """\
   <html>
     <body>
       <h1>你好</h1>
       <p>这是一封 <strong>HTML</strong> 邮件。</p>
     </body>
   </html>
   """

   message = MIMEText(html, "html", "utf-8")
   message["From"] = "sender@example.com"
   message["To"] = "receiver@example.com"
   message["Subject"] = Header("HTML 邮件", "utf-8")

   print(message.as_string())

输出结果：

.. code-block:: text

   Content-Type: text/html; charset="utf-8"
   MIME-Version: 1.0
   Content-Transfer-Encoding: base64
   From: sender@example.com
   To: receiver@example.com
   Subject: =?utf-8?b?SFRNTCDpgq7ku7Y=?=

   PGh0bWw+CiAgPGJvZHk+CiAgICA8aDE+5L2g5aW9PC9oMT4KICAgIDxwPui/meaYr+S4gOWwgSA8
   c3Ryb25nPkhUTUw8L3N0cm9uZz4g6YKu5Lu244CCPC9wPgogIDwvYm9keT4KPC9odG1sPgo=

HTML 邮件里的图片、样式表和链接通常指向外部地址，很多客户端默认会拦截远程图片，因此重要信息不要只放在图片里。正文中的中文会先按 UTF-8 编码，再做 base64 换行，所以 ``as_string()`` 里看到的是一串不可读的字符。

五、添加附件
------------

带附件的邮件要用 ``MIMEMultipart`` 作为容器，先附加正文，再附加若干 ``MIMEBase`` 对象。附件内容通常按 base64 编码，``Content-Disposition`` 里的 ``filename`` 告诉客户端保存成什么名字。``MIMEMultipart()`` 默认会随机生成 boundary，为了让示例输出稳定，这里显式传入固定的 ``boundary``。

.. code-block:: python

   from email import encoders
   from email.header import Header
   from email.mime.base import MIMEBase
   from email.mime.multipart import MIMEMultipart
   from email.mime.text import MIMEText

   message = MIMEMultipart(boundary="demo-boundary")
   message["From"] = "sender@example.com"
   message["To"] = "receiver@example.com"
   message["Subject"] = Header("带附件的邮件", "utf-8")
   message.attach(MIMEText("正文见附件。", "plain", "utf-8"))

   attachment = MIMEBase("application", "octet-stream")
   attachment.set_payload("demo attachment content".encode("utf-8"))
   encoders.encode_base64(attachment)
   attachment.add_header("Content-Disposition", "attachment", filename="demo.txt")
   message.attach(attachment)

   print(message.as_string())

输出结果：

.. code-block:: text

   Content-Type: multipart/mixed; boundary="demo-boundary"
   MIME-Version: 1.0
   From: sender@example.com
   To: receiver@example.com
   Subject: =?utf-8?b?5bim6ZmE5Lu255qE6YKu5Lu2?=

   --demo-boundary
   Content-Type: text/plain; charset="utf-8"
   MIME-Version: 1.0
   Content-Transfer-Encoding: base64

   5q2j5paH6KeB6ZmE5Lu244CC

   --demo-boundary
   Content-Type: application/octet-stream
   MIME-Version: 1.0
   Content-Transfer-Encoding: base64
   Content-Disposition: attachment; filename="demo.txt"

   ZGVtbyBhdHRhY2htZW50IGNvbnRlbnQ=

   --demo-boundary--

boundary 是一串不会出现在各部分内容里的分隔标记，客户端靠它把多部分邮件拆开。示例固定写 ``demo-boundary`` 只是为了让输出可复现；真实场景应让 ``MIMEMultipart()`` 自动生成随机 boundary，避免正文恰好包含分隔符而导致邮件结构被破坏。

六、头部编码
------------

邮件头部按 RFC 2047 规定只能包含 ASCII 字符，中文主题、中文发件人姓名必须编码成 ``=?utf-8?b?...?=`` 形式。``email.header.Header`` 负责编码，``decode_header()`` 负责把收到的编码串还原成文本，``formataddr()`` 与 ``parseaddr()`` 则在“姓名 + 地址”和完整地址字符串之间转换。

.. code-block:: python

   from email.header import Header, decode_header
   from email.utils import formataddr, parseaddr

   subject = Header("周报：网络与邮件", "utf-8")
   encoded = subject.encode()
   print("编码后的主题：", encoded)

   value, charset = decode_header(encoded)[0]
   print("解码结果：", value.decode(charset))

   name, address = parseaddr("张三 <zhangsan@example.com>")
   print("解析姓名：", name)
   print("解析地址：", address)
   print("格式化地址：", formataddr((name, address)))

输出结果：

.. code-block:: text

   编码后的主题： =?utf-8?b?5ZGo5oql77ya572R57uc5LiO6YKu5Lu2?=
   解码结果： 周报：网络与邮件
   解析姓名： 张三
   解析地址： zhangsan@example.com
   格式化地址： =?utf-8?b?5byg5LiJ?= <zhangsan@example.com>

``B`` 表示 base64，``Q`` 表示 quoted-printable；Python 默认使用 ``B``，因为它在处理中文时更紧凑。``parseaddr()`` 能正确拆出未编码的中文姓名，如果地址里已经是编码后的头部，需要先用 ``decode_header()`` 解码再展示。

七、服务商与端口
----------------

不同邮箱服务商的 SMTP 地址、端口和加密方式略有差异。下表列出常见配置，实际使用时以服务商最新文档为准；大多数服务商要求开启 SMTP 服务并使用“授权码”而不是登录密码。

.. csv-table::
   :header: "服务商", "SMTP 服务器", "端口", "加密方式", "备注"

   "QQ 邮箱", "smtp.qq.com", "465", "SSL", "需在设置中开启 SMTP 并使用授权码"
   "163 邮箱", "smtp.163.com", "465", "SSL", "需开启 SMTP 并使用授权码"
   "Gmail", "smtp.gmail.com", "587", "STARTTLS", "需开启两步验证并生成应用专用密码"
   "Outlook", "smtp.office365.com", "587", "STARTTLS", "部分账号要求 OAuth2 授权"

把这些配置写成列表，按固定顺序打印：

.. code-block:: python

   providers = [
       ("QQ 邮箱", "smtp.qq.com", 465, "SSL"),
       ("163 邮箱", "smtp.163.com", 465, "SSL"),
       ("Gmail", "smtp.gmail.com", 587, "STARTTLS"),
       ("Outlook", "smtp.office365.com", 587, "STARTTLS"),
   ]

   for name, host, port, security in providers:
       print(f"{name}: {host}:{port} ({security})")

输出结果：

.. code-block:: text

   QQ 邮箱: smtp.qq.com:465 (SSL)
   163 邮箱: smtp.163.com:465 (SSL)
   Gmail: smtp.gmail.com:587 (STARTTLS)
   Outlook: smtp.office365.com:587 (STARTTLS)

选择 SSL 还是 STARTTLS，取决于服务商开放的端口：``465`` 通常要求一连接就加密，``587`` 通常要求先明文连接再执行 ``STARTTLS``。不要在代码里硬编码邮箱密码，授权码应通过环境变量或配置文件注入，并且不要提交到版本库。

八、发送接口：SMTP、SMTP_SSL 与 send_message
--------------------------------------------

``smtplib.SMTP`` 支持上下文管理器，进入时连接服务器，退出时自动发送 ``QUIT``。常见组合有两种：``SMTP_SSL`` 直接加密连接 ``465`` 端口；``SMTP`` 先连 ``587`` 端口，调用 ``ehlo()`` 和 ``starttls()`` 升级后再 ``login()``。认证成功后，``sendmail()`` 接收字符串消息，``send_message()`` 接收 ``EmailMessage`` 对象并自动从 ``To``、``Cc``、``Bcc`` 中提取收件人。

下面的代码只定义发送函数，不执行任何网络调用；取消注释即可用于真实环境：

.. code-block:: python

   import smtplib
   from email.message import EmailMessage

   def build_message():
       message = EmailMessage()
       message["From"] = "sender@example.com"
       message["To"] = "receiver@example.com"
       message["Subject"] = "测试邮件"
       message.set_content("这是一封不会真正发送的邮件。")
       return message

   def send_via_ssl(message):
       # 示例不联网，真正发送时取消下面三行的注释
       # with smtplib.SMTP_SSL("smtp.example.com", 465, timeout=10) as smtp:
       #     smtp.login("sender@example.com", "授权码")
       #     smtp.send_message(message)
       return "SMTP_SSL / login / send_message"

   def send_via_starttls(message):
       # with smtplib.SMTP("smtp.example.com", 587, timeout=10) as smtp:
       #     smtp.ehlo()
       #     smtp.starttls()
       #     smtp.login("sender@example.com", "授权码")
       #     smtp.sendmail("sender@example.com", ["receiver@example.com"], message.as_string())
       return "SMTP / starttls / login / sendmail"

   message = build_message()
   print("主题：", message["Subject"])
   print("正文：", message.get_content().strip())
   print("方式一：", send_via_ssl(message))
   print("方式二：", send_via_starttls(message))

输出结果：

.. code-block:: text

   主题： 测试邮件
   正文： 这是一封不会真正发送的邮件。
   方式一： SMTP_SSL / login / send_message
   方式二： SMTP / starttls / login / sendmail

``sendmail()`` 的第二个参数必须是收件人列表，返回值是“被拒绝的收件人”字典，空字典表示全部接受；``send_message()`` 会读取邮件头里的 ``To``、``Cc``、``Bcc``，并在发送前删除 ``Bcc`` 头，避免密送地址泄露。两种接口都可能抛出 ``SMTPException``，真实代码应把它们放进 ``try`` 块并设置超时。

.. csv-table::
   :header: "接口", "消息参数", "收件人来源", "适用场景"

   "sendmail()", "字符串", "调用时显式传入列表", "已有完整 MIME 文本或需要精确控制信封"
   "send_message()", "EmailMessage 对象", "自动读取 To、Cc、Bcc", "推荐，代码更短且不易漏掉抄送"

``send_message()`` 的便利之处在于收件人可以直接写在邮件头里。下面的例子用 ``EmailMessage`` 设置 ``To``、``Cc``、``Bcc``，再手动收集全部收件人：

.. code-block:: python

   from email.message import EmailMessage

   message = EmailMessage()
   message["From"] = "sender@example.com"
   message["To"] = "alice@example.com, bob@example.com"
   message["Cc"] = "carol@example.com"
   message["Bcc"] = "dave@example.com"

   recipients = []
   for field in ("To", "Cc", "Bcc"):
       for value in message.get_all(field, []):
           recipients.extend(part.strip() for part in value.split(","))

   print("收件人数量：", len(recipients))
   for address in recipients:
       print("收件人：", address)

输出结果：

.. code-block:: text

   收件人数量： 4
   收件人： alice@example.com
   收件人： bob@example.com
   收件人： carol@example.com
   收件人： dave@example.com

手动收集收件人时要把 ``To``、``Cc``、``Bcc`` 都算进去，否则密送对象收不到邮件。如果直接调用 ``send_message()``，这些工作由标准库完成，但调用者仍需保证 ``From`` 已经设置，否则 ``send_message()`` 会抛出 ``ValueError``。

九、错误处理
------------

``smtplib`` 的异常都继承自 ``SMTPException``。``SMTPAuthenticationError`` 表示账号或授权码错误，``SMTPRecipientsRefused`` 表示所有收件人都被拒绝，``SMTPServerDisconnected`` 表示连接被服务器关闭，``SMTPConnectError`` 表示连接阶段失败。捕获异常后应给出可操作的提示，但不要把密码写进日志。

.. code-block:: python

   import smtplib

   def explain(error):
       if isinstance(error, smtplib.SMTPAuthenticationError):
           return "认证失败，请检查账号和授权码"
       if isinstance(error, smtplib.SMTPRecipientsRefused):
           return "所有收件人都被拒绝"
       if isinstance(error, smtplib.SMTPServerDisconnected):
           return "服务器意外断开"
       if isinstance(error, smtplib.SMTPException):
           return "其他 SMTP 错误"
       return "未知错误"

   errors = [
       smtplib.SMTPAuthenticationError(535, b"authentication failed"),
       smtplib.SMTPRecipientsRefused({"receiver@example.com": (550, b"mailbox unavailable")}),
       smtplib.SMTPServerDisconnected("connection closed"),
   ]

   for error in errors:
       print(type(error).__name__, "->", explain(error))

输出结果：

.. code-block:: text

   SMTPAuthenticationError -> 认证失败，请检查账号和授权码
   SMTPRecipientsRefused -> 所有收件人都被拒绝
   SMTPServerDisconnected -> 服务器意外断开

处理错误时要区分“重试有意义”和“重试无意义”：网络抖动、服务器繁忙等临时故障可以退避重试，账号密码错误、收件人地址不存在等永久故障则应直接提示用户。无论成功还是失败，都要确保连接被关闭，避免服务端积累半开连接。

十、练习任务
------------

任务 1：构造一封发给多个收件人的纯文本邮件，打印完整的 MIME 文本。

.. code-block:: python

   from email.header import Header
   from email.mime.text import MIMEText

   message = MIMEText("任务一：这是一封纯文本邮件。", "plain", "utf-8")
   message["From"] = "sender@example.com"
   message["To"] = "alice@example.com, bob@example.com"
   message["Subject"] = Header("练习：纯文本邮件", "utf-8")

   print(message.as_string())

输出结果：

.. code-block:: text

   Content-Type: text/plain; charset="utf-8"
   MIME-Version: 1.0
   Content-Transfer-Encoding: base64
   From: sender@example.com
   To: alice@example.com, bob@example.com
   Subject: =?utf-8?b?57uD5Lmg77ya57qv5paH5pys6YKu5Lu2?=

   5Lu75Yqh5LiA77ya6L+Z5piv5LiA5bCB57qv5paH5pys6YKu5Lu244CC

任务 2：构造一封 HTML 邮件，正文包含标题和加粗文字。

.. code-block:: python

   from email.header import Header
   from email.mime.text import MIMEText

   html = "<html><body><p>任务二：<strong>HTML</strong> 邮件。</p></body></html>"
   message = MIMEText(html, "html", "utf-8")
   message["From"] = "sender@example.com"
   message["To"] = "receiver@example.com"
   message["Subject"] = Header("练习：HTML 邮件", "utf-8")

   print(message.as_string())

输出结果：

.. code-block:: text

   Content-Type: text/html; charset="utf-8"
   MIME-Version: 1.0
   Content-Transfer-Encoding: base64
   From: sender@example.com
   To: receiver@example.com
   Subject: =?utf-8?b?57uD5Lmg77yaSFRNTCDpgq7ku7Y=?=

   PGh0bWw+PGJvZHk+PHA+5Lu75Yqh5LqM77yaPHN0cm9uZz5IVE1MPC9zdHJvbmc+IOmCruS7tuOA
   gjwvcD48L2JvZHk+PC9odG1sPg==

任务 3：构造一封带 CSV 附件的邮件，附件文件名为 ``scores.csv``。

.. code-block:: python

   from email import encoders
   from email.header import Header
   from email.mime.base import MIMEBase
   from email.mime.multipart import MIMEMultipart
   from email.mime.text import MIMEText

   message = MIMEMultipart(boundary="exercise-boundary")
   message["From"] = "sender@example.com"
   message["To"] = "receiver@example.com"
   message["Subject"] = Header("练习：CSV 附件", "utf-8")
   message.attach(MIMEText("附件是 CSV 数据。", "plain", "utf-8"))

   csv_data = "name,score\n小明,90\n小红,95\n"
   attachment = MIMEBase("text", "csv")
   attachment.set_payload(csv_data.encode("utf-8"))
   encoders.encode_base64(attachment)
   attachment.add_header("Content-Disposition", "attachment", filename="scores.csv")
   message.attach(attachment)

   print(message.as_string())

输出结果：

.. code-block:: text

   Content-Type: multipart/mixed; boundary="exercise-boundary"
   MIME-Version: 1.0
   From: sender@example.com
   To: receiver@example.com
   Subject: =?utf-8?b?57uD5Lmg77yaQ1NWIOmZhOS7tg==?=

   --exercise-boundary
   Content-Type: text/plain; charset="utf-8"
   MIME-Version: 1.0
   Content-Transfer-Encoding: base64

   6ZmE5Lu25pivIENTViDmlbDmja7jgII=

   --exercise-boundary
   Content-Type: text/csv
   MIME-Version: 1.0
   Content-Transfer-Encoding: base64
   Content-Disposition: attachment; filename="scores.csv"

   bmFtZSxzY29yZQrlsI/mmI4sOTAK5bCP57qiLDk1Cg==

   --exercise-boundary--
