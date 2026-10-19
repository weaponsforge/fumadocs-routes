const PREFIX = '[routes:generate]'

/**
 * Collects the warnings and errors of a run, printed together at the end
 */
export class Diagnostics {
  private readonly warnings: string[] = []
  private readonly errors: string[] = []

  addWarning (message: string): void {
    this.warnings.push(message)
  }

  addError (message: string): void {
    this.errors.push(message)
  }

  hasErrors (): boolean {
    return this.errors.length > 0
  }

  /**
   * Prints the warnings, then the errors, to stderr
   */
  flush (): void {
    for (const warning of this.warnings) {
      console.warn(`${PREFIX} warning: ${warning}`)
    }

    for (const error of this.errors) {
      console.error(`${PREFIX} error: ${error}`)
    }
  }
}
