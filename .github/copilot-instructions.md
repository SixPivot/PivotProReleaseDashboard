# Copilot Instructions

This is an Azure DevOps extension project written using React 16 and TypeScript.

Source code for the extension is in the [`extension`](../extension) subdirectory.

Tests are written using [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and [Jest](https://jestjs.io/).

Tests are run using the `npm test` command, which runs the `test` script defined in `package.json`.

Tests are located under the `extensions/src` directory, and are named with the `.test.tsx` or `.test.ts` suffix.

The extension is built using the [Azure DevOps Extension SDK](https://developer.microsoft.com/en-au/azure-devops/develop/extensions)

