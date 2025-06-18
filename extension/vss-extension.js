const manifest = require('./vss-extension.json')

module.exports = (env) => {
    const [idPostfix, namePostfix] = env.mode == 'development' ? ['-dev', ' (Dev)'] : env.mode == 'test' ? ['-test', ' (Test)'] : ['', '']

    const testManifest = {
        ...manifest,
        contributions: manifest.contributions.map((contribution) =>
            contribution.id === 'deployment-dashboard'
                ? {
                      ...contribution,
                      properties: {
                          ...contribution.properties,
                          name: `PivotPro Release Dashboard${namePostfix}`,
                      },
                  }
                : contribution
        ),
    }

    testManifest.id = 'sixpivot-release-dashboard' + idPostfix
    testManifest.name = 'SixPivot Release Dashboard' + namePostfix
    testManifest.publisher = 'SixPivot'

    if (idPostfix !== '') {
        testManifest.public = false
    }

    if (env.mode === 'development') {
        testManifest.baseUri = 'https://localhost:3000'
    }

    testManifest.name += namePostfix

    return testManifest
}
