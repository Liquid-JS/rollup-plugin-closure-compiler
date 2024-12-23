/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
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

import { OutputOptions } from 'rollup'
import { ChunkTransform } from '../../transform.js'

const HEADER = `/**
* @fileoverview Externs built via derived configuration from Rollup or input code.
* This extern contains the cjs typing info for modules.
* @externs
*/

/**
* @typedef {{
*   __esModule: boolean,
* }}
*/
var exports;`

/**
 * This Transform will apply only if the Rollup configuration is for a cjs output.
 *
 * In order to preserve the __esModules boolean on an Object, this typedef needs to be present.
 */
export default class CJSTransform extends ChunkTransform {
    name = 'CJSTransform'

    extern(options: OutputOptions): string | null {
        if (options.format === 'cjs') {
            return HEADER
        }

        return null
    }
}
