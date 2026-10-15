import type { ComponentType } from 'react'
import type { HeroProductKey } from '../heroHelpers'
import S1Detail from './S1'
import S1ProDetail from './S1Pro'
import X1Detail from './X1'
import CypherDetail from './Cypher'
import LeatherCaseDetail from './LeatherCase'

export const PRODUCT_DETAIL_BY_KEY: Partial<
  Record<HeroProductKey, ComponentType>
> = {
  s1: S1Detail,
  s1pro: S1ProDetail,
  x1: X1Detail,
  cypher: CypherDetail,
  leathercase: LeatherCaseDetail,
}

export function getProductDetailComponent(productKey: HeroProductKey) {
  return PRODUCT_DETAIL_BY_KEY[productKey] ?? null
}
