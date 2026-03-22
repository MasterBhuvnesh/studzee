# SYSTEM PROMPT
SYSTEM_PROMPT = """
You are an advanced assistant specialized in extracting and explaining information from provided PDF context.

Your task is to read the provided context and generate a response strictly in **valid JSON format**.

The JSON output MUST contain exactly three keys:

{
  "title": "A clear and concise title describing the topic based on the context",
  "content": "A detailed explanation written in Markdown format",
  "summary": "A concise 3–5 sentence summary covering the key ideas"
}

CONTENT GUIDELINES:

- The **title** should clearly represent the main topic from the provided context.
- The **content** must be written in Markdown and should:
  - Use headings (#, ##, ###) to organize sections
  - Highlight key terms using **bold**
  - Use bullet points or numbered lists when appropriate
  - Include code blocks if the topic involves programming
  - Include mathematical expressions using LaTeX , use LaTeX notation with $$ delimiters (e.g., $$E = mc^2$$)
  - For inline formulas, you may use $ delimiters (e.g., $x^2 + y^2 = z^2$)
  - Provide clear explanations and examples when helpful  
  - Provide THOROUGH, in-depth explanations of every concept mentioned
  - Break down complex ideas into digestible parts
  - Include real-world applications and examples
  - Connect concepts to show relationships and dependencies
  - Explain the 'why' behind formulas and methods, not just the 'what'
- The **summary** must briefly capture the main ideas in 3–5 sentences.

IMPORTANT RULES:

1. Return ONLY a valid JSON object.
2. Do NOT include any explanation outside the JSON.
3. The JSON must contain exactly these three keys: **title**, **content**, **summary**.
4. Do NOT add extra fields.
5. Ensure all strings are properly escaped so the JSON is valid.
6. Base the response only on the provided context.

"""

BUCKET = "studzee-faiss-embedding-aps1-az1--x-s3"
PREFIX = "faiss"

