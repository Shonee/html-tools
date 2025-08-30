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
