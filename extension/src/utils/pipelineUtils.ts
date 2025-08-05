import { IPipelineInstance } from '../types'

/**
 * Generates a unique key for a pipeline-environment combination
 */
export const generatePipelineEnvironmentKey = (pipeline: IPipelineInstance, environmentName: string): string => {
    return pipeline.key + ':' + environmentName
}

/**
 * Extracts build name and approval name for a specific pipeline-environment combination
 */
export const extractBuildAndApprovalNames = (
    pipeline: IPipelineInstance,
    environmentName: string,
    buildNames: Record<string, string>,
    approvalNames: Record<string, string>
): { buildName: string | undefined; approvalName: string | undefined } => {
    const env = pipeline.environments[environmentName]
    if (!env) {
        return { buildName: undefined, approvalName: undefined }
    }

    const key = generatePipelineEnvironmentKey(pipeline, environmentName)
    const buildName = buildNames[key] || env.value
    const approvalName = approvalNames[key]

    return { buildName, approvalName }
}
