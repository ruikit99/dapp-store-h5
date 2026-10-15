import { useState } from 'react'
import { Popover } from 'antd-mobile'
import { InformationCircleOutline } from 'antd-mobile-icons'
import './HintIcon.less'

type Props = {
  content: string
  className?: string
}

export default function HintIcon({ content, className }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <Popover
      visible={visible}
      onVisibleChange={setVisible}
      trigger="click"
      placement="top"
      mode="light"
      className="hint-icon-popover"
      style={{ '--z-index': '100' }}
      content={<div className="hint-icon-content">{content}</div>}
    >
      <span
        className={`hint-icon-trigger${className ? ` ${className}` : ''}`}
        role="button"
        tabIndex={0}
        aria-label="hint"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <InformationCircleOutline />
      </span>
    </Popover>
  )
}