query  = """

# 1. Introduction to Unsupervised Learning

Machine learning algorithms are broadly divided into two categories:

1. **Supervised Learning**
2. **Unsupervised Learning**

In **supervised learning**, the dataset contains **labels** that indicate the expected output.

In **unsupervised learning**, the dataset **does not contain labels**, and the algorithm must discover patterns on its own.

### Definition

Unsupervised learning is a group of machine learning techniques used to **identify patterns, structures, or relationships in unlabeled data**.

The goal is to analyze the dataset and uncover meaningful insights without predefined outcomes.

### Common Unsupervised Learning Algorithms

Some commonly used unsupervised learning methods include:

* Clustering
* Neural networks (certain unsupervised variants)
* Anomaly detection

---

# 2. Real-World Example of Unsupervised Learning

A common real-world example is **Google News article grouping**.

Google News collects thousands of articles from different sources and automatically groups similar articles together.

### How does it work?

1. The system analyzes words and phrases in each article.
2. It calculates similarities between articles based on frequent terms.
3. Articles with similar word patterns are grouped together.

This grouping process uses **clustering**, which is a type of unsupervised learning.

---

# 3. Labeled vs Unlabeled Data

Understanding the difference between labeled and unlabeled data is essential.

### Unlabeled Data

Example dataset:

```
Point 1: (1,2)
Point 2: (2,2)
Point 3: (3,1)
```

These points only contain coordinates and no category information.

### Labeled Data

Example dataset:

```
Point 1: (1,2) -> Danger Zone
Point 2: (2,2) -> Normal Zone
Point 3: (3,1) -> Normal Zone
```

In labeled data, each datapoint already belongs to a known category.

Unsupervised learning works primarily with **unlabeled datasets**.

---

# 4. What is Clustering?

Clustering is one of the most widely used unsupervised learning techniques.

### Definition

Clustering is the process of **grouping data points with similar characteristics together**.

The main idea is:

* Points within the same cluster are **more similar to each other**
* Points from different clusters are **less similar**

A common way to measure similarity is **distance** between points in space.

For example, in a 2D coordinate plane:

* Points close together belong to the same cluster
* Points far apart belong to different clusters

---

# 5. Visualizing Data for Clustering

Clustering often starts with **visualizing data points**.

Example dataset representing hypothetical **Pokemon sightings**:

```python
from matplotlib import pyplot as plt

x_coordinates = [80, 93, 86, 98, 86, 9, 15, 3, 10, 20, 44, 56, 49, 62, 44]
y_coordinates = [87, 96, 95, 92, 92, 57, 49, 47, 59, 55, 25, 2, 10, 24, 10]

plt.scatter(x_coordinates, y_coordinates)
plt.show()
```

This scatter plot visualizes the distribution of points on a 2D plane.

When plotted, the points naturally form **groups**, which represent clusters.

---

# 6. What is a Cluster?

A cluster is simply:

> A group of items with similar characteristics.

### Examples of clusters

1. **Google News**

   * Articles with similar words appear in the same cluster.

2. **Customer segmentation**

   * Customers with similar purchasing behavior form a cluster.

Clustering helps identify hidden patterns in data.

---

# 7. Types of Clustering Algorithms

There are several clustering algorithms available.

The most common ones are:

### 1. Hierarchical Clustering

Creates a tree-like structure of clusters.

Clusters are formed by repeatedly merging or splitting groups based on similarity.

### 2. K-Means Clustering

One of the most popular clustering algorithms.

It divides the dataset into **K predefined clusters**.

### Other Clustering Algorithms

* DBSCAN
* Gaussian Mixture Models

Each algorithm has its own strengths and use cases.

---

# 8. Hierarchical Clustering in Python

Hierarchical clustering can be implemented using **SciPy**.

Example code:

```python
from scipy.cluster.hierarchy import linkage, fcluster
from matplotlib import pyplot as plt
import seaborn as sns
import pandas as pd

x_coordinates = [80.1,93.1,86.6,98.5,86.4,9.5,15.2,3.4,10.4,20.3,44.2,56.8,49.2,62.5,44.0]
y_coordinates = [87.2,96.1,95.6,92.4,92.4,57.7,49.4,47.3,59.1,55.5,25.6,2.1,10.9,24.1,10.3]

df = pd.DataFrame({
    'x_coordinate': x_coordinates,
    'y_coordinate': y_coordinates
})

Z = linkage(df, 'ward')

df['cluster_labels'] = fcluster(Z, 3, criterion='maxclust')

sns.scatterplot(
    x='x_coordinate',
    y='y_coordinate',
    hue='cluster_labels',
    data=df
)

plt.show()
```

This code:

1. Creates a dataset
2. Performs hierarchical clustering
3. Assigns cluster labels
4. Visualizes clusters on a scatter plot

---

# 9. K-Means Clustering in Python

K-Means clustering can also be implemented using SciPy.

Example:

```python
from scipy.cluster.vq import kmeans, vq
from matplotlib import pyplot as plt
import seaborn as sns
import pandas as pd
import random

random.seed((1000,2000))

x_coordinates = [80.1,93.1,86.6,98.5,86.4,9.5,15.2,3.4,10.4,20.3,44.2,56.8,49.2,62.5,44.0]
y_coordinates = [87.2,96.1,95.6,92.4,92.4,57.7,49.4,47.3,59.1,55.5,25.6,2.1,10.9,24.1,10.3]

df = pd.DataFrame({
    'x_coordinate': x_coordinates,
    'y_coordinate': y_coordinates
})

centroids, _ = kmeans(df, 3)

df['cluster_labels'], _ = vq(df, centroids)

sns.scatterplot(
    x='x_coordinate',
    y='y_coordinate',
    hue='cluster_labels',
    data=df
)

plt.show()
```

### How K-Means Works

1. Choose **K cluster centers (centroids)**
2. Assign each point to the nearest centroid
3. Recalculate centroid positions
4. Repeat until clusters stabilize

---

# 10. Data Preparation for Clustering

Before performing clustering, data preparation is essential.

### Why Data Preparation is Important

Real-world data often has issues such as:

1. Different measurement units

   * Example: product size in cm, price in dollars

2. Different value scales

   * Example: travel expenses vs cereal purchases

3. Dominance of one variable

   * Large-scale features can bias clustering results

To address these issues, we use **normalization**.

---

# 11. Data Normalization

Normalization rescales variables so that they have **comparable magnitudes**.

### Formula

```
x_new = x / std_dev(x)
```

This transforms data so its **standard deviation becomes 1**.

### Example in Python

```python
from scipy.cluster.vq import whiten

data = [5,1,3,3,2,3,3,8,1,2,2,3,5]

scaled_data = whiten(data)

print(scaled_data)
```

Output:

```
[2.73, 0.55, 1.64, 1.64, 1.09, 1.64, 1.64, 4.36, 0.55, 1.09, 1.09, 1.64, 2.73]
```

Normalization ensures that **all variables contribute equally** to clustering.

---

# 12. Visualizing Normalized Data

You can visualize the difference between original and scaled data.

Example:

```python
from matplotlib import pyplot as plt

plt.plot(data, label="original")
plt.plot(scaled_data, label="scaled")

plt.legend()
plt.show()
```

This plot compares the original data values with normalized values.

---

# Conclusion

Cluster analysis is an essential technique in unsupervised learning used to discover patterns in unlabeled datasets.

Key takeaways:

* Unsupervised learning works without labeled data.
* Clustering groups similar items together.
* Common clustering methods include:

  * Hierarchical clustering
  * K-Means clustering
* Data normalization is crucial for accurate clustering results.

Clustering has applications in many domains, including:

* News article grouping
* Customer segmentation
* Recommendation systems
* Anomaly detection

"""

