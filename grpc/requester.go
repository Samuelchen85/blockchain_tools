package main

import (
  "flag"
  "time"
  "fmt"
	"log"

	"golang.org/x/net/context"
	"google.golang.org/grpc"

  pb "sam/nvm"
)

var (
  serverAddr  = flag.String("server_addr", "107.155.52.114:11199", "GRPC client started")

  timeInterval time.Duration = 3

  timeOut time.Duration = 100
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

func main(){

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

  for counter < 20 {

    ss := fmt.Sprintf("\n[%d] send request: ", counter)

    fmt.Println(ss)

    getFeature(ctx, client, counter)

    getDeploySrc(ctx, client, counter)

    time.Sleep(timeInterval*time.Second)

    counter += 1
  }

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

