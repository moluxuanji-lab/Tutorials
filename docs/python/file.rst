Python 文件操作
===============

.. meta::
   :group: 进阶
   :summary: 从 open 的文件模式讲起，掌握 read、readline、readlines、write、writelines、seek 与 tell，理解 with 与编码处理，并用 os、shutil、csv、pathlib 完成常见的文件管理任务。

程序运行结束后，变量就消失了；想让数据留下来，就得写进文件。文件操作是脚本里出现频率最高的功能之一：读配置、写日志、导出报表、批量改名，本质上都是打开文件、搬动数据、再关闭文件。

这一章按“打开—读取—写入—定位—编码—管理—格式”的顺序展开：先用 ``open()`` 的模式参数把文件打开，再熟悉几组读写方法，然后处理编码与路径，最后用 ``os``、``shutil``、``csv`` 完成实际任务。所有示例都使用相对文件名（相对于脚本所在目录），并在代码块结束前删除自己创建的文件，避免污染工作目录。

一、open 与文件模式
-------------------

``open()`` 的第二个参数决定“怎么打开”。模式串里可以叠加 ``b``（二进制）或 ``+``（可读可写），但日常最常用的还是下面几个文本模式：

.. csv-table::
   :header: "模式", "含义", "文件不存在时", "是否清空原内容"

   "``r``", "只读，默认模式", "抛出 ``FileNotFoundError``", "否"
   "``w``", "只写", "新建文件", "是"
   "``a``", "追加写入", "新建文件", "否，写在末尾"
   "``x``", "独占新建，只写", "新建文件", "遇到已有文件抛 ``FileExistsError``"
   "``r+``", "读写，指针在开头", "抛出 ``FileNotFoundError``", "否"

模式写错方向最容易出事：本想追加日志，却用了 ``w``，结果每次运行都把旧日志清空。下面的例子依次演示 ``w``、``a``、``x`` 与 ``r``，并在删除文件后确认目录已恢复干净：

.. code-block:: python

   import os

   path = "mode_demo.txt"

   with open(path, "w", encoding="utf-8") as handle:
       handle.write("第一行\n")
   print("w 模式写完已关闭：", handle.closed)

   with open(path, "a", encoding="utf-8") as handle:
       handle.write("追加的一行\n")

   try:
       open(path, "x", encoding="utf-8")
   except FileExistsError:
       print("x 模式遇到已有文件：FileExistsError")

   with open(path, encoding="utf-8") as handle:
       print("读到的行：", handle.read().splitlines())
   print("读完已关闭：", handle.closed)

   os.remove(path)
   print("清理后文件存在：", os.path.exists(path))

输出结果：

.. code-block:: text

   w 模式写完已关闭： True
   x 模式遇到已有文件：FileExistsError
   读到的行： ['第一行', '追加的一行']
   读完已关闭： True
   清理后文件存在： False

with 语句与异常安全
~~~~~~~~~~~~~~~~~~~

``with`` 的作用不只是省掉一行 ``close()``。它背后的上下文管理器协议保证：无论代码块是正常结束、``return`` 提前离开，还是抛出异常，退出时都会调用 ``__exit__()`` 关闭文件。手写 ``open()`` + ``close()`` 时，中间一旦出错，关闭语句就永远不会执行，数据可能还留在缓冲区里没有落盘：

.. code-block:: python

   import os

   path = "with_guard.txt"

   with open(path, "w", encoding="utf-8") as handle:
       handle.write("重要的数据\n")
       print("块内 closed：", handle.closed)
   print("块外 closed：", handle.closed)

   try:
       with open(path, encoding="utf-8") as handle:
           raise ValueError("读取时出现异常")
   except ValueError as exc:
       print("捕获：", exc)
       print("异常后 closed：", handle.closed)

   os.remove(path)

输出结果：

.. code-block:: text

   块内 closed： False
   块外 closed： True
   捕获： 读取时出现异常
   异常后 closed： True

二、读取：read、readline、readlines
------------------------------------

三个读取方法各有适用场景：``read()`` 一次读完，``readline()`` 读一行，``readlines()`` 把每一行装进列表。它们共享同一个文件指针，读到哪儿，指针就走到哪儿：

