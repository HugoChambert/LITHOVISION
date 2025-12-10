from celery import Celery
from app.config import REDIS_URL

celery_app = Celery(
    "stone_replacement",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.api.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,
    task_soft_time_limit=540,
)
