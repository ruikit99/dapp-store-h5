import { useTranslation } from 'react-i18next'
import './Cypher.less'

export default function CypherDetail() {
  const { t } = useTranslation()

  return (
    <div className="cypher-detail">
      {/* security */}
      <section id="security" className="always security">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-column security-container">
            <div className="image-show order-first-m">
              <img
                className="img-fluid"
                src="/images/cy/best_security_companion.png"
                alt=""
              />
            </div>
            <div className="text-show order-last-m">
              <div className="title mb-0">
                <h3 className="text-center">{t('cypher.best_security_companion')}</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* waterproof */}
      <section id="waterproof" className="always waterproof">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-column waterproof-container">
            <div className="image-show order-first-m">
              <img className="img-fluid" src="/images/cy/waterproof.png" alt="" />
            </div>
            <div className="text-show order-last-m">
              <div className="title">
                <h3>{t('lc.waterproof')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item d-flex">{t('cy.impervious_to_water')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* antiCollision */}
      <section id="antiCollision" className="always antiCollision">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-column antiCollision-container">
            <div className="image-show order-first-m">
              <img
                className="img-fluid"
                src="/images/cy/anti_collision.png"
                alt=""
              />
            </div>
            <div className="text-show order-last-m">
              <div className="title">
                <h3>{t('cy.anti_collision_and_indestructible')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item d-flex">
                  {t('cy.ultra_sturdy_and_tough_with_high_tensile_strength')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* corrosion */}
      <section id="corrosion" className="always corrosion">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-column corrosion-container">
            <div className="image-show order-first-m">
              <img className="img-fluid" src="/images/cy/corrosion_resistant.png" alt="" />
            </div>
            <div className="text-show order-last-m">
              <div className="title">
                <h3>{t('cy.corrosion_resistant')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item d-flex">
                  {t('cy.strong_and_long_lasting_oxidation_resistant_film')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* fireproof */}
      <section id="fireproof" className="always fireproof">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-column fireproof-container">
            <div className="image-show order-first-m">
              <img className="img-fluid" src="/images/cy/fireproof.png" alt="" />
            </div>
            <div className="text-show order-last-m">
              <div className="title">
                <h3>{t('cy.fireproof')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item d-flex">{t('cy.cypher_has_a_melting_point')}</div>
                <div className="describe-item d-flex">
                  {t('cy.superior_choice_compared_to_other_products')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* reliableSimple */}
      <section id="reliableSimple" className="always reliableSimple">
        <div className="container">
          <div className="reliableSimple-container">
            <div className="list-item">
              <div className="image-show">
                <img
                  src="/images/cy/always_reliable.png"
                  alt={t('cy.always_reliable')}
                />
              </div>
              <div className="text-show">
                <div className="title">
                  <h3>{t('cy.simple_to_use')}</h3>
                </div>
                <div className="describe">
                  <div className="describe-item d-flex">
                    {t('cy.designed_for_easy_installation')}
                  </div>
                </div>
              </div>
            </div>
            <div className="list-item">
              <div className="image-show">
                <img src="/images/cy/simple_to_use.png" alt={t('cy.simple_to_use')} />
              </div>
              <div className="text-show">
                <div className="title">
                  <h3>{t('cy.always_reliable')}</h3>
                </div>
                <div className="describe">
                  <div className="describe-item d-flex">
                    {t('cy.recover_access_to_your_cryptocurrency')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* storeup */}
      <section id="storeup" className="always storeup">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-column storeup-container">
            <div className="image-show order-first-m">
              <img
                className="img-fluid"
                src="/images/cy/storeup.png"
                alt=""
              />
            </div>
            <div className="text-show order-last-m">
              <div className="title">
                <h3>{t('cy.store_up_to_24_words')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item d-flex">
                  <div className="describe-item-point">•</div>
                  <div>{t('cypher.compatible_with_hardware_bip39')}</div>
                </div>
                <div className="describe-item d-flex">
                  <div className="describe-item-point">•</div>
                  <div>{t('cypher.ultra_secure_protection')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* intuitiveDesign */}
      <section id="intuitiveDesign" className="always intuitiveDesign">
        <div className="container">
          <div className="list-item d-flex justify-content-between align-items-center flex-column intuitiveDesign-container">
            <div className="image-show order-first-m">
              <img className="img-fluid" src="/images/cy/intuitive_design.png" alt="" />
            </div>
            <div className="text-show order-last-m">
              <div className="title">
                <h3>{t('cypher.intuitive_design')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item d-flex">
                  {t('cy.safepal_cypher_is_based_on_the_bip39')}
                </div>
                <div className="describe-item d-flex">
                  {t('cy.specific_list_of_2048_english_words')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* specifications */}
      <section id="specifications" className="always specifications">
        <div className="container">
          <div className="list-item d-flex justify-content-start align-items-center flex-column specifications-container">
            <div className="image-show order-first-m">
              <img className="img-fluid" src="/images/cy/specifications.png" alt="" />
            </div>
            <div className="text-show order-last-m">
              <div className="title">
                <h3>{t('cy.specifications')}</h3>
              </div>
              <div className="describe">
                <div className="describe-item d-flex">
                  <div>{t('cy.weight190g')}</div>
                </div>
                <div className="describe-item d-flex">
                  <div>{t('cy.size91_58_6mm')}</div>
                </div>
                <div className="describe-item d-flex">
                  <div>{t('cy.material304')}</div>
                </div>
                <div className="describe-item d-flex">
                  <div>{t('cy.melting_point')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
