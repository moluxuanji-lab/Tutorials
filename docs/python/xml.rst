Python XML 解析
================

.. meta::
   :group: 标准库与实战
   :summary: 理解 XML 的结构与常见解析模型，使用 ElementTree 解析、查找、修改和生成 XML，了解 SAX 事件驱动解析、DOM 树模型以及处理不可信 XML 时的安全注意事项。

XML（eXtensible Markup Language，可扩展标记语言）用标签描述数据的结构，既能表达层级关系，又能携带属性，长期用于配置文件、数据交换和文档格式。Python 标准库自带多种 XML 解析方式，其中最常用的是 ``xml.etree.ElementTree``。

一、XML 的基本结构
------------------

一个 XML 文档由声明、元素、属性和文本组成。元素可以嵌套，形成一棵树；每个文档只有一个根元素：

.. code-block:: text

   <?xml version="1.0" encoding="UTF-8"?>
   <collection shelf="New Arrivals">
     <movie title="Enemy Behind">
       <type>War, Thriller</type>
       <year>2003</year>
     </movie>
   </collection>

``collection`` 是根元素，``shelf`` 是它的属性；``movie`` 是子元素，``title`` 是 ``movie`` 的属性；``<type>`` 与 ``<year>`` 之间的文字是文本内容。属性适合放简短的标识信息，需要表达结构化内容时应当使用子元素。

二、Python 的三种解析方式
------------------------

Python 处理 XML 有三条常见路线：

.. csv-table::
   :header: "方式", "模型", "适用场景"

   "ElementTree", "轻量树模型", "读取配置、提取字段、生成 XML，绝大多数场景首选"
   "SAX", "事件驱动", "超大型文件，边读边处理，不需要把整棵树放进内存"
   "DOM", "完整树模型", "需要随机访问、修改节点，或沿用 W3C DOM 的习惯"

``ElementTree`` 位于标准库 ``xml.etree`` 中，接口简洁、性能好，本章以它为主线。SAX 与 DOM 分别位于 ``xml.sax`` 和 ``xml.dom.minidom``。

本章使用下面这份 ``movies.xml`` 作为示例数据。示例按顺序运行，第一段代码会在当前目录创建 ``movies.xml``，后续示例与练习都读取这个文件；读完后可以手动删除：

.. code-block:: python

   import os

   MOVIES = """<?xml version="1.0" encoding="UTF-8"?>
   <collection shelf="New Arrivals">
     <movie title="Enemy Behind">
       <type>War, Thriller</type>
       <format>DVD</format>
       <year>2003</year>
       <rating>PG</rating>
       <stars>10</stars>
       <description>Talk about a US-Japan war</description>
     </movie>
     <movie title="Transformers">
       <type>Anime, Science Fiction</type>
       <format>DVD</format>
       <year>1989</year>
       <rating>R</rating>
       <stars>8</stars>
       <description>A scientific fiction</description>
     </movie>
     <movie title="Trigun">
       <type>Anime, Action</type>
       <format>DVD</format>
       <episodes>4</episodes>
       <rating>PG</rating>
       <stars>10</stars>
       <description>Vash the Stampede!</description>
     </movie>
     <movie title="Ishtar">
       <type>Comedy</type>
       <format>VHS</format>
       <rating>PG</rating>
       <stars>2</stars>
       <description>Viewable boredom</description>
     </movie>
   </collection>
   """

   with open("movies.xml", "w", encoding="utf-8") as file:
       file.write(MOVIES)

   print("示例文件： movies.xml")
   print("字节数：", os.path.getsize("movies.xml"))

输出结果：

.. code-block:: text

   示例文件： movies.xml
   字节数： 962

三、用 ElementTree 解析
------------------------

``ET.parse()`` 从文件读取并返回 ``ElementTree`` 对象，``getroot()`` 取得根元素。``ET.fromstring()`` 则直接解析字符串，适合处理网络响应或配置片段：

