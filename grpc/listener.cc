#include <algorithm>
#include <chrono>
#include <cmath>
#include <iostream>
#include <memory>
#include <string>

#include <grpc/grpc.h>
#include <grpcpp/server.h>
#include <grpcpp/server_builder.h>
#include <grpcpp/server_context.h>

#include "proto/nvm.pb.h"
#include "proto/nvm.grpc.pb.h"

class Engine final : public NVM::Service {

  public:
    explicit Engine(const std::string &msg){
      this->_msg = msg;
    }

    grpc::Status GetFeature(grpc::ServerContext* ctx, const Point* pt, Feature* ft){
      std::cout<<"Server function call: get feature!"<<std::endl;

      std::cout<<std::endl<<"The point latitude is: "<<pt->latitude()<<", longitude is: "<<pt->longitude()<<std::endl;
      ft->set_name("NVM Feature Name");
      ft->mutable_location()->CopyFrom(*pt);
      return grpc::Status::OK;
    }

    grpc::Status GetDeploySrc(grpc::ServerContext* ctx, const DeployRequest* dr, DeployResponse* drs){
      std::cout<<"Server function call: get deploy source!"<<std::endl;
      
      std::cout<<"The deploy request is: "<<dr->script()<<", function is: "<<dr->function()<<std::endl;
      drs->set_result("The result is successful!");
      drs->set_err_msg("The deploy msg is: " + this->_msg);
      return grpc::Status::OK;
    }

  private:
    std::string _msg;
};

void RunServer() {

  std::string server_address("127.0.0.1:11199");
  Engine service("Now start a new engine");

  grpc::ServerBuilder builder;
  builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
  builder.RegisterService(&service);
  std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
  std::cout << "Server listening on " << server_address << std::endl;

  server->Wait();
}

int main(int argc, char** argv) {

  RunServer();

  return 0;
}
