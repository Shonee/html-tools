import os
from bs4 import BeautifulSoup
import json

print('hello py_gen_config!')

# python os函数遍历同目录下的 pages 目录下的所有文件夹和文件，按照文件夹进行分类处理，解析其中的 html 文件内容
print(os.getcwd())
print(os.listdir("pages"))

tools = []
configs = {"tools": tools}
# print(configs)

def get_html_files(directory):
    """递归获取目录下所有 HTML 文件路径"""
    html_files = []
    # 获取目录的绝对路径
    # abs_directory = os.path.abspath(directory)
    
    for root, dirs, files in os.walk(directory):
        print(f"正在扫描目录: {root}")
        print(f"  子目录: {dirs}")
        print(f"  文件: {files}")
        for file in files:
            if file.endswith(".html"):
                file_path = os.path.join(root, file)
                html_files.append(file_path)
                print(f"  ✓ 找到HTML: {file_path}")
    print(f"\n总共找到 {len(html_files)} 个HTML文件")
    return html_files


def parse_html_config(file_path):
    """解析单个 HTML 文件,提取配置信息"""
    with open(file_path, "r", encoding="utf-8") as f:
        html_content = f.read()
        soup = BeautifulSoup(html_content, "html.parser")
        
        # 判断是否展示,默认不展示
        show = soup.find("meta", attrs={"name": "show"})
        show = show["content"] if show else "false"
        if show == "false":
            return None
        
        # 获取标题,如果为空则展示文件名
        file_name = os.path.basename(file_path)
        title = soup.title.string if soup.title else file_name.split(".")[0]
        
        # 获取 keywords, 判断是否存在,不存在则返回空
        keywords = soup.find("meta", attrs={"name": "keywords"})
        keywords = keywords["content"] if keywords else ""

        # 获取 description
        description = soup.find("meta", attrs={"name": "description"})
        description = description["content"] if description else ""

        # 获取 favicon
        icon = soup.find("meta", attrs={"name": "icon"})
        icon = icon["content"] if icon else ""

        # 获取功能 features 并根据,转成字符串 list
        features = soup.find("meta", attrs={"name": "features"})
        features = features["content"] if features else ""
        features = features.split("，")

        # 获取排序
        rank = soup.find("meta", attrs={"name": "rank"})
        rank = int(rank["content"]) if rank else 0

        config = {
            "icon": icon,
            "title": title,
            "keywords": keywords,
            "features": features,
            "description": description,
            "url": file_path,
            "rank": rank
        }
        return config


def gen_config():
    """生成配置文件"""
    # 1. 获取所有 HTML 文件路径
    html_files = get_html_files("pages")
    
    # 2. 处理每个 HTML 文件
    for file_path in html_files:
        config = parse_html_config(file_path)
        if config:  # 只添加需要展示的配置
            tools.append(config)
    
    return configs

def save_config(configs):
  json_data = json.dumps(configs, ensure_ascii=False, indent=4)
  print(json_data)
  with open("tools-config.json", "w", encoding="utf-8") as f:
    json.dump(configs, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
  configs = gen_config()
  save_config(configs)
