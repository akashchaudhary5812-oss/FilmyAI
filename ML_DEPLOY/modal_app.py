import modal

app = modal.App("filmyai-gpu-test")

image = modal.Image.debian_slim(python_version="3.11").pip_install("torch")


@app.function(image=image, gpu="L4", timeout=300)
def test_gpu():
    import torch

    return {
        "cuda_available": torch.cuda.is_available(),
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
    }


@app.local_entrypoint()
def main():
    print(test_gpu.remote())