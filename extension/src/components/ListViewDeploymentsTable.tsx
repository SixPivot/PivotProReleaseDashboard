import { Table } from 'azure-devops-ui/Table'
import React, { useEffect, useState } from 'react'
import { IDashboardEnvironmentColumn, IEnvironmentInstance, IPipelineInstance } from '../types'
import { ArrayItemProvider } from 'azure-devops-ui/Utilities/Provider'
import { DeploymentTableCell } from './DeploymentTableCell'
import { getBuild, getBuildTimeline } from '../api/BuildClient'
import { getPipelineApprovals } from '../api/PipelineApprovalsClient'

export const ListViewDeploymentsTable = (props: {
    environments: IEnvironmentInstance[]
    pipelines: IPipelineInstance[]
    projectName?: string
}): JSX.Element => {
    const { environments, pipelines, projectName } = props

    // State to hold build names for each environment instance
    const [buildNames, setBuildNames] = useState<Record<string, string>>({})
    const [approvalNames, setApprovalNames] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!projectName) return
        const newBuildNames: Record<string, string> = {}
        const newApprovalNames: Record<string, string> = {}
        // Function to fetch build names and approval information
        async function fetchBuildNames() {
            const pending: Array<Promise<void>> = []
            pipelines.forEach((pipeline) => {
                Object.entries(pipeline.environments).forEach(([envName, deploymentInstance]) => {
                    const key = pipeline.key + ':' + envName
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
                                //console.warn(`No stage record found for approval timeline record ID: ${approvalTimelineRecord.id} with stage name: ${deploymentInstance.stageName}`);
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

                                console.log(
                                    `Environment: ${envName}, Build: ${build.buildNumber}, Build ID: ${buildId}, Pipeline: ${pipeline.name}, Stage: ${deploymentInstance.stageName}`
                                )
                                console.log(`Approval found: ${approval.id} - ${approval.status}`)
                                console.log(key)
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

    function getListViewColumns(environments: IEnvironmentInstance[]): Array<IDashboardEnvironmentColumn> {
        const columns: IDashboardEnvironmentColumn[] = []

        columns.push({
            id: 'name',
            name: '',
            renderCell: (index: number, columnIndex: number, tableColumn: IDashboardEnvironmentColumn, tableItem: IPipelineInstance) =>
                renderCell(index, columnIndex, tableColumn, tableItem),
            width: 250,
            conventionSortOrder: 0,
        } as IDashboardEnvironmentColumn)

        const dynamicColumns = environments.map((environment) => {
            return {
                id: environment.name,
                name: environment.name,
                renderCell: (index: number, columnIndex: number, tableColumn: IDashboardEnvironmentColumn, tableItem: IPipelineInstance) =>
                    renderCell(index, columnIndex, tableColumn, tableItem),
                width: 200,
            } as IDashboardEnvironmentColumn
        })

        return columns.concat(dynamicColumns)
    }

    const renderCell = (_index: number, columnIndex: number, tableColumn: IDashboardEnvironmentColumn, tableItem: IPipelineInstance) => {
        let buildName: string | undefined = undefined
        let approvalName: string | undefined = undefined
        if (tableColumn.id !== 'name') {
            const env = tableItem.environments[tableColumn.id]
            if (env) {
                const key = tableItem.key + ':' + tableColumn.id
                buildName = buildNames[key] || env.value
                approvalName = approvalNames[key]
            }
        }
        return (
            <DeploymentTableCell
                columnIndex={columnIndex}
                tableColumn={tableColumn}
                key={'col-' + columnIndex}
                tableItem={tableItem}
                buildName={buildName}
                approvalName={approvalName}
            />
        )
    }

    return (
        <Table className="deployments-table" columns={getListViewColumns(environments)} itemProvider={new ArrayItemProvider(pipelines)} />
    )
}
