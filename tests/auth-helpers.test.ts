import { describe, it, expect } from 'vitest'
import { sanitizeRedirectTarget, MIN_PASSWORD_LENGTH } from '@/app/lib/auth-helpers'

// Esta função é a defesa contra open redirect: o ?redirectTo= do login vem
// da URL, ou seja, de quem clicou no link. Um atacante que conseguisse passar
// um destino externo faria o app redirecionar a vítima já logada pra um site
// de phishing. Por isso os casos abaixo são de segurança, não de estilo.
describe('sanitizeRedirectTarget', () => {
  it('aceita caminho interno simples', () => {
    expect(sanitizeRedirectTarget('/dashboard')).toBe('/dashboard')
  })

  it('aceita caminho interno com query string', () => {
    expect(sanitizeRedirectTarget('/battle/ai?foo=1')).toBe('/battle/ai?foo=1')
  })

  it('rejeita URL absoluta http', () => {
    expect(sanitizeRedirectTarget('http://evil.com')).toBe('/select')
  })

  it('rejeita URL absoluta https', () => {
    expect(sanitizeRedirectTarget('https://evil.com/phishing')).toBe('/select')
  })

  it('rejeita protocol-relative //evil.com — o caso clássico de open redirect', () => {
    expect(sanitizeRedirectTarget('//evil.com')).toBe('/select')
  })

  it('rejeita string vazia', () => {
    expect(sanitizeRedirectTarget('')).toBe('/select')
  })

  it('rejeita caminho relativo sem barra inicial', () => {
    expect(sanitizeRedirectTarget('dashboard')).toBe('/select')
  })

  it('rejeita javascript:', () => {
    expect(sanitizeRedirectTarget('javascript:alert(1)')).toBe('/select')
  })
})

describe('MIN_PASSWORD_LENGTH', () => {
  it('exige pelo menos 8 caracteres', () => {
    expect(MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(8)
  })
})
