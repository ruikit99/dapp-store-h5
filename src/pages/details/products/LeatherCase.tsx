import { useTranslation } from 'react-i18next'
import './LeatherCase.less'

export default function LeatherCaseDetail() {
  const { t } = useTranslation()

  return (
    <div className="leathercase-detail">
      {/* protectyour */}
      <section id="protectyour" className="always protectyour">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-column">
            <div className="image-show order-first-m">
              <img className="img-fluid" src="/images/lc/protectyour.png" alt="" />
            </div>
            <div className="text-show order-last-m">
              <div className="title">
                <h3>{t('lc.protect_your_wallet_from_scratches')}</h3>
              </div>
              <div className="describe d-flex justify-content-around align-items-center">
                <div className="describe-item d-flex justify-content-between align-items-center flex-column">
                  <img src="/images/lc/protect-your-wallet-1.svg" alt="" />
                  <p>{t('lc.waterproof')}</p>
                </div>
                <div className="describe-item d-flex justify-content-between align-items-center flex-column">
                  <img src="/images/lc/protect-your-wallet-2.svg" alt="" />
                  <p>{t('lc.drop_resistant')}</p>
                </div>
                <div className="describe-item d-flex justify-content-between align-items-center flex-column">
                  <img src="/images/lc/protect-your-wallet-3.svg" alt="" />
                  <p>{t('lc.scratch_proof')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* premium */}
      <section id="premium" className="always premium">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-column premium-container">
            <div className="image-show order-first-m">
              <img
                className="img-fluid"
                src="/images/lc/premium.png"
                alt=""
              />
            </div>
            <div className="text-show order-last-m">
              <div className="title">
                <h3>{t('lc.premium_quality_and_workmanship')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item d-flex">
                  <div className="describe-item-point">• </div>
                  <div>{t('lc.beautiful_pu_leather_surface')}</div>
                </div>
                <div className="describe-item d-flex">
                  <div className="describe-item-point">• </div>
                  <div>{t('lc.soft_velvet_interior_protects')}</div>
                </div>
                <div className="describe-item d-flex">
                  <div className="describe-item-point">• </div>
                  <div>{t('lc.invisible_reinforced_magnetic')}</div>
                </div>
                <div className="describe-item d-flex">
                  <div className="describe-item-point">• </div>
                  <div>{t('lc.light_compact_extremely_portable')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* multi */}
      <section id="multi" className="always multi">
        <div className="container">
          <div className="list-item d-flex justify-content-start align-items-center flex-column multi-container">
            <div className="image-show order-first-m">
              <img className="img-fluid" src="/images/lc/multi.png" alt="" />
            </div>
            <div className="text-show order-last-m">
              <div className="title">
                <h3>{t('lc.multi_functional')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item d-flex">
                  <div>{t('lc.organize_your_wallets')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* specifications */}
      <section id="specifications" className="always specifications">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-column specifications-container">
            <div className="image-show d-flex justify-content-end align-items-center order-first-m">
              <img
                className="specifications1"
                src="/images/lc/specifications1.png"
                alt=""
              />
              <img className="specifications2" src="/images/lc/specifications2.png" alt="" />
            </div>
            <div className="text-show order-last-m">
              <div className="title">
                <h3>{t('lc.specifications')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item d-flex">
                  <p>
                    <span style={{fontWeight: 600, color:'#010101'}} className="spec-label">{t('lc.dimensions')}:</span>
                    {t('lc.105cm_77cm')}
                  </p>
                </div>
                <div className="describe-item d-flex">
                  <p>
                    <span style={{fontWeight: 600, color:'#010101'}} className="spec-label">{t('lc.weight')}:</span>
                    {t('lc.20g')}
                  </p>
                </div>
                <div className="describe-item d-flex">
                  <p>
                    <span style={{fontWeight: 600, color:'#010101'}} className="spec-label">{t('lc.material')}:</span>
                    {t('lc.pu_leather')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
