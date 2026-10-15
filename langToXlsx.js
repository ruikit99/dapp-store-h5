import xlsxPkg from 'node-xlsx'
import fs from 'node:fs'
import enLang from './locales/en.js'

const xlsx = xlsxPkg?.default ?? xlsxPkg
let target = {
    'en': enLang
};
try {
    var excelData = [];
    var addInfo = {};
    addInfo.name = "lang";
    addInfo.data = [['path', 'key']];
    for (const key in target) {
        addInfo.data = [...addInfo.data, key];
        Object.keys(enLang).forEach(v => {
            console.log(v, "v")
            // addInfo.data.push([v, '', '', json[v].message]);
        })

        excelData.push(addInfo);
    }
    // var buffer = xlsx.build(excelData);
    // fs.writeFile('./lang.xlsx', buffer, function (err) {
    //     if (err) {
    //         throw err;
    //     }
    //     console.log('Write to xlsx has finished');
    // });
}
catch (e) {
    console.log("excel写入异常,error=%s", e.stack);
}