import random


def euclidean_distance(a, b):
    """计算两点之间的欧几里得距离"""
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


def kmeans_fit_predict(features, n_clusters=3, max_iters=300, tol=1e-4, random_state=42):
    """
    自定义 KMeans 算法实现，不依赖 numpy
    
    Args:
        features: 输入特征数据，列表的列表
        n_clusters: 聚类数量
        max_iters: 最大迭代次数
        tol: 收敛容忍度
        random_state: 随机种子
    
    Returns:
        tuple: (labels, cluster_centers, inertia, n_iter)
    """
    # 设置随机种子
    if random_state is not None:
        random.seed(random_state)
    
    X = features
    n_samples = len(X)
    n_features = len(X[0]) if X else 0
    
    # 1. 初始化聚类中心 - 使用 K-means++
    def initialize_centroids(X, k):
        centroids = [X[random.randint(0, n_samples - 1)]]
        
        for _ in range(1, k):
            distances = []
            for x in X:
                min_dist = min(euclidean_distance(x, c) for c in centroids)
                distances.append(min_dist)
            
            probabilities = [d ** 2 for d in distances]
            total = sum(probabilities)
            probabilities = [p / total for p in probabilities]
            
            cumulative_probs = []
            cum_sum = 0
            for p in probabilities:
                cum_sum += p
                cumulative_probs.append(cum_sum)
            
            r = random.random()
            for j, p in enumerate(cumulative_probs):
                if r < p:
                    centroids.append(X[j])
                    break
        
        return centroids
    
    # 2. 分配样本到最近的聚类中心
    def assign_clusters(X, centroids):
        labels = []
        for x in X:
            distances = [euclidean_distance(x, centroid) for centroid in centroids]
            labels.append(distances.index(min(distances)))
        return labels
    
    # 3. 更新聚类中心
    def update_centroids(X, labels, k):
        new_centroids = []
        for cluster_id in range(k):
            cluster_points = [X[i] for i in range(len(X)) if labels[i] == cluster_id]
            if cluster_points:
                # 计算平均值
                n_points = len(cluster_points)
                n_features = len(cluster_points[0])
                centroid = []
                for j in range(n_features):
                    feature_sum = sum(point[j] for point in cluster_points)
                    centroid.append(feature_sum / n_points)
                new_centroids.append(centroid)
            else:
                # 如果簇为空，随机重新初始化
                new_centroids.append(X[random.randint(0, len(X) - 1)])
        return new_centroids
    
    # 4. 计算簇内平方和（inertia）
    def calculate_inertia(X, labels, centroids):
        inertia = 0.0
        for i, x in enumerate(X):
            centroid = centroids[labels[i]]
            inertia += euclidean_distance(x, centroid) ** 2
        return inertia
    
    # 主算法流程
    centroids = initialize_centroids(X, n_clusters)
    
    for iteration in range(max_iters):
        # 分配簇标签
        labels = assign_clusters(X, centroids)
        
        # 更新聚类中心
        new_centroids = update_centroids(X, labels, n_clusters)
        
        # 检查收敛
        max_shift = max(euclidean_distance(c1, c2) for c1, c2 in zip(centroids, new_centroids))
        centroids = new_centroids
        
        if max_shift < tol:
            break
    
    # 最终分配和计算 inertia
    final_labels = assign_clusters(X, centroids)
    inertia = calculate_inertia(X, final_labels, centroids)
    
    return final_labels, centroids, inertia, iteration + 1

def perform_kmeans(data, n_clusters=3):
    """
    执行 K-means 聚类分析，不依赖 numpy
    
    Args:
        data: 包含路口数据的字典
        n_clusters: 聚类数量，默认为3
    
    Returns:
        dict: 包含聚类结果的字典，格式与原始代码完全一致
    """
    # 准备路口特征数据
    intersections = data['intersections']
    features = []
    
    for intersection in intersections:
        features.append([
            intersection['traffic_volume'],
            intersection['signal_cycle'],
            len(intersection['peak_hours'])
        ])
    
    # 标准化特征
    n_samples = len(features)
    n_features = len(features[0]) if features else 0
    
    # 计算每个特征的均值和标准差
    means = []
    stds = []
    
    for j in range(n_features):
        feature_values = [features[i][j] for i in range(n_samples)]
        mean_val = sum(feature_values) / n_samples
        variance = sum((x - mean_val) ** 2 for x in feature_values) / n_samples
        std_val = variance ** 0.5
        
        # 处理标准差为零的情况
        if std_val < 1e-10:
            std_val = 1.0
            
        means.append(mean_val)
        stds.append(std_val)
    
    # 标准化特征数据
    features_standardized = []
    for i in range(n_samples):
        standardized_sample = []
        for j in range(n_features):
            standardized_val = (features[i][j] - means[j]) / stds[j]
            standardized_sample.append(standardized_val)
        features_standardized.append(standardized_sample)
    
    # 执行K-means聚类 - 使用自定义实现
    clusters, cluster_centers_standardized, inertia, n_iter = kmeans_fit_predict(
        features_standardized, 
        n_clusters=n_clusters, 
        random_state=42
    )
    
    # 将聚类中心反标准化为原始尺度
    cluster_centers_original = []
    for center in cluster_centers_standardized:
        original_center = [center[j] * stds[j] + means[j] for j in range(n_features)]
        cluster_centers_original.append(original_center)
    
    # 将聚类结果添加到路口数据中
    for i, intersection in enumerate(intersections):
        intersection['cluster'] = int(clusters[i])
    
    # 构建聚类分组信息
    cluster_groups = {}
    for i in range(n_clusters):
        cluster_groups[i] = [
            intersection['name'] for intersection in intersections
            if intersection['cluster'] == i
        ]
    
    # 返回与原始代码完全一致的格式
    return {
        "clustered_intersections": intersections,
        "cluster_centers": cluster_centers_original,
        "inertia": float(inertia),
        "clusters": cluster_groups
    }

# 测试代码 - 确保与原始代码行为一致
if __name__ == "__main__":
    # 创建测试数据
    test_data = {
        "intersections": [
            {"name": "A", "traffic_volume": 100, "signal_cycle": 60, "peak_hours": [7, 8, 9]},
            {"name": "B", "traffic_volume": 200, "signal_cycle": 90, "peak_hours": [7, 8]},
            {"name": "C", "traffic_volume": 150, "signal_cycle": 75, "peak_hours": [17, 18]},
            {"name": "D", "traffic_volume": 300, "signal_cycle": 120, "peak_hours": [7, 8, 17, 18]},
            {"name": "E", "traffic_volume": 80, "signal_cycle": 45, "peak_hours": [12]},
            {"name": "F", "traffic_volume": 250, "signal_cycle": 100, "peak_hours": [7, 8, 17, 18, 19]},
        ]
    }
    
    print("执行自定义 KMeans 聚类...")
    result = perform_kmeans(test_data, n_clusters=2)
    
    print("\n聚类结果:")
    print(f"簇内平方和 (inertia): {result['inertia']:.4f}")
    print(f"聚类中心: {result['cluster_centers']}")
    
    print("\n各簇分组:")
    for cluster_id, intersections in result['clusters'].items():
        print(f"簇 {cluster_id}: {intersections}")
    
    print("\n详细路口信息:")
    for intersection in result['clustered_intersections']:
        print(f"{intersection['name']}: 流量={intersection['traffic_volume']}, "
              f"周期={intersection['signal_cycle']}, 簇={intersection['cluster']}")