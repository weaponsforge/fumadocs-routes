import { describe, expect, test } from 'vitest'

import { RoutesCollection } from '@/lib/classes/routes.js'

describe('RoutesCollection', () => {
  test('starts empty', () => {
    expect(new RoutesCollection().toJSON()).toEqual({
      sections: [],
      section_labels: {},
      private_sections: [],
      public_exceptions: [],
      private_pages: [],
    })
  })

  test('sorts and deduplicates every list', () => {
    const routes = new RoutesCollection()

    routes.addSection('b', 'B')
    routes.addSection('a', 'A')
    routes.addSection('b', 'B')
    routes.addPrivateSection('z')
    routes.addPrivateSection('m')
    routes.addPrivateSection('z')
    routes.addPublicException('y/b')
    routes.addPublicException('y/a')
    routes.addPublicException('y/b')
    routes.addPrivatePage('q')
    routes.addPrivatePage('p')
    routes.addPrivatePage('q')

    expect(routes.toJSON()).toEqual({
      sections: ['a', 'b'],
      section_labels: { a: 'A', b: 'B' },
      private_sections: ['m', 'z'],
      public_exceptions: ['y/a', 'y/b'],
      private_pages: ['p', 'q'],
    })
  })

  test('sorts the section_labels keys', () => {
    const routes = new RoutesCollection()

    routes.addSection('weapons', 'W')
    routes.addSection('characters', 'C')
    routes.addSection('secrets', 'S')

    expect(Object.keys(routes.toJSON().section_labels)).toEqual(['characters', 'secrets', 'weapons'])
  })

  test('the last label wins for a repeated section', () => {
    const routes = new RoutesCollection()

    routes.addSection('a', 'first')
    routes.addSection('a', 'second')

    expect(routes.toJSON().section_labels).toEqual({ a: 'second' })
    expect(routes.toJSON().sections).toEqual(['a'])
  })

  test('toJSON() is repeatable and returns copies', () => {
    const routes = new RoutesCollection()

    routes.addPrivatePage('b')
    routes.addPrivatePage('a')

    const first = routes.toJSON()

    first.private_pages.push('mutated')

    expect(routes.toJSON().private_pages).toEqual(['a', 'b'])
    expect(routes.toJSON()).toEqual(routes.toJSON())
  })

  test('keeps the root slug "" as a valid entry', () => {
    const routes = new RoutesCollection()

    routes.addPrivateSection('')
    routes.addPrivateSection('a')

    expect(routes.toJSON().private_sections).toEqual(['', 'a'])
  })
})