.. code-block:: python

   import xml.etree.ElementTree as ET

   tree = ET.parse("movies.xml")
   root = tree.getroot()

   print("根元素：", root.tag)
   print("根属性：", root.attrib)
   print("子元素数量：", len(root))

   for movie in root:
       print(movie.tag, movie.get("title"))

输出结果：

.. code-block:: text

   根元素： collection
   根属性： {'shelf': 'New Arrivals'}
   子元素数量： 4
   movie Enemy Behind
   movie Transformers
   movie Trigun
   movie Ishtar

``tag`` 是元素名，``attrib`` 是属性字典，``text`` 是元素自身的文本。直接迭代元素会得到全部直接子元素，不包含更深层的后代。

四、查找元素：find、findall 与 findtext
---------------------------------------

``find()`` 返回第一个匹配的子元素，``findall()`` 返回所有匹配项，``findtext()`` 直接取文本。路径写法支持 ``./``、``.//`` 和属性筛选：

.. code-block:: python

   import xml.etree.ElementTree as ET

   root = ET.parse("movies.xml").getroot()

   first = root.find("movie")
   print("第一部：", first.get("title"))

   titles = [movie.get("title") for movie in root.findall("movie")]
   print("全部标题：", titles)

   target = root.find("./movie[@title='Transformers']")
   print("年份：", target.findtext("year"))
   print("评分：", target.findtext("rating"))

   missing = root.find("./movie[@title='Trigun']/year")
   print("Trigun 的 year：", missing)

输出结果：

.. code-block:: text

   第一部： Enemy Behind
   全部标题： ['Enemy Behind', 'Transformers', 'Trigun', 'Ishtar']
   年份： 1989
   评分： R
   Trigun 的 year： None

``find()`` 找不到时返回 ``None``，``findtext()`` 找不到时返回默认值 ``None``。直接对 ``None`` 调用 ``.text`` 会触发 ``AttributeError``，因此读取可选字段时应当先判断或传入默认值。``Trigun`` 没有 ``year`` 元素，正好展示了这种情况。

``.//`` 表示递归查找任意层级的后代：

.. code-block:: python

   import xml.etree.ElementTree as ET

   root = ET.parse("movies.xml").getroot()

   years = [node.text for node in root.findall(".//year")]
   stars = [int(node.text) for node in root.findall(".//stars")]

   print("所有年份：", years)
   print("星级总数：", sum(stars))
   print("星级平均：", sum(stars) / len(stars))

输出结果：

.. code-block:: text

   所有年份： ['2003', '1989']
   星级总数： 30
   星级平均： 7.5

``findall()`` 返回列表，``iter()`` 返回迭代器，处理大文件时后者更省内存。``itertext()`` 可以取出元素及其后代的所有文本，适合提取纯文本内容。

五、修改节点并写回文件
----------------------

解析得到的是一棵可变树：修改 ``text``、``attrib``，增删子元素都会立即反映在内存中。``ElementTree.write()`` 负责把树序列化回文件。下面的示例把结果写入新文件，避免影响后续练习读取的原始数据：

.. code-block:: python

   import xml.etree.ElementTree as ET

   tree = ET.parse("movies.xml")
   root = tree.getroot()

   target = root.find("./movie[@title='Transformers']")
   target.set("checked", "yes")
   target.find("rating").text = "PG-13"
   target.find("description").text = "A science fiction classic"

   tree.write("movies_updated.xml", encoding="utf-8", xml_declaration=True)

   reloaded = ET.parse("movies_updated.xml").getroot()
   node = reloaded.find("./movie[@title='Transformers']")
   print("属性：", node.attrib)
   print("评分：", node.findtext("rating"))
   print("简介：", node.findtext("description"))

输出结果：

.. code-block:: text

   属性： {'title': 'Transformers', 'checked': 'yes'}
   评分： PG-13
   简介： A science fiction classic

