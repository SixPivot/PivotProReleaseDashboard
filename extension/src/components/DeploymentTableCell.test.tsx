// At the top of your test file
const OriginalDateTimeFormat = Intl.DateTimeFormat;

jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((...args) => {
  return new OriginalDateTimeFormat(['en-US'], { ...args[1], timeZone: 'UTC' });
});

import * as React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DeploymentTableCell } from './DeploymentTableCell'
import { IDashboardEnvironmentColumn, IPipelineInstance } from '../types'

const TaskResult = { Succeeded: 2 }

const baseColumn: IDashboardEnvironmentColumn = {
    id: 'env1',
    name: 'Environment 1',
    minWidth: 100,
    maxWidth: 200,
    width: 150,
    renderCell: () => <></>,
}

const basePipeline: IPipelineInstance = {
    key: 'pipeline-1',
    name: 'Pipeline 1',
    uri: 'https://dev.azure.com/org/project/_build/results?buildId=1',
    environments: {
        env1: {
            value: 'Build 123',
            buildId: 1,
            uri: 'https://dev.azure.com/org/project/_build/results?buildId=1',
            result: TaskResult.Succeeded,
            finishTime: new Date('2025-06-29T12:00:00Z'),
            environmentId: 1,
            stageName: 'Stage 1',
        },
    },
}

describe('DeploymentTableCell', () => {
    it('renders the pipeline name cell', () => {
        render(<DeploymentTableCell columnIndex={0} tableColumn={{ ...baseColumn, id: 'name' }} tableItem={basePipeline} />)
        expect(screen.getByRole('link', { name: /Pipeline 1/i })).toBeInTheDocument()
    })

    it('renders the build name and finish date', () => {
        const { container } = render(
            <DeploymentTableCell columnIndex={1} tableColumn={baseColumn} tableItem={basePipeline} buildName="Build 123" />
        )

        expect(container).toMatchSnapshot()
    })

    it('renders the approval icon if approvalName is provided', async () => {
        render(
            <DeploymentTableCell
                columnIndex={1}
                tableColumn={baseColumn}
                tableItem={basePipeline}
                buildName="Build 123"
                approvalName="Jane Doe"
            />
        )
        // Find the icon by class or SVG
        const icon = document.querySelector('svg, .ms-Icon--ReceiptCheck')
        expect(icon).toBeInTheDocument()
    })

    it('renders a dash if no environment data', () => {
        const pipelineNoEnv: IPipelineInstance = {
            ...basePipeline,
            environments: {},
        }
        render(<DeploymentTableCell columnIndex={1} tableColumn={baseColumn} tableItem={pipelineNoEnv} />)
        expect(screen.getByText('-')).toBeInTheDocument()
    })
})
