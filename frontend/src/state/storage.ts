const P = 'hg:'
const SAVED_AT_KEY = `${P}garminSavedAt`

export interface SavedCredentialsType {
  garminEmail: string
  garminPassword: string
  garminToken: string
}

export function loadSaved(): SavedCredentialsType {
  return {
    garminEmail: localStorage.getItem(`${P}garminEmail`) ?? '',
    garminPassword: localStorage.getItem(`${P}garminPassword`) ?? '',
    garminToken: localStorage.getItem(`${P}garminToken`) ?? '',
  }
}

export function saveCred(key: keyof SavedCredentialsType, value: string) {
  if (value) {
    localStorage.setItem(`${P}${key}`, value)
    localStorage.setItem(SAVED_AT_KEY, new Date().toISOString())
  } else {
    localStorage.removeItem(`${P}${key}`)
  }
}

export function loadGarminSavedAt(): string | null {
  return localStorage.getItem(SAVED_AT_KEY)
}
