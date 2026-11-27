Python 连接 MySQL
==================

.. meta::
   :group: 标准库与实战
   :summary: 从 MySQL 与 DB-API 2.0 讲起，掌握 PyMySQL 的安装、connect 参数、cursor 游标、fetchone 与 fetchall 取值、参数化查询、事务提交与回滚、增删改查和异常处理，并用 sqlite3 做等价演示。

MySQL 是最流行的开源关系型数据库之一，最初由 MySQL AB 开发，2008 年随 Sun 被 Oracle 收购。它用库、表、行、列组织数据，用 SQL 完成读写，支持索引、视图、存储过程和事务，是 LAMP、LEMP 架构里负责持久化的那一层。

Python 访问 MySQL 依靠数据库驱动。驱动遵循 DB-API 2.0 规范：``connect()`` 建立连接并返回 ``Connection`` 对象，``cursor()`` 创建游标，``execute()`` 与 ``executemany()`` 发送 SQL，``fetchone()``、``fetchmany()``、``fetchall()`` 取回结果，``commit()`` 与 ``rollback()`` 控制事务，最后 ``close()`` 释放资源。换一个驱动，这套方法名基本不变。

本章的示例运行在一台没有安装 PyMySQL、也没有 MySQL 服务的机器上，所以每段代码都会先检查驱动是否可用，再用标准库 ``sqlite3`` 执行结构相同的 SQL。``sqlite3`` 只用于演示语法和流程，它并不是 MySQL，两者的方言差异会在文中单独说明。

一、MySQL 与 DB-API 2.0
-----------------------

关系型数据库把数据放在二维表里，每一行是一条记录，每一列是一个字段，字段有固定的类型和约束。SQL 是操作这些表的语言，分为建表与定义结构的 DDL、增删改查的 DML、控制权限的 DCL 和事务控制的 TCL。

Python 没有内置 MySQL 驱动，需要从下面几种里选择：

.. csv-table::
   :header: "驱动", "实现方式", "特点"

   "PyMySQL", "纯 Python", "安装简单，不需要编译，教程与小型项目最常用"
   "mysqlclient", "C 扩展", "性能好，需要 MySQL 头文件和编译工具链"
   "mysql-connector-python", "Oracle 官方", "纯 Python 实现，随官方文档同步发布"
   "aiomysql", "异步驱动", "基于 ``asyncio``，配合异步 Web 框架使用"
   "SQLAlchemy", "ORM 与工具库", "用对象映射表结构，也能统一管理多种数据库"

无论选哪个驱动，DB-API 2.0 定义的调用顺序都一样，先确认环境，再看两个核心对象：

.. code-block:: python

   try:
       import pymysql
       backend = "PyMySQL 已安装，但本机没有 MySQL 服务"
   except ImportError:
       backend = "未安装 PyMySQL"
   print(f"环境提示：{backend}，改用 sqlite3 等价演示")

   print("核心对象：Connection 与 Cursor")
   print("占位符：PyMySQL 用 %s，sqlite3 用 ?")

输出结果：

.. code-block:: text

   环境提示：未安装 PyMySQL，改用 sqlite3 等价演示
   核心对象：Connection 与 Cursor
   占位符：PyMySQL 用 %s，sqlite3 用 ?

``Connection`` 代表一条到数据库的会话，负责事务和关闭；``Cursor`` 代表一次查询的上下文，负责发送 SQL 和读取结果。一个连接可以创建多个游标，但游标不是线程安全的，多线程环境下应该每个线程使用独立连接。

二、安装 PyMySQL
----------------

PyMySQL 是纯 Python 实现，只要有 pip 就能安装，不需要本地编译：

.. code-block:: bash

   pip install PyMySQL

生产环境建议锁定版本，避免依赖升级带来意外变化：

.. code-block:: bash

   pip install "PyMySQL==1.1.1"

如果访问官方源较慢，可以临时指定镜像：

.. code-block:: bash

   pip install PyMySQL -i https://pypi.tuna.tsinghua.edu.cn/simple

安装完成后，用下面的脚本确认模块是否真的可用：

