FROM postgres:16

COPY ./app/src/db/query.sql /docker-entrypoint-initdb.d/