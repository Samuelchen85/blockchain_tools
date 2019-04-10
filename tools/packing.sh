# Copyright (C) 2017-2019 go-nebulas authors
#
# This file is part of the go-nebulas library.
#
# the go-nebulas library is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# the go-nebulas library is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with the go-nebulas library.  If not, see <http://www.gnu.org/licenses/>.

#!/bin/bash

# usage: sh packing.sh
OS="$(uname -s)"

function warning(){
  if [ $1 == 'aliyun' ]; then
    echo "Install ossutil firstly before submitting to Aliyun!"
    echo "Check https://help.aliyun.com/document_detail/50452.html#h2-url-2"
  elif [ $1 == 'aws' ]; then
    echo "Install ossutil firstly before submitting to AWS!"
    echo "Check https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html"
  fi
}

function upload_nvm(){

  if ! [ -d $GOPATH/src/github.com/nebulasio/go-nebulas/nf/nvm/native-lib ]; then
     echo "No nvm directory found, exit!"
     return   
  fi

  pushd $GOPATH/src/github.com/nebulasio/go-nebulas/nf/nvm
  CUR_DIR=`pwd`
  if [ "$OS" = "Darwin" ]; then
    PACK_DIR="lib_nvm_Darwin"
  else
    PACK_DIR="lib_nvm_Linux"
  fi
  
  mv native-lib ${PACK_DIR}
  tar -cvzf ${PACK_DIR}.tar.gz ${PACK_DIR}
  mv ${PACK_DIR} native-lib

  echo "--- Start to upload to Aliyun ---"
  # send to aliyun
  if [ -x "$(command -v ossutil64)" ]; then
     ossutil64 cp oss://develop-center/setup/nvm/${PACK_DIR}.tar.gz oss://develop-center/setup/nvm/archive/${PACK_DIR}.tar.gz
     ossutil64 cp ${PACK_DIR}.tar.gz -r oss://develop-center/setup/nvm/
  elif [ -x "$(command -v ossutilmac64)" ]; then
     ossutilmac64 cp oss://develop-center/setup/nvm/${PACK_DIR}.tar.gz oss://develop-center/setup/nvm/archive/${PACK_DIR}.tar.gz
     ossutilmac64 cp ${PACK_DIR}.tar.gz -r oss://develop-center/setup/nvm/
  else
     warning "aliyun"
  fi

  echo "--- Start to upload to AWS S3 ---"
  # send to AWS S3
  if [ -x "$(command -v aws)" ]; then
     aws s3 mv s3://develop-center/setup/nvm/${PACK_DIR}.tar.gz s3://develop-center/setup/nvm/archive/
     aws s3 cp ${PACK_DIR}.tar.gz s3://develop-center/setup/nvm/ --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers 
  else
     warning "aws"
  fi

  popd
}

function upload_nbre(){

  if ! [ -d $GOPATH/src/github.com/nebulasio/go-nebulas/nbre ]; then
     echo "No nbre directory found, exit!"
     return   
  fi

  pushd $GOPATH/src/github.com/nebulasio/go-nebulas/nbre

  CUR_DIR=`pwd`
  CLANG_HEADER_DIR="clang/6.0.1"

  if [ "$OS" = "Darwin" ]; then
    PACK_DIR="lib_nbre_Darwin"
    DYLIB="*.dylib*"
  else
    PACK_DIR="lib_nbre_Linux"
    DYLIB="*.so*"
  fi

  rm -rf $CUR_DIR/$PACK_DIR
  mkdir -p $CUR_DIR/$PACK_DIR

  # copy lib files
  mkdir -p $CUR_DIR/$PACK_DIR/lib/lib
  cp -RP $CUR_DIR/lib/lib/$DYLIB $CUR_DIR/$PACK_DIR/lib/lib/
  cp -rf $CUR_DIR/lib/include $CUR_DIR/$PACK_DIR/lib/

  # copy bin file
  mkdir -p $CUR_DIR/$PACK_DIR/bin
  cp $CUR_DIR/bin/nbre $CUR_DIR/$PACK_DIR/bin/

  # copy llvm files
  mkdir -p $CUR_DIR/$PACK_DIR/lib_llvm/lib
  cp -RP $CUR_DIR/lib_llvm/lib/$DYLIB $CUR_DIR/$PACK_DIR/lib_llvm/lib/
  mkdir -p $CUR_DIR/$PACK_DIR/lib_llvm/lib/$CLANG_HEADER_DIR
  cp -rf $CUR_DIR/lib_llvm/lib/$CLANG_HEADER_DIR/include $CUR_DIR/$PACK_DIR/lib_llvm/lib/$CLANG_HEADER_DIR/
  mkdir -p $CUR_DIR/$PACK_DIR/lib_llvm/bin
  cp -rf $CUR_DIR/lib_llvm/bin/clang-6.0 $CUR_DIR/$PACK_DIR/lib_llvm/bin/
  pushd $CUR_DIR/$PACK_DIR/lib_llvm/bin
  ln -s clang-6.0 clang
  ln -s clang clang++
  ln -s clang clang-cpp
  ln -s clang clang-cl
  popd

  # generate tar package
  tar -cvzf ${PACK_DIR}.tar.gz $PACK_DIR

  echo "--- Start to upload to Aliyun ---"
  # send to aliyun
  if [ -x "$(command -v ossutil64)" ]; then
     if [ "$OS" == "Linux" ] && [ "$(lsb_release -rs)" == "18.04" ]; then
          ossutil64 rm oss://develop-center/setup/nbre/18.04/${PACK_DIR}.tar.gz
          ossutil64 cp ${PACK_DIR}.tar.gz -r oss://develop-center/setup/nbre/18.04/
     else
          ossutil64 cp oss://develop-center/setup/nbre/${PACK_DIR}.tar.gz oss://develop-center/setup/nbre/archive/${PACK_DIR}.tar.gz
          ossutil64 cp ${PACK_DIR}.tar.gz -r oss://develop-center/setup/nbre/
     fi
  elif [ -x "$(command -v ossutilmac64)" ]; then
          ossutilmac64 cp oss://develop-center/setup/nbre/${PACK_DIR}.tar.gz oss://develop-center/setup/nbre/archive/${PACK_DIR}.tar.gz
          ossutilmac64 cp ${PACK_DIR}.tar.gz -r oss://develop-center/setup/nbre/
  else
    echo "Install ossutil firstly before submitting to Aliyun!"
  fi

  echo "--- Start to upload to AWS S3 ---"
  # send to AWS S3
  if [ -x "$(command -v aws)" ]; then
     if [ "$OS" == "Linux" ] && [ "$(lsb_release -rs)" == "18.04" ]; then
        aws s3 rm s3://develop-center/setup/nbre/18.04/${PACK_DIR}.tar.gz
        aws s3 cp ${PACK_DIR}.tar.gz s3://develop-center/setup/nbre/18.04/ --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers 
     else
        aws s3 mv s3://develop-center/setup/nbre/${PACK_DIR}.tar.gz s3://develop-center/setup/nbre/archive
        aws s3 cp ${PACK_DIR}.tar.gz s3://develop-center/setup/nbre/ --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers 
     fi
  else
     echo "Install aws cli firstly before submitting to AWS S3!"
  fi

  popd
}

if [ $# != 1 ]; then
  echo "Usage: packing [nbre|nvm]"
  exit
else
  if [ $1 == "nbre" ]; then
    upload_nbre
  elif [ $1 == "nvm" ]; then
    upload_nvm
  fi
fi
