import { SimpleTableCell, Table } from 'azure-devops-ui/Table'
import { Link } from 'azure-devops-ui/Link'
import React, { useEffect, useState } from 'react'
import { Status, StatusSize } from 'azure-devops-ui/Status'
import { AgoFormat } from 'azure-devops-ui/Utilities/Date'
import { getStatusIndicatorData } from '../utilities'
import { IDashboardEnvironmentColumn, IEnvironmentInstance, IPipelineInstance } from '../types'
import { ArrayItemProvider } from 'azure-devops-ui/Utilities/Provider'
import { SafeAgo } from './SafeAgo'
import { getBuildName } from '../api/BuildClient'

export const ListViewDeploymentsTable = (props: {
    environments: IEnvironmentInstance[]
    pipelines: IPipelineInstance[]
    projectName?: string
}): JSX.Element => {
    const { environments, pipelines, projectName } = props

    function getListViewColumns(environments: IEnvironmentInstance[]): Array<IDashboardEnvironmentColumn> {
        const columns: IDashboardEnvironmentColumn[] = []

        columns.push({
            id: 'name',
            name: '',
            renderCell,
            width: 250,
            conventionSortOrder: 0,
        } as IDashboardEnvironmentColumn)

        const dynamicColumns = environments.map((environment) => {
            return {
                id: environment.name,
                name: environment.name,
                renderCell,
                width: 200,
            } as IDashboardEnvironmentColumn
        })

        return columns.concat(dynamicColumns)
    }

    // Helper component for deferred build name lookup
    const BuildNameCell = ({ value, ownerId, uri }: { value: string; ownerId?: number; uri: string }) => {
        const [buildName, setBuildName] = useState<string | undefined>(!ownerId ? value : undefined)
        useEffect(() => {
            let cancelled = false
            async function fetchName() {
                if (ownerId && projectName) {
                    const name = await getBuildName(projectName, ownerId)
                    if (!cancelled) setBuildName(name || value)
                } else {
                    setBuildName(value)
                }
            }
            fetchName()
            return () => {
                cancelled = true
            }
        }, [ownerId, projectName, value])
        return (
            <Link className="bolt-table-inline-link bolt-table-link no-underline-link" target="_top" href={uri}>
                {buildName || value}
            </Link>
        )
    }

    const renderCell = (_index: number, columnIndex: number, tableColumn: IDashboardEnvironmentColumn, tableItem: IPipelineInstance) => {
        return (
            <SimpleTableCell
                columnIndex={columnIndex}
                tableColumn={tableColumn}
                key={'col-' + columnIndex}
                contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m bolt-table-cell-content-with-inline-link"
            >
                {tableColumn.id === 'name' ? (
                    <Link className="bolt-table-inline-link bolt-table-link no-underline-link" target="_top" href={tableItem.uri}>
                        {tableItem.name}
                    </Link>
                ) : tableItem.environments[tableColumn.id] ? (
                    <div className="flex-row flex-start">
                        <Status
                            {...getStatusIndicatorData(tableItem.environments[tableColumn.id].result).statusProps}
                            className="icon-large-margin status-icon"
                            size={StatusSize.m}
                        />
                        <div className="flex-column wrap-text">
                            <BuildNameCell
                                value={tableItem.environments[tableColumn.id].value}
                                ownerId={tableItem.environments[tableColumn.id].ownerId}
                                uri={tableItem.environments[tableColumn.id].uri}
                            />
                            <div className="finish-date">
                                {tableItem.environments[tableColumn.id].finishTime && (
                                    <SafeAgo date={tableItem.environments[tableColumn.id].finishTime} format={AgoFormat.Extended} />
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="no-data">-</div>
                )}
            </SimpleTableCell>
        )
    }

    return (
        <Table className="deployments-table" columns={getListViewColumns(environments)} itemProvider={new ArrayItemProvider(pipelines)} />
    )
}
