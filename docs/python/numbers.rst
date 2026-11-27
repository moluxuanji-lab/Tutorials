Python 数字
============

.. meta::
   :group: 核心语法
   :summary: 认识 int、float、complex 三种数字类型，处理浮点精度与 decimal 精确计算，掌握 math、cmath、random 常用函数、数学常量与数字格式化。

数字是 Python 最基础的数据类型。整数没有大小上限，浮点数遵循 IEEE 754 双精度标准，复数原生支持。理解这三者的表示方式与边界，才能在处理金额、统计、仿真等场景时避开精度陷阱。

一、int 整数
------------

Python 的 ``int`` 是任意精度整数，只受内存限制，不会像 C 语言那样在 64 位处溢出。书写时可以用下划线分组提升可读性，也可以直接用二进制 ``0b``、八进制 ``0o``、十六进制 ``0x`` 前缀。

``bit_length()`` 返回表示该整数所需的最少二进制位数，``int()`` 负责把字符串或浮点数转换成整数，其中浮点数转换是直接截断小数部分，不进行四舍五入。

.. code-block:: python

   count = 42
   big = 2 ** 100

   print("十进制：", 1_000_000)
   print("二进制 0b1010 =", 0b1010)
   print("八进制 0o17 =", 0o17)
   print("十六进制 0xFF =", 0xFF)
   print("2 ** 100 =", big)
   print("二进制位数：", big.bit_length())
   print("int('42') =", int("42"))
   print("int('ff', 16) =", int("ff", 16))
   print("int(3.99) =", int(3.99))
   print("int(-3.99) =", int(-3.99))
   print("10 / 3 取整：", int(10 / 3))
   print("类型：", type(count).__name__)

输出结果：

.. code-block:: text

   十进制： 1000000
   二进制 0b1010 = 10
   八进制 0o17 = 15
   十六进制 0xFF = 255
   2 ** 100 = 1267650600228229401496703205376
   二进制位数： 101
   int('42') = 42
   int('ff', 16) = 255
   int(3.99) = 3
   int(-3.99) = -3
   10 / 3 取整： 3
   类型： int

``int(-3.99)`` 得到 ``-3``，是朝零截断而不是向下取整；想要向下取整应当用 ``math.floor(-3.99)``，结果为 ``-4``。``int()`` 的第二个参数指定进制，解析配置、颜色值、协议字段时会经常用到。

二、float 浮点数
----------------

``float`` 用 64 位双精度表示，能存大约 15 到 17 位有效数字，范围约为 ``1e-308`` 到 ``1e308``。它可以用小数点写法，也可以用科学计数法 ``1.5e3``。

浮点数有两个特殊值：``inf`` 表示无穷大，``nan`` 表示“非数”。``nan`` 与任何值比较都为假，连它自己也不等于自己，所以判断 ``nan`` 要用 ``math.isnan()``，不能写 ``==``。

.. code-block:: python

   price = 19.9
   ratio = 1.5e-3
   whole = 7.0

   print("price =", price)
   print("ratio =", ratio)
   print("whole =", whole)
   print("float('3.14') =", float("3.14"))
   print("float(7) =", float(7))
   print("整数值判断：", whole.is_integer(), (7.5).is_integer())
   print("科学计数法：", f"{123456789:.3e}")
   print("inf 大于任意大整数：", float("inf") > 10 ** 100)
   print("nan 不等于自身：", float("nan") != float("nan"))
   print("类型：", type(price).__name__)

输出结果：

.. code-block:: text

   price = 19.9
   ratio = 0.0015
   whole = 7.0
   float('3.14') = 3.14
   float(7) = 7.0
   整数值判断： True False
   科学计数法： 1.235e+08
   inf 大于任意大整数： True
   nan 不等于自身： True
   类型： float

``is_integer()`` 判断浮点数的小数部分是否为 0，常用来区分“整数值的浮点数”和真正带小数的值。需要判断一个浮点数能否安全地转成整数时，它比 ``x % 1 == 0`` 更直观。

三、complex 复数
----------------

复数字面量在数字后加 ``j``，例如 ``3 + 4j``。它有两个只读属性：``real`` 取实部，``imag`` 取虚部。内置函数 ``abs()`` 返回复数的模，``conjugate()`` 返回共轭复数。

Python 没有单独的“虚数”类型，``4j`` 本身就是一个实部为 0 的复数。复数之间可以做加减乘除和幂运算，但不能比较大小。

.. code-block:: python

   a = 3 + 4j
   b = 1 - 2j

   print("a =", a)
   print("b =", b)
   print("a + b =", a + b)
   print("a * b =", a * b)
   print("complex(2, -3) =", complex(2, -3))
   print("实部：", a.real, "虚部：", a.imag)
   print("共轭：", a.conjugate())
   print("模：", abs(a))
   print("类型：", type(a).__name__)

