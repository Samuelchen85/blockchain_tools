## Nebulas Mainnet 2.0 更新指南

*该文档涉及从星云主网1.0更新到2.0的详细步骤，供参考，默认操作系统是Linux。  
  

### 1. Check out最新主网代码
```shell
cd $GOPATH/src/github/com/nebulasio/go-nebulas
git pull origin mainnet
```

### 2. 编译NBRE和配置NVM
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

### 3. 编译NEB
- 执行脚本`install-native-libs.sh`生成软链接并且设置环境变量
  ```bash
  cd $GOPATH/src/github/com/nebulasio/go-nebulas/
  source install-native-libs.sh
  ```
- 编译NEB
  ```bash
  make build
  ```

### 4. 启动NEB
```bash
cd $GOPATH/src/github/com/nebulasio/go-nebulas/
./neb -c mainnet/conf/config.conf
```
如果提示找不到依赖库文件，则可能是环境变量设置过程出现问题。
```bash
vi ~/.bashrc
# 添加如下内容
export LD_LIBRARY_PATH=$GOPATH/src/github.com/nebulasio/go-nebulas/native-lib:$LD_LIBRARY_PATH
```
