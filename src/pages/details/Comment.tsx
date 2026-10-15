import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, Form, Input, Rate, TextArea, Toast } from 'antd-mobile'
import { api } from '@/api'
import { firstTextToImg } from '@/lib/common.js'
import { showLoading, hideLoading, showToast } from '@/lib/tips'
import { EMAIL_PATTERN, formatter } from '@/lib/formUtils'
import './Comment.less'

export { formatter }

type Props = {
  productId: string
  sku: string
  onBottomline?: (data: Record<string, any>) => void
}

type ReviewItem = {
  id: string | number
  score?: number
  title?: string
  content?: string
  created_at?: string
  votes_up?: number
  hasLike?: boolean
  user?: { display_name?: string }
  comment?: {
    display_name?: string
    content?: string
    created_at?: string
  }
}

type ReviewProduct = {
  domain_key?: string
  name?: string
  product_link?: string
}

export function boostReviewCount(productId: string): number {
  const id = `${productId}`
  if (id === '2059') return 2000
  if (id === '2064') return 80
  if (id === '2060') return 200
  if (id === '2065' || id === '2067') return 95
  return 170
}

export function tidyTimeView(time?: string) {
  if (!time) return time || ''
  const targetTime = new Date(time)
  if (Number.isNaN(targetTime.getTime())) return time
  const year = `${targetTime.getFullYear()}`
  const mon = targetTime.getMonth() + 1
  const day = targetTime.getDate()
  return `${mon >= 10 ? mon : `0${mon}`}/${day >= 10 ? day : `0${day}`}/${year.substr(2)}`
}