.. code-block:: python

   try:
       import pymysql
   except ImportError:
       pymysql = None

   print("pymysql 模块：", "已安装" if pymysql is not None else "未安装")
   if pymysql is None:
       print("安装命令：pip install PyMySQL")
       print("后续演示：使用标准库 sqlite3，不伪装成真实连接")
   else:
       print("模块版本：", getattr(pymysql, "__version__", "未知"))
       print("后续演示：使用标准库 sqlite3，不伪装成真实连接")

输出结果：

.. code-block:: text

   pymysql 模块： 未安装
   安装命令：pip install PyMySQL
   后续演示：使用标准库 sqlite3，不伪装成真实连接

``import`` 失败会抛出 ``ImportError``，捕获后把 ``pymysql`` 置为 ``None``，后面的代码就能据此选择降级路径。这种“先探测、再分支”的写法在需要兼容多种环境的脚本里很常见，比让程序直接崩溃友好得多。

三、connect 参数
----------------

``pymysql.connect()`` 接收一组关键字参数，最常用的几个如下：

.. csv-table::
   :header: "参数", "含义", "示例值"

   "host", "数据库地址", "127.0.0.1"
   "port", "监听端口", "3306"
   "user", "登录用户名", "app"
   "password", "登录密码", "******"
   "database", "连接后默认使用的库", "shop"
   "charset", "客户端字符集", "utf8mb4"
   "autocommit", "是否自动提交事务", "False"
   "connect_timeout", "建立连接的超时秒数", "3"
   "cursorclass", "默认游标类型", "DictCursor"

把这些参数放进字典，既方便打印检查，也方便一次性展开传给 ``connect()``：

.. code-block:: python

   try:
       import pymysql
       backend = "PyMySQL 已安装，但本机没有 MySQL 服务"
   except ImportError:
       backend = "未安装 PyMySQL"
   print(f"环境提示：{backend}，改用 sqlite3 等价演示")

   config = {
       "host": "127.0.0.1",
       "port": 3306,
       "user": "app",
       "password": "******",
       "database": "shop",
       "charset": "utf8mb4",
       "autocommit": False,
       "connect_timeout": 3,
   }

   for key, value in config.items():
       print(f"{key} = {value}")

   print("连接写法：pymysql.connect(**config)")

输出结果：

.. code-block:: text

   环境提示：未安装 PyMySQL，改用 sqlite3 等价演示
   host = 127.0.0.1
   port = 3306
   user = app
   password = ******
   database = shop
   charset = utf8mb4
   autocommit = False
   connect_timeout = 3
   连接写法：pymysql.connect(**config)

``charset`` 要写 ``utf8mb4`` 而不是 ``utf8``，前者才能完整存储 emoji 和部分生僻字。``connect_timeout`` 只约束建立连接这一步，查询本身要用 ``read_timeout`` 和 ``write_timeout`` 单独限制。上面只打印参数，没有真的发起连接，因为本机没有可用的 MySQL 服务。

四、cursor 游标
---------------

游标是执行 SQL 的入口。``connection.cursor()`` 创建游标，``execute()`` 执行单条语句，``executemany()`` 用同一模板批量执行，``rowcount`` 记录影响行数，``lastrowid`` 返回自增主键，``description`` 描述结果集的列。

.. code-block:: python

   try:
       import pymysql
       backend = "PyMySQL 已安装，但本机没有 MySQL 服务"
   except ImportError:
       backend = "未安装 PyMySQL"
   print(f"环境提示：{backend}，改用 sqlite3 等价演示")

   import sqlite3

   conn = sqlite3.connect(":memory:")
   cur = conn.cursor()
   cur.execute(
       "CREATE TABLE product ("
       "id INTEGER PRIMARY KEY, "
       "name TEXT NOT NULL, "
       "price REAL NOT NULL)"
   )
   cur.execute("INSERT INTO product (name, price) VALUES (?, ?)", ("机械键盘", 399.0))
   print("单条插入的 id：", cur.lastrowid)

   cur.executemany(
       "INSERT INTO product (name, price) VALUES (?, ?)",
       [("无线鼠标", 129.0), ("显示器", 1099.0)],
   )
   print("executemany 影响行数：", cur.rowcount)

   cur.execute("SELECT id, name, price FROM product ORDER BY id")
   print("列名：", [column[0] for column in cur.description])

   cur.close()
   conn.close()

输出结果：

