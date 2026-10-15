import random

def optimize_traffic_lights(data, population_size=50, generations=100, mutation_rate=0.1):
    intersections = data['intersections']
    n_intersections = len(intersections)  # 添加这行定义路口数量
    
    # 目标函数 - 最小化总等待时间（考虑各相位时间）
    def fitness_function(solution):
        total_wait_time = 0
        for i, intersection in enumerate(intersections):
            # 获取当前路口的相位配置（假设每个路口有2个主要相位）
            green_time = solution[i*3]  # 主相位绿灯时间
            yellow_time = solution[i*3+1]  # 黄灯时间
            red_time = solution[i*3+2]  # 红灯时间
            
            # 计算周期总时长
            cycle_time = green_time + yellow_time + red_time
            
            # 等待时间与交通量、红灯时间成正比
            wait_time = intersection['traffic_volume'] * red_time / 1000
            total_wait_time += wait_time
            
            # 约束条件惩罚
            if green_time < 15 or green_time > 90:  # 绿灯时间15-90秒
                total_wait_time += 1000
            if yellow_time < 3 or yellow_time > 10:  # 黄灯时间3-10秒
                total_wait_time += 500
            if cycle_time < 30 or cycle_time > 180:  # 总周期30-180秒
                total_wait_time += 1500
                
        return -total_wait_time  # 最小化等待时间
    
    # 初始化种群（每个个体包含[绿灯,黄灯,红灯]×路口数）
    def initialize_population():
        population = []
        for _ in range(population_size):
            individual = []
            for _ in intersections:
                green = random.randint(15, 90)
                yellow = random.randint(3, 10)
                red = random.randint(10, 60)
                individual.extend([green, yellow, red])
            population.append(individual)
        return population
    
    # 选择 - 锦标赛选择
    def selection(population, fitnesses, k=3):
        selected = []
        for _ in range(len(population)):
            tournament = random.sample(list(zip(population, fitnesses)), k)
            winner = max(tournament, key=lambda x: x[1])
            selected.append(winner[0])
        return selected
    
    # 交叉 - 单点交叉
    def crossover(parent1, parent2):
        point = random.randint(1, n_intersections-1)  # 现在n_intersections已定义
        child1 = parent1[:point] + parent2[point:]
        child2 = parent2[:point] + parent1[point:]
        return child1, child2
    
    # 变异
    def mutate(individual):
        for i in range(len(individual)):
            if random.random() < mutation_rate:
                individual[i] = random.randint(30, 180)
        return individual
    
    # 主算法流程
    population = initialize_population()
    best_solution = None
    best_fitness = float('-inf')
    
    for generation in range(generations):
        # 评估适应度
        fitnesses = [fitness_function(ind) for ind in population]
        
        # 记录最佳个体
        current_best_idx = fitnesses.index(max(fitnesses))
        if fitnesses[current_best_idx] > best_fitness:
            best_fitness = fitnesses[current_best_idx]
            best_solution = population[current_best_idx]
        
        # 选择
        selected = selection(population, fitnesses)
        
        # 交叉
        next_population = []
        for i in range(0, len(selected), 2):
            if i+1 < len(selected):
                child1, child2 = crossover(selected[i], selected[i+1])
                next_population.extend([child1, child2])
            else:
                next_population.append(selected[i])
    
    # 返回优化结果
    optimized_intersections = []
    for i, intersection in enumerate(intersections):
        green = best_solution[i*3]
        yellow = best_solution[i*3+1]
        red = best_solution[i*3+2]
        cycle = green + yellow + red
        
        optimized_intersections.append({
            "id": intersection['id'],
            "name": intersection['name'],
            "original_cycle": intersection['signal_cycle'],
            "optimized_cycle": cycle,
            "phases": {
                "original": {
                    "green": intersection.get('green_time', int(intersection['signal_cycle']*0.6)),
                    "yellow": intersection.get('yellow_time', 5),
                    "red": intersection.get('red_time', int(intersection['signal_cycle']*0.4)-5)
                },
                "optimized": {
                    "green": green,
                    "yellow": yellow,
                    "red": red
                }
            },
            "change": cycle - intersection['signal_cycle']
        })
    
    return {
        "optimized_intersections": optimized_intersections,
        "estimated_wait_time_reduction": -best_fitness
    }