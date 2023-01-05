import json
from sentence_transformers import SentenceTransformer

data = json.load(open('../data/ecommerce.json'))
model = SentenceTransformer('all-MiniLM-L6-v2')

for product in data:
    print(product["name"])
    sentences = [f'{product["name"]}. {product["description"]}. {". ".join(product["categories"])}. {product["brand"]}']
    sentence_embeddings = model.encode(sentences)
    product['vectors'] = sentence_embeddings[0].tolist()

with open("../data/ecommerce-with-vectors.json", "w") as outfile:
    json.dump(data, outfile)