.. code-block:: python

   import os

   path = "poem.txt"
   with open(path, "w", encoding="utf-8") as handle:
       handle.write("床前明月光\n疑是地上霜\n举头望明月\n低头思故乡\n")

   with open(path, encoding="utf-8") as handle:
       print("read(4)：", repr(handle.read(4)))
       print("readline()：", repr(handle.readline()))
       print("剩余内容：", repr(handle.read()))

   with open(path, encoding="utf-8") as handle:
       lines = handle.readlines()

   print("readlines 行数：", len(lines))
   print("第二行：", repr(lines[1]))
   print("去掉换行：", [line.strip() for line in lines])

   os.remove(path)

输出结果：

.. code-block:: text

   read(4)： '床前明月'
   readline()： '光\n'
   剩余内容： '疑是地上霜\n举头望明月\n低头思故乡\n'
   readlines 行数： 4
   第二行： '疑是地上霜\n'
   去掉换行： ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡']

``read(4)`` 的参数是字符数而不是行数，读完后指针正好停在第四个字符之后，所以紧接着的 ``readline()`` 只拿到剩下的 ``"光\n"``。``readlines()`` 保留了每行末尾的 ``\n``，需要干净文本时要自己 ``strip()``；文件很大时它会把整份内容装进内存，不如逐行迭代省内存。

三、写入：write 与 writelines
-----------------------------

``write()`` 接收一个字符串，返回实际写入的字符数；``writelines()`` 接收一个字符串序列，逐个写入，不会自动加换行。两者都不会替你补 ``\n``，换行必须自己写进内容里：

.. code-block:: python

   import os

   path = "write_demo.txt"
   rows = ["第一行\n", "第二行\n"]

   with open(path, "w", encoding="utf-8") as handle:
       count = handle.write("开头的一行\n")
       print("write 返回字符数：", count)
       handle.writelines(rows)

   with open(path, encoding="utf-8") as handle:
       content = handle.read()

   print("总行数：", len(content.splitlines()))
   print("完整内容：", repr(content))

   os.remove(path)

输出结果：

.. code-block:: text

   write 返回字符数： 6
   总行数： 3
   完整内容： '开头的一行\n第一行\n第二行\n'

``"开头的一行\n"`` 是 5 个汉字加 1 个换行，所以 ``write()`` 返回 6——它数的是字符，不是字节。要写入数字，必须先 ``str()`` 或 f-string 转成字符串，否则会抛 ``TypeError``。

四、seek 与 tell
----------------

文件对象内部维护一个“当前位置”。``tell()`` 返回当前位置，``seek()`` 把位置挪到指定处，之后读写都从新位置开始。文本模式下这个位置是不透明的“cookie”，只能 ``seek(0)``、``seek(0, 2)``，或跳回 ``tell()`` 曾经返回过的值：

.. code-block:: python

   import os

   text_path = "seek_demo.txt"
   with open(text_path, "w", encoding="utf-8") as handle:
       handle.write("0123456789")

   with open(text_path, encoding="utf-8") as handle:
       start = handle.tell()
       first = handle.read(3)
       position = handle.tell()
       handle.seek(0)
       print("回到开头：", handle.read(2))
       handle.seek(position)
       print("回到上次位置：", handle.read(2))
       end = handle.seek(0, 2)
       print("起点", start, "首三个", first, "上次位置", position, "末尾", end)

   binary_path = "seek_demo.bin"
   with open(binary_path, "wb") as handle:
       handle.write(b"ABCDEFGHIJ")

   with open(binary_path, "rb") as handle:
       handle.seek(-3, 2)
       print("二进制末尾前 3 个：", handle.read())
       print("当前偏移：", handle.tell())

   os.remove(text_path)
   os.remove(binary_path)

输出结果：

.. code-block:: text

   回到开头： 01
   回到上次位置： 34
   起点 0 首三个 012 上次位置 3 末尾 10
   二进制末尾前 3 个： b'HIJ'
   当前偏移： 10

``seek(offset, whence)`` 的第二个参数决定基准：``0`` 是文件开头（默认），``1`` 是当前位置，``2`` 是文件末尾。文本模式不支持 ``seek(-3, 2)`` 这类相对末尾的负偏移，会抛 ``UnsupportedOperation``；需要从末尾倒着读时，改用二进制模式即可，如上面的例子。

