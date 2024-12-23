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

import MagicString from 'magic-string'
import { parse } from '../../acorn.js'
import { ChunkTransform } from '../../transform.js'
import { Range } from '../../types.js'

export default class ASITransform extends ChunkTransform {
    name = 'ASITransform'

    /**
     * Small reduction in semi-colons, removing from end of block statements.
     *
     * @param source source following closure compiler minification
     */
    async post(fileName: string, source: MagicString): Promise<MagicString> {
        const code = source.toString()
        const program = await parse(fileName, code)

        if (program.body) {
            const lastStatement = program.body[program.body.length - 1]
            if (lastStatement) {
                const [start, end] = lastStatement.range as Range
                if (lastStatement.type === 'EmptyStatement') {
                    source.remove(start, end)
                } else {
                    const lastStatementSource = code.substring(start, end)
                    if (lastStatementSource.endsWith(';')) {
                        source.overwrite(start, end, code.substring(start, end - 1))
                    }
                }
            }
        }

        return source
    }
}
