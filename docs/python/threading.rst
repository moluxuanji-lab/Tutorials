Python 多线程
==============

.. meta::
   :group: 标准库与实战
   :summary: 理解线程与 GIL 的关系，掌握 Thread 的创建、start 与 join，守护线程、Lock、RLock、Event、Queue 的用法，以及 ThreadPoolExecutor 与 Future 的任务编排，并避开共享状态下的竞态问题。

线程是操作系统调度的最小单位，同一进程内的多个线程共享内存空间和文件描述符，因此切换成本低、数据传递方便。Python 的 ``threading`` 模块把这套能力封装成一套面向对象的接口：创建 ``Thread`` 对象、调用 ``start()`` 启动、调用 ``join()`` 等待结束，再配合锁、事件、队列等同步原语协调执行顺序。

多线程最适合 I/O 密集型任务：等待网络响应、读写磁盘、查询数据库时，线程会主动让出执行权，让其他线程继续工作。对于纯计算任务，Python 的全局解释器锁（GIL）会限制同一时刻只有一个线程执行字节码，多线程并不能带来真正的多核并行，这类场景应该改用 ``multiprocessing`` 或把计算下沉到 C 扩展。

本章的示例都使用固定输入，所有汇总结果都在 ``join()`` 之后由主线程打印，不依赖线程的调度顺序，也不打印耗时，因此每次运行的输出完全一致。示例不访问网络、不读写外部文件，可以直接复制运行。

一、线程与 GIL
---------------

GIL（Global Interpreter Lock）是 CPython 解释器内部的一把全局锁：任何线程执行 Python 字节码之前都必须先持有它。这意味着即使机器有 8 个核，一个进程里的多个线程也无法同时执行纯 Python 计算，它们在字节码层面是轮流运行的。

GIL 并不是时时刻刻都被持有。线程执行 ``time.sleep()``、``socket.recv()``、文件读写这类阻塞调用时会主动释放 GIL，等操作完成后再重新竞争，所以多线程抓取网页、批量请求接口仍然能获得数倍的加速。解释器默认每 5 毫秒检查一次是否需要切换线程，这个间隔可以用 ``sys.getswitchinterval()`` 读取。

.. code-block:: python

   import sys
   import threading

   print("主线程名称：", threading.current_thread().name)
   print("活动线程数：", threading.active_count())
   print("主线程是否存活：", threading.main_thread().is_alive())
   print("线程切换间隔（秒）：", sys.getswitchinterval())
   print("默认线程栈大小（字节）：", threading.stack_size())

输出结果：

.. code-block:: text

   主线程名称： MainThread
   活动线程数： 1
   主线程是否存活： True
   线程切换间隔（秒）： 0.005
   默认线程栈大小（字节）： 0

``threading.current_thread()`` 返回当前线程对象，主线程的名字固定是 ``MainThread``；``active_count()`` 统计当前存活的线程数量，程序刚启动时只有主线程一个。``stack_size()`` 返回 0 表示使用操作系统的默认栈大小，需要创建大量线程时才考虑手动调小。

Python 3.13 提供了实验性的自由线程构建（free-threading），编译时关闭 GIL 后可以用 ``sys._is_gil_enabled()`` 查看当前状态。常规发行版仍然带 GIL，因此“多线程做计算”这条路的性能上限并没有改变。判断该用线程还是进程，看任务是等待多还是计算多：等待多用线程，计算多用进程。

二、创建线程：Thread、start 与 join
------------------------------------

创建线程有两种写法：把函数传给 ``Thread(target=..., args=...)``，或者继承 ``Thread`` 并重写 ``run()``。前者适合简单的任务函数，后者适合需要保存状态、复用逻辑的场景。参数必须用 ``args`` 以元组形式传入，只传一个参数时别忘记逗号。

``start()`` 只是把线程标记为就绪并交给操作系统调度，它会立刻返回，不会等任务执行完；``join()`` 才是等待，调用它的线程会阻塞，直到目标线程结束。新手最常见的错误是只调用 ``start()`` 就继续往下走，结果主线程先打印了汇总结果，拿到一堆空值。

