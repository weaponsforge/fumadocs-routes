const PREFIX = '[routes:generate]'

/**
 * Collects the warnings and errors of a run, printed together at the end
 */
export class Diagnostics {
  private readonly warnings: string[] = []
  private readonly errors: string[] = []

  addWarning (message: string) {
    this.warnings.push(message)
  }

  addError (message: string) {
    this.errors.push(message)
  }

  hasErrors () {
    return this.errors.length > 0
  }

  /**
   * Prints the warnings, then the errors, to stderr
   */
  flush () {
    for (const warning of this.warnings) {
      console.warn(`${PREFIX} warning: ${warning}`)
    }

    for (const error of this.errors) {
      console.error(`${PREFIX} error: ${error}`)
    }
  }
}
