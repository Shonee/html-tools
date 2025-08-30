class HttpClient {
    constructor(config = {}) {
      this.config = {
        baseURL: '',
        timeout: 10000,
        adapter: 'fetch',
        responseType: 'json',
        headers: {
          'Content-Type': 'application/json',
        },
        ...config
      };
  
      // 注册适配器
      this.adapters = {
        fetch: this.createFetchAdapter(),
        xhr: this.createXHRAdapter(),
        axios: this.createAxiosAdapter()
      };
    }
  
    // 创建Fetch适配器
    createFetchAdapter() {
      return async (config) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
  
        try {
          const response = await fetch(config.url, {
            method: config.method,
            headers: config.headers,
            body: config.data,
            signal: controller.signal
          });
  
          clearTimeout(timeoutId);
  
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
  
          return this.handleResponse(response, config);
        } catch (error) {
          throw this.normalizeError(error);
        }
      };
    }
  
    // 创建XHR适配器
    createXHRAdapter() {
      return (config) => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(config.method, config.url);
  
          // 设置响应类型
          xhr.responseType = config.responseType === 'json' ? 'json' : config.responseType;
  
          // 设置请求头
          Object.entries(config.headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
  
          xhr.timeout = config.timeout;
  
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(this.handleXHRResponse(xhr, config));
            } else {
              reject(this.normalizeError(new Error(`Request failed with status ${xhr.status}`), xhr));
            }
          };
  
          xhr.onerror = () => reject(this.normalizeError(new Error('Network error'), xhr));
          xhr.ontimeout = () => reject(this.normalizeError(new Error('Request timeout'), xhr));
  
          xhr.send(config.data);
        });
      };
    }
  
    // 创建Axios适配器（需要提前引入axios）
    createAxiosAdapter() {
      return async (config) => {
        try {
          const response = await axios({
            url: config.url,
            method: config.method,
            data: config.data,
            headers: config.headers,
            timeout: config.timeout,
            responseType: config.responseType
          });
          return response.data;
        } catch (error) {
          throw this.normalizeError(error);
        }
      };
    }
  
    // 统一响应处理
    handleResponse(response, config) {
      switch(config.responseType) {
        case 'text': return response.text();
        case 'json': return response.json();
        case 'blob': return response.blob();
        case 'arraybuffer': return response.arrayBuffer();
        default: return response;
      }
    }
  
    // 处理XHR响应
    handleXHRResponse(xhr, config) {
      if (config.responseType === 'json') {
        try {
          return JSON.parse(xhr.responseText);
        } catch (e) {
          return xhr.responseText;
        }
      }
      return xhr.response;
    }
  
    // 标准化错误
    normalizeError(error, xhr) {
      return {
        message: error.message,
        code: xhr?.status || 'ECONNABORTED',
        config: this.config,
        isAborted: error.name === 'AbortError'
      };
    }
  
    // 注册自定义适配器
    use(name, adapter) {
      this.adapters[name] = adapter;
    }
  
    // 核心请求方法
    async request(url, config = {}) {
      const mergedConfig = {
        ...this.config,
        ...config,
        headers: {
          ...this.config.headers,
          ...config?.headers
        }
      };
  
      // 处理完整URL
      mergedConfig.url = mergedConfig.baseURL ? 
        new URL(url, mergedConfig.baseURL).toString() : 
        url;
  
      const adapter = this.adapters[mergedConfig.adapter];
      if (!adapter) throw new Error(`Adapter ${mergedConfig.adapter} not found`);
  
      try {
        return await adapter(mergedConfig);
      } catch (error) {
        throw this.normalizeError(error);
      }
    }
  
    // 快捷方法
    get(url, config = {}) {
      return this.request(url, { ...config, method: 'GET' });
    }
  
    post(url, data, config = {}) {
      return this.request(url, { ...config, method: 'POST', data });
    }
  
    put(url, data, config = {}) {
      return this.request(url, { ...config, method: 'PUT', data });
    }
  
    delete(url, config = {}) {
      return this.request(url, { ...config, method: 'DELETE' });
    }
  }
  
  /****************** 使用示例 ******************/
//   // 初始化实例
//   const http = new HttpClient({
//     baseURL: 'https://api.example.com/v1',
//     adapter: 'fetch', // 默认使用fetch
//     responseType: 'json'
//   });
  
//   // GET请求（JSON）
//   http.get('/users')
//     .then(data => console.log('Users:', data))
//     .catch(error => console.error('Error:', error));
  
//   // POST请求（FormData）
//   const formData = new FormData();
//   formData.append('file', fileInput.files[0]);
//   http.post('/upload', formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data'
//     },
//     responseType: 'text',
//     adapter: 'xhr' // 强制使用XHR
//   });
  