function EditIcon() {
  return (
    <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.6802 6.43555L16.6632 9.50655"
        stroke="#333333"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.795 7.96093L9.37797 17.2357L4.77344 18.3243L5.80529 13.6361L15.1375 4.27888C15.5275 3.88783 16.1598 3.86541 16.5508 4.25541L18.8029 6.54381C19.1921 6.93569 19.1899 7.56885 18.798 7.95801L18.795 7.96093Z"
        stroke="#333333"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.47705 21.5685H19.5101" stroke="#333333" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function LikeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
      <path
        d="M5.25 9.04736L8.25 2.29736C8.84674 2.29736 9.41903 2.53442 9.84099 2.95637C10.2629 3.37833 10.5 3.95063 10.5 4.54736V7.54736H14.745C14.9624 7.5449 15.1778 7.58974 15.3762 7.67878C15.5746 7.76781 15.7512 7.89891 15.8939 8.063C16.0366 8.22708 16.1419 8.42023 16.2025 8.62905C16.2631 8.83787 16.2776 9.05738 16.245 9.27236L15.21 16.0224C15.1558 16.38 14.9741 16.7061 14.6984 16.9404C14.4228 17.1747 14.0717 17.3015 13.71 17.2974H5.25M5.25 9.04736V17.2974M5.25 9.04736H3C2.60218 9.04736 2.22064 9.2054 1.93934 9.4867C1.65804 9.76801 1.5 10.1495 1.5 10.5474V15.7974C1.5 16.1952 1.65804 16.5767 1.93934 16.858C2.22064 17.1393 2.60218 17.2974 3 17.2974H5.25"
        stroke="black"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function OfficialAvatar() {
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.115723" y="0.797363" width="48" height="48" rx="24" fill="#4A21EF" />
      <path
        d="M22.2997 11.1973C21.4816 11.1973 20.697 11.5223 20.1186 12.1007L11.0319 21.1876C10.6877 21.5318 10.5156 21.9829 10.5156 22.434C10.5156 22.8851 10.6877 23.3362 11.0319 23.6803L16.9867 29.6352V19.093C16.9867 18.3062 17.6194 17.6684 18.4062 17.6684C21.73 17.6684 29.8207 17.6684 30.9243 17.6684L37.3953 11.1974L22.2997 11.1973Z"
        fill="white"
      />
      <path
        d="M16.987 31.6061H29.5001C30.2868 31.6061 30.9246 30.9683 30.9246 30.1816V19.6393L36.8794 25.5942C37.2235 25.9384 37.3956 26.3895 37.3956 26.8405C37.3956 27.2916 37.2236 27.7427 36.8794 28.0869L27.7927 37.1738C27.2142 37.7523 26.4296 38.0773 25.6115 38.0773L10.5159 38.0772L16.987 31.6061Z"
        fill="white"
      />
      <path
        d="M41.1157 30.7974L43.2572 33.2065L46.4058 32.5162L46.7222 35.724L49.6752 37.0162L48.0457 39.7974L49.6752 42.5785L46.7222 43.8707L46.4058 47.0785L43.2572 46.3882L41.1157 48.7974L38.9742 46.3882L35.8257 47.0785L35.5092 43.8707L32.5562 42.5785L34.1857 39.7974L32.5562 37.0162L35.5092 35.724L35.8257 32.5162L38.9742 33.2065L41.1157 30.7974Z"
        fill="#F4C63E"
      />
      <path
        d="M43.7598 38.0393L40.0296 41.7592L38.334 40.0684"
        stroke="white"
        strokeWidth="1.63636"
        strokeLinecap="square"
      />
    </svg>
  )
}

export default function Comment({ productId, sku: _sku, onBottomline }: Props) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const onBottomlineRef = useRef(onBottomline)
  onBottomlineRef.current = onBottomline

  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [products, setProducts] = useState<ReviewProduct[]>([])
  const [bottomline, setBottomline] = useState<{ average_score?: number; total_review?: number } | null>(
    null,
  )
  const [showForm, setShowForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalNumber, setTotalNumber] = useState(0)
  const [showPagination, setShowPagination] = useState(false)
  const [form] = Form.useForm()

  const displayTotal = useMemo(() => {
    const raw = Number(bottomline?.total_review) || 0
    return raw + boostReviewCount(productId)
  }, [bottomline?.total_review, productId])

  const totalPages = useMemo(() => {
    if (!pageSize) return 0
    return Math.max(1, Math.ceil(totalNumber / pageSize))
  }, [totalNumber, pageSize])

  const pageList = useMemo(() => {
    const maxButtons = Math.min(5, totalPages)
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2))
    let end = start + maxButtons - 1
    if (end > totalPages) {
      end = totalPages
      start = end - maxButtons + 1
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [currentPage, totalPages])

  const loadReviews = useCallback(
    async (page = 1, scrollToTop = false) => {
      if (!productId) return
      setShowPagination(false)
      showLoading()
      try {
        const list = await api.getReviewList(productId, {
          page,
          per_page: 5,
          sort: 'date',
          direction: 'desc',
        })
        const payload = list?.response ?? list ?? {}
        const nextReviews: ReviewItem[] = Array.isArray(payload.reviews)
          ? payload.reviews.map((item: ReviewItem) => ({ ...item, hasLike: false }))
          : []
        setReviews(nextReviews)
        setProducts(Array.isArray(payload.products) ? payload.products : [])

        const pagination = payload.pagination || {}
        const perPage = Number(pagination.per_page) || 5
        const total = Number(pagination.total) || 0
        const pageNum = Number(pagination.page) || page
        setPageSize(perPage)
        setTotalNumber(total)
        setCurrentPage(pageNum)

        const stats = payload.bottomline || { average_score: 0, total_review: 0 }
        const boosted = {
          ...stats,
          average_score: Number(stats.average_score) || 0,
          total_review: (Number(stats.total_review) || 0) + boostReviewCount(productId),
        }
        setBottomline(stats)
        onBottomlineRef.current?.(boosted)
        setShowPagination(total > perPage)
      } catch {
      } finally {
        hideLoading()
        if (scrollToTop) {
          rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
        }
      }
    },
    [productId],
  )

  useEffect(() => {
    loadReviews(1)
  }, [loadReviews])

  const onPageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    loadReviews(page, true)
  }

  const likeFun = async (item: ReviewItem) => {
    if (!item.id) return
    showLoading()
    try {
      if (item.hasLike) {
        await api.unVoteUpReview(String(item.id))
        setReviews((prev) =>
          prev.map((r) =>
            r.id === item.id
              ? { ...r, hasLike: false, votes_up: Math.max(0, (Number(r.votes_up) || 0) - 1) }
              : r,
          ),
        )
        Toast.show({ icon: 'success', content: 'Successfully revoked!' })
      } else {
        await api.voteUpReview(String(item.id))
        setReviews((prev) =>
          prev.map((r) =>
            r.id === item.id
              ? { ...r, hasLike: true, votes_up: (Number(r.votes_up) || 0) + 1 }
              : r,
          ),
        )
        Toast.show({ icon: 'success', content: 'Successfully!' })
      }
    } catch (error: any) {
      showToast(error?.message || 'Failed')
    } finally {
      hideLoading()
    }
  }

  const submitReview = async (values: Record<string, any>) => {
    const param: Record<string, any> = {
      sku: productId,
      review_score: values.rate,
      review_title: String(values.title ?? '').trim(),
      review_content: String(values.review ?? '').trim(),
      display_name: String(values.name ?? '').trim(),
      email: String(values.email ?? '').trim(),
    }
    products.forEach((item) => {
      if (item.domain_key === `${productId}`) {
        param.product_title = item.name
        param.product_url = item.product_link
      }
    })

    showLoading()
    try {
      await api.createReview(param)
      await Dialog.alert({
        content: 'You have successfully submitted your review. Thank you!',
        confirmText: 'OK',
      })
      form.resetFields()
      setShowForm(false)
    } catch (error: any) {
      showToast(error?.message || 'Submit failed')
    } finally {
      hideLoading()
    }
  }

  return (
    <div ref={rootRef} className="comment-box">
      <div className="write-review">
        <div className="top-box">
          <div className="top-left">
            <Rate
              readOnly
              allowHalf
              value={Number(bottomline?.average_score) || 0}
              style={{ '--star-size': '18px', '--active-color': '#f4c63e' } as CSSProperties}
            />
            <div className="reviews">
              {displayTotal} {t('common.reviews') || 'Reviews'}
            </div>
          </div>
          <div className="top-right">
            <button
              type="button"
              id="write-review"
              className="btn-write"
              onClick={() => setShowForm((v) => !v)}
            >
              <EditIcon />
              <span className="text">WRITE A REVIEW</span>
            </button>
          </div>
        </div>

        <div className={`write-input-wrap${showForm ? ' is-open' : ''}`}>
          <div className="write-input">
            <hr className="comment-divider" />
            <div className="title">
              <h3 className="text">Write A Review</h3>
              <p className="tips">
                (<span style={{ color: '#F00' }}>*</span>
                Indicates a required field)
              </p>
            </div>
            <Form
              form={form}
              className="write-reviews-form"
              layout="vertical"
              onFinish={submitReview}
              footer={
                <div className="post">
                  <button type="submit" id="post-comment" className="btn-post">
                    POST
                  </button>
                </div>
              }
            >
              <div id="write-reviews">
              <div className="score">
                <div className="score-box">
                  <p className="label">
                    <span style={{ color: '#F00' }}>*</span>Score:
                  </p>
                  <Form.Item
                    name="rate"
                    rules={[{ required: true, message: 'Please enter a star rating for this review' }]}
                  >
                    <Rate style={{ '--star-size': '30px', '--active-color': '#f4c63e' } as CSSProperties} />
                  </Form.Item>
                </div>
              </div>

              <div className="fill-input fill-title">
                <p className="label">
                  <span style={{ color: '#F00' }}>*</span>Title:
                </p>
                <div className="input-item">
                  <Form.Item
                    name="title"
                    getValueFromEvent={(val) => formatter(String(val ?? ''))}
                    rules={[
                      { required: true, message: "Review's title can't be empty" },
                      {
                        validator: (_, val) =>
                          !val || String(val).length <= 200
                            ? Promise.resolve()
                            : Promise.reject(new Error('Please enter less or equal than 200 symbols.')),
                      },
                    ]}
                  >
                    <Input id="comment-title" className="form-input" clearable />
                  </Form.Item>
                </div>
              </div>

              <div className="fill-input fill-review area-text">
                <p className="label">
                  <span style={{ color: '#F00' }}>*</span>Review:
                </p>
                <div className="input-item">
                  <Form.Item
                    name="review"
                    getValueFromEvent={(val) => formatter(String(val ?? ''))}
                    rules={[
                      { required: true, message: "Review's body can't be empty" },
                      {
                        validator: (_, val) =>
                          !val || String(val).length <= 1000
                            ? Promise.resolve()
                            : Promise.reject(new Error('Please enter less or equal than 1000 symbols.')),
                      },
                    ]}
                  >
                    <TextArea id="comment-review" className="form-textarea" rows={6} />
                  </Form.Item>
                </div>
              </div>

              <div className="fill-input fill-name">
                <p className="label">
                  <span style={{ color: '#F00' }}>*</span>Use your name:
                </p>
                <div className="input-item">
                  <Form.Item
                    name="name"
                    getValueFromEvent={(val) => formatter(String(val ?? ''))}
                    rules={[
                      { required: true, message: 'Name field cannot be empty' },
                      {
                        validator: (_, val) =>
                          !val || String(val).length <= 200
                            ? Promise.resolve()
                            : Promise.reject(new Error('Please enter less or equal than 200 symbols.')),
                      },
                    ]}
                  >
                    <Input id="comment-name" className="form-input" clearable />
                  </Form.Item>
                </div>
              </div>

              <div className="fill-input fill-email">
                <p className="label">
                  <span style={{ color: '#F00' }}>*</span>Email:
                </p>
                <div className="input-item">
                  <Form.Item
                    name="email"
                    getValueFromEvent={(val) => String(val ?? '')}
                    rules={[
                      {
                        validator: (_, val) => {
                          const email = String(val ?? '').trim()
                          if (!email) return Promise.reject(new Error('Email field cannot be empty'))
                          if (!EMAIL_PATTERN.test(email)) return Promise.reject(new Error('Invalid email'))
                          return Promise.resolve()
                        },
                      },
                    ]}
                  >
                    <Input id="comment-email" className="form-input" type="email" clearable />
                  </Form.Item>
                </div>
              </div>
              </div>
            </Form>
          </div>
        </div>

        <hr className="comment-divider" />
      </div>

      <div className="comment-show">
        {reviews.map((item, index) => {
          const displayName = item.user?.display_name || ''
          return (
            <div className="comment-item" key={item.id || index}>
              <div className="avater-name-like">
                <div className="avater-name">
                  <div className="avater">
                    <img src={firstTextToImg(displayName, 48)} alt="" />
                  </div>
                  <div className="name">
                    <h3>{displayName}</h3>
                    <Rate
                      readOnly
                      allowHalf
                      value={Number(item.score) || 0}
                      style={{ '--star-size': '18px', '--active-color': '#f4c63e' } as CSSProperties}
                    />
                  </div>
                </div>
                <button type="button" className="like" onClick={() => likeFun(item)}>
                  <LikeIcon />
                  <span className="value">{item.votes_up ?? 0}</span>
                </button>
              </div>
              <div className="title-reviews">
                <div className="title">{item.title}</div>
                <div className="reviews">{item.content}</div>
                <p className="update-time">{tidyTimeView(item.created_at)}</p>
                {item.comment ? (
                  <div className="comment-item">
                    <div className="avater-name-like">
                      <div className="avater-name">
                        <div className="avater">
                          <OfficialAvatar />
                        </div>
                        <div className="name report">
                          <h3>{item.comment.display_name}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="title-reviews report-reviews">
                      <div className="reviews">{item.comment.content}</div>
                      <p className="update-time">{tidyTimeView(item.comment.created_at)}</p>
                    </div>
                  </div>
                ) : null}
              </div>
              <hr className="comment-divider" />
            </div>
          )
        })}
      </div>

      {showPagination ? (
        <div className="comment-pagination">
          <button
            type="button"
            className="page-item"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
          >
            ‹
          </button>
          {pageList.map((page) => (
            <button
              type="button"
              key={page}
              className={`page-item${page === currentPage ? ' is-active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            className="page-item"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  )
}
