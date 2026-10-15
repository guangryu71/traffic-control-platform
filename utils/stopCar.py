# 地点到当前位置的道路距离字典
distance_dict = {
    "停车场A": 500,
    "停车场B": 800, 
    "停车场C": 300,
    "停车场D": 1200,
    "停车场E": 600,
    "停车场F": 950
}

# 地点停车位信息字典 (总车位, 剩余车位)
parking_info = {
    "停车场A": (50, 15),
    "停车场B": (80, 25),
    "停车场C": (30, 5),
    "停车场D": (100, 40),
    "停车场E": (60, 20),
    "停车场F": (45, 12)
}

# 算法：找出剩余车位前三的停车场
# 按剩余车位数量排序
sorted_parking = sorted(parking_info.items(), 
                       key=lambda x: x[1][1],  # 按剩余车位（元组的第二个元素）排序
                       reverse=True)  # 降序排列

# 取前三位
top_three = sorted_parking[:3]
if __name__ == '__main__':
    # 输出结果
    print("剩余车位前三的停车场：")
    for i, (location, (total, available)) in enumerate(top_three, 1):
        distance = distance_dict[location]
        print(f"第{i}名: {location}")
        print(f"  剩余车位: {available}/{total}")
        print(f"  距离: {distance}米")
        print()