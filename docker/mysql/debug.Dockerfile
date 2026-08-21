# FROM mariadb:10.8
FROM mysql

RUN apt-get update && apt-get install -y locales  
RUN sed -i -E 's/# (ja\_JP.UTF-8)/\\1/' /etc/locale.gen && locale-gen  
ENV LANG ja\_JP.UTF-8

COPY mysqld_charset.cnf /etc/mysql/conf.d/mysqld_charset.cnf