输出结果：

.. code-block:: text

   a = (3+4j)
   b = (1-2j)
   a + b = (4+2j)
   a * b = (11-2j)
   complex(2, -3) = (2-3j)
   实部： 3.0 虚部： 4.0
   共轭： (3-4j)
   模： 5.0
   类型： complex

复数的实部和虚部都是 ``float``，所以 ``a.real`` 打印出来是 ``3.0`` 而不是 ``3``。三个复数相加时，建议用内置的 ``sum()`` 并显式给出初值 ``0j``，否则空序列求和会得到整数 ``0``。

四、浮点精度与 decimal
----------------------

浮点数用二进制存储小数，而 ``0.1`` 这样的十进制小数在二进制中是无限循环的，只能近似保存。因此 ``0.1 + 0.2`` 并不等于 ``0.3``，而是 ``0.30000000000000004``。这类误差在累加多次后会放大，金额、税率、对账场景必须避开。

用 Decimal 精确计算
~~~~~~~~~~~~~~~~~~~

``decimal`` 模块用十进制浮点运算，精度和舍入方式都可以控制，适合财务计算。构造 ``Decimal`` 时务必传字符串，写成 ``Decimal(0.1)`` 会把浮点误差原样带进去。

.. code-block:: python

   from decimal import Decimal, ROUND_HALF_UP, getcontext

   print("0.1 + 0.2 =", 0.1 + 0.2)
   print("是否等于 0.3：", 0.1 + 0.2 == 0.3)
   print("round 之后：", round(0.1 + 0.2, 2))

   print("Decimal：", Decimal("0.1") + Decimal("0.2"))
   print("Decimal 相等：", Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))

   price = Decimal("19.99")
   rate = Decimal("0.13")
   tax = (price * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
   print("税额：", tax)

   getcontext().prec = 6
   print("1 / 3 =", Decimal(1) / Decimal(3))

输出结果：

.. code-block:: text

   0.1 + 0.2 = 0.30000000000000004
   是否等于 0.3： False
   round 之后： 0.3
   Decimal： 0.3
   Decimal 相等： True
   税额： 2.60
   1 / 3 = 0.333333

``quantize()`` 负责把结果舍入到指定的小数位数，``ROUND_HALF_UP`` 就是日常说的“四舍五入”。``getcontext().prec`` 控制有效数字位数，默认是 28 位，示例中改成 6 位后 ``1 / 3`` 只保留 6 位有效数字。

五、math 常用函数
-----------------

``math`` 模块提供面向实数的数学函数，参数和返回值多数是 ``float``，``factorial()``、``gcd()``、``comb()`` 这类组合计数函数则返回 ``int``。常用的有取整类的 ``ceil()``、``floor()``、``trunc()``，以及 ``sqrt()``、``pow()``、``log2()``、``log10()``、``hypot()``。

``ceil()`` 向上取整，``floor()`` 向下取整，``trunc()`` 朝零截断。负数上三者的差异最明显：``ceil(-2.7)`` 是 ``-2``，``floor(-2.7)`` 是 ``-3``，``trunc(-2.7)`` 是 ``-2``。

.. code-block:: python

   import math

   print("sqrt(16) =", math.sqrt(16))
   print("ceil(2.1) =", math.ceil(2.1), "floor(2.9) =", math.floor(2.9))
   print("trunc(-2.7) =", math.trunc(-2.7))
   print("fabs(-3.5) =", math.fabs(-3.5))
   print("pow(2, 10) =", math.pow(2, 10))
   print("factorial(6) =", math.factorial(6))
   print("gcd(48, 18) =", math.gcd(48, 18))
   print("comb(5, 2) =", math.comb(5, 2))
   print("log2(1024) =", math.log2(1024))
   print("log10(1000) =", math.log10(1000))
   print("hypot(3, 4) =", math.hypot(3, 4))
   print("isclose：", math.isclose(0.1 + 0.2, 0.3))
   print("degrees(pi) =", math.degrees(math.pi))

   for label, func in [("sqrt(-1)", lambda: math.sqrt(-1)), ("log(0)", lambda: math.log(0))]:
       try:
           func()
       except ValueError as error:
           print(f"{label} 抛出 {type(error).__name__}")

输出结果：

.. code-block:: text

   sqrt(16) = 4.0
   ceil(2.1) = 3 floor(2.9) = 2
   trunc(-2.7) = -2
   fabs(-3.5) = 3.5
   pow(2, 10) = 1024.0
   factorial(6) = 720
   gcd(48, 18) = 6
   comb(5, 2) = 10
   log2(1024) = 10.0
   log10(1000) = 3.0
   hypot(3, 4) = 5.0
   isclose： True
   degrees(pi) = 180.0
   sqrt(-1) 抛出 ValueError
   log(0) 抛出 ValueError

``math.pow()`` 返回浮点数，而内置的 ``**`` 对整数保持整数精度，``2 ** 10`` 得到 ``1024``，``math.pow(2, 10)`` 得到 ``1024.0``。参数超出定义域时（如 ``sqrt(-1)``、``log(0)``）会抛出 ``ValueError``，阶乘参数为负同样如此，所以调用前要么校验参数，要么显式捕获。

六、cmath 模块
--------------

``cmath`` 是 ``math`` 的复数版本，函数名基本一致，但参数和返回值都是复数。它最有用的一点是能对负数开平方：``math.sqrt(-1)`` 报错，``cmath.sqrt(-1)`` 返回 ``1j``。

``phase()`` 返回复数的幅角（弧度），``polar()`` 一次返回模和幅角组成的元组，``rect()`` 则把极坐标还原成直角坐标。

.. code-block:: python

   import cmath

   print("sqrt(-1) =", cmath.sqrt(-1))
   print("sqrt(-4) =", cmath.sqrt(-4))
   print("phase(-1) =", round(cmath.phase(-1), 4))
   print("polar(1 + 1j) =", tuple(round(v, 4) for v in cmath.polar(1 + 1j)))
   print("rect(2, 0) =", cmath.rect(2, 0))

   value = cmath.exp(1j * cmath.pi)
   print("exp(i * pi) 实部：", round(value.real, 6), "虚部：", round(value.imag, 6))
   print("cmath.pi =", round(cmath.pi, 4))

输出结果：

.. code-block:: text

   sqrt(-1) = 1j
   sqrt(-4) = 2j
   phase(-1) = 3.1416
   polar(1 + 1j) = (1.4142, 0.7854)
   rect(2, 0) = (2+0j)
   exp(i * pi) 实部： -1.0 虚部： 0.0
   cmath.pi = 3.1416

``cmath.exp(1j * cmath.pi)`` 理论上是 ``-1``，但浮点运算会留下 ``1.2e-16`` 量级的虚部，所以示例先取 ``.real`` 和 ``.imag`` 再分别四舍五入。直接用 ``==`` 比较这类结果是不可靠的，应该用 ``math.isclose()`` 或给定容差。

七、random 模块
---------------

``random`` 生成的是伪随机数，由内部状态决定。调用 ``random.seed()`` 设定种子后，后续序列完全可复现，这对调试、测试和教程示例至关重要；不设种子时，解释器会用系统提供的随机源初始化，每次运行结果都不同。

常用函数有：``randint(a, b)`` 生成闭区间内的整数，``random()`` 生成 ``[0, 1)`` 的浮点数，``uniform(a, b)`` 生成区间内的浮点数，``choice()`` 从序列中取一个元素，``sample()`` 不重复抽取多个，``shuffle()`` 就地打乱列表。

.. code-block:: python

   import random

   random.seed(2024)

   print("随机整数：", random.randint(1, 100))
   print("随机浮点：", round(random.random(), 4))
   print("指定范围：", round(random.uniform(1.0, 5.0), 4))
   print("随机选择：", random.choice(["石头", "剪刀", "布"]))
   print("不重复抽样：", random.sample(range(1, 50), 5))

   deck = list(range(1, 11))
   random.shuffle(deck)
   print("洗牌结果：", deck)

   random.seed(2024)
   first = [random.randint(1, 100) for _ in range(3)]
   random.seed(2024)
   second = [random.randint(1, 100) for _ in range(3)]
   print("重新播种后一致：", first == second)

输出结果：

.. code-block:: text

   随机整数： 61
   随机浮点： 0.1817
   指定范围： 3.3134
   随机选择： 石头
   不重复抽样： [47, 27, 49, 46, 17]
   洗牌结果： [1, 7, 6, 2, 5, 10, 3, 8, 4, 9]
   重新播种后一致： True

``random`` 不适合安全场景，密码、令牌、验证码应当使用 ``secrets`` 模块。``shuffle()`` 直接修改原列表并返回 ``None``，写成 ``deck = random.shuffle(deck)`` 会让 ``deck`` 变成 ``None``，这是很常见的错误。

八、数学常量
------------

``math`` 模块提供了一组常用常量：``pi``（圆周率）、``e``（自然常数）、``tau``（等于 ``2 * pi``）、``inf``（无穷大）、``nan``（非数）。``sys.float_info`` 则描述了当前平台浮点类型的边界。

.. code-block:: python

   import math
   import sys

   print("math.pi =", f"{math.pi:.10f}")
   print("math.e =", f"{math.e:.10f}")
   print("math.tau =", f"{math.tau:.10f}")
   print("tau 等于 2 * pi：", math.tau == 2 * math.pi)
   print("math.inf =", math.inf)
   print("math.nan =", math.nan)
   print("最大浮点数：", sys.float_info.max)
   print("最小精度：", sys.float_info.epsilon)

输出结果：

.. code-block:: text

   math.pi = 3.1415926536
   math.e = 2.7182818285
   math.tau = 6.2831853072
   tau 等于 2 * pi： True
   math.inf = inf
   math.nan = nan
   最大浮点数： 1.7976931348623157e+308
   最小精度： 2.220446049250313e-16

``epsilon`` 是“1.0 与比它大的最小浮点数之差”，常被用作浮点比较的容差基准。``tau`` 是整圈弧度，写 ``math.tau / 4`` 比 ``math.pi / 2`` 更直观，也更不容易算错。

九、数字格式化
--------------

f-string 的格式说明符写在冒号后面，语法是 ``[[填充]对齐][符号][宽度][,][.精度][类型]``。对齐符号 ``<``、``>``、``^`` 分别表示左对齐、右对齐、居中，宽度不足时用填充字符补齐（默认空格）。

常用的类型码：``d`` 十进制整数、``f`` 定点小数、``e`` 科学计数法、``%`` 百分比、``x`` / ``o`` / ``b`` 十六进制、八进制、二进制。

.. code-block:: python

   value = 1234.5678

   print(f"{value:.2f}")
   print(f"{value:,.2f}")
   print(f"{value:10.2f}|")
   print(f"{value:<12.2f}|")
   print(f"{value:>12.2f}|")
   print(f"{value:^12.2f}|")
   print(f"{0.256:.1%}")
   print(f"{1234567:.2e}")
   print(f"{1234567:,d}")
   print(f"{255:#x}", f"{255:#o}", f"{255:#b}")
   print(f"{42:08.2f}")
   print(format(3.14159, ".3f"))

输出结果：

.. code-block:: text

   1234.57
   1,234.57
      1234.57|
   1234.57     |
        1234.57|
     1234.57   |
   25.6%
   1.23e+06
   1,234,567
   0xff 0o377 0b11111111
   00042.00
   3.142

``.2f`` 会做四舍五入，但底层仍是二进制浮点，遇到 ``2.675`` 这类无法精确表示的值时可能得到 ``2.67``。金额格式化建议先用 ``Decimal`` 算好再输出。``f"{255:#x}"`` 中的 ``#`` 保留 ``0x`` 前缀，去掉它就只输出 ``ff``。

十、练习任务
------------

任务 1：用 ``Decimal`` 计算三年期存款的本息合计与利息，年利率 3.5%，结果保留两位小数。

.. code-block:: python

   from decimal import Decimal

   principal = Decimal("10000")
   rate = Decimal("0.035")
   amount = principal * (1 + rate) ** 3

   print("本息合计：", amount.quantize(Decimal("0.01")))
   print("利息：", (amount - principal).quantize(Decimal("0.01")))

输出结果：

.. code-block:: text

   本息合计： 11087.18
   利息： 1087.18

任务 2：已知三角形三边长 3、4、5，用 ``math`` 计算周长、面积和最小边对应的角度。

.. code-block:: python

   import math

   a, b, c = 3, 4, 5
   s = (a + b + c) / 2
   area = math.sqrt(s * (s - a) * (s - b) * (s - c))
   angle = math.degrees(math.acos((b * b + c * c - a * a) / (2 * b * c)))

   print("周长：", a + b + c)
   print("面积：", round(area, 2))
   print("最小边对应的角：", round(angle, 2), "度")

输出结果：

.. code-block:: text

   周长： 12
   面积： 6.0
   最小边对应的角： 36.87 度

任务 3：固定随机种子，模拟掷 600 次骰子，统计每个点数出现的次数。

.. code-block:: python

   import random
   from collections import Counter

   random.seed(7)
   rolls = [random.randint(1, 6) for _ in range(600)]
   counts = Counter(rolls)

   for face in range(1, 7):
       print(f"{face} 点：{counts[face]} 次")
   print("总次数：", sum(counts.values()))

输出结果：

.. code-block:: text

   1 点：107 次
   2 点：107 次
   3 点：93 次
   4 点：99 次
   5 点：109 次
   6 点：85 次
   总次数： 600