.. code-block:: python

   import threading

   collected = {}


   def collect(name, limit):
       collected[name] = sum(range(1, limit + 1))


   class SumThread(threading.Thread):
       def __init__(self, name, limit):
           super().__init__(name=name)
           self.limit = limit
           self.total = 0

       def run(self):
           self.total = sum(range(1, self.limit + 1))


   custom = SumThread("子类线程", 100)
   threads = [
       threading.Thread(target=collect, args=("函数线程", 10), name="func-1"),
       custom,
   ]

   for thread in threads:
       thread.start()
   for thread in threads:
       thread.join()

   print("函数线程结果：", collected["函数线程"])
   print("子类线程结果：", custom.total)
   print("全部结束：", all(not thread.is_alive() for thread in threads))
   print("子类线程名称：", custom.name)

输出结果：

.. code-block:: text

   函数线程结果： 55
   子类线程结果： 5050
   全部结束： True
   子类线程名称： 子类线程

两个线程各自把结果写进独立的槽位，主线程等到它们都结束后再统一读取，因此不存在“谁先谁后”的问题。如果让两个线程往同一个累加变量上写，就必须加锁，这正是后面几节要讨论的内容。

``join()`` 可以带 ``timeout`` 参数，超时后不再等待，但线程本身不会被终止，仍在后台运行。``is_alive()`` 用来判断线程是否还活着。线程一旦结束就不能再次 ``start()``，需要重跑只能新建对象。``threading.enumerate()`` 可以列出所有存活线程，排查“线程泄漏”时很有用。

三、守护线程 daemon
--------------------

线程分为前台线程和守护线程。前台线程（``daemon=False``，默认值）会阻止解释器退出：只要还有一个前台线程在运行，进程就会等它结束。守护线程（``daemon=True``）不阻止退出，主线程结束时它们被直接终止，既不执行清理代码，也不会刷新缓冲区。

守护线程适合做后台轮询、心跳上报、缓存刷新这类“主程序结束就该一起消失”的辅助工作。创建线程后、调用 ``start()`` 之前设置 ``daemon`` 属性，或者直接在构造函数里传 ``daemon=True``；线程一旦启动，再修改这个属性会抛 ``RuntimeError``。

.. code-block:: python

   import threading

   records = []
   gate = threading.Event()


   def background():
       gate.wait(5)
       records.append("后台线程完成")


   worker = threading.Thread(target=background, name="bg", daemon=True)
   worker.start()

   print("daemon 属性：", worker.daemon)
   print("主线程检查时是否存活：", worker.is_alive())
   print("共享记录：", records)

   # 主线程不调用 join，解释器退出时守护线程被直接终止

输出结果：

.. code-block:: text

   daemon 属性： True
   主线程检查时是否存活： True
   共享记录： []

守护线程因为可能被随时打断，绝不能用来写文件、提交事务或释放必须释放的资源——这些操作要么完整执行，要么根本不执行。需要保证收尾逻辑执行的场景，应该用前台线程加 ``join()``，或者用 ``atexit`` 注册退出钩子。

四、Lock：互斥锁
-----------------

当多个线程读改写同一个变量时，需要互斥锁保证“读—改—写”三步不被打断。``threading.Lock`` 有两种使用方式：手动 ``acquire()`` / ``release()``，或者用 ``with lock:`` 语句。推荐后者，它能在代码块抛异常时自动释放锁，避免死锁。

锁的保护范围要刚好覆盖共享数据的操作，范围太小起不到作用，范围太大又会让多线程退化成串行。另外，锁保护的是“访问同一份数据的全部代码路径”，如果某个线程忘了加锁，其他线程加得再认真也没用。

.. code-block:: python

   import threading

   count = 0
   lock = threading.Lock()


   def increase(times):
       global count
       for _ in range(times):
           with lock:
               count += 1


   threads = [threading.Thread(target=increase, args=(25000,)) for _ in range(4)]
   for thread in threads:
       thread.start()
   for thread in threads:
       thread.join()

   print("期望结果：", 4 * 25000)
   print("实际结果：", count)
   print("是否一致：", count == 100000)

输出结果：

.. code-block:: text

   期望结果： 100000
   实际结果： 100000
   是否一致： True

四个线程各做两万五千次自增，累计十万次，加锁后的结果与预期完全一致。如果去掉 ``with lock:``，结果通常会小于 100000，而且每次运行都不一样——``count += 1`` 在字节码层面是“读取、加一、写回”三条指令，线程可能在这三步之间被切换走。

