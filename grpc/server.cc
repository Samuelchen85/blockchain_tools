//#include <algorithm>
#include <chrono>
#include <cmath>
#include <iostream>
#include <memory>
#include <string>
#include <unistd.h>
#include <thread>

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

    grpc::Status GetFeature(grpc::ServerContext* ctx, const Point* pt, Feature* ft) override{
      std::cout<<"Server function call: get feature!"<<std::endl;

      std::cout<<std::endl<<"The point latitude is: "<<pt->latitude()<<", longitude is: "<<pt->longitude()<<std::endl;
      ft->set_name("NVM Feature Name");
      ft->mutable_location()->CopyFrom(*pt);
      return grpc::Status::OK;
    }

    grpc::Status GetDeploySrc(grpc::ServerContext* ctx, const DeployRequest* dr, DeployResponse* drs) override{
      std::cout<<"Server function call: get deploy source!"<<std::endl;
      
      std::cout<<"The deploy request is: "<<dr->script()<<", function is: "<<dr->function()<<std::endl;
      drs->set_result("The result is successful!");
      drs->set_err_msg("The deploy msg is: " + this->_msg);
      return grpc::Status::OK;
    }

    grpc::Status ExchangeData(grpc::ServerContext* ctx, grpc::ServerReaderWriter<DataPackageResponse, DataPackage>* stm) override {

      this->_stm = stm;

      std::vector<DataPackage> package_vec;

      //DataPackageResponse *resdp = new DataPackageResponse();
      //resdp->set_res(10001000);
      /*
      rdp.set_service_type("deploy_success");
      rdp.set_dpid(107);
      rdp.set_source("no source provided");
      */
      //stm->Write(*resdp);
      //std::cout<<std::endl<<"server sent an object to client"<<std::endl;


      DataPackage *rdp = new DataPackage();
      //bool res = stm->Read(rdp);

      int counter = 100;
      while(stm->Read(rdp)){
        std::cout<<"Hey"<<std::endl;

        std::cout<<"Server received an object: "<<rdp->service_type()<<", result is: "<<rdp->dpid()<<std::endl;
        
        usleep(2000000);
        
        std::cout<<"ha"<<std::endl;

        DataPackageResponse *resdp = new DataPackageResponse();
        resdp->set_res(counter);
        counter+=1;

        stm->Write(*resdp);
      }

      /*
      while(stm->Read(&dp)){
        if(dp.dpid() == 1 || dp.GetTypeName().compare("deploy") == 0){
          DataPackage rdp;
          rdp.set_service_type("deploy_success");
          rdp.set_dpid(3);
          rdp.set_source("no source provided");
          stm->Write(rdp);

          std::cout<<"Received deploy request"<<std::endl;

        }else if(dp.dpid() == 2 || dp.GetTypeName().compare("call") == 0){
          DataPackage rdp;
          rdp.set_service_type("call_success");
          rdp.set_dpid(3);
          rdp.set_source("no function provided");
          stm->Write(rdp);

          std::cout<<"Received call request"<<std::endl;

        }
        package_vec.push_back(dp);
      }
      */

      return grpc::Status::OK;
    }

    grpc::Status ServerSendInfo(grpc::ServerContext* ctx, DataPackage* dp, grpc::ServerWriter<DataPackage>* stm){
      
      std::cout<<"In function ServerSendINfo"<<std::endl;

      for(int i=0; i<3; i++){
        DataPackage dp;
        dp.set_dpid(i+1);
        dp.set_service_type("Deploy");
        dp.set_source("Server has no source yet");
        stm->Write(dp);
      }

      return grpc::Status::OK;
    }

    void SendRequest(){
      if(this->_stm != NULL){
        std::cout<<"HouHouHou"<<std::endl;

        DataPackageResponse *resdp = new DataPackageResponse();
        resdp->set_res(506070);
        this->_stm->Write(*resdp);
      }else{
        std::cout<<"Stream is not ready yet!!"<<std::endl;
      }
    }

  private:
    std::string _msg;

    grpc::ServerReaderWriter<DataPackageResponse, DataPackage>* _stm = NULL;
};

Engine* engine_instance;

void Callback(){
  unsigned int microseconds = 6000000;
  
  usleep(microseconds); 

  std::cout<<">>>Now is in callback"<<std::endl;

  engine_instance->SendRequest();
}

void RunServer() {

  std::string server_address("127.0.0.1:11199");
  Engine service("Now start a new engine");

  engine_instance = &service;

  grpc::ServerBuilder builder;
  builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
  builder.RegisterService(&service);
  std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
  std::cout << "Server listening on " << server_address << std::endl;

  server->Wait();
}

int main(int argc, char** argv) {

  std::thread callback(Callback);

  RunServer();

  return 0;
}