//   // 获取图片（Blob）
//   http.get('/image.jpg', {
//     responseType: 'blob'
//   }).then(blob => {
//     const img = document.createElement('img');
//     img.src = URL.createObjectURL(blob);
//     document.body.appendChild(img);
//   });
  
//   // 使用Axios适配器
//   http.get('/data', {
//     adapter: 'axios',
//     responseType: 'arraybuffer'
//   }).then(arrayBuffer => {
//     // 处理二进制数据
//   });
  
//   // 自定义适配器
//   http.use('custom', (config) => {
//     // 实现自定义请求逻辑
//     return Promise.resolve('Custom response');
//   });


// 初始化实例
// const http = new HttpClient({
//     baseURL: 'https://dayu.qqsuu.cn/xingzuoyunshi/apis.php',
//     adapter: 'axios', // 默认使用fetch
//     responseType: 'text'
// });

// http.get('')
//     .then(data => console.log('Response:', data))
//     .catch(error => console.error('Error:', error));



// 报错：XMLHttpRequest is not defined
// 原因：node环境不支持XMLHttpRequest，需要安装 npm install xmlhttprequest
// 安装后，在代码中引入使用
// var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
// var xhr = new XMLHttpRequest();

// 报错：Uncaught ReferenceError: sendRequest is not defined at HTMLButtonElement.onclick
// 原因：sendRequest 函数未定义
// 解决：将 sendRequest 函数定义在 HTML 按钮的 onclick 事件中
// [在 html 标签中使用 onclick 绑定事件时 报错 Uncaught ReferenceError: handleClick is not defined\_htmlbuttonelement.onclick-CSDN 博客](https://blog.csdn.net/JZH20/article/details/109572181)
// [报错 Uncaught ReferenceError: xxx is not defined at HTMLButtonElement.onclick\_ones is not defined at htmlbuttonelement.onclick-CSDN 博客](https://blog.csdn.net/qq_39019865/article/details/79867091)


// [分享一些前端常用功能集合我在做一些\`H5\`单页（活动页）的时候，像我这种最求极致加载速度，且不喜欢用第三方库的人，所以决 - 掘金](https://juejin.cn/post/6844904066418491406#heading-1)
// [怎么用原生js获取json | PingCode智库](https://docs.pingcode.com/baike/3867386)
/**
 * 基于`fetch`请求 [MDN文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API)
 * @param {"GET"|"POST"|"PUT"|"DELETE"} method 请求方法
 * @param {string} url 请求路径
 * @param {object|FormData|string=} data 传参对象，json、formdata、普通表单字符串
 * @param {RequestInit & { timeout: number }} option 其他配置
 */
function fetchRequest(method, url, data = {}, option = {}) {
    /** 非`GET`请求传参 */
    let body = undefined;
    /** `GET`请求传参 */
    let query = "";
    /** 默认请求头 */
    const headers = {};
    /** 超时毫秒 */
    const timeout = option.timeout || 8000;
    /** 传参数据类型 */
    const dataType = checkType(data);
    // 传参处理
    if (method === "GET") {
      // 解析对象传参
      if (dataType === "object") {
        for (const key in data) {
          query += "&" + key + "=" + data[key];
        }
      } else {
        console.warn("fetch 传参处理 GET 传参有误，需要的请求参数应为 object 类型");
      }
      if (query) {
        query = "?" + query.slice(1);
        url += query;
      }
    } else {
      body = ["object", "array"].includes(dataType) ? JSON.stringify(data) : data;
    }
    // 设置对应的传参请求头，GET 方法不需要
    if (method !== "GET") {
      switch (dataType) {
        case "object":
        case "array":
          headers["Content-Type"] = "application/json";
          break;
  
        case "string":
          headers["Content-Type"] = "application/x-www-form-urlencoded"; // 表单请求，`id=1&type=2` 非`new FormData()`
          break;
  
        default:
          break;
      }
    }
    const controller = new AbortController();
    let timer;
    return new Promise(function(resolve, reject) {
      fetch(url, {
        method,
        body,
        headers,
        signal: controller.signal,
        // credentials: "include",  // 携带cookie配合后台用
        // mode: "cors",            // 配合后台设置用的跨域模式
        ...option,
      }).then(response => {
        // 把响应的信息转为`json`
        return response.json();
      }).then(res => {
        clearTimeout(timer);
        resolve(res);
      }).catch(error => {
        clearTimeout(timer);
        reject(error);
      });
      timer = setTimeout(function() {
        reject("fetch is timeout");
        controller.abort();
      }, timeout);
    });
}
  
//   调用
fetch("http://xxx.com/api/get").then(response => response.json()).then(res => {
console.log("请求成功", res);
})

