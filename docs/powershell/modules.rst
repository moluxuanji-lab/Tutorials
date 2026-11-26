PowerShell 模块与包管理
=======================

.. meta::
   :group: 工程化
   :summary: 使用 PSResourceGet 管理模块依赖，掌握版本锁定、私有仓库、模块清单与依赖声明。

模块是 PowerShell 组织函数、Cmdlet 与资源的基本单位，也是脚本走向工程化的第一步。PowerShell 7.6 内置 PSResourceGet，模块的安装、升级与版本锁定都有了统一入口。

本节将介绍以下内容：

* 使用 PSResourceGet 搜索、安装和更新模块。
* 锁定模块版本并配置私有仓库。
* 使用清单文件组织模块并控制导出范围。
* 在脚本中声明模块依赖。

一、PSResourceGet 包管理
------------------------

PowerShell 7.6 内置的包管理模块是 **PSResourceGet 1.2**，命令统一以 ``PSResource`` 命名。它与 PowerShellGet 并存，旧脚本中的 ``Install-Module`` 仍可使用，但新脚本建议直接使用新命令。

常用命令
~~~~~~~~

.. csv-table::
   :header: "任务", "命令"

   "搜索", "Find-PSResource"
   "安装", "Install-PSResource"
   "查看已安装", "Get-InstalledPSResource"
   "更新", "Update-PSResource"
   "卸载", "Uninstall-PSResource"
   "只下载不安装", "Save-PSResource"
   "发布", "Publish-PSResource"
   "仓库管理", "Get-PSResourceRepository / Register-PSResourceRepository"

示例：

.. code-block:: powershell

   Find-PSResource -Name Pester
   Install-PSResource -Name Pester -Scope CurrentUser -TrustRepository
   Get-InstalledPSResource Pester
   Update-PSResource Pester
   Uninstall-PSResource Pester

仓库与信任设置
~~~~~~~~~~~~~~

.. code-block:: powershell

   Get-PSResourceRepository
   Set-PSResourceRepository -Name PSGallery -Trusted

``-TrustRepository`` 表示不再逐次确认。首次使用 PSGallery 时，也可以先将其标记为可信，之后安装就不会反复提示。

二、版本锁定与私有仓库
----------------------

生产环境需要避免“模块升级后脚本无法运行”的情况。安装时应锁定版本或版本范围：

.. code-block:: powershell

   Install-PSResource -Name Pester -Version "5.7.1" -Scope CurrentUser
   Install-PSResource -Name Pester -Version "[5.0,6.0)" -Scope CurrentUser

版本范围语法来自 NuGet，``[1.0,2.0)`` 表示包含 1.0、不包含 2.0。需要预览版时添加 ``-Prerelease``。

企业内部通常搭建私有 NuGet 源，将审核过的模块集中管理：

.. code-block:: powershell

   Register-PSResourceRepository -Name Internal -Uri https://nuget.example.com/v3/index.json
   Set-PSResourceRepository -Name Internal -Trusted
   Install-PSResource -Name CorpTools -Repository Internal -Version "2.3.0"

.. warning::

   自动化脚本中不应无条件执行 ``Update-PSResource``。升级应作为一次独立变更，经过测试后再推送到运行环境。

三、模块清单与目录结构
----------------------

脚本模块通常由一个 ``.psm1`` 文件组成，正式模块还需要清单文件来声明版本、作者和导出范围。

生成模块清单
~~~~~~~~~~~~

.. code-block:: powershell

   New-ModuleManifest -Path .\MyTools.psd1 `
       -RootModule MyTools.psm1 `
       -ModuleVersion 1.0.0 `
       -Guid ([guid]::NewGuid()) `
       -Author "Your Name" `
       -Description "常用运维函数" `
       -FunctionsToExport @("Get-DiskFree") `
       -PowerShellVersion "7.4"

组织公开与私有函数
~~~~~~~~~~~~~~~~~~

推荐的目录结构如下：

.. code-block:: text

   MyTools/
     MyTools.psd1
     MyTools.psm1
     Public/          # 对外导出的函数
     Private/         # 内部辅助函数

在 ``.psm1`` 中使用 ``$PSScriptRoot`` 加载子目录文件，避免依赖当前工作目录：

.. code-block:: powershell

   Get-ChildItem "$PSScriptRoot\Private\*.ps1" | ForEach-Object { . $_.FullName }
   Get-ChildItem "$PSScriptRoot\Public\*.ps1"  | ForEach-Object { . $_.FullName }

``FunctionsToExport`` 只列出公开函数，内部函数不会出现在使用者的会话中。

.. tip::

   清单中的 ``ModuleVersion`` 与 ``FunctionsToExport`` 会直接影响使用体验。发布前可使用 ``Test-ModuleManifest`` 检查清单是否完整。

四、在脚本中声明依赖
--------------------

``#Requires`` 可以在运行前检查 PowerShell 版本、模块和权限：

.. code-block:: powershell

   #Requires -Version 7.4
   #Requires -Modules @{ ModuleName = "Pester"; ModuleVersion = "5.7.1" }
   #Requires -RunAsAdministrator

.. important::

   ``#Requires`` 只负责检查，不负责安装。部署时应配套依赖清单，或提供初始化脚本统一安装指定版本。

需要确认模块来源是否可信时，可以检查数字签名：

.. code-block:: powershell

   $modulePath = (Get-Module -ListAvailable Pester |
       Sort-Object Version -Descending |
       Select-Object -First 1).Path

   Get-AuthenticodeSignature $modulePath

.. note::

   签名状态为 ``Valid`` 说明文件未被篡改且来自该发布者，但不代表代码一定安全。内部模块仍应经过代码审查。

五、练习任务
------------

任务 1：搜索并查看模块版本

.. code-block:: powershell

   Find-PSResource Pester
   Get-InstalledPSResource Pester

任务 2：安装指定版本的模块

.. code-block:: powershell

   Install-PSResource Pester -Version "5.7.1" -Scope CurrentUser -TrustRepository

任务 3：为模块创建清单文件

.. code-block:: powershell

   New-ModuleManifest -Path .\Demo.psd1 `
       -RootModule Demo.psm1 `
       -ModuleVersion 1.0.0 `
       -FunctionsToExport @("Get-Demo")

任务 4：在脚本中声明依赖

.. code-block:: powershell

   #Requires -Version 7.4
   #Requires -Modules @{ ModuleName = "Pester"; ModuleVersion = "5.7.1" }
