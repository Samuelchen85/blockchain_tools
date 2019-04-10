## Nebulas Mainnet 2.0 更新指南

*该文档涉及从星云主网1.0更新到2.0的详细步骤，供参考，默认操作系统是Linux。  
  

### 1. Check out最新主网代码
```shell
cd $GOPATH/src/github/com/nebulasio/go-nebulas
git pull origin mainnet
```

### 2. 编译环境配置
- 如果没有安装cmake或者cmake的版本低于3.12，需要先安装或者更新cmake
  ```bash
  # download cmake source code
  wget https://github.com/Kitware/CMake/archive/v3.12.0.tar.gz
  
  # build from source code
  tar -xvzf v3.12.0.tar.gz
  cd CMake-3.12.0
  ./bootstrap
  make
  
  # install cmake and related libraries
  make install
  ```
- 如果没有安装rocksdb或者rocksdb的版本低于5.18.3，需要先安装或者更新rocksdb
  - 首先安装rocksdb依赖库
    ubuntu用户
    ```bash
    apt-get update
    apt-get -y install build-essential libgflags-dev libsnappy-dev zlib1g-dev libbz2-dev liblz4-dev libzstd-dev
    ```
    centos用户
    ```bash
    yum -y install epel-release && yum -y update
    yum -y install gflags-devel snappy-devel zlib-devel bzip2-devel gcc-c++  libstdc++-devel
    ```
  - 下载并安装rocksdb
    ```bash
    git clone https://github.com/facebook/rocksdb.git
    cd rocksdb && make shared_lib && make install-shared
    ```

### 3. 编译NBRE和配置NVM
- 编译NBRE的依赖库文件(该步骤会比较耗时)
  ```bash
  cd $GOPATH/src/github/com/nebulasio/go-nebulas/nbre
  ./prepare.sh
  ```
- 编译NBRE
  ```bash
  source env.set.sh
  mkdir build
  cd build
  cmake -DRelease=1 ../
  make -j4
  ```
- 配置NVM依赖库
  ```bash
  cd $GOPATH/src/github/com/nebulasio/go-nebulas/nf/nvm
  wget http://develop-center.oss-cn-zhangjiakou.aliyuncs.com/setup/nvm/lib_nvm_Linux.tar.gz
  tar -xvzf lib_nvm_Linux.tar.gz
  mv lib_nvm_Linux native-lib
  ```

### 4. 编译neb
- 执行脚本`install-native-libs.sh`生成软链接并且设置环境变量
  ```bash
  cd $GOPATH/src/github/com/nebulasio/go-nebulas/
  source install-native-libs.sh
  ```
- 编译Neb
  ```bash
  make build
  ```

### 5. 启动Neb
```shell
./neb -c mainnet/conf/config.conf
```
如果提示找不到依赖库文件，则可能是环境变量设置过程出现问题。
```bash
vi ~/.bashrc
# 添加如下内容
export LD_LIBRARY_PATH=$GOPATH/src/github.com/nebulasio/go-nebulas/native-lib:$LD_LIBRARY_PATH
```
