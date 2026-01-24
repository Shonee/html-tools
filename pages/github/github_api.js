/**
 * GitHub API 操作模块
 * 提供与 GitHub 仓库交互的增删改查功能
 */

class GitHubAPI {
  constructor() {
    this.baseURL = "https://api.github.com";
    this.config = null;
  }

  /**
   * 初始化配置
   * @param {Object} config - 配置对象
   * @param {string} config.accessToken - GitHub Personal Access Token
   * @param {string} config.owner - 仓库所有者（可选）
   * @param {string} config.repo - 仓库名称（可选）
   * @param {string} config.branch - 分支名称（可选，默认: main）
   * @param {string} config.filePath - 文件路径（可选，默认: prompts_data.json）
   */
  async init(config) {
    this.config = {
      accessToken: config.accessToken,
      owner: config.owner || "",
      repo: config.repo || "",
      branch: config.branch || "main",
      filePath: config.filePath || "prompts_data.json",
    };
    
    // 保存配置到 storage
    // await chrome.storage.local.set({ githubConfig: this.config });
    // 保存配置 chrome 插件
    if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ githubConfig: this.config });
    }else {
      // 保存配置 localStorage
      localStorage.setItem("githubConfig", JSON.stringify(this.config));
    }
  }

  /**
   * 从 storage 加载配置
   */
  async loadConfig() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(["githubConfig"], (result) => {
            if (result.githubConfig) {
              this.config = result.githubConfig;
              resolve(true);
            } else {
              resolve(false);
            }
          });
      }else {
        const value = JSON.parse(localStorage.getItem("githubConfig"));
        if (value) {
          this.config = value;
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  }

  /**
   * 获取请求头
   */
  getHeaders() {
    return {
      Authorization: `token ${this.config.accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    };
  }

  /**
   * 从 GitHub 获取文件内容
   * @param {string} filePath - 文件路径（可选，使用配置中的filePath）
   * @param {string} owner - 仓库所有者（可选）
   * @param {string} repo - 仓库名称（可选）
   * @param {string} branch - 分支名称（可选）
   * @returns {Promise<Object>} 返回文件内容、SHA 和类型信息
   */
  async getFile(filePath = null, owner = null, repo = null, branch = null) {
    try {
      const _owner = owner || this.config.owner;
      const _repo = repo || this.config.repo;
      const _branch = branch || this.config.branch;
      const _filePath = filePath || this.config.filePath;
      
      if (!_owner || !_repo) {
        throw new Error("请指定仓库所有者和仓库名称");
      }
      
      if (!_filePath) {
        throw new Error("请指定文件路径");
      }

      const url = `${this.baseURL}/repos/${_owner}/${_repo}/contents/${_filePath}?ref=${_branch}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { content: null, sha: null, isJson: false };
        }
        throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // 先解码 base64 内容
      const decodedContent = decodeURIComponent(escape(atob(data.content)));
      
      // 尝试解析为 JSON，如果失败则返回原始文本
      let content;
      let isJson = false;
      try {
        content = JSON.parse(decodedContent);
        isJson = true;
      } catch (e) {
        // 不是 JSON 格式，返回原始文本
        content = decodedContent;
        isJson = false;
      }
      
      return {
        content: content,
        sha: data.sha,
        isJson: isJson,
        rawContent: decodedContent
      };
    } catch (error) {
      console.error("获取 GitHub 文件失败:", error);
      throw error;
    }
  }

  /**
   * 创建或更新 GitHub 文件
   * @param {Object} content - 文件内容
   * @param {string} sha - 文件的 SHA (更新时必需)
   * @param {string} message - 提交信息
   * @param {string} filePath - 文件路径（可选）
   * @param {string} owner - 仓库所有者（可选）
   * @param {string} repo - 仓库名称（可选）
   * @param {string} branch - 分支名称（可选）
   * @returns {Promise<Object>} 返回更新后的文件信息
   */
  async updateFile(content, sha = null, message = "Update file", filePath = null, owner = null, repo = null, branch = null) {
    try {
      const _owner = owner || this.config.owner;
      const _repo = repo || this.config.repo;
      const _branch = branch || this.config.branch;
      const _filePath = filePath || this.config.filePath;
      
      if (!_owner || !_repo) {
        throw new Error("请指定仓库所有者和仓库名称");
      }
      
      if (!_filePath) {
        throw new Error("请指定文件路径");
      }

      const url = `${this.baseURL}/repos/${_owner}/${_repo}/contents/${_filePath}`;
      
      const body = {
        message: message,
        content: btoa(unescape(encodeURIComponent(content, null, 2))),
        branch: _branch,
      };

      if (sha) {
        body.sha = sha;
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        sha: data.content.sha,
        url: data.content.html_url,
      };
    } catch (error) {
      console.error("更新 GitHub 文件失败:", error);
      throw error;
    }
  }

  /**
   * 删除 GitHub 文件
   * @param {string} sha - 文件的 SHA
   * @param {string} message - 提交信息
   * @param {string} filePath - 文件路径（可选）
   * @param {string} owner - 仓库所有者（可选）
   * @param {string} repo - 仓库名称（可选）
   * @param {string} branch - 分支名称（可选）
   * @returns {Promise<Object>}
   */
  async deleteFile(sha, message = "Delete file", filePath = null, owner = null, repo = null, branch = null) {
    try {
      const _owner = owner || this.config.owner;
      const _repo = repo || this.config.repo;
      const _branch = branch || this.config.branch;
      const _filePath = filePath || this.config.filePath;
      
      if (!_owner || !_repo) {
        throw new Error("请指定仓库所有者和仓库名称");
      }
      
      if (!_filePath) {
        throw new Error("请指定文件路径");
      }

      const url = `${this.baseURL}/repos/${_owner}/${_repo}/contents/${_filePath}`;
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: this.getHeaders(),
        body: JSON.stringify({
          message: message,
          sha: sha,
          branch: _branch,
        }),
      });

      if (!response.ok) {
        throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error("删除 GitHub 文件失败:", error);
      throw error;
    }
  }

  /**
   * 同步本地数据到 GitHub
   * @param {Array} prompts - 提示词数组
   * @returns {Promise<Object>}
   */
  async syncToGitHub(prompts) {
    try {
      // 获取当前文件的 SHA
      const { sha } = await this.getFile();
      
      const data = {
        prompts: prompts,
        version: "1.0.0",
        lastSync: new Date().toISOString(),
      };

      const result = await this.updateFile(
        data,
        sha,
        `Sync prompts data at ${new Date().toLocaleString()}`
      );

      return result;
    } catch (error) {
      console.error("同步到 GitHub 失败:", error);
      throw error;
    }
  }

  /**
   * 从 GitHub 拉取数据到本地
   * @returns {Promise<Array>} 返回提示词数组
   */
  async pullFromGitHub() {
    try {
      const { content } = await this.getFile();
      
      if (!content || !content.prompts) {
        throw new Error("GitHub 文件格式不正确");
      }

      // 保存到本地 storage
      await chrome.storage.local.set({
        myPrompts: content.prompts,
        lastGitHubSync: new Date().toISOString(),
      });

      return content.prompts;
    } catch (error) {
      console.error("从 GitHub 拉取失败:", error);
      throw error;
    }
  }

  /**
   * 测试 GitHub 连接
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      const url = `${this.baseURL}/user`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error("测试 GitHub 连接失败:", error);
      return false;
    }
  }

  /**
   * 获取当前用户信息
   * @returns {Promise<Object>} 返回用户信息
   */
  async getUserInfo() {
    try {
      const url = `${this.baseURL}/user`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("获取用户信息失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户可访问的仓库列表
   * @param {number} per_page - 每页数量（默认30，最大100）
   * @param {number} page - 页码（默认1）
   * @returns {Promise<Array>} 返回仓库列表
   */
  async listRepositories(per_page = 30, page = 1) {
    try {
      const url = `${this.baseURL}/user/repos?per_page=${per_page}&page=${page}&sort=updated`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
      }

      const repos = await response.json();
      return repos.map(repo => ({
        name: repo.name,
        full_name: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        description: repo.description,
        updated_at: repo.updated_at,
        default_branch: repo.default_branch
      }));
    } catch (error) {
      console.error("获取仓库列表失败:", error);
      throw error;
    }
  }

  /**
   * 获取指定仓库的分支列表
   * @param {string} owner - 仓库所有者（可选，使用配置中的owner）
   * @param {string} repo - 仓库名称（可选，使用配置中的repo）
   * @returns {Promise<Array>} 返回分支列表
   */
  async listBranches(owner = null, repo = null) {
    try {
      const _owner = owner || this.config.owner;
      const _repo = repo || this.config.repo;
      
      if (!_owner || !_repo) {
        throw new Error("请指定仓库所有者和仓库名称");
      }

      const url = `${this.baseURL}/repos/${_owner}/${_repo}/branches`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
      }

      const branches = await response.json();
      return branches.map(branch => ({
        name: branch.name,
        protected: branch.protected,
        commit_sha: branch.commit.sha
      }));
    } catch (error) {
      console.error("获取分支列表失败:", error);
      throw error;
    }
  }

  /**
   * 获取指定仓库的文件列表（指定路径下的内容）
   * @param {string} path - 路径（默认为根目录""）
   * @param {string} owner - 仓库所有者（可选）
   * @param {string} repo - 仓库名称（可选）
   * @param {string} branch - 分支名称（可选）
   * @returns {Promise<Array>} 返回文件/目录列表
   */
  async listFiles(path = "", owner = null, repo = null, branch = null) {
    try {
      const _owner = owner || this.config.owner;
      const _repo = repo || this.config.repo;
      const _branch = branch || this.config.branch;
      
      if (!_owner || !_repo) {
        throw new Error("请指定仓库所有者和仓库名称");
      }

      const url = `${this.baseURL}/repos/${_owner}/${_repo}/contents/${path}?ref=${_branch}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
      }

      const contents = await response.json();
      
      // 如果返回的是单个文件而不是数组，则包装成数组
      const items = Array.isArray(contents) ? contents : [contents];
      
      return items.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type, // "file" or "dir"
        size: item.size,
        sha: item.sha,
        download_url: item.download_url
      }));
    } catch (error) {
      console.error("获取文件列表失败:", error);
      throw error;
    }
  }

  /**
   * 从 GitHub URL 下载文件
   * @param {string} url - GitHub 文件的完整 URL
   * @param {boolean} useToken - 是否使用 Access Token 进行认证（私有仓库需要）
   * @returns {Promise<Object>} 返回文件内容、元信息和是否为 JSON
   */
  async downloadFileFromUrl(url, useToken = false) {
    try {
      // 支持多种 GitHub URL 格式
      // 1. https://github.com/owner/repo/blob/branch/path/to/file
      // 2. https://raw.githubusercontent.com/owner/repo/branch/path/to/file
      // 3. https://api.github.com/repos/owner/repo/contents/path/to/file
      
      let apiUrl = url;
      let fileName = "downloaded_file";
      
      // 处理 github.com/blob URL
      if (url.includes('github.com') && url.includes('/blob/')) {
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/);
        if (match) {
          const [, owner, repo, branch, filePath] = match;
          apiUrl = `${this.baseURL}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
          fileName = filePath.split('/').pop();
        }
      }
      // 处理 raw.githubusercontent.com URL
      else if (url.includes('raw.githubusercontent.com')) {
        const match = url.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/);
        if (match) {
          const [, owner, repo, branch, filePath] = match;
          apiUrl = `${this.baseURL}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
          fileName = filePath.split('/').pop();
        }
      }
      // API URL 直接使用
      else if (url.includes('api.github.com/repos')) {
        const match = url.match(/repos\/[^\/]+\/[^\/]+\/contents\/(.+?)(?:\?|$)/);
        if (match) {
          fileName = match[1].split('/').pop();
        }
      }

      // 构建请求头
      const headers = {};
      if (useToken && this.config && this.config.accessToken) {
        headers.Authorization = `token ${this.config.accessToken}`;
        headers.Accept = "application/vnd.github.v3+json";
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("文件不存在或无访问权限，私有仓库请启用 Token 认证");
        }
        throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // 解码 base64 内容
      const decodedContent = decodeURIComponent(escape(atob(data.content)));
      
      // 尝试解析为 JSON
      let content;
      let isJson = false;
      try {
        content = JSON.parse(decodedContent);
        isJson = true;
      } catch (e) {
        content = decodedContent;
        isJson = false;
      }
      
      return {
        content: content,
        rawContent: decodedContent,
        fileName: data.name || fileName,
        size: data.size,
        sha: data.sha,
        isJson: isJson,
        downloadUrl: data.download_url,
        htmlUrl: data.html_url
      };
    } catch (error) {
      console.error("下载 GitHub 文件失败:", error);
      throw error;
    }
  }

  /**
   * 将文件内容保存到本地
   * @param {string} content - 文件内容
   * @param {string} fileName - 文件名
   * @param {boolean} isJson - 是否为 JSON 格式
   */
  saveFileToLocal(content, fileName, isJson = false) {
    try {
      // 创建 Blob 对象
      const blob = new Blob(
        [isJson ? JSON.stringify(content, null, 2) : content],
        { type: isJson ? 'application/json' : 'text/plain' }
      );
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      
      // 清理
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error("保存文件到本地失败:", error);
      throw error;
    }
  }
}

// 导出单例
const githubAPI = new GitHubAPI();
