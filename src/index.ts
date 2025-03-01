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

import { promises as fsPromises } from 'fs'
import { CompileOptions, CompileOption } from 'google-closure-compiler'
import { InputOptions, OutputOptions, Plugin, PluginContext, RenderedChunk, TransformResult } from 'rollup'
import compiler from './compiler.js'
import options from './options.js'
import { SourceTransform } from './transform.js'
import { create as createChunkTransforms, preCompilation } from './transformers/chunk/transforms.js'
import { Ebbinghaus } from './transformers/ebbinghaus.js'
import { Mangle } from './transformers/mangle.js'
import { create as createSourceTransforms, transform as sourceTransform } from './transformers/source/transforms.js'

export {
    CompileOptions,
    CompileOption
}

export default function closureCompiler(requestedCompileOptions: CompileOptions = {}): Plugin {
    const mangler: Mangle = new Mangle()
    const memory: Ebbinghaus = new Ebbinghaus()
    let inputOptions: InputOptions
    let context: PluginContext
    let sourceTransforms: SourceTransform[]

    return {
        name: 'closure-compiler',
        options: (newOptions) => (inputOptions = newOptions),
        buildStart() {
            context = this
            sourceTransforms = createSourceTransforms(context, requestedCompileOptions, mangler, memory, inputOptions, {})
            if (
                'compilation_level' in requestedCompileOptions &&
                requestedCompileOptions.compilation_level === 'ADVANCED_OPTIMIZATIONS' &&
                Array.isArray(inputOptions.input)
            ) {
                context.warn('Code Splitting with Closure Compiler ADVANCED_OPTIMIZATIONS is not currently supported.')
            }
        },
        transform: async (code: string, id: string): Promise<TransformResult> => {
            if (sourceTransforms.length > 0) {
                const output = await sourceTransform(code, id, sourceTransforms)
                return output || null
            }
            return null
        },
        renderChunk: async (code: string, chunk: RenderedChunk, outputOptions: OutputOptions) => {
            mangler.debug()

            const renderChunkTransforms = createChunkTransforms(
                context,
                requestedCompileOptions,
                mangler,
                memory,
                inputOptions,
                outputOptions
            )
            const preCompileOutput = (await preCompilation(code, chunk, renderChunkTransforms)).code
            const [compileOptions, mapFile] = await options(
                requestedCompileOptions,
                outputOptions,
                preCompileOutput,
                renderChunkTransforms
            )

            try {
                return {
                    code: await compiler(compileOptions, chunk, renderChunkTransforms),
                    map: JSON.parse(await fsPromises.readFile(mapFile, 'utf8'))
                }
            } catch (error) {
                throw error
            }
        }
    }
}
