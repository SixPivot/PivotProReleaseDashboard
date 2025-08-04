/// <reference types="node" />
const OriginalDateTimeFormat = Intl.DateTimeFormat
jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((...args) => {
    return new OriginalDateTimeFormat(['en-US'], { ...args[1], timeZone: 'UTC' })
})

import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TreeViewDeploymentsTable } from './TreeViewDeploymentsTable'
import { IEnvironmentInstance, IPipelineInstance } from '../types'

// Mock SafeAgo to avoid time-related test flakiness
jest.mock('./SafeAgo', () => ({
    SafeAgo: ({ date }: { date: Date }) => <span data-testid="safe-ago">{date.toISOString()}</span>,
}))

const TaskResult = { Succeeded: 2, Failed: 8 }

const mockEnvironments: IEnvironmentInstance[] = [
    {
        name: 'Development',
    },
    {
        name: 'Production',
    },
]

const mockPipelines: IPipelineInstance[] = [
    {
        key: 'pipeline-1',
        name: 'Pipeline 1',
        uri: 'https://dev.azure.com/org/project/_build/results?buildId=1',
        environments: {
            Development: {
                value: 'Build 123',
                buildId: 1,
                uri: 'https://dev.azure.com/org/project/_build/results?buildId=1',
                result: TaskResult.Succeeded,
                finishTime: new Date('2025-06-29T12:00:00Z'),
                environmentId: 1,
                stageName: 'Dev',
                folder: '\\Frontend',
            },
            Production: {
                value: 'Build 123',
                buildId: 1,
                uri: 'https://dev.azure.com/org/project/_build/results?buildId=1',
                result: TaskResult.Failed,
                finishTime: new Date('2025-06-29T14:00:00Z'),
                environmentId: 2,
                stageName: 'Prod',
                folder: '\\Frontend',
            },
        },
    },
    {
        key: 'pipeline-2',
        name: 'Pipeline 2',
        uri: 'https://dev.azure.com/org/project/_build/results?buildId=2',
        environments: {
            Development: {
                value: 'Build 456',
                buildId: 2,
                uri: 'https://dev.azure.com/org/project/_build/results?buildId=2',
                result: TaskResult.Succeeded,
                finishTime: new Date('2025-06-29T10:00:00Z'),
                environmentId: 1,
                stageName: 'Dev',
                folder: '\\Backend\\API',
            },
        },
    },
]

describe('TreeViewDeploymentsTable', () => {
    it('renders empty table when no pipelines are provided', () => {
        render(<TreeViewDeploymentsTable environments={[]} pipelines={[]} />)
        expect(document.querySelector('.deployments-table')).toBeInTheDocument()
        // Should have only header row, no data rows
        expect(document.querySelectorAll('.bolt-tree-row').length).toBe(0)
    })

    it('renders the tree view with correct structure after data loads', async () => {
        render(<TreeViewDeploymentsTable environments={mockEnvironments} pipelines={mockPipelines} />)

        await waitFor(() => {
            expect(document.querySelector('.deployments-table')).toBeInTheDocument()
        })

        // Check for folder structure
        expect(screen.getByText('Frontend')).toBeInTheDocument()
        expect(screen.getByText('Backend')).toBeInTheDocument()
        expect(screen.getByText('API')).toBeInTheDocument()
    })

    it('renders pipeline names as leaf nodes', async () => {
        render(<TreeViewDeploymentsTable environments={mockEnvironments} pipelines={mockPipelines} />)

        await waitFor(() => {
            expect(screen.getByText('Pipeline 1')).toBeInTheDocument()
            expect(screen.getByText('Pipeline 2')).toBeInTheDocument()
        })
    })

    it('renders deployment status and build links for each environment', async () => {
        render(<TreeViewDeploymentsTable environments={mockEnvironments} pipelines={mockPipelines} />)

        await waitFor(() => {
            // Check for build links - there can be multiple for the same build across different environments
            const build123Links = screen.getAllByRole('link', { name: /Build 123/i })
            expect(build123Links.length).toBeGreaterThan(0)

            const build456Links = screen.getAllByRole('link', { name: /Build 456/i })
            expect(build456Links.length).toBeGreaterThan(0)
        })
    })

    it('renders finish times using SafeAgo component', async () => {
        render(<TreeViewDeploymentsTable environments={mockEnvironments} pipelines={mockPipelines} />)

        await waitFor(() => {
            const safeAgoElements = screen.getAllByTestId('safe-ago')
            expect(safeAgoElements.length).toBeGreaterThan(0)
            expect(safeAgoElements[0]).toHaveTextContent('2025-06-29T12:00:00.000Z')
        })
    })

    it('shows dash for non-leaf nodes in environment columns', async () => {
        render(<TreeViewDeploymentsTable environments={mockEnvironments} pipelines={mockPipelines} />)

        await waitFor(() => {
            const dashElements = screen.getAllByText('-')
            expect(dashElements.length).toBeGreaterThan(0)
        })
    })

    it('handles pipelines with no folder (root level)', async () => {
        const rootPipelines: IPipelineInstance[] = [
            {
                key: 'root-pipeline',
                name: 'Root Pipeline',
                uri: 'https://dev.azure.com/org/project/_build/results?buildId=3',
                environments: {
                    Development: {
                        value: 'Build 789',
                        buildId: 3,
                        uri: 'https://dev.azure.com/org/project/_build/results?buildId=3',
                        result: TaskResult.Succeeded,
                        finishTime: new Date('2025-06-29T16:00:00Z'),
                        environmentId: 1,
                        stageName: 'Dev',
                        folder: '\\',
                    },
                },
            },
        ]

        render(<TreeViewDeploymentsTable environments={mockEnvironments} pipelines={rootPipelines} />)

        await waitFor(() => {
            expect(screen.getByText('Root Pipeline')).toBeInTheDocument()
        })
    })

    it('matches snapshot', async () => {
        const { container } = render(<TreeViewDeploymentsTable environments={mockEnvironments} pipelines={mockPipelines} />)

        await waitFor(() => {
            expect(document.querySelector('.deployments-table')).toBeInTheDocument()
        })

        expect(container).toMatchSnapshot()
    })
})
