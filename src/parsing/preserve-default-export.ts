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

import { AssignmentExpression, ExpressionStatement } from 'estree'
import MagicString from 'magic-string'
import { ExportDetails, Range } from '../types.js'

export function PreserveDefault(
    _code: string,
    source: MagicString,
    ancestor: ExpressionStatement,
    _exportDetails: ExportDetails,
    _exportInline: boolean
): boolean {
    const assignmentExpression = ancestor.expression as AssignmentExpression
    const [leftStart]: Range = assignmentExpression.left.range as Range
    const [rightStart]: Range = assignmentExpression.right.range as Range

    source.overwrite(leftStart, rightStart, 'export default ')

    return false
}
