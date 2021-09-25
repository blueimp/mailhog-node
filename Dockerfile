FROM alpine:3.14

RUN apk --no-cache add \
  tini \
  nodejs \
  npm \
  && npm install -g \
  npm@latest \
  mocha@9 \
  # Clean up obsolete files:
  && rm -rf \
  /tmp/* \
  /root/.npm

USER nobody

WORKDIR /opt

COPY wait-for-hosts.sh /usr/local/bin/wait-for-hosts

ENTRYPOINT ["tini", "-g", "--", "wait-for-hosts", "--", "mocha"]