``encoding="utf-8"`` 与 ``xml_declaration=True`` 一起使用，会在文件头写入正确的 XML 声明。省略编码时，``write()`` 默认使用 US-ASCII，中文内容可能被转义或报错。

六、从零构建 XML
----------------

``ET.Element()`` 创建元素，``ET.SubElement()`` 创建子元素，``ET.tostring()`` 把树转成字符串。构建时先搭骨架，再补文本和属性，比手写字符串更安全：

.. code-block:: python

   import xml.etree.ElementTree as ET

   catalog = ET.Element("catalog", {"updated": "2026-01-01"})

   books = [
       {"id": "1", "title": "Python 教程", "price": 59.0},
       {"id": "2", "title": "算法导论", "price": 128.0},
   ]

   for item in books:
       book = ET.SubElement(catalog, "book", {"id": item["id"]})
       ET.SubElement(book, "title").text = item["title"]
       ET.SubElement(book, "price").text = f"{item['price']:.1f}"

   print(ET.tostring(catalog, encoding="unicode"))

输出结果：

.. code-block:: text

   <catalog updated="2026-01-01"><book id="1"><title>Python 教程</title><price>59.0</price></book><book id="2"><title>算法导论</title><price>128.0</price></book></catalog>

``ET.indent()`` 可以为树补上缩进，让输出更易读。``ET.tostring()`` 不会自动转义已经正确构造的文本，但会转义 ``<``、``>``、``&`` 等特殊字符，这正是用 API 构建而不是拼接字符串的价值。

.. code-block:: python

   import xml.etree.ElementTree as ET

   root = ET.Element("note")
   ET.SubElement(root, "text").text = "1 < 2 & 3 > 2"
   ET.indent(root, space="  ")

   print(ET.tostring(root, encoding="unicode"))

输出结果：

.. code-block:: text

   <note>
     <text>1 &lt; 2 &amp; 3 &gt; 2</text>
   </note>

七、命名空间
------------

XML 命名空间用 ``xmlns`` 声明，用来区分不同来源的同名标签。ElementTree 会把命名空间展开成 ``{URI}标签名`` 的形式，查找时也必须写完整：

.. code-block:: python

   import xml.etree.ElementTree as ET

   text = """<root xmlns:h="http://example.com/html">
     <h:item id="1">第一项</h:item>
     <h:item id="2">第二项</h:item>
   </root>"""

   root = ET.fromstring(text)
   for item in root:
       print("标签：", item.tag)
       print("内容：", item.text, "编号：", item.get("id"))

输出结果：

