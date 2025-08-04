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
import { getBuild, getBuildTimeline } from '../api/BuildClient'
import { getPipelineApprovals } from '../api/PipelineApprovalsClient'

export const TreeViewDeploymentsTable = (props: {
    environments: IEnvironmentInstance[]
    pipelines: IPipelineInstance[]
    projectName?: string
}): JSX.Element => {
    const { environments, pipelines, projectName } = props
    const [folderViewItemProvider, setFolderViewItemProvider] = useState<ITreeItemProvider<IDeploymentTableItem>>()

    // State to hold build names and approval names for each environment instance
    const [buildNames, setBuildNames] = useState<Record<string, string>>({})
    const [approvalNames, setApprovalNames] = useState<Record<string, string>>({})

    useEffect(() => {
        if (pipelines && environments) buildTreeView()
    }, [pipelines, environments, buildNames, approvalNames])

    useEffect(() => {
        if (!projectName) return

        const newBuildNames: Record<string, string> = {}
        const newApprovalNames: Record<string, string> = {}

        // Function to fetch build names and approval information
        async function fetchBuildNames() {
            const pending: Array<Promise<void>> = []
            let totalKeys = 0
            pipelines.forEach((pipeline) => {
                Object.keys(pipeline.environments).forEach((envName: string) => {
                    const deploymentInstance = pipeline.environments[envName]
                    const key = pipeline.key + ':' + envName
                    totalKeys++
                    pending.push(
                        (async () => {
                            const build = await getBuild(projectName!, deploymentInstance.buildId!)
                            newBuildNames[key] = build?.buildNumber || deploymentInstance.value

                            if (!build) return

                            const buildId = build.id

                            const timeline = await getBuildTimeline(projectName!, deploymentInstance.buildId!)

                            if (!timeline) {
                                console.warn(`No timeline found for build ID: ${buildId}`)
                                return
                            }

                            // See if there are any Checkpoint.Approval records in the timeline
                            // whose parent's parent is type 'Stage' and has the same name as the stageName
                            const approvalTimelineRecord = timeline.records.find((record) => record.type === 'Checkpoint.Approval')

                            if (!approvalTimelineRecord) {
                                console.warn(`No approval timeline record found for build ID: ${buildId}`)
                                return
                            }

                            const checkpointRecord = timeline.records.find((record) => record.id === approvalTimelineRecord.parentId)
                            if (!checkpointRecord) {
                                console.warn(`No checkpoint record found for approval timeline record ID: ${approvalTimelineRecord.id}`)
                                return
                            }

                            const stageRecord = timeline.records.find(
                                (record) =>
                                    record.id === checkpointRecord.parentId &&
                                    record.type === 'Stage' &&
                                    record.name === deploymentInstance.stageName
                            )
                            if (!stageRecord) {
                                // This is expected if there is no approval required for this stage
                                return
                            }

                            const approvals = await getPipelineApprovals(projectName!)

                            if (!approvals || approvals.length === 0) {
                                console.warn(`No approvals found for project: ${projectName}`)
                                return
                            }

                            const approval = approvals.find((a) => a.id === approvalTimelineRecord.id)

                            if (!approval) {
                                console.warn(`No approval found for timeline record ID: ${approvalTimelineRecord.id}`)
                                return
                            }

                            const approver = approval?.steps[0]?.actualApprover?.displayName

                            if (approver) {
                                newApprovalNames[key] = approver
                            } else {
                                console.warn(`No approver found for approval ID: ${approval.id}`)
                            }
                        })()
                    )
                })
            })
            await Promise.all(pending)
            setBuildNames(newBuildNames)
            setApprovalNames(newApprovalNames)
        }
        fetchBuildNames()
    }, [pipelines, projectName])

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

        // Get build name and approval name for this pipeline/environment combination
        let buildName: string | undefined = undefined
        let approvalName: string | undefined = undefined
        const env = pipeline.environments[treeColumn!.name!]
        if (env) {
            const key = pipeline.key + ':' + treeColumn!.name!
            buildName = buildNames[key] || env.value
            approvalName = approvalNames[key]

            // Debug: log when we have enhanced data
            if (buildNames[key] && buildNames[key] !== env.value) {
                console.debug('TreeView using enhanced build name:', buildNames[key], 'for key:', key)
            }

            if (approvalNames[key]) {
                console.debug('TreeView using approval name:', approvalNames[key], 'for key:', key)
            }
        }

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
