import React from 'react'
import { SimpleTableCell } from 'azure-devops-ui/Table'
import { Link } from 'azure-devops-ui/Link'
import { Status, StatusSize } from 'azure-devops-ui/Status'
import { AgoFormat } from 'azure-devops-ui/Utilities/Date'
import { getStatusIndicatorData } from '../utilities'
import { IDashboardEnvironmentColumn, IPipelineInstance } from '../types'
import { SafeAgo } from './SafeAgo'

interface BuildNameCellProps {
    buildName: string
    uri: string
}

const BuildNameCell: React.FC<BuildNameCellProps> = ({ buildName, uri }) => {
    return (
        <Link className="bolt-table-inline-link bolt-table-link no-underline-link" target="_top" href={uri}>
            {buildName}
        </Link>
    )
}

interface DeploymentTableCellProps {
    columnIndex: number
    tableColumn: IDashboardEnvironmentColumn
    tableItem: IPipelineInstance
    buildName?: string
}

export const DeploymentTableCell: React.FC<DeploymentTableCellProps> = ({ columnIndex, tableColumn, tableItem, buildName }) => {
    if (tableColumn.id === 'name') {
        return (
            <SimpleTableCell
                columnIndex={columnIndex}
                tableColumn={tableColumn}
                contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m bolt-table-cell-content-with-inline-link"
            >
                <Link className="bolt-table-inline-link bolt-table-link no-underline-link" target="_top" href={tableItem.uri}>
                    {tableItem.name}
                </Link>
            </SimpleTableCell>
        )
    }
    const env = tableItem.environments[tableColumn.id]
    return (
        <SimpleTableCell
            columnIndex={columnIndex}
            tableColumn={tableColumn}
            contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m bolt-table-cell-content-with-inline-link"
        >
            {env ? (
                <div className="flex-row flex-start">
                    <Status
                        {...getStatusIndicatorData(env.result).statusProps}
                        className="icon-large-margin status-icon"
                        size={StatusSize.m}
                    />
                    <div className="flex-column wrap-text">
                        <BuildNameCell buildName={buildName || env.value} uri={env.uri} />
                        <div className="finish-date">{env.finishTime && <SafeAgo date={env.finishTime} format={AgoFormat.Extended} />}</div>
                    </div>
                </div>
            ) : (
                <div className="no-data">-</div>
            )}
        </SimpleTableCell>
    )
}
