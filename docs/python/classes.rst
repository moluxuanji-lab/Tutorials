Python 面向对象
===============

.. meta::
   :group: 进阶
   :summary: 从类与对象出发，掌握 __init__ 与 self、实例属性与类属性、方法、继承与 super()、多态、封装、property、类方法与静态方法、魔术方法、dataclass、抽象基类，以及组合优于继承的设计思路。

面向对象是把数据和操作数据的方法组织在一起的一种编程范式。类描述一类事物共有的属性和行为，对象则是这个类在运行时的具体实例。相比把一堆函数和字典散落在模块里，面向对象让“状态”和“操作状态的动作”待在同一个地方，边界更清晰，也更容易复用和扩展。

Python 的面向对象机制相当轻量：类本身就是对象，属性查找在运行时完成，封装更多依赖命名约定而不是访问修饰符。理解这些特点之后，就能写出既符合 Python 习惯、又不过度设计的代码。

本章从类与对象的基本写法开始，依次介绍初始化、属性、方法、继承、多态、封装、``property``、类方法与静态方法、魔术方法、``dataclass``、抽象基类，最后讨论为什么组合往往比继承更灵活。

一、类与对象
------------

类用 ``class`` 关键字定义，类体里可以写属性赋值和方法定义。使用 ``类名(参数)`` 创建对象的过程称为实例化，得到的对象拥有类中定义的全部能力。

下面定义一个表示宠物的类，并创建它的实例：

.. code-block:: python

   class Dog:
       def __init__(self, name, age):
           self.name = name
           self.age = age

       def bark(self):
           return f"{self.name} 在叫：汪！"


   dog = Dog("旺财", 3)
   print(dog.name, dog.age)
   print(dog.bark())
   print("类型：", type(dog).__name__)
   print("是 Dog 实例：", isinstance(dog, Dog))

输出结果：

.. code-block:: text

   旺财 3
   旺财 在叫：汪！
   类型： Dog
   是 Dog 实例： True

``type()`` 返回对象所属的类，``isinstance()`` 则判断对象是否属于某个类或其子类。同一个类可以创建任意多个对象，每个对象各自保存一份实例属性，互不干扰。

类是对象，这一点在 Python 里同样成立：``Dog`` 本身是 ``type`` 的实例，可以像普通值一样赋值、放进列表，甚至动态添加属性。这种灵活性让框架和插件系统可以用很少的代码完成注册与分发。

二、__init__ 与 self
--------------------

``__init__()`` 是实例初始化方法，对象创建完成后由解释器自动调用，用来给实例属性赋初值。它不负责分配内存，也不返回对象本身，所以不应该写 ``return`` 返回值。

方法定义中的第一个参数习惯上命名为 ``self``，它代表调用该方法的实例。通过 ``对象.方法()`` 调用时，Python 会自动把对象作为第一个参数传进去；也可以写成 ``类名.方法(对象)`` 显式传入。

.. code-block:: python

   class Counter:
       def __init__(self, start=0):
           self.value = start

       def increment(self, step=1):
           self.value += step
           return self.value


   first = Counter()
   second = Counter(10)

   print(first.increment())
   print(first.increment(5))
   print(second.increment(2))
   print("first.value：", first.value)
   print("second.value：", second.value)
   print("显式传入 self：", Counter.increment(second, 1))
   print("两个实例相互独立：", first is not second)

输出结果：

.. code-block:: text

   1
   6
   12
   first.value： 6
   second.value： 12
   显式传入 self： 13
   两个实例相互独立： True

``self`` 不是关键字，只是约定俗成的名字，改成 ``this`` 程序照样能跑，但会破坏所有人的阅读习惯。真正重要的是位置：它必须是实例方法的第一个参数，调用时由解释器自动绑定。

``__init__()`` 的参数在实例化时传入，因此可以把创建对象必需的初始状态都收在这里，并顺带做校验。需要更灵活的构造方式时，通常再配合类方法提供替代构造器。

三、实例属性与类属性
--------------------

属性分两类：写在 ``__init__()`` 里、通过 ``self.xxx`` 赋值的是实例属性，每个对象各有一份；直接写在类体里的是类属性，所有实例共享同一份。

下面的例子用类属性统计员工人数，用实例属性保存个人信息：

