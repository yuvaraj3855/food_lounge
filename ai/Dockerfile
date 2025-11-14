FROM python:3.12.10-slim-bookworm

CMD ["python", "-m", "main"]

RUN pip install -U pip


COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
RUN apt-get update && apt-get install -y libsndfile1 ffmpeg sox

WORKDIR /root/app

COPY . .