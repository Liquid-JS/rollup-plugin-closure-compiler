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
import * as transpiled from '../../src/index.js'

const { default: compiler } = transpiled

test('remove strict declaration from .mjs input', async (t) => {
    const bundle = await rollup.rollup({
        input: 'test/strict-removal/fixtures/mjs-suffix.mjs',
        plugins: [compiler()],
        onwarn: (_) => null
    })

    const bundles = await bundle.generate({
        format: 'iife',
        name: 'modular',
        sourcemap: false,
        file: 'mjs-suffix.iife.default.mjs'
    })

    const output = []
    if (bundles.output) {
        for (const file in bundles.output) {
            const minified = await fs.promises.readFile(
                path.join('test/strict-removal/fixtures/mjs-suffix.iife.default.mjs'),
                'utf8'
            )
            output.push({
                minified,
                code: bundles.output[file].code
            })
        }
    }

    t.plan(output.length)
    for (const result of output) {
        t.is(result.code.replace(/\r\n/g, '\n'), result.minified.replace(/\r\n/g, '\n'))
    }
})
