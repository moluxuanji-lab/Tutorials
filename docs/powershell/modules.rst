PowerShell 模块与包管理
=======================

.. meta::
   :group: 工程化
   :summary: 不再重复模块概念与导入命令，专注 PSResourceGet 包管理、版本锁定、清单文件与依赖声明。

模块是什么、如何 ``Import-Module``、如何查看已加载模块，这些内容已经在核心概念与脚本编写章节讲过。本章只处理工程化问题：**依赖从哪来、版本怎么锁、模块怎么打包、脚本怎么声明依赖**。

一、PSResourceGet：7.6 内置的包管理器
-------------------------------------

早期教程常用 ``Install-Module``（PowerShellGet v2）。PowerShell 7.6 内置的是 **PSResourceGet 1.2**，命令统一以 ``PSResource`` 命名：

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

常用操作：

.. code-block:: powershell

   Find-PSResource -Name Pester
   Install-PSResource -Name Pester -Scope CurrentUser -TrustRepository
   Get-InstalledPSResource Pester
   Update-PSResource Pester
   Uninstall-PSResource Pester

.. note::

   ``-TrustRepository`` 表示不再逐次确认。首次使用 PSGallery 时，也可以先执行 ``Set-PSResourceRepository -Name PSGallery -Trusted``，之后安装就不会反复提示。

二、版本锁定与私有仓库
----------------------

生产环境最怕“模块一升级，脚本就坏”。安装时锁定版本或版本范围：

.. code-block:: powershell

   Install-PSResource -Name Pester -Version "5.7.1" -Scope CurrentUser
   Install-PSResource -Name Pester -Version "[5.0,6.0)" -Scope CurrentUser

范围语法来自 NuGet：``[1.0,2.0)`` 表示包含 1.0、不包含 2.0。需要预览版时加 ``-Prerelease``。

企业内部通常搭建私有 NuGet 源，把审核过的模块放进去：

.. code-block:: powershell

   Register-PSResourceRepository -Name Internal -Uri https://nuget.example.com/v3/index.json
   Set-PSResourceRepository -Name Internal -Trusted
   Install-PSResource -Name CorpTools -Repository Internal -Version "2.3.0"

.. warning::

   不要在自动化脚本里无条件执行 ``Update-PSResource``。升级应作为一次独立变更，经过测试后再推送到运行环境。

三、清单文件与目录结构
----------------------

脚本编写章节已经演示过最小的 ``.psm1`` 模块。正式模块需要清单文件来声明版本、作者和导出范围：

.. code-block:: powershell

   New-ModuleManifest -Path .\MyTools.psd1 `
       -RootModule MyTools.psm1 `
       -ModuleVersion 1.0.0 `
       -Guid ([guid]::NewGuid()) `
       -Author "Your Name" `
       -Description "常用运维函数" `
       -FunctionsToExport @("Get-DiskFree") `
       -PowerShellVersion "7.4"

推荐的目录结构：

.. code-block:: text

   MyTools/
     MyTools.psd1
     MyTools.psm1
     Public/          # 对外导出的函数
     Private/         # 内部辅助函数

在 ``.psm1`` 中用 ``$PSScriptRoot`` 加载子目录文件，避免依赖当前工作目录：

.. code-block:: powershell

   Get-ChildItem "$PSScriptRoot\Private\*.ps1" | ForEach-Object { . $_.FullName }
   Get-ChildItem "$PSScriptRoot\Public\*.ps1"  | ForEach-Object { . $_.FullName }

``FunctionsToExport`` 只列出公开函数，内部函数不会污染使用者的会话。

.. tip::

   清单里的 ``ModuleVersion`` 与 ``FunctionsToExport`` 直接影响使用体验。发布前用 ``Test-ModuleManifest`` 检查清单是否完整。

四、在脚本里声明依赖
--------------------

``#Requires`` 可以在运行前强制检查版本、模块和权限：

.. code-block:: powershell

   #Requires -Version 7.4
   #Requires -Modules @{ ModuleName = "Pester"; ModuleVersion = "5.7.1" }
   #Requires -RunAsAdministrator

.. important::

   ``#Requires`` 只做检查，**不负责安装**。部署时应配套一份依赖清单，或提供初始化脚本统一安装指定版本。

需要确认模块来源是否可信时，可以检查数字签名：

.. code-block:: powershell

   $modulePath = (Get-Module -ListAvailable Pester |
       Sort-Object Version -Descending |
       Select-Object -First 1).Path

   Get-AuthenticodeSignature $modulePath

.. note::

   签名状态为 ``Valid`` 只说明文件未被篡改且来自该发布者，不代表代码一定安全。内部模块仍应经过代码审查。

五、小结
--------

.. csv-table::
   :header: "能力", "关键命令", "要点"

   "搜索与安装", "Find-PSResource / Install-PSResource", "7.6 内置 PSResourceGet"
   "版本控制", "-Version / 版本范围", "生产环境避免浮动版本"
   "私有源", "Register-PSResourceRepository", "只从可信源安装"
   "模块清单", "New-ModuleManifest / Test-ModuleManifest", "声明版本与导出函数"
   "依赖声明", "#Requires", "只检查，不安装"
   "来源校验", "Get-AuthenticodeSignature", "签名有效不等于代码安全"

模块化的价值不只是复用代码，更是把“版本、依赖、发布”变成可管理的边界。个人函数库也应该有清单文件，习惯从第一天养成。
