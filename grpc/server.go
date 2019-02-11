package main

import (
	"io"
	"flag"
	"fmt"
	"net"
	"log"

	"golang.org/x/net/context"
	"google.golang.org/grpc"

  pb "sam/nvm"
)

var (
	port = flag.Int("port", 11199, "The server port")
)

type NVMServer struct{
}

func (n *NVMServer) GetFeature(ctx context.Context, pt *pb.Point) (*pb.Feature, error){
	log.Printf("Server function call: get feature func")

	log.Printf("The point latitude is: %ld, longitude is: %ld", pt.Latitude, pt.Longitude)

	new_pt := &pb.Point{Latitude: 102, Longitude: 203}

	new_ft := pb.Feature{Name:"New Feature", Location:new_pt}

	return &new_ft, nil
} 

func (n *NVMServer) ExchangeData(stream pb.NVM_ExchangeDataServer) error{
	log.Printf("Server function call: exchange data func")

	/*
	for {
		dp, err := stream.Recv()
		if err == io.EOF{
			break
		}
		if err != nil {
			log.Fatal("Failed to receive stream object from client")
		}
		log.Println(dp)
	}

	log.Printf("Receive stream object from client!")
	*/

	for i:=0; i<3; i++ {
		new_id := int64(100+i)
		dp := pb.DataPackage{Dpid: new_id, ServiceType: "Hey Sam", Source:"No Source"}
		err := stream.Send(&dp)
		if err != nil {
			break
		}

		if err == io.EOF{

		}
		log.Println(dp)
	}
	
	log.Printf("Send out stream object from server")

	return nil
}

func (n *NVMServer) GetDeploySrc(ctx context.Context, dr *pb.DeployRequest) (*pb.DeployResponse, error){
	new_dr := &pb.DeployResponse{}

	return new_dr, nil
}

func (n *NVMServer) ServerSendInfo(dp *pb.DataPackage, stm pb.NVM_ServerSendInfoServer) error {

	log.Printf("Now is in the function ServerSendInfo")

	for i:=0; i<5; i++{
		new_id := int64(500 + i)

		ndp := &pb.DataPackage{Dpid:new_id, ServiceType: "Server Stream", Source:"Source Script"}
		
		stm.Send(ndp)
	}

	return nil
}

func main(){
	flag.Parse()

	lis, err := net.Listen("tcp", fmt.Sprintf("0.0.0.0:%d", *port))

	if err != nil{
		log.Fatal("failed to listen: %v", err)
	}

	server := grpc.NewServer()

	pb.RegisterNVMServer(server, &NVMServer{})

	log.Printf("Server is listenning on port: ", fmt.Sprintf("0.0.0.0:%d", *port))

	server.Serve(lis)
}
