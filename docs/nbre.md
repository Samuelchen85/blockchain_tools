#### Build From Scratch
- Build cmake (optional)  
  If cmake is not installed or the version is lower than 3.12, then you need to install a newer cmake
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
- Build Rocksdb (optional)  
  If rocksdb is not installed or the version is lower than 5.18, then you need to install rocksdb
  ```bash
  git clone https://github.com/facebook/rocksdb.git
  cd rocksdb && make shared_lib && make install-shared
  ```
- Compile NBRE
  ```bash
  cd $GOPATH/src/github.com/nebulasio/go-nebulas/nbre
  
  # build libraries by running the prepare script
  ./prepare.sh
  
  # set up environment variables
  source env.set.sh
  
  # build NBRE
  mkdir build
  cd build
  cmake -DRelease=1 ../
  make
  ```
- Setup NVM  
  download NVM dependent dynamic link libraries
  ```bash
  # For Linux
  wget http://develop-center.oss-cn-zhangjiakou.aliyuncs.com/setup/nvm/lib_nvm_Linux.tar.gz
  
  # For Mac
  wget https://develop-center.oss-cn-zhangjiakou.aliyuncs.com/setup/nvm/lib_nvm_Darwin.tar.gz
  
  # Decompress the package and move the libraries 
  ```

#### Compile NBRE




### Install RocksDB

* **OS X**:
* Install rocksdb via [Homebrew](https://brew.sh/)
```bash
brew install rocksdb
```

* **Linux - Ubuntu**
* Install Dependencies
```bash
apt-get update
apt-get -y install build-essential libgflags-dev libsnappy-dev zlib1g-dev libbz2-dev liblz4-dev libzstd-dev
```
* Install rocksdb by source code:
```bash
git clone https://github.com/facebook/rocksdb.git
cd rocksdb && make shared_lib && make install-shared
```

* **Linux - Centos**
* Install Dependencies
```bash
yum -y install epel-release && yum -y update
yum -y install gflags-devel snappy-devel zlib-devel bzip2-devel gcc-c++  libstdc++-devel
```
* Install rocksdb by source code:
```bash
git clone https://github.com/facebook/rocksdb.git
cd rocksdb && make shared_lib && make install-shared
```
