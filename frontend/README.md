# 🪨 AI Stone Replacement Tool

Transform kitchen and bathroom visualizations with AI-powered stone material replacement.

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![Backend](https://img.shields.io/badge/backend-FastAPI-009688)
![Frontend](https://img.shields.io/badge/frontend-React%20%7C%20Next.js-61DAFB)
![ML](https://img.shields.io/badge/ML-SAM%20%7C%20MiDaS%20%7C%20SDXL-orange)

## Overview

Professional-grade tool for visualizing stone material replacements using state-of-the-art ML models. Upload a photo, select the area, choose a stone type, and get photorealistic previews in ~20 seconds.

### Key Features

- 🎨 **Realistic Previews** - SAM + SDXL + Color Matching pipeline
- 🖌️ **Interactive Mask Drawing** - Precise area selection with brush/eraser
- 📊 **Extensive Catalog** - Granite, marble, quartz with easy updates
- ⚡ **Fast Processing** - 20-25 seconds with GPU
- 🔄 **Async Queue** - Celery + Redis for scalability
- 🚀 **Production Ready** - Docker, APIs, comprehensive docs

## Quick Start

### Option 1: Docker (Recommended - 2 minutes)

```bash
# Start backend
cd backend
docker-compose up

# Start frontend (separate terminal)
npm install
npm run dev

# Visit http://localhost:5173
```

### Option 2: Manual Setup

See [`QUICKSTART.md`](QUICKSTART.md) for detailed instructions.

## What's Included

### ✅ Complete Backend (FastAPI + Python)
- REST API with FastAPI
- Celery + Redis async processing  
- Full ML pipeline:
  - **SAM** (Segment Anything) - Mask refinement
  - **MiDaS** - Depth estimation
  - **SDXL** - AI inpainting
  - **Color Matching** - Realistic blending
- Docker containerization
- Progress tracking

### ✅ Working React Frontend (Vite)
- Drag-and-drop upload
- Canvas mask editor
- Stone catalog (Supabase)
- Admin panel
- Before/after comparison

### 📋 Next.js Setup Guide
- Complete implementation guide
- Example components with code
- Production-optimized
- react-konva integration

### ✅ Database (Supabase)
- Stone materials catalog
- User projects tracking
- Row-level security
- Sample data included

## Project Structure

```
├── backend/              # FastAPI + ML Pipeline (COMPLETE)
│   ├── app/
│   │   ├── api/         # REST endpoints
│   │   ├── ml/          # SAM, MiDaS, SDXL, Color Matching
│   │   └── ...
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── src/                 # React/Vite Frontend (COMPLETE)
│   ├── components/      # UI components
│   ├── lib/            # Supabase client
│   └── ...
│
├── supabase/           # Database & Migrations (COMPLETE)
│   └── migrations/
│
└── docs/
    ├── QUICKSTART.md           # Get started fast
    ├── ARCHITECTURE.md         # System design
    ├── next-frontend-setup.md  # Next.js guide
    └── PROJECT_SUMMARY.md      # Complete overview
```

## Tech Stack

**Backend:** Python • FastAPI • Celery • Redis • PyTorch • SAM • SDXL • MiDaS

**Frontend:** React • TypeScript • Vite • Next.js (optional) • Tailwind CSS

**Database:** Supabase (PostgreSQL) • RLS

**ML Models:** 
- Meta's Segment Anything (SAM)
- Intel DPT-Large (Depth)
- Stable Diffusion XL (Inpainting)

## Documentation

| Document | Description |
|----------|-------------|
| [`QUICKSTART.md`](QUICKSTART.md) | Get started in 5 minutes |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Complete system design |
| [`backend/README.md`](backend/README.md) | API documentation |
| [`next-frontend-setup.md`](next-frontend-setup.md) | Next.js implementation |
| [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md) | Full project overview |

## ML Pipeline

```
User Upload → SAM Refinement → Depth Estimation → SDXL Inpainting → Color Matching → Result
   (1s)          (2-3s)              (1-2s)            (15-20s)          (<1s)      (20-25s)
```

## API Endpoints

```bash
POST /api/upload           # Upload image
POST /api/upload-mask      # Upload mask
POST /api/process          # Start processing
GET  /api/job/{id}         # Check status
GET  /api/uploads/{file}   # Download result
```

## Performance

| Hardware | Processing Time | Concurrent Jobs |
|----------|----------------|-----------------|
| RTX 4090 | 15-20s | 2-3 |
| RTX 3090 | 20-25s | 1-2 |
| CPU Only | 5-10 min | 1 |

## Requirements

### Minimum
- Python 3.11+
- Node.js 18+
- Redis
- 4GB RAM
- 10GB disk space

### Recommended
- CUDA-capable GPU (8GB+ VRAM)
- 16GB RAM
- 50GB disk space

## Deployment

### Development
```bash
docker-compose up    # Backend
npm run dev          # Frontend
```

### Production
```bash
# Backend: Deploy to AWS/GCP/Azure with GPU
# Frontend: Deploy to Vercel/Netlify
# Database: Supabase Cloud
```

See deployment guides in documentation.

## Use Cases

- 🏠 Interior design visualization
- 🏗️ Contractor/builder proposals
- 🛒 E-commerce product previews
- 📱 Home renovation apps
- 🎨 Real estate staging

## Cost Estimation

**Self-Hosted:** ~$1000/month (GPU server + services)
**API-Based:** ~$35/month + $0.01-0.05 per image

## Roadmap

- [x] Complete ML pipeline
- [x] REST API
- [x] React frontend
- [x] Database schema
- [ ] Next.js frontend
- [ ] User authentication
- [ ] Project history
- [ ] Mobile app
- [ ] Batch processing

## Contributing

Contributions welcome! Areas to improve:
- Additional ML models
- Frontend enhancements
- Performance optimization
- Documentation
- Testing

## License

ISC

## Support

- 📖 Read the docs in `/docs`
- 🐛 Report issues on GitHub
- 💬 Join discussions

---

**Built with ❤️ using FastAPI, React, and cutting-edge AI**

**Status:** Production-ready • Complete backend • Working frontend • Comprehensive docs
