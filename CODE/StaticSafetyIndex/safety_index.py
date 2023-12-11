import pandas as pd
import json
import numpy as np 

def sigmoid(x):
    return 2 * (1/(1 + np.exp(-0.21 * x)) - 0.5)

maxx = 1
print("14", 1 - sigmoid(14/maxx))
print("30", 1 - sigmoid(30/maxx))
print("74", 1 - sigmoid(74/maxx))
print("3", 1 - sigmoid(3/maxx))
print("2", 1 - sigmoid(2/maxx))
print("1", 1 - sigmoid(1/maxx))
print("0", 1 - sigmoid(0/maxx))

print("Loading json...")
with open ("edges_matched_final.json", "r") as f:
    edges = json.load(f)

df_acc = pd.read_csv("../dataset/GA_Accidents_March23.csv")
df_edg = pd.read_csv("../osm/edges.csv")

print("Calculating safety index...")
l = 0
acc_arr = []
for k, v in edges.items():
    l = max(l, len(v['acc']))
    if len(v['acc']) > 0:
        acc_arr.append((len(v['acc']), k))

print(l)
print(len(acc_arr))
acc_arr.sort(reverse=True)
print(acc_arr[:5])

def add_new_columns(new_columns):
    # Add new columns with the specified values
    for column_name, column_values in new_columns.items():
        df_edg[column_name] = column_values

    # Save the DataFrame to a new CSV file
    df_edg.to_csv("edges_si2.csv", index=False)

# Start_Time
new_col_data = {}
for i in range(24):
    new_col_data["SI2_{}".format(str(i).zfill(2))] = []
print(new_col_data)

b_num = 100
big100 = []
for i, (k, v) in enumerate(edges.items()):
    if i > 0 and i % 100000 == 0:
        print("[{0}/{1}]".format(i, len(edges.items())))
    for kk in new_col_data:
        new_col_data[kk].append(0)
    for acc in v['acc']:
        hr = str(df_acc.loc[df_acc.ID == acc, 'Start_Time'].values[0]).split(" ")[1].split(":")[0]
        new_col_data["SI2_{}".format(hr)][-1] += 1
    # calculate safety index
    for kk in new_col_data:
        if new_col_data[kk][-1] > 0:
            big100.append(new_col_data[kk][-1])
        new_col_data[kk][-1] = (1 - sigmoid(new_col_data[kk][-1]))
    # if len(big100) > b_num:
    #     big100.sort(reverse=True)
    #     big100 = big100[:b_num]

print("Sorting...")
big100.sort(reverse=True)
print(len(big100))
print(big100[:len(big100)//10])
print(big100[len(big100)//100], big100[len(big100)//33], big100[len(big100)//20], big100[len(big100)//10])
np.save("accident_count.npy", np.array(big100))

add_new_columns(new_col_data)

# print("writing new json with safety index...")
# with open ("edges_matched_final.json", "w") as f:
#     json.dump(edges, f, indent=4)