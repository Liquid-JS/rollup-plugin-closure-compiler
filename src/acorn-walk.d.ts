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

declare module 'acorn-walk' {
    type NodeType = import('estree').Node['type']
    type DiscriminateUnion<T, K extends keyof T, V extends T[K] = T[K]> = T extends Record<K, V>
        ? T
        : never
    type NarrowNode<K extends NodeType> = DiscriminateUnion<import('estree').Node, 'type', K>

    type FullWalkerCallback<TState> = (
        node: import('estree').Node,
        state: TState,
        type: NodeType,
    ) => void

    type FullAncestorWalkerCallback<TState> = (
        node: import('estree').Node,
        state: TState | Array<import('estree').Node>,
        ancestors: Array<import('estree').Node>,
        type: NodeType,
    ) => void
    type WalkerCallback<TState> = (node: import('estree').Node, state: TState) => void

    type SimpleWalkerFn<K extends NodeType, TState> = (node: NarrowNode<K>, state: TState) => void

    type AncestorWalkerFn<K extends NodeType, TState> = (
        node: NarrowNode<K>,
        state: TState | Array<import('estree').Node>,
        ancestors: Array<import('estree').Node>,
    ) => void

    type RecursiveWalkerFn<K extends NodeType, TState> = (
        node: NarrowNode<K>,
        state: TState,
        callback: WalkerCallback<TState>,
    ) => void

    type SimpleVisitors<Types extends NodeType, TState> = {
        [Type in Types]: SimpleWalkerFn<Type, TState>;
    }

    type AncestorVisitors<Types extends NodeType, TState> = {
        [Type in Types]: AncestorWalkerFn<Type, TState>;
    }

    type RecursiveVisitors<Types extends NodeType, TState> = {
        [Type in Types]: RecursiveWalkerFn<Type, TState>;
    }

    type FindPredicate = (type: NodeType, node: import('estree').Node) => boolean

    interface Found<Type extends NodeType, TState> {
        node: NarrowNode<Type>
        state: TState
    }

    export function simple<TState, K extends NodeType>(
        node: import('estree').Node,
        visitors: SimpleVisitors<K, TState>,
        base?: RecursiveVisitors<NodeType, TState>,
        state?: TState,
    ): void

    export function ancestor<TState, K extends NodeType>(
        node: import('estree').Node,
        visitors: AncestorVisitors<K, TState>,
        base?: RecursiveVisitors<NodeType, TState>,
        state?: TState,
    ): void

    export function recursive<TState, K extends NodeType>(
        node: import('estree').Node,
        state: TState,
        functions: RecursiveVisitors<K, TState>,
        base?: RecursiveVisitors<NodeType, TState>,
    ): void

    export function full<TState>(
        node: import('estree').Node,
        callback: FullWalkerCallback<TState>,
        base?: RecursiveVisitors<NodeType, TState>,
        state?: TState,
    ): void

    export function fullAncestor<TState>(
        node: import('estree').Node,
        callback: FullAncestorWalkerCallback<TState>,
        base?: RecursiveVisitors<NodeType, TState>,
        state?: TState,
    ): void

    export function make<TState, K extends NodeType>(
        functions: RecursiveVisitors<K, TState>,
        base?: RecursiveVisitors<NodeType, TState>,
    ): RecursiveVisitors<NodeType, TState>

    export function findNodeAt<TState, K extends NodeType>(
        node: import('estree').Node,
        start: number | undefined,
        end: number | undefined,
        type: K,
        base?: RecursiveVisitors<NodeType, TState>,
        state?: TState,
    ): Found<K, TState> | undefined

    export function findNodeAt<TState>(
        node: import('estree').Node,
        start: number | undefined,
        end: number | undefined,
        type?: FindPredicate,
        base?: RecursiveVisitors<NodeType, TState>,
        state?: TState,
    ): Found<NodeType, TState> | undefined

    export const findNodeAround: typeof findNodeAt

    export const findNodeAfter: typeof findNodeAt
}
