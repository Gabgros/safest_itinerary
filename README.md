# SafeItinerary

Project CSE6242, Group 46  
Camille MIGOZZI, Aubin REY, Gabriel GROS, Tien LU, Ting-Yang KAO

### DATA ON DEMAND ###

## Data Visualization

This folder contains the original data and the generated pictures and HTML.

To load the web page, download the following files and place them in the same folder (directory):
- File: `test.html`
- Folder: `pics` (and all picture files in it)
- Folder: `interactive` (and all HTML files in it)

If the user wants to generate pictures and interactive HTML independently, download the following files and place them in the same folder (directory):
- Folder: `dataset` (which includes `US_Accidents_March23.csv`, `GA_Accidents_March23.csv`, and `population.csv`)
- File: `test.ipynb`

Run the `test.ipynb` file, and the pictures and interactive HTML will be generated and placed in the `pics` folder and `interactive` folder.

## Data Preprocessing

This folder contains the following two files:

- `preprocessing.ipynb`: This file is used to filter out accidents that took place in Georgia and create a joint JSON file for later accident matching.
- `accident_assignment.py`: This file is for assigning each accident to its nearest road in Atlanta. It utilizes multiprocessing to speed up the matching.

These scripts require some intermediate files to run, which are not provided here.

## StaticSafetyIndex

This folder contains the Python script for statistical hourly safety index generation. It needs several files to run, including the joint JSON file of accidents and roads, and the accidents and edges CSV files.

## Data Prediction

[WARNINGS] This file uses Prophet to make time series forecasting using Facebook Prophet. The only library that has to be downloaded is Prophet (if you're planning to run the code locally, please make sure your C++ compiler version is at least 11.2.0). Moreover, the CPU parallelization of the multiprocessing library might not accelerate the obtaining of Prophet predictions locally but will save a lot of time on Colab.

The notebook is organized into the following sections: Setup, Data Preprocessing, Prophet Model Training, Saving Results, Final Lengths Calculation, and Visualization.

To run the code:

1. Ensure Google Drive is mounted, and paths are set correctly (if you run the code locally, please don't pay attention to the first two cells of the notebook).
2. Execute the notebook cells in order.

Needed files:
- `GA_Accidents_March23.csv`: Contains the ID of every accident and the corresponding information.
- `edges_matched_final.json`: A dictionary of roads and their list of accidents.
- `edges.csv`: The original file containing the length of road segments.

Obtained files:
- `estimated_nb_acc.csv`: Contains the estimated number of accidents for each road segment.
- `new_edges_dataset.csv`: Final dataset with calculated road lengths based on the safety index.

Notes: The code demonstrates the use of Facebook Prophet for time series analysis on road accident data. Various parameters and techniques, such as CPU boosting and safety index calculation, are applied for accurate predictions.

## Itinerary Planning

Code to launch a web app that allows the user to select a departure and arrival point on a map and computes one fastest itinerary and two safe itineraries. No specific installation is needed. To launch the web page, run:

```bash
python -m http.server
```

and open [http://localhost:8000/](http://localhost:8000/) (or the corresponding port displayed in the terminal).

Important note: Computation of an itinerary will not be possible since it requires two CSV files with the graph information (which is too heavy for GitHub).
