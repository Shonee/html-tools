
console.log("hello gen_config.js!");

// 获取 json 文件
fetch('./tools-config.json')
    .then((response) => response.json())
    .then((json) => console.log(json));
