# 星云链部署

### 1.环境及配置
#### 1.1 系统配置
- Ubuntu 16.04 LTS, X86_64, 8 core, 16G mem
- gcc 版本 > 5.4.0

#### 1.2 依赖工具安装
- golang (版本 >= 1.11)
  ```shell
  wget https://dl.google.com/go/go1.11.linux-amd64.tar.gz
  tar -C /usr/local -xzf go1.11.linux-amd64.tar.gz
  mkdir go_workspace
  export PATH=$PATH:/usr/local/go/bin
  export GOPATH=/path/to/go_workspace
  ```
- cmake (版本 >= 3.12)
  ```
  wget https://github.com/Kitware/CMake/archive/v3.12.0.tar.gz
  tar -xzf v3.12.0.tar.gz
  cd CMake-3.12.0
  ./configure
  make -j16
  make install
  ```

### 2.编译源码
#### 2.1 下载源代码
```shell
# 进入工作目录
mkdir -p $GOPATH/src/github.com/nebulasio
cd $GOPATH/src/github.com/nebulasio
# 下载源码
git clone https://github.com/nebulasio/go-nebulas.git
# 进入项目目录
cd go-nebulas
# 切换到最稳定的master分支
git checkout master
```
#### 2.2 编译NBRE
```shell
# 进入NBRE安装目录
cd $GOPATH/src/github.com/nebulasio/go-nebulas/nbre
# 安装NBRE的运行时依赖库
mkdir -p lib_llvm
./prepare.sh
# 设置环境变量
source env.set.sh
# 编译NBRE
mkdir build
cd build
cmake -DRelease=1 ../
make -j16
make install
```
请注意：
- 在执行prepare脚本之后，请确认下lib_llvm/bin下clang有没有生成。
- 确认lib/lib下有没有动态链接库生成，比如rocksdb的动态库、boost的动态库、protobuf的动态库等
- 执行`source env.set.sh`设置环境变量这一步是不可少的，否则nbre编译会有问题


#### 2.3 编译NEB
```shell
# 进入neb的工作目录
cd $GOPATH/src/github.com/nebulasio/go-nebulas
# 下载NVM依赖库，生成软链接，配置环境变量
source install-native-libs.sh
# 下载vendor依赖包
wget https://s3-us-west-1.amazonaws.com/develop-center/setup/vendor/vendor.tar.gz
tar -zxf vendor.tar.gz
make build
```

### 3.数据同步
星云主网数据大小在230G左右，从头开始同步耗时较长。可直接使用主网数据包(需要磁盘预留450G左右的空间)：
```
# 下载主网数据包，高度在218万左右
wget https://develop-center.oss-cn-zhangjiakou.aliyuncs.com/data/mainnet/data.db.tar.gz
tar -C $GOPATH/src/github.com/nebulasio/go-nebulas/mainnet -xvzf data.db.tar.gz
```

### 4.启动
主网的config文件使用mainnet/conf/config.conf即可
```shell
cd $GOPATH/src/github.com/nebulasio/go-nebulas
./neb -c mainnet/conf/config.conf
```
