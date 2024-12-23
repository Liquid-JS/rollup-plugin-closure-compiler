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

import {
    AssignmentExpression,
    ExportDefaultDeclaration,
    ExportNamedDeclaration,
    Identifier,
    MemberExpression,
    Node
} from 'estree'
import MagicString from 'magic-string'
import { parse, walk } from '../../acorn.js'
import { isESMFormat } from '../../options.js'
import {
    DefaultDeclaration,
    NamedDeclaration,
    NodeIsPreservedExport,
    PreservedExportName
} from '../../parsing/export-details.js'
import { PreserveDefault } from '../../parsing/preserve-default-export.js'
import { PreserveNamedConstant } from '../../parsing/preserve-named-constant-export.js'
import { ChunkTransform } from '../../transform.js'
import { ExportClosureMapping, ExportDetails, Range, TransformInterface } from '../../types.js'

const EXTERN_OVERVIEW = `/**
* @fileoverview Externs built via derived configuration from Rollup or input code.
* @externs
*/`

/**
 * This Transform will apply only if the Rollup configuration is for 'esm' output.
 *
 * In order to preserve the export statements:
 * 1. Create extern definitions for them (to keep them their names from being mangled).
 * 2. Insert additional JS referencing the exported names on the window scope
 * 3. After Closure Compilation is complete, replace the window scope references with the original export statements.
 */
export default class ExportTransform extends ChunkTransform implements TransformInterface {
    name = 'ExportTransform'
    private originalExports: Map<string, ExportDetails> = new Map()
    private currentSourceExportCount: number = 0

    /**
     * Store an export from a source into the originalExports Map.
     *
     * @param mapping mapping of details from this declaration.
     */
    private storeExport = (mapping: ExportDetails[]): void =>
        mapping.forEach((map) => {
            if (map.source === null) {
                this.currentSourceExportCount++
                this.originalExports.set(map.local, map)
            } else {
                this.originalExports.set(map.exported, map)
            }
        })

    private static storeExportToAppend(
        collected: Map<string | null, string[]>,
        exportDetails: ExportDetails
    ): Map<string | null, string[]> {
        const update = collected.get(exportDetails.source) || []

        if (exportDetails.exported === exportDetails.local) {
            update.push(exportDetails.exported)
        } else {
            update.push(`${exportDetails.local} as ${exportDetails.exported}`)
        }
        collected.set(exportDetails.source, update)

        return collected
    }

    private async deriveExports(fileName: string, code: string): Promise<void> {
        const program = await parse(fileName, code)

        walk.simple(program, {
            ExportNamedDeclaration: (node: ExportNamedDeclaration) => {
                this.storeExport(NamedDeclaration(node, this.mangler.getName))
            },
            ExportDefaultDeclaration: (node: ExportDefaultDeclaration) => {
                this.storeExport(DefaultDeclaration(node, this.mangler.getName))
            },
            ExportAllDeclaration: () => {
                // TODO(KB): This case `export * from "./import"` is not currently supported.
                this.context.error(
                    new Error('Rollup Plugin Closure Compiler does not support export all syntax for externals.')
                )
            }
        })
    }

    extern(): string | null {
        if (Array.from(this.originalExports.keys()).length > 0) {
            let output = EXTERN_OVERVIEW

            for (const key of this.originalExports.keys()) {
                const value: ExportDetails = this.originalExports.get(key) as ExportDetails
                if (value.source !== null) {
                    output += `function ${value.exported}(){};\n`
                }
            }

            return output
        }

        return null
    }

