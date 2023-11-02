import { hookstate, useHookstate } from '@hookstate/core';

import { AiOutlineLoading } from 'react-icons/ai'

const loadingState = hookstate(false)

export const useLoading = () => {
  return useHookstate(loadingState)
}

export const LoadingIndicator = () => {
  const state = useLoading()
  return (
    <div className={`loading ${state.value ? '' : 'hidden'}`}>
      <AiOutlineLoading size="36" color="#666666" className="spin" />
    </div>
    )
  }