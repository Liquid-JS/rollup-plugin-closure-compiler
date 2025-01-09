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

import { readFile } from 'fs/promises'
import typescript from '@rollup/plugin-typescript'
//@ts-ignore
import builtins from 'builtins'
import { RollupOptions } from 'rollup'

const pkg = JSON.parse(await readFile('./package.json', 'utf8'))

export default new Array<RollupOptions>({
    input: './src/index.ts',
    external: [
        ...builtins(),
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {})
    ],
    output: [
        {
            file: './lib/index.mjs',
            format: 'es'
        },
        {
            file: './lib/index.cjs',
            format: 'cjs'
        }
    ],
    plugins: [
        typescript({
            declaration: true,
            declarationDir: './lib/',
            inlineSources: true,
            tsconfig: 'tsconfig.lib.json'
        })
    ]
})
