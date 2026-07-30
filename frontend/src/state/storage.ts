const P = 'hg:'

export interface SavedCredentials {
  hevyApiKey: string
  garminEmail: string
  garminPassword: string
}

export function loadSaved(): SavedCredentials {
  return {
    hevyApiKey: localStorage.getItem(`${P}hevyApiKey`) ?? '',
    garminEmail: localStorage.getItem(`${P}garminEmail`) ?? '',
    garminPassword: localStorage.getItem(`${P}garminPassword`) ?? '',
  }
}

export function saveCred(key: keyof SavedCredentials, value: string) {
  if (value) localStorage.setItem(`${P}${key}`, value)
  else localStorage.removeItem(`${P}${key}`)
}
