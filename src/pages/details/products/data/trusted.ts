export type TrustedItem = {
  name: string
  score: number
  title: string
  comment: string
}

export const TRUSTED_LIST: TrustedItem[] = [
  {
    name: 'SwissUser',
    score: 5,
    title: "The really best, DEFI-Hardware Wallet for PRO's",
    comment:
      'I had all. Ledger, Trezor, Ellipal. Safepal ist like a MetaMask, but more secure. You can add all Coins due Smart-Contract Adress.',
  },
  {
    name: 'Daniel O',
    score: 5,
    title: 'Nice One Indeed',
    comment:
      'I really like the performance of the safepal haveware wallet very simple and easy to understand and configure the set up, all you need is going through the details and you will be done.',
  },
  {
    name: 'LEANDRO',
    score: 5,
    title: 'Placa semente',
    comment:
      'COMPREI A PLACA PRA GUARDA COM MAIS SEGURANÇAS AS MINHAS PALAVRAS. SENDO QUE ALGUMAS TEM MAIS LETRA QUE O PROPRIO ESPAÇO E AGORA',
  },
  {
    name: 'John D.',
    score: 5,
    title: 'Best in class',
    comment:
      'It just work, easy to use and totally offline, your only task here is to save your seeds!',
  },
  {
    name: 'komi',
    score: 5,
    title: 'Perfect',
    comment:
      'I wish you decide to offer debit card service as well ! imagin you can spend and buye every thing with safepal debit card that link to safepal hardware wallet .',
  },
  {
    name: 'Igor B',
    score: 5,
    title: 'Add Coins Assets',
    comment:
      "Great and secure wallet. But I only come in this way, as I have already filled out the form requesting the insertion of some coins. If you could add all the coins from Polkadot and Kusama networks I would appreciate it. `DON'T HAVE YOUR KEYS, IT'S NOT YOUR COINS`.",
  },
  {
    name: 'Mujeeb R.',
    score: 5,
    title: 'Great...! I would like to have an Hardware Smartwatch',
    comment:
      "I love this... It's secure my crypto asset. Right now I am thinking about smartwatch hardware wallets with kind features with it. I hope you will have too...",
  },
  {
    name: 'den',
    score: 5,
    title: 'Exelent wallet!!!!',
    comment:
      'Also looking forward to the possibility of a mobile application for extension in the browser :)',
  },
]

const TRUSTED_COLORS = ['#4A21EF', '#18D26E', '#F7A21E', '#E85D5D', '#2B8CEE', '#9B59B6']

export function firstTextToImg(name: string, size = 60, bg = '#4A21EF'): string {
  if (typeof document === 'undefined') return ''
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)
  ctx.font = `${Math.round(size / 2)}px 'Microsoft Yahei', sans-serif`
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff'
  const initials = (name || '?').trim().charAt(0).toUpperCase()
  ctx.fillText(initials, size / 2, size / 1.5)
  return canvas.toDataURL('image/png')
}

export function trustedColorAt(index: number): string {
  return TRUSTED_COLORS[index % TRUSTED_COLORS.length]
}