import json
import datetime
import logging
import os
import boto3

from langchain_community.vectorstores import FAISS
from langchain_aws import BedrockEmbeddings, ChatBedrock
from langchain.agents import create_agent
from langchain_community.tools import DuckDuckGoSearchRun
from langchain.tools import tool

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')

BUCKET = "studzee-faiss-store"
PREFIX = "faiss"
BEDROCK_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"
BEDROCK_EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v2:0"
AWS_REGION = "us-east-1"


# ------------------ GLOBAL CACHE ------------------
vector_store = None
retriever = None

# ------------------ LOAD VECTOR STORE ------------------
def load_vector_store():
    global vector_store, retriever

    if vector_store is not None:
        return vector_store

    os.makedirs("/tmp/faiss", exist_ok=True)

    s3.download_file(BUCKET, f"{PREFIX}/index.faiss", "/tmp/faiss/index.faiss")
    s3.download_file(BUCKET, f"{PREFIX}/index.pkl", "/tmp/faiss/index.pkl")

    embeddings = BedrockEmbeddings(
        model_id=BEDROCK_EMBEDDING_MODEL_ID,
        region_name=AWS_REGION
    )

    vector_store = FAISS.load_local(
        "/tmp/faiss",
        embeddings,
        allow_dangerous_deserialization=True
    )

    retriever = vector_store.as_retriever(search_kwargs={"k": 5})

    return vector_store


# ------------------ TOOLS ------------------
@tool
def retrieve_context(query: str) -> str:
    """Search PDF documents and return relevant context for the query."""
    docs = retriever.invoke(query)
    return "\n\n---\n\n".join(d.page_content for d in docs)


search = DuckDuckGoSearchRun()

@tool
def web_search(query: str) -> str:
    """Search the web for latest information."""
    return search.invoke(query)


# ------------------ SYSTEM PROMPT ------------------
# SYSTEM_PROMPT 


# ------------------ LAMBDA HANDLER ------------------
def run(event, context):

    load_vector_store()  # IMPORTANT

    bedrock_llm = ChatBedrock(
        model_id=BEDROCK_MODEL_ID,
        region_name=AWS_REGION,
        model_kwargs={
            "max_tokens": 4000,
            "temperature": 0.4,
        }
    )

    agent = create_agent(
        model=bedrock_llm,
        tools=[retrieve_context, web_search],
        system_prompt=SYSTEM_PROMPT
    )

    user_query = event.get("query", "Gradient Descent")
    # user_query = query

    response = agent.invoke({
        "messages": [
            {"role": "user", "content": user_query}
        ]
    })

    return {
        "statusCode": 200,
        "body": response["messages"][-1].content
    }