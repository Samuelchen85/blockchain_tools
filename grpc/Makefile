
CXX			= clang++
CXXFLAGS=-I. -O3 -std=c++14
LDFLAGS	=-lgrpc -lgrpc++ -lgrpc++_cronet -lgrpc++_error_details -lgrpc++_reflection -lgrpc++_unsecure -lgrpc_cronet -lgrpc_unsecure
SRC			= server.cc proto/nvm.pb.cc proto/nvm.grpc.pb.cc
OBJ			= $(SRC: .cc=.o)

all:server

server.o: server.cc
	$(CXX) $(CXXFLAGS) -c server.cc -o server.o
proto/nvm.pb.o: proto/nvm.pb.cc
	$(CXX) $(CXXFLAGS) -c proto/nvm.pb.cc -o proto/nvm.pb.o
proto/nvm.grpc.pb.o: proto/nvm.grpc.pb.cc
	$(CXX) $(CXXFLAGS) -c proto/nvm.grpc.pb.cc -o proto/nvm.grpc.pb.o

server: server.o proto/nvm.pb.o proto/nvm.grpc.pb.o 
	$(CXX) -o $@ $^ $(LDFLAGS)

rpc:
	protoc -I ./ --grpc_out=. --plugin=protoc-gen-grpc=`which grpc_cpp_plugin` ./proto/nvm.proto
	protoc -I ./ --cpp_out ./ ./proto/nvm.proto
	protoc --go_out=plugins=grpc:. proto/nvm.proto
	cp proto/nvm.pb.go ${HOME}/go/src/sam/nvm/

PHONY:
clean-compile:
	rm -rf *.o proto/*.o

clean:
	rm -rf *.o proto/*.o
	rm -rf proto/*.go
	rm -rf proto/*.cc proto/*.h
	rm server
