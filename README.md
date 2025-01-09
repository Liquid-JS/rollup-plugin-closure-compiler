# rollup-plugin-closure-compiler

[![GitHub license](https://img.shields.io/github/license/Liquid-JS/rollup-plugin-closure-compiler.svg)](https://github.com/Liquid-JS/rollup-plugin-closure-compiler/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/dm/@liquid-js/rollup-plugin-closure-compiler.svg)](https://www.npmjs.com/package/@liquid-js/rollup-plugin-closure-compiler)
[![scope](https://img.shields.io/npm/v/@liquid-js/rollup-plugin-closure-compiler.svg)](https://www.npmjs.com/package/@liquid-js/rollup-plugin-closure-compiler)

Leverage [Closure Compiler](https://developers.google.com/closure/compiler/) to minify and optimize JavaScript with [Rollup](https://rollupjs.org/guide/en).

Generally Closure Compiler will produce superior minification than other projects, but historically has been more difficult to use. The goal of this plugin is to reduce this friction.

## Installation

    npm install @liquid-js/rollup-plugin-closure-compiler --save-dev

## API Documentation

<https://liquid-js.github.io/rollup-plugin-closure-compiler/>

## Usage

Invoke Closure Compiler from your Rollup configuration.

```js
// rollup.config.js
import compiler from '@liquid-js/rollup-plugin-closure-compiler'

export default {
    input: 'main.js',
    output: {
        file: 'bundle.js',
        format: 'iife'
    },
    plugins: [
        compiler()
    ]
}
```

If you would like to provide additional [flags and options](https://github.com/google/closure-compiler/wiki/Flags-and-Options) to Closure Compiler, pass them via key-value pairs.

```js
// rollup.config.js
import compiler from '@liquid-js/rollup-plugin-closure-compiler'

export default {
    input: 'main.js',
    output: {
        file: 'bundle.js',
        format: 'iife'
    },
    plugins: [
        compiler({
            formatting: 'PRETTY_PRINT'
        })
    ]
}
```

### Automatic Closure Configuration

This plugin will modify the enable the `assume_function_wrapper` output option for Closure Compiler when `es` format is specifed to Rollup. **Note**: This is overrideable via passed flags and options.

```js
// rollup.config.js
import compiler from '@liquid-js/rollup-plugin-closure-compiler'

export default {
    input: 'main.js',
    output: {
        file: 'bundle.js',
        format: 'es'
    },
    plugins: [
        compiler()
    ]
}
```

If your Rollup configuration outputs an IIFE format bundle with a specified name, this plugin will add an extern to ensure the name does not get mangled. **Note**: This is overrideable via passed flags and options.

```js
// rollup.config.js
import compiler from '@liquid-js/rollup-plugin-closure-compiler'

export default {
    input: 'main.js',
    output: {
        file: 'bundle.js',
        format: 'iife',
        name: 'MyAwesomeThing'
    },
    plugins: [
        compiler()
    ]
}
```
