import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'
import { initialState, reducer } from './reducer'
import type { Action, AppState } from './types'

const StateContext = createContext<AppState>(initialState)
const DispatchContext = createContext<Dispatch<Action>>(() => {})

export function AppProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useAppState(): AppState {
  return useContext(StateContext)
}

export function useAppDispatch(): Dispatch<Action> {
  return useContext(DispatchContext)
}
