- to build docker image use command :
  docker build -t studzee-website .

- to run docker image use command :
  docker run -p 3000:3000 --env-file .env.local --name studzee studzee-website

- to stop docker image use command :
  docker stop studzee

- to remove docker image use command :
  docker rm studzee
