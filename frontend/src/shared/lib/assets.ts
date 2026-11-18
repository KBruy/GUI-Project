import { API_URL } from '@/config/env'

// Grafika z biblioteki (GET /api/assets). Ten sam kształt co backend/src/schemas/asset.py.
export interface Asset {
  id: string
  module: 'map' | 'character'
  category: string
  // Klucz tłumaczenia nazwy, np. "assets.map.tree_oak".
  nameKey: string
  // Ścieżka PNG względem folderu assetów, np. "map/trees/map_tree_oak_01.png".
  file: string
  width: number
  height: number
}

// Adres pliku PNG. Backend serwuje assety pod /static/assets/<file>.
export function assetUrl(file: string): string {
  return `${API_URL}/static/assets/${file}`
}