    /**
     * Before Closure Compiler modifies the source, we need to ensure it has window scoped
     * references to the named exports. This prevents Closure from mangling their names.
     *
     * @param code source to parse, and modify
     * @param chunk OutputChunk from Rollup for this code.
     * @param id Rollup id reference to the source
     * @return modified input source with window scoped references.
     */
    async pre(fileName: string, source: MagicString): Promise<MagicString> {
        if (!isESMFormat(this.outputOptions)) {
            return super.pre(fileName, source)
        }

        const code = source.toString()
        await this.deriveExports(fileName, code)

        for (const key of this.originalExports.keys()) {
            const value: ExportDetails = this.originalExports.get(key) as ExportDetails

            // Remove export statements before Closure Compiler sees the code
            // This prevents CC from transpiling `export` statements when the language_out is set to a value
            // where exports were not part of the language.
            source.remove(...value.range)
            // Window scoped references for each key are required to ensure Closure Compilre retains the code.
            if (value.source === null) {
                source.append(`\nwindow['${value.local}'] = ${value.local};`)
            } else {
                source.append(`\nwindow['${value.exported}'] = ${value.exported};`)
            }
        }

        return source
    }

    /**
     * After Closure Compiler has modified the source, we need to replace the window scoped
     * references we added with the intended export statements
     *
     * @param code source post Closure Compiler Compilation
     * @return Promise containing the repaired source
     */
    async post(fileName: string, source: MagicString): Promise<MagicString> {
        if (!isESMFormat(this.outputOptions)) {
            return super.post(fileName, source)
        }

        const code = source.toString()
        const program = await parse(fileName, code)
        let collectedExportsToAppend: Map<string | null, string[]> = new Map()

        source.trimEnd()

        walk.ancestor(program, {
            // We inserted window scoped assignments for all the export statements during `preCompilation`
            // Now we need to find where Closure Compiler moved them, and restore the exports of their name.
            // ASTExporer Link: https://astexplorer.net/#/gist/94f185d06a4105d64828f1b8480bddc8/0fc5885ae5343f964d0cdd33c7d392a70cf5fcaf
            Identifier: (node: Identifier, ancestors: Node[]) => {
                if (node.name !== 'window') {
                    return
                }

                for (const ancestor of ancestors) {
                    if (!NodeIsPreservedExport(ancestor)) {
                        continue
                    }
                    // Can cast these since they were validated with the `NodeIsPreservedExport` test.
                    const expression: AssignmentExpression = ancestor.expression as AssignmentExpression
                    const left: MemberExpression = expression.left as MemberExpression
                    const exportName: string | null = PreservedExportName(left)

                    if (exportName !== null && this.originalExports.get(exportName)) {
                        const exportDetails: ExportDetails = this.originalExports.get(exportName) as ExportDetails
                        const exportIsLocal: boolean = exportDetails.source === null
                        const exportInline: boolean =
                            (exportIsLocal &&
                                this.currentSourceExportCount === 1 &&
                                exportDetails.local === exportDetails.exported) ||
                            exportDetails.exported === 'default'

                        switch (exportDetails.type) {
                            case ExportClosureMapping.NAMED_DEFAULT_FUNCTION:
                            case ExportClosureMapping.DEFAULT:
                                if (PreserveDefault(code, source, ancestor, exportDetails, exportInline)) {
                                    collectedExportsToAppend = ExportTransform.storeExportToAppend(
                                        collectedExportsToAppend,
                                        exportDetails
                                    )
                                }
                                break
                            case ExportClosureMapping.NAMED_CONSTANT:
                                if (PreserveNamedConstant(code, source, ancestor, exportDetails, exportInline)) {
                                    collectedExportsToAppend = ExportTransform.storeExportToAppend(
                                        collectedExportsToAppend,
                                        exportDetails
                                    )
                                }
                                break
                        }

                        if (!exportIsLocal) {
                            const [leftStart] = left.range as Range
                            const { 1: ancestorEnd } = ancestor.range as Range
                            source.remove(leftStart, ancestorEnd)
                        }

                        // An Export can only be processed once.
                        this.originalExports.delete(exportName)
                    }
                }
            }
        })

        for (const exportSource of collectedExportsToAppend.keys()) {
            const toAppend = collectedExportsToAppend.get(exportSource)
            if (toAppend && toAppend.length > 0) {
                const names = toAppend.join(',')

                if (exportSource === null) {
                    source.append(`export{${names}}`)
                } else {
                    source.prepend(`export{${names}}from'${exportSource}';`)
                }
            }
        }

        return source
    }
}
