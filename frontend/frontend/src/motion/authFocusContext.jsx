import { createContext, useContext, useMemo, useState } from 'react'

const AuthFocusContext = createContext({
  focused: false,
  setFocused: () => {},
})

export function useAuthCardFocus() {
  return useContext(AuthFocusContext)
}

export function AuthFocusProvider({ children }) {
  const [focused, setFocused] = useState(false)
  const value = useMemo(() => ({ focused, setFocused }), [focused])
  return <AuthFocusContext.Provider value={value}>{children}</AuthFocusContext.Provider>
}
