FROM python:3.10

WORKDIR /usr/src/server
ADD requirements.txt .
# requirements.txtにリストされたパッケージをインストールする
RUN pip install --trusted-host pypi.python.org -r requirements.txt

RUN apt-get update \
    && apt-get install -y locales \
    && locale-gen ja_JP.UTF-8
ENV LANG ja_JP.UTF-8
ENV LANGUAGE ja_JP:ja
ENV LC_ALL=ja_JP.UTF-8
RUN localedef -f UTF-8 -i ja_JP ja_JP.utf8

# コンテナ起動後、FastAPIを実行し8000ポートで待機
CMD ["uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]