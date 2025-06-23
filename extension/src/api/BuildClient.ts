import { getClient } from 'azure-devops-extension-api'
import { Build, BuildRestClient, Timeline } from 'azure-devops-extension-api/Build'

/**
 * Fetches a specific build by its ID from Azure DevOps.
 *
 * @param project - The name or ID of the Azure DevOps project.
 * @param buildId - The ID of the build to fetch.
 * @returns A Promise that resolves to the Build object if found, or undefined if not found.
 */
export async function getBuild(project: string, buildId: number): Promise<Build | undefined> {
    const buildClient = getClient(BuildRestClient)
    try {
        const build = await buildClient.getBuild(project, buildId)
        return build
    } catch (e) {
        // Could not fetch build
        return undefined
    }
}

/**
 * Fetch a build timeline by build ID from Azure DevOps.
 *
 * @param project - The name or ID of the Azure DevOps project.
 * @param buildId - The ID of the build for which to fetch the timeline.
 * @returns A Promise that resolves to the Timeline object if found, or undefined if not found
 */
export async function getBuildTimeline(project: string, buildId: number): Promise<Timeline | undefined> {
    const buildClient = getClient(BuildRestClient)
    try {
        const timeline = await buildClient.getBuildTimeline(project, buildId)
        return timeline
    } catch (e) {
        // Could not fetch timeline
        return undefined
    }
}
