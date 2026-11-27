Python 日期和时间
==================

.. meta::
   :group: 标准库与实战
   :summary: 掌握 time、datetime、calendar 三个模块：date、time、datetime、timedelta 的创建与运算，strftime 与 strptime 的格式化与解析，固定时间戳与日期的互转，以及 zoneinfo 时区处理。

几乎每个实际项目都在和日期打交道：日志要带时间戳，订单要算有效期，报表要按自然月汇总，定时任务要判断今天是不是工作日。Python 标准库把这块能力拆成三个模块：``time`` 贴近操作系统，``datetime`` 面向对象、日常使用最多，``calendar`` 负责月历、闰年这类日历规则。三者互相配合，覆盖了绝大多数日期需求。

本章所有示例都使用固定日期和固定时间戳，不读取系统当前时间，因此每次运行的结果完全一致，可以逐行对照输出。需要获取“现在”的时候，把示例里的固定值换成 ``datetime.now()`` 或 ``date.today()`` 即可。

一、time 模块
--------------

``time`` 是最底层的接口，直接对应 C 语言的 ``time.h``。它以 Unix 时间戳为核心，表示从 1970 年 1 月 1 日 0 时（UTC）起经过的秒数：``time.time()`` 返回带小数的当前秒数，``time.gmtime()`` 把时间戳拆成 UTC 的 ``struct_time``，``time.localtime()`` 则按本机时区拆分，``time.strftime()`` 负责把 ``struct_time`` 格式化成字符串。

``struct_time`` 是一个具名元组，既能用 ``tm_year``、``tm_mon`` 这样的字段名访问，也能按下标取值。其中 ``tm_wday`` 用 0 表示周一、6 表示周日，``tm_yday`` 表示一年中的第几天、从 1 开始计数。这两个下标规则和日常习惯不同，容易写错。

.. code-block:: python

   import time

   epoch = time.gmtime(0)
   print("纪元时间：", time.strftime("%Y-%m-%d %H:%M:%S", epoch))
   print("年份、月份：", epoch.tm_year, epoch.tm_mon)
   print("一周中的第几天（0 为周一）：", epoch.tm_wday)

   moment = time.gmtime(1704096000)
   print("固定时间戳对应：", time.strftime("%Y-%m-%d %H:%M:%S", moment))
   print("时、分、秒：", moment.tm_hour, moment.tm_min, moment.tm_sec)
   print("一年中的第几天：", moment.tm_yday)

输出结果：

.. code-block:: text

   纪元时间： 1970-01-01 00:00:00
   年份、月份： 1970 1
   一周中的第几天（0 为周一）： 3
   固定时间戳对应： 2024-01-01 08:00:00
   时、分、秒： 8 0 0
   一年中的第几天： 1

示例只用了 ``gmtime()``，因为 ``localtime()`` 的结果取决于运行机器的时区设置，同一段代码在纽约和上海会打印出不同的时间。写日志、存数据库、跨系统交换数据时，统一用 UTC 再按需转换，能省掉大量“差八小时”的排查工作。

``time`` 还有两个专门用来计时的函数：``time.monotonic()`` 和 ``time.perf_counter()``。它们返回单调递增的数值，不受系统时间被手动修改或 NTP 校准的影响，测量耗时比相减两次 ``time.time()`` 可靠得多。这两个值本身没有意义，只能做差，所以不适合写进日志或展示给用户。

二、date、time 与 datetime
---------------------------

``datetime`` 模块里最常用的三个类是 ``date``、``time`` 和 ``datetime``：``date`` 精确到天，``time`` 精确到微秒，``datetime`` 是两者的组合。它们都是不可变对象，创建之后不能就地修改，``replace()``、``+``、``-`` 都会返回一个新对象，这一点和字符串很像，也意味着可以安全地在多个线程之间共享。

构造函数的参数顺序固定为年、月、日、时、分、秒、微秒，超出范围的取值会立刻抛出 ``ValueError``，不会悄悄进位。``isoformat()`` 输出 ISO 8601 格式，是配置文件、JSON 接口里最通用的写法；``fromisoformat()`` 则负责把它读回来。

