import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, GridSearchCV
import pickle
import numpy as np

# Load and clean dataset
df = pd.read_csv('data.csv').dropna()
features = df.drop('Class', axis=1)
labels = df['Class']

# Split the data into training and test sets
X_train, X_test, y_train, y_test = train_test_split(features, labels, test_size=0.2, random_state=42)

# Create a pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression(max_iter=6000))  # Increased max_iter to 1000
])

# Define param grids for LogisticRegression and RandomForestClassifier
param_grid_lr = {
    'classifier': [LogisticRegression(max_iter=6000)],  # Increased max_iter to 1000
    'classifier__C': [0.1, 1, 10]
}

param_grid_rf = {
    'classifier': [RandomForestClassifier()],
    'classifier__n_estimators': [50, 100],
    'classifier__max_depth': [5, 10, None]
}

# Combine both grids for GridSearchCV
param_grid = [param_grid_lr, param_grid_rf]

# Use GridSearchCV to find the best model and hyperparameters
grid_search = GridSearchCV(pipeline, param_grid, cv=5, n_jobs=-1)
grid_search.fit(X_train, y_train)
best_model = grid_search.best_estimator_

# Evaluate the model
yhat = best_model.predict(X_test)
model_performance = classification_report(y_test, yhat)
print(f"Model Report: \n{model_performance}")

# Save the trained model
model_name = 'model.pkl'
with open(model_name, 'wb') as f:
    pickle.dump(best_model, f)
