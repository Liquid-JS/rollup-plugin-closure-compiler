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

import { CompileOptions } from 'google-closure-compiler'
import { OutputOptions } from 'rollup'
import { log } from './debug.js'
import { writeTempFile } from './temp-file.js'
import { ChunkTransform } from './transform.js'
import { PluginOptions } from './types.js'

export const ERROR_WARNINGS_ENABLED_LANGUAGE_OUT_UNSPECIFIED =
    'Providing the warning_level=VERBOSE compile option also requires a valid language_out compile option.'
export const ERROR_WARNINGS_ENABLED_LANGUAGE_OUT_INVALID =
    'Providing the warning_level=VERBOSE and language_out=NO_TRANSPILE compile options will remove warnings.'
const OPTIONS_TO_REMOVE_FOR_CLOSURE = ['remove_strict_directive']

/**
 * Checks if output format is ESM
 *
 * @param outputOptions
 * @return boolean
 */
export const isESMFormat = ({ format }: OutputOptions): boolean => format === 'esm' || format === 'es'

/**
 * Throw Errors if compile options will result in unexpected behaviour.
 *
 * @param compileOptions
 */
function validateCompileOptions(compileOptions: CompileOptions): void {
    if ('warning_level' in compileOptions && compileOptions.warning_level === 'VERBOSE') {
        if (!('language_out' in compileOptions)) {
            throw new Error(ERROR_WARNINGS_ENABLED_LANGUAGE_OUT_UNSPECIFIED)
        }
        if (compileOptions.language_out === 'NO_TRANSPILE') {
            throw new Error(ERROR_WARNINGS_ENABLED_LANGUAGE_OUT_INVALID)
        }
    }
}

/**
 * Normalize the compile options given by the user into something usable.
 *
 * @param compileOptions
 */
function normalizeExternOptions(compileOptions: CompileOptions): [string[], CompileOptions] {
    validateCompileOptions(compileOptions)
    let externs: string[] = []

    if ('externs' in compileOptions) {
        switch (typeof compileOptions.externs) {
            case 'boolean':
                externs = []
                break
            case 'string':
                externs = [compileOptions.externs as string]
                break
            default:
                externs = compileOptions.externs as string[]
                break
        }

        delete compileOptions.externs
    }

    if (compileOptions) {
        for (const optionToDelete of OPTIONS_TO_REMOVE_FOR_CLOSURE) {
            if (optionToDelete in compileOptions) {
                // @ts-ignore
                delete compileOptions[optionToDelete]
            }
        }
    }

    return [externs, compileOptions]
}

/**
 * Pluck the PluginOptions from the CompileOptions
 *
 * @param compileOptions
 */
export function pluckPluginOptions(compileOptions: CompileOptions): PluginOptions {
    const pluginOptions: PluginOptions = {}
    if (!compileOptions) {
        return pluginOptions
    }

    for (const optionToDelete of OPTIONS_TO_REMOVE_FOR_CLOSURE) {
        if (optionToDelete in compileOptions) {
            // @ts-ignore
            pluginOptions[optionToDelete] = compileOptions[optionToDelete]
        }
    }
    return pluginOptions
}

/**
 * Generate default Closure Compiler CompileOptions an author can override if they wish.
 * These must be derived from configuration or input sources.
 *
 * @param transformers
 * @param options
 * @return derived CompileOptions for Closure Compiler
 */
export const defaults = async (
    options: OutputOptions,
    providedExterns: string[],
    transformers: ChunkTransform[] | null
): Promise<CompileOptions> => {
    // Defaults for Rollup Projects are slightly different than Closure Compiler defaults.
    // - Users of Rollup tend to transpile their code before handing it to a minifier,
    // so no transpile is default.
    // - When Rollup output is set to "es|esm" it is expected the code will live in a ES Module,
    // so safely be more aggressive in minification.

    const transformerExterns: string[] = []
    for (const transform of transformers || []) {
        const extern = transform.extern(options)
        if (extern !== null) {
            const writtenExtern = await writeTempFile(extern)
            transformerExterns.push(writtenExtern)
        }
    }

    return {
        language_out: 'NO_TRANSPILE',
        assume_function_wrapper: isESMFormat(options),
        warning_level: 'QUIET',
        module_resolution: 'NODE',
        externs: transformerExterns.concat(providedExterns)
    }
}

/**
 * Compile Options is the final configuration to pass into Closure Compiler.
 * defaultCompileOptions are overrideable by ones passed in directly to the plugin
 * but the js source and sourcemap are not overrideable, since this would break the output if passed.
 *
 * @param compileOptions
 * @param outputOptions
 * @param code
 * @param transforms
 */
export default async (incomingCompileOptions: CompileOptions, outputOptions: OutputOptions, code: string, transforms: ChunkTransform[] | null): Promise<[CompileOptions, string]> => {
    const mapFile: string = await writeTempFile('', '', false)
    const [externs, compileOptions] = normalizeExternOptions({ ...incomingCompileOptions })

    const options = {
        ...(await defaults(outputOptions, externs, transforms)),
        ...compileOptions,
        js: await writeTempFile(code),
        create_source_map: mapFile
    }

    log('compile options', options)

    return [options, mapFile]
}
