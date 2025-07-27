import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addToLibrary as addItem, removeFromLibrary, updateProgress } from '../store/slices/librarySlice'
import type { LibraryItem, WatchProgress } from '../types'

export const useLibrary = () => {
  const dispatch = useDispatch()
  const library = useSelector((state: any) => state.library.items)
  const progress = useSelector((state: any) => state.library.progress)

  const addToLibrary = useCallback((item: LibraryItem) => {
    dispatch(addItem(item))
  }, [dispatch])

  const removeItem = useCallback((id: string) => {
    dispatch(removeFromLibrary(id))
  }, [dispatch])

  const updateWatchProgress = useCallback((id: string, progress: WatchProgress) => {
    dispatch(updateProgress({ id, progress }))
  }, [dispatch])

  return {
    library,
    progress,
    addToLibrary,
    removeItem,
    updateWatchProgress
  }
}