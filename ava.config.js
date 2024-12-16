export default () => ({
    files: [
        'test/**/*.test.js'
    ],
    nodeArguments: [
        '--import=ts-node-maintained/register/esm'
    ],
    environmentVariables: {
        TS_NODE_TRANSPILE_ONLY: 'true'
    },
    verbose: true
})
