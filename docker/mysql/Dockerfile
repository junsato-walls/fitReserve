FROM mysql:8.0

ADD ./conf.d /etc/mysql/conf.d

RUN chmod 644 /etc/mysql/conf.d/my.cnf
# MySQLの操作ログのファイルを作成
# RUN touch /var/log/mysql/mysqld.log