.. code-block:: python

   class Employee:
       company = "星海科技"
       headcount = 0

       def __init__(self, name, salary):
           self.name = name
           self.salary = salary
           Employee.headcount += 1

       def profile(self):
           return f"{self.name} @ {self.company}，月薪 {self.salary}"


   a = Employee("小明", 12000)
   b = Employee("小红", 15000)

   print(a.profile())
   print(b.profile())
   print("员工人数：", Employee.headcount)
   print("实例属性：", sorted(a.__dict__))
   print("类中有 company：", "company" in Employee.__dict__)
   print("实例读到 company：", a.company)

   Employee.company = "云图科技"
   print("修改类属性：", a.profile())

   a.salary = 13000
   print("修改实例属性：", a.salary, b.salary)

   a.company = "自营"
   print("遮蔽类属性：", a.company, b.company, Employee.company)
   print("a 的实例属性：", sorted(a.__dict__))

输出结果：

.. code-block:: text

   小明 @ 星海科技，月薪 12000
   小红 @ 星海科技，月薪 15000
   员工人数： 2
   实例属性： ['name', 'salary']
   类中有 company： True
   实例读到 company： 星海科技
   修改类属性： 小明 @ 云图科技，月薪 12000
   修改实例属性： 13000 15000
   遮蔽类属性： 自营 云图科技 云图科技
   a 的实例属性： ['company', 'name', 'salary']

``headcount`` 必须写成 ``Employee.headcount += 1``，如果写成 ``self.headcount += 1``，第一次自增就会在实例上新建属性，类属性永远停在 0。同理，``a.company = "自营"`` 并不会修改类属性，只是在 ``a`` 的实例字典里新增一个同名条目，之后 ``a.company`` 读到的就是实例属性。

经验法则是：描述“每个对象各自不同”的数据放实例属性，描述“整类共享”的常量或计数器放类属性。可变对象（列表、字典）尽量不要直接做类属性，否则所有实例会共用同一个容器。

四、方法
--------

方法是定义在类中、第一个参数为 ``self`` 的函数。它可以读取和修改实例状态，也可以调用同一个对象上的其他方法。把业务规则封装在方法里，调用方只需要表达意图，不必关心里面的校验和记账细节。

.. code-block:: python

   class BankAccount:
       def __init__(self, owner, balance=0):
           self.owner = owner
           self.balance = balance
           self.history = []

       def deposit(self, amount):
           if amount <= 0:
               raise ValueError("存款金额必须为正数")
           self.balance += amount
           self.history.append(("存入", amount))
           return self.balance

       def withdraw(self, amount):
           if amount > self.balance:
               raise ValueError("余额不足")
           self.balance -= amount
           self.history.append(("取出", amount))
           return self.balance

       def statement(self):
           lines = [f"{self.owner} 的交易记录"]
           for action, amount in self.history:
               lines.append(f"  {action} {amount}")
           lines.append(f"  余额 {self.balance}")
           return "\n".join(lines)


   account = BankAccount("小明", 100)
   account.deposit(200)
   account.withdraw(50)
   print(account.statement())

   try:
       account.withdraw(1000)
   except ValueError as error:
       print("操作失败：", error)

   print("余额仍为：", account.balance)

输出结果：

.. code-block:: text

   小明 的交易记录
     存入 200
     取出 50
     余额 250
   操作失败： 余额不足
   余额仍为： 250

方法内部用 ``self.history`` 访问的是当前对象自己的列表，所以两个账户的交易记录不会混在一起。校验失败时直接抛异常，而不是返回错误码，调用方可以用 ``try`` / ``except`` 统一处理，正常路径的返回值也就保持干净。

五、继承与 super()
------------------

继承通过在类名后面的圆括号里写父类实现，子类自动获得父类的属性和方法，并可以重写其中一部分。``super()`` 用于调用父类的实现，最常见的场景是在子类 ``__init__()`` 中先完成父类的初始化，再补充自己的字段。

.. code-block:: python

   class Animal:
       def __init__(self, name):
           self.name = name

       def speak(self):
           return "发出声音"

       def introduce(self):
           return f"我是 {self.name}，{self.speak()}"


   class Dog(Animal):
       def __init__(self, name, breed):
           super().__init__(name)
           self.breed = breed

       def speak(self):
           return "汪汪"


   class Cat(Animal):
       def speak(self):
           return "喵喵"


   for pet in [Dog("旺财", "柴犬"), Cat("咪咪")]:
       print(pet.introduce())

   print("Dog 的 MRO：", [cls.__name__ for cls in Dog.__mro__])
   print("isinstance：", isinstance(Dog("阿黄", "中华田园犬"), Animal))

输出结果：

