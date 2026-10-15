import xlsxPkg from 'node-xlsx'
import fs from 'node:fs'
import enLang from './locales/en.js'

const xlsx = xlsxPkg?.default ?? xlsxPkg
let target = {
    'en': enLang
};
//写入Excel数据
try {
    //excel数据
    var excelData = [];
    //表1
    //添加数据
    var addInfo = {};
    //名称
    addInfo.name = "lang";
    //数据数组
    addInfo.data = [['path', 'key']];
    for (const key in target) {
        addInfo.data = [...addInfo.data, key];
        Object.keys(enLang).forEach(v => {
            console.log(v, "v")
            //添加数据
            // addInfo.data.push([v, '', '', json[v].message]);
        })

        //添加数据
        excelData.push(addInfo);
    }
    // // 写xlsx
    // var buffer = xlsx.build(excelData);
    // //写入数据
    // fs.writeFile('./lang.xlsx', buffer, function (err) {
    //     if (err) {
    //         throw err;
    //     }
    //     //输出日志
    //     console.log('Write to xlsx has finished');
    // });
}
catch (e) {
    //输出日志
    console.log("excel写入异常,error=%s", e.stack);
}