| Action              | Command                                                                        |
| ------------------- | ------------------------------------------------------------------------------ |
| Build Docker image  | `docker build -t studzee-website .`                                            |
| Run Docker image    | `docker run -p 3000:3000 --env-file .env.local --name studzee studzee-website` |
| Stop Docker image   | `docker stop studzee`                                                          |
| Remove Docker image | `docker rm studzee`                                                            |