.. code-block:: text

   我是 旺财，汪汪
   我是 咪咪，喵喵
   Dog 的 MRO： ['Dog', 'Animal', 'object']
   isinstance： True

``introduce()`` 只定义在父类里，却调用了 ``self.speak()``，运行时实际执行的是子类重写后的版本。``Dog.__mro__`` 展示方法解析顺序：查找一个属性时按 ``Dog``、``Animal``、``object`` 的顺序依次搜索，这也是多继承时决定“用哪份实现”的依据。

子类不应随意修改父类的私有属性，也不要在父类构造完成前使用子类字段。需要扩展父类行为时，优先在重写的方法里调用 ``super().方法()``，把公共部分留给父类。

六、多态
--------

多态指同一段调用代码可以作用于不同类型的对象，具体执行哪个实现由对象的实际类型决定。Python 不要求这些类型共享同一个父类，只要它们提供同名方法即可，这种风格常被称为“鸭子类型”。

.. code-block:: python

   class Shape:
       def area(self):
           raise NotImplementedError

       def describe(self):
           return f"{type(self).__name__} 的面积是 {self.area():.2f}"


   class Rectangle(Shape):
       def __init__(self, width, height):
           self.width = width
           self.height = height

       def area(self):
           return self.width * self.height


   class Circle(Shape):
       def __init__(self, radius):
           self.radius = radius

       def area(self):
           return 3.14159 * self.radius ** 2


   shapes = [Rectangle(3, 4), Circle(2), Rectangle(5, 5)]
   for shape in shapes:
       print(shape.describe())

   print("总面积：", round(sum(shape.area() for shape in shapes), 2))

输出结果：

.. code-block:: text

   Rectangle 的面积是 12.00
   Circle 的面积是 12.57
   Rectangle 的面积是 25.00
   总面积： 49.57

循环里只写了 ``shape.describe()``，既没有 ``if`` 判断类型，也不需要知道列表里装的是圆还是矩形。新增一种图形时，只要实现 ``area()``，原有代码一行都不用改，这就是多态带来的可扩展性。

``describe()`` 里使用 ``{self.area():.2f}`` 把结果格式化为两位小数。浮点数参与格式化时仍可能有细微误差，涉及金额等精确场景应改用 ``decimal.Decimal``。

七、封装与私有属性
------------------

封装的目标是隐藏内部实现，只暴露稳定的接口。Python 没有严格的访问修饰符，而是用命名约定表达意图：

* 单下划线开头（``_balance``）表示“内部使用”，是给阅读者的提示，解释器不会阻止访问。
* 双下划线开头（``__pin``）会触发名称改写，属性在类外变成 ``_类名__pin``，用于避免子类意外覆盖。

.. code-block:: python

   class Account:
       def __init__(self, owner, balance):
           self.owner = owner
           self._balance = balance
           self.__pin = "1234"

       def check_pin(self, pin):
           return pin == self.__pin

       def masked_pin(self):
           return "*" * len(self.__pin)


   account = Account("小明", 500)
   print("公开属性：", account.owner)
   print("约定保护属性：", account._balance)
   print("PIN 校验：", account.check_pin("1234"))
   print("掩码显示：", account.masked_pin())

   try:
       print(account.__pin)
   except AttributeError as error:
       print("直接访问失败：", type(error).__name__)

   print("名称改写后的键：", [key for key in account.__dict__ if "pin" in key])
   print("通过改写名访问：", account._Account__pin)

输出结果：

.. code-block:: text

   公开属性： 小明
   约定保护属性： 500
   PIN 校验： True
   掩码显示： ****
   直接访问失败： AttributeError
   名称改写后的键： ['_Account__pin']
   通过改写名访问： 1234

名称改写不是加密，知道规则的人仍然可以用 ``_Account__pin`` 读到它。它的真正价值在于减少命名冲突，并明确告诉使用者“不要碰这里”。对外接口应该通过方法暴露，例如上面的 ``check_pin()`` 和 ``masked_pin()``，这样内部结构变化时调用方不受影响。

八、property
------------

``property`` 把方法包装成属性访问，让调用方写 ``obj.value`` 而不是 ``obj.value()``，同时还能在赋值时执行校验。它适合“读取时需要计算”或“写入时必须检查”的字段。

