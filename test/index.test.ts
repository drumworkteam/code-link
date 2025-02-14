import assert from 'assert'
import { promises as fs } from 'fs'
import { dirname } from 'path'
import stripAnsi from 'strip-ansi'
import { fileURLToPath } from 'url'
import Kink, { KinkList } from '@termsurf/kink'
import { makeBaseKinkText, makeKinkText } from '@termsurf/kink-text'

import makeTree from '../code/index.js'
import { showTreeLine } from '../code/tree/index.js'
import show from 'code/sift/show.js'
import makeSiftList, { SiftCallCast } from 'code/sift/index.js'
import makeTextList from 'code/leaf/index.js'
import { LeafCallCast } from 'code/leaf/form.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const FIND = process.env.FIND

process.on('uncaughtException', kink => {
  console.log(``)
  if (kink instanceof KinkList) {
    if (kink.list.length === 1) {
      const k = kink.list[0]
      if (k) {
        Kink.saveFill(k)
        console.log(makeKinkText(k))
      }
    } else {
      console.log(makeKinkText(kink))
      kink.list.forEach(kink => {
        console.log(``)
        Kink.saveFill(kink)
        console.log(makeKinkText(kink))
      })
    }
  } else if (kink instanceof Kink) {
    Kink.saveFill(kink)
    console.log(makeKinkText(kink))
  } else if (kink instanceof Error) {
    console.log(makeBaseKinkText(kink))
  } else {
    console.log(kink)
  }
  console.log(``)
})

async function start() {
  const fixtures = (await fs.readdir(`${__dirname}/file`))
    .filter(x => x.endsWith('.note'))
    .map(x => `${__dirname}/file/${x}`)
    .filter(x => !FIND || x.match(FIND))

  for (const path of fixtures) {
    const localPath = path.replace(`${__dirname}/`, '')
    console.log(localPath)
    const content = await fs.readFile(path, 'utf-8')
    const [provided, expected] = content
      .split(/\n---\n/)
      .map(x => x.trim())
    assert(provided, 'Should have defined provided input')
    assert(expected, 'Should have defined expected output')
    assertParse(path, provided, expected)
  }

  const kinkFixtures = (await fs.readdir(`${__dirname}/file/kink`))
    .filter(x => x.endsWith('.note'))
    .map(x => `${__dirname}/file/kink/${x}`)
    .filter(x => !FIND || x.match(FIND))

  for (const path of kinkFixtures) {
    const localPath = path.replace(`${__dirname}/`, '')
    console.log(localPath)
    const content = await fs.readFile(path, 'utf-8')
    const [provided, expected] = content
      .split(/\n---\n/)
      .map(x => x.trim())
    assert(provided, 'Should have defined provided input')
    assert(expected, 'Should have defined expected output')
    assertParseKink(path, provided, expected)
  }
}

start()

function assertParse(file: string, provided: string, expected: string) {
  const lead = makeTree({ file, text: provided })

  if (lead instanceof KinkList) {
    throw lead
  }

  const output = showTreeLine(lead.tree)

  const a = String(stripAnsi(output)).trim()
  const b = String(stripAnsi(expected)).trim()

  if (a !== b) {
    // console.log(a)
    throw new Error(`\n${a} !=\n${b}\n`)
    // code.throwError(code.generateStringMismatchError(data, a, b))
  }
}

function assertParseKink(
  file: string,
  provided: string,
  expected: string,
) {
  const lead = makeTree({ file, text: provided })

  if (lead instanceof KinkList) {
    const noteList = lead.list.map(x => x.note).join('\n')

    if (expected !== noteList) {
      // console.log(a)
      throw new Error(`\n${noteList} !=\n${expected}\n\nfor ${file}`)
      // code.throwError(code.generateStringMismatchError(data, a, b))
    }
    // throw new KinkList(lead)
  } else {
    const siftLead = makeSiftList(
      makeTextList({ file, text: provided }) as LeafCallCast,
    ) as SiftCallCast
    console.log(show(siftLead.siftList))
    throw new Error(`No error thrown for ${file}`)
  }
  // } catch (e) {
  //   if (e instanceof Error) {
  //     if (e.message != expected) {
  //       throw e
  //     }
  //   }
  // }
}

function trimLines(text: string): string {
  return text
    .split('\n')
    .map(x => x.slice(2))
    .join('\n')
}
