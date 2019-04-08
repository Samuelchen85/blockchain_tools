'use strict';

var SampleContract = function () {
};

SampleContract.prototype = {
    init: function () {
    },
    set: function (name, value) {
        // 存储字符串
        LocalContractStorage.set("name",name);
        // 存储数字
        LocalContractStorage.set("value", value);
        // 存储对象
        LocalContractStorage.set("obj", {name:name,value:value});
    },
    get: function () {
        var name = LocalContractStorage.get("name");
        console.log("name:"+name)
        var value = LocalContractStorage.get("value");
        console.log("value:"+value)
        var obj = LocalContractStorage.get("obj");
        console.log("obj:"+JSON.stringify(obj))
        return name + " -HH- " + value
    },
    del: function () {
        var result = LocalContractStorage.del("name");
        console.log("del result:"+result)
    }
};

module.exports = SampleContract;
