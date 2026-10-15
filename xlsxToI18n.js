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

// 写入 Excel 数据（生成 i18n locales/*.js）
try {
  if (!fs.existsSync(inputXlsxPath)) {
    console.error(`未找到输入文件：${inputXlsxPath}`)
    process.exit(1)
  }

  // 解析得到文档中的所有 sheet
  const sheets = xlsx.parse(inputXlsxPath)

  let titles = []
  let level = []
  let targetObj = {}
  let obj = {}

  // 遍历 sheet
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
              // 合并到目标语言对象
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

  // 确保输出目录存在
  fs.mkdirSync(localesDir, { recursive: true })

  for (const key in targetObj) {
    // 把 data 对象转换为 json 格式字符串，并输出 ESM default export
    var content = `export default ${JSON.stringify(targetObj[key])}`
    var file = path.join(localesDir, `${key}.js`)

    fs.writeFileSync(file, content, 'utf8')
    console.log('文件创建成功，地址：' + file)
  }
} catch (e) {
  // 输出日志
  console.log('excel写入异常,error=%s', e.stack)
}
