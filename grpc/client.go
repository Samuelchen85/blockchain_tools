package main

import (
	//"os/exec"
  "flag"
  "time"
  "fmt"
  "log"
  "io"

	"golang.org/x/net/context"
	"google.golang.org/grpc"

  pb "sam/nvm"
)

var (
  //serverAddr  = flag.String("server_addr", "107.155.52.114:11199", "GRPC client started")
  serverAddr  = flag.String("server_addr", "0.0.0.0:11199", "GRPC client started")

  timeInterval time.Duration = 1

  timeOut time.Duration = 10000

  MAX_COUNTER int32 = 100
)

func getFeature(ctx context.Context, client pb.NVMClient, counter int32){

  point := &pb.Point{Latitude: 2*counter, Longitude: -counter}

  feature, err := client.GetFeature(ctx, point)

  if err != nil {
    log.Println("Failed to get feature!")
  }

  log.Println(feature)

}

func getDeploySrc(ctx context.Context, client pb.NVMClient, counter int32){

  script_str := fmt.Sprintf("num %d script", counter)

  function_name := fmt.Sprintf("%d function name is still Same", counter)

  dr := &pb.DeployRequest{Script: script_str, Function: function_name}

  deploy_res, err := client.GetDeploySrc(ctx, dr)

  if err != nil {
    log.Println("Failed to get deploy source")
  }

  log.Println(deploy_res)

}

func exchangeData(ctx context.Context, client pb.NVMClient){
  
  stream, err := client.ExchangeData(ctx);

  if err != nil {
    log.Println("Failed to get exchange data stream")
  }

  //waitc := make(chan struct{})

  /*
  go func() {
    for i:=0; i<6; i++ {
      new_id := int64(999 + i)
      dp := &pb.DataPackage{Dpid:new_id, ServiceType:"Send from client", Source:"New source"}
      stream.Send(dp)
      log.Printf("Send request to server, with detail as follows:")
      log.Println(dp)
    }
    close(waitc)
    return
  }()
  */

  //go func(){
    /*
    for{
      in, err := stream.Recv()

      if err == io.EOF {
        close(waitc)
        return
      }

      if err != nil {
        log.Fatalf("Failed to receive from stream object from server")
        log.Println(err)
      }
      
      log.Printf("Go stream object from server: %ld, %s, %s", 
          in.GetDpid(), in.GetServiceType(), in.GetSource())
    }
    */

    dp := &pb.DataPackage{ Dpid:987654, ServiceType:"Initial request from client", Source:"client source"}
    new_err := stream.Send(dp); if new_err != nil {
      log.Println("Failed to send data package to server")
    }

    var counter int64 = 1
    for{
      in, err := stream.Recv()
      if err != nil {
        log.Fatal("Failed to receive data from server")
      }
      log.Println("Client received response: ", in)
      
      time.Sleep(1*time.Second)

      log.Println(">>>Start to send stream object to server!")
      dp := &pb.DataPackage{ Dpid:counter, ServiceType:"Send from client", Source:"client source"}
      new_err := stream.Send(dp); if new_err != nil {
        log.Println("Failed to send data package to server")
      }

      if counter > 3 {
        break
      }else{
        counter += 1
      }
    }

    //close(waitc)

  //}()

  stream.CloseSend()
  //<-waitc
}

func serverStream(ctx context.Context, client pb.NVMClient){

  dp := &pb.DataPackage{Dpid: 2, ServiceType: "response", Source: "Hey Sam!"}

  stream, err := client.ServerSendInfo(ctx, dp)

  if err != nil {

    log.Panic("Failed to send info to server");

  }

  log.Printf("Now is in server stream")

  for{

    log.Println("Now is checking if we can receive stream from server")

    dp, err := stream.Recv()

    if err == io.EOF{
      break
    }
    if err != nil{
      log.Fatal("failed to read from stream")
    }

    log.Println(dp)

  }
}

func serverSendInfo(ctx context.Context, client pb.NVMClient){

  dp := &pb.DataPackage{Dpid: 100, ServiceType: "ServerSendInfo", Source: "Script"}

  stream, err := client.ServerSendInfo(ctx, dp)

  if err != nil {
    log.Fatal("Failed to get server send info")
  }

  for {
    
    received_dp, err := stream.Recv()

    if err == io.EOF{
      break
    }
    if err != nil {
      log.Fatal("Failed to read from server stream")
    }

    log.Println(received_dp)
  }

  if err != nil{
    log.Fatal("Failed to receive stream object from server")
  }

}

func main(){

  // start the listener process firstly

  /*
  cmd := exec.Command("./listener", "")

  log.Println("started server process")

  err := cmd.Start()
  
  if err != nil {
    log.Fatal("Failed to start the server process")
  }

  time.Sleep(2*time.Second)
  */

  conn, err := grpc.Dial(*serverAddr, grpc.WithInsecure())
  if err != nil {
    fmt.Println("Failed to connect server, err is: ")
  }
  defer conn.Close()

  fmt.Println("Client is building from: " + *serverAddr)

  client := pb.NewNVMClient(conn)

  ctx, cancel := context.WithTimeout(context.Background(), timeOut*time.Second)

  defer cancel()

  var counter int32 = 0

  /*
  for counter < MAX_COUNTER {

    ss := fmt.Sprintf("\n[%d] send request: ", counter)

    fmt.Println(ss)

    getFeature(ctx, client, counter)

    getDeploySrc(ctx, client, counter)

    //time.Sleep(timeInterval*time.Second)

    counter += 1
  }
  */

  counter += 1

  //getFeature(ctx, client, counter)

  //getDeploySrc(ctx, client, counter)

  exchangeData(ctx, client)

  //serverStream(ctx, client)

  //serverSendInfo(ctx, client)

  /*
  point := &pb.Point{Latitude: 232333, Longitude: -6765554}
  //ft := &pb.Feature{name: "heyhey", location: point}

	feature, err := client.GetFeature(ctx, point)
	if err != nil {
		log.Fatalf("%v.GetFeatures(_) = _, %v: ", client, err)
	}
	log.Println(feature)
  */

}