.. code-block:: python

   from datetime import date, datetime, time

   day = date(2026, 3, 15)
   moment = time(9, 30, 15, 250000)
   stamp = datetime(2026, 3, 15, 9, 30, 15, 250000)

   print("日期：", day, "| ISO：", day.isoformat())
   print("时间：", moment, "| ISO：", moment.isoformat())
   print("日期时间：", stamp, "| ISO：", stamp.isoformat())
   print("年月日：", day.year, day.month, day.day)
   print("时分秒微秒：", moment.hour, moment.minute, moment.second, moment.microsecond)
   print("组合：", datetime.combine(day, moment))
   print("拆分：", stamp.date(), stamp.time())
   print("替换年份：", stamp.replace(year=2027))
   print("解析 ISO 字符串：", datetime.fromisoformat("2026-03-15T09:30:15"))

输出结果：

.. code-block:: text

   日期： 2026-03-15 | ISO： 2026-03-15
   时间： 09:30:15.250000 | ISO： 09:30:15.250000
   日期时间： 2026-03-15 09:30:15.250000 | ISO： 2026-03-15T09:30:15.250000
   年月日： 2026 3 15
   时分秒微秒： 9 30 15 250000
   组合： 2026-03-15 09:30:15.250000
   拆分： 2026-03-15 09:30:15.250000
   替换年份： 2027-03-15 09:30:15.250000
   解析 ISO 字符串： 2026-03-15 09:30:15

``print()`` 调用 ``str()``，日期时间会显示成 ``2026-03-15 09:30:15.250000`` 这种便于阅读的形式；``repr()`` 则会显示 ``datetime.datetime(2026, 3, 15, 9, 30, 15, 250000)``，在交互式解释器和调试器里看到的就是后者。两者都不带时区信息，这类对象被称为 naive（无时区）对象。

``date`` 和 ``datetime`` 可以直接比较大小、排序，因为同类型对象之间定义了完整的比较规则。``time`` 对象在 Python 中不支持比较，需要排序时可以先转成 ``(hour, minute, second, microsecond)`` 元组。

三、timedelta 与时间间隔
-------------------------

``timedelta`` 表示一段时长，构造参数可以是 ``weeks``、``days``、``hours``、``minutes``、``seconds``、``milliseconds``、``microseconds``。它内部只保存 ``days``、``seconds``、``microseconds`` 三个字段，并自动做规范化：写 25 小时，实际存成 1 天 1 小时。

正因为做了规范化，``delta.seconds`` 并不等于总秒数，它只是不足一天的那部分。需要总秒数时必须调用 ``total_seconds()``，这个方法返回浮点数，适合再换算成分钟或小时。``timedelta`` 支持与整数、浮点数相乘除，也支持两个时长相加相减，但不能直接和日期相加——那样得到的仍然是 ``timedelta``。

