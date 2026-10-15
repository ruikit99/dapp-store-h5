import xlsxPkg from 'node-xlsx'
import fs from 'node:fs'
import path from 'node:path'
import lodashPkg from 'lodash'
import { fileURLToPath } from 'node:url'

const xlsx = xlsxPkg?.default ?? xlsxPkg
const lodash = lodashPkg?.default ?? lodashPkg
const { merge } = lodash

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const inputXlsxPath = path.resolve(__dirname, 'store_dapp_lang.xlsx')
const localesDir = path.resolve(__dirname, 'locales')

try {
  if (!fs.existsSync(inputXlsxPath)) {
    console.error(`未找到输入文件：${inputXlsxPath}`)
    process.exit(1)
  }

  const sheets = xlsx.parse(inputXlsxPath)

  let titles = []
  let level = []
  let targetObj = {}
  let obj = {}

  sheets.map((sheet) => {
    titles = sheet['data'][0]
    for (let rowId in sheet['data']) {
      if (rowId > 0) {
        titles.map((item, i) => {
          let row = sheet['data'][rowId][i]
          if (row) {
            if (item === 'path') {
              if (!Object.prototype.hasOwnProperty.call(obj, row)) {
                obj[row] = {}
              }
              level[0] = row
            } else if (item === 'key') {
              level[1] = row
            } else {
              let res = { ...(targetObj[item] || {}) }
              let test = JSON.parse(JSON.stringify(obj))
              test[level[0]][level[1]] = row.replaceAll('"', "'")
              targetObj[item] = merge({}, res, test)
              if (i === titles.length -1) obj = {}
            }
          }
        })
      }
    }
  })

  fs.mkdirSync(localesDir, { recursive: true })

  for (const key in targetObj) {
    var content = `export default ${JSON.stringify(targetObj[key])}`
    var file = path.join(localesDir, `${key}.js`)

    fs.writeFileSync(file, content, 'utf8')
    console.log('文件创建成功，地址：' + file)
  }
} catch (e) {
  console.log('excel写入异常,error=%s', e.stack)
}
