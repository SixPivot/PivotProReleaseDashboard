[![Build Status](https://dev.azure.com/sixpivot/ReleaseDashboard/_apis/build/status%2FPublish%20(GitHub)?branchName=main)](https://dev.azure.com/sixpivot/ReleaseDashboard/_build/latest?definitionId=78&branchName=main)

# Introduction

An Azure DevOps extension that shows a Deployment Summary page within the Azure Pipelines hub.

See the extension in the Visual Studio Marketplace [here](https://marketplace.visualstudio.com/items?itemName=SixPivot.sixpivot-release-dashboard)

The extension adds a 'PivotPro Release Dashboard' item to the Pipelines menu

![Menu showing PivotPro Release Dashboard menu item](extension/img/menu-screenshot.png)

Selecting this loads the PivotPro Release Dashboard page (this may take a while depending on how many environments and deployments you have)

![Example PivotPro Release Dashboard screenshot](extension/img/dashboard-screenshot.png)

You can configure the extension via the Settings page, including reordering the environment. The default order is alphabetical, which can result in 'prod' appearing before 'test'!

![Settings page screenshot](extension/img/settings-screenshot.png)

You reorder the environments by dragging them up or down and clicking **Save**.

You can restore the default order by clicking **Reset to default**

## Contributing

Contributions are welcome. See our [Contribution guide](./CONTRIBUTING.md)

See [the developer guide](extension/DEV_GUIDE.md) to get started developing.
