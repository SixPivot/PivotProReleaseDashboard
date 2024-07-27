import { getClient } from 'azure-devops-extension-api'
import { TaskAgentRestClient } from 'azure-devops-extension-api/TaskAgent'
import { sortByConvention } from '../../api/Utilities'
import { IEnvironmentInstance } from '../../api/types'

/**
 * Fetchs enviroments from pipelines
 * @param projectName : project name
 * @returns Promise: Array of IEnvironmentInstance
 */
export async function getEnvironmentsSortedByConvention(projectName: string): Promise<IEnvironmentInstance[]> {
    const taskAgentClient = getClient(TaskAgentRestClient)

    const environments = (await taskAgentClient.getEnvironments(projectName)).map((i) => {
        return {
            name: i.name,
        } as IEnvironmentInstance
    })
    return sortByConvention(environments) as IEnvironmentInstance[]
}
