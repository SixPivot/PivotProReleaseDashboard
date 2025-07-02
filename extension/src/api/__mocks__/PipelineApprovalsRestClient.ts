// mock PipelineApprovalsRestClient for testing purposes
export class PipelineApprovalsRestClient {
    constructor() {}
    public async getApprovals(_project: string, _state?: string, _expand?: string, _top?: number): Promise<any[]> {
        // Mock implementation returning an empty array
        return []
    }
}