.. code-block:: python

   class Temperature:
       def __init__(self, celsius=0):
           self.celsius = celsius

       @property
       def celsius(self):
           return self._celsius

       @celsius.setter
       def celsius(self, value):
           if value < -273.15:
               raise ValueError("温度不能低于绝对零度")
           self._celsius = value

       @property
       def fahrenheit(self):
           return self._celsius * 9 / 5 + 32


   t = Temperature(25)
   print("摄氏：", t.celsius)
   print("华氏：", round(t.fahrenheit, 1))

   t.celsius = 37
   print("修改后摄氏：", t.celsius)
   print("修改后华氏：", round(t.fahrenheit, 1))

   try:
       t.celsius = -300
   except ValueError as error:
       print("赋值失败：", error)

   print("温度保持不变：", t.celsius)
   print("fahrenheit 是只读属性：", isinstance(Temperature.fahrenheit, property))

输出结果：

.. code-block:: text

   摄氏： 25
   华氏： 77.0
   修改后摄氏： 37
   修改后华氏： 98.6
   赋值失败： 温度不能低于绝对零度
   温度保持不变： 37
   fahrenheit 是只读属性： True

``@property`` 定义 getter，``@celsius.setter`` 定义 setter。``fahrenheit`` 只写了 getter，没有 setter，因此是只读的，尝试赋值会抛 ``AttributeError``。真正存储数据的 ``_celsius`` 只作为内部字段存在，外部统一通过 ``celsius`` 读写，校验逻辑就永远不会被绕过。

九、类方法与静态方法
--------------------

除了实例方法，类还可以定义类方法和静态方法：

.. csv-table::
   :header: "类型", "定义方式", "第一个参数", "典型用途"

   "实例方法", "``def method(self)``", "``self``", "读写实例状态"
   "类方法", "``@classmethod``", "``cls``", "替代构造器、访问类状态"
   "静态方法", "``@staticmethod``", "没有约定", "与类相关但不需要实例的工具函数"

类方法的 ``cls`` 指向调用它的类，因此可以用于实现替代构造器；静态方法既不接收实例也不接收类，本质上是挂在类命名空间里的普通函数：

.. code-block:: python

   class Date:
       def __init__(self, year, month, day):
           self.year = year
           self.month = month
           self.day = day

       def __str__(self):
           return f"{self.year:04d}-{self.month:02d}-{self.day:02d}"

       @classmethod
       def from_string(cls, text):
           year, month, day = (int(part) for part in text.split("-"))
           return cls(year, month, day)

       @classmethod
       def new_year(cls, year):
           return cls(year, 1, 1)

       @staticmethod
       def is_leap(year):
           return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


   d1 = Date.from_string("2024-03-15")
   d2 = Date.new_year(2025)
   print(d1)
   print(d2)
   print("2024 是闰年：", Date.is_leap(2024))
   print("1900 是闰年：", Date.is_leap(1900))
   print("类方法返回类型：", type(Date.from_string("2030-06-01")).__name__)

输出结果：

.. code-block:: text

   2024-03-15
   2025-01-01
   2024 是闰年： True
   1900 是闰年： False
   类方法返回类型： Date

``from_string()`` 使用 ``cls(...)`` 而不是硬编码 ``Date(...)``，这样被 ``Date`` 的子类调用时，返回的是子类实例，扩展性更好。``is_leap()`` 不需要任何实例或类状态，声明为静态方法比写成模块级函数更能说明它属于 ``Date`` 这个职责范围。

十、魔术方法
------------

以双下划线开头和结尾的方法称为魔术方法，它们由解释器在特定语法下自动调用。实现这些方法，可以让自定义对象像内置类型一样支持打印、求长度、比较、相加和遍历。

.. code-block:: python

   class Playlist:
       def __init__(self, name, songs):
           self.name = name
           self.songs = list(songs)

       def __str__(self):
           return f"歌单《{self.name}》，共 {len(self.songs)} 首"

       def __repr__(self):
           return f"Playlist(name={self.name!r}, songs={self.songs!r})"

       def __len__(self):
           return len(self.songs)

       def __eq__(self, other):
           if not isinstance(other, Playlist):
               return NotImplemented
           return self.songs == other.songs

       def __add__(self, other):
           return Playlist(f"{self.name}+{other.name}", self.songs + other.songs)

       def __iter__(self):
           return iter(self.songs)


   a = Playlist("通勤", ["晴天", "稻香"])
   b = Playlist("夜晚", ["夜曲"])

   print(a)
   print(repr(b))
   print("歌曲数：", len(a))
   print("内容相同则相等：", a == Playlist("通勤", ["晴天", "稻香"]))
   print("内容不同则不等：", a == b)

   combined = a + b
   print(combined)
   for song in combined:
       print("播放：", song)

输出结果：

