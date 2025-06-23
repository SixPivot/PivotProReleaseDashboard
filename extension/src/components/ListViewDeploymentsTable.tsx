import { Table } from 'azure-devops-ui/Table'
import React, { useEffect, useState } from 'react'
import { IDashboardEnvironmentColumn, IEnvironmentInstance, IPipelineInstance } from '../types'
import { ArrayItemProvider } from 'azure-devops-ui/Utilities/Provider'
import { DeploymentTableCell } from './DeploymentTableCell'
import { getBuild } from '../api/BuildClient'

export const ListViewDeploymentsTable = (props: {
    environments: IEnvironmentInstance[]
    pipelines: IPipelineInstance[]
    projectName?: string
}): JSX.Element => {
    const { environments, pipelines, projectName } = props

    // State to hold build names for each environment instance
    const [buildNames, setBuildNames] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!projectName) return
        const pending: Array<Promise<void>> = []
        const newBuildNames: Record<string, string> = {}
        pipelines.forEach((pipeline) => {
            Object.entries(pipeline.environments).forEach(([envName, env]) => {
                if (env.buildId) {
                    const key = pipeline.key + ':' + envName
                    pending.push(
                        getBuild(projectName, env.buildId).then((build) => {
                            newBuildNames[key] = build?.buildNumber || env.value
                        })
                    )
                } else {
                    const key = pipeline.key + ':' + envName
                    newBuildNames[key] = env.value
                }
            })
        })
        Promise.all(pending).then(() => {
            setBuildNames(newBuildNames)
        })
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
        if (tableColumn.id !== 'name') {
            const env = tableItem.environments[tableColumn.id]
            if (env) {
                const key = tableItem.key + ':' + tableColumn.id
                buildName = buildNames[key] || env.value
            }
        }
        return (
            <DeploymentTableCell
                columnIndex={columnIndex}
                tableColumn={tableColumn}
                key={'col-' + columnIndex}
                tableItem={tableItem}
                buildName={buildName}
            />
        )
    }

    return (
        <Table className="deployments-table" columns={getListViewColumns(environments)} itemProvider={new ArrayItemProvider(pipelines)} />
    )
}
