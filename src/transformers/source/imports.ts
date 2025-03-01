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

import { ImportDeclaration } from 'estree'
import { asyncWalk as walk } from 'estree-walker'
import MagicString from 'magic-string'
import { isImportDeclaration, parse } from '../../acorn.js'
import { Specifiers } from '../../parsing/import-specifiers.js'
import { literalName } from '../../parsing/literal-name.js'
import { SourceTransform } from '../../transform.js'

export class ImportTransform extends SourceTransform {
    name: string = 'ImportTransform'

    private mangle = async (node: ImportDeclaration, id: string) => {
        const name = literalName(node.source)
        const sourceId = this.mangler.sourceId((await this.context.resolve(name, id))?.id || name)
        const specifiers = Specifiers(node.specifiers)

        if (specifiers.default !== null) {
            this.mangler.mangle(specifiers.default, sourceId)
        }
        for (const specifier of specifiers.specific) {
            if (specifier.includes(' as ')) {
                const split = specifier.split(' as ')
                this.mangler.mangle(split[0], sourceId)
                this.mangler.mangle(split[1], sourceId)
            } else {
                this.mangler.mangle(specifier, sourceId)
            }
        }
        for (const specifier of specifiers.local) {
            this.mangler.mangle(specifier, sourceId)
        }
    }

    async transform(id: string, source: MagicString): Promise<MagicString> {
        const program = await parse(id, source.toString())
        const { mangle } = this

        // This is a two-part walk
        // 1. Identify all imports and rename them to indicate where they come from.
        // 2. Find usages of those imports and rename them.
        await walk(program, {
            async enter(node) {
                if (isImportDeclaration(node)) {
                    await mangle(node, id)
                }
            }
        })

        await this.mangler.execute(source, program)

        return source
    }
}