.. code-block:: text

   歌单《通勤》，共 2 首
   Playlist(name='夜晚', songs=['夜曲'])
   歌曲数： 2
   内容相同则相等： True
   内容不同则不等： False
   歌单《通勤+夜晚》，共 3 首
   播放： 晴天
   播放： 稻香
   播放： 夜曲

``__str__()`` 面向最终用户，``__repr__()`` 面向开发者，后者应尽量给出可以重建对象的表达式。``__eq__()`` 遇到无关类型时返回 ``NotImplemented``，让 Python 有机会尝试对方的比较方法，而不是直接判定为不相等。实现了 ``__eq__()`` 之后，对象默认不再可哈希，如果还要放进集合或作为字典键，需要额外定义 ``__hash__()``。

十一、dataclass
---------------

很多类的主要工作只是保存若干字段，``__init__()``、``__repr__()``、``__eq__()`` 都是重复的样板代码。标准库的 ``dataclass`` 装饰器可以根据字段注解自动生成这些方法：

.. code-block:: python

   from dataclasses import dataclass, field, asdict


   @dataclass
   class Book:
       title: str
       price: float
       tags: list = field(default_factory=list)

       def discounted(self, rate=0.9):
           return round(self.price * rate, 2)


   @dataclass(frozen=True)
   class Point:
       x: int
       y: int


   book = Book("Python 进阶", 89.0)
   book.tags.append("编程")
   print(book)
   print("打折价：", book.discounted())
   print("转成字典：", asdict(book))

   other = Book("Python 进阶", 89.0, ["编程"])
   print("默认比较字段：", book == other)

   p = Point(1, 2)
   print(p)
   try:
       p.x = 10
   except Exception as error:
       print("冻结实例不可修改：", type(error).__name__)

输出结果：

.. code-block:: text

   Book(title='Python 进阶', price=89.0, tags=['编程'])
   打折价： 80.1
   转成字典： {'title': 'Python 进阶', 'price': 89.0, 'tags': ['编程']}
   默认比较字段： True
   Point(x=1, y=2)
   冻结实例不可修改： FrozenInstanceError

可变默认值必须用 ``field(default_factory=list)``，直接写 ``tags: list = []`` 会让所有实例共享同一个列表，这与函数默认参数的陷阱是同一个原因。``frozen=True`` 生成不可变实例，适合做值对象、配置项或字典的键。

十二、抽象基类简介
------------------

抽象基类用于定义接口：它声明子类必须实现哪些方法，自身不能被实例化。标准库的 ``abc`` 模块提供 ``ABC`` 基类和 ``@abstractmethod`` 装饰器：

.. code-block:: python

   from abc import ABC, abstractmethod


   class Storage(ABC):
       @abstractmethod
       def save(self, key, value):
           raise NotImplementedError

       @abstractmethod
       def load(self, key):
           raise NotImplementedError

       def describe(self):
           return f"{type(self).__name__} 已就绪"


   class MemoryStorage(Storage):
       def __init__(self):
           self.data = {}

       def save(self, key, value):
           self.data[key] = value

       def load(self, key):
           return self.data.get(key)


   try:
       Storage()
   except TypeError as error:
       print("抽象类不能实例化：", type(error).__name__)

   store = MemoryStorage()
   store.save("name", "小明")
   print(store.describe())
   print("读取：", store.load("name"))
   print("缺失的键：", store.load("age"))
   print("剩余抽象方法：", MemoryStorage.__abstractmethods__)

输出结果：

.. code-block:: text

   抽象类不能实例化： TypeError
   MemoryStorage 已就绪
   读取： 小明
   缺失的键： None
   剩余抽象方法： frozenset()

只要还有一个抽象方法没实现，子类就无法实例化，错误会在创建对象时立刻暴露，而不是等到调用某个方法才出现。抽象基类适合团队协作中约定接口，也适合配合 ``isinstance()`` 做基于协议的运行时检查；如果只是想让类型检查器满意，``typing.Protocol`` 往往是更轻量的选择。

十三、组合优于继承
------------------

继承表达“是一种”（is-a）的关系，组合表达“有一个”（has-a）的关系。现实中的对象往往由多个独立部件构成，用组合把职责拆开，比拉长继承链更容易替换和测试。

