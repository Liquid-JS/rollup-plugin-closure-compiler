/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from 'fs'
import * as path from 'path'
import test from 'ava'
import * as rollup from 'rollup'
import * as transpiled from '../src/index.js'

const { default: compiler } = transpiled

const DEFAULT_CLOSURE_OPTIONS = { default: {} }
const PRETTY_PRINT_CLOSURE_OPTIONS = {
    pretty: {
        formatting: 'PRETTY_PRINT'
    }
}
const ADVANCED_CLOSURE_OPTIONS = {
    advanced: {
        compilation_level: 'ADVANCED_OPTIMIZATIONS',
        language_out: 'ECMASCRIPT_2015'
    }
}
const ES5_STRICT_CLOSURE_OPTIONS = {
    es5: {
        language_out: 'ECMASCRIPT5_STRICT'
    }
}
const defaultClosureFlags = {
    ...DEFAULT_CLOSURE_OPTIONS,
    ...PRETTY_PRINT_CLOSURE_OPTIONS,
    ...ADVANCED_CLOSURE_OPTIONS,
    ...ES5_STRICT_CLOSURE_OPTIONS
}

const ES_OUTPUT = 'es'
const ESM_OUTPUT = 'esm'

const longest = strings =>
    (strings.length > 0 ? strings.sort((a, b) => b.length - a.length)[0] : strings[0]).length
const fixtureLocation = (category, name, format, optionsKey, minified = false) =>
    `test/${category}/fixtures/${minified
        ? `${name}.${format === ES_OUTPUT ? ESM_OUTPUT : format}.${optionsKey}.js`
        : `${name}.js`
    }`

async function compile(category, name, codeSplit, closureFlags, optionKey, format, wrapper, banner) {
    const bundle = await rollup.rollup({
        input: fixtureLocation(category, name, format, optionKey, false),
        plugins: [compiler(closureFlags[optionKey])],
        external: ['lodash', 'lodash2', 'lodash3', './external.js', './external-default.js'],
        experimentalCodeSplitting: codeSplit,
        onwarn: _ => null
    })

    const bundles = await bundle.generate({
        format,
        name: wrapper,
        sourcemap: false,
        banner
    })

    const output = []
    if (bundles.output) {
        for (const file in bundles.output) {
            const minified = await fs.promises.readFile(
                path.join(
                    fixtureLocation(
                        category,
                        path.parse(bundles.output[file].fileName).name,
                        format,
                        optionKey,
                        true
                    )
                ),
                'utf8'
            )
            output.push({
                minified,
                code: bundles.output[file].code
            })
        }
    } else {
        const minified = await fs.promises.readFile(
            path.join(
                fixtureLocation(category, path.parse(bundles.fileName).name, format, optionKey, true)
            ),
            'utf8'
        )
        output.push({
            minified,
            code: bundles.code
        })
    }

    return output
}

function generate(shouldFail, category, name, codeSplit, formats, closureFlags, wrapper, banner) {
    const targetLength = longest(formats)
    const optionLength = longest(Object.keys(closureFlags))

    for (const format of formats) {
        for (const optionKey of Object.keys(closureFlags)) {
            const method = shouldFail ? test.serial.failing : test.serial
            method(
                `${name} – ${format.padEnd(targetLength)} – ${optionKey.padEnd(optionLength)}`,
                async t => {
                    const output = await compile(
                        category,
                        name,
                        codeSplit,
                        closureFlags,
                        optionKey,
                        format,
                        wrapper,
                        banner
                    )

                    t.plan(output.length)
                    for (const result of output) {
                        t.is(result.code.replace(/\r\n/g, '\n'), result.minified.replace(/\r\n/g, '\n'))
                    }
                }
            )
        }
    }
}

function failureGenerator(
    category,
    name,
    codeSplit = false,
    formats = [ESM_OUTPUT],
    closureFlags = defaultClosureFlags,
    wrapper = null,
    banner = null
) {
    generate(true, category, name, codeSplit, formats, closureFlags, wrapper, banner)
}

function generator(
    category,
    name,
    codeSplit = false,
    formats = [ESM_OUTPUT],
    closureFlags = defaultClosureFlags,
    wrapper = null,
    banner = null
) {
    generate(false, category, name, codeSplit, formats, closureFlags, wrapper, banner)
}

export {
    DEFAULT_CLOSURE_OPTIONS,
    PRETTY_PRINT_CLOSURE_OPTIONS,
    ADVANCED_CLOSURE_OPTIONS,
    ES5_STRICT_CLOSURE_OPTIONS,
    ES_OUTPUT,
    ESM_OUTPUT,
    generator,
    failureGenerator,
    compile
}