.. code-block:: text

   环境提示：未安装 PyMySQL，改用 sqlite3 等价演示
   单条插入的 id： 1
   executemany 影响行数： 2
   列名： ['id', 'name', 'price']

``executemany()`` 把两条 ``INSERT`` 合成一次调用，``rowcount`` 是 2。``lastrowid`` 返回最近一次单条插入产生的自增 id；在 MySQL 里批量插入后它只保证是“最后一条”的 id，不要指望拿到每一行的 id。``description`` 的每一项是一个七元组，第 0 位是列名。

五、fetchone 与 fetchall
------------------------

执行 ``SELECT`` 之后，结果集要逐行取回。``fetchone()`` 取一行，取完返回 ``None``；``fetchmany(n)`` 取 n 行；``fetchall()`` 一次取完剩余所有行。三种方法共用同一个游标位置，取过的行不会重复出现。

.. code-block:: python

   try:
       import pymysql
       backend = "PyMySQL 已安装，但本机没有 MySQL 服务"
   except ImportError:
       backend = "未安装 PyMySQL"
   print(f"环境提示：{backend}，改用 sqlite3 等价演示")

   import sqlite3

   conn = sqlite3.connect(":memory:")
   cur = conn.cursor()
   cur.execute("CREATE TABLE city (id INTEGER PRIMARY KEY, name TEXT, population INTEGER)")
   cur.executemany(
       "INSERT INTO city (name, population) VALUES (?, ?)",
       [("北京", 2189), ("上海", 2487), ("广州", 1868), ("深圳", 1756), ("成都", 2119)],
   )

   cur.execute("SELECT id, name, population FROM city ORDER BY id")
   print("fetchone()：", cur.fetchone())
   print("fetchmany(2)：", cur.fetchmany(2))
   print("fetchall()：", cur.fetchall())
   print("再次 fetchone()：", cur.fetchone())

   cur.close()
   conn.close()

输出结果：

.. code-block:: text

   环境提示：未安装 PyMySQL，改用 sqlite3 等价演示
   fetchone()： (1, '北京', 2189)
   fetchmany(2)： [(2, '上海', 2487), (3, '广州', 1868)]
   fetchall()： [(4, '深圳', 1756), (5, '成都', 2119)]
   再次 fetchone()： None

默认游标返回元组，列的取值只能靠下标，可读性差。PyMySQL 提供 ``pymysql.cursors.DictCursor``，在 ``connect()`` 时传入 ``cursorclass``，每行就变成以列名为键的字典，取字段时写成 ``row["name"]`` 更直观。``sqlite3`` 对应的做法是 ``conn.row_factory = sqlite3.Row``。

六、参数化查询防注入
--------------------

把用户输入直接拼进 SQL 是最危险的习惯。攻击者只要输入一段带引号和逻辑运算符的文本，就能改变原语句的结构。下面用一条构造出来的注入串演示风险：

