import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import { Config } from '../config'

export const InitTelemetry = () => {
    try {
        const appInsights = new ApplicationInsights({
            config: {
                connectionString: Config.applicationInsightsConnectionString,
            },
        })
        appInsights.loadAppInsights()
    } catch (ex) {
        console.error(ex)
        console.warn('Could not initialize application insights')
    }
}
