# 结构说明

1. connection：表示一个 ORM 到数据库的链接，这个链接不一定是一个底层的 TCP 链接，可能是一个链接池。
1. connection-manager：管理 ORM 链接，提供 cluster connection 功能。
1. decorator：用来声明式定义数据库 entity 的修饰器。
1. driver：ORM 使用的底层数据库 driver。
1. logger：ORM 使用的日志系统。
1. migration：数据库表迁移处理。
1. query-runner：实际调用底层数据库 driver 提供的查询操作的类，由 driver 进行创建。

# 设计说明

1. 对于系统中同一时间只能存在一个实例的类，我们在创建它的时候要采用 factory 这种方式。例如，logger 的实例同一时间我们在系统中只使用一种，那就使用 `loggerFactory()` 进行创建。
1. 对于系统中在同一时间，可以同时出现很多个、或者是设计上就是需要很多个实例并存的这种情况，建议采用 manager 这种方式。例如：Connection 的实例可以有多个同时存在，我们需要使用 `connection-manager` 的方式进行管理。
1. 不设计 ORM 层级的 cache 处理。因为我们没有提供抽象普遍操作的 entity repo，因此，依赖用户实现的 repo 具有非常大的不确定性，很难提供一个命中率较高的集中 cache。我们会在 APP 的 repository 层实现 cache 功能。