.. code-block:: python

   class Engine:
       def __init__(self, power):
           self.power = power

       def start(self):
           return f"{self.power} 马力发动机启动"


   class Wheels:
       def __init__(self, count):
           self.count = count

       def roll(self):
           return f"{self.count} 个车轮开始转动"


   class Car:
       def __init__(self, name, power, wheel_count=4):
           self.name = name
           self.engine = Engine(power)
           self.wheels = Wheels(wheel_count)

       def start(self):
           return f"{self.name}：" + self.engine.start() + "，" + self.wheels.roll()


   class ElectricCar:
       def __init__(self, name, battery):
           self.name = name
           self.battery = battery

       def start(self):
           return f"{self.name}：电池 {self.battery} kWh，电机静音启动"


   for vehicle in [Car("家用轿车", 150), ElectricCar("电动车", 60)]:
       print(vehicle.start())

   car = Car("越野车", 200, 4)
   print("发动机类型：", type(car.engine).__name__)
   print("车轮数量：", car.wheels.count)

输出结果：

.. code-block:: text

   家用轿车：150 马力发动机启动，4 个车轮开始转动
   电动车：电池 60 kWh，电机静音启动
   发动机类型： Engine
   车轮数量： 4

如果改用继承，``ElectricCar`` 会被迫继承用不上的 ``Engine``，还得重写一堆方法；而组合让 ``Car`` 持有一个发动机对象，替换成电动引擎时只需换掉部件，``Car`` 的其余代码保持不变。判断标准很简单：子类确实是父类的一种特例时才用继承，否则优先把对方作为属性持有。

十四、练习任务
--------------

任务 1：写一个商品类，用 ``property`` 校验价格必须大于 0，并实现 ``__str__()`` 与 ``__eq__()``。

.. code-block:: python

   class Product:
       def __init__(self, name, price, stock=0):
           self.name = name
           self.price = price
           self.stock = stock

       @property
       def price(self):
           return self._price

       @price.setter
       def price(self, value):
           if value <= 0:
               raise ValueError("价格必须大于 0")
           self._price = value

       def __str__(self):
           return f"{self.name}：{self.price} 元，库存 {self.stock}"

       def __eq__(self, other):
           if not isinstance(other, Product):
               return NotImplemented
           return self.name == other.name and self.price == other.price


   items = [Product("键盘", 299), Product("鼠标", 129, 10)]
   for item in items:
       print(item)

   try:
       Product("显示器", -1)
   except ValueError as error:
       print("创建失败：", error)

   print("同名同价相等：", Product("键盘", 299) == items[0])

输出结果：

.. code-block:: text

   键盘：299 元，库存 0
   鼠标：129 元，库存 10
   创建失败： 价格必须大于 0
   同名同价相等： True

任务 2：用继承和 ``super()`` 实现员工、经理、实习生三类对象，并让同一段循环分别计算他们的薪资。

.. code-block:: python

   class Employee:
       def __init__(self, name, base_salary):
           self.name = name
           self.base_salary = base_salary

       def salary(self):
           return self.base_salary

       def __str__(self):
           return f"{self.name}（{type(self).__name__}）：{self.salary()} 元"


   class Manager(Employee):
       def __init__(self, name, base_salary, bonus):
           super().__init__(name, base_salary)
           self.bonus = bonus

       def salary(self):
           return self.base_salary + self.bonus


   class Intern(Employee):
       def salary(self):
           return round(self.base_salary * 0.8)


   staff = [Employee("小明", 8000), Manager("小红", 12000, 3000), Intern("小刚", 5000)]
   for person in staff:
       print(person)
   print("总支出：", sum(person.salary() for person in staff))

输出结果：

.. code-block:: text

   小明（Employee）：8000 元
   小红（Manager）：15000 元
   小刚（Intern）：4000 元
   总支出： 27000

任务 3：用 ``dataclass`` 表示学生，统计平均分，并按平均分从高到低输出。

.. code-block:: python

   from dataclasses import dataclass, field


   @dataclass
   class Student:
       name: str
       scores: list = field(default_factory=list)

       @property
       def average(self):
           if not self.scores:
               return 0.0
           return round(sum(self.scores) / len(self.scores), 1)

       def __len__(self):
           return len(self.scores)


   students = [
       Student("小明", [90, 85, 88]),
       Student("小红", [95, 92, 99]),
       Student("小刚", []),
   ]

   for student in sorted(students, key=lambda item: item.average, reverse=True):
       print(f"{student.name} 平均分 {student.average}，共 {len(student)} 门")

   print("最高平均分：", max(student.average for student in students))

输出结果：

.. code-block:: text

   小红 平均分 95.3，共 3 门
   小明 平均分 87.7，共 3 门
   小刚 平均分 0.0，共 0 门
   最高平均分： 95.3
