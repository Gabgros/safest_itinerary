import json
import pandas as pd
from scipy.spatial.distance import cdist
import numpy as np
import time
import multiprocessing

def calculate_distance_to_line(x0, y0, x1, y1, x2, y2):
    point = np.array([[x0, y0]])
    line_points = np.array([[x1, y1], [x2, y2]])

    distances = cdist(point, line_points, 'euclidean')

    return distances[0, 0]

def worker(start, end, id_list, ln_list, la_list, edges):
    partitiion = start // (end - start - 100)
    for i in range(start, end):
        acc_id, acc_lon, acc_lat = id_list[i], ln_list[i], la_list[i]
        min_dist = float('inf')
        for key, val in edges.items():
            x0, y0 = float(acc_lon), float(acc_lat)
            x1, y1 = val['src']
            x2, y2 = val['tar']
            if abs(((x1 + x2) / 2) - x0) + abs(((y1 + y2) / 2) - y0) < 0.0075:
                distance = calculate_distance_to_line(x0, y0, x1, y1, x2, y2)
                if distance < min_dist:
                    min_dist = distance
                    min_edge = key
        
        if min_dist != float('inf'):
            edges[min_edge]['acc'].append(acc_id)
            # print(min_edge, acc_id)

        if i % 1000 == 0:
            print("Progress: [{0}/{1}]".format(i, end), flush=True)
        if i > 0 and i % 10000 == 0:
            print("Writing current json file of edges (partition {0}, iteration {1})...".format(partitiion, i), flush=True)
            with open ("osm/edges_matched_{0}-{1}.json".format(partitiion, i), "w") as f:
                json.dump(dict(edges), f, indent=4)

        # if i > start + 5:
        #     break

    print("Writing new json file of edges...")
    with open ("osm/edges_matched_{}.json".format(partitiion), "w") as f:
        json.dump(dict(edges), f, indent=4)

def parallelize_code(id_list, ln_list, la_list, edges):
    num_processes = multiprocessing.cpu_count() // 4
    total_items = len(id_list)
    items_per_process = total_items // num_processes

    process_ranges = [(i * items_per_process, (i + 1) * items_per_process) for i in range(num_processes - 1)]
    process_ranges.append(((num_processes - 1) * items_per_process, total_items))

    with multiprocessing.Pool() as pool:
        pool.starmap(worker, [(start, end, id_list, ln_list, la_list, edges) for start, end in process_ranges])

if __name__ == "__main__":
    print("Loading csv...")
    df_acc = pd.read_csv("dataset/GA_Accidents_March23.csv")
    df_acc = df_acc.filter(items=['ID', 'Start_Lat', 'Start_Lng'])

    id_list = df_acc['ID'].tolist()
    ln_list = df_acc['Start_Lng'].tolist()
    la_list = df_acc['Start_Lat'].tolist()

    print("Loading json...")
    # read nodes and edges file
    with open ("osm/nodes.json", "r") as f:
        nodes = json.load(f)
    with open ("osm/edges.json", "r") as f:
        edges = json.load(f)
    
    print("Running matching in parallel...")
    t1 = time.time()
    parallelize_code(id_list, ln_list, la_list, edges)
    print("Total Time:", time.time() - t1)
