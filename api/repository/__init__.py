# -*- coding: utf-8 -*-
"""DBアクセス層

- query   : SELECT のみ
- command : INSERT / UPDATE / DELETE

commit はここでは行わない。トランザクションの境界は usecase が決める。
"""
