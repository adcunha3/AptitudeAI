import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.pipeline import Pipeline
import pickle
import numpy as np

# Load and clean dataset
df = pd.read_csv('data.csv').dropna()

# Extract features (X) and labels (y)
features = df.drop('Class', axis=1)
labels = df['Class']

# Apply Min-Max scaling to the features
# scaler = MinMaxScaler(feature_range=(0, 1))
# scaled_features = scaler.fit_transform(features)

# Split the data into training and test sets
X_train, X_test, y_train, y_test = train_test_split(features, labels, test_size=0.2, random_state=42)

# Create and define the classifiers for grid search
log_reg = LogisticRegression(max_iter=6000)
rf_classifier = RandomForestClassifier()

# Define a pipeline with a classifier and scaler
pipeline = Pipeline([
    ('scaler', StandardScaler()),  # StandardScaler is used in the pipeline for further scaling
    ('classifier', log_reg)  # Placeholder, to be updated in GridSearchCV
])

# Define parameter grids for GridSearchCV
param_grid = [
    {
        'classifier': [log_reg],  # LogisticRegression with hyperparameters
        'classifier__C': [0.1, 1, 10],
    },
    {
        'classifier': [rf_classifier],  # RandomForest with hyperparameters
        'classifier__n_estimators': [50, 100],
        'classifier__max_depth': [5, 10, None]
    }
]

# Use GridSearchCV to find the best model and hyperparameters
grid_search = GridSearchCV(pipeline, param_grid, cv=5, n_jobs=-1)
grid_search.fit(X_train, y_train)

# Get the best model from grid search
best_model = grid_search.best_estimator_

# Evaluate the model
yhat = best_model.predict(X_test)
model_performance = classification_report(y_test, yhat)
print(f"Model Report: \n{model_performance}")

# Save the trained model
model_name = 'model.pkl'
with open(model_name, 'wb') as f:
    pickle.dump(best_model, f)
