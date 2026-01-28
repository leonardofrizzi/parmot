export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\d{10,11}$/,
  CEP: /^\d{8}$/,
  CPF: /^\d{11}$/,
  CNPJ: /^\d{14}$/,
}

export const LENGTHS = {
  CEP: 8,
  CPF: 11,
  CNPJ: 14,
  PHONE_MIN: 10,
  PHONE_MAX: 11,
}

export const LIMITS = {
  FILE_SIZE_MB: 5,
  FILE_SIZE_BYTES: 5 * 1024 * 1024,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
}

export const ALLOWED_FILE_TYPES = {
  DOCUMENT: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}

export function cleanDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidCep(cep: string): boolean {
  const clean = cleanDigits(cep)
  return clean.length === LENGTHS.CEP
}

export function isValidCpf(cpf: string): boolean {
  const clean = cleanDigits(cpf)
  return clean.length === LENGTHS.CPF
}

export function isValidCnpj(cnpj: string): boolean {
  const clean = cleanDigits(cnpj)
  return clean.length === LENGTHS.CNPJ
}

export function isValidPhone(phone: string): boolean {
  const clean = cleanDigits(phone)
  return clean.length >= LENGTHS.PHONE_MIN && clean.length <= LENGTHS.PHONE_MAX
}

export function isValidEmail(email: string): boolean {
  return REGEX.EMAIL.test(email)
}

export function isValidFileSize(file: File): boolean {
  return file.size <= LIMITS.FILE_SIZE_BYTES
}

export function isValidFileType(file: File, type: keyof typeof ALLOWED_FILE_TYPES): boolean {
  return ALLOWED_FILE_TYPES[type].includes(file.type)
}
