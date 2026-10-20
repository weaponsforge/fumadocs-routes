import { sorted } from '@/utils/helpers.js'

import type { IDocsRoutes } from '@/types.js'

/**
 * Accumulates the route lists of a run. `toJSON()` returns sorted,
 * deduplicated copies, so the generated file is deterministic.
 */
export class RoutesCollection {
  private readonly sections: string[] = []
  private readonly sectionLabels: Record<string, string> = {}
  private readonly privateSections: string[] = []
  private readonly publicExceptions: string[] = []
  private readonly privatePages: string[] = []

  addSection (slug: string, label: string): void {
    this.sections.push(slug)
    this.sectionLabels[slug] = label
  }

  addPrivateSection (slug: string): void {
    this.privateSections.push(slug)
  }

  addPublicException (slug: string): void {
    this.publicExceptions.push(slug)
  }

  addPrivatePage (slug: string): void {
    this.privatePages.push(slug)
  }

  toJSON (): IDocsRoutes {
    return {
      sections: sorted(this.sections),
      section_labels: Object.fromEntries(
        Object.entries(this.sectionLabels).sort(([a], [b]) => a.localeCompare(b)),
      ),
      private_sections: sorted(this.privateSections),
      public_exceptions: sorted(this.publicExceptions),
      private_pages: sorted(this.privatePages),
    }
  }
}
