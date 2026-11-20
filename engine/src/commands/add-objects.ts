import type { Vec2 } from '../math/vec2'
import { addObject } from './add-object'
import { combineCommands } from './combine'
import type { AssetSize, Command } from './types'

/**
 * Polecenie: postaw kilka obiektów tego samego assetu naraz (malowanie pędzlem, wypełnianie).
 * Jedno polecenie, więc jedno „cofnij” usuwa wszystkie.
 * Kolejne obiekty nie mogą nachodzić na wcześniejsze ani na resztę warstwy;
 * przy pierwszej kolizji nic nie jest stawiane (jak w zaślepce frontendu).
 */
export function addObjects(layerId: string, asset: AssetSize, centers: readonly Vec2[]): Command {
  return combineCommands(centers.map((center) => addObject(layerId, asset, center)))
}
