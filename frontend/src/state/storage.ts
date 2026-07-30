const P = 'hg:'

export interface SavedCredentialsType {
  hevyApiKey: string
  garminEmail: string
  garminPassword: string
  garminToken: string
}

export function loadSaved(): SavedCredentialsType {
  return {
    hevyApiKey: localStorage.getItem(`${P}hevyApiKey`) ?? '',
    garminEmail: localStorage.getItem(`${P}garminEmail`) ?? '',
    garminPassword: localStorage.getItem(`${P}garminPassword`) ?? '',
    garminToken: localStorage.getItem(`${P}garminToken`) ?? '',
  }
}

export function saveCred(key: keyof SavedCredentialsType, value: string) {
  if (value) localStorage.setItem(`${P}${key}`, value)
  else localStorage.removeItem(`${P}${key}`)
}