.. code-block:: python

   try:
       import pymysql
       backend = "PyMySQL 已安装，但本机没有 MySQL 服务"
   except ImportError:
       backend = "未安装 PyMySQL"
   print(f"环境提示：{backend}，改用 sqlite3 等价演示")

   import sqlite3

   conn = sqlite3.connect(":memory:")
   cur = conn.cursor()
   cur.execute("CREATE TABLE student (id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
   cur.executemany("INSERT INTO student (name) VALUES (?)", [("张三",), ("李四",), ("王五",)])

   user_input = "张三' OR '1'='1"
   unsafe = f"SELECT id, name FROM student WHERE name = '{user_input}'"
   print("拼接出的 SQL：", unsafe)

   cur.execute("SELECT id, name FROM student WHERE name = ?", (user_input,))
   print("注入尝试的结果：", cur.fetchall())

   cur.execute("SELECT id, name FROM student WHERE name = ?", ("张三",))
   print("正常查询的结果：", cur.fetchall())

   cur.close()
   conn.close()

输出结果：

.. code-block:: text

   环境提示：未安装 PyMySQL，改用 sqlite3 等价演示
   拼接出的 SQL： SELECT id, name FROM student WHERE name = '张三' OR '1'='1'
   注入尝试的结果： []
   正常查询的结果： [(1, '张三')]

拼接后的条件变成 ``name = '张三' OR '1'='1'``，任何一行都能满足，整张表会被读出来；如果拼接的是 ``DELETE`` 或 ``UPDATE``，后果更严重。参数化查询把 SQL 模板和值分开传给驱动，值永远只被当作数据，不会被解析成语法。PyMySQL 的占位符是 ``%s``，调用写成 ``cur.execute(sql, (value,))``，注意即使只有一个参数也要传元组。

七、commit 与 rollback
----------------------

MySQL 的 InnoDB 支持事务：一组操作要么全部生效，要么全部撤销。连接默认关闭自动提交时，``INSERT``、``UPDATE``、``DELETE`` 执行后只存在于当前事务里，必须 ``commit()`` 才落盘，``rollback()`` 则丢弃这些改动。

.. code-block:: python

   try:
       import pymysql
       backend = "PyMySQL 已安装，但本机没有 MySQL 服务"
   except ImportError:
       backend = "未安装 PyMySQL"
   print(f"环境提示：{backend}，改用 sqlite3 等价演示")

   import sqlite3

   conn = sqlite3.connect(":memory:")
   cur = conn.cursor()
   cur.execute("CREATE TABLE account (id INTEGER PRIMARY KEY, name TEXT, balance INTEGER)")
   cur.executemany(
       "INSERT INTO account (name, balance) VALUES (?, ?)",
       [("小明", 1000), ("小红", 800)],
   )
   conn.commit()

   cur.execute("SELECT COUNT(*) FROM account")
   print("初始记录数：", cur.fetchone()[0])

   cur.execute("UPDATE account SET balance = balance - 200 WHERE name = ?", ("小明",))
   conn.rollback()
   cur.execute("SELECT balance FROM account WHERE name = ?", ("小明",))
   print("回滚后余额：", cur.fetchone()[0])

   cur.execute("UPDATE account SET balance = balance - 200 WHERE name = ?", ("小明",))
   conn.commit()
   cur.execute("SELECT balance FROM account WHERE name = ?", ("小明",))
   print("提交后余额：", cur.fetchone()[0])

   cur.close()
   conn.close()

输出结果：

.. code-block:: text

   环境提示：未安装 PyMySQL，改用 sqlite3 等价演示
   初始记录数： 2
   回滚后余额： 1000
   提交后余额： 800

转账是最典型的事务场景：先扣一方、再加另一方，中间任何一步失败都要整体回滚，否则账目就对不上。``sqlite3`` 的连接也支持 ``with conn:`` 语法，代码块正常结束自动提交，抛异常自动回滚；PyMySQL 没有这个上下文管理器，需要自己写 ``try`` / ``except`` 再调用 ``rollback()``。

八、增删改查
------------

把前面的零件组合起来，就是一次完整的 CRUD：建表、插入、查询、更新、删除。每一步都用 ``rowcount`` 确认影响的行数，避免“以为改了其实没匹配到”的错误。

.. code-block:: python

   try:
       import pymysql
       backend = "PyMySQL 已安装，但本机没有 MySQL 服务"
   except ImportError:
       backend = "未安装 PyMySQL"
   print(f"环境提示：{backend}，改用 sqlite3 等价演示")

   import sqlite3

   conn = sqlite3.connect(":memory:")
   cur = conn.cursor()
   cur.execute("CREATE TABLE book (id INTEGER PRIMARY KEY, title TEXT NOT NULL, stock INTEGER NOT NULL)")

   cur.execute("INSERT INTO book (title, stock) VALUES (?, ?)", ("流畅的 Python", 5))
   cur.execute("INSERT INTO book (title, stock) VALUES (?, ?)", ("Python 编程", 3))
   conn.commit()
   cur.execute("SELECT id, title, stock FROM book ORDER BY id")
   print("查：", cur.fetchall())

   cur.execute("UPDATE book SET stock = ? WHERE title = ?", (8, "流畅的 Python"))
   print("改：影响行数", cur.rowcount)
   conn.commit()

   cur.execute("DELETE FROM book WHERE title = ?", ("Python 编程",))
   print("删：影响行数", cur.rowcount)
   conn.commit()

   cur.execute("SELECT id, title, stock FROM book ORDER BY id")
   print("剩余：", cur.fetchall())

   cur.close()
   conn.close()

输出结果：

.. code-block:: text

   环境提示：未安装 PyMySQL，改用 sqlite3 等价演示
   查： [(1, '流畅的 Python', 5), (2, 'Python 编程', 3)]
   改：影响行数 1
   删：影响行数 1
   剩余： [(1, '流畅的 Python', 8)]

``UPDATE`` 与 ``DELETE`` 的 ``WHERE`` 条件同样要用占位符，否则又回到拼接字符串的老路。真实业务里很少直接物理删除，更常见的是加一个 ``is_deleted`` 字段做逻辑删除，查询时统一带上 ``WHERE is_deleted = 0``。

九、异常处理
------------

DB-API 定义了一套异常层次：``Error`` 是根，下面分 ``InterfaceError`` 与 ``DatabaseError``，后者再细分为 ``DataError``、``OperationalError``、``IntegrityError``、``InternalError``、``ProgrammingError`` 和 ``NotSupportedError``。PyMySQL 的异常放在 ``pymysql.err`` 里，类名与标准一致。

.. csv-table::
   :header: "异常", "典型触发场景", "处理建议"

   "``IntegrityError``", "主键重复、唯一约束冲突、非空字段为 ``NULL``", "提示用户换一个值，或改为更新已有记录"
   "``OperationalError``", "连接断开、SQL 语法错误、表不存在", "检查 SQL 与服务状态，必要时重连"
   "``ProgrammingError``", "占位符数量与参数不匹配、游标已关闭", "修正调用代码，属于程序缺陷"
   "``DataError``", "数值溢出、日期格式非法", "校验输入后再写入"
   "``InterfaceError``", "连接已关闭仍继续使用", "重新获取连接"

捕获异常时要按具体类型分支，不要用一个 ``except Exception`` 吞掉所有问题：

.. code-block:: python

   try:
       import pymysql
       backend = "PyMySQL 已安装，但本机没有 MySQL 服务"
   except ImportError:
       backend = "未安装 PyMySQL"
   print(f"环境提示：{backend}，改用 sqlite3 等价演示")

   import sqlite3

   conn = sqlite3.connect(":memory:")
   cur = conn.cursor()
   cur.execute("CREATE TABLE user (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE)")

   try:
       cur.execute("INSERT INTO user (id, name) VALUES (?, ?)", (1, "小明"))
       cur.execute("INSERT INTO user (id, name) VALUES (?, ?)", (1, "小红"))
   except sqlite3.IntegrityError:
       print("IntegrityError：主键重复，第二条插入被拒绝")

   try:
       cur.execute("INSERT INTO user (id, name) VALUES (?, ?)", (2, "小明"))
   except sqlite3.IntegrityError:
       print("IntegrityError：name 唯一约束冲突")

   try:
       cur.execute("SELEC * FROM user")
   except sqlite3.OperationalError:
       print("OperationalError：SQL 语法错误")

   try:
       cur.execute("INSERT INTO user (id, name) VALUES (?, ?)", (3,))
   except sqlite3.ProgrammingError:
       print("ProgrammingError：占位符与参数数量不匹配")

   cur.close()
   conn.close()

输出结果：

.. code-block:: text

   环境提示：未安装 PyMySQL，改用 sqlite3 等价演示
   IntegrityError：主键重复，第二条插入被拒绝
   IntegrityError：name 唯一约束冲突
   OperationalError：SQL 语法错误
   ProgrammingError：占位符与参数数量不匹配

异常消息里常常带着表名、列名甚至 SQL 片段，直接回显给终端用户既不友好也不安全，应该记录下来，对外只返回统一的错误提示。捕获 ``OperationalError`` 后如果要重试，记得先关掉旧连接再重新 ``connect()``，因为断开的连接不能复用。

十、连接池简介
--------------

每次请求都 ``connect()`` 一次，代价包括 TCP 握手、身份认证和会话初始化，高并发下会把时间浪费在建立连接上。连接池预先创建若干连接放入队列，用时取出、用完归还，把这份开销摊薄。

PyMySQL 本身不提供连接池，常见方案是 ``DBUtils`` 的 ``PooledDB``，或者交给 SQLAlchemy 的 ``create_engine(pool_size=...)`` 管理。下面用一个几十行的简化实现说明池的工作方式：

.. code-block:: python

   try:
       import pymysql
       backend = "PyMySQL 已安装，但本机没有 MySQL 服务"
   except ImportError:
       backend = "未安装 PyMySQL"
   print(f"环境提示：{backend}，改用 sqlite3 等价演示")

   import os
   import queue
   import sqlite3

   class SimplePool:
       def __init__(self, size, path):
           self._idle = queue.Queue(maxsize=size)
           self.created = 0
           for _ in range(size):
               self._idle.put(self._new(path))

       def _new(self, path):
           self.created += 1
           conn = sqlite3.connect(path)
           conn.execute("CREATE TABLE IF NOT EXISTS log (id INTEGER PRIMARY KEY, message TEXT)")
           return conn

       def acquire(self):
           return self._idle.get()

       def release(self, conn):
           self._idle.put(conn)

       def close(self):
           while not self._idle.empty():
               self._idle.get().close()

   path = "pool_demo.db"
   pool = SimplePool(2, path)
   first = pool.acquire()
   second = pool.acquire()
   print("连接池大小：", pool._idle.maxsize)
   print("累计创建的连接数：", pool.created)

   pool.release(first)
   third = pool.acquire()
   print("取出的连接是否复用：", third is first)

   pool.release(third)
   pool.release(second)
   pool.close()
   os.remove(path)

输出结果：

.. code-block:: text

   环境提示：未安装 PyMySQL，改用 sqlite3 等价演示
   连接池大小： 2
   累计创建的连接数： 2
   取出的连接是否复用： True

池的大小要结合数据库的 ``max_connections`` 和应用的并发量来定，设得过大反而会把数据库压垮。借出的连接必须在 ``finally`` 里归还，否则池会被慢慢耗尽；生产环境还要加健康检查，把失效的连接丢弃后补建，而不是原样放回队列。

十一、MySQL 与 SQLite 的方言差异
--------------------------------

本章用 ``sqlite3`` 演示，是因为它随 Python 一起安装、无需服务端。两者都支持标准 SQL，但细节上有不少差别，把示例迁移到 MySQL 时需要逐项替换：

.. csv-table::
   :header: "主题", "MySQL", "SQLite"

   "占位符", "``%s``", "``?``"
   "自增主键", "``AUTO_INCREMENT``", "``INTEGER PRIMARY KEY AUTOINCREMENT``"
   "字符串拼接", "``CONCAT(a, b)``", "``a || b``"
   "当前时间", "``NOW()``", "``CURRENT_TIMESTAMP``"
   "分页", "``LIMIT offset, count`` 或 ``LIMIT count OFFSET offset``", "``LIMIT count OFFSET offset``"
   "冲突处理", "``ON DUPLICATE KEY UPDATE``", "``ON CONFLICT DO UPDATE``"
   "存储引擎", "InnoDB、MyISAM 可选", "内置单一引擎"
   "网络访问", "客户端通过 TCP 连接服务端", "直接读写本地文件"

分页是两者都能用的写法，只要把占位符换掉即可：

.. code-block:: python

   try:
       import pymysql
       backend = "PyMySQL 已安装，但本机没有 MySQL 服务"
   except ImportError:
       backend = "未安装 PyMySQL"
   print(f"环境提示：{backend}，改用 sqlite3 等价演示")

   import sqlite3

   conn = sqlite3.connect(":memory:")
   cur = conn.cursor()
   cur.execute("CREATE TABLE article (id INTEGER PRIMARY KEY, title TEXT)")
   cur.executemany(
       "INSERT INTO article (title) VALUES (?)",
       [("A",), ("B",), ("C",), ("D",), ("E",)],
   )

   for page in range(1, 4):
       offset = (page - 1) * 2
       cur.execute("SELECT id, title FROM article ORDER BY id LIMIT ? OFFSET ?", (2, offset))
       print(f"第 {page} 页：", cur.fetchall())

   cur.close()
   conn.close()

输出结果：

.. code-block:: text

   环境提示：未安装 PyMySQL，改用 sqlite3 等价演示
   第 1 页： [(1, 'A'), (2, 'B')]
   第 2 页： [(3, 'C'), (4, 'D')]
   第 3 页： [(5, 'E')]

``LIMIT ? OFFSET ?`` 在 MySQL 里写成 ``LIMIT %s OFFSET %s`` 也能执行，参数顺序是“每页条数、跳过条数”。分页必须配合 ``ORDER BY``，否则数据库返回的顺序没有保证，翻页时可能出现重复或遗漏。

十二、练习任务
--------------

任务 1：统计订单。建一张订单表，插入四笔记录，算出一共几笔已付款、金额合计多少，再按客户汇总消费金额并从高到低排序。

.. code-block:: python

   try:
       import pymysql
       backend = "PyMySQL 已安装，但本机没有 MySQL 服务"
   except ImportError:
       backend = "未安装 PyMySQL"
   print(f"环境提示：{backend}，改用 sqlite3 等价演示")

   import sqlite3

   conn = sqlite3.connect(":memory:")
   cur = conn.cursor()
   cur.execute(
       "CREATE TABLE orders ("
       "id INTEGER PRIMARY KEY, "
       "customer TEXT, "
       "amount REAL, "
       "status TEXT)"
   )
   cur.executemany(
       "INSERT INTO orders (customer, amount, status) VALUES (?, ?, ?)",
       [
           ("小明", 268.0, "paid"),
           ("小红", 99.0, "unpaid"),
           ("小明", 128.0, "paid"),
           ("小刚", 500.0, "refunded"),
       ],
   )
   conn.commit()

   cur.execute("SELECT COUNT(*), SUM(amount) FROM orders WHERE status = ?", ("paid",))
   count, total = cur.fetchone()
   print(f"已付款订单：{count} 笔，合计 {total:.2f} 元")

   cur.execute(
       "SELECT customer, SUM(amount) FROM orders "
       "GROUP BY customer ORDER BY SUM(amount) DESC, customer"
   )
   for customer, amount in cur.fetchall():
       print(f"{customer}：{amount:.2f} 元")

   cur.close()
   conn.close()

输出结果：

.. code-block:: text

   环境提示：未安装 PyMySQL，改用 sqlite3 等价演示
   已付款订单：2 笔，合计 396.00 元
   小刚：500.00 元
   小明：396.00 元
   小红：99.00 元

任务 2：转账事务。两个账户各有一笔余额，写一个 ``transfer()`` 函数完成扣款与入账；金额超过限额时抛异常，验证余额整体回滚。

.. code-block:: python

   try:
       import pymysql
       backend = "PyMySQL 已安装，但本机没有 MySQL 服务"
   except ImportError:
       backend = "未安装 PyMySQL"
   print(f"环境提示：{backend}，改用 sqlite3 等价演示")

   import sqlite3

   conn = sqlite3.connect(":memory:")
   conn.execute("CREATE TABLE account (id INTEGER PRIMARY KEY, name TEXT UNIQUE, balance INTEGER)")
   conn.executemany(
       "INSERT INTO account (name, balance) VALUES (?, ?)",
       [("A", 500), ("B", 300)],
   )
   conn.commit()

   def transfer(conn, source, target, amount):
       try:
           with conn:
               conn.execute(
                   "UPDATE account SET balance = balance - ? WHERE name = ?",
                   (amount, source),
               )
               if amount > 1000:
                   raise ValueError("超出单笔限额")
               conn.execute(
                   "UPDATE account SET balance = balance + ? WHERE name = ?",
                   (amount, target),
               )
           return "转账成功"
       except ValueError as error:
           return f"转账失败：{error}"

   print(transfer(conn, "A", "B", 200))
   for name, balance in conn.execute("SELECT name, balance FROM account ORDER BY name"):
       print(name, balance)

   print(transfer(conn, "B", "A", 5000))
   for name, balance in conn.execute("SELECT name, balance FROM account ORDER BY name"):
       print(name, balance)

   conn.close()

输出结果：

.. code-block:: text

   环境提示：未安装 PyMySQL，改用 sqlite3 等价演示
   转账成功
   A 300
   B 500
   转账失败：超出单笔限额
   A 300
   B 500

``with conn:`` 在代码块正常结束时提交，抛出异常时回滚，所以第二次转账虽然已经执行了扣款语句，异常一抛出就被撤销，两个账户的余额保持原样。换成 PyMySQL 时，把 ``with`` 替换成显式的 ``commit()`` 与 ``rollback()``，逻辑完全一致。
