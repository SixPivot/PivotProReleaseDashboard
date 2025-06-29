export enum ApprovalExpand {
    None = 'none',
    Permissions = 'permissions',
    Steps = 'steps',
}

// Approval status values from API documentation
export enum ApprovalStatus {
    All = 'all',
    Approved = 'approved',
    Canceled = 'canceled',
    Completed = 'completed',
    Failed = 'failed',
    Pending = 'pending',
    Rejected = 'rejected',
    Skipped = 'skipped',
    TimedOut = 'timedOut',
    Undefined = 'undefined',
    Uninitiated = 'uninitiated',
}

export interface ApprovalUser {
    displayName: string
    id: string
    uniqueName: string
    isContainer?: boolean
    descriptor?: string
}

export interface ApprovalStep {
    assignedApprover: ApprovalUser
    actualApprover?: ApprovalUser
    status: ApprovalStatus
    comment?: string
    lastModifiedOn: string
    order: number
    lastModifiedBy: ApprovalUser
    initiatedOn: string
    history: any[]
}

export interface ApprovalLinks {
    self: {
        href: string
    }
}

export interface ApprovalPipelineOwner {
    _links: {
        web: { href: string }
        self: { href: string }
    }
    id: number
    name: string
}

export interface ApprovalPipeline {
    owner: ApprovalPipelineOwner
    id: string
    name: string
}

export interface Approval {
    id: string
    steps: ApprovalStep[]
    status: ApprovalStatus
    createdOn: string
    lastModifiedOn: string
    executionOrder: string
    minRequiredApprovers: number
    blockedApprovers: ApprovalUser[]
    _links: ApprovalLinks
    pipeline: ApprovalPipeline
}
