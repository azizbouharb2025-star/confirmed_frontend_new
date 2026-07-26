/**
 * Manual type declarations for packages that ship without bundled types
 * and whose @types/* packages are not installed.
 *
 * These declarations are intentionally minimal — they cover only the
 * APIs actually used in this codebase.
 */

// ─── jsonwebtoken ─────────────────────────────────────────────────────────────
declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number
    algorithm?: string
    issuer?: string
    audience?: string | string[]
    subject?: string
    jwtid?: string
    noTimestamp?: boolean
    header?: object
    encoding?: string
  }

  export interface VerifyOptions {
    algorithms?: string[]
    audience?: string | string[]
    issuer?: string | string[]
    subject?: string
    ignoreExpiration?: boolean
    clockTolerance?: number
    maxAge?: string | number
  }

  export interface JwtPayload {
    [key: string]: unknown
    iss?: string
    sub?: string
    aud?: string | string[]
    exp?: number
    nbf?: number
    iat?: number
    jti?: string
  }

  export type Secret = string | Buffer

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: Secret,
    options?: SignOptions
  ): string

  export function verify(
    token: string,
    secretOrPublicKey: Secret,
    options?: VerifyOptions
  ): JwtPayload | string

  export function decode(
    token: string,
    options?: { complete?: boolean; json?: boolean }
  ): JwtPayload | string | null

  export class JsonWebTokenError extends Error {
    inner: Error
  }
  export class TokenExpiredError extends JsonWebTokenError {
    expiredAt: Date
  }
  export class NotBeforeError extends JsonWebTokenError {
    date: Date
  }

  const _default: {
    sign: typeof sign
    verify: typeof verify
    decode: typeof decode
    JsonWebTokenError: typeof JsonWebTokenError
    TokenExpiredError: typeof TokenExpiredError
    NotBeforeError: typeof NotBeforeError
  }
  export default _default
}

// ─── bcryptjs ─────────────────────────────────────────────────────────────────
declare module 'bcryptjs' {
  export function hash(data: string, saltOrRounds: string | number): Promise<string>
  export function compare(data: string, encrypted: string): Promise<boolean>
  export function genSalt(rounds?: number): Promise<string>
  export function hashSync(data: string, saltOrRounds: string | number): string
  export function compareSync(data: string, encrypted: string): boolean
  export function genSaltSync(rounds?: number): string

  const _default: {
    hash: typeof hash
    compare: typeof compare
    genSalt: typeof genSalt
    hashSync: typeof hashSync
    compareSync: typeof compareSync
    genSaltSync: typeof genSaltSync
  }
  export default _default
}
