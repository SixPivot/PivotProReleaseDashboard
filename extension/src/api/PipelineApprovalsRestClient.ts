import { IVssRestClientOptions } from 'azure-devops-extension-api'
import { RestClientBase } from 'azure-devops-extension-api/Common/RestClientBase'
import { ApprovalStatus, ApprovalExpand, Approval } from './PipelineApproval'

// Implementation of Approvals API - https://learn.microsoft.com/rest/api/azure/devops/approvalsandchecks/approvals?view=azure-devops-rest-7.1&WT.mc_id=DOP-MVP-5001655
export class PipelineApprovalsRestClient extends RestClientBase {
    constructor(options: IVssRestClientOptions) {
        super(options)
    }

    /**
     * List Approvals. This can be used to get a set of pending approvals in a pipeline, on an user or for a resource
     *
     * @param project - Project ID or project name
     * @param state - The state of the approvals to return (e.g., 'pending', 'approved', 'rejected')
     * @param expand - Expand options for the approvals. Default is None.
     * @param top - The maximum number of approvals to return
     */
    public async getApprovals(project: string, state?: ApprovalStatus, expand?: ApprovalExpand, top?: number): Promise<Approval[]> {
        const queryValues: any = {
            $expand: expand,
            $top: top,
            state: state,
        }

        return this.beginRequest<Approval[]>({
            apiVersion: '7.1',
            routeTemplate: '{project}/_apis/pipelines/approvals',
            routeValues: {
                project: project,
            },
            queryParams: queryValues,
        })
    }
}
