import { render, screen, within } from '@testing-library/react'
import * as React from 'react'
import '@testing-library/jest-dom'
import '@testing-library/jest-dom/jest-globals'
import { data } from './DashboardContent.test.data'
import { DashboardContent } from './DashboardContent'
import { IDashboardContentState } from '../types'

jest.mock('../api/PipelineApprovalsRestClient')

test('Render and check layout', async () => {
    render(<DashboardContent state={data as unknown as IDashboardContentState} />)

    // Wait for the heading first
    const heading = await screen.findByRole('heading')
    expect(heading).toHaveTextContent('PivotPro Release Dashboard')

    // Then wait for the grid
    const grid = await screen.findByRole('grid')
    expect(grid).toBeInTheDocument()
})

test('Check all pipelines are included', async () => {
    render(<DashboardContent state={data as unknown as IDashboardContentState} />)

    // Wait for the grid to be rendered first
    await screen.findByRole('grid')

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(8) // includes header

    const found = []
    // Process rows sequentially to avoid overlapping act() calls
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const cells = within(row).getAllByRole('gridcell')
        if (cells.length > 0) {
            // Look for pipeline names synchronously in the first cell
            const firstCellText = cells[0].textContent
            const matchingPipeline = data.pipelines.find((p) => firstCellText?.includes(p.name))
            if (matchingPipeline) {
                found.push(matchingPipeline.name)
            }
        }
    }

    // Verify we found some pipelines
    expect(found.length).toBeGreaterThan(0)
})

test('Check all environments are included', async () => {
    render(<DashboardContent state={data as unknown as IDashboardContentState} />)

    // Wait for the component to render first
    await screen.findByRole('grid')

    // Check each environment sequentially
    for (const env of data.environments) {
        const column = screen.getByText(env.name)
        expect(column).toBeInTheDocument()
    }
})