五、逐行迭代文件
----------------

文件对象本身就是可迭代对象，``for line in handle`` 每次产出一行，内部按块读取缓冲，不会把整个文件塞进内存。处理大日志时这是标准写法：

.. code-block:: python

   import os

   path = "app.log"
   with open(path, "w", encoding="utf-8") as handle:
       handle.write("INFO 服务启动\nWARNING 磁盘空间不足\nERROR 写入失败\n")

   with open(path, encoding="utf-8") as handle:
       for number, line in enumerate(handle, start=1):
           print(number, repr(line.rstrip("\n")))

   with open(path, encoding="utf-8") as handle:
       errors = [line.strip() for line in handle if line.startswith("ERROR")]
   print("错误行：", errors)

   os.remove(path)

输出结果：

.. code-block:: text

   1 'INFO 服务启动'
   2 'WARNING 磁盘空间不足'
   3 'ERROR 写入失败'
   错误行： ['ERROR 写入失败']

迭代过程中不要混用 ``readline()``：在 Python 3 里两者共用同一个缓冲区，混着用会得到难以预料的结果，要么统一用 ``for``，要么统一手动读。

六、编码 encoding
-----------------

文本文件的读写实质是“字节 ↔ 字符串”的转换，``encoding`` 决定用哪张码表。同一个文件用错编码，轻则读出乱码，重则直接抛 ``UnicodeDecodeError``：

.. code-block:: python

   import os

   path = "encoding_demo.txt"
   text = "中文编码"

   with open(path, "w", encoding="utf-8") as handle:
       handle.write(text)

   with open(path, "rb") as handle:
       raw = handle.read()
   print("字符数：", len(text))
   print("UTF-8 字节数：", len(raw))
   print("前三个字节：", list(raw[:3]))

   with open(path, encoding="utf-8") as handle:
       print("按 UTF-8 读取：", handle.read())

   with open(path, "w", encoding="gbk") as handle:
       handle.write(text)
   with open(path, "rb") as handle:
       print("GBK 字节数：", len(handle.read()))

   try:
       with open(path, encoding="utf-8") as handle:
           handle.read()
   except UnicodeDecodeError as exc:
       print("按 UTF-8 读取 GBK 文件失败：", exc.reason)

   os.remove(path)
   print("清理完成：", not os.path.exists(path))

输出结果：

.. code-block:: text

   字符数： 4
   UTF-8 字节数： 12
   前三个字节： [228, 184, 173]
   按 UTF-8 读取： 中文编码
   GBK 字节数： 8
   按 UTF-8 读取 GBK 文件失败： invalid continuation byte
   清理完成： True

四个汉字在 UTF-8 下占 12 个字节，在 GBK 下只占 8 个。UTF-8 兼容 ASCII，是目前的事实标准，新文件一律用它；读别人给的文件时，如果不确定编码，可以先按 UTF-8 读，失败再换 ``gbk``，或者给 ``open()`` 加上 ``errors="replace"`` 让无法解码的字节变成替换字符，而不是中断程序。

七、os.rename 与 os.remove
--------------------------

``os.rename()`` 改名或移动文件，``os.remove()`` 删除文件。两者都直接操作文件系统，不检查目标是否“应该”存在，所以动手前用 ``os.path.exists()`` 判断是个好习惯：

.. code-block:: python

   import os

   old_name = "old_name.txt"
   new_name = "new_name.txt"

   with open(old_name, "w", encoding="utf-8", newline="\n") as handle:
       handle.write("重命名演示\n")

   os.rename(old_name, new_name)
   print("旧文件存在：", os.path.exists(old_name))
   print("新文件存在：", os.path.exists(new_name))
   print("大小：", os.path.getsize(new_name))

   os.remove(new_name)
   print("删除后存在：", os.path.exists(new_name))

   try:
       os.remove(new_name)
   except FileNotFoundError:
       print("再次删除： FileNotFoundError")

输出结果：

.. code-block:: text

   旧文件存在： False
   新文件存在： True
   大小： 16
   删除后存在： False
   再次删除： FileNotFoundError

