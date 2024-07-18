import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { getClient } from "azure-devops-extension-api";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines/PipelinesClient";
import { TaskAgentRestClient } from "azure-devops-extension-api/TaskAgent";
import {
  DashboardEnvironmentPipelineInfo,
  EnvironmentPipelines,
  PipelineInfo,
} from "./types";
import moment = require("moment");

const project = "ReleaseDashboard";
export async function getPipelines(): Promise<DashboardEnvironmentPipelineInfo> {
  const taskAgentClient = getClient(TaskAgentRestClient);
  const pipelinesClient = getClient(PipelinesRestClient);

  const [pipelines, environments] = await Promise.all([
    pipelinesClient.listPipelines(project),
    taskAgentClient.getEnvironments(project),
  ]);

  const environmentPipelines: EnvironmentPipelines[] = [];
  for (const environment of environments) {
    const deployments =
      await taskAgentClient.getEnvironmentDeploymentExecutionRecords(
        project,
        environment.id
      );
    const environmentPipeline: EnvironmentPipelines = {
      name: environment.name,
      pipelines: {},
    };
    for (const deployment of deployments) {
      if (!environmentPipeline.pipelines[deployment.definition.name]) {
        const pipeline = pipelines.find(
          (p) => p.id == deployment.definition.id
        );
        environmentPipeline.pipelines[deployment.definition.name] = {
          deployment: deployment,
          pipeline: pipeline,
        };
      }
    }
    environmentPipelines.push(environmentPipeline);
  }

  const rows = generateRows(environmentPipelines);
  return {
    environments: environmentPipelines,
    pipelines: new ArrayItemProvider(rows),
  };
}

function generateRows(
  environments: EnvironmentPipelines[]
): Array<PipelineInfo> {
  const rows: Array<PipelineInfo> = [];

  for (const environment of environments) {
    for (const pipelineName of Object.keys(environment.pipelines)) {
      let row = rows.find((pr) => pr.name == pipelineName);

      if (!row) {
        row = { name: pipelineName, environments: {} };
        rows.push(row);
      }

      console.log(row);
      var finishDate = environment.pipelines[pipelineName].deployment
        .finishTime as Date;

      row.environments[environment.name] = {
        value: environment.pipelines[pipelineName].deployment.owner.name,
        finishTime: finishDate
          ? moment(finishDate).format("d MMM yyyy, hh:mm A")
          : "",
        result: environment.pipelines[pipelineName].deployment.result,
        folder: environment.pipelines[pipelineName].pipeline?.folder,
      };
    }
  }

  //console.log(rows);

  return rows;
}