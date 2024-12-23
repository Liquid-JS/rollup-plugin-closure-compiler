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

import gcc, { CompileOptions } from 'google-closure-compiler'
const { compiler } = gcc
//@ts-ignore
import * as gccUtils from 'google-closure-compiler/lib/utils.js'
import { RenderedChunk } from 'rollup'
import { ChunkTransform } from './transform.js'
import { postCompilation } from './transformers/chunk/transforms.js'
const { getNativeImagePath, getFirstSupportedPlatform } = gccUtils

enum Platform {
    NATIVE = 'native',
    JAVA = 'java',
    JAVASCRIPT = 'javascript'
}
const DEFAULT_PLATFORM_PRECEDENCE = [Platform.NATIVE, Platform.JAVA, Platform.JAVASCRIPT]

/**
 * Splits user `platform` option from compiler options object
 * returns new object containing options and preferred platform.
 *
 * @param content - compiler options object
 * @return
 * @example in rollup.config.js
 *  compiler({
 *    platform: 'javascript',
 *  }),
 */
function filterContent(content: CompileOptions): [CompileOptions, Platform] {
    let platform: string = ''
    if ('platform' in content && typeof content.platform === 'string') {
        platform = content.platform
        delete content.platform
    }
    return [content, platform as Platform]
}

/**
 * Reorders platform preferences based on configuration.
 *
 * @param platformPreference - preferred platform string
 * @return
 */
function orderPlatforms(platformPreference: Platform | string): Platform[] {
    if (platformPreference === '') {
        return DEFAULT_PLATFORM_PRECEDENCE
    }

    const index = DEFAULT_PLATFORM_PRECEDENCE.indexOf(platformPreference as Platform)
    const newPlatformPreferences = DEFAULT_PLATFORM_PRECEDENCE.splice(index, 1)
    return newPlatformPreferences.concat(DEFAULT_PLATFORM_PRECEDENCE)
}

/**
 * Run Closure Compiler and `postCompilation` Transforms on input source.
 *
 * @param compileOptions Closure Compiler CompileOptions, normally derived from Rollup configuration
 * @param transforms Transforms to run rollowing compilation
 * @return Promise<string> source following compilation and Transforms.
 */
export default (compileOptions: CompileOptions, chunk: RenderedChunk, transforms: ChunkTransform[]): Promise<string> => new Promise((resolve: (stdOut: string) => void, reject: (error: any) => void) => {
    const [config, platform] = filterContent(compileOptions)
    const instance = new compiler(config)
    const firstSupportedPlatform = getFirstSupportedPlatform(orderPlatforms(platform))

    if (firstSupportedPlatform !== Platform.JAVA) {
        // TODO(KB): Provide feedback on this API. It's a little strange to nullify the JAR_PATH
        // and provide a fake java path.
        //@ts-ignore
        instance.JAR_PATH = null
        instance.javaPath = getNativeImagePath()
    }

    instance.run(async (exitCode: number, code: string, stdErr: string) => {
        if ('warning_level' in compileOptions && compileOptions.warning_level === 'VERBOSE' && stdErr !== '') {
            reject(new Error(`Google Closure Compiler ${stdErr}`))
        } else if (exitCode !== 0) {
            reject(new Error(`Google Closure Compiler exit ${exitCode}: ${stdErr}`))
        } else {
            const postCompiled = await postCompilation(code, chunk, transforms)
            resolve(postCompiled.code)
        }
    })
})
