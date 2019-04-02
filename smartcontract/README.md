投票智能合约第一版本：

使用规范：
1. 投票
- 支持任意多个投票场景，比如选举, 活动，技术选型之类的
- 合约创建者创建一个新的场景，创建场景时需指定场景的管理员
- 合约创建者或者场景管理员可以向场景中添加投票选项
- 用户投票时，需指定场景以及对应的一个或者多个选项

2. 查询
- 给定场景名称，用户可以查询给定地址是否参与了该场景的投票
- 场景管理员可以查看投票结果
- 场景管理员可以查看给定地址对应的投票结果
- 普通用户可查询任意地址是否参与了指定场景的投票

3. 权限
- 只有合约创建者可以添加新的场景
- 只有合约创建者或者场景管理员有权限添加投票选项
- 只有合约创建者或者场景管理员有权限删除选项
- 只有合约创建者或者场景管理员有权查看指定场景和指定地址对应的投票结果
- 只有合约创建者有权查看所有场景的投票结果
- 只有合约创建者有权删除一个场景

TODO:
- 创建场景时可以指定投票开始和结束时间