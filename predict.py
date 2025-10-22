import torch
import torch.nn as nn
import timm
from torchvision import transforms
from PIL import Image
import rasterio
import numpy as np

# ============================================================
# MODEL DEFINITION
# ============================================================
class SWIRPatchEmbedding(nn.Module):
    def __init__(self, img_size=224, patch_size=16, in_channels=1, embed_dim=768):
        super().__init__()
        self.projection = nn.Conv2d(in_channels, embed_dim, kernel_size=patch_size, stride=patch_size)
    
    def forward(self, x):
        x = self.projection(x)
        x = x.flatten(2).transpose(1, 2)
        return x

class SWIRViT(nn.Module):
    def __init__(self):
        super().__init__()
        self.model = timm.create_model('deit_base_patch16_224', pretrained=False, num_classes=2)
        self.model.patch_embed = SWIRPatchEmbedding(224, 16, 1, 768)
    
    def forward(self, x):
        return self.model(x)

# ============================================================
# LOAD MODEL
# ============================================================
def load_model(checkpoint_path):
    """Load trained model"""
    model = SWIRViT()
    checkpoint = torch.load(checkpoint_path, map_location='cpu')
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    print(f"✅ Model loaded! Epoch: {checkpoint['epoch']}, Val Acc: {checkpoint.get('val_acc', 'N/A')}%")
    return model

# ============================================================
# LOAD IMAGE
# ============================================================
def load_image(image_path):
    """Load and preprocess image"""
    try:
        with rasterio.open(image_path) as src:
            image = src.read(1).astype(np.float32)
    except:
        image = np.array(Image.open(image_path).convert('L')).astype(np.float32)
    
    # Normalize
    if image.max() > image.min():
        image = ((image - image.min()) / (image.max() - image.min()) * 255).astype(np.uint8)
    else:
        image = np.full_like(image, 128, dtype=np.uint8)
    
    image = Image.fromarray(image, mode='L')
    
    # Transform
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5], std=[0.5])
    ])
    
    return transform(image).unsqueeze(0)

# ============================================================
# PREDICT
# ============================================================
def predict(model, image_path):
    """Predict on image"""
    image = load_image(image_path)
    
    with torch.no_grad():
        output = model(image)
        probs = torch.softmax(output, dim=1)
        pred = output.argmax(1).item()
    
    classes = ['Fire', 'NeitherFireNorSmoke']
    
    print("\n" + "="*60)
    print("🔥 PREDICTION RESULTS")
    print("="*60)
    print(f"\nImage: {image_path}")
    print(f"Prediction: {classes[pred]}")
    print(f"\nConfidence Scores:")
    print(f"  Fire:    {probs[0, 0].item()*100:.2f}%")
    print(f"  Neither: {probs[0, 1].item()*100:.2f}%")
    
    if pred == 0:
        print(f"\n🚨 ALERT: FIRE DETECTED!")
    else:
        print(f"\n✅ No fire detected")
    print("="*60 + "\n")
    
    return pred, probs

# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path>")
        print("Example: python predict.py test_image.tif")
        sys.exit(1)
    
    # Paths
    model_path = "/Users/yashpratapsingh/Desktop/SWIR-Inference/models/best_model.pth"
    image_path = sys.argv[1]
    
    # Load model
    print("Loading model...")
    model = load_model(model_path)
    
    # Predict
    predict(model, image_path)
