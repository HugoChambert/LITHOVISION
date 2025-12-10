import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
UPLOAD_DIR = "/app/uploads"
MODEL_DIR = "/app/models"

SAM_CHECKPOINT = os.path.join(MODEL_DIR, "sam_vit_h_4b8939.pth")
SAM_MODEL_TYPE = "vit_h"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
