import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { AddonManifest, CatalogRequest } from '@types'

interface AddonState {
  addons: AddonManifest[]
  loading: boolean
  error: string | null
  catalogs: Record<string, any[]>
  catalogsLoading: Record<string, boolean>
  catalogsError: Record<string, string | null>
}

const initialState: AddonState = {
  addons: [],
  loading: false,
  error: null,
  catalogs: {},
  catalogsLoading: {},
  catalogsError: {},
}

export const fetchAddonManifest = createAsyncThunk(
  'addons/fetchManifest',
  async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch addon manifest')
    }
    const manifest: AddonManifest = await response.json()
    return manifest
  }
)

export const fetchCatalog = createAsyncThunk(
  'addons/fetchCatalog',
  async (request: { addonId: string; endpoint: string; type: string; extra?: CatalogRequest[] }) => {
    const { addonId, type, endpoint, extra } = request
    const response = await fetch(`${endpoint}/catalog/${type}/catalog.json`)
    if (!response.ok) {
      throw new Error('Failed to fetch catalog')
    }
    const catalog = await response.json()
    return { addonId, type, catalog }
  }
)

export const addonSlice = createSlice({
  name: 'addons',
  initialState,
  reducers: {
    removeAddon: (state, action: PayloadAction<string>) => {
      state.addons = state.addons.filter((addon: AddonManifest) => addon.id !== action.payload)
      // Clean up related catalogs
      Object.keys(state.catalogs).forEach(key => {
        if (key.startsWith(action.payload)) {
          delete state.catalogs[key]
          delete state.catalogsLoading[key]
          delete state.catalogsError[key]
        }
      })
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Manifest
      .addCase(fetchAddonManifest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAddonManifest.fulfilled, (state, action) => {
        state.loading = false
        const existingIndex = state.addons.findIndex((addon: AddonManifest) => addon.id === action.payload.id)
        if (existingIndex >= 0) {
          state.addons[existingIndex] = action.payload
        } else {
          state.addons.push(action.payload)
        }
      })
      .addCase(fetchAddonManifest.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch addon manifest'
      })
      // Fetch Catalog
      .addCase(fetchCatalog.pending, (state, action) => {
        const key = `${action.meta.arg.addonId}_${action.meta.arg.type}`
        state.catalogsLoading[key] = true
        state.catalogsError[key] = null
      })
      .addCase(fetchCatalog.fulfilled, (state, action) => {
        const { addonId, type, catalog } = action.payload
        const key = `${addonId}_${type}`
        state.catalogsLoading[key] = false
        state.catalogs[key] = catalog
      })
      .addCase(fetchCatalog.rejected, (state, action) => {
        const key = `${action.meta.arg.addonId}_${action.meta.arg.type}`
        state.catalogsLoading[key] = false
        state.catalogsError[key] = action.error.message || 'Failed to fetch catalog'
      })
  },
})

export const { removeAddon, clearError } = addonSlice.actions

export const selectAddons = (state: RootState) => state.addons.addons
export const selectAddonLoading = (state: RootState) => state.addons.loading
export const selectAddonError = (state: RootState) => state.addons.error
export const selectCatalog = (addonId: string, type: string) => 
  (state: RootState) => state.addons.catalogs[`${addonId}_${type}`] || []
export const selectCatalogLoading = (addonId: string, type: string) =>
  (state: RootState) => state.addons.catalogsLoading[`${addonId}_${type}`] || false
export const selectCatalogError = (addonId: string, type: string) =>
  (state: RootState) => state.addons.catalogsError[`${addonId}_${type}`] || null

export default addonSlice.reducer