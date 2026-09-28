import sys
import os
from huggingface_hub import HfApi

def main():
    if len(sys.argv) < 3:
        print("Usage: python upload_to_hf.py <repo_id> <token>")
        sys.exit(1)

    repo_id = sys.argv[1].strip()
    token = sys.argv[2].strip()

    print(f"Connecting to Hugging Face Space: {repo_id}...")
    api = HfApi(token=token)

    crawler_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "crawler"))

    print(f"Uploading files from {crawler_dir} to Space {repo_id}...")
    api.upload_folder(
        folder_path=crawler_dir,
        repo_id=repo_id,
        repo_type="space",
        ignore_patterns=[".venv/*", "__pycache__/*", "*.pyc", "*.pyo", "*.pyd", "profiles/*"]
    )
    print("UPLOAD THANH CONG! Hugging Face se bat dau build Docker.")

if __name__ == "__main__":
    main()
