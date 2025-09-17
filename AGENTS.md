# Architecture

This is a JavaScript/TypeScript library with wide applicability.

- It is composed of multiple high-quality, single-purpose modules.
- Ensure that each module is compatible with any JS environment.
- Have a consistent and harmonious interface design.

It is like a JavaScript version of the Boost library that follows the UNIX philosophy.

# Critical Rules

- Minimize unnecessary code comments. Only annotate obscure logic when absolutely necessary.
- Use // TODO comments for assumptive logic or mock data.
- Adhere to the DRY principle: eliminate repetition by extracting shared logic.
- Apply Separation of Concerns (SoC): ensure each module focuses on a single responsibility.
- You should minimize your dependence on platform-specific interfaces. If there are any, you should import macros from compile-constant to implement platform-specific logic.
- We attach great importance to performance, please use the highest-performance algorithms, and try to utilize memory to avoid computational overhead.

# Testing instructions

- Create test cases in the `test` directory to ensure that the code coverage of the new code meets the standard.
- Use Vitest for testing.
- The `expect.requireAssertions` configuration is enabled, so there's no need to call `expect.hasAssertions()`.
- Do not attempt to build for testing (e.g. `pnpm build`, `npx tsc`).

# Team Rules

- Whether it is a comment, error description, or test case description, English should be used uniformly, written in complete sentence format; that is, the first letter is capitalized and ends with a period.
- Single-line phrase comments may not end with a period.
- Code, identifiers, and symbols should be used as `{@link symbol}` instead of any quotation marks, so that you can click the link to jump to the definition. Note that you must ensure that the linked symbol has been imported at least as a `type`.
- Symbols that cannot be jumped to using `{@link symbol}` should be enclosed in backticks (`), for example, `number`, `string`, etc.
- In error descriptions and logs, code and identifiers should be wrapped with backticks (`) instead of quotes.
