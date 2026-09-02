# -*- coding: utf-8 -*-
"""業務ロジック層

- 業務ルールの判定と、それに伴うHTTPエラーの送出
- トランザクションの境界（commit / rollback）
- 複数のrepositoryの呼び出し
- 外部APIの参照

面（public / staff / admin / sysadmin）ごとにフォルダを分ける。
同じテーブルでも面によって守るべき業務ルールが違うため。
"""
