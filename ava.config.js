export default () => ({
    files: [
        'test/**/*.test.js'
    ],
    nodeArguments: [
        '--loader=ts-node/esm'
    ],
    environmentVariables: {
        TS_NODE_TRANSPILE_ONLY: 'true'
    },
    verbose: true
})
