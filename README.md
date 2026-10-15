# 数据驱动型交通流量管理平台

基于Python+Flask的城市交通数据管理与信号优化平台：上传车流数据后，自动完成统计分析、路口聚类、信号配时优化、绿波车速诱导与可视化呈现，并支持导出分析报告。单机运行，无需数据库。

## 功能特性

### 数据管理与分析
- 支持一键上传 `real_traffic_flow.csv` 与 `real_intersections.json`，上传后自动解析并沿用历史数据
- 流量统计：总流量、平均拥堵指数、东西南北四向流量结构、基于75分位数的高峰时段识别
- 拥堵指数按流量与基准流量的比值分段映射到0~10分，避免单一线性模型失真
- Chart.js可视化：24小时流量与拥堵指数双轴折线图、四向流量结构环形图

### 交通算法
- **路口聚类**：自研K-Means实现（K-means++初始化、Z-Score标准化、收敛判定），按车流量、信号周期、高峰时长对路口分级，聚类数2~5可调
- **信号配时优化**：遗传算法以流量与红灯时长为适应度目标，在绿灯15~90秒、黄灯3~10秒、总周期30~180秒等工程约束下寻优，输出各路口优化前后灯时、总周期变化与等待时间下降幅度
- **绿波车速诱导**：由交叉口间距与信号周期反推建议车速，给出分段车速、行程时间节省与驾驶建议
- **停车诱导**：按剩余车位排序推荐前三停车场并给出距离

### 辅助模块
- **AI助手**：对接Ollama本地大模型（默认DeepSeek-R1），流式输出交通场景问答，数据不出本机
- **笔记本**：标签化笔记的增删改查，数据存于浏览器localStorage
- **地图标注**：底图缩放、拖拽平移，支持标记的添加、编辑、清除，标记位置本地持久化
- **优化记录**：历史优化方案集中展示，含流量、等待时间、灯时优化与绿波速度
- **报告导出**：将分析与优化结果导出为TXT报告

### 账号与交付
- 注册、登录、Session会话鉴权与路由拦截
- PyInstaller打包为免安装单文件程序，双击自动唤起浏览器，无操作约16分钟自动退出进程

## 技术栈

| 层次 | 技术 |
| --- | --- |
| 后端 | Python、Flask、Jinja2、Session鉴权 |
| 前端 | 原生JavaScript、Bootstrap5、Chart.js、FontAwesome、SVG |
| 算法 | 自研K-Means聚类、遗传算法、绿波车速模型（纯Python，无第三方依赖） |
| AI | Ollama + DeepSeek-R1，Fetch流式读取 |
| 存储 | CSV / JSON文件持久化，浏览器localStorage |
| 部署 | PyInstaller单文件打包 |

## 项目结构

```
trafficControl/
├── app.py                      # Flask主程序：18个接口，路由与业务编排
├── app.spec                    # PyInstaller打包配置
├── requirements.txt
├── map.png                     # 平台配图
├── ai/
│   └── deepseekAi.py           # Ollama本地大模型命令行版调用示例
├── utils/
│   ├── data_analysis_simple.py # 流量统计与高峰时段识别
│   ├── kmeans_clustering.py    # 自研K-Means聚类（含自测用例）
│   ├── genetic_algorithm.py    # 信号配时遗传算法
│   ├── greenspeed.py           # 绿波车速计算
│   └── stopCar.py              # 停车诱导
├── data/
│   ├── real_traffic_flow.csv   # 24小时车流样例数据
│   ├── real_intersections.json # 12个路口样例数据
│   └── user.csv                # 账号数据（本地生成，不纳入版本管理）
├── templates/                  # base、login、dashboard、getFenXi、note、ollama_chat
└── static/
    ├── css/style.css
    ├── js/main.js              # 图表绘制、算法交互、地图标注、报告导出
    └── images/                 # 地图底图与标记图标
```

## 快速开始

环境要求：Python 3.9及以上。

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 启动平台（会自动打开浏览器）
python app.py
```

默认访问地址：<http://127.0.0.1:5001>

首次运行`data/user.csv`不存在，在登录页点击「注册」创建账号（用户名不少于3位，密码不少于6位）即可进入主面板。

## 数据格式

`data/real_traffic_flow.csv`（24小时车流量）：

```csv
hour,flow
0,429
1,364
```

`data/real_intersections.json`（路口信号配置）：

```json
[
  {
    "id": 1,
    "name": "车站街与龙泉路交叉口",
    "traffic_volume": 850,
    "signal_cycle": 90,
    "peak_hours": [7, 8, 17, 18],
    "green_time": 54,
    "yellow_time": 5,
    "red_time": 31
  }
]
```

字段说明：`traffic_volume`为单位时间车流量，`signal_cycle`为信号周期秒数，`peak_hours`为高峰小时，`green_time`/`yellow_time`/`red_time`为当前相位配时；缺省时平台按周期的60%绿灯、5秒黄灯自动补齐。

## 算法说明

- **拥堵指数**：以基准流量500辆为分界，按流量比值分段线性映射，比值3倍以上增长放缓，封顶10分。
- **聚类**：先按特征的均值与标准差做Z-Score标准化，消除量纲差异后用K-means++选择初始中心，迭代至中心位移小于1e-4，输出的聚类中心再反标准化回原始量纲，便于业务解读。
- **信号配时**：种群规模50、迭代100代，锦标赛选择配单点交叉与变异，越界配时按约束类型累加惩罚项；适应度取负的总等待时间，最终输出每个路口的灯时建议。
- **绿波车速**：对每个路段枚举信号周期的整数倍通行窗口，计算落在20~80km/h合理区间的候选车速，优先选取贴近基准速度的方案，并折算全程行程时间节省。

## AI助手（可选）

网页版AI助手直接由浏览器请求本地Ollama服务，需先在本机启动Ollama并拉取模型：

```bash
ollama serve
ollama pull deepseek-r1:8b
```

如需命令行版对话，运行`python ai/deepseekAi.py`（依赖`requests`，服务地址<http://localhost:11434>）。

## 打包为可执行文件

```bash
pyinstaller app.spec
```

产物位于`dist/app/`，双击`app.exe`即可运行，无需目标机器安装Python环境。

## 已知限制

- 账号密码以明文存储于`data/user.csv`，仅适用于本地演示，不建议用于生产环境
- 数据以本地CSV/JSON文件保存，不支持多用户并发写入
- 绿波车速接口当前使用固定的示例路段与基准速度，接入真实路网时需替换交叉口坐标
- 聚类与配时针对单路口规模数据设计，路口数量大幅增加时需改用向量化实现

## 说明

分析所用数据为样例行数据，用于演示平台完整链路，不代表真实路况统计结果。