``os.path.getsize()`` 返回字节数：5 个汉字占 15 字节，加上 1 个换行正好 16 字节。这里的 ``newline="\n"`` 关掉了平台相关的换行转换，如果不写，Windows 会把 ``\n`` 写成 ``\r\n``，文件会多出 1 个字节。删除不存在的文件不会静默通过，而是抛 ``FileNotFoundError``；批量清理时可以用 ``contextlib.suppress(FileNotFoundError)`` 包一层。

八、shutil 复制、移动与删除目录
-------------------------------

``os`` 只管单个文件，复制、移动目录、整目录删除要交给 ``shutil``。``copy()`` 复制内容，``copy2()`` 额外保留修改时间等元数据，``move()`` 移动（跨磁盘时自动退化成复制加删除），``rmtree()`` 递归删除整个目录：

.. code-block:: python

   import os
   import shutil

   source = "source.txt"
   folder = "backup"

   with open(source, "w", encoding="utf-8") as handle:
       handle.write("需要备份的内容\n")

   shutil.copy(source, "copy.txt")
   print("副本存在：", os.path.exists("copy.txt"))

   os.makedirs(folder, exist_ok=True)
   shutil.move("copy.txt", os.path.join(folder, "copy.txt"))
   print("原位置副本还在：", os.path.exists("copy.txt"))
   print("目录内容：", os.listdir(folder))

   shutil.copy2(source, os.path.join(folder, "source_backup.txt"))
   print("排序后目录内容：", sorted(os.listdir(folder)))

   shutil.rmtree(folder)
   print("目录删除后存在：", os.path.exists(folder))

   os.remove(source)

输出结果：

.. code-block:: text

   副本存在： True
   原位置副本还在： False
   目录内容： ['copy.txt']
   排序后目录内容： ['copy.txt', 'source_backup.txt']
   目录删除后存在： False

``shutil.rmtree()`` 不可恢复，也不走回收站，调用前务必确认路径。``os.makedirs(..., exist_ok=True)`` 则在目录已存在时不会报错，适合放在脚本开头做初始化。

九、csv 读写
------------

CSV 是最通用的表格交换格式。不要用 ``split(",")`` 自己拆——字段里一旦出现逗号、引号或换行就会解析错乱，标准库的 ``csv`` 模块会正确处理这些情况。写入时记得 ``newline=""``，否则 Windows 上会多出空行：

.. code-block:: python

   import csv
   import os

   path = "students.csv"
   rows = [
       ["姓名", "语文", "数学"],
       ["小明", "92", "88"],
       ["小红", "85", "95"],
   ]

   with open(path, "w", encoding="utf-8", newline="") as handle:
       writer = csv.writer(handle)
       writer.writerow(rows[0])
       writer.writerows(rows[1:])

   with open(path, encoding="utf-8", newline="") as handle:
       for row in csv.reader(handle):
           print(" | ".join(row))

   print("写入数据行数：", len(rows) - 1)
   os.remove(path)

输出结果：

.. code-block:: text

   姓名 | 语文 | 数学
   小明 | 92 | 88
   小红 | 85 | 95
   写入数据行数： 2

读回来时，``csv.reader`` 按行返回列表，``csv.DictReader`` 则把首行当作字段名，每行返回字典，按列名取值比按位置取值更不容易出错：

.. code-block:: python

   import csv
   import os

   path = "scores.csv"
   with open(path, "w", encoding="utf-8", newline="") as handle:
       handle.write("姓名,语文,数学\n小明,92,88\n小红,85,95\n")

   with open(path, encoding="utf-8", newline="") as handle:
       reader = csv.DictReader(handle)
       print("字段：", reader.fieldnames)
       for row in reader:
           total = int(row["语文"]) + int(row["数学"])
           print(f"{row['姓名']} 总分 {total}")

   with open(path, encoding="utf-8", newline="") as handle:
       table = list(csv.reader(handle))
   print("第一列：", [row[0] for row in table])

   os.remove(path)

输出结果：

.. code-block:: text

   字段： ['姓名', '语文', '数学']
   小明 总分 180
   小红 总分 180
   第一列： ['姓名', '小明', '小红']