``Lock`` 不可重入：同一个线程第二次调用 ``acquire()`` 会阻塞自己，形成死锁。``acquire(blocking=False)`` 或 ``acquire(timeout=...)`` 可以在拿不到锁时返回 ``False``，便于实现“尝试加锁、失败就跳过”的逻辑。锁的粒度应尽量小，尤其不要把 ``sleep``、网络请求这类耗时操作放进锁里。

五、RLock：可重入锁
-------------------

``RLock`` 是带计数器版本的锁：同一个线程可以多次获取，每获取一次计数加一，释放时计数减一，计数归零才真正释放。它解决的是“加锁的函数调用另一个同样加锁的函数”这种递归场景，用普通 ``Lock`` 会直接卡死。

RLock 只能被获取它的线程释放，其他线程释放会抛 ``RuntimeError``。它适合保护那些内部会互相调用的方法，比如一个类的多个公开方法都要加锁，而它们之间又会互相调用；如果代码结构本身可以避免嵌套加锁，用普通 ``Lock`` 更清晰，也更容易看出临界区范围。

.. code-block:: python

   import threading

   rlock = threading.RLock()
   plain = threading.Lock()
   records = []


   def enter(level):
       with rlock:
           records.append(f"进入第 {level} 层")
           if level < 3:
               enter(level + 1)
           records.append(f"离开第 {level} 层")


   enter(1)
   print("可重入锁递归结果：", " | ".join(records))

   first = plain.acquire(timeout=0.1)
   second = plain.acquire(timeout=0.1)
   print("普通 Lock 第一次获取：", first)
   print("同一线程再次获取：", second)
   plain.release()

输出结果：

.. code-block:: text

   可重入锁递归结果： 进入第 1 层 | 进入第 2 层 | 进入第 3 层 | 离开第 3 层 | 离开第 2 层 | 离开第 1 层
   普通 Lock 第一次获取： True
   同一线程再次获取： False

同样的递归换成普通 ``Lock``，第二次 ``with rlock`` 就会永久阻塞，程序只能靠外部超时或 Ctrl+C 结束。示例里用带超时的 ``acquire(timeout=0.1)`` 演示这一点：第一次返回 ``True``，第二次等满 0.1 秒后返回 ``False``，既说明了行为，又不会真的把程序挂死。

RLock 的计数必须严格配对释放，少释放一次，其他线程就永远拿不到锁；多释放一次会抛 ``RuntimeError``。``with`` 语句天然保证配对，所以即使在递归函数里，也应该坚持用 ``with`` 而不是手写 ``acquire`` / ``release``。

六、Event：线程间的事件通知
----------------------------

线程之间除了共享变量，还需要“等某个条件成立再继续”的协作方式。``threading.Event`` 内部维护一个布尔标志：``set()`` 把它设为真并唤醒所有等待者，``clear()`` 复位，``wait(timeout)`` 阻塞到标志为真或超时。

Event 适合“一次性通知”的场景：初始化完成、配置加载完毕、收到退出信号。它不传递数据，只传递“可以继续了”这个信号；需要连数据一起传，用 ``queue.Queue`` 更合适。``wait()`` 一定要带超时，否则上游线程崩溃时下游会永久阻塞。

.. code-block:: python

   import threading

   ready = threading.Event()
   buffer = []


   def producer():
       buffer.extend([3, 1, 4, 1, 5])
       ready.set()


   def consumer():
       ready.wait(timeout=2)
       print("收到数据：", buffer)
       print("排序后：", sorted(buffer))
       print("求和：", sum(buffer))


   worker = threading.Thread(target=producer, name="producer")
   watcher = threading.Thread(target=consumer, name="consumer")
   watcher.start()
   worker.start()
   worker.join()
   watcher.join()

   print("事件状态：", ready.is_set())
   print("缓冲区长度：", len(buffer))

输出结果：

.. code-block:: text

   收到数据： [3, 1, 4, 1, 5]
   排序后： [1, 1, 3, 4, 5]
   求和： 14
   事件状态： True
   缓冲区长度： 5

消费者先启动并停在 ``ready.wait()``，生产者填好数据后调用 ``set()``，消费者被唤醒，读到的是完整列表。即使线程调度顺序变化，输出也不会改变，因为“读数据”这个动作一定发生在“事件被设置”之后。

