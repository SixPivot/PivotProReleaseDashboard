/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    verbose: true,
    testEnvironment: 'jsdom',
    preset: 'ts-jest',
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {}],
        '^.+\\.(js|jsx)?$': ['babel-jest', {}],
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.js',
        '\\.(css|less|scss)$': '<rootDir>/src/__mocks__/styleMock.js',
    },
    transformIgnorePatterns: ['node_modules/(?!(azure-devops-ui|azure-devops-extension-sdk)/)'],
    testTimeout: 10000,
    forceExit: true,
    detectOpenHandles: true,
}