.. code-block:: text

   标签： {http://example.com/html}item
   内容： 第一项 编号： 1
   标签： {http://example.com/html}item
   内容： 第二项 编号： 2

查找时可以用 ``findall("{http://example.com/html}item")``，也可以把前缀映射传给 ``findall("h:item", namespaces={"h": "http://example.com/html"})``。生成 XML 时，用 ``ET.register_namespace("h", uri)`` 可以避免序列化出 ``ns0`` 这样的自动前缀。

八、SAX：事件驱动解析
--------------------

SAX 不构建整棵树，而是在遇到开始标签、结束标签、文本时触发回调。它适合几百 MB 以上的文件：内存占用与文件大小无关，但只能顺序读取，无法回头修改。

.. code-block:: python

   import xml.sax

   class MovieHandler(xml.sax.ContentHandler):
       def __init__(self):
           self.titles = []
           self.current = None

       def startElement(self, name, attrs):
           if name == "movie":
               self.titles.append(attrs.get("title"))
           self.current = name

       def characters(self, content):
           if self.current == "year" and content.strip():
               print("年份文本：", content.strip())

       def endElement(self, name):
           self.current = None

   handler = MovieHandler()
   with open("movies.xml", encoding="utf-8") as file:
       content = file.read()
   xml.sax.parseString(content.encode("utf-8"), handler)
   print("电影标题：", handler.titles)

输出结果：

.. code-block:: text

   年份文本： 2003
   年份文本： 1989
   电影标题： ['Enemy Behind', 'Transformers', 'Trigun', 'Ishtar']

``characters()`` 可能被分多次调用，同一段文本不保证一次给全。需要拼接文本时，应当在 ``startElement`` 中清空缓冲区，在 ``characters`` 中追加，在 ``endElement`` 中统一处理。

九、DOM：把文档变成对象树
--------------------------

``xml.dom.minidom`` 实现了 W3C DOM 的一小部分接口，提供 ``getElementsByTagName()``、``childNodes``、``getAttribute()`` 等方法。它把整个文档读进内存，使用方便，但比 ElementTree 更重：

.. code-block:: python

   from xml.dom import minidom

   document = minidom.parse("movies.xml")
   print("根元素：", document.documentElement.tagName)
   print("电影数量：", len(document.getElementsByTagName("movie")))

   for node in document.getElementsByTagName("movie"):
       title = node.getAttribute("title")
       year = node.getElementsByTagName("year")
       value = year[0].firstChild.data if year else "未知"
       print(f"{title}：{value}")

输出结果：

.. code-block:: text

   根元素： collection
   电影数量： 4
   Enemy Behind：2003
   Transformers：1989
   Trigun：未知
   Ishtar：未知

DOM 的强项是随机访问和修改，例如删除节点、替换属性、调整顺序。若只是读取几个字段，ElementTree 更轻便，代码也更短。

十、安全提醒
------------

XML 支持实体定义，恶意文档可以借助实体递归展开耗尽内存（常被称为“十亿笑声”攻击），也可能读取本地文件（XXE）。``xml.etree.ElementTree`` 在较新版本中默认禁止外部实体，但面对来源不可控的 XML，仍应使用 ``defusedxml`` 这类专门加固的库，或者改用 JSON 等更简单的格式。

处理上传文件时还要限制大小，并在解析前做格式校验。不要把解析异常直接回显给用户，错误信息里可能包含服务器路径。

十一、练习任务
--------------

任务 1：统计每部电影的名字与星级，并计算平均星级。

.. code-block:: python

   import xml.etree.ElementTree as ET

   root = ET.parse("movies.xml").getroot()
   total = 0
   for movie in root.findall("movie"):
       stars = int(movie.findtext("stars", "0"))
       total += stars
       print(f"{movie.get('title')}: {stars} 星")

   count = len(root.findall("movie"))
   print("平均星级：", total / count)

输出结果：

.. code-block:: text

   Enemy Behind: 10 星
   Transformers: 8 星
   Trigun: 10 星
   Ishtar: 2 星
   平均星级： 7.5

任务 2：筛出 2000 年之后（含 2000 年）的电影，输出标题与年份。

.. code-block:: python

   import xml.etree.ElementTree as ET

   root = ET.parse("movies.xml").getroot()
   for movie in root.findall("movie"):
       year = movie.findtext("year")
       if year and int(year) >= 2000:
           print(movie.get("title"), year)

输出结果：

.. code-block:: text

   Enemy Behind 2003

任务 3：把电影列表转换成字典，方便按标题查询年份和评分。

.. code-block:: python

   import xml.etree.ElementTree as ET

   root = ET.parse("movies.xml").getroot()
   movies = {
       movie.get("title"): {
           "year": movie.findtext("year", "未知"),
           "rating": movie.findtext("rating", "未分级"),
       }
       for movie in root.findall("movie")
   }

   print(movies["Transformers"])
   print(movies["Trigun"])

输出结果：

.. code-block:: text

   {'year': '1989', 'rating': 'R'}
   {'year': '未知', 'rating': 'PG'}

ElementTree 覆盖了大多数日常需求。下一章介绍 urllib，用它抓取网页、构造查询参数并处理 HTTP 错误。