import pickle

def load_pkl(path: str):
    with open(path, "rb") as f:
        return pickle.load(f)