# -*- coding: utf-8 -*-
"""FastAPI メインアプリケーション"""

# 標準ライブラリ
import time

# サードパーティ
from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware

# ローカル
from system.api_router import api_router

app = FastAPI()
origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
    ],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


app.include_router(api_router)
