import { getClient } from 'azure-devops-extension-api'
import { BuildRestClient } from 'azure-devops-extension-api/Build'

export async function getBuildName(project: string, buildId: number): Promise<string | undefined> {
    const buildClient = getClient(BuildRestClient)
    try {
        const build = await buildClient.getBuild(project, buildId)
        return build.buildNumber
    } catch (e) {
        // Could not fetch build
        return undefined
    }
}
