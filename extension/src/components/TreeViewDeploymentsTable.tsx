import * as React from 'react'
import { ITreeColumn, renderExpandableTreeCell, Tree } from 'azure-devops-ui/TreeEx'
import { ITreeItem, ITreeItemEx, TreeItemProvider } from 'azure-devops-ui/Utilities/TreeItemProvider'
import { IItemProvider } from 'azure-devops-ui/Utilities/Provider'
import { IReadonlyObservableValue } from 'azure-devops-ui/Core/Observable'
import { IDeploymentTableItem, IPipelineInstance, IDashboardEnvironmentColumn } from '../types'
import { IEnvironmentInstance } from '../types'
import { SimpleTableCell } from 'azure-devops-ui/Table'
import { useState, useEffect } from 'react'
import { ITreeItemProvider } from 'azure-devops-ui/Utilities/TreeItemProvider'
import { DeploymentTableCell } from './DeploymentTableCell'
import { useBuildAndApprovalData } from '../hooks/useBuildAndApprovalData'
import { extractBuildAndApprovalNames } from '../utils/pipelineUtils'

export const TreeViewDeploymentsTable = (props: {
    environments: IEnvironmentInstance[]
    pipelines: IPipelineInstance[]
    projectName?: string
}): JSX.Element => {
    const { environments, pipelines, projectName } = props
    const [folderViewItemProvider, setFolderViewItemProvider] = useState<ITreeItemProvider<IDeploymentTableItem>>()

    // Use the shared hook for fetching build and approval data
    const { buildNames, approvalNames } = useBuildAndApprovalData(pipelines, projectName)

    useEffect(() => {
        if (pipelines && environments) buildTreeView()
    }, [pipelines, environments, buildNames, approvalNames])

    const buildTreeView = () => {
        let treeNodeItems: ITreeItem<IDeploymentTableItem>[] = []
        pipelines!.forEach((pipeline: IPipelineInstance) => {
            let folder = pipeline.environments[Object.keys(pipeline.environments)[0]]?.folder!
            let paths = folder.split('\\')

            // Remove the first empty path, set paths to [] at root level
            paths.shift()
            if (paths.length === 1 && paths[0] === '') paths = []

            addToTreeNodes(treeNodeItems, paths, pipeline)
        })

        setFolderViewItemProvider(new TreeItemProvider<IDeploymentTableItem>(treeNodeItems))
    }

    const addToTreeNodes = (pathChildren: ITreeItem<IDeploymentTableItem>[], paths: string[], pipelineInfo: IPipelineInstance) => {
        if (paths.length === 0) {
            pathChildren.push({
                data: {
                    name: pipelineInfo.name,
                    pipeline: pipelineInfo,
                } as IDeploymentTableItem,
                childItems: [],
                expanded: true,
            })
        } else {
            let existingNode = pathChildren.find((item) => item.data.name === paths[0])

            if (!existingNode) {
                existingNode = {
                    data: {
                        name: paths[0],
                    } as IDeploymentTableItem,
                    childItems: [],
                    expanded: true,
                }

                pathChildren.push(existingNode)
            }

            paths.shift()
            addToTreeNodes(existingNode!.childItems!, paths, pipelineInfo)
        }
    }

    const getFolderViewColumns = (): ITreeColumn<IDeploymentTableItem>[] => {
        let columns: ITreeColumn<IDeploymentTableItem>[] = []

        columns.push({
            id: 'name',
            name: '',
            width: 300,
            renderCell: renderExpandableTreeCell,
        })

        let dynamicColumns = environments.map((env) => {
            return {
                id: env.name!,
                name: env.name,
                width: !env.name ? 300 : 200,
                renderCell: renderTreeViewCell,
                isFixedColumn: true,
            }
        })

        return columns.concat(dynamicColumns)
    }

    const renderTreeViewCell = <T extends IDeploymentTableItem>(
        _rowIndex: number,
        columnIndex: number,
        treeColumn: ITreeColumn<T>,
        treeItem: ITreeItemEx<T>,
        _ariaRowIndex?: number | undefined,
        _role?: string
    ): JSX.Element => {
        let pipeline = treeItem.underlyingItem.data.pipeline

        // If row isn't a leaf node, then return no data indicator
        if (treeItem.underlyingItem.childItems && treeItem.underlyingItem.childItems.length > 0) {
            return (
                <SimpleTableCell key={'col-' + columnIndex} columnIndex={columnIndex}>
                    <div className="no-data">-</div>
                </SimpleTableCell>
            )
        }

        // If there's no pipeline (folder node) or no environment data for this pipeline
        if (!pipeline || !pipeline.environments[treeColumn!.name!]) {
            return (
                <SimpleTableCell key={'col-' + columnIndex} columnIndex={columnIndex}>
                    <div className="no-data">-</div>
                </SimpleTableCell>
            )
        }

        // Extract build and approval names using shared utility
        const { buildName, approvalName } = extractBuildAndApprovalNames(pipeline, treeColumn!.name!, buildNames, approvalNames)

        // Create a compatible table column for DeploymentTableCell
        const tableColumn: IDashboardEnvironmentColumn = {
            id: treeColumn.id,
            name: treeColumn.name,
            minWidth: 100,
            maxWidth: typeof treeColumn.width === 'number' ? treeColumn.width : 200,
            width: typeof treeColumn.width === 'number' ? treeColumn.width : 200,
            renderCell: () => <></>,
        }

        return (
            <DeploymentTableCell
                columnIndex={columnIndex}
                tableColumn={tableColumn}
                key={'col-' + columnIndex}
                tableItem={pipeline}
                buildName={buildName}
                approvalName={approvalName}
            />
        )
    }

    return (
        <>
            {folderViewItemProvider && (
                <Tree<IDeploymentTableItem>
                    className="deployments-table"
                    columns={getFolderViewColumns()}
                    itemProvider={
                        folderViewItemProvider as IItemProvider<
                            ITreeItemEx<IDeploymentTableItem> | IReadonlyObservableValue<ITreeItemEx<IDeploymentTableItem>>
                        >
                    }
                    onToggle={(_, treeItem: ITreeItemEx<IDeploymentTableItem>) => {
                        folderViewItemProvider!.toggle(treeItem.underlyingItem)
                    }}
                    scrollable={true}
                />
            )}
        </>
    )
}
