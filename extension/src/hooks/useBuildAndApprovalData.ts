import { useState, useEffect } from 'react'
import { IPipelineInstance } from '../types'
import { getBuild, getBuildTimeline } from '../api/BuildClient'
import { getPipelineApprovals } from '../api/PipelineApprovalsClient'

interface BuildAndApprovalData {
    buildNames: Record<string, string>
    approvalNames: Record<string, string>
}

export const useBuildAndApprovalData = (pipelines: IPipelineInstance[], projectName?: string): BuildAndApprovalData => {
    const [buildNames, setBuildNames] = useState<Record<string, string>>({})
    const [approvalNames, setApprovalNames] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!projectName) return

        const newBuildNames: Record<string, string> = {}
        const newApprovalNames: Record<string, string> = {}

        async function fetchBuildAndApprovalData() {
            const pending: Array<Promise<void>> = []

            pipelines.forEach((pipeline) => {
                Object.keys(pipeline.environments).forEach((envName: string) => {
                    const deploymentInstance = pipeline.environments[envName]
                    const key = pipeline.key + ':' + envName

                    pending.push(
                        (async () => {
                            const build = await getBuild(projectName!, deploymentInstance.buildId!)
                            newBuildNames[key] = build?.buildNumber || deploymentInstance.value

                            if (!build) return

                            const buildId = build.id
                            const timeline = await getBuildTimeline(projectName!, deploymentInstance.buildId!)

                            if (!timeline) {
                                console.warn(`No timeline found for build ID: ${buildId}`)
                                return
                            }

                            // See if there are any Checkpoint.Approval records in the timeline
                            const approvalTimelineRecord = timeline.records.find((record) => record.type === 'Checkpoint.Approval')

                            if (!approvalTimelineRecord) {
                                console.warn(`No approval timeline record found for build ID: ${buildId}`)
                                return
                            }

                            const checkpointRecord = timeline.records.find((record) => record.id === approvalTimelineRecord.parentId)
                            if (!checkpointRecord) {
                                console.warn(`No checkpoint record found for approval timeline record ID: ${approvalTimelineRecord.id}`)
                                return
                            }

                            const stageRecord = timeline.records.find(
                                (record) =>
                                    record.id === checkpointRecord.parentId &&
                                    record.type === 'Stage' &&
                                    record.name === deploymentInstance.stageName
                            )
                            if (!stageRecord) {
                                // This is expected if there is no approval required for this stage
                                return
                            }

                            const approvals = await getPipelineApprovals(projectName!)

                            if (!approvals || approvals.length === 0) {
                                console.warn(`No approvals found for project: ${projectName}`)
                                return
                            }

                            const approval = approvals.find((a) => a.id === approvalTimelineRecord.id)

                            if (!approval) {
                                console.warn(`No approval found for timeline record ID: ${approvalTimelineRecord.id}`)
                                return
                            }

                            const approver = approval?.steps[0]?.actualApprover?.displayName

                            if (approver) {
                                newApprovalNames[key] = approver
                            } else {
                                console.warn(`No approver found for approval ID: ${approval.id}`)
                            }
                        })()
                    )
                })
            })

            await Promise.all(pending)
            setBuildNames(newBuildNames)
            setApprovalNames(newApprovalNames)
        }

        fetchBuildAndApprovalData()
    }, [pipelines, projectName])

    return { buildNames, approvalNames }
}
