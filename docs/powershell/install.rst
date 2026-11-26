PowerShell 安装
===============

.. meta::
   :group: 入门
   :summary: 在 Windows、Linux、macOS 上安装 PowerShell 7+，并完成版本验证与卸载。

PowerShell 自从 6.0 起实现了完全开源和跨平台（PowerShell Core / PowerShell 7+），可运行于 Windows、Linux 和 macOS。当前最新稳定版为 **PowerShell 7.6.6**（基于 .NET 10），本教程的示例均以 PowerShell 7.x 为准。

一、Windows 上安装 PowerShell 7+
--------------------------------

方法一：使用 MSI 安装包（推荐）
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. 打开 PowerShell 官方 GitHub 发布页：`PowerShell Releases <https://github.com/PowerShell/PowerShell/releases>`_
2. 找到最新版本，下载适用于 Windows 的 ``.msi`` 安装包。
3. 双击安装，使用默认路径安装即可。
4. 安装完成后，搜索 **“PowerShell 7”** 打开即可（不会覆盖 Windows PowerShell）。

方法二：使用命令行（Winget）
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

适用于 Windows 10/11 且已安装 Windows 包管理器：

.. code-block:: powershell

   winget install --id Microsoft.Powershell --source winget

可选参数：``--silent`` 表示静默安装，``--version 7.6.6`` 可指定版本。

二、Linux 上安装 PowerShell
---------------------------

Ubuntu / Debian
~~~~~~~~~~~~~~~

.. code-block:: bash

   # 安装依赖
   sudo apt update
   sudo apt install -y wget apt-transport-https software-properties-common

   # 导入微软 GPG 密钥
   wget -q https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
   sudo dpkg -i packages-microsoft-prod.deb

   # 安装 PowerShell
   sudo apt update
   sudo apt install -y powershell

启动 PowerShell：

.. code-block:: bash

   pwsh

CentOS / RHEL / Fedora
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # 添加 Microsoft YUM 源
   sudo dnf install -y https://packages.microsoft.com/config/rhel/8/packages-microsoft-prod.rpm

   # 安装 PowerShell
   sudo dnf install -y powershell

或 CentOS 7 使用 ``yum``：

.. code-block:: bash

   sudo yum install -y powershell

Arch Linux / Manjaro
~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   sudo pacman -S powershell

.. note::

   如果找不到安装包，可使用 AUR 包管理器（如 ``yay``）安装。

三、macOS 上安装 PowerShell
---------------------------

方法一：使用 Homebrew（推荐）
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   brew install --cask powershell

启动 PowerShell：

.. code-block:: bash

   pwsh

方法二：手动下载 PKG 安装包
~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. 前往 GitHub 发布页：`PowerShell Releases <https://github.com/PowerShell/PowerShell/releases>`_
2. 下载 ``.pkg`` 安装文件（如 ``powershell-7.6.6-osx-arm64.pkg``）。
3. 双击安装并根据引导完成。

四、安装验证与卸载
------------------

验证是否安装成功：

.. code-block:: powershell

   pwsh --version

.. csv-table:: 各平台卸载方式
   :header: "平台", "卸载方式"

   "Windows", "控制面板 → 程序与功能 → 卸载 PowerShell 7"
   "Ubuntu", "sudo apt remove powershell"
   "CentOS", "sudo yum remove powershell"
   "macOS（brew）", "brew uninstall powershell"

不同平台启动命令
----------------

.. csv-table:: 启动方式
   :header: "平台", "命令"

   "Windows", "pwsh.exe 或开始菜单搜索 “PowerShell 7”"
   "Linux", "pwsh"
   "macOS", "pwsh"
