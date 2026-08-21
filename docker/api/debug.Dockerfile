FROM python:3.10

RUN apt update -y

ADD requirements.txt .
# requirements.txtにリストされたパッケージをインストールする
RUN pip install --trusted-host pypi.python.org -r requirements.txt
RUN apt-get install build-essential
RUN pip install python-multipart
RUN pip install debugpy

WORKDIR /sample/app

EXPOSE 8000

# FastAPIを8080ポートで待機
CMD ["python3", "-m", "debugpy", "--listen", "0.0.0.0:5678", "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8080"]