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

import * as crypto from 'crypto'
import { BaseNode, Program } from 'estree'
import { asyncWalk as walk } from 'estree-walker'
import MagicString from 'magic-string'
import { isBlockStatement, isExportNamedDeclaration, isIdentifier, isVariableDeclarator } from '../acorn.js'
import { log } from '../debug.js'
import { Range } from '../types.js'

type OriginalSourcePath = string
type SourcePathId = string
type OriginalName = string
type MangledName = string

function createId(source: string): string {
    const hash = crypto.createHash('sha1')
    hash.update(source)
    return 'f_' + hash.digest('hex')
}

function mangledValue(name: string, sourceId: string): string {
    return `${name}_${sourceId}`
}

export class Mangle {
    private sourceToId: Map<OriginalSourcePath, SourcePathId> = new Map()
    private idToSource: Map<SourcePathId, OriginalSourcePath> = new Map()
    private nameToMangled: Map<OriginalName, MangledName> = new Map()
    private mangledToName: Map<MangledName, OriginalName> = new Map()

    debug = () => {
        log('mangle state', {
            sourceToId: this.sourceToId,
            idToSource: this.idToSource,
            nameToMangled: this.nameToMangled,
            mangledToName: this.mangledToName
        })
    }

    sourceId = (source: string): string => {
        let uuid = this.sourceToId.get(source)
        if (!uuid) {
            this.sourceToId.set(source, (uuid = createId(source)))
            this.idToSource.set(uuid, source)
        }

        return uuid
    }

    mangle = (name: string, sourceId: string): string => {
        const mangled = mangledValue(name, sourceId)
        const stored = this.nameToMangled.get(name)

        if (stored && stored !== mangled) {
            console.log('SetIdentifier for Mangled Name more than once', { name, sourceId })
        } else {
            this.nameToMangled.set(name, mangled)
            this.mangledToName.set(mangled, name)
        }

        return mangled
    }

    getMangledName = (originalName: string): string | undefined => this.nameToMangled.get(originalName)

    getName = (maybeMangledName: string): string | undefined => this.mangledToName.get(maybeMangledName)

    getSource = (sourceId: string): string | undefined => this.idToSource.get(sourceId)

    execute = async (source: MagicString, program: Program): Promise<void> => {
        const { getMangledName } = this
        const mangleable: Array<Set<string>> = [new Set([...this.nameToMangled.keys()])]
        let insideNamedExport: boolean = false

        await walk(program, {
            async enter(node: BaseNode) {
                const currentlyRewriteable = mangleable[mangleable.length - 1]
                if (isBlockStatement(node)) {
                    mangleable.push(new Set(currentlyRewriteable))
                }

                if (isExportNamedDeclaration(node)) {
                    insideNamedExport = true
                }

                if (!insideNamedExport && isVariableDeclarator(node) && isIdentifier(node.id)) {
                    currentlyRewriteable.delete(node.id.name)
                }

                if (isIdentifier(node) && currentlyRewriteable.has(node.name)) {
                    const [start, end] = node.range as Range
                    source.overwrite(start, end, getMangledName(node.name) || node.name)
                }
            },
            async leave(node: BaseNode) {
                if (isBlockStatement(node)) {
                    mangleable.pop()
                }
                if (isExportNamedDeclaration(node)) {
                    insideNamedExport = false
                }
            }
        })
    }
}