.. code-block:: python

   from datetime import datetime, timedelta

   delta = timedelta(days=10, hours=6, minutes=30)
   print("间隔：", delta)
   print("总秒数：", delta.total_seconds())
   print("只有天数：", delta.days, "剩余秒数：", delta.seconds)
   print("换算成周：", delta.days // 7, "天余", delta.days % 7)

   start = datetime(2026, 1, 1, 8, 0)
   print("十天后：", start + delta)
   print("十天前：", start - delta)
   print("两倍时长：", delta * 2)
   print("两个日期相差：", datetime(2026, 1, 31) - datetime(2026, 1, 1))

输出结果：

.. code-block:: text

   间隔： 10 days, 6:30:00
   总秒数： 887400.0
   只有天数： 10 剩余秒数： 23400
   换算成周： 1 天余 3
   十天后： 2026-01-11 14:30:00
   十天前： 2025-12-22 01:30:00
   两倍时长： 20 days, 13:00:00
   两个日期相差： 30 days, 0:00:00

两个 ``datetime`` 相减得到 ``timedelta``，取 ``.days`` 就是相差的天数，这是统计账期、计算滞留时间最常用的写法。注意结果可能为负，负值的 ``days`` 会向下取整，例如 ``timedelta(hours=-1).days`` 是 ``-1`` 而不是 ``0``，做除法或取模时要留意符号。

``timedelta`` 没有“一个月”或“一年”的概念，因为月份长度不固定。要加一个月，应使用 ``date.replace(month=...)`` 配合月末判断；对“加一个月再减一天”这类业务规则，第三方库 ``dateutil`` 的 ``relativedelta`` 会更省事。

四、strftime：把日期格式化成字符串
-----------------------------------

``strftime()`` 按格式串把日期时间转成文本，格式串里以百分号开头的部分会被替换成对应字段。下表列出最常用的指令，示例列对应 ``2026-03-15 09:05:07.120000`` 这个时刻：

.. csv-table::
   :header: "指令", "含义", "示例"

   "%Y", "四位年份", "2026"
   "%y", "两位年份", "26"
   "%m", "两位月份（01-12）", "03"
   "%d", "两位日期（01-31）", "15"
   "%H", "24 小时制小时（00-23）", "09"
   "%I", "12 小时制小时（01-12）", "09"
   "%M", "分钟（00-59）", "05"
   "%S", "秒（00-59）", "07"
   "%f", "微秒（000000-999999）", "120000"
   "%j", "一年中的第几天（001-366）", "074"
   "%A", "星期全名", "Sunday"
   "%B", "月份全名", "March"
   "%p", "上午或下午标记", "AM"
   "%z", "UTC 偏移", "+0800"
   "%Z", "时区名称", "CST"

.. code-block:: python

   from datetime import datetime

   dt = datetime(2026, 3, 15, 9, 5, 7, 120000)

   print("日期时间：", dt.strftime("%Y-%m-%d %H:%M:%S"))
   print("中文格式：", dt.strftime("%Y 年 %m 月 %d 日"))
   print("紧凑格式：", dt.strftime("%Y%m%d-%H%M%S"))
   print("微秒六位：", dt.strftime("%f"))
   print("年内第几天：", dt.strftime("%j"))
   print("两位年份：", dt.strftime("%y"))
   print("十二小时制：", dt.strftime("%I:%M"))
   print("转义百分号：", dt.strftime("%Y%%"))

输出结果：

.. code-block:: text

   日期时间： 2026-03-15 09:05:07
   中文格式： 2026 年 03 月 15 日
   紧凑格式： 20260315-090507
   微秒六位： 120000
   年内第几天： 074
   两位年份： 26
   十二小时制： 09:05
   转义百分号： 2026%

``%A``、``%B``、``%p`` 的输出跟随系统区域设置，在中文环境下可能变成“星期日”“三月”“上午”，跨平台比较字符串时不要依赖它们；``%z`` 只对带时区的对象有意义，naive 对象会得到空字符串；``%s`` 是平台扩展，Windows 上不可用。要写进文件名或接口参数时，优先使用纯数字指令。

格式串里除了百分号指令，其余字符原样输出，包括中文和空格。上面 ``"%Y 年 %m 月 %d 日"`` 的结果里因此保留了空格：“2026 年 03 月 15 日”。想要“2026年3月15日”这种不带前导零的写法，直接在 ``f-string`` 里拼接属性更简单。

五、strptime：把字符串解析成日期
---------------------------------

``strptime()`` 是 ``strftime()`` 的逆操作：按格式串把文本解析成 ``datetime`` 对象。它要求文本与格式逐字符对应，缺少前导零、多了空格、分隔符不一致都会失败，失败时抛出 ``ValueError``，而不是返回 ``None``。

解析用户输入或日志内容时，一定要用 ``try`` 包住，并把失败原因记录下来，否则一条脏数据就能让整批任务中止。作为对比，``datetime.fromisoformat()`` 不需要写格式串，专门处理 ISO 8601 文本，速度快、写法短，适合内部数据交换。

.. code-block:: python

   from datetime import datetime

   raw = "2026-03-15 09:30:00"
   parsed = datetime.strptime(raw, "%Y-%m-%d %H:%M:%S")
   print("解析结果：", parsed)
   print("对象类型：", type(parsed).__name__)
   print("星期几（1 为周一）：", parsed.isoweekday())

   for text in ["2026/03/15", "2026-13-01"]:
       try:
           value = datetime.strptime(text, "%Y-%m-%d")
           print(text, "->", value)
       except ValueError:
           print(text, "-> 解析失败，月份越界或分隔符不匹配")

输出结果：

.. code-block:: text

   解析结果： 2026-03-15 09:30:00
   对象类型： datetime
   星期几（1 为周一）： 7
   2026/03/15 -> 解析失败，月份越界或分隔符不匹配
   2026-13-01 -> 解析失败，月份越界或分隔符不匹配

第二条失败记录是因为 ``%m`` 只接受 01 到 12，13 月无法匹配；第一条失败是分隔符用了斜杠而格式串要求短横线。实际项目中常见的坑是日志里带毫秒、带时区、带方括号，这时要么把格式串写全（``"[%Y-%m-%d %H:%M:%S]"``），要么先用正则把时间片段抠出来再解析。

``strptime()`` 返回的始终是 naive 对象，即使文本里带 ``+0800``，也不会自动变成带时区的对象。要保留时区，可以在解析后调用 ``replace(tzinfo=timezone(timedelta(hours=8)))``，或者直接用 ``fromisoformat()``，后者能识别文本中的偏移量。

六、时间戳与日期互转
---------------------

``datetime.timestamp()`` 把对象转成 Unix 时间戳，``datetime.fromtimestamp()`` 则反向还原。麻烦之处在于时区：naive 对象调用 ``timestamp()`` 时，Python 会按本机时区解释它；``fromtimestamp()`` 不带 ``tz`` 参数时，也按本机时区还原。同一段代码在不同时区的机器上会得到不同结果。

稳妥的写法是全程使用带时区的对象，并把 UTC 显式传给 ``tz`` 参数。下面示例用固定时间戳 ``1704096000``，它对应 UTC 的 2024 年 1 月 1 日 8 点：

.. code-block:: python

   from datetime import datetime, timezone

   moment = datetime(2024, 1, 1, 8, 0, tzinfo=timezone.utc)
   stamp = moment.timestamp()

   print("秒级时间戳：", stamp)
   print("毫秒时间戳：", int(stamp * 1000))
   print("还原为 UTC：", datetime.fromtimestamp(int(stamp), tz=timezone.utc).isoformat())
   print("按 UTC 格式化：", datetime.fromtimestamp(int(stamp), tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S %Z"))
   print("带时区对象可比较：", moment == datetime.fromtimestamp(int(stamp), tz=timezone.utc))

输出结果：

.. code-block:: text

   秒级时间戳： 1704096000.0
   毫秒时间戳： 1704096000000
   还原为 UTC： 2024-01-01T08:00:00+00:00
   按 UTC 格式化： 2024-01-01 08:00:00 UTC
   带时区对象可比较： True

``timestamp()`` 返回浮点数，因为时间戳允许小数秒；需要整数时用 ``int()`` 截断，或者 ``round()`` 四舍五入。前端 JavaScript 习惯用毫秒时间戳，传给后端时记得整除 1000，反过来则乘 1000。

数据库里存时间通常有三种做法：存 UTC 时间戳、存带时区的 ``datetime``、存 ISO 字符串。无论选哪种，都要保证“写入”和“读出”使用同一套时区约定。混用本地时间和 UTC 是日期相关 bug 最常见的来源，而且往往要等到跨时区部署或夏令时切换时才暴露。

七、时区与 zoneinfo
--------------------

不带时区的 naive 对象无法确定对应哪个时刻，带时区的 aware 对象则通过 ``tzinfo`` 记录偏移量。``datetime.timezone`` 只能表示固定偏移（例如 ``timezone(timedelta(hours=8))``），``zoneinfo.ZoneInfo`` 则读取 IANA 时区数据库，能正确处理历史上多次变更的偏移和夏令时规则。

创建 ``ZoneInfo`` 需要时区名，比如 ``Asia/Shanghai``、``Europe/Paris``。Linux 和 macOS 自带时区数据库，Windows 没有，必须额外安装 ``tzdata`` 包，否则会抛出 ``ZoneInfoNotFoundError``。示例里做了兜底：拿不到时区数据库时退回固定 +08:00，中国自 1991 年起不再使用夏令时，两者在当前日期上完全等价，所以输出保持一致。

.. code-block:: python

   from datetime import datetime, timedelta, timezone
   from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


   def shanghai_zone():
       try:
           return ZoneInfo("Asia/Shanghai")
       except ZoneInfoNotFoundError:
           # Windows 未安装 tzdata 时的兜底方案
           return timezone(timedelta(hours=8))


   zone = shanghai_zone()
   utc_moment = datetime(2024, 6, 1, 12, 0, tzinfo=timezone.utc)
   local_moment = utc_moment.astimezone(zone)

   print("UTC 时间：", utc_moment.isoformat())
   print("上海时间：", local_moment.isoformat())
   print("UTC 偏移：", local_moment.utcoffset())
   print("换算回 UTC：", local_moment.astimezone(timezone.utc).isoformat())

   try:
       datetime(2024, 6, 1, 12, 0) < utc_moment
   except TypeError:
       print("naive 与 aware 对象不能直接比较大小")

输出结果：

.. code-block:: text

   UTC 时间： 2024-06-01T12:00:00+00:00
   上海时间： 2024-06-01T20:00:00+08:00
   UTC 偏移： 8:00:00
   换算回 UTC： 2024-06-01T12:00:00+00:00
   naive 与 aware 对象不能直接比较大小

``astimezone()`` 负责在时区之间换算，它不改变时间点，只改变显示方式；``utcoffset()`` 返回该时刻相对 UTC 的偏移。对 aware 对象做算术运算，结果仍然是 aware，跨夏令时切换时会自动调整偏移，这正是不能用固定偏移硬编码欧洲、北美时区的原因。

判断对象是否带时区，看 ``tzinfo`` 是否为 ``None`` 即可，但更严谨的做法是检查 ``utcoffset()`` 是否返回 ``None``；某些自定义 ``tzinfo`` 虽然有实例，却可能返回 ``None``。两种对象混用会抛 ``TypeError``，报错信息里会明确提示 "can't compare offset-naive and offset-aware datetimes"。

八、常见的日期计算
-------------------

业务代码里的日期计算大多集中在这几件事上：从开始日期推截止日期、算两个日期相隔多久、统计区间内的工作日、取上个月的最后一天、按固定参考日期算周岁。把它们写成小函数，比在业务逻辑里到处写 ``timedelta`` 更清晰。

注意区间统计的边界约定：``(end - start).days`` 计算的是“相差天数”，不包含起始日；而“区间内有几天”通常要包含起始日、不包含结束日，循环里写 ``while current < end``。同一个需求用错边界，结果就会差一天。

.. code-block:: python

   from datetime import date, timedelta

   start = date(2026, 3, 1)
   deadline = start + timedelta(days=45)
   print(f"开始日期： {start}")
   print(f"截止日期： {deadline}（星期 {deadline.isoweekday()}）")
   print("相隔天数：", (deadline - start).days)
   print("上个月最后一天：", date(2026, 3, 1) - timedelta(days=1))


   def count_workdays(begin, end):
       total = 0
       current = begin
       while current < end:
           if current.isoweekday() <= 5:
               total += 1
           current += timedelta(days=1)
       return total


   def full_age(birth, reference):
       years = reference.year - birth.year
       if (reference.month, reference.day) < (birth.month, birth.day):
           years -= 1
       return years


   print("区间内工作日：", count_workdays(start, deadline))
   print("周岁：", full_age(date(1998, 9, 20), date(2026, 3, 15)))
   print("年末最后一天：", date(2026, 12, 31))

输出结果：

.. code-block:: text

   开始日期： 2026-03-01
   截止日期： 2026-04-15（星期 3）
   相隔天数： 45
   上个月最后一天： 2026-02-28
   区间内工作日： 32
   周岁： 27
   年末最后一天： 2026-12-31

``isoweekday()`` 返回 1 到 7，1 表示周一；``weekday()`` 返回 0 到 6，0 表示周一。两个方法只差一个偏移量，混用时最容易写出“星期 0”。``count_workdays()`` 只排除了周六周日，没有考虑法定节假日，真实排班需要额外维护节假日表。

周岁函数用元组比较 ``(month, day)`` 判断生日是否已过，比先算天数再除以 365 更准确，也不会受闰年影响。取月末日期用“下个月 1 号减一天”的写法，比硬编码 28、29、30、31 更可靠。

九、calendar 模块
------------------

``calendar`` 处理“月”这一层的规则：某月有几天、1 号是星期几、某年是不是闰年，以及直接生成月历文本。``calendar.month(year, month)`` 返回多行字符串，默认以周一为一周的第一天，可以直接打印到终端或写进报告。

``calendar.monthcalendar(year, month)`` 把整月拆成“按周分组的二维列表”，每行固定 7 个元素，属于本月的日期用日号表示，不属于本月的补 0。需要在界面上画日历控件时，用这个函数比解析月历文本方便得多。

.. code-block:: python

   import calendar

   print("2026 年 2 月的月历：")
   for line in calendar.month(2026, 2).splitlines():
       print("| " + line)

   print("第一周：", calendar.monthcalendar(2026, 2)[0])
   print("闰年 2024：", calendar.isleap(2024), "| 闰年 2026：", calendar.isleap(2026))

   first_weekday, days_in_month = calendar.monthrange(2024, 2)
   print("2024 年 2 月天数：", days_in_month, "| 1 号是星期：", int(first_weekday) + 1)
   print("2026-01-01 是星期：", calendar.weekday(2026, 1, 1) + 1)

输出结果：

.. code-block:: text

   2026 年 2 月的月历：
   |    February 2026
   | Mo Tu We Th Fr Sa Su
   |                    1
   |  2  3  4  5  6  7  8
   |  9 10 11 12 13 14 15
   | 16 17 18 19 20 21 22
   | 23 24 25 26 27 28
   第一周： [0, 0, 0, 0, 0, 0, 1]
   闰年 2024： True | 闰年 2026： False
   2024 年 2 月天数： 29 | 1 号是星期： 4
   2026-01-01 是星期： 4

每行前面的 ``|`` 是示例自己加的前缀，纯粹的 ``calendar.month()`` 输出里，第一行月份标题带若干前导空格，直接贴进文档容易被误读成缩进。月历文本里的月份名是英文，因为 ``calendar`` 在导入时按当前区域设置生成了月份名列表；``calendar.setfirstweekday()`` 可以把一周的第一天改成周日，``calendar.LocaleTextCalendar`` 支持按指定区域输出本地化的月名。

``monthrange()`` 的返回值在 Python 3.13 里是 ``calendar.Day`` 枚举，直接打印会显示 ``calendar.THURSDAY`` 这样的名字，所以示例用 ``int()`` 转成数字再加 1。做“某月有多少个工作日”这类统计时，把 ``monthrange()`` 和 ``weekday()`` 结合起来，比手写循环判断闰年省事。

十、练习任务
------------

任务 1：计算 2026 年从元旦到年末的间隔天数、完整周数和余下天数。

.. code-block:: python

   from datetime import date

   start = date(2026, 1, 1)
   end = date(2026, 12, 31)
   days = (end - start).days

   print("间隔天数：", days)
   print("完整周数：", days // 7)
   print("余下天数：", days % 7)
   print("结束日是年内第几天：", end.timetuple().tm_yday)

输出结果：

.. code-block:: text

   间隔天数： 364
   完整周数： 52
   余下天数： 0
   结束日是年内第几天： 365

任务 2：把三条日志时间解析成 ``datetime``，按时间先后重新排序后输出时分秒和事件。

.. code-block:: python

   from datetime import datetime

   records = [
       ("2026-03-15 09:30:00", "备份完成"),
       ("2026-03-15 08:05:30", "服务启动"),
       ("2026-03-15 09:12:45", "任务排队"),
   ]

   parsed = []
   for text, event in records:
       try:
           parsed.append((datetime.strptime(text, "%Y-%m-%d %H:%M:%S"), event))
       except ValueError:
           print("跳过无法解析的记录：", text)

   for moment, event in sorted(parsed):
       print(moment.strftime("%H:%M:%S"), event)

输出结果：

.. code-block:: text

   08:05:30 服务启动
   09:12:45 任务排队
   09:30:00 备份完成

任务 3：用 ``calendar`` 查出 2026 年 2 月的天数、1 号是星期几，并算出 3 月 1 日。

.. code-block:: python

   import calendar
   from datetime import date, timedelta

   first_weekday, days_in_month = calendar.monthrange(2026, 2)
   last_day = date(2026, 2, days_in_month)

   print("当月天数：", days_in_month)
   print("1 号是星期：", int(first_weekday) + 1)
   print("当月最后一天：", last_day)
   print("下个月第一天：", last_day + timedelta(days=1))

输出结果：

.. code-block:: text

   当月天数： 28
   1 号是星期： 7
   当月最后一天： 2026-02-28
   下个月第一天： 2026-03-01
