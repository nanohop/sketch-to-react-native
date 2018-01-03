FROM tensorflow/tensorflow

RUN rm *.ipynb && \
    curl -sL https://deb.nodesource.com/setup_6.x | bash && \
    apt-get install nodejs libnss3 -y
ADD package.json .
RUN npm install

ADD . .
RUN npm link