Event 的等待是一次性的：``wait()`` 返回后标志仍然为真，后续调用会立刻通过。需要周期性通知时，应在每轮结束后调用 ``clear()``，或者改用 ``Condition``。Python 3 的 Event 在 ``set()`` 之后调用 ``wait()`` 也会立即返回，不存在“通知丢失”的问题。

七、Queue：线程安全的队列
--------------------------

``queue.Queue`` 是标准库提供的线程安全队列，内部已经处理好加锁和条件变量：``put()`` 入队，``get()`` 出队，队列为空时 ``get()`` 会阻塞等待，达到上限时 ``put()`` 也会阻塞。它是生产者—消费者模型的首选工具，比手写锁加列表可靠得多。

除了先进先出的 ``Queue``，还有后进先出的 ``LifoQueue`` 和按优先级出队的 ``PriorityQueue``。``task_done()`` 与 ``join()`` 配合，可以等待队列里的任务全部处理完毕。多线程抓取、日志异步落盘、任务分发这类架构，核心都是这个模式。

.. code-block:: python

   import queue
   import threading

   tasks = queue.Queue()
   results = queue.Queue()
   stop = object()

   for number in [7, 11, 13, 17]:
       tasks.put(number)


   def worker():
       while True:
           item = tasks.get()
           try:
               if item is stop:
                   return
               results.put((item, item * item))
           finally:
               tasks.task_done()


   threads = [threading.Thread(target=worker, name=f"worker-{index}") for index in range(2)]
   for thread in threads:
       thread.start()
   for _ in threads:
       tasks.put(stop)
   for thread in threads:
       thread.join()

   pairs = []
   while not results.empty():
       pairs.append(results.get())

   for number, square in sorted(pairs):
       print(f"{number} 的平方： {square}")
   print("剩余任务：", tasks.qsize())

输出结果：

.. code-block:: text

   7 的平方： 49
   11 的平方： 121
   13 的平方： 169
   17 的平方： 289
   剩余任务： 0

每个消费者线程循环取任务，取到哨兵对象 ``stop`` 就退出，哨兵的数量与线程数一致，保证每个线程都能收到退出信号。结果先收进 ``results`` 队列，主线程 ``join()`` 之后再排序打印，所以输出顺序与线程调度无关。

不用哨兵也有办法：调用 ``tasks.join()`` 等所有任务被 ``task_done()`` 标记完成，再给每个线程发一个 ``None``，或者用 ``ThreadPoolExecutor`` 代替。注意 ``qsize()`` 只适合监控和调试，在多线程环境下它返回的只是瞬时值，不能用来做同步判断。

八、ThreadPoolExecutor 与 Future
---------------------------------

手动管理线程的创建和销毁比较繁琐。``concurrent.futures.ThreadPoolExecutor`` 提供了线程池：任务提交后由池内空闲线程执行，用 ``Future`` 对象表示“将来会有结果”。``submit()`` 提交单个任务，``map()`` 批量提交并按参数顺序返回结果。

``Future`` 的 ``result()`` 会阻塞到任务完成，任务内部抛出的异常会在调用 ``result()`` 时重新抛出；``exception()`` 用于查询异常，``done()`` 判断是否结束，``cancel()`` 尝试取消尚未开始的任务。``with`` 语句结束时会自动调用 ``shutdown(wait=True)``，等待所有已提交任务完成。

.. code-block:: python

   from concurrent.futures import ThreadPoolExecutor


   def parse(text):
       if text == "bad":
           raise ValueError("无法解析的输入")
       return int(text)


   inputs = ["12", "7", "bad", "25"]

   with ThreadPoolExecutor(max_workers=2) as executor:
       futures = [executor.submit(parse, item) for item in inputs]

   for item, future in zip(inputs, futures):
       try:
           print(item, "->", future.result())
       except ValueError as error:
           print(item, "-> 捕获异常：", error)

   with ThreadPoolExecutor(max_workers=2) as executor:
       squares = list(executor.map(lambda n: n * n, [1, 2, 3, 4]))

   print("map 结果：", squares)

输出结果：

.. code-block:: text

   12 -> 12
   7 -> 7
   bad -> 捕获异常： 无法解析的输入
   25 -> 25
   map 结果： [1, 4, 9, 16]

