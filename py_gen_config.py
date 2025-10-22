import os
from bs4 import BeautifulSoup
import json

print('hello py_gen_config!')


tools = []
configs = {"tools": tools}
# print(configs)

def gen_config():
  for root, dirs, files in os.walk("pages"):
      for file in files:
          if file.endswith(".html"):
              file_path = os.path.join(root, file)
              # print(file_path)
              with open(file_path, "r", encoding="utf-8") as f:
                  html_content = f.read()
                  soup = BeautifulSoup(html_content, "html.parser")
                  # 获取标题
                  title = soup.title.string
                  print(title)
  
                  # 获取 keywords
                  keywords = soup.find("meta", attrs={"name": "keywords"})["content"]
                  print(keywords)
  
                  # 获取 description
                  description = soup.find("meta", attrs={"name": "description"})["content"]
                  print(description)
  
                  # # 获取 favicon
                  # icon = soup.find("link", attrs={"rel": "icon"})["href"]
                  # print(icon)
  
                  # 获取 favicon
                  icon = soup.find("meta", attrs={"name": "icon"})["content"]
                  print(icon)
  
                  # 获取功能 feture 并根据，转成字符串 list
                  features = soup.find("meta", attrs={"name": "features"})["content"]
                  features = features.split("，")
                  print(features)
  
                  config = {
                      "title": title,
                      "keywords": keywords,
                      "description": description,
                      "icon": icon,
                      "features": features
                  }
                  tools.append(config)
  print(configs)
  return configs

def save_config(configs):
  json_data = json.dumps(configs, ensure_ascii=False, indent=4)
  print(json_data)
  # with open("tools-config.json", "w", encoding="utf-8") as f:
  #   json.dump(configs, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
  configs = gen_config()
  save_config(configs)

