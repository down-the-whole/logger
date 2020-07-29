module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                // 'loose': true,
                // 'debug': true,
                targets: {
                    node: 'current',
                },
            },
        ],
        '@babel/preset-typescript',
    ],
    plugins: [
        '@babel/plugin-syntax-dynamic-import',
    ],
}
