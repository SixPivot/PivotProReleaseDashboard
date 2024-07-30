import { Card } from 'azure-devops-ui/Card'
import { CustomHeader, HeaderDescription, HeaderTitle, HeaderTitleArea, HeaderTitleRow, TitleSize } from 'azure-devops-ui/Header'
import { Page } from 'azure-devops-ui/Page'
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner'
import React, { useEffect, useState } from 'react'
import { Link } from 'azure-devops-ui/Link'
import { Button } from 'azure-devops-ui/Button'
import { IEnvironmentInstance, IPipelineInstance } from '../types'
import { TreeViewDeploymentsTable } from '../components/TreeViewDeploymentsTable'
import { IDashboardEnvironmentColumn, IPipelineInstance } from '../api/types'
import { DeploymentTableCell } from './deployment-table-cell'
import { ArrayItemProvider } from 'azure-devops-ui/Utilities/Provider'
import { IDevOpsProjectInfo, IEnvironmentInstance } from '../../api/types'
import { TreeViewTable } from './tree-view-table'
import { DropdownSelection } from 'azure-devops-ui/Utilities/DropdownSelection'
import { Dropdown } from 'azure-devops-ui/Dropdown'

export interface IMainContentState {
    pipelines?: ArrayItemProvider<IPipelineInstance>
    columns: IDashboardEnvironmentColumn[]
    isLoading: boolean
    organisation?: string
    project?: string
}

export type MainContentProps = {
    environments: IEnvironmentInstance[]
    pipelines: ArrayItemProvider<IPipelineInstance>
    organisation: string
    project: string
    isLoading: boolean
}

enum ViewType {
    List = 'List View',
    Folder = 'Folder View',
}

export const MainContent = (props: MainContentProps) => {
    const { environments, pipelines, project, organisation, isLoading } = props
    const columns = generateEnvironmentsAsColumns(environments)
    const state: IMainContentState = {
        columns,
        pipelines,
        project,
        organisation,
        isLoading,
    }
    const viewSelection = new DropdownSelection()
    const [viewType, setViewType] = useState(ViewType.List.toString())

    useEffect(() => {
        viewSelection.select(0)
    }, [])

    const viewOptions = Object.entries(ViewType).map(([_, value]) => ({
        id: value,
        text: value,
    }))

    const headerCommandBarItems: IHeaderCommandBarItem[] = [
        {
            iconProps: { iconName: 'Settings' },
            id: 'deployment-dashboard-settings',
            tooltipProps: { text: 'Navigate to deployment dashboard settings' },
            isPrimary: true,
            important: true,
            href: state.projectInfo?.settingsUri,
            target: '_top',
            text: 'Settings',
        },
    ]

    return (
        <Page className="flex-grow">
            <CustomHeader className="bolt-header-with-commandbar">
                <HeaderTitleArea>
                    <HeaderTitleRow>
                        <HeaderTitle ariaLevel={3} className="text-ellipsis" titleSize={TitleSize.Large}>
                            Deployment Dashboard
                        </HeaderTitle>
                    </HeaderTitleRow>
                    <HeaderDescription className="flex-row flex-center justify-space-between">
                        <div>Provides a view of your products, deployments, and environments in your project's build pipelines.</div>
                        <div>
                            <Dropdown
                                items={viewOptions}
                                onSelect={(_, item) => {
                                    setViewType(item.id)
                                }}
                                selection={viewSelection}
                            />
                        </div>
                    </HeaderDescription>
                </HeaderTitleArea>
                <HeaderCommandBar items={headerCommandBarItems} />
            </CustomHeader>

            <div className="page-content page-content-top">
                <Card>
                    {isLoading ? (
                        <div className="flex-grow padding-vertical-20 font-size-m">
                            <Spinner label="Loading data..." size={SpinnerSize.large} />
                        </div>
                    ) : pipelines && pipelines.length === 0 ? (
                        <div className="font-size-m flex-grow text-center padding-vertical-20">
                            <div className="margin-bottom-16 font-weight-heavy font-size-l">No deployments were found in any pipelines</div>
                            <Link
                                className="no-underline-link"
                                target="_top"
                                href="https://learn.microsoft.com/en-us/azure/devops/pipelines/process/deployment-jobs?view=azure-devops"
                            >
                                Learn more
                            </Link>{' '}
                            about deployment jobs and how to set them up in your pipelines.
                            <div className="margin-top-16">
                                <Button
                                    text="View pipelines"
                                    primary={true}
                                    target="_top"
                                    href={`https://dev.azure.com/${state.organisation}/${state.project}/_build`}
                                />
                            </div>
                        </div>
                    ) : viewType === ViewType.List ? (
                        <ListViewDeploymentsTable environments={environments} pipelines={pipelines} />
                    ) : (
                        <TreeViewDeploymentsTable environments={environments} pipelines={pipelines} />
                    )}
                </Card>
            </div>
        </Page>
    )
}