``csv`` 读出来的每个字段都是字符串，即使看起来是数字，做算术前也要 ``int()`` 或 ``float()`` 转换。字段名里的空格、BOM 都会原样保留，遇到 ``KeyError`` 时先打印 ``reader.fieldnames`` 看看实际键名。

十、路径处理简介
----------------

拼接路径不要用字符串加 ``"/"``，各平台的分隔符不同。``os.path`` 提供函数式写法，``pathlib`` 提供面向对象的写法，两者可以混用，新代码更推荐 ``pathlib``：

.. code-block:: python

   import os
   from pathlib import Path

   path = Path("data") / "reports" / "summary.txt"

   print("文件名：", path.name)
   print("主名：", path.stem)
   print("后缀：", path.suffix)
   print("父目录：", path.parent.name)
   print("层级数：", len(path.parts))

   print("拆分：", os.path.split(os.path.join("data", "summary.txt")))
   print("规范化：", os.path.normpath("data/reports/../summary.txt").replace(os.sep, "/"))
   print("是否绝对路径：", os.path.isabs("data/summary.txt"))
   print("扩展名：", os.path.splitext("summary.txt")[1])

输出结果：

.. code-block:: text

   文件名： summary.txt
   主名： summary
   后缀： .txt
   父目录： reports
   层级数： 3
   拆分： ('data', 'summary.txt')
   规范化： data/summary.txt
   是否绝对路径： False
   扩展名： .txt

``/`` 运算符在 ``pathlib`` 里被重载为路径拼接，``Path("data") / "summary.txt"`` 会自动使用当前平台的分隔符。``normpath()`` 只做字符串层面的 ``..`` 化简，不会访问磁盘，也不解析符号链接；需要真实绝对路径时用 ``Path.resolve()``，它会读取文件系统，路径不存在时行为取决于版本，跨平台脚本里要谨慎。

练习任务
--------

任务 1：统计一个文本文件的行数、单词数与最长的一行。

.. code-block:: python

   import os

   path = "essay.txt"
   text = "Python is simple\nreadable code wins\nkeep it short\n"

   with open(path, "w", encoding="utf-8") as handle:
       handle.write(text)

   with open(path, encoding="utf-8") as handle:
       lines = handle.read().splitlines()

   print("行数：", len(lines))
   print("单词数：", sum(len(line.split()) for line in lines))
   print("最长行：", max(lines, key=len))

   os.remove(path)

输出结果：

.. code-block:: text

   行数： 3
   单词数： 9
   最长行： readable code wins

任务 2：先写表头，再用追加模式补充数据，最后读回并计算平均分。

.. code-block:: python

   import csv
   import os

   path = "scores.csv"

   with open(path, "w", encoding="utf-8", newline="") as handle:
       csv.writer(handle).writerow(["姓名", "分数"])

   with open(path, "a", encoding="utf-8", newline="") as handle:
       csv.writer(handle).writerows([["小明", 92], ["小红", 88], ["小刚", 76]])

   with open(path, encoding="utf-8", newline="") as handle:
       rows = list(csv.reader(handle))[1:]

   for name, score in rows:
       print(f"{name}：{score}")

   values = [int(score) for _, score in rows]
   print("平均分：", round(sum(values) / len(values), 1))

   os.remove(path)

输出结果：

.. code-block:: text

   小明：92
   小红：88
   小刚：76
   平均分： 85.3

任务 3：把日志文件归档到子目录，读取后清理整个归档目录。

.. code-block:: python

   import os
   import shutil

   log = "app.log"
   archive = "archive"

   with open(log, "w", encoding="utf-8") as handle:
       handle.write("INFO 服务启动\nERROR 连接超时\n")

   os.makedirs(archive, exist_ok=True)
   target = os.path.join(archive, "app-2026.log")
   shutil.move(log, target)

   print("原文件存在：", os.path.exists(log))
   print("归档文件存在：", os.path.exists(target))

   with open(target, encoding="utf-8") as handle:
       print("归档行数：", len(handle.readlines()))

   shutil.rmtree(archive)
   print("归档目录已清理：", not os.path.exists(archive))

输出结果：

.. code-block:: text

   原文件存在： False
   归档文件存在： True
   归档行数： 2
   归档目录已清理： True
