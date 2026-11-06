import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { pathToFileURL } from 'url'
import test from 'ava'
import * as rollup from 'rollup'
import * as transpiled from '../../src/index.js'

const { default: compiler } = transpiled

// An entry that uses a class from a chunk it shares with another entry, and exports it too, re-exports a name it
// imports from that chunk: `import { B as Base } from './base-hash.js'; ... export { Base }`.
test('re-exports a name imported from a shared chunk', async t => {
    const bundle = await rollup.rollup({
        input: ['test/import/fixtures/shared-chunk/entry-a.js', 'test/import/fixtures/shared-chunk/entry-b.js'],
        plugins: [compiler()],
        onwarn: () => null
    })
    const { output } = await bundle.generate({ format: 'esm', sourcemap: false })
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'shared-chunk-'))

    for (const chunk of output) {
        await fs.promises.writeFile(path.join(dir, chunk.fileName), chunk.code)
    }

    const entryA = await import(pathToFileURL(path.join(dir, 'entry-a.js')).href)
    const entryB = await import(pathToFileURL(path.join(dir, 'entry-b.js')).href)

    t.is(new entryA.Derived().name(), 'derived from base')
    t.true(entryB.create() instanceof entryA.Base)

    await fs.promises.rm(dir, { recursive: true })
})
