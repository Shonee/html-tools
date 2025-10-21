// 使用 import 会报错 SyntaxError: Cannot use import statement outside a module
// import fetch from "node-fetch";

console.log("hello gen_config.js!");

const fetch = require("node-fetch")

// 获取 json 文件
fetch('./tools-config.json')
    .then((response) => response.json())
    .then((json) => console.log(json));
