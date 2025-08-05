import { Table } from 'azure-devops-ui/Table'
import React from 'react'
import { IDashboardEnvironmentColumn, IEnvironmentInstance, IPipelineInstance } from '../types'
import { ArrayItemProvider } from 'azure-devops-ui/Utilities/Provider'
import { DeploymentTableCell } from './DeploymentTableCell'
import { useBuildAndApprovalData } from '../hooks/useBuildAndApprovalData'
import { extractBuildAndApprovalNames } from '../utils/pipelineUtils'

export const ListViewDeploymentsTable = (props: {
    environments: IEnvironmentInstance[]
    pipelines: IPipelineInstance[]
    projectName?: string
}): JSX.Element => {
    const { environments, pipelines, projectName } = props

    // Use the shared hook for fetching build and approval data
    const { buildNames, approvalNames } = useBuildAndApprovalData(pipelines, projectName)

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
            const result = extractBuildAndApprovalNames(tableItem, tableColumn.id, buildNames, approvalNames)
            buildName = result.buildName
            approvalName = result.approvalName
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