``max_workers`` 决定池内线程数，默认值是 CPU 核数与 4 中的较小值加上 4，I/O 密集任务可以适当调大，计算密集任务调大没有意义。``map()`` 返回的是生成器，结果顺序与输入顺序一致；``as_completed()`` 则按完成先后产出，顺序不确定，适合“谁先完成先处理谁”的场景。

任务里抛出的异常不会让程序崩溃，而是被 ``Future`` 捕获，直到有人调用 ``result()`` 才重新抛出。这既是优点也是坑：如果只提交任务却从不读取结果，异常就会被静默吞掉。线程池用完必须关闭，否则进程可能因为残留的工作线程而迟迟不退出。

九、多线程计算示例
-------------------

虽然 GIL 限制了纯计算的并行度，把大任务拆成若干分片交给线程处理仍然是常见写法：一来代码结构清晰，二来分片逻辑可以直接换到进程池上复用。下面的例子把 1 到 200000 求和拆成四段，每个线程算一段，主线程汇总。

分片边界最容易出错。示例用 ``index * (TOTAL // PARTS) + 1`` 作为起点、``(index + 1) * (TOTAL // PARTS)`` 作为终点，四段首尾相接且不重叠。如果写成 ``range(begin, end)``，每段末尾那个数就会被漏掉，汇总结果和公式对不上。

.. code-block:: python

   import threading

   TOTAL = 200000
   PARTS = 4
   CHUNK = TOTAL // PARTS

   partial = [0] * PARTS
   lock = threading.Lock()


   def sum_chunk(index):
       begin = index * CHUNK + 1
       end = (index + 1) * CHUNK
       local = sum(range(begin, end + 1))
       with lock:
           partial[index] = local


   threads = [threading.Thread(target=sum_chunk, args=(index,)) for index in range(PARTS)]
   for thread in threads:
       thread.start()
   for thread in threads:
       thread.join()

   total = sum(partial)
   expected = TOTAL * (TOTAL + 1) // 2

   print("分片结果：", partial)
   print("汇总结果：", total)
   print("公式校验：", expected)
   print("是否一致：", total == expected)

输出结果：

.. code-block:: text

   分片结果： [1250025000, 3750025000, 6250025000, 8750025000]
   汇总结果： 20000100000
   公式校验： 20000100000
   是否一致： True

每个线程只写自己下标对应的位置，互不干扰，加锁是为了演示共享列表的写法；即使不加锁，这份数据也不会出错，因为写入的是不同元素。汇总在 ``join()`` 之后进行，主线程看到的一定是全部线程写完的结果。

这段代码的耗时和单线程版本相差不大，因为 ``sum()`` 是 C 实现，GIL 并没有真正释放。要压榨多核，应该把 ``sum_chunk`` 改成独立函数交给 ``ProcessPoolExecutor``，通过序列化传递参数和结果；分片思路完全一样，只是把 ``Thread`` 换成 ``Process``。

十、线程安全的常见坑
---------------------

第一个坑是“读—改—写”不是原子操作。两个线程都读到旧值，各自加一，再分别写回，最终只增加了一次，这种现象叫丢失更新。GIL 只保证单条字节码不被抢占，不保证多条字节码组成的逻辑整体不被打断。

下面的示例用 ``threading.Barrier`` 强制复现这种交错：两个线程先读值，然后在栅栏处互相等待，等双方都读完再一起写回。这样每次运行都必然丢掉一次更新，把“偶发的生产事故”变成了可稳定复现的演示。

.. code-block:: python

   import threading

   state = {"value": 0}
   barrier = threading.Barrier(2)


   def unsafe_add():
       current = state["value"]
       barrier.wait()          # 两个线程都读完之后才允许写回
       state["value"] = current + 1


   threads = [threading.Thread(target=unsafe_add) for _ in range(2)]
   for thread in threads:
       thread.start()
   for thread in threads:
       thread.join()

   print("两个线程各加一次，期望：", 2)
   print("实际结果：", state["value"])
   print("是否丢失更新：", state["value"] == 1)

输出结果：

.. code-block:: text

   两个线程各加一次，期望： 2
   实际结果： 1
   是否丢失更新： True

修复办法是把“读、算、写”整体放进临界区，让这段逻辑变成互斥的。注意锁要保护数据的所有访问路径：只给写操作加锁、读操作不加锁，同样会读到中间状态。锁对象本身要在多个线程之间共享，每个线程各自 ``Lock()`` 等于没加锁。

.. code-block:: python

   import threading

   state = {"value": 0}
   lock = threading.Lock()


   def safe_add():
       with lock:
           current = state["value"]
           state["value"] = current + 1


   threads = [threading.Thread(target=safe_add) for _ in range(2)]
   for thread in threads:
       thread.start()
   for thread in threads:
       thread.join()

   print("加锁后结果：", state["value"])

   items = []


   def append_item(value):
       items.append(value)


   workers = [threading.Thread(target=append_item, args=(index,)) for index in range(5)]
   for worker in workers:
       worker.start()
   for worker in workers:
       worker.join()

   print("列表长度：", len(items), "元素集合：", sorted(items))

输出结果：

.. code-block:: text

   加锁后结果： 2
   列表长度： 5 元素集合： [0, 1, 2, 3, 4]

第二个坑是“检查后再操作”。先判断文件不存在再创建、先查余额再扣款，这两步之间可能被其他线程插入，结果两个线程都通过了检查。正确做法是把检查和修改合并到同一个临界区，或者用数据库的唯一约束、``setdefault()`` 这类原子接口兜底。

第三个坑是可变默认参数和全局缓存。多个线程同时往同一个字典里塞数据，虽然单个 ``[]`` 赋值在 CPython 下是原子的，但“先查再写”的组合不是。与其小心翼翼地给每处访问加锁，不如把共享状态收敛到一个线程里，其他线程通过 ``queue.Queue`` 发消息，这也是 ``asyncio`` 和多数服务端框架采用的思路。

十一、练习任务
--------------

任务 1：把一段文本切成两半，两个线程分别统计词频，最后合并并按出现次数降序输出。

.. code-block:: python

   import threading
   from collections import Counter

   text = "python threads share memory python threads need locks"
   words = text.split()
   half = len(words) // 2
   parts = [" ".join(words[:half]), " ".join(words[half:])]
   counters = [Counter(), Counter()]


   def count_words(index):
       counters[index].update(parts[index].split())


   threads = [threading.Thread(target=count_words, args=(index,)) for index in range(2)]
   for thread in threads:
       thread.start()
   for thread in threads:
       thread.join()

   total = counters[0] + counters[1]
   for word, times in sorted(total.items(), key=lambda item: (-item[1], item[0])):
       print(f"{word}: {times}")

输出结果：

.. code-block:: text

   python: 2
   threads: 2
   locks: 1
   memory: 1
   need: 1
   share: 1

任务 2：用线程池并发计算 5、10、20 的阶乘，按提交顺序输出结果并求和。

.. code-block:: python

   from concurrent.futures import ThreadPoolExecutor


   def factorial(number):
       result = 1
       for value in range(2, number + 1):
           result *= value
       return number, result


   with ThreadPoolExecutor(max_workers=3) as executor:
       results = list(executor.map(factorial, [5, 10, 20]))

   for number, value in results:
       print(f"{number}! = {value}")
   print("三项之和：", sum(value for _, value in results))

输出结果：

.. code-block:: text

   5! = 120
   10! = 3628800
   20! = 2432902008176640000
   三项之和： 2432902008180268920

任务 3：六个线程各自判断一个数字的奇偶，把结论写进共享字典，最后按原始顺序汇总。

.. code-block:: python

   import threading

   numbers = [17, 4, 23, 9, 12, 6]
   results = {}
   lock = threading.Lock()


   def classify(index, value):
       kind = "偶数" if value % 2 == 0 else "奇数"
       with lock:
           results[index] = (value, kind)


   threads = [
       threading.Thread(target=classify, args=(index, value))
       for index, value in enumerate(numbers)
   ]
   for thread in threads:
       thread.start()
   for thread in threads:
       thread.join()

   for index in sorted(results):
       value, kind = results[index]
       print(f"{value} 是{kind}")
   print("偶数个数：", sum(1 for _, kind in results.values() if kind == "偶数"))

输出结果：

.. code-block:: text

   17 是奇数
   4 是偶数
   23 是奇数
   9 是奇数
   12 是偶数
   6 是偶数
   偶数个数： 3
