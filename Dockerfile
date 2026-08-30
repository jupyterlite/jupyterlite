# Starting from ubuntu latest version
FROM ubuntu:latest
# Update apt packages
RUN  apt-get update \
    && apt-get install -y wget \
    && rm -rf /var/lib/apt/lists/*
# Install miniconda
RUN mkdir -p ~/miniconda3 \
    && wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh \
    && bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3 \
    && rm -rf ~/miniconda3/miniconda.sh
# Initialise bash
RUN ~/miniconda3/bin/conda init bash
RUN ~/miniconda3/bin/conda init zsh
# Change working directory to code
WORKDIR /code
# Copy important files for installation
COPY .binder ./.binder
# Install & create the environment
RUN ~/miniconda3/bin/conda env update --file .binder/environment.yml
# Install other common software properties
RUN apt-get update && \
    apt-get install -y software-properties-common && \
    rm -rf /var/lib/apt/lists/*
# Install git 
RUN add-apt-repository ppa:git-core/ppa \
    && apt update \
    && apt install -y git
# Configure git name, email and branch ("PLEASE CHANGE ACCORDINGLY")
RUN git config --global user.name "YOUR NAME" \
    && git config --global user.email yourname@gmail.com \
    && git config --global init.defaultBranch main
# Building the docker file
# docker build -t jupyterlite-dev .
# docker run -it --rm -v $pwd/:/code jupyterlite-dev:1.4.0 bash 