# 指定基础镜像 从 node16 构建
FROM node:16
# 创建对应的文件夹，作为项目运行的位置
RUN mkdir -p /usr/src/app
# 指定工作区，后面的运行任何命令都是在这个工作区中完成的
WORKDIR /usr/src/app
# 从本地拷贝对应的文件 到 工作区
COPY server.js /usr/src/app/
# 告知当前Docker image 暴露的是 3000 端口
EXPOSE 3000
# 执行启动命令，一个 Dockerfile 只能有一个
CMD node server.js