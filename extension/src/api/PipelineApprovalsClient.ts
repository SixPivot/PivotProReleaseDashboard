import { getClient } from 'azure-devops-extension-api'
import { PipelineApprovalsRestClient } from './PipelineApprovalsRestClient'
import { Approval, ApprovalExpand, ApprovalStatus } from './PipelineApproval'

export async function getPipelineApprovals(projectName: string): Promise<Approval[]> {
    const approvalsClient = getClient(PipelineApprovalsRestClient)
    try {
        // Fetching all pipeline approvals for the project
        const approvals = await approvalsClient.getApprovals(projectName, ApprovalStatus.Approved, ApprovalExpand.Steps)
        return approvals || []
    } catch (error) {
        console.error('Error fetching pipeline approvals:', error)
        return []
    }
}
