const P = 'hg:'

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
  if (value) localStorage.setItem(`${P}${key}`, value)
  else localStorage.removeItem(`${P}${key}`)
}
