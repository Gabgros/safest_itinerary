# SafeItinerary
Project CSE6242, group 46
Camille MIGOZZI, Aubin REY, Gabriel GROS, Tien LU, Ting-Yang KAO

## Data Visualization
This folder contains the original data and the generated pictures and html.
For the web page to load, download the following files and put it into the same folder (directory)
file: test.html
folder: pics (and all picture files in it)
folder: interactive (and all html file in it)
If the user want to generate pictures and interactive html by itself, download the following files and put it into the same folder (directory):
folder: dataset (which include US_Accidents_March23.csv, GA_Accidents_March23.csv, and population.csv)
file: test.ipynb
run the test.ipynb file, the pictures and interactive html will be generated and put in the pics folder and interactive folder.

## Data Preprocessing
This folder contains the following two file:
preprocessing.ipynb: this ifle is used to filter out the accidents took place in Georgia and create a joint JSON file for later accident matching.
accident_assignment.py: this file is for assigning each accident to its nearest road in Atlanta. It utilized multiprocessing to speed up the matching.
These scripts need some intermediate files to run, which are not offered here.

## StaticSafetyIndex
This folder contains the python script for statistical hourly safety index generation. It needs several files to run including the joint JSON file of accidents and roads, and the accidents and edges csv files.

## Data Prediction
[WARNINGS] This file uses prophet to make time series forecasting using the Facebook Prophet. The only library that has to be downloaded is prophet (if you’re planning to run the code locally, please make sure your C++ compiler version is at least 11.2.0). Moreover, the cpu parallelization of multiprocessing library might not accelerate the obtention of prophet predictions locally but will save a lot of time on Colab.

The notebook is organized into the following sections: Setup, Data Preprocessing, Prophet Model Training, Saving Results, Final Lengths Calculation and Visualization
To run the code:
1. Ensure Google Drive is mounted and paths are set correctly (and if you run the code locally, please don’t pay attention to the two first cells of the notebook)
2. Execute the notebook cells in order.

Needed files: 'GA_Accidents_March23.csv': Contains the id of every accident and the corresponding information; 'edges_matched_final.json': A dictionary of roads and their list of accidents and './edges.csv': The original file containing the length of road segments.

Obtained files:  `estimated_nb_acc.csv`: Contains the estimated number of accidents for each road segment and `new_edges_dataset.csv`: Final dataset with calculated road lengths based on safety index.

Notes: The code demonstrates the use of Facebook Prophet for time series analysis on road accident data. Various parameters and techniques, such as CPU boosting and safety index calculation, are applied for accurate predictions.

## Itinerary planning
Code to launch a web app that allows the user to select a departure and arrival point on a map and computes 1 fastest itinerary and 2 safe itineraries.
No specific installation needed, to launch the web page run : 
python -m http.server
and open http://localhost:8000/ (or the corresponding port displayed in the terminal)
Important note : computation of an itinerary will not be possible since it requires 2 csv files with the graph information (which is too heavy for